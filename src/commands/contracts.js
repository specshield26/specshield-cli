'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fsExtra = require('fs-extra');
const logger = require('../utils/logger');
const { getStoredApiKey } = require('../config/localConfig');
const {
  publishContract,
  listContracts,
  getLatestContract,
  verifyContract,
  getVerificationHistory,
  canIDeploy,
} = require('../api/contractsClient');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function resolveApiToken(opts) {
  return opts.apiToken || process.env.SPECSHIELD_API_KEY || (await getStoredApiKey()) || null;
}

function requireToken(token) {
  if (!token) {
    logger.error('No API token found. Pass --api-token, set SPECSHIELD_API_KEY, or run: specshield login --api-key <KEY>');
    process.exit(2);
  }
}

function fmtDate(iso) {
  if (!iso) return chalk.gray('—');
  try {
    return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');
  } catch { return iso; }
}

function statusBadge(status) {
  if (!status) return chalk.gray('—');
  const s = String(status).toUpperCase();
  if (s === 'PUBLISHED')  return chalk.green(s);
  if (s === 'DEPRECATED') return chalk.yellow(s);
  return chalk.gray(s);
}

function verifyBadge(status) {
  if (!status) return chalk.gray('—');
  const s = String(status).toUpperCase();
  if (s === 'SUCCESS') return chalk.green(s);
  if (s === 'FAILED')  return chalk.red(s);
  if (s === 'PENDING') return chalk.yellow(s);
  return chalk.gray(s);
}

function hr() {
  return chalk.gray('  ─────────────────────────────────────────────────────');
}

/** Simple padded column table */
function printTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => stripAnsi(String(r[i] ?? '')).length))
  );
  const headerLine = headers.map((h, i) => chalk.bold(h.padEnd(widths[i]))).join('  ');
  process.stdout.write('\n  ' + headerLine + '\n');
  process.stdout.write('  ' + widths.map(w => '─'.repeat(w)).join('  ') + '\n');
  for (const row of rows) {
    const line = row.map((cell, i) => {
      const raw = String(cell ?? '');
      const pad = widths[i] - stripAnsi(raw).length;
      return raw + ' '.repeat(Math.max(0, pad));
    }).join('  ');
    process.stdout.write('  ' + line + '\n');
  }
  process.stdout.write('\n');
}

