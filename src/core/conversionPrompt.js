'use strict';

/**
 * Contextual signup nudge after a successful `specshield compare`.
 *
 * Lives in its own module so the heuristic is easy to read, test, and tune
 * without touching the compare command. The default state file path is
 * `~/.specshield/state.json` — same directory as the stored API key so the
 * "is the user logged in?" check is co-located.
 *
 * Trigger conditions (ALL must be true):
 *   - User is NOT logged in
 *   - Not in CI (env CI/GITHUB_ACTIONS/etc)
 *   - Output isn't `--json` (machine-readable)
 *   - User has run >= 3 compares in the last 7 days
 *   - We haven't shown a prompt in the last 7 days (don't spam)
 *
 * The state file is best-effort; if the disk read or write fails for any
 * reason we silently skip the prompt — we will never block or fail the
 * compare command for the sake of a marketing nudge.
 */

const path = require('path');
const os = require('os');
const fsExtra = require('fs-extra');
const chalk = require('chalk');

// Path is overridable for tests. Production never sets the env var, so the
// real home-directory state file is used. Tests point this at a temp dir
// because os.homedir() on POSIX ignores HOME and reads from /etc/passwd.
const STATE_PATH = process.env.SPECSHIELD_STATE_PATH
  || path.join(os.homedir(), '.specshield', 'state.json');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COMPARE_THRESHOLD = 3;

/**
 * Hand-tuned variant strings keyed by the user's compare count tier. We
 * escalate the value-prop as they prove sustained usage — first prompts
 * are gentle (just history); deeper-use prompts are richer (BDCT, team).
 */
const VARIANTS = [
  {
    minCount: 3,
    body: [
      `${chalk.cyan('●')} ${chalk.bold('Track these comparisons over time:')}`,
      `  ${chalk.cyan('specshield login')}   ${chalk.gray('# 30-sec signup via GitHub / Google · no credit card')}`,
      `  ${chalk.gray('Unlocks: compare history, shareable report URLs, PR badge')}`,
    ],
  },
  {
    minCount: 10,
    body: [
      `${chalk.cyan('●')} ${chalk.bold('You ran 10+ compares this week.')} ${chalk.gray('Your team can collaborate on this:')}`,
      `  ${chalk.cyan('specshield login')}   ${chalk.gray('# free Cloud account · GitHub PR checks · BDCT · team dashboard')}`,
    ],
  },
  {
    minCount: 25,
    body: [
      `${chalk.cyan('●')} ${chalk.bold('Heavy usage detected.')} ${chalk.gray("Time to gate deploys with can-i-deploy:")}`,
      `  ${chalk.cyan('specshield login')}   ${chalk.gray('# unlocks BDCT bi-directional contracts · can-i-deploy · audit log')}`,
      `  ${chalk.gray('Pricing: free for personal use · $29/mo Solo · $89/mo Team (10 seats)')}`,
    ],
  },
];

function isCi() {
  const e = process.env;
  return !!(e.CI || e.GITHUB_ACTIONS || e.BUILDKITE || e.CIRCLECI ||
            e.GITLAB_CI || e.JENKINS_URL || e.TRAVIS || e.TF_BUILD);
}

async function readState() {
  try {
    return await fsExtra.readJson(STATE_PATH);
  } catch {
    return {};
  }
}

async function writeState(state) {
  try {
    await fsExtra.outputJson(STATE_PATH, state, { spaces: 2 });
  } catch {
    // Best-effort — never throw from the conversion path.
  }
}

/**
 * Record a successful compare and return the variant string to print
 * after the regular output (or null to skip the prompt entirely).
 *
 * @param {object} opts
 * @param {boolean} opts.loggedIn    Whether the user has a stored API key
 * @param {boolean} opts.jsonOutput  True if --json was passed (suppress prompts)
 * @returns {Promise<string|null>}
 */
async function recordCompareAndMaybeRender({ loggedIn, jsonOutput }) {
  if (loggedIn)   return null;
  if (jsonOutput) return null;
  if (isCi())     return null;
  // Honor the same opt-out as the post-install banner.
  if (process.env.SPECSHIELD_NO_BANNER === '1') return null;

  const now = Date.now();
  const state = await readState();

  // Window the compare count: reset the counter once a week so a heavy
  // burst followed by a long pause doesn't trigger a prompt months later.
  if (!state.windowStartedAt || (now - state.windowStartedAt) > ONE_WEEK_MS) {
    state.windowStartedAt = now;
    state.compareCount = 0;
  }
  state.compareCount = (state.compareCount || 0) + 1;

  let prompt = null;
  if (state.compareCount >= COMPARE_THRESHOLD) {
    const sinceLast = state.lastPromptAt ? (now - state.lastPromptAt) : Infinity;
    if (sinceLast >= ONE_WEEK_MS) {
      prompt = pickVariant(state.compareCount);
      state.lastPromptAt = now;
      state.promptsShown = (state.promptsShown || 0) + 1;
    }
  }

  await writeState(state);
  return prompt;
}

function pickVariant(count) {
  // Linear scan from most-aggressive to least-aggressive — pick the
  // highest-min-count variant the user qualifies for.
  const eligible = VARIANTS.filter(v => count >= v.minCount).sort((a, b) => b.minCount - a.minCount);
  if (eligible.length === 0) return null;
  return eligible[0].body.join('\n');
}

module.exports = { recordCompareAndMaybeRender, STATE_PATH };
