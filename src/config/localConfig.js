'use strict';

const path = require('path');
const os = require('os');
const fsExtra = require('fs-extra');

const CONFIG_PATH = path.join(os.homedir(), '.specshield', 'config.json');

async function loadLocalConfig() {
  try {
    return await fsExtra.readJson(CONFIG_PATH);
  } catch {
    return {};
  }
}

async function saveLocalConfig(data) {
  await fsExtra.outputJson(CONFIG_PATH, data, { spaces: 2 });
}

async function getStoredApiKey() {
  const config = await loadLocalConfig();
  return config.apiKey || null;
}

async function setStoredApiKey(apiKey) {
  const config = await loadLocalConfig();
  config.apiKey = apiKey;
  await saveLocalConfig(config);
}

async function clearStoredApiKey() {
  const config = await loadLocalConfig();
  delete config.apiKey;
  await saveLocalConfig(config);
}

module.exports = { loadLocalConfig, saveLocalConfig, getStoredApiKey, setStoredApiKey, clearStoredApiKey, CONFIG_PATH };
