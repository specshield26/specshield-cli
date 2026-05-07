'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const {
  findSpecCandidates,
  detectServiceName,
  suggestEnvironment,
  detectAll,
  looksLikeOpenApi,
} = require('../src/core/projectDetect');

function makeTmpRepo(layout) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-detect-'));
  for (const [rel, contents] of Object.entries(layout)) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  return root;
}

describe('looksLikeOpenApi', () => {
  it('accepts OpenAPI 3.x', () => {
    expect(looksLikeOpenApi({ openapi: '3.0.0', info: {}, paths: {} })).toBe(true);
    expect(looksLikeOpenApi({ openapi: '3.1.0' })).toBe(true);
  });
  it('accepts Swagger 2.x', () => {
    expect(looksLikeOpenApi({ swagger: '2.0' })).toBe(true);
  });
  it('rejects garbage', () => {
    expect(looksLikeOpenApi(null)).toBe(false);
    expect(looksLikeOpenApi('a string')).toBe(false);
    expect(looksLikeOpenApi({ name: 'package.json content' })).toBe(false);
  });
});

describe('findSpecCandidates', () => {
  it('finds the canonical api/openapi.yaml location', () => {
    const repo = makeTmpRepo({
      'api/openapi.yaml': 'openapi: 3.0.0\ninfo: {title: x, version: 1}\npaths: {}\n',
    });
    const matches = findSpecCandidates(repo);
    expect(matches).toHaveLength(1);
    expect(matches[0].rel).toBe('api/openapi.yaml');
    expect(matches[0].valid).toBe(true);
  });

  it('returns multiple candidates in canonical order', () => {
    const repo = makeTmpRepo({
      'openapi.yaml':      'openapi: 3.0.0\npaths: {}\n',
      'api/openapi.yaml':  'openapi: 3.0.0\npaths: {}\n',
      'docs/openapi.yaml': 'openapi: 3.0.0\npaths: {}\n',
    });
    const rels = findSpecCandidates(repo).map(m => m.rel);
    expect(rels).toEqual(['api/openapi.yaml', 'openapi.yaml', 'docs/openapi.yaml']);
  });

  it('marks non-OpenAPI files as invalid but still lists them', () => {
    const repo = makeTmpRepo({
      'openapi.yaml': 'this:\n  is: not openapi\n',
    });
    const matches = findSpecCandidates(repo);
    expect(matches[0].valid).toBe(false);
  });

  it('returns empty for a repo with no spec', () => {
    const repo = makeTmpRepo({ 'README.md': 'hi' });
    expect(findSpecCandidates(repo)).toEqual([]);
  });
});

describe('detectServiceName', () => {
  it('reads package.json and strips @scope', () => {
    const repo = makeTmpRepo({
      'package.json': JSON.stringify({ name: '@acme/payment-service' }),
    });
    expect(detectServiceName(repo)).toEqual({ source: 'package.json', name: 'payment-service' });
  });

  it('falls through to pyproject.toml', () => {
    const repo = makeTmpRepo({
      'pyproject.toml': '[project]\nname = "billing"\nversion = "0.1.0"\n',
    });
    expect(detectServiceName(repo).source).toBe('pyproject.toml');
    expect(detectServiceName(repo).name).toBe('billing');
  });

  it('falls through to go.mod', () => {
    const repo = makeTmpRepo({
      'go.mod': 'module github.com/acme/orders\n\ngo 1.22\n',
    });
    expect(detectServiceName(repo).source).toBe('go.mod');
    expect(detectServiceName(repo).name).toBe('orders');
  });

  it('falls through to pom.xml', () => {
    const repo = makeTmpRepo({
      'pom.xml': '<project><artifactId>checkout-svc</artifactId></project>',
    });
    expect(detectServiceName(repo).source).toBe('pom.xml');
    expect(detectServiceName(repo).name).toBe('checkout-svc');
  });

  it('falls back to directory name when nothing matches', () => {
    const repo = makeTmpRepo({ 'README.md': 'no manifest here' });
    const r = detectServiceName(repo);
    expect(r.source).toBe('directory');
    expect(r.name).toBe(path.basename(repo));
  });
});

describe('suggestEnvironment', () => {
  it('main / master → production', () => {
    expect(suggestEnvironment('main')).toBe('production');
    expect(suggestEnvironment('master')).toBe('production');
  });
  it('feature branches → staging', () => {
    expect(suggestEnvironment('feat/payments')).toBe('staging');
    expect(suggestEnvironment(null)).toBe('staging');
  });
});

describe('detectAll', () => {
  it('produces a single combined snapshot', () => {
    const repo = makeTmpRepo({
      'package.json':     JSON.stringify({ name: 'payment-service' }),
      'api/openapi.yaml': 'openapi: 3.0.0\npaths: {}\n',
    });
    const r = detectAll(repo);
    expect(r.serviceName).toBe('payment-service');
    expect(r.spec).toBe('api/openapi.yaml');
    expect(r.specs).toHaveLength(1);
    expect(r.existing).toBe(false);
  });

  it('flags an existing .specshield.yml', () => {
    const repo = makeTmpRepo({
      'package.json':     JSON.stringify({ name: 'svc' }),
      '.specshield.yml':  'schemaVersion: 1\n',
    });
    expect(detectAll(repo).existing).toBe(true);
  });
});
