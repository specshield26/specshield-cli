'use strict';

/**
 * End-to-end smoke for the non-interactive `init` flow.
 * Runs the actual CLI binary against a tmp directory, then verifies the
 * generated `.specshield.yml` parses and contains the expected keys.
 */

const fs        = require('fs');
const os        = require('os');
const path      = require('path');
const cp        = require('child_process');
const yaml      = require('js-yaml');

const CLI = path.join(__dirname, '..', 'bin', 'specshield.js');

function run(args, cwd) {
  const r = cp.spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8' });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

function tmpRepo(layout = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-init-'));
  for (const [rel, contents] of Object.entries(layout)) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  return root;
}

describe('specshield init --no-interactive', () => {
  it('writes a valid provider-only .specshield.yml', () => {
    const root = tmpRepo({
      'package.json':     JSON.stringify({ name: 'payment-service' }),
      'api/openapi.yaml': 'openapi: 3.0.0\ninfo: {title: x, version: 1}\npaths: {}\n',
    });

    const r = run([
      'init', '--no-interactive',
      '--kind',     'provider',
      '--org',      'acme-pay',
      '--provider', 'payment-service',
      '--spec',     'api/openapi.yaml',
      '--env',      'staging',
    ], root);

    expect(r.status).toBe(0);

    const written = fs.readFileSync(path.join(root, '.specshield.yml'), 'utf8');
    const parsed  = yaml.load(written);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.bdct.org).toBe('acme-pay');
    expect(parsed.bdct.provider.name).toBe('payment-service');
    expect(parsed.bdct.provider.spec).toBe('api/openapi.yaml');
    expect(parsed.bdct.environment).toBe('staging');
  });

  it('exits 2 with a friendly error when --kind is missing', () => {
    const root = tmpRepo({});
    const r = run(['init', '--no-interactive'], root);
    expect(r.status).toBe(2);
    expect(r.stderr + r.stdout).toMatch(/Missing --kind/);
  });

  it('exits 2 when required fields for the chosen kind are absent', () => {
    const root = tmpRepo({});  // no package.json, no spec
    const r = run([
      'init', '--no-interactive',
      '--kind', 'provider',
      '--org',  'acme',
    ], root);
    expect(r.status).toBe(2);
  });

  it('--print outputs YAML and writes nothing', () => {
    const root = tmpRepo({
      'api/openapi.yaml': 'openapi: 3.0.0\npaths: {}\n',
      'package.json':     JSON.stringify({ name: 'svc' }),
    });
    const r = run([
      'init', '--no-interactive', '--print',
      '--kind', 'provider', '--org', 'acme',
      '--provider', 'svc', '--spec', 'api/openapi.yaml',
    ], root);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/schemaVersion: 1/);
    expect(fs.existsSync(path.join(root, '.specshield.yml'))).toBe(false);
  });

  it('--write-workflow also writes .github/workflows/specshield-bdct.yml', () => {
    const root = tmpRepo({
      'api/openapi.yaml': 'openapi: 3.0.0\npaths: {}\n',
      'package.json':     JSON.stringify({ name: 'svc' }),
    });
    const r = run([
      'init', '--no-interactive', '--write-workflow',
      '--kind', 'provider', '--org', 'acme',
      '--provider', 'svc', '--spec', 'api/openapi.yaml',
    ], root);
    expect(r.status).toBe(0);
    const wf = path.join(root, '.github', 'workflows', 'specshield-bdct.yml');
    expect(fs.existsSync(wf)).toBe(true);
    const text = fs.readFileSync(wf, 'utf8');
    expect(text).toMatch(/specshield26\/bdct-action@v1/);
    expect(text).toMatch(/publish-provider:/);
  });
});
