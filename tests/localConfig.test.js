'use strict';

const os = require('os');
const path = require('path');
const fsExtra = require('fs-extra');

const TEST_HOME = path.join(os.tmpdir(), `.specshield-test-home-${process.pid}`);

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => require('path').join(require('os').tmpdir(), `.specshield-test-home-${process.pid}`),
}));

// Re-require after mock is applied
let localConfig;
beforeAll(() => {
  jest.resetModules();
  localConfig = require('../src/config/localConfig');
});

afterEach(async () => {
  await fsExtra.remove(TEST_HOME);
  jest.resetModules();
  localConfig = require('../src/config/localConfig');
});

describe('localConfig', () => {
  test('returns empty object when config file does not exist', async () => {
    const config = await localConfig.loadLocalConfig();
    expect(config).toEqual({});
  });

  test('getStoredApiKey returns null when no key stored', async () => {
    const key = await localConfig.getStoredApiKey();
    expect(key).toBeNull();
  });

  test('setStoredApiKey persists the key', async () => {
    await localConfig.setStoredApiKey('ss_abc123');
    const key = await localConfig.getStoredApiKey();
    expect(key).toBe('ss_abc123');
  });

  test('clearStoredApiKey removes the key', async () => {
    await localConfig.setStoredApiKey('ss_abc123');
    await localConfig.clearStoredApiKey();
    const key = await localConfig.getStoredApiKey();
    expect(key).toBeNull();
  });

  test('clearStoredApiKey preserves other config fields', async () => {
    await localConfig.saveLocalConfig({ apiKey: 'ss_abc', foo: 'bar' });
    await localConfig.clearStoredApiKey();
    const config = await localConfig.loadLocalConfig();
    expect(config.foo).toBe('bar');
    expect(config.apiKey).toBeUndefined();
  });
});
