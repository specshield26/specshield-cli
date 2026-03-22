# SpecShield CLI

> Compare OpenAPI specs and detect breaking changes — designed for CI/CD and local developer workflows.

## Features

- Detect breaking changes, additions, and modifications between two OpenAPI specs
- Support YAML and JSON specs
- CI/CD-ready with exit code control (`--fail-on-breaking`)
- Config file support (`.specshield.yml`)
- JSON output for machine parsing
- Ignore list to suppress known changes
- Placeholder remote mode for future SaaS backend integration

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