/** Strip ANSI escape codes for length measurement */
function stripAnsi(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// ─── Publish ─────────────────────────────────────────────────────────────────

const publishCommand = new Command('publish')
  .description('Publish a consumer contract to the registry')
  .requiredOption('--file <path>', 'Path to contract JSON file')
  .option('--org <key>', 'Organization key (overrides file value)')
  .option('--consumer <key>', 'Consumer service key (overrides file value)')
  .option('--provider <key>', 'Provider service key (overrides file value)')
  .option('--consumer-version <ver>', 'Consumer version tag')
  .option('--contract-name <name>', 'Contract name (overrides file value)')
  .option('--tag <tag>', 'Tag / git branch')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token (overrides env / stored config)')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    // Read and validate file
    const filePath = path.resolve(opts.file);
    if (!(await fsExtra.pathExists(filePath))) {
      logger.error(`Contract file not found: ${filePath}`);
      process.exit(2);
    }

    let contractDoc;
    try {
      const raw = await fsExtra.readFile(filePath, 'utf8');
      contractDoc = JSON.parse(raw);
    } catch (err) {
      logger.error(`Invalid JSON in contract file: ${err.message}`);
      process.exit(2);
    }

    // Basic schema validation
    if (!contractDoc.interactions || !Array.isArray(contractDoc.interactions)) {
      logger.error('Contract file must have an "interactions" array.');
      process.exit(2);
    }

    // Resolve metadata (CLI flags override file values)
    const orgKey        = opts.org          || contractDoc.orgKey          || contractDoc.org;
    const consumerKey   = opts.consumer     || contractDoc.consumer?.name;
    const providerKey   = opts.provider     || contractDoc.provider?.name;
    const contractName  = opts.contractName || contractDoc.contractName;
    const contractType  = contractDoc.contractType || 'HTTP';

    const missing = [];
    if (!orgKey)       missing.push('--org (or "org" in contract file)');
    if (!consumerKey)  missing.push('--consumer (or consumer.name in contract file)');
    if (!providerKey)  missing.push('--provider (or provider.name in contract file)');
    if (!contractName) missing.push('--contract-name (or contractName in contract file)');
    if (missing.length) {
      logger.error(`Missing required fields:\n    ${missing.join('\n    ')}`);
      process.exit(2);
    }

    const spinner = ora('Publishing contract...').start();

    try {
      const result = await publishContract(opts.server, token, {
        orgKey,
        consumerServiceKey: consumerKey,
        providerServiceKey: providerKey,
        consumerVersion:    opts.consumerVersion || contractDoc.consumer?.version || null,
        contractName,
        contractType,
        gitBranch:          opts.tag || null,
        verifierName:       'specshield-cli',
        contentJson:        contractDoc,
      });
      spinner.stop();

      process.stdout.write('\n');
      process.stdout.write(chalk.green.bold('  ✔  Contract Published Successfully') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Contract ID     : ${chalk.cyan(result.contractId)}\n`);
      process.stdout.write(`  Contract Name   : ${chalk.white(contractName)}\n`);
      process.stdout.write(`  Consumer        : ${consumerKey}\n`);
      process.stdout.write(`  Provider        : ${providerKey}\n`);
      process.stdout.write(`  Version         : ${chalk.cyan(result.contractVersion)}\n`);
      process.stdout.write(`  Status          : ${statusBadge(result.status)}\n`);
      if (result.contentHash) {
        process.stdout.write(`  Content Hash    : ${chalk.gray(result.contentHash.substring(0, 16) + '...')}\n`);
      }
      process.stdout.write(`  Published At    : ${fmtDate(result.publishedAt)}\n`);
      process.stdout.write('\n');
      process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts verify --contract-id ${result.contractId} --base-url <URL>\n`));
      process.stdout.write('\n');
    } catch (err) {
      spinner.fail('Publish failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── List ─────────────────────────────────────────────────────────────────────

const listCommand = new Command('list')
  .description('List contracts in the registry')
  .option('--consumer <key>', 'Filter by consumer service key')
  .option('--provider <key>', 'Filter by provider service key')
  .option('--org <key>', 'Filter by organization key')
  .option('--status <status>', 'Filter by status (PUBLISHED | DEPRECATED)')
  .option('--contract-name <name>', 'Filter by contract name')
  .option('--page <n>', 'Page number (0-based)', '0')
  .option('--size <n>', 'Page size', '20')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching contracts...').start();

    try {
      const page = await listContracts(opts.server, token, {
        org:          opts.org,
        consumer:     opts.consumer,
        provider:     opts.provider,
        contractName: opts.contractName,
        status:       opts.status,
        page:         parseInt(opts.page, 10) || 0,
        size:         parseInt(opts.size, 10)  || 20,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(page, null, 2) + '\n');
        return;
      }

      const items = page.content || [];
      const total = page.totalElements ?? items.length;

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  SpecShield Contract Registry') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Showing ${items.length} of ${total} contracts\n`);

      if (items.length === 0) {
        process.stdout.write(chalk.gray('\n  No contracts found matching filters.\n\n'));
        return;
      }

      printTable(
        ['ID', 'Contract Name', 'Consumer', 'Provider', 'Ver', 'Status', 'Last Verify', 'Published'],
        items.map(c => [
          chalk.cyan(String(c.contractId)),
          c.contractName,
          c.consumerServiceKey,
          c.providerServiceKey,
          c.contractVersion,
          statusBadge(c.status),
          verifyBadge(c.lastVerificationStatus),
          fmtDate(c.publishedAt),
        ])
      );

      if (page.totalPages > 1) {
        const cur = (page.number ?? 0) + 1;
        process.stdout.write(chalk.gray(`  Page ${cur} of ${page.totalPages}  ·  Use --page and --size to navigate\n\n`));
      }
    } catch (err) {
      if (spinner) spinner.fail('List failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── Latest ───────────────────────────────────────────────────────────────────

const latestCommand = new Command('latest')
  .description('Get the latest version of a contract')
  .option('--consumer <key>', 'Consumer service key')
  .option('--provider <key>', 'Provider service key')
  .option('--org <key>', 'Organization key')
  .option('--contract-name <name>', 'Contract name')
  .option('--json', 'Print full contract JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching latest contract...').start();

    try {
      const c = await getLatestContract(opts.server, token, {
        org:          opts.org,
        consumer:     opts.consumer,
        provider:     opts.provider,
        contractName: opts.contractName,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(c, null, 2) + '\n');
        return;
      }

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  Latest Contract') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Contract ID     : ${chalk.cyan(c.contractId)}\n`);
      process.stdout.write(`  Contract Name   : ${chalk.white(c.contractName)}\n`);
      process.stdout.write(`  Consumer        : ${c.consumerServiceKey}\n`);
      process.stdout.write(`  Provider        : ${c.providerServiceKey}\n`);
      process.stdout.write(`  Version         : ${chalk.cyan(c.contractVersion)}\n`);
      process.stdout.write(`  Type            : ${c.contractType || '—'}\n`);
      process.stdout.write(`  Status          : ${statusBadge(c.status)}\n`);
      if (c.contentHash) {
        process.stdout.write(`  Content Hash    : ${chalk.gray(c.contentHash.substring(0, 16) + '...')}\n`);
      }
      process.stdout.write(`  Published At    : ${fmtDate(c.publishedAt)}\n`);

      if (c.verificationHistory && c.verificationHistory.length) {
        const last = c.verificationHistory[0];
        process.stdout.write('\n');
        process.stdout.write(chalk.bold('  Last Verification') + '\n');
        process.stdout.write(hr() + '\n');
        process.stdout.write(`  Verification ID : ${chalk.cyan(last.verificationId)}\n`);
        process.stdout.write(`  Status          : ${verifyBadge(last.verificationStatus)}\n`);
        process.stdout.write(`  Environment     : ${last.environment || '—'}\n`);
        process.stdout.write(`  Provider Ver    : ${last.providerVersion || '—'}\n`);
        process.stdout.write(`  Completed At    : ${fmtDate(last.completedAt)}\n`);
      }

      process.stdout.write('\n');
      process.stdout.write(chalk.gray(`  ➜  Use --json to see full contract content\n`));
      process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts verify --contract-id ${c.contractId} --base-url <URL>\n`));
      process.stdout.write('\n');
    } catch (err) {
      if (spinner) spinner.fail('Fetch failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── Verify ───────────────────────────────────────────────────────────────────

const verifyCommand = new Command('verify')
  .description('Verify a contract against a live provider')
  .requiredOption('--contract-id <id>', 'Contract ID to verify')
  .requiredOption('--base-url <url>', 'Provider base URL (e.g. http://localhost:8080)')
  .option('--provider-version <ver>', 'Provider version tag')
  .option('--env <environment>', 'Environment label (e.g. staging, qa)')
  .option('--mode <mode>', 'Verification mode: LIVE | REPLAY', 'LIVE')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    // Validate base URL
    try { new URL(opts.baseUrl); } catch {
      logger.error(`Invalid base URL: ${opts.baseUrl}`);
      process.exit(2);
    }

    const contractId = parseInt(opts.contractId, 10);
    if (isNaN(contractId)) {
      logger.error('--contract-id must be a number');
      process.exit(2);
    }

    const spinner = opts.json ? null : ora(`Verifying contract ${contractId}...`).start();

    try {
      const result = await verifyContract(opts.server, token, contractId, {
        baseUrl:         opts.baseUrl.replace(/\/$/, ''),
        providerVersion: opts.providerVersion || null,
        verificationMode: opts.mode || 'LIVE',
        environment:     opts.env || null,
        verifierName:    'specshield-cli',
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }

      const summary   = result.summary || {};
      const total     = summary.total   ?? 0;
      const passed    = summary.passed  ?? 0;
      const failed    = summary.failed  ?? 0;
      const mismatches = result.mismatches || [];
      const success   = result.verificationStatus === 'SUCCESS';

      process.stdout.write('\n');
      if (success) {
        process.stdout.write(chalk.green.bold(`  ✔  Verification PASSED`) + chalk.gray(`  (${passed}/${total} interactions)\n`));
      } else {
        process.stdout.write(chalk.red.bold(`  ✖  Verification FAILED`) + chalk.gray(`  (${passed}/${total} interactions passed, ${failed} failed)\n`));
      }
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Verification ID : ${chalk.cyan(result.verificationId)}\n`);
      process.stdout.write(`  Contract ID     : ${chalk.cyan(contractId)}\n`);
      process.stdout.write(`  Status          : ${verifyBadge(result.verificationStatus)}\n`);
      process.stdout.write(`  Started At      : ${fmtDate(result.startedAt)}\n`);
      process.stdout.write(`  Completed At    : ${fmtDate(result.completedAt)}\n`);

      if (mismatches.length > 0) {
        process.stdout.write('\n');
        process.stdout.write(chalk.red.bold('  Mismatches') + '\n');
        process.stdout.write(hr() + '\n');
        for (const m of mismatches) {
          process.stdout.write(`  ${chalk.red('●')} ${chalk.bold('[' + (m.interactionKey || '?') + ']')} ${chalk.yellow(m.mismatchType)} at ${chalk.gray(m.path || '$')}\n`);
          if (m.expectedValue !== null && m.expectedValue !== undefined) {
            process.stdout.write(`    ${chalk.gray('expected:')} ${chalk.green(m.expectedValue)}  ${chalk.gray('→')}  ${chalk.red(m.actualValue ?? 'null')}\n`);
          }
          process.stdout.write(`    ${chalk.gray(m.message || '')}\n`);
        }
        process.stdout.write('\n');
      }

      if (success) {
        process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts can-i-deploy --provider <NAME> --version <VER>\n`));
      } else {
        process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts history --contract-id ${contractId} to inspect past runs\n`));
      }
      process.stdout.write('\n');

      process.exit(success ? 0 : 1);
    } catch (err) {
      if (spinner) spinner.fail('Verification failed');
      logger.error(err.message);
      process.exit(2);
    }
  });

