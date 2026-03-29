# 🚀 SpecShield — OpenAPI Diff & Breaking Change Detection CLI

![npm](https://img.shields.io/npm/v/specshield)
![downloads](https://img.shields.io/npm/dw/specshield)
![license](https://img.shields.io/badge/license-MIT-blue)
![node](https://img.shields.io/badge/node-%3E%3D18-green)

Compare OpenAPI and Swagger specs, detect breaking changes, and fail CI before incompatible API changes reach production.


## 📌 What is SpecShield?

SpecShield is a CLI tool that compares two OpenAPI/Swagger specifications and detects:

- ❌ Breaking changes
- ➕ Additions
- 🔄 Modifications

It is designed for:
- CI/CD pipelines
- Backend developers
- API governance teams
- Local development workflows

---

## ❗ Why SpecShield?

API changes can silently break:
- Mobile apps
- Frontend clients
- Partner integrations
- Internal microservices

Manual API review is:
- ❌ Error-prone
- ❌ Time-consuming
- ❌ Not scalable

👉 SpecShield solves this by automating API contract validation.

---

## 🎯 Key Benefits

- 🚫 Prevent breaking API releases
- ⚙️ Enforce API contract checks in CI/CD
- 🔍 Compare OpenAPI specs automatically
- 📊 Generate machine-readable reports
- 🧩 Integrate easily with existing workflows
- 🛑 Fail builds when breaking changes are detected

---

## ✨ Features

- Detect breaking changes, additions, and modifications
- Support YAML and JSON OpenAPI specs
- CI/CD-ready with exit codes
- JSON output for automation
- `.specshield.yml` config support
- Ignore list for known changes
- Future SaaS-ready remote mode

## Installation

```bash
npm install -g specshield
# or use locally:
npm install && npm link
```

## Usage

### Basic comparison
```bash
specshield compare base.yaml target.yaml
```

### Fail CI on breaking changes
```bash
specshield compare base.yaml target.yaml --fail-on-breaking
```

### JSON output (for scripts/automation)
```bash
specshield compare base.yaml target.yaml --json
```

### Save results to file
```bash
specshield compare base.yaml target.yaml --output result.json
```

### Ignore specific changes
```bash
specshield compare base.yaml target.yaml --ignore "DELETE /users removed" --fail-on-breaking
```

### Use custom config
```bash
specshield compare base.yaml target.yaml --config ./configs/.specshield.yml
```

## Options

| Option | Description |
|---|---|
| `--json` | Output machine-readable JSON |
| `--output <file>` | Save result to file |
| `--fail-on-breaking` | Exit 1 if breaking changes found |
| `--allow-breaking` | Override fail behavior |
| `--config <path>` | Path to `.specshield.yml` |
| `--ignore <change>` | Ignore a change string (repeatable) |
| `--severity <level>` | `info` / `warning` / `error` |
| `--remote-url <url>` | Remote API endpoint (future mode) |
| `--timeout <ms>` | Timeout for remote requests |

## Config File

Create `.specshield.yml` in your project root:

```yaml
allowBreakingChanges: false
failOnBreaking: true

ignore:
  - "User.email removed"
  - "/admin DELETE removed"

severity: error

remote:
  enabled: false
  url: "https://api.specshield.io/compare"
  timeout: 10000
```

> CLI arguments always override config file values.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success — no blocking issues |
| `1` | Breaking changes found and `--fail-on-breaking` active |
| `2` | Invalid input, config error, or runtime error |

## CI/CD — GitHub Actions

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

      # Option A: spec files are committed to the repo
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

> **Note:** Some projects generate their OpenAPI spec dynamically (e.g. from Spring Boot annotations, FastAPI, etc.) instead of storing a static file. In that case, add a build step before the compare step to generate the spec from your code.

## Running Locally

```bash
npm install
npm link
specshield compare fixtures/spec-v1.yaml fixtures/spec-v2.yaml --fail-on-breaking
```

## Running Tests

```bash
npm test
```

## License

MIT © Deepak Satyam
