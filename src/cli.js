'use strict';

const { Command } = require('commander');
const { version } = require('../package.json');
const compareCommand = require('./commands/compare');

const program = new Command();

program
  .name('specshield')
  .description('Compare OpenAPI specs and detect breaking changes')
  .version(version);

program.addCommand(compareCommand);

program.parseAsync(process.argv).catch((err) => {
  const logger = require('./utils/logger');
  logger.error(err.message);
  process.exit(2);
});
