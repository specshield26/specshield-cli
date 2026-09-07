'use strict';

/**
 * Guards the `--json` exit paths of `bdct verify` and `bdct can-i-deploy`.
 *
 * These used to end with `process.exit(...)` inside an `if (opts.json)` block,
 * which truncated large JSON on a pipe (see tests/compareStdoutFlush.test.js).
 * They now call exitAfterFlush(), which *returns* instead of terminating — so
 * each site needs an explicit `return` or the human renderer below it would
 * also run and corrupt the JSON with report text.
 *
 * This test exists because that `return` is invisible in review and nothing
 * else covers it: assert stdout parses as JSON, carries no human-report
 * markers, and that the exit code still reflects the result.
 */

const path = require('path');
const cp   = require('child_process');
const http = require('http');

const CLI = path.join(__dirname, '..', 'bin', 'specshield.js');
const HUMAN_MARKERS = /─|✔|✖|➜/;

const VERIFY = {
  id: 57,
  status: 'INCOMPATIBLE',
  resultJson: JSON.stringify([{
    endpoint: 'POST /payments',
    status: 'INCOMPATIBLE',
    mismatches: [{ endpoint: 'POST /payments', type: 'RESPONSE_FIELD_MISSING', field: '$.receiptUrl', severity: 'ERROR' }],
  }]),
};

function runCLI(args) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn('node', [CLI, ...args], {
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (status) => resolve({ stdout, stderr, status }));
  });
}

describe('bdct --json paths emit JSON only', () => {
  let server, baseUrl;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(
        req.url.includes('can-i-deploy') ? { deployable: false, reasons: ['incompatible'] } : VERIFY,
      ));
    });
    baseUrl = await new Promise((r) => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${server.address().port}`)));
  });

  afterAll(() => new Promise((r) => server.close(r)));

  test('verify --json prints only the result and exits 1 when incompatible', async () => {
    const { stdout, status } = await runCLI(['bdct', 'verify',
      '--consumer', 'c', '--provider', 'p', '--consumer-version', '1', '--provider-version', '1',
      '--org', 'o', '--env', 'dev', '--server', baseUrl, '--api-token', 'ss_x', '--json']);

    expect(() => JSON.parse(stdout)).not.toThrow();
    expect(stdout).not.toMatch(HUMAN_MARKERS);
    expect(status).toBe(1);
  }, 20000);

  test('can-i-deploy --json prints only the result and exits 1 when not deployable', async () => {
    const { stdout, status } = await runCLI(['bdct', 'can-i-deploy',
      '--service', 's', '--version', '1',
      '--org', 'o', '--env', 'dev', '--server', baseUrl, '--api-token', 'ss_x', '--json']);

    expect(() => JSON.parse(stdout)).not.toThrow();
    expect(stdout).not.toMatch(HUMAN_MARKERS);
    expect(status).toBe(1);
  }, 20000);

  test('verify without --json still renders the human report', async () => {
    const { stdout } = await runCLI(['bdct', 'verify',
      '--consumer', 'c', '--provider', 'p', '--consumer-version', '1', '--provider-version', '1',
      '--org', 'o', '--env', 'dev', '--server', baseUrl, '--api-token', 'ss_x']);

    expect(stdout).toMatch(HUMAN_MARKERS);
  }, 20000);
});
