# SpecShield CLI

[![npm](https://img.shields.io/npm/v/specshield)](https://www.npmjs.com/package/specshield)
[![downloads](https://img.shields.io/npm/dw/specshield)](https://www.npmjs.com/package/specshield)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)
[![node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

## 🚀 Prevent Breaking API Changes Before They Reach Production

**SpecShield is a Pact alternative for OpenAPI** that helps developers  
**detect breaking API changes in CI/CD** and act as a powerful  
**OpenAPI diff tool for modern backend teams.**

---

## 👀 See it in action

```bash
$ specshield compare base.yaml target.yaml --fail-on-breaking

✖ BREAKING CHANGES DETECTED

  1. DELETE /users endpoint removed
  2. POST /payments request field "amount" changed from optional to required
  3. GET /orders/{id} response field "status" type changed: string -> object

Summary
- Breaking changes : 3
- Modifications    : 1
- Additions        : 2
- Warnings         : 0

CI Result: FAILED
Exit Code: 1
```

These are the kinds of changes that break clients in production.  
SpecShield catches them early so your CI can block unsafe deployments.

### Safe change example

```bash
$ specshield compare base.yaml target.yaml --fail-on-breaking

✔ NO BREAKING CHANGES FOUND

Summary
- Breaking changes : 0
- Modifications    : 1
- Additions        : 3
- Warnings         : 1

CI Result: PASSED
Exit Code: 0
```

---

## ⚡ 30-second quick start

```bash
npm install -g specshield
specshield compare base.yaml target.yaml --fail-on-breaking
```

👉 No account required for local compare

---

## 💡 Useful for

- Preventing accidental API breakage in pull requests
- Failing CI when breaking changes are introduced
- Tracking API drift across versions
- Enforcing contracts between consumer and provider services

---

## 🌐 Upgrade to Remote

Local compare is free and unlimited.

Remote mode unlocks:

- 📊 API change history
- 👥 Team collaboration
- 🚦 Deployment gating (`can-i-deploy`)
- 🔗 Contract testing across services

👉 https://specshield.io

---

## Table of Contents

- [What is SpecShield CLI?](#what-is-specshield-cli)
- [Installation](#installation)
- [Local Compare](#local-compare)
- [Authentication](#authentication)
  - [Generate an API Token](#generate-an-api-token)
- [Remote Compare](#remote-compare)
- [Contracts — Consumer-Driven Testing](#contracts--consumer-driven-testing)
  - [Contract File Format](#contract-file-format)
  - [Publish a Contract](#publish-a-contract)
  - [List Contracts](#list-contracts)
  - [Get Latest Contract](#get-latest-contract)
  - [Verify a Contract](#verify-a-contract)
  - [Verification History](#verification-history)
  - [Can I Deploy?](#can-i-deploy)
  - [Full Publish → Verify → Deploy Workflow](#full-publish--verify--deploy-workflow)
  - [Contracts in CI/CD](#contracts-in-cicd)
- [Config File](#config-file)
- [All Options](#all-options)
- [Exit Codes](#exit-codes)
- [CI/CD — GitHub Actions](#cicd--github-actions)
- [Support](#support)

---

## What is SpecShield CLI?

SpecShield CLI is a developer-first **OpenAPI diff tool** and  
**contract testing solution** that helps prevent breaking API changes.

It works as a lightweight **Pact alternative for OpenAPI**, designed for  
modern microservices and CI/CD pipelines.

It works in two modes:

| Mode | Description |
|---|---|
| **Local** | Compares two spec files on your machine. No account needed. |
| **Remote** | Sends specs to the SpecShield hosted API. Requires an API token. Results are stored in your dashboard. |

---

## Installation

```bash
npm install -g specshield
```

Verify the installation:

```bash
specshield --version
```

---

## Local Compare

No account or token required for local comparisons.

```bash
specshield compare base.yaml target.yaml
```

Fail CI if breaking changes are found:

```bash
specshield compare base.yaml target.yaml --fail-on-breaking
```

Output as JSON:

```bash
specshield compare base.yaml target.yaml --json
```

Save results to a file:

```bash
specshield compare base.yaml target.yaml --output result.json
```

Ignore specific changes:

```bash
specshield compare base.yaml target.yaml --ignore "DELETE /users removed" --fail-on-breaking
```

---

## Authentication

Remote compare requires a SpecShield account and an API token.

### Sign in to SpecShield

1. Go to [https://specshield.io](https://specshield.io)
2. Sign in with your email/password, GitHub, or Google account
3. You will land on your account dashboard

### Generate an API Token

1. From your dashboard, go to **Account → API Keys**
   (direct link: [https://specshield.io/account/keys](https://specshield.io/account/keys))
2. Click **Generate API Key**
3. Copy the token — it starts with `ss_` and is shown only once
4. Store it securely (password manager, secrets vault, or CI/CD secret)

### Configure the CLI

Run the login command with your token:

```bash
specshield login --api-key ss_your_token_here
```

This validates the token against the SpecShield API and saves it to `~/.specshield/config.json`. You will not need to pass the token on every command after this.

**Example output:**

```text
✔ Logged in successfully.

  Customer:  Jane Smith
  Plan:      FREE
  Config:    /Users/jane/.specshield/config.json

  Run: specshield compare base.yaml target.yaml --remote
```

### Alternative: Environment Variable

If you prefer not to use the stored config (e.g. in CI/CD), set the token as an environment variable:

```bash
export SPECSHIELD_API_KEY=ss_your_token_here
specshield compare base.yaml target.yaml --remote
```

The token resolution order is:

1. `--api-key` flag (highest priority)
2. `SPECSHIELD_API_KEY` environment variable
3. Stored config (`~/.specshield/config.json`)
4. `remote.apiKey` in `.specshield.yml`

### Log Out

To remove the stored token:

```bash
specshield logout
```

---

## Remote Compare

Remote compare sends your spec files to the SpecShield hosted API at [https://specshield.io](https://specshield.io). Results are processed server-side and stored in your dashboard for review.

**When to use remote mode:**
- You want comparison history tracked in the SpecShield dashboard
- Your team shares a centralized view of API drift over time
- You are on a plan with advanced reporting features

### Basic remote compare

```bash
specshield compare base.yaml target.yaml --remote
```

### Remote compare with CI fail on breaking changes

```bash
specshield compare base.yaml target.yaml --remote --fail-on-breaking
```

### Remote compare with JSON output

```bash
specshield compare base.yaml target.yaml --remote --json --output result.json
```

### How authentication works in remote mode

The CLI reads your API token (from flag, env var, or stored config) and sends it as an `X-Api-Key` header with each request. If no token is found, the command exits with an error:

```text
Error: No API key found. Run: specshield login --api-key <KEY>
```

---

## Contracts — Consumer-Driven Testing

SpecShield Contracts lets consumer teams publish API expectations (contracts) to a central registry. Provider teams then verify their service satisfies those contracts before deploying.

**Why contract testing?**
- Catch provider-side regressions before they reach consumers
- Enforce an agreed-upon API shape across services
- Gate deployments on verified contracts with `can-i-deploy`

All contract commands require an API token. See [Authentication](#authentication).

### Contract File Format

Create a `.json` file describing the expected API interactions:

```json
{
  "consumer": {
    "name": "checkout-ui",
    "version": "1.2.0"
  },
  "provider": {
    "name": "payment-service"
  },
  "contractName": "create-payment",
  "contractType": "HTTP",
  "interactions": [
    {
      "description": "create payment",
      "request": {
        "method": "POST",
        "path": "/payments",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "orderId": "ORD-123",
          "amount": 100,
          "currency": "INR"
        }
      },
      "expectedResponse": {
        "status": 201,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "paymentId": "PAY-123",
          "status": "CREATED"
        }
      }
    }
  ],
  "metadata": {
    "generatedBy": "specshield-cli",
    "contractFormatVersion": "1.0"
  }
}
```

The `consumer.name`, `provider.name`, and `contractName` fields are used to identify the contract in the registry. CLI flags (`--consumer`, `--provider`, `--contract-name`) override file values if provided.

### Publish a Contract

```bash
specshield contracts publish \\
  --file ./contracts/create-payment.json \\
  --org acme
```

With all flags explicitly set (flags override file values):

```bash
specshield contracts publish \\
  --file ./contracts/create-payment.json \\
  --org acme \\
  --consumer checkout-ui \\
  --provider payment-service \\
  --contract-name create-payment \\
  --consumer-version 1.2.0 \\
  --tag main
```

**Example output:**

```text
  ✔  Contract Published Successfully
  ─────────────────────────────────────────────────────
  Contract ID     : 42
  Contract Name   : create-payment
  Consumer        : checkout-ui
  Provider        : payment-service
  Version         : 3
  Status          : PUBLISHED
  Content Hash    : a3f9c1d2e7b8...
  Published At    : 06/04/2026 14:30:00

  ➜  Run: specshield contracts verify --contract-id 42 --base-url http://localhost:8080
```

**Options:**

| Flag | Description |
|---|---|
| `--file <path>` | Path to contract JSON file (required) |
| `--org <key>` | Organization key |
| `--consumer <key>` | Consumer service key (overrides file) |
| `--provider <key>` | Provider service key (overrides file) |
| `--consumer-version <ver>` | Consumer version tag |
| `--contract-name <name>` | Contract name (overrides file) |
| `--tag <tag>` | Git branch or release tag |
| `--server <url>` | SpecShield server URL (default: `https://specshield.io`) |
| `--api-token <token>` | API token |

### List Contracts

```bash
specshield contracts list
```

Filter by provider:

```bash
specshield contracts list --provider payment-service
```

Filter by consumer, org, status:

```bash
specshield contracts list \\
  --consumer checkout-ui \\
  --provider payment-service \\
  --status PUBLISHED
```

Output raw JSON:

```bash
specshield contracts list --json
```

**Example output:**

```text
  SpecShield Contract Registry
  ─────────────────────────────────────────────────────
  Showing 2 of 2 contracts

  ID  Contract Name    Consumer      Provider         Ver  Status     Last Verify  Published
  ──  ───────────────  ────────────  ───────────────  ───  ─────────  ───────────  ─────────────────────
  42  create-payment   checkout-ui   payment-service  3    PUBLISHED  SUCCESS      06/04/2026 14:30:00
  41  get-order-status order-ui      order-service    1    PUBLISHED  FAILED       05/04/2026 09:15:00
```

**Options:**

| Flag | Description |
|---|---|
| `--consumer <key>` | Filter by consumer |
| `--provider <key>` | Filter by provider |
| `--org <key>` | Filter by organization |
| `--status <status>` | Filter by status (`PUBLISHED` / `DEPRECATED`) |
| `--contract-name <name>` | Filter by contract name |
| `--page <n>` | Page number (0-based, default: `0`) |
| `--size <n>` | Page size (default: `20`) |
| `--json` | Output raw JSON |

### Get Latest Contract

```bash
specshield contracts latest \\
  --consumer checkout-ui \\
  --provider payment-service \\
  --contract-name create-payment
```

Print the full contract content (interactions, body, etc.):

```bash
specshield contracts latest \\
  --consumer checkout-ui \\
  --provider payment-service \\
  --json
```

**Options:**

| Flag | Description |
|---|---|
| `--consumer <key>` | Consumer service key |
| `--provider <key>` | Provider service key |
| `--org <key>` | Organization key |
| `--contract-name <name>` | Contract name |
| `--json` | Print full contract JSON |

### Verify a Contract

Run the contract against a live provider. SpecShield replays each interaction against the `--base-url` and compares the response to the expected values.

```bash
specshield contracts verify \\
  --contract-id 42 \\
  --base-url http://localhost:8080
```

With version and environment tags:

```bash
specshield contracts verify \\
  --contract-id 42 \\
  --base-url https://payment-service.staging.internal \\
  --provider-version v2.1.0 \\
  --env staging
```

Output raw JSON (for CI parsing):

```bash
specshield contracts verify \\
  --contract-id 42 \\
  --base-url http://localhost:8080 \\
  --json
```

**Example output (pass):**

```text
  ✔  Verification PASSED  (1/1 interactions)
  ─────────────────────────────────────────────────────
  Verification ID : 101
  Contract ID     : 42
  Status          : SUCCESS
  Started At      : 06/04/2026 14:35:00
  Completed At    : 06/04/2026 14:35:01

  ➜  Run: specshield contracts can-i-deploy --provider payment-service --version v2.1.0
```

**Example output (fail):**

```text
  ✖  Verification FAILED  (0/1 interactions passed, 1 failed)
  ─────────────────────────────────────────────────────
  Verification ID : 102
  Contract ID     : 42
  Status          : FAILED

  Mismatches
  ─────────────────────────────────────────────────────
  ● [create payment] STATUS_CODE_MISMATCH at $.status
    expected: 201  →  actual: 200
    Expected status 201 but got 200

  ➜  Run: specshield contracts history --contract-id 42 to inspect previous runs
```

**Exit codes:** `0` = PASSED, `1` = FAILED, `2` = error

**Options:**

| Flag | Description |
|---|---|
| `--contract-id <id>` | Contract ID to verify (required) |
| `--base-url <url>` | Provider base URL (required, e.g. `http://localhost:8080`) |
| `--provider-version <ver>` | Provider version tag |
| `--env <environment>` | Environment label (`staging`, `qa`, `production`) |
| `--mode <mode>` | `LIVE` or `REPLAY` (default: `LIVE`) |
| `--json` | Output raw JSON |

### Verification History

```bash
specshield contracts history --contract-id 42
```

**Example output:**

```text
  Verification History — Contract 42
  ─────────────────────────────────────────────────────

  ID   Status   Environment  Provider Version  Mode  Completed At
  ───  ───────  ───────────  ────────────────  ────  ─────────────────────
  102  FAILED   staging      v2.1.0            LIVE  06/04/2026 14:35:01
  101  SUCCESS  staging      v2.0.0            LIVE  05/04/2026 10:00:00
  98   SUCCESS  qa           v1.9.0            LIVE  01/04/2026 08:30:00
```

**Options:**

| Flag | Description |
|---|---|
| `--contract-id <id>` | Contract ID (required) |
| `--json` | Output raw JSON |

### Can I Deploy?

Check whether a provider version has passing verifications for all associated contracts:

```bash
specshield contracts can-i-deploy \\
  --provider payment-service \\
  --version v2.1.0
```

Scoped to a specific environment:

```bash
specshield contracts can-i-deploy \\
  --provider payment-service \\
  --version v2.1.0 \\
  --env production
```

**Example output (allowed):**

```text
  ✔  PASS: payment-service v2.1.0 is deployable in production
  ─────────────────────────────────────────────────────

  Contract Decisions
  ✔ Contract ID 42 — SUCCESS
    All contracts verified
```

**Example output (blocked):**

```text
  ✖  FAIL: payment-service v2.1.0 is NOT deployable in production
  ─────────────────────────────────────────────────────

  Contract Decisions
  ✖ Contract ID 43 — FAILED
    Unverified or failed contracts found

  ➜  Run: specshield contracts verify --contract-id 43 --base-url <URL>
  ➜  to verify pending contracts before deploying
```

**Exit codes:** `0` = deployable, `1` = blocked, `2` = error

**Options:**

| Flag | Description |
|---|---|
| `--provider <key>` | Provider service key (required) |
| `--version <ver>` | Provider version to check (required) |
| `--env <environment>` | Target environment |
| `--json` | Output raw JSON |

### Full Publish → Verify → Deploy Workflow

```bash
# 1. Consumer team publishes a contract
specshield contracts publish \\
  --file ./contracts/create-payment.json \\
  --org acme

# 2. Provider team starts their service locally
./gradlew bootRun &

# 3. Provider team verifies the contract
specshield contracts verify \\
  --contract-id 42 \\
  --base-url http://localhost:8080 \\
  --provider-version v2.1.0 \\
  --env staging

# 4. Gate the deployment
specshield contracts can-i-deploy \\
  --provider payment-service \\
  --version v2.1.0 \\
  --env staging
```

### Contracts in CI/CD

#### GitHub Actions — Publish on consumer change

```yaml
name: Publish Contract

on:
  push:
    branches: [main]
    paths:
      - 'contracts/**'

jobs:
  publish-contract:
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
          specshield contracts publish \\
            --file ./contracts/create-payment.json \\
            --org acme \\
            --tag ${{ github.ref_name }}
```

#### GitHub Actions — Verify + can-i-deploy on provider change

```yaml
name: Contract Verification

on:
  push:
    branches: [main]

jobs:
  verify-contracts:
    runs-on: ubuntu-latest
    services:
      payment-service:
        image: myorg/payment-service:${{ github.sha }}
        ports:
          - 8080:8080
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
          specshield contracts verify \\
            --contract-id ${{ vars.PAYMENT_CONTRACT_ID }} \\
            --base-url http://localhost:8080 \\
            --provider-version ${{ github.sha }} \\
            --env staging

      - name: Can I deploy?
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield contracts can-i-deploy \\
            --provider payment-service \\
            --version ${{ github.sha }} \\
            --env staging
```

---

## Config File

Create `.specshield.yml` in your project root to set default behavior:

```yaml
failOnBreaking: true
allowBreakingChanges: false
severity: error

ignore:
  - "DELETE /admin removed"
  - "User.internal_id removed"

remote:
  enabled: false
  url: "https://specshield.io/compare"
  timeout: 10000
  apiKey: ""        # prefer env var or specshield login instead
```

CLI flags always override config file values.

---

## All Options

```bash
specshield compare <base> <target> [options]
```

| Option | Description |
|---|---|
| `--remote` | Use the SpecShield hosted compare API |
| `--api-key <key>` | API token for remote mode (overrides env and stored config) |
| `--remote-url <url>` | Override the hosted API base URL |
| `--fail-on-breaking` | Exit code 1 if breaking changes are found |
| `--allow-breaking` | Override fail-on-breaking |
| `--json` | Output machine-readable JSON |
| `--output <file>` | Save result to a file |
| `--ignore <change>` | Ignore a specific change string (repeatable) |
| `--severity <level>` | Minimum severity: `info` / `warning` / `error` |
| `--config <path>` | Path to `.specshield.yml` |
| `--timeout <ms>` | Request timeout for remote mode (default: 10000) |

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success — no blocking issues |
| `1` | Breaking changes found and `--fail-on-breaking` is active |
| `2` | Invalid input, missing token, config error, or runtime error |

---

## CI/CD — GitHub Actions

### Local compare (no token required)

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

      - name: Get base spec from main branch
        run: git show origin/main:api/openapi.yaml > /tmp/base-spec.yaml

      - name: Compare specs
        run: |
          specshield compare /tmp/base-spec.yaml api/openapi.yaml \\
            --fail-on-breaking \\
            --output spec-diff.json

      - name: Upload diff report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: spec-diff
          path: spec-diff.json
```

### Remote compare (with SpecShield hosted API)

Add your API token as a GitHub Actions secret named `SPECSHIELD_API_KEY`, then:

```yaml
      - name: Compare specs (remote)
        env:
          SPECSHIELD_API_KEY: ${{ secrets.SPECSHIELD_API_KEY }}
        run: |
          specshield compare /tmp/base-spec.yaml api/openapi.yaml \\
            --remote \\
            --fail-on-breaking \\
            --output spec-diff.json
```

> **Note:** If your project generates its OpenAPI spec dynamically (e.g. Spring Boot, FastAPI), add a build step before the compare step to generate the spec from your code.

---

## License

MIT © Deepak Satyam

---

## Support

Questions or issues? Reach out at [admin@specshield.io](mailto:admin@specshield.io) or open an issue on GitHub.
