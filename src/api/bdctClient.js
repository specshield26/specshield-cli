'use strict';

const axios = require('axios');
const { version } = require('../../package.json');

const DEFAULT_SERVER = 'https://specshield.io';
const TIMEOUT = 15000;

function buildClient(server, apiToken) {
  const baseURL = (server || DEFAULT_SERVER).replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'X-SpecShield-Client': 'cli',
    'X-SpecShield-Version': version,
  };
  if (apiToken) headers['X-Api-Key'] = apiToken;
  return axios.create({ baseURL, timeout: TIMEOUT, headers });
}

function apiError(err) {
  if (err.response) {
    const data = err.response.data;
    const msg = (data && (data.message || data.error || data.title))
      || `HTTP ${err.response.status}`;
    return new Error(`API error (${err.response.status}): ${msg}`);
  }
  if (err.request) return new Error(`No response from server: ${err.message}`);
  return new Error(`Request failed: ${err.message}`);
}

async function publishProviderSpec(server, apiToken, payload) {
  try {
    const res = await buildClient(server, apiToken).post('/api/bdct/provider-specs', payload);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function publishConsumerContract(server, apiToken, payload) {
  try {
    const res = await buildClient(server, apiToken).post('/api/bdct/consumer-contracts', payload);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function verify(server, apiToken, payload) {
  try {
    const res = await buildClient(server, apiToken).post('/api/bdct/verify', payload);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function listVerifications(server, apiToken, { org, consumer, provider, env, page = 0, size = 20 } = {}) {
  try {
    const params = { page, size };
    if (org)      params.orgKey = org;
    if (consumer) params.consumer = consumer;
    if (provider) params.provider = provider;
    if (env)      params.env = env;
    const res = await buildClient(server, apiToken).get('/api/bdct/verifications', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function canIDeploy(server, apiToken, { org, service, version: ver, env } = {}) {
  try {
    const params = { service, version: ver };
    if (org) params.orgKey = org;
    if (env) params.env = env;
    const res = await buildClient(server, apiToken).get('/api/bdct/can-i-deploy', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function getMatrix(server, apiToken, { org, env } = {}) {
  try {
    const params = {};
    if (org) params.orgKey = org;
    if (env) params.env = env;
    const res = await buildClient(server, apiToken).get('/api/bdct/matrix', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function listProviderSpecs(server, apiToken, { org, provider, env, page = 0, size = 20 } = {}) {
  try {
    const params = { page, size };
    if (org)      params.orgKey = org;
    if (provider) params.provider = provider;
    if (env)      params.env = env;
    const res = await buildClient(server, apiToken).get('/api/bdct/provider-specs', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function listConsumerContracts(server, apiToken, { org, consumer, provider, page = 0, size = 20 } = {}) {
  try {
    const params = { page, size };
    if (org)      params.orgKey = org;
    if (consumer) params.consumer = consumer;
    if (provider) params.provider = provider;
    const res = await buildClient(server, apiToken).get('/api/bdct/consumer-contracts', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

module.exports = {
  publishProviderSpec,
  publishConsumerContract,
  verify,
  listVerifications,
  canIDeploy,
  getMatrix,
  listProviderSpecs,
  listConsumerContracts,
};
