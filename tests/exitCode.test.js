'use strict';

const { resolveExitCode } = require('../src/core/exitCode');

const noChanges = { breakingChanges: [], additions: [], modifications: [], warnings: [] };
const withBreaking = { breakingChanges: [{ description: 'something removed' }], additions: [], modifications: [], warnings: [] };

describe('resolveExitCode', () => {
  test('returns 0 when no breaking changes', () => {
    expect(resolveExitCode(noChanges, { failOnBreaking: true })).toBe(0);
  });

  test('returns 1 when breaking changes and failOnBreaking=true', () => {
    expect(resolveExitCode(withBreaking, { failOnBreaking: true, allowBreaking: false })).toBe(1);
  });

  test('returns 0 when breaking changes but failOnBreaking=false', () => {
    expect(resolveExitCode(withBreaking, { failOnBreaking: false })).toBe(0);
  });

  test('returns 0 when breaking changes but allowBreaking=true overrides', () => {
    expect(resolveExitCode(withBreaking, { failOnBreaking: true, allowBreaking: true })).toBe(0);
  });
});
