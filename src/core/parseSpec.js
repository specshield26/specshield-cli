'use strict';

const yaml = require('js-yaml');
const path = require('path');

/**
 * Parse raw spec content (YAML or JSON) into a JavaScript object.
 * Detects format from file extension or content.
 */
function parseSpec(content, filePath) {
  const ext = filePath ? path.extname(filePath).toLowerCase() : '';

  try {
    if (ext === '.json') {
      return parseJson(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return parseYaml(content);
    } else {
      // Auto-detect: try JSON first, then YAML
      return autoDetect(content);
    }
  } catch (err) {
    throw new Error(`Failed to parse spec "${filePath}": ${err.message}`);
  }
}

function parseJson(content) {
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
}

function parseYaml(content) {
  const result = yaml.load(content);
  if (result === null || typeof result !== 'object') {
    throw new Error('YAML did not produce a valid object');
  }
  return result;
}

function autoDetect(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJson(content);
  }
  return parseYaml(content);
}

module.exports = { parseSpec, parseJson, parseYaml };
