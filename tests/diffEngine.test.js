'use strict';

const { diffSpecs } = require('../src/core/diffEngine');
const { normalizeSpec } = require('../src/core/normalizeSpec');
const { classifyChanges, filterBySeverity } = require('../src/core/classifyChanges');
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

describe('diffEngine - array items', () => {
  test('detects array item type change in response', () => {
    const base = normalizeSpec({
      paths: {
        '/items': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { type: 'array', items: { type: 'integer' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const target = normalizeSpec({
      paths: {
        '/items': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const diffs = diffSpecs(base, target);
    expect(
      diffs.some(
        (d) => d.type === 'RESPONSE_FIELD_TYPE_CHANGED' && d.field.includes('[items]')
      )
    ).toBe(true);
  });

  test('detects array item type change in request body', () => {
    const base = normalizeSpec({
      paths: {
        '/batch': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
    const target = normalizeSpec({
      paths: {
        '/batch': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'array', items: { type: 'integer' } },
                },
              },
            },
            responses: {},
          },
        },
      },
    });
    const diffs = diffSpecs(base, target);
    expect(
      diffs.some(
        (d) => d.type === 'REQUEST_FIELD_TYPE_CHANGED' && d.field.includes('[items]')
      )
    ).toBe(true);
  });

  test('detects removed field inside array item object', () => {
    const makeSpec = (props) =>
      normalizeSpec({
        paths: {
          '/list': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { type: 'object', properties: props },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    const base = makeSpec({ id: { type: 'integer' }, name: { type: 'string' } });
    const target = makeSpec({ id: { type: 'integer' } });
    const diffs = diffSpecs(base, target);
    expect(
      diffs.some(
        (d) => d.type === 'RESPONSE_FIELD_REMOVED' && d.field.includes('name')
      )
    ).toBe(true);
  });
});

describe('classifyChanges', () => {
  test('classifies ENDPOINT_REMOVED as breaking with severity error', () => {
    const diffs = [{ type: 'ENDPOINT_REMOVED', path: '/x', method: 'get', description: 'removed' }];
    const result = classifyChanges(diffs);
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.breakingChanges[0].severity).toBe('error');
    expect(result.additions).toHaveLength(0);
  });

  test('classifies ENDPOINT_ADDED as addition with severity info', () => {
    const diffs = [{ type: 'ENDPOINT_ADDED', path: '/x', method: 'get', description: 'added' }];
    const result = classifyChanges(diffs);
    expect(result.additions).toHaveLength(1);
    expect(result.additions[0].severity).toBe('info');
    expect(result.breakingChanges).toHaveLength(0);
  });

  test('classifies FIELD_BECAME_OPTIONAL as modification with severity warning', () => {
    const diffs = [{ type: 'FIELD_BECAME_OPTIONAL', path: '/x', method: 'get', description: 'optional' }];
    const result = classifyChanges(diffs);
    expect(result.modifications).toHaveLength(1);
    expect(result.modifications[0].severity).toBe('warning');
  });
});

describe('filterBySeverity', () => {
  function mixedResult() {
    return classifyChanges([
      { type: 'ENDPOINT_REMOVED', path: '/x', method: 'delete', description: 'breaking' },
      { type: 'FIELD_BECAME_OPTIONAL', path: '/x', method: 'get', description: 'warning' },
      { type: 'ENDPOINT_ADDED', path: '/y', method: 'get', description: 'info' },
    ]);
  }

  test('info shows all changes', () => {
    const result = filterBySeverity(mixedResult(), 'info');
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.modifications).toHaveLength(1);
    expect(result.additions).toHaveLength(1);
  });

  test('warning hides info-level additions', () => {
    const result = filterBySeverity(mixedResult(), 'warning');
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.modifications).toHaveLength(1);
    expect(result.additions).toHaveLength(0);
  });

  test('error shows only breaking changes', () => {
    const result = filterBySeverity(mixedResult(), 'error');
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.modifications).toHaveLength(0);
    expect(result.additions).toHaveLength(0);
  });
});
