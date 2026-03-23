'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { loadConfig } = require('../src/core/configLoader');

function tmpFile(name, content) {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content);
  return p;
}

describe('loadConfig - defaults', () => {
  // Point cwd to tmpdir so auto-discovery finds no .specshield.yml
  let originalCwd;
  beforeEach(() => {
    originalCwd = process.cwd;
    process.cwd = () => os.tmpdir();
  });
  afterEach(() => {
    process.cwd = originalCwd;
  });

  test('returns default config when no file exists', async () => {
    const config = await loadConfig(null);
    expect(config.failOnBreaking).toBe(false);
    expect(config.allowBreakingChanges).toBe(false);
    expect(Array.isArray(config.ignore)).toBe(true);
    expect(config.ignore).toHaveLength(0);
    expect(config.severity).toBe('info');
    expect(config.remote.enabled).toBe(false);
    expect(config.remote.url).toBeNull();
  });
});

describe('loadConfig - YAML config', () => {
  test('loads valid YAML config', async () => {
    const p = tmpFile('specshield-test.yml', [
      'failOnBreaking: true',
      'severity: warning',
      'ignore:',
      '  - "foo removed"',
      '  - "/bar DELETE removed"',
    ].join('\n'));

    const config = await loadConfig(p);
    expect(config.failOnBreaking).toBe(true);
    expect(config.severity).toBe('warning');
    expect(config.ignore).toContain('foo removed');
    expect(config.ignore).toContain('/bar DELETE removed');
    fs.unlinkSync(p);
  });

  test('loads remote block from YAML', async () => {
    const p = tmpFile('specshield-remote.yml', [
      'remote:',
      '  enabled: true',
      '  url: "https://api.example.com/compare"',
      '  timeout: 5000',
    ].join('\n'));

    const config = await loadConfig(p);
    expect(config.remote.enabled).toBe(true);
    expect(config.remote.url).toBe('https://api.example.com/compare');
    expect(config.remote.timeout).toBe(5000);
    fs.unlinkSync(p);
  });
});

describe('loadConfig - JSON config', () => {
  test('loads valid JSON config', async () => {
    const p = tmpFile('specshield-test.json', JSON.stringify({
      failOnBreaking: true,
      severity: 'error',
      ignore: ['DELETE /users removed'],
    }));

    const config = await loadConfig(p);
    expect(config.failOnBreaking).toBe(true);
    expect(config.severity).toBe('error');
    expect(config.ignore).toContain('DELETE /users removed');
    fs.unlinkSync(p);
  });
});

describe('loadConfig - validation errors', () => {
  test('throws if explicit config path not found', async () => {
    await expect(loadConfig('/nonexistent/.specshield.yml')).rejects.toThrow('Config file not found');
  });

  test('throws if allowBreakingChanges is not boolean', async () => {
    const p = tmpFile('specshield-inv1.yml', 'allowBreakingChanges: "yes"\n');
    await expect(loadConfig(p)).rejects.toThrow('allowBreakingChanges must be a boolean');
    fs.unlinkSync(p);
  });

  test('throws if failOnBreaking is not boolean', async () => {
    const p = tmpFile('specshield-inv2.yml', 'failOnBreaking: 1\n');
    await expect(loadConfig(p)).rejects.toThrow('failOnBreaking must be a boolean');
    fs.unlinkSync(p);
  });

  test('throws if severity is not a valid level', async () => {
    const p = tmpFile('specshield-inv3.yml', 'severity: critical\n');
    await expect(loadConfig(p)).rejects.toThrow('severity must be one of');
    fs.unlinkSync(p);
  });

  test('throws if ignore is not an array', async () => {
    const p = tmpFile('specshield-inv4.yml', 'ignore: "not-an-array"\n');
    await expect(loadConfig(p)).rejects.toThrow('ignore must be an array');
    fs.unlinkSync(p);
  });

  test('throws if remote is not an object', async () => {
    const p = tmpFile('specshield-inv5.yml', 'remote: true\n');
    await expect(loadConfig(p)).rejects.toThrow('remote must be an object');
    fs.unlinkSync(p);
  });

  test('throws on malformed YAML', async () => {
    const p = tmpFile('specshield-inv6.yml', 'key: [unclosed\n');
    await expect(loadConfig(p)).rejects.toThrow();
    fs.unlinkSync(p);
  });

  test('throws on malformed JSON', async () => {
    const p = tmpFile('specshield-inv7.json', '{invalid json}');
    await expect(loadConfig(p)).rejects.toThrow();
    fs.unlinkSync(p);
  });
});
