# SpecShield CLI changelog

## 3.2.0 — 2026-05-17 — Conversion fixes

Three CLI changes designed to make the Cloud features (history, share URLs,
PR checks, BDCT) visible to the 2,000+ existing CLI users who run local
`specshield compare` but never discover what signing up unlocks.

### Added

- **Post-install welcome banner** — runs once after a fresh `npm install -g specshield`.
  Briefly explains the value progression (Local → Cloud Free → Pro) and points
  to the next command to try. Skipped automatically in CI, in non-TTY shells,
  on update installs, and when `SPECSHIELD_NO_BANNER=1` is set.

- **Contextual signup prompt after `specshield compare`** — after 3+ compares
  per week, a soft 3-line nudge appears below the regular output:
  ```
  ● Track these comparisons over time:
    specshield login   # 30-sec signup via GitHub / Google · no credit card
    Unlocks: compare history, shareable report URLs, PR badge
  ```
  Throttled to once per week so it never spams. Suppressed entirely for
  logged-in users, `--json` output, CI environments, and on opt-out. The
  prompt copy escalates at 10 and 25 compares per window.

- **`specshield history`** — new command to list recent comparisons saved
  in your Cloud account. Surfaces in `specshield --help` so local-only
  users discover the feature exists.

- **`specshield share <report-id | base.yaml target.yaml>`** — generate a
  public shareable URL for a comparison. Designed for pasting diffs into
  Slack, PR comments, or Jira. Cloud account required.

Both new commands print a friendly "Get started in 30 seconds" message
with a `specshield login` deep link when run without credentials.

### Why

Background: in May 2026 the CLI had 2,000+ active monthly users (npm download
estimate; real human count likely 200-500) but the SpecShield Cloud signup
rate from the CLI was effectively zero. Local compare was so capable that
users got 100% of their immediate value without ever needing an account.

These changes don't remove any free functionality — local compare is still
fully usable without signup — they just make the gap between local and
cloud visible at the moments when a user is most engaged (post-install,
post-compare, on `--help`).

### Tests

- Added `tests/core/conversionPrompt.test.js` covering all skip conditions,
  threshold logic, escalation, and 7-day window reset (10 tests).
- All 134 existing tests still pass.

### Opting out

If you don't want the banner or contextual prompts:

```sh
export SPECSHIELD_NO_BANNER=1     # disable banner + post-compare nudge
```

Or just sign up — logged-in users never see either.
