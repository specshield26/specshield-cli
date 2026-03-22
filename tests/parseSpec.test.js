'use strict';

const { parseSpec, parseJson, parseYaml } = require('../src/core/parseSpec');

describe('parseSpec', () => {
  test('parses valid JSON spec', () => {
    const content = JSON.stringify({ openapi: '3.0.0', info: { title: 'Test', version: '1.0' }, paths: {} });
    const result = parseSpec(content, 'spec.json');
    expect(result.openapi).toBe('3.0.0');
  });

  test('parses valid YAML spec', () => {
    const content = `openapi: "3.0.0"\ninfo:\n  title: Test\n  version: "1.0"\npaths: {}`;
    const result = parseSpec(content, 'spec.yaml');
    expect(result.openapi).toBe('3.0.0');
  });

  test('auto-detects JSON without extension', () => {
    const content = JSON.stringify({ openapi: '3.0.0', paths: {} });
    const result = parseSpec(content, 'specfile');
    expect(result.openapi).toBe('3.0.0');
  });

  test('auto-detects YAML without extension', () => {
    const content = `openapi: "3.0.0"\npaths: {}`;
    const result = parseSpec(content, 'specfile');
    expect(result.openapi).toBe('3.0.0');
  });

  test('throws on invalid JSON', () => {
    expect(() => parseSpec('{invalid json}', 'spec.json')).toThrow();
  });

  test('throws on invalid YAML', () => {
    expect(() => parseSpec('key: [invalid', 'spec.yaml')).toThrow();
  });
});
