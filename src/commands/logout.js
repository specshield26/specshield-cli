'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const { clearStoredApiKey } = require('../config/localConfig');

const logout = new Command('logout');

logout
  .description('Remove your stored SpecShield API key')
  .action(async () => {
    await clearStoredApiKey();
    console.log(chalk.green('Logged out. API key removed from local config.'));
  });

module.exports = logout;
