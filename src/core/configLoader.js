'use strict';

const fsExtra = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const logger = require('../utils/logger');

const DEFAULT_CONFIG_NAMES = ['.specshield.yml', '.specshield.yaml', '.specshield.json'];

const DEFAULT_CONFIG = {
  allowBreakingChanges: false,
  failOnBreaking: false,
  ignore: [],
  severity: 'info',
  remote: {
    enabled: false,
    url: null,
    timeout: 10000,
  },
};

async function loadConfig(configPath) {
  // Explicit path provided
  if (configPath) {
    const resolved = path.resolve(configPath);
    if (!(await fsExtra.pathExists(resolved))) {
      throw new Error(`Config file not found: ${resolved}`);
    }
    return parseConfigFile(resolved);
  }

  // Auto-discover in cwd
  for (const name of DEFAULT_CONFIG_NAMES) {
    const resolved = path.resolve(process.cwd(), name);
    if (await fsExtra.pathExists(resolved)) {
      logger.debug(`Using config: ${resolved}`);
      return parseConfigFile(resolved);
    }
  }

  return { ...DEFAULT_CONFIG };
}

async function parseConfigFile(filePath) {
  const content = await fsExtra.readFile(filePath, 'utf8');
  let parsed;

  try {
    if (filePath.endsWith('.json')) {
      parsed = JSON.parse(content);
    } else {
      parsed = yaml.load(content);
    }
  } catch (err) {
    throw new Error(`Invalid config file "${filePath}": ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Config file "${filePath}" must be a YAML/JSON object`);
  }

  return validateConfig(parsed, filePath);
}

function validateConfig(config, filePath) {
  const valid = { ...DEFAULT_CONFIG };

  if (config.allowBreakingChanges !== undefined) {
    if (typeof config.allowBreakingChanges !== 'boolean') {
      throw new Error(`Config error in "${filePath}": allowBreakingChanges must be a boolean`);
    }
    valid.allowBreakingChanges = config.allowBreakingChanges;
  }

  if (config.failOnBreaking !== undefined) {
    if (typeof config.failOnBreaking !== 'boolean') {
      throw new Error(`Config error in "${filePath}": failOnBreaking must be a boolean`);
    }
    valid.failOnBreaking = config.failOnBreaking;
  }

  if (config.ignore !== undefined && config.ignore !== null) {
    if (!Array.isArray(config.ignore)) {
      throw new Error(`Config error in "${filePath}": ignore must be an array`);
    }
    valid.ignore = config.ignore.filter(Boolean);
  }

  if (config.severity !== undefined) {
    const allowed = ['info', 'warning', 'error'];
    if (!allowed.includes(config.severity)) {
      throw new Error(`Config error in "${filePath}": severity must be one of: ${allowed.join(', ')}`);
    }
    valid.severity = config.severity;
  }

  if (config.remote !== undefined) {
    if (typeof config.remote !== 'object') {
      throw new Error(`Config error in "${filePath}": remote must be an object`);
    }
    valid.remote = {
      enabled: Boolean(config.remote.enabled),
      url: config.remote.url || null,
      timeout: parseInt(config.remote.timeout, 10) || 10000,
    };
  }

  return valid;
}

module.exports = { loadConfig };
