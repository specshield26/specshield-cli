'use strict';

const { formatJson, formatHuman } = require('../src/core/outputFormatter');

const sampleResult = {
  breakingChanges: [{ type: 'ENDPOINT_REMOVED', path: '/users', method: 'delete', description: 'DELETE /users was removed', field: null, oldValue: null, newValue: null }],
  additions: [{ type: 'ENDPOINT_ADDED', path: '/orders', method: 'post', description: 'POST /orders was added', field: null, oldValue: null, newValue: null }],
  modifications: [],
  warnings: [],
};

describe('formatJson', () => {
  test('returns correct summary counts', () => {
    const output = formatJson(sampleResult);
    expect(output.summary.breaking).toBe(1);
    expect(output.summary.additions).toBe(1);
    expect(output.summary.modifications).toBe(0);
    expect(output.summary.warnings).toBe(0);
  });

  test('includes all change arrays', () => {
    const output = formatJson(sampleResult);
    expect(Array.isArray(output.breakingChanges)).toBe(true);
    expect(Array.isArray(output.additions)).toBe(true);
    expect(Array.isArray(output.modifications)).toBe(true);
    expect(Array.isArray(output.warnings)).toBe(true);
  });

  test('output is stable JSON', () => {
    const output = formatJson(sampleResult);
    expect(() => JSON.stringify(output)).not.toThrow();
  });
});

describe('formatHuman', () => {
  test('contains BREAKING CHANGES section when present', () => {
    const output = formatHuman(sampleResult);
    expect(output).toContain('BREAKING CHANGES');
  });

  test('contains ADDITIONS section when present', () => {
    const output = formatHuman(sampleResult);
    expect(output).toContain('ADDITIONS');
  });

  test('shows no-changes message when empty', () => {
    const empty = { breakingChanges: [], additions: [], modifications: [], warnings: [] };
    const output = formatHuman(empty);
    expect(output).toContain('No changes detected');
  });
});
