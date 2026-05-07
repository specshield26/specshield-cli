'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const yaml = require('js-yaml');

const {
  render,
  writeProjectConfig,
  renderWorkflow,
} = require('../src/core/configWriter');

describe('render()', () => {
  it('emits a header and the schemaVersion key', () => {
    const out = render({});
    expect(out).toMatch(/^# \.specshield\.yml/);
    expect(out).toMatch(/^schemaVersion: 1$/m);
    expect(out).toMatch(/^failOnBreaking: true$/m);
  });

  it('round-trips through js-yaml without losing structure', () => {
    const cfg = {
      schemaVersion: 1, failOnBreaking: true, severity: 'error',
      bdct: {
        org: 'acme-pay', environment: 'staging',
        provider: { name: 'payment-service', spec: 'api/openapi.yaml', branch: 'main' },
      },
      github: { specPath: 'api/openapi.yaml', failOnBreaking: true, commentOnPr: true },
    };
    const out = render(cfg);
    const parsed = yaml.load(out);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.bdct.org).toBe('acme-pay');
    expect(parsed.bdct.provider.spec).toBe('api/openapi.yaml');
    expect(parsed.github.specPath).toBe('api/openapi.yaml');
  });

  it('omits the bdct section when not provided', () => {
    const out = render({ schemaVersion: 1 });
    expect(out).not.toMatch(/^bdct:/m);
  });

  it('emits both provider and consumer sections when "both"', () => {
    const out = render({
      bdct: {
        org: 'x',
        provider: { name: 'p', spec: 'a.yaml' },
        consumer: { name: 'c', provider: 'p', contract: 'c.yaml', format: 'OPENAPI' },
      },
    });
    const parsed = yaml.load(out);
    expect(parsed.bdct.provider).toBeDefined();
    expect(parsed.bdct.consumer).toBeDefined();
    expect(parsed.bdct.consumer.format).toBe('OPENAPI');
  });

  it('quotes values that need it (URLs, special chars)', () => {
    const out = render({ bdct: { server: 'https://staging.example.com', org: 'x' } });
    expect(out).toMatch(/server: https:\/\/staging\.example\.com/);
  });

  it('always ends with exactly one newline', () => {
    const out = render({});
    expect(out.endsWith('\n')).toBe(true);
    expect(out.endsWith('\n\n')).toBe(false);
  });

  it('omits server when it is the default specshield.io', () => {
    const out = render({ bdct: { server: 'https://specshield.io', org: 'x' } });
    expect(out).not.toMatch(/^\s*server:/m);
  });
});

describe('writeProjectConfig()', () => {
  it('writes a file at <cwd>/.specshield.yml that parses cleanly', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-write-'));
    const target = writeProjectConfig({
      schemaVersion: 1,
      bdct: { org: 'acme', environment: 'prod', provider: { name: 's', spec: 'a.yaml' } },
    }, tmp);
    expect(target).toBe(path.join(tmp, '.specshield.yml'));
    const parsed = yaml.load(fs.readFileSync(target, 'utf8'));
    expect(parsed.bdct.org).toBe('acme');
  });
});

describe('renderWorkflow()', () => {
  it('emits a publish-provider job for kind=provider', () => {
    const out = renderWorkflow({ kind: 'provider', providerName: 'payment-service' });
    expect(out).toMatch(/publish-provider:/);
    expect(out).toMatch(/provider: payment-service/);
    expect(out).not.toMatch(/publish-consumer:/);
    expect(out).toMatch(/specshield26\/bdct-action@v1/);
  });

  it('emits a publish-consumer job for kind=consumer', () => {
    const out = renderWorkflow({
      kind: 'consumer', consumerName: 'checkout-ui', providerForConsumer: 'payment-service',
    });
    expect(out).toMatch(/publish-consumer:/);
    expect(out).toMatch(/consumer: checkout-ui/);
    expect(out).toMatch(/provider: payment-service/);
    expect(out).not.toMatch(/publish-provider:/);
  });

  it('emits both jobs for kind=both', () => {
    const out = renderWorkflow({
      kind: 'both', providerName: 'svc', consumerName: 'svc-consumer', providerForConsumer: 'other',
    });
    expect(out).toMatch(/publish-provider:/);
    expect(out).toMatch(/publish-consumer:/);
  });
});