// ─── History ──────────────────────────────────────────────────────────────────

const historyCommand = new Command('history')
  .description('Show verification history for a contract')
  .requiredOption('--contract-id <id>', 'Contract ID')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const contractId = parseInt(opts.contractId, 10);
    if (isNaN(contractId)) {
      logger.error('--contract-id must be a number');
      process.exit(2);
    }

    const spinner = opts.json ? null : ora('Fetching verification history...').start();

    try {
      const history = await getVerificationHistory(opts.server, token, contractId);
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(history, null, 2) + '\n');
        return;
      }

      const items = Array.isArray(history) ? history : (history.content || []);

      process.stdout.write('\n');
      process.stdout.write(chalk.bold(`  Verification History — Contract ${contractId}`) + '\n');
      process.stdout.write(hr() + '\n');

      if (items.length === 0) {
        process.stdout.write(chalk.gray('\n  No verifications found for this contract.\n\n'));
        return;
      }

      printTable(
        ['ID', 'Status', 'Environment', 'Provider Version', 'Mode', 'Completed At'],
        items.map(v => [
          chalk.cyan(String(v.verificationId ?? v.id ?? '—')),
          verifyBadge(v.verificationStatus),
          v.environment || '—',
          v.providerVersion || '—',
          v.verificationMode || '—',
          fmtDate(v.completedAt),
        ])
      );

      process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts verify --contract-id ${contractId} --base-url <URL> to re-verify\n\n`));
    } catch (err) {
      if (spinner) spinner.fail('Fetch failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── Can-I-Deploy ─────────────────────────────────────────────────────────────

const canIDeployCommand = new Command('can-i-deploy')
  .description('Check if a provider version is safe to deploy')
  .requiredOption('--provider <key>', 'Provider service key')
  .requiredOption('--version <ver>', 'Provider version to check')
  .option('--env <environment>', 'Target environment (e.g. qa, staging, production)')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora(`Checking deployment safety for ${opts.provider}@${opts.version}...`).start();

    try {
      const results = await canIDeploy(opts.server, token, {
        provider:    opts.provider,
        version:     opts.version,
        environment: opts.env || null,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(results, null, 2) + '\n');
        return;
      }

      const items = Array.isArray(results) ? results : [results];
      const allAllowed = items.every(r => r.allowed);
      const envLabel = opts.env ? ` in ${opts.env}` : '';

      process.stdout.write('\n');
      if (allAllowed) {
        process.stdout.write(chalk.green.bold('  ✔  PASS') + chalk.white(`: ${opts.provider} v${opts.version} is deployable${envLabel}\n`));
      } else {
        process.stdout.write(chalk.red.bold('  ✖  FAIL') + chalk.white(`: ${opts.provider} v${opts.version} is NOT deployable${envLabel}\n`));
      }
      process.stdout.write(hr() + '\n');

      if (items.length > 0) {
        process.stdout.write('\n');
        process.stdout.write(chalk.bold('  Contract Decisions') + '\n');
        for (const r of items) {
          const icon = r.allowed ? chalk.green('✔') : chalk.red('✖');
          const status = r.verificationStatus
            ? ` — ${verifyBadge(r.verificationStatus)}`
            : '';
          process.stdout.write(`  ${icon} Contract ID ${chalk.cyan(r.contractId)}${status}\n`);
          if (r.reason) {
            process.stdout.write(`    ${chalk.gray(r.reason)}\n`);
          }
        }
        process.stdout.write('\n');
      }

      if (!allAllowed) {
        process.stdout.write(chalk.gray(`  ➜  Run: specshield contracts verify --contract-id <ID> --base-url <URL>\n`));
        process.stdout.write(chalk.gray(`  ➜  to verify pending contracts before deploying\n`));
      }
      process.stdout.write('\n');

      process.exit(allAllowed ? 0 : 1);
    } catch (err) {
      if (spinner) spinner.fail('Check failed');
      logger.error(err.message);
      process.exit(2);
    }
  });

// ─── Parent contracts command ─────────────────────────────────────────────────

const contracts = new Command('contracts')
  .description('Manage and verify consumer-driven contracts');

contracts.addCommand(publishCommand);
contracts.addCommand(listCommand);
contracts.addCommand(latestCommand);
contracts.addCommand(verifyCommand);
contracts.addCommand(historyCommand);
contracts.addCommand(canIDeployCommand);

module.exports = contracts;
