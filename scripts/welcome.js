#!/usr/bin/env node
/**
 * Post-install welcome banner.
 *
 * Runs once via the `postinstall` hook in package.json after a fresh
 * `npm install -g specshield`. Prints a brief value-progression banner so
 * users discover the cloud features that exist beyond local compare —
 * historically users would install, run compare, get value, and never look
 * at the README to find out signup unlocks more.
 *
 * We bail out silently in environments where a banner would be noise or
 * could break automation:
 *   - CI environment variables present (CI, GITHUB_ACTIONS, BUILDKITE,
 *     CIRCLECI, GITLAB_CI, JENKINS_URL, TRAVIS, TF_BUILD)
 *   - npm_config_loglevel is `silent` or `error` (user opted out of noise)
 *   - SPECSHIELD_NO_BANNER=1 (explicit opt-out)
 *   - Not running under npm (`npm_command` unset)
 *   - Update install rather than fresh install (npm_command !== "install")
 *
 * No state is written; we let the user's terminal scroll and move on.
 */
'use strict';

function shouldSkip() {
  const env = process.env;
  if (env.SPECSHIELD_NO_BANNER === '1') return true;
  if (env.CI || env.GITHUB_ACTIONS || env.BUILDKITE || env.CIRCLECI ||
      env.GITLAB_CI || env.JENKINS_URL || env.TRAVIS || env.TF_BUILD) {
    return true;
  }
  const loglevel = env.npm_config_loglevel;
  if (loglevel === 'silent' || loglevel === 'error') return true;
  // Only show on the user-initiated "install" command. Things like
  // `npm ci`, `npm update`, transitive dep installs all set npm_command
  // to something other than 'install'.
  if (env.npm_command !== 'install') return true;
  return false;
}

if (shouldSkip()) {
  process.exit(0);
}

// ANSI color helpers — kept local to avoid pulling in chalk during a
// post-install script (chalk requires node_modules to be fully populated,
// which is racy during installs).
const isTTY = !!process.stdout.isTTY;
const c = (code, s) => (isTTY ? `[${code}m${s}[0m` : s);
const bold = (s) => c('1', s);
const dim  = (s) => c('2', s);
const cyan = (s) => c('36', s);
const grn  = (s) => c('32', s);

const banner = `
${bold('SpecShield installed')} ${dim('— OpenAPI breaking-change detection + BDCT')}

  ${bold('Get started')}
    ${cyan('specshield compare')} base.yaml target.yaml --fail-on-breaking
    ${cyan('specshield init')}                          ${dim('# project setup wizard')}

  ${bold('Your usage tier')}
    ${grn('●')} ${bold('Local (free, no account)')}    spec compare, breaking-change detection
    ${dim('○')} Cloud Free                  ${dim('+ compare history, PR badge, share URLs')}
    ${dim('○')} Pro                         ${dim('+ BDCT, can-i-deploy, GitHub PR checks, team')}

  ${dim('Sign in when you want history & sharing:')} ${cyan('specshield login')}
  ${dim('Docs:')} ${cyan('https://specshield.io/docs')}
`;

process.stdout.write(banner + '\n');
