# SpecShield CLI

[![npm](https://img.shields.io/npm/v/specshield)](https://www.npmjs.com/package/specshield)
[![downloads](https://img.shields.io/npm/dw/specshield)](https://www.npmjs.com/package/specshield)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)
[![node](https://img.shields.io/badge/node-%3E%3D20-green)](https://nodejs.org)

---

> **OpenAPI Diff · API Breaking Change Detection · Swagger Diff · Consumer-Driven Contract Testing · Pact Alternative · can-i-deploy · Bi-Directional Contract Testing · GitHub PR Checks · CI/CD**

---

## Stop Breaking APIs in Production

**SpecShield** detects breaking API changes, runs contract tests, and gates deployments — directly in your CI/CD pipeline before they become production incidents.

```
OpenAPI diff  +  contract testing  +  bi-directional contracts  +  GitHub PR checks  —  in one CLI.
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

| Feature | Local (Free) | Cloud Free | Cloud Pro |
|---|---|---|---|
| Compare two spec files | ✅ | ✅ | ✅ |
| Breaking change detection | ✅ | ✅ | ✅ |
| JSON / human output | ✅ | ✅ | ✅ |
| Fail CI on breaking change | ✅ | ✅ | ✅ |
| **Compare history & dashboard** | ❌ | ✅ | ✅ |
| **CDCT contract testing registry** | ❌ | ✅ | ✅ |
| **CDCT can-i-deploy gating** | ❌ | ✅ | ✅ |
| **GitHub App PR checks** | ❌ | ✅ | ✅ |
| **BDCT bi-directional contracts** | ❌ | ❌ | ✅ |
| **BDCT can-i-deploy gating** | ❌ | ❌ | ✅ |
| **BDCT compatibility matrix** | ❌ | ❌ | ✅ |
| **Team collaboration** | ❌ | ❌ | ✅ |
| **API drift trends** | ❌ | ✅ | ✅ |

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

| Feature | SpecShield | Pact / Pactflow | openapi-diff |
|---|---|---|---|
| OpenAPI / Swagger native | ✅ | ❌ (code-level) | ✅ |
| No broker required | ✅ | ❌ (needs Pact Broker) | ✅ |
| Consumer-driven contract testing | ✅ | ✅ | ❌ |
| **Bi-directional contract testing** | ✅ | ✅ (Pactflow paid) | ❌ |
| Breaking change detection | ✅ | ❌ | ✅ |
| can-i-deploy gating | ✅ | ✅ (via broker) | ❌ |
| **GitHub App PR checks** | ✅ | ❌ | ❌ |
| **Pact JSON contract import** | ✅ | ✅ | ❌ |
| Hosted dashboard | ✅ | ✅ (Pactflow, paid) | ❌ |
| Team collaboration | ✅ | ✅ (paid) | ❌ |
| CLI-first workflow | ✅ | ❌ | ✅ |
| Free hosted tier | ✅ | ❌ | N/A |

---

## Pricing

| Plan | Price | What's included |
|---|---|---|
| **Free** | $0 forever | Local compare (unlimited) · Compare history & dashboard · CDCT contracts & can-i-deploy · GitHub App PR checks |
| **Pro** | Coming soon | Everything in Free + BDCT bi-directional contracts · BDCT can-i-deploy & matrix · Team collaboration · Advanced reporting · Priority support |

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

## GitHub Integration

**Automatic API contract checks on every pull request — no workflow YAML required.**

Install the SpecShield GitHub App once and every PR that touches your OpenAPI spec gets:
- A GitHub check run (pass/fail) visible directly on the PR
- A PR comment with the full diff table — breaking changes highlighted in red
- Configurable `fail-on-breaking` per repository

### Install the GitHub App

1. Go to **Dashboard → GitHub Integration** at [specshield.io](https://specshield.io)
2. Click **Install GitHub App**
3. Choose the repositories to enable (or select all)
4. Done — no secrets, no workflow changes needed

### How It Works

When a PR is opened or updated, SpecShield:

1. Fetches the OpenAPI spec from the base branch and the PR branch
2. Runs the same diff engine as `specshield compare`
3. Posts a GitHub check run — **Passed** if no breaking changes, **Failed** if breaking changes found
4. Adds a PR comment with the full breakdown:

```
## SpecShield API Contract Check

| Change | Type | Severity |
|--------|------|----------|
| POST /payments — "amount" required field added | Request schema | BREAKING |
| GET /orders/{id} — "status" type changed | Response schema | BREAKING |
| GET /users — new query param "filter" | Addition | NON-BREAKING |

Breaking changes: 2 · Non-breaking: 1
```

### Configure Per Repository

Add a `.specshield.yml` to your repo root:

```yaml
github:
  specPath: api/openapi.yaml   # path to your spec (default: openapi.yaml)
  failOnBreaking: true         # block PR merge on breaking changes (default: true)
  commentOnPr: true            # post breakdown comment (default: true)
```

### Requirements

- The spec file must exist on both the base branch and the PR branch
- Supported formats: OpenAPI 3.x YAML or JSON
- The GitHub App needs `pull_requests: write` and `checks: write` permissions (granted during install)

---

## Contract Testing (CDCT)

Consumer-driven contract testing for microservices — without a broker.

**How it works:**

1. Consumer team publishes a contract (what they expect from the provider)
2. Provider team verifies their service satisfies it by actually calling it
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

### Full CDCT Workflow

```bash
# 1. Consumer publishes contract
specshield contracts publish --file ./contracts/create-payment.json --org acme-store

# 2. Provider verifies it
specshield contracts verify --contract-id 42 --base-url http://localhost:8080 --provider-version v2.1.0

# 3. Gate the deployment
specshield contracts can-i-deploy --provider payment-service --version v2.1.0
```

---

## Bi-Directional Contract Testing (BDCT)

**Spec-to-spec contract testing — no running services required.**

BDCT is the static alternative to CDCT. Instead of running the provider server, both sides publish their OpenAPI specs. SpecShield compares them and flags mismatches immediately — ideal for teams that don't run services locally or in CI.

> BDCT requires a **Pro plan**. [Upgrade at specshield.io/upgrade](https://specshield.io/upgrade)

**CDCT vs BDCT:**

| | CDCT | BDCT |
|---|---|---|
| How verification works | Replay requests against a live server | Compare OpenAPI specs statically |
| Provider needs to run | Yes | No |
| Feedback speed | After deploy to test env | Immediately on spec publish |
| Pact JSON contracts | Supported | Supported (auto-converted) |
| Best for | Runtime correctness | Early spec-level safety |

### How BDCT Works

1. Consumer team publishes an OpenAPI spec subset (the endpoints they use)
2. Provider team publishes their full OpenAPI spec
3. SpecShield compares them: endpoint presence, request schemas, response fields, status codes, types
4. `can-i-deploy` gates the deployment — returns `0` only when all consumers are compatible

### Publish a Provider Spec

```bash
specshield bdct publish-provider \
  --org acme-store \
  --provider payment-service \
  --version v2.1.0 \
  --spec ./api/openapi.yaml \
  --env production
```

```
  ✔  Provider spec published
     Provider  : payment-service
     Version   : v2.1.0
     Env       : production
     Auto-verifications triggered: 3
```

### Publish a Consumer Contract

The consumer contract is an OpenAPI spec that describes only the endpoints the consumer uses:

```yaml
# consumer-contract.yaml — only the subset checkout-ui uses
openapi: "3.0.0"
info:
  title: checkout-ui → payment-service contract
  version: "1.0.0"
paths:
  /payments:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [orderId, amount, currency]
              properties:
                orderId: { type: string }
                amount:  { type: number }
                currency: { type: string }
      responses:
        "201":
          content:
            application/json:
              schema:
                type: object
                properties:
                  paymentId: { type: string }
                  status:    { type: string }
```

```bash
specshield bdct publish-consumer \
  --org acme-store \
  --consumer checkout-ui \
  --provider payment-service \
  --version 2.0.0 \
  --contract ./contracts/checkout-ui-payment.yaml
```

```
  ✔  Consumer contract published
     Consumer    : checkout-ui @ 2.0.0
     Provider    : payment-service
     Compatibility: COMPATIBLE
```

If the provider spec is already published, compatibility is checked immediately.

**Pact JSON contracts are also accepted** — SpecShield auto-converts them:

```bash
specshield bdct publish-consumer \
  --org acme-store \
  --consumer checkout-ui \
  --provider payment-service \
  --version 2.0.0 \
  --contract ./pacts/checkout-ui-payment-service.json
```

### Verify Compatibility

Manually trigger a verification between a specific consumer/provider pair:

```bash
specshield bdct verify \
  --org acme-store \
  --consumer checkout-ui \
  --consumer-version 2.0.0 \
  --provider payment-service \
  --provider-version v2.1.0 \
  --env production
```

Compatible output:
```
  ✔  COMPATIBLE

  Endpoints checked: 2
  Compatible       : 2
  Incompatible     : 0
```

Incompatible output:
```
  ✖  INCOMPATIBLE

  Endpoints checked: 2
  Compatible       : 1
  Incompatible     : 1

  Issues
  ● POST /payments [ERROR] RESPONSE_FIELD_MISSING
    field: $.status
    Consumer expects it — provider spec does not return it

  ● GET /payments/{id} [WARNING] TYPE_MISMATCH
    field: $.amount
    consumer: integer  →  provider: string
```

### Can I Deploy? (BDCT)

```bash
specshield bdct can-i-deploy \
  --org acme-store \
  --service payment-service \
  --version v2.1.0 \
  --env production
```

```
  ✔  DEPLOYABLE

  payment-service v2.1.0 is COMPATIBLE with all 3 consumer(s)
```

```
  ✖  NOT DEPLOYABLE

  payment-service v2.1.0 is INCOMPATIBLE with:
    checkout-ui@2.0.0 (INCOMPATIBLE)
    mobile-app@1.5.0  (INCOMPATIBLE)
```

Exit codes: `0` = deployable · `1` = blocked · `2` = error

### Compatibility Matrix

View the compatibility status across all consumer/provider pairs in your org:

```bash
specshield bdct matrix --org acme-store --env production
```

```
  Compatibility Matrix  (env: production)

                    payment-service  order-service
  checkout-ui       COMPATIBLE       COMPATIBLE
  mobile-app        INCOMPATIBLE     COMPATIBLE
  partner-sdk       COMPATIBLE       UNKNOWN
```

### List Provider Specs

```bash
# All providers for the org
specshield bdct list-providers --org acme-store

# Filter by provider name
specshield bdct list-providers --org acme-store --provider payment-service
```

```
  Provider Specs

  payment-service  v2.1.0   production   2025-05-01
  payment-service  v2.0.0   staging      2025-04-20
  order-service    v1.3.0   production   2025-04-28
```

### List Consumer Contracts

```bash
# All consumers for the org
specshield bdct list-consumers --org acme-store

# Filter by consumer or provider
specshield bdct list-consumers --org acme-store --consumer checkout-ui
specshield bdct list-consumers --org acme-store --provider payment-service
```

### List Verifications

```bash
specshield bdct list-verifications \
  --org acme-store \
  --provider payment-service \
  --env production \
  --page 0 \
  --size 20
```

```
  BDCT Verifications

  Consumer     Consumer Ver  Provider          Provider Ver  Env         Status        Verified At
  checkout-ui  2.0.0         payment-service   v2.1.0        production  COMPATIBLE    2025-05-01 14:30
  mobile-app   1.5.0         payment-service   v2.1.0        production  INCOMPATIBLE  2025-05-01 14:30
```

### BDCT JSON Output

All BDCT commands support `--json` for CI parsing:

```bash
specshield bdct can-i-deploy --org acme-store --service payment-service --version v2.1.0 --json
```

```json
{
  "deployable": false,
  "service": "payment-service",
  "version": "v2.1.0",
  "environment": "production",
  "reason": "payment-service v2.1.0 is INCOMPATIBLE with: checkout-ui@2.0.0 (INCOMPATIBLE)",
  "verifications": [
    {
      "consumerName": "checkout-ui",
      "consumerVersion": "2.0.0",
      "status": "INCOMPATIBLE",
      "compatibleCount": 1,
      "incompatibleCount": 1
    }
  ]
}
```

### Full BDCT Workflow

```bash
# 1. Provider publishes spec on every release
specshield bdct publish-provider \
  --org acme-store --provider payment-service \
  --version v2.1.0 --spec ./api/openapi.yaml

# 2. Each consumer publishes their contract once (update on contract change)
specshield bdct publish-consumer \
  --org acme-store --consumer checkout-ui \
  --provider payment-service --version 2.0.0 \
  --contract ./contracts/checkout-ui.yaml

# 3. Gate the provider deployment
specshield bdct can-i-deploy \
  --org acme-store --service payment-service \
  --version v2.1.0 --env production
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

### On Push — Publish consumer contract (CDCT)

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

### On Push — Verify provider + gate deployment (CDCT)

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

### On Push — Publish provider spec (BDCT)

```yaml
name: BDCT Publish Provider Spec

on:
  push:
    branches: [main]
    paths:
      - 'api/openapi.yaml'

jobs:
  publish-bdct:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g specshield
      - name: Publish provider spec
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield bdct publish-provider \
            --org ${{ vars.SPECSHIELD_ORG }} \
            --provider payment-service \
            --version ${{ github.sha }} \
            --spec ./api/openapi.yaml \
            --env production
      - name: Gate deployment
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield bdct can-i-deploy \
            --org ${{ vars.SPECSHIELD_ORG }} \
            --service payment-service \
            --version ${{ github.sha }} \
            --env production
```

### On Contract Change — Publish consumer contract (BDCT)

```yaml
name: BDCT Publish Consumer Contract

on:
  push:
    branches: [main]
    paths:
      - 'contracts/bdct/**'

jobs:
  publish-consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g specshield
      - name: Publish consumer contract
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield bdct publish-consumer \
            --org ${{ vars.SPECSHIELD_ORG }} \
            --consumer checkout-ui \
            --provider payment-service \
            --version ${{ github.ref_name }} \
            --contract ./contracts/bdct/checkout-ui-payment.yaml
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

github:
  specPath: api/openapi.yaml
  failOnBreaking: true
  commentOnPr: true
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

```bash
specshield bdct <subcommand> [options]
```

| Subcommand | Description |
|---|---|
| `publish-provider` | Publish a provider OpenAPI spec |
| `publish-consumer` | Publish a consumer contract (OpenAPI subset or Pact JSON) |
| `verify` | Manually trigger verification for a consumer/provider pair |
| `can-i-deploy` | Check if a service version is safe to deploy |
| `matrix` | View compatibility matrix across all pairs |
| `list-providers` | List published provider specs |
| `list-consumers` | List published consumer contracts |
| `list-verifications` | List verification history |

All `bdct` subcommands support `--json` for machine-readable output.

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Clean — no breaking changes / deployable |
| `1` | Breaking changes found / not deployable |
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
