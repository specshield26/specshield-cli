'use strict';

const chalk = require('chalk');

const logger = {
  info(msg) {
    process.stderr.write(chalk.blue('ℹ ') + msg + '\n');
  },
  warn(msg) {
    process.stderr.write(chalk.yellow('⚠ ') + msg + '\n');
  },
  error(msg) {
    process.stderr.write(chalk.red('✖ ') + msg + '\n');
  },
  debug(msg) {
    if (process.env.SPECSHIELD_DEBUG) {
      process.stderr.write(chalk.gray('[debug] ') + msg + '\n');
    }
  },
};

module.exports = logger;
