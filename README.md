# SpecShield CLI

[![npm](https://img.shields.io/npm/v/specshield)](https://www.npmjs.com/package/specshield)
[![downloads](https://img.shields.io/npm/dw/specshield)](https://www.npmjs.com/package/specshield)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)
[![node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

Compare OpenAPI and Swagger specs, detect breaking changes, and fail CI before incompatible API changes reach production.

---

## Table of Contents

- [What is SpecShield CLI?](#what-is-specshield-cli)
- [Installation](#installation)
- [Local Compare](#local-compare)
- [Authentication](#authentication)
- [Generate an API Token](#generate-an-api-token)
- [Remote Compare](#remote-compare)
- [Config File](#config-file)
- [All Options](#all-options)
- [Exit Codes](#exit-codes)
- [CI/CD — GitHub Actions](#cicd--github-actions)
- [Support](#support)

---

## What is SpecShield CLI?

SpecShield CLI is a command-line tool for comparing two OpenAPI/Swagger specifications and detecting what changed between them. It classifies changes into:

- **Breaking changes** — removed endpoints, changed required fields, incompatible type changes
- **Modifications** — changed behavior that may or may not break clients
- **Additions** — new endpoints or fields
- **Warnings** — low-severity notices

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

```
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

```
Error: No API key found. Run: specshield login --api-key <KEY>
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
          specshield compare /tmp/base-spec.yaml api/openapi.yaml \
            --fail-on-breaking \
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
          specshield compare /tmp/base-spec.yaml api/openapi.yaml \
            --remote \
            --fail-on-breaking \
            --output spec-diff.json
```

> **Note:** If your project generates its OpenAPI spec dynamically (e.g. Spring Boot, FastAPI), add a build step before the compare step to generate the spec from your code.

---

## License

MIT © Deepak Satyam

---

## Support

Questions or issues? Reach out at [admin@specshield.io](mailto:admin@specshield.io) or open an issue on GitHub.
