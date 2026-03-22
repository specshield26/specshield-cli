'use strict';

const { diffSpecs } = require('../src/core/diffEngine');
const { normalizeSpec } = require('../src/core/normalizeSpec');
const { classifyChanges } = require('../src/core/classifyChanges');
const { parseSpec } = require('../src/core/parseSpec');
const fs = require('fs');
const path = require('path');

function loadFixture(name) {
  const filePath = path.join(__dirname, '..', 'fixtures', name);
  const content = fs.readFileSync(filePath, 'utf8');
  return normalizeSpec(parseSpec(content, filePath));
}

describe('diffEngine - endpoint changes', () => {
  test('detects removed endpoint', () => {
    const base = normalizeSpec({
      paths: { '/users': { delete: { responses: { '204': {} } } } }
    });
    const target = normalizeSpec({ paths: {} });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'ENDPOINT_REMOVED' && d.path === '/users')).toBe(true);
  });

  test('detects added endpoint', () => {
    const base = normalizeSpec({ paths: {} });
    const target = normalizeSpec({
      paths: { '/orders': { post: { responses: { '201': {} } } } }
    });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'ENDPOINT_ADDED' && d.path === '/orders')).toBe(true);
  });

  test('detects removed HTTP method', () => {
    const base = normalizeSpec({
      paths: { '/pets': { get: { responses: {} }, post: { responses: {} } } }
    });
    const target = normalizeSpec({
      paths: { '/pets': { get: { responses: {} } } }
    });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'METHOD_REMOVED' && d.method === 'post')).toBe(true);
  });
});

describe('diffEngine - field changes', () => {
  test('detects type change in response field', () => {
    const base = normalizeSpec({
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { id: { type: 'integer' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const target = normalizeSpec({
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { id: { type: 'string' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'RESPONSE_FIELD_TYPE_CHANGED' && d.field.includes('id'))).toBe(true);
  });

  test('detects required field added to request body', () => {
    const base = normalizeSpec({
      paths: {
        '/pets': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name'],
                    properties: { name: { type: 'string' } }
                  }
                }
              }
            },
            responses: {}
          }
        }
      }
    });
    const target = normalizeSpec({
      paths: {
        '/pets': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name', 'tag'],
                    properties: {
                      name: { type: 'string' },
                      tag: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: {}
          }
        }
      }
    });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'REQUEST_REQUIRED_FIELD_ADDED')).toBe(true);
  });

  test('detects removed response field', () => {
    const base = normalizeSpec({
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { id: { type: 'integer' }, email: { type: 'string' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const target = normalizeSpec({
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { id: { type: 'integer' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'RESPONSE_FIELD_REMOVED' && d.field.includes('email'))).toBe(true);
  });
});

describe('diffEngine - fixtures', () => {
  test('detects expected changes between spec-v1.yaml and spec-v2.yaml', () => {
    const base = loadFixture('spec-v1.yaml');
    const target = loadFixture('spec-v2.yaml');
    const diffs = diffSpecs(base, target);
    const result = classifyChanges(diffs);

    // /users DELETE was removed → breaking
    expect(result.breakingChanges.some(c => c.description.includes('/users'))).toBe(true);

    // /orders POST was added → addition
    expect(result.additions.some(c => c.path === '/orders')).toBe(true);

    // 404 response removed from GET /pets/{petId} → breaking
    expect(result.breakingChanges.some(c => c.description.includes('404'))).toBe(true);
  });

  test('detects type changes between JSON fixtures', () => {
    const base = loadFixture('spec-v1.json');
    const target = loadFixture('spec-v2.json');
    const diffs = diffSpecs(base, target);
    expect(diffs.some(d => d.type === 'RESPONSE_FIELD_TYPE_CHANGED' && d.field.includes('id'))).toBe(true);
  });
});

describe('classifyChanges', () => {
  test('classifies ENDPOINT_REMOVED as breaking', () => {
    const diffs = [{ type: 'ENDPOINT_REMOVED', path: '/x', method: 'get', description: 'removed' }];
    const result = classifyChanges(diffs);
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.additions).toHaveLength(0);
  });

  test('classifies ENDPOINT_ADDED as addition', () => {
    const diffs = [{ type: 'ENDPOINT_ADDED', path: '/x', method: 'get', description: 'added' }];
    const result = classifyChanges(diffs);
    expect(result.additions).toHaveLength(1);
    expect(result.breakingChanges).toHaveLength(0);
  });
});
