# SpecShield CLI

[![npm](https://img.shields.io/npm/v/specshield)](https://www.npmjs.com/package/specshield)
[![downloads](https://img.shields.io/npm/dw/specshield)](https://www.npmjs.com/package/specshield)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)
[![node](https://img.shields.io/badge/node-%3E%3D20-green)](https://nodejs.org)

---

> **OpenAPI Diff · Swagger Diff · API Breaking Change Detection · Contract Testing · Pact Alternative · API Governance · CI/CD API Validation · API Drift Detection**

---

## Stop Breaking APIs in Production

**SpecShield** detects breaking API changes and runs contract tests directly in your CI/CD pipeline —
before they become production incidents.

```
OpenAPI diff  +  contract testing  +  deployment gating  —  in one CLI.
```

No broker. No complex setup. Works in 30 seconds.

---

## The Problem

**APIs break silently. Your users feel it first.**

- A backend developer renames a field — the mobile app crashes for 10,000 users
- An endpoint gets removed — the frontend breaks with no error in your logs
- A required field changes — partner integrations start failing at 2am
- You only find out after a production incident, a 3am alert, or an angry customer

Manual code review doesn't catch this. Integration tests run too late.
**You need a contract between your services — and something that enforces it.**

---

## The Solution

Think of SpecShield as **unit tests for your API contracts**.

- The consumer declares what it expects from the provider
- The provider proves it satisfies those expectations before deploying
- SpecShield blocks the deployment if anything breaks

```
Consumer publishes contract  →  Provider verifies it  →  CI either passes or blocks
```

No runtime surprise. No production incident. No 3am page.

---

## 🎥 Demo

[![SpecShield Demo — API Breaking Change Detection & Contract Testing](https://img.youtube.com/vi/mugDyQQGqZw/maxresdefault.jpg)](https://www.youtube.com/watch?v=mugDyQQGqZw)

> Watch: Catching a breaking API change before it hits production — compare specs, publish contracts, verify providers, and gate deployments with `can-i-deploy`.

**CLI preview:**

![SpecShield CLI Demo](https://raw.githubusercontent.com/specshield26/specshield-cli/main/demo/specshield-demo.gif)

> `specshield compare payment-api-v1.yaml payment-api-v2.yaml --fail-on-breaking`

---

## See It in Action

```bash
$ specshield compare base.yaml target.yaml --fail-on-breaking

✖ BREAKING CHANGES DETECTED

  1. DELETE /users endpoint removed
  2. POST /payments — "amount" changed from optional to required
  3. GET /orders/{id} — "status" type changed: string → object

  Breaking changes : 3
  Modifications    : 1
  Additions        : 2

CI Result: FAILED  ·  Exit code: 1
```

**That 3-line output just saved you a production incident.**

And when everything is safe:

```bash
$ specshield compare base.yaml target.yaml --fail-on-breaking

✔ NO BREAKING CHANGES FOUND

  Breaking changes : 0
  Modifications    : 0
  Additions        : 3

CI Result: PASSED  ·  Exit code: 0
```

---

## Quick Start

No account. No login. No config file. Just run it.

```bash
npm install -g specshield
```

```bash
specshield compare base.yaml target.yaml --fail-on-breaking
```

That's it. Works with any OpenAPI 3.x YAML or JSON spec.

---

## 🚀 Create Your Free Account

**Unlock history, dashboards, contract testing, and team features.**

👉 **[Create free account at specshield.io](https://specshield.io)**

- ✅ No credit card required
- ✅ Takes less than 30 seconds
- ✅ GitHub and Google sign-in supported
- ✅ Local compare always free, forever

---

## Local vs Cloud

| Feature | Local (Free) | Cloud (specshield.io) |
|---|---|---|
| Compare two spec files | ✅ | ✅ |
| Breaking change detection | ✅ | ✅ |
| JSON / human output | ✅ | ✅ |
| Fail CI on breaking change | ✅ | ✅ |
| **Compare history & dashboard** | ❌ | ✅ |
| **Contract testing registry** | ❌ | ✅ |
| **can-i-deploy gating** | ❌ | ✅ |
| **Team collaboration** | ❌ | ✅ |
| **API drift trends** | ❌ | ✅ |

Local is great for getting started. Cloud is what your team ships with.

---

## A Real-World Story

> The `payment-service` team merged a change that renamed `status` to `paymentStatus`
> in the payment creation response. The `checkout-ui` team wasn't notified.
>
> Without SpecShield, this would have reached staging, broken checkout for every user,
> and triggered an incident at 2am.
>
> With SpecShield, the provider's CI ran `specshield contracts verify` against the
> consumer's published contract. The mismatch was caught immediately:
>
> ```
> ● MISSING_FIELD at $.status
>   expected: "CREATED"  →  actual: null
> ```
>
> `can-i-deploy` returned exit code `1`. The broken build never deployed.
> **Zero users affected.**

---

## Use Cases

**Pull Request Validation**
Catch breaking changes before they're merged. Run `specshield compare` against your base branch on every PR.

**CI/CD Gating**
Fail the build automatically when a breaking change is detected. Exit code `1` triggers your pipeline to stop.

**Microservices Contract Safety**
Consumer teams publish what they expect. Provider teams verify they deliver it. No cross-team surprises.

**API Governance**
Track API drift over time across your entire platform. Know what changed, when, and which team changed it.

---

## vs. Alternatives

| Feature | SpecShield | Pact | openapi-diff |
|---|---|---|---|
| OpenAPI / Swagger native | ✅ | ❌ (code-level) | ✅ |
| No broker required | ✅ | ❌ (needs Pact Broker) | ✅ |
| Contract testing | ✅ | ✅ | ❌ |
| Breaking change detection | ✅ | ❌ | ✅ |
| can-i-deploy gating | ✅ | ✅ (via broker) | ❌ |
| Hosted dashboard | ✅ | ✅ (Pactflow, paid) | ❌ |
| Team collaboration | ✅ | ✅ (paid) | ❌ |
| CLI-first workflow | ✅ | ❌ | ✅ |
| Free hosted tier | ✅ | ❌ | N/A |

---

## Pricing

| Plan | Price | What's included |
|---|---|---|
| **Free** | $0 forever | Local compare, unlimited. Cloud: compare history, API keys, dashboard |
| **Pro** | Coming soon | Team collaboration, advanced reporting, priority support |

No credit card ever required for the free plan.
**[Get started free →](https://specshield.io)**

---

## Login & Authentication

**Step 1 — Create your account**

Go to [https://specshield.io](https://specshield.io) · Sign in with GitHub or Google (30 seconds)

**Step 2 — Generate an API key**

Dashboard → **API Keys** → **Generate Key** · Copy the `ss_` token

**Step 3 — Authenticate the CLI**

```bash
specshield login --api-key ss_your_token_here
```

```
✔ Logged in successfully.
  Customer : Your Name
  Plan     : FREE
```

Done. Your token is stored in `~/.specshield/config.json` — no need to pass it on every command.

**Or use an environment variable (recommended for CI):**

```bash
export SPECSHIELD_API_KEY=ss_your_token_here
```

Token resolution order: `--api-key flag` → `SPECSHIELD_API_KEY` env var → stored config → `.specshield.yml`

---

## Local Compare

No account needed.

```bash
# Basic compare
specshield compare base.yaml target.yaml

# Fail CI on breaking changes
specshield compare base.yaml target.yaml --fail-on-breaking

# JSON output
specshield compare base.yaml target.yaml --json

# Save to file
specshield compare base.yaml target.yaml --output result.json

# Ignore a specific change
specshield compare base.yaml target.yaml --ignore "DELETE /admin removed" --fail-on-breaking
```

---

## Remote Compare

Sends your specs to SpecShield and stores results in your dashboard.
Requires a free account and API key.

```bash
# Remote compare
specshield compare base.yaml target.yaml --remote

# Remote + fail on breaking
specshield compare base.yaml target.yaml --remote --fail-on-breaking

# Remote + JSON output saved to file
specshield compare base.yaml target.yaml --remote --json --output result.json
```

---

## Contract Testing

Consumer-driven contract testing for microservices — without a broker.

**How it works:**

1. Consumer team publishes a contract (what they expect from the provider)
2. Provider team verifies their service satisfies it
3. `can-i-deploy` gates the deployment based on verification results

### Contract File Format

```json
{
  "consumer": { "name": "checkout-ui", "version": "2.0.0" },
  "provider": { "name": "payment-service" },
  "orgKey": "acme-store",
  "contractName": "create-payment",
  "contractType": "HTTP",
  "interactions": [
    {
      "description": "checkout-ui creates a payment",
      "request": {
        "method": "POST",
        "path": "/payments",
        "headers": { "Content-Type": "application/json" },
        "body": { "orderId": "ORD-123", "amount": 1299, "currency": "INR" }
      },
      "expectedResponse": {
        "status": 201,
        "headers": { "Content-Type": "application/json" },
        "body": { "paymentId": "PAY-123", "status": "CREATED" }
      }
    }
  ]
}
```

### Publish a Contract

```bash
specshield contracts publish \
  --file ./contracts/create-payment.json \
  --org acme-store \
  --consumer-version 2.0.0 \
  --tag main
```

### Verify a Contract

```bash
specshield contracts verify \
  --contract-id 42 \
  --base-url http://localhost:8080 \
  --provider-version v2.1.0 \
  --env staging
```

Pass output:
```
  ✔  Verification PASSED  (1/1 interactions)
```

Fail output:
```
  ✖  Verification FAILED  (0/1 interactions passed, 1 failed)

  Mismatches
  ● [create payment] MISSING_FIELD at $.status
    expected: "CREATED"  →  actual: null
```

### Can I Deploy?

```bash
specshield contracts can-i-deploy \
  --provider payment-service \
  --version v2.1.0 \
  --env staging
```

```
  ✔  PASS: payment-service v2.1.0 is deployable in staging
```
```
  ✖  FAIL: payment-service v2.1.0 is NOT deployable in staging
```

Exit codes: `0` = deployable · `1` = blocked · `2` = error

### List and Inspect Contracts

```bash
specshield contracts list --provider payment-service
specshield contracts latest --consumer checkout-ui --provider payment-service --json
specshield contracts history --contract-id 42
```

### Full Workflow

```bash
# 1. Consumer publishes contract
specshield contracts publish --file ./contracts/create-payment.json --org acme-store

# 2. Provider verifies it
specshield contracts verify --contract-id 42 --base-url http://localhost:8080 --provider-version v2.1.0

# 3. Gate the deployment
specshield contracts can-i-deploy --provider payment-service --version v2.1.0
```

---

## CI/CD — GitHub Actions

### On Pull Request — Catch breaking changes before merge

```yaml
name: API Contract Check

on:
  pull_request:
    branches: [main]

jobs:
  check-api-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g specshield
      - name: Get base spec
        run: git show origin/main:api/openapi.yaml > /tmp/base.yaml
      - name: Compare specs
        run: specshield compare /tmp/base.yaml api/openapi.yaml --fail-on-breaking
```

### On Push — Publish consumer contract

```yaml
name: Publish Contract

on:
  push:
    branches: [main]
    paths:
      - 'contracts/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g specshield
      - name: Publish contract
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield contracts publish \
            --file ./contracts/create-payment.json \
            --org acme-store \
            --tag ${{ github.ref_name }}
```

### On Push — Verify provider + gate deployment

```yaml
name: Contract Verification

on:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g specshield
      - name: Verify contract
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield contracts verify \
            --contract-id ${{ vars.CONTRACT_ID }} \
            --base-url http://localhost:8080 \
            --provider-version ${{ github.sha }} \
            --env staging
      - name: Can I deploy?
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield contracts can-i-deploy \
            --provider payment-service \
            --version ${{ github.sha }} \
            --env staging
```

---

## Config File

Create `.specshield.yml` in your project root:

```yaml
failOnBreaking: true
severity: error

ignore:
  - "DELETE /admin removed"

remote:
  enabled: false
  url: "https://specshield.io/compare"
  timeout: 10000
  # apiKey: ""  ← use env var instead
```

CLI flags always override config file values.

---

## All Options

```bash
specshield compare <base> <target> [options]
```

| Option | Description |
|---|---|
| `--remote` | Use the SpecShield hosted API |
| `--api-key <key>` | API token |
| `--fail-on-breaking` | Exit code 1 on breaking changes |
| `--allow-breaking` | Override fail-on-breaking |
| `--json` | Machine-readable JSON output |
| `--output <file>` | Save result to file |
| `--ignore <change>` | Ignore a specific change (repeatable) |
| `--severity <level>` | `info` / `warning` / `error` |
| `--config <path>` | Path to `.specshield.yml` |
| `--timeout <ms>` | Request timeout for remote mode |

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Clean — no breaking changes |
| `1` | Breaking changes found with `--fail-on-breaking` |
| `2` | Config error, missing token, or runtime error |

---

## License

MIT © Deepak Satyam

---

## Support

Questions or issues?

- 📧 [admin@specshield.io](mailto:admin@specshield.io)
- 🐛 [Open an issue on GitHub](https://github.com/specshield26/specshield-cli/issues)
- 🌐 [specshield.io](https://specshield.io)

---

<div align="center">

**[⭐ Star on GitHub](https://github.com/specshield26/specshield-cli) · [📦 View on npm](https://www.npmjs.com/package/specshield) · [🚀 Create free account](https://specshield.io)**

*Stop finding out about API breakage from your users.*

</div>
