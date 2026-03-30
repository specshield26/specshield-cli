'use strict';

const axios = require('axios');
const { Command } = require('commander');

jest.mock('axios');
jest.mock('../src/config/localConfig', () => ({
  setStoredApiKey: jest.fn().mockResolvedValue(undefined),
  CONFIG_PATH: '/tmp/.specshield/config.json',
}));

const { setStoredApiKey } = require('../src/config/localConfig');

// Capture console output
let consoleOutput = [];
beforeEach(() => {
  consoleOutput = [];
  jest.spyOn(console, 'log').mockImplementation((...args) => consoleOutput.push(args.join(' ')));
  jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`process.exit(${code})`); });
  setStoredApiKey.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function runLogin(args) {
  const loginCommand = require('../src/commands/login');
  // Clone the command for isolated test runs
  const program = new Command();
  program.addCommand(loginCommand);
  await program.parseAsync(['node', 'specshield', 'login', ...args]);
}

describe('login command', () => {
  test('valid API key: validates, stores, and prints success info', async () => {
    axios.post.mockResolvedValue({
      data: { valid: true, name: 'Alice', plan: 'FREE', customerId: 'cust_abc' },
    });

    await runLogin(['--api-key', 'ss_validkey']);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/validate-api-key'),
      {},
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Api-Key': 'ss_validkey' }) })
    );
    expect(setStoredApiKey).toHaveBeenCalledWith('ss_validkey');
    expect(consoleOutput.some(l => l.includes('Alice'))).toBe(true);
  });

  test('invalid API key: prints error and exits with 1', async () => {
    axios.post.mockResolvedValue({ data: { valid: false } });

    await expect(runLogin(['--api-key', 'ss_bad'])).rejects.toThrow('process.exit(1)');
    expect(setStoredApiKey).not.toHaveBeenCalled();
  });

  test('network error: prints connection error and exits with 1', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(runLogin(['--api-key', 'ss_any'])).rejects.toThrow('process.exit(1)');
    expect(setStoredApiKey).not.toHaveBeenCalled();
  });

  test('missing --api-key: commander exits', async () => {
    await expect(runLogin([])).rejects.toThrow();
  });
});
