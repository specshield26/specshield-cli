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

async function publishContract(server, apiToken, payload) {
  try {
    const res = await buildClient(server, apiToken).post('/api/contracts/publish', payload);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function listContracts(server, apiToken, { org, consumer, provider, contractName, status, page = 0, size = 20 } = {}) {
  try {
    const params = { page, size };
    if (org) params.orgKey = org;
    if (consumer) params.consumerServiceKey = consumer;
    if (provider) params.providerServiceKey = provider;
    if (contractName) params.contractName = contractName;
    if (status) params.status = status;
    const res = await buildClient(server, apiToken).get('/api/contracts', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function getLatestContract(server, apiToken, { org, consumer, provider, contractName } = {}) {
  try {
    const params = {};
    if (org) params.orgKey = org;
    if (consumer) params.consumerServiceKey = consumer;
    if (provider) params.providerServiceKey = provider;
    if (contractName) params.contractName = contractName;
    const res = await buildClient(server, apiToken).get('/api/contracts/latest', { params });
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function verifyContract(server, apiToken, contractId, payload) {
  try {
    const res = await buildClient(server, apiToken).post(`/api/contracts/${contractId}/verify`, payload);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function getVerificationHistory(server, apiToken, contractId) {
  try {
    const res = await buildClient(server, apiToken).get(`/api/contracts/${contractId}/verifications`);
    return res.data;
  } catch (err) { throw apiError(err); }
}

async function canIDeploy(server, apiToken, { provider, version: ver, environment } = {}) {
  try {
    const params = { version: ver };
    if (environment) params.environment = environment;
    const res = await buildClient(server, apiToken).get(
      `/api/providers/${encodeURIComponent(provider)}/can-i-deploy`, { params }
    );
    return res.data;
  } catch (err) { throw apiError(err); }
}

module.exports = { publishContract, listContracts, getLatestContract, verifyContract, getVerificationHistory, canIDeploy };
