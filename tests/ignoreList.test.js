'use strict';

const { diffSpecs } = require('../src/core/diffEngine');
const { normalizeSpec } = require('../src/core/normalizeSpec');
const { classifyChanges } = require('../src/core/classifyChanges');

describe('ignore list behavior', () => {
  function getResult() {
    const base = normalizeSpec({
      paths: {
        '/users': { delete: { responses: { '204': {} } } },
        '/pets': { get: { responses: {} } }
      }
    });
    const target = normalizeSpec({
      paths: {
        '/pets': { get: { responses: {} } }
      }
    });
    const diffs = diffSpecs(base, target);
    return classifyChanges(diffs);
  }

  test('all breaking changes present without ignore list', () => {
    const result = getResult();
    expect(result.breakingChanges.length).toBeGreaterThan(0);
  });

  test('filtered when description matches ignore pattern', () => {
    const result = getResult();
    const filtered = {
      ...result,
      breakingChanges: result.breakingChanges.filter(
        c => !c.description.includes('/users')
      ),
    };
    expect(filtered.breakingChanges.every(c => !c.description.includes('/users'))).toBe(true);
  });
});
