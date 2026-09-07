'use strict';

/**
 * Regression guard: `specshield compare --json` must not truncate its output
 * when stdout is a pipe.
 *
 * The action handler ended with `process.exit(code)`. Writes to a pipe are
 * asynchronous, and process.exit() discards whatever is still buffered, so
 * `specshield compare --json | jq` lost the tail of any diff larger than the
 * pipe buffer — and still exited 0, so nothing looked wrong. It reproduced on
 * roughly six runs in eight; whether it truncated depended on how fast the
 * reader drained, which is why it survived this long.
 *
 * The spec pair below is generated rather than committed as a fixture: the
 * output only has to exceed the ~64KB pipe buffer, and 400 removed endpoints
 * does that with room to spare.
 */

const path = require('path');
const cp   = require('child_process');
const fs   = require('fs');
const os   = require('os');

const CLI = path.join(__dirname, '..', 'bin', 'specshield.js');

function spec(endpointCount) {
  const paths = {};
  for (let i = 0; i < endpointCount; i++) {
    paths[`/resource-${i}`] = {
      get: { responses: { 200: { description: 'ok' } } },
      post: { responses: { 201: { description: 'created' } } },
    };
  }
  return { openapi: '3.0.0', info: { title: 'flush', version: '1' }, paths };
}

function runPiped(args) {
  return new Promise((resolve, reject) => {
    // stdio 'pipe' is the point of the test — a file or TTY would flush anyway.
    const child = cp.spawn('node', [CLI, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (status) => resolve({ stdout, stderr, status }));
  });
}

describe('compare --json writes complete output to a pipe', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-flush-'));
  const base = path.join(dir, 'base.json');
  const target = path.join(dir, 'target.json');

  beforeAll(() => {
    fs.writeFileSync(base, JSON.stringify(spec(400)));
    fs.writeFileSync(target, JSON.stringify(spec(0)));
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('emits parseable JSON well past the pipe buffer, repeatably', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { stdout, status } = await runPiped(['compare', base, target, '--json']);

      expect(stdout.length).toBeGreaterThan(65536);
      expect(() => JSON.parse(stdout)).not.toThrow();
      expect(JSON.parse(stdout).summary.breaking).toBe(800);
      expect(status).toBe(1); // breaking changes present
    }
  }, 60000);
});
