'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { loadSpec } = require('../src/core/loadSpec');

describe('loadSpec - success', () => {
  test('loads a valid YAML fixture', async () => {
    const fixture = path.join(__dirname, '..', 'fixtures', 'spec-v1.yaml');
    const content = await loadSpec(fixture);
    expect(typeof content).toBe('string');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  test('loads a valid JSON fixture', async () => {
    const fixture = path.join(__dirname, '..', 'fixtures', 'spec-v1.json');
    const content = await loadSpec(fixture);
    expect(typeof content).toBe('string');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('resolves relative paths to absolute', async () => {
    const fixture = path.join(__dirname, '..', 'fixtures', 'spec-v1.yaml');
    const content = await loadSpec(fixture);
    expect(content).toBeTruthy();
  });
});

describe('loadSpec - errors', () => {
  test('throws when file does not exist', async () => {
    await expect(loadSpec('/nonexistent/path/spec.yaml')).rejects.toThrow('Spec file not found');
  });

  test('throws when path is a directory', async () => {
    const dir = path.join(__dirname, '..', 'fixtures');
    await expect(loadSpec(dir)).rejects.toThrow('Path is not a file');
  });

  test('throws when file is empty', async () => {
    const p = path.join(os.tmpdir(), 'empty-spec.yaml');
    fs.writeFileSync(p, '   ');
    await expect(loadSpec(p)).rejects.toThrow('Spec file is empty');
    fs.unlinkSync(p);
  });

  test('throws when file contains only whitespace/newlines', async () => {
    const p = path.join(os.tmpdir(), 'whitespace-spec.yaml');
    fs.writeFileSync(p, '\n\n\n');
    await expect(loadSpec(p)).rejects.toThrow('Spec file is empty');
    fs.unlinkSync(p);
  });
});
