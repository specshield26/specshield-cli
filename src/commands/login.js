'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { setStoredApiKey, CONFIG_PATH } = require('../config/localConfig');

const HOSTED_API_URL = 'http://specshield.io';

const login = new Command('login');

login
  .description('Authenticate with the SpecShield hosted API using your API key')
  .requiredOption('--api-key <key>', 'Your SpecShield API key (starts with ss_)')
  .option('--api-url <url>', 'Override the hosted API base URL', HOSTED_API_URL)
  .action(async (opts) => {
    const spinner = ora('Validating API key...').start();

    try {
      const response = await axios.post(
        `${opts.apiUrl}/auth/validate-api-key`,
        {},
        {
          headers: { 'X-Api-Key': opts.apiKey },
          timeout: 10000,
        }
      );

      if (!response.data.valid) {
        spinner.fail(chalk.red('API key is invalid.'));
        process.exit(1);
      }

      await setStoredApiKey(opts.apiKey);

      spinner.succeed(chalk.green('Logged in successfully.'));
      console.log('');
      console.log(`  ${chalk.bold('Customer:')}  ${response.data.name}`);
      console.log(`  ${chalk.bold('Plan:')}      ${response.data.plan}`);
      console.log(`  ${chalk.gray('Config:')}    ${CONFIG_PATH}`);
      console.log('');
      console.log(chalk.gray('  Run: specshield compare base.yaml target.yaml --remote'));

    } catch (err) {
      const msg = err.response
        ? `Validation failed (${err.response.status}): ${JSON.stringify(err.response.data)}`
        : `Connection error: ${err.message}`;
      spinner.fail(chalk.red(msg));
      process.exit(1);
    }
  });

module.exports = login;
