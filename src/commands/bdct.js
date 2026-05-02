'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fsExtra = require('fs-extra');
const logger = require('../utils/logger');
const { getStoredApiKey } = require('../config/localConfig');
const {
  publishProviderSpec,
  publishConsumerContract,
  verify,
  listVerifications,
  canIDeploy,
  getMatrix,
  listProviderSpecs,
  listConsumerContracts,
} = require('../api/bdctClient');

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

function compatBadge(status) {
  if (!status) return chalk.gray('UNKNOWN');
  const s = String(status).toUpperCase();
  if (s === 'COMPATIBLE')   return chalk.green(s);
  if (s === 'INCOMPATIBLE') return chalk.red(s);
  return chalk.gray(s);
}

function hr() {
  return chalk.gray('  ─────────────────────────────────────────────────────');
}

/** Strip ANSI escape codes for length measurement */
function stripAnsi(str) {
  return str.replace(/\[[0-9;]*m/g, '');
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

// ─── publish-provider ────────────────────────────────────────────────────────

const publishProviderCommand = new Command('publish-provider')
  .description('Publish a provider OpenAPI spec to the BDCT registry')
  .requiredOption('--spec <path>', 'Path to provider spec file (YAML or JSON)')
  .requiredOption('--provider <name>', 'Provider service name')
  .requiredOption('--version <ver>', 'Provider version tag')
  .option('--env <environment>', 'Environment label (e.g. staging, production)')
  .option('--org <key>', 'Organization key')
  .option('--branch <branch>', 'Git branch name')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token (overrides env / stored config)')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const filePath = path.resolve(opts.spec);
    if (!(await fsExtra.pathExists(filePath))) {
      logger.error(`Spec file not found: ${filePath}`);
      process.exit(2);
    }

    let specContent;
    try {
      specContent = await fsExtra.readFile(filePath, 'utf8');
    } catch (err) {
      logger.error(`Failed to read spec file: ${err.message}`);
      process.exit(2);
    }

    const spinner = opts.json ? null : ora('Publishing provider spec...').start();

    try {
      const result = await publishProviderSpec(opts.server, token, {
        provider:    opts.provider,
        version:     opts.version,
        specContent,
        env:         opts.env    || null,
        orgKey:      opts.org    || null,
        branch:      opts.branch || null,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }

      process.stdout.write('\n');
      process.stdout.write(chalk.green.bold('  ✔  Provider Spec Published') + '\n');
      process.stdout.write(hr() + '\n');
      if (result.id)       process.stdout.write(`  ID          : ${chalk.cyan(result.id)}\n`);
      process.stdout.write(`  Provider    : ${chalk.white(opts.provider)}\n`);
      process.stdout.write(`  Version     : ${chalk.cyan(opts.version)}\n`);
      if (opts.env)        process.stdout.write(`  Environment : ${opts.env}\n`);
      if (result.publishedAt) process.stdout.write(`  Published At: ${fmtDate(result.publishedAt)}\n`);
      process.stdout.write('\n');
    } catch (err) {
      if (spinner) spinner.fail('Publish failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── publish-consumer ────────────────────────────────────────────────────────

const publishConsumerCommand = new Command('publish-consumer')
  .description('Publish a consumer contract to the BDCT registry')
  .requiredOption('--contract <path>', 'Path to consumer contract file (OpenAPI YAML/JSON or Pact JSON)')
  .requiredOption('--consumer <name>', 'Consumer service name')
  .requiredOption('--provider <name>', 'Provider service name')
  .requiredOption('--version <ver>', 'Consumer version tag')
  .option('--org <key>', 'Organization key')
  .option('--format <fmt>', 'Contract format: OPENAPI | PACT', 'OPENAPI')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token (overrides env / stored config)')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const filePath = path.resolve(opts.contract);
    if (!(await fsExtra.pathExists(filePath))) {
      logger.error(`Contract file not found: ${filePath}`);
      process.exit(2);
    }

    let contractContent;
    try {
      contractContent = await fsExtra.readFile(filePath, 'utf8');
    } catch (err) {
      logger.error(`Failed to read contract file: ${err.message}`);
      process.exit(2);
    }

    const spinner = opts.json ? null : ora('Publishing consumer contract...').start();

    try {
      const result = await publishConsumerContract(opts.server, token, {
        consumer:        opts.consumer,
        provider:        opts.provider,
        version:         opts.version,
        contractContent,
        orgKey:          opts.org    || null,
        format:          opts.format || 'OPENAPI',
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }

      process.stdout.write('\n');
      process.stdout.write(chalk.green.bold('  ✔  Consumer Contract Published') + '\n');
      process.stdout.write(hr() + '\n');
      if (result.id)       process.stdout.write(`  ID          : ${chalk.cyan(result.id)}\n`);
      process.stdout.write(`  Consumer    : ${chalk.white(opts.consumer)}\n`);
      process.stdout.write(`  Provider    : ${chalk.white(opts.provider)}\n`);
      process.stdout.write(`  Version     : ${chalk.cyan(opts.version)}\n`);
      process.stdout.write(`  Format      : ${opts.format || 'OPENAPI'}\n`);
      if (result.publishedAt) process.stdout.write(`  Published At: ${fmtDate(result.publishedAt)}\n`);
      process.stdout.write('\n');
      process.stdout.write(chalk.gray(`  ➜  Run: specshield bdct verify --consumer ${opts.consumer} --provider ${opts.provider}\n`));
      process.stdout.write('\n');
    } catch (err) {
      if (spinner) spinner.fail('Publish failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── verify ──────────────────────────────────────────────────────────────────

const verifyCommand = new Command('verify')
  .description('Verify consumer-provider contract compatibility')
  .requiredOption('--consumer <name>', 'Consumer service name')
  .requiredOption('--provider <name>', 'Provider service name')
  .option('--consumer-version <ver>', 'Consumer version to verify')
  .option('--provider-version <ver>', 'Provider version to verify against')
  .option('--env <environment>', 'Environment label')
  .option('--org <key>', 'Organization key')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora(`Verifying ${opts.consumer} → ${opts.provider}...`).start();

    try {
      const result = await verify(opts.server, token, {
        consumer:        opts.consumer,
        provider:        opts.provider,
        consumerVersion: opts.consumerVersion || null,
        providerVersion: opts.providerVersion || null,
        env:             opts.env             || null,
        orgKey:          opts.org             || null,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }

      const status  = String(result.status || result.result || '').toUpperCase();
      const success = status === 'COMPATIBLE';

      process.stdout.write('\n');
      if (success) {
        process.stdout.write(chalk.green.bold('  ✔  COMPATIBLE') + '\n');
      } else {
        process.stdout.write(chalk.red.bold('  ✖  INCOMPATIBLE') + '\n');
      }
      process.stdout.write(hr() + '\n');
      if (result.id) process.stdout.write(`  Verification ID : ${chalk.cyan(result.id)}\n`);
      process.stdout.write(`  Consumer        : ${opts.consumer}${opts.consumerVersion ? '@' + opts.consumerVersion : ''}\n`);
      process.stdout.write(`  Provider        : ${opts.provider}${opts.providerVersion ? '@' + opts.providerVersion : ''}\n`);
      if (opts.env) process.stdout.write(`  Environment     : ${opts.env}\n`);
      process.stdout.write(`  Result          : ${compatBadge(status)}\n`);
      if (result.verifiedAt || result.completedAt) {
        process.stdout.write(`  Verified At     : ${fmtDate(result.verifiedAt || result.completedAt)}\n`);
      }

      const issues = result.issues || result.mismatches || [];
      if (issues.length > 0) {
        process.stdout.write('\n');
        process.stdout.write(chalk.red.bold('  Issues') + '\n');
        process.stdout.write(hr() + '\n');
        for (const issue of issues) {
          process.stdout.write(`  ${chalk.red('●')} ${chalk.bold(issue.type || issue.mismatchType || 'MISMATCH')} at ${chalk.gray(issue.path || '$')}\n`);
          if (issue.message) process.stdout.write(`    ${chalk.gray(issue.message)}\n`);
        }
        process.stdout.write('\n');
      }

      process.stdout.write('\n');
      process.exit(success ? 0 : 1);
    } catch (err) {
      if (spinner) spinner.fail('Verification failed');
      logger.error(err.message);
      process.exit(2);
    }
  });

// ─── can-i-deploy ─────────────────────────────────────────────────────────────

const canIDeployCommand = new Command('can-i-deploy')
  .description('Check if a service version is safe to deploy')
  .requiredOption('--service <name>', 'Service name (consumer or provider)')
  .requiredOption('--version <ver>', 'Service version to check')
  .option('--env <environment>', 'Target environment (e.g. qa, staging, production)')
  .option('--org <key>', 'Organization key')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora(`Checking deployment safety for ${opts.service}@${opts.version}...`).start();

    try {
      const result = await canIDeploy(opts.server, token, {
        service: opts.service,
        version: opts.version,
        env:     opts.env || null,
        org:     opts.org || null,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        return;
      }

      const deployable = result.deployable ?? result.allowed ?? false;
      const envLabel   = opts.env ? ` in ${opts.env}` : '';

      process.stdout.write('\n');
      if (deployable) {
        process.stdout.write(chalk.green.bold('  ✔  PASS') + chalk.white(`: ${opts.service} v${opts.version} is deployable${envLabel}\n`));
      } else {
        process.stdout.write(chalk.red.bold('  ✖  FAIL') + chalk.white(`: ${opts.service} v${opts.version} is NOT deployable${envLabel}\n`));
      }
      process.stdout.write(hr() + '\n');

      const consumers = result.consumers || result.verifications || [];
      if (consumers.length > 0) {
        process.stdout.write('\n');
        process.stdout.write(chalk.bold('  Consumer Verifications') + '\n');
        printTable(
          ['Consumer', 'Version', 'Status', 'Verified At'],
          consumers.map(c => [
            c.consumer || c.consumerName || '—',
            c.consumerVersion || c.version || '—',
            compatBadge(c.status || c.result),
            fmtDate(c.verifiedAt || c.completedAt),
          ])
        );
      }

      if (!deployable) {
        process.stdout.write(chalk.gray(`  ➜  Run: specshield bdct verify --consumer <NAME> --provider ${opts.service}\n`));
        process.stdout.write(chalk.gray(`  ➜  to identify and resolve incompatibilities\n`));
        process.stdout.write('\n');
        process.exit(1);
      } else {
        process.stdout.write('\n');
        process.exit(0);
      }
    } catch (err) {
      if (spinner) spinner.fail('Check failed');
      logger.error(err.message);
      process.exit(2);
    }
  });

// ─── list ─────────────────────────────────────────────────────────────────────

const listCommand = new Command('list')
  .description('List BDCT verification history')
  .option('--org <key>', 'Filter by organization key')
  .option('--consumer <name>', 'Filter by consumer service name')
  .option('--provider <name>', 'Filter by provider service name')
  .option('--env <environment>', 'Filter by environment')
  .option('--page <n>', 'Page number (0-based)', '0')
  .option('--size <n>', 'Page size', '20')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching verification history...').start();

    try {
      const page = await listVerifications(opts.server, token, {
        org:      opts.org,
        consumer: opts.consumer,
        provider: opts.provider,
        env:      opts.env,
        page:     parseInt(opts.page, 10) || 0,
        size:     parseInt(opts.size, 10)  || 20,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(page, null, 2) + '\n');
        return;
      }

      const items = page.content || (Array.isArray(page) ? page : []);
      const total = page.totalElements ?? items.length;

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  BDCT Verification History') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Showing ${items.length} of ${total} verifications\n`);

      if (items.length === 0) {
        process.stdout.write(chalk.gray('\n  No verifications found matching filters.\n\n'));
        return;
      }

      printTable(
        ['ID', 'Consumer', 'Provider', 'Cons Ver', 'Prov Ver', 'Status', 'Environment', 'Verified At'],
        items.map(v => [
          chalk.cyan(String(v.id ?? v.verificationId ?? '—')),
          v.consumer || v.consumerName || '—',
          v.provider || v.providerName || '—',
          v.consumerVersion || '—',
          v.providerVersion || '—',
          compatBadge(v.status || v.result),
          v.env || v.environment || '—',
          fmtDate(v.verifiedAt || v.completedAt),
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

// ─── matrix ──────────────────────────────────────────────────────────────────

const matrixCommand = new Command('matrix')
  .description('Show ASCII compatibility matrix of consumers vs providers')
  .option('--org <key>', 'Organization key')
  .option('--env <environment>', 'Environment label')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching compatibility matrix...').start();

    try {
      const matrix = await getMatrix(opts.server, token, {
        org: opts.org,
        env: opts.env,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(matrix, null, 2) + '\n');
        return;
      }

      // Expected matrix shape: { consumers: string[], providers: string[], cells: { [consumer]: { [provider]: string } } }
      const consumers = matrix.consumers || [];
      const providers = matrix.providers || [];
      const cells     = matrix.cells     || {};

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  BDCT Compatibility Matrix') + '\n');
      if (opts.env) process.stdout.write(chalk.gray(`  Environment: ${opts.env}\n`));
      process.stdout.write(hr() + '\n');

      if (consumers.length === 0 || providers.length === 0) {
        process.stdout.write(chalk.gray('\n  No data available. Publish provider specs and consumer contracts first.\n\n'));
        return;
      }

      // Build table: first column = consumer label, remaining = providers
      const headers = ['Consumer \\ Provider', ...providers];
      const rows = consumers.map(consumer => {
        const providerCells = providers.map(provider => {
          const status = (cells[consumer] && cells[consumer][provider]) || 'UNKNOWN';
          return compatBadge(status);
        });
        return [chalk.white(consumer), ...providerCells];
      });

      printTable(headers, rows);

      process.stdout.write(chalk.green('  ■') + chalk.gray(' COMPATIBLE  ') +
                           chalk.red('■')   + chalk.gray(' INCOMPATIBLE  ') +
                           chalk.gray('■ UNKNOWN') + '\n\n');
    } catch (err) {
      if (spinner) spinner.fail('Fetch failed');
      logger.error(err.message);
      process.exit(1);
    }
  });

// ─── list-providers ──────────────────────────────────────────────────────────

const listProvidersCommand = new Command('list-providers')
  .description('List published provider specs')
  .option('--org <key>', 'Filter by organization key')
  .option('--provider <name>', 'Filter by provider service name')
  .option('--env <environment>', 'Filter by environment')
  .option('--page <n>', 'Page number (0-based)', '0')
  .option('--size <n>', 'Page size', '20')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching provider specs...').start();

    try {
      const page = await listProviderSpecs(opts.server, token, {
        org:      opts.org,
        provider: opts.provider,
        env:      opts.env,
        page:     parseInt(opts.page, 10) || 0,
        size:     parseInt(opts.size, 10)  || 20,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(page, null, 2) + '\n');
        return;
      }

      const items = page.content || (Array.isArray(page) ? page : []);
      const total = page.totalElements ?? items.length;

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  Published Provider Specs') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Showing ${items.length} of ${total} specs\n`);

      if (items.length === 0) {
        process.stdout.write(chalk.gray('\n  No provider specs found matching filters.\n\n'));
        return;
      }

      printTable(
        ['ID', 'Provider', 'Version', 'Environment', 'Branch', 'Published At'],
        items.map(s => [
          chalk.cyan(String(s.id ?? '—')),
          s.provider || s.providerName || '—',
          chalk.cyan(s.version || '—'),
          s.env || s.environment || '—',
          chalk.gray(s.branch || '—'),
          fmtDate(s.publishedAt),
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

// ─── list-consumers ──────────────────────────────────────────────────────────

const listConsumersCommand = new Command('list-consumers')
  .description('List published consumer contracts')
  .option('--org <key>', 'Filter by organization key')
  .option('--consumer <name>', 'Filter by consumer service name')
  .option('--provider <name>', 'Filter by provider service name')
  .option('--page <n>', 'Page number (0-based)', '0')
  .option('--size <n>', 'Page size', '20')
  .option('--json', 'Output raw JSON')
  .option('--server <url>', 'SpecShield server URL')
  .option('--api-token <token>', 'API token')
  .action(async (opts) => {
    const token = await resolveApiToken(opts);
    requireToken(token);

    const spinner = opts.json ? null : ora('Fetching consumer contracts...').start();

    try {
      const page = await listConsumerContracts(opts.server, token, {
        org:      opts.org,
        consumer: opts.consumer,
        provider: opts.provider,
        page:     parseInt(opts.page, 10) || 0,
        size:     parseInt(opts.size, 10)  || 20,
      });
      if (spinner) spinner.stop();

      if (opts.json) {
        process.stdout.write(JSON.stringify(page, null, 2) + '\n');
        return;
      }

      const items = page.content || (Array.isArray(page) ? page : []);
      const total = page.totalElements ?? items.length;

      process.stdout.write('\n');
      process.stdout.write(chalk.bold('  Published Consumer Contracts') + '\n');
      process.stdout.write(hr() + '\n');
      process.stdout.write(`  Showing ${items.length} of ${total} contracts\n`);

      if (items.length === 0) {
        process.stdout.write(chalk.gray('\n  No consumer contracts found matching filters.\n\n'));
        return;
      }

      printTable(
        ['ID', 'Consumer', 'Provider', 'Version', 'Format', 'Published At'],
        items.map(c => [
          chalk.cyan(String(c.id ?? '—')),
          c.consumer || c.consumerName || '—',
          c.provider || c.providerName || '—',
          chalk.cyan(c.version || '—'),
          c.contractFormat || c.format || '—',
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

// ─── Parent bdct command ──────────────────────────────────────────────────────

const bdct = new Command('bdct')
  .description('Bi-Directional Contract Testing (BDCT) — publish specs, verify compatibility, check deployability');

bdct.addCommand(publishProviderCommand);
bdct.addCommand(publishConsumerCommand);
bdct.addCommand(verifyCommand);
bdct.addCommand(canIDeployCommand);
bdct.addCommand(listCommand);
bdct.addCommand(matrixCommand);
bdct.addCommand(listProvidersCommand);
bdct.addCommand(listConsumersCommand);

module.exports = bdct;
