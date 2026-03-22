'use strict';

const fsExtra = require('fs-extra');
const path = require('path');

/**
 * Load a spec file from the local filesystem.
 * Returns raw string content.
 */
async function loadSpec(filePath) {
  const resolved = path.resolve(filePath);

  const exists = await fsExtra.pathExists(resolved);
  if (!exists) {
    throw new Error(`Spec file not found: ${resolved}`);
  }

  const stat = await fsExtra.stat(resolved);
  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${resolved}`);
  }

  const content = await fsExtra.readFile(resolved, 'utf8');
  if (!content || content.trim().length === 0) {
    throw new Error(`Spec file is empty: ${resolved}`);
  }

  return content;
}

module.exports = { loadSpec };
