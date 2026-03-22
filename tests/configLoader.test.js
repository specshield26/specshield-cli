'use strict';

const path = require('path');
const fsExtra = require('fs-extra');
const os = require('os');
const { loadConfig } = require('../src/core/configLoader');

describe('loadConfig', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), 'specshield-'));
  });

  afterEach(async () => {
    await fsExtra.remove(tmpDir);
  });

  test('returns default config when no file exists', async () => {
    // Use an explicit path that does not exist to bypass cwd auto-discovery
    const missingPath = path.join(tmpDir, 'does-not-exist.yml');
    // loadConfig throws on a missing explicit path, so we test auto-discovery
    // by temporarily changing cwd to the empty tmpDir where no config exists.
    const originalCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const config = await loadConfig(null);
      expect(config.failOnBreaking).toBe(false);
      expect(config.allowBreakingChanges).toBe(false);
      expect(config.ignore).toEqual([]);
      expect(config.severity).toBe('error');
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('loads valid YAML config', async () => {
    const configPath = path.join(tmpDir, '.specshield.yml');
    await fsExtra.writeFile(configPath, `failOnBreaking: true\nseverity: warning\nignore:\n  - "test change"`);
    const config = await loadConfig(configPath);
    expect(config.failOnBreaking).toBe(true);
    expect(config.severity).toBe('warning');
    expect(config.ignore).toContain('test change');
  });

  test('loads valid JSON config', async () => {
    const configPath = path.join(tmpDir, '.specshield.json');
    await fsExtra.writeJSON(configPath, { failOnBreaking: true, severity: 'info' });
    const config = await loadConfig(configPath);
    expect(config.failOnBreaking).toBe(true);
    expect(config.severity).toBe('info');
  });

  test('throws on missing explicit config path', async () => {
    await expect(loadConfig('/nonexistent/.specshield.yml')).rejects.toThrow('not found');
  });

  test('throws on invalid severity value', async () => {
    const configPath = path.join(tmpDir, '.specshield.yml');
    await fsExtra.writeFile(configPath, 'severity: invalid');
    await expect(loadConfig(configPath)).rejects.toThrow('severity');
  });

  test('throws when ignore is not an array', async () => {
    const configPath = path.join(tmpDir, '.specshield.yml');
    await fsExtra.writeFile(configPath, 'ignore: "not-an-array"');
    await expect(loadConfig(configPath)).rejects.toThrow('ignore');
  });
});
