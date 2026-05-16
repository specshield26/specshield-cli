'use strict';

const path = require('path');
const os = require('os');
const fsExtra = require('fs-extra');

/**
 * The conversion prompt module reads/writes a JSON state file under the
 * user's home directory. Tests override the path via SPECSHIELD_STATE_PATH
 * (a test-only env hook) so we don't pollute the developer's real
 * ~/.specshield/state.json. We re-require the module after setting the
 * env var so the constant binds to the test path.
 */

const TMP_DIR = path.join(os.tmpdir(), 'specshield-cp-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
const TEST_STATE_PATH = path.join(TMP_DIR, 'state.json');

function freshModule() {
  jest.resetModules();
  return require('../../src/core/conversionPrompt');
}

async function clearState() {
  await fsExtra.remove(TMP_DIR);
}

beforeAll(() => {
  process.env.SPECSHIELD_STATE_PATH = TEST_STATE_PATH;
});

beforeEach(async () => {
  await clearState();
  delete process.env.CI;
  delete process.env.GITHUB_ACTIONS;
  delete process.env.SPECSHIELD_NO_BANNER;
});

afterAll(async () => {
  delete process.env.SPECSHIELD_STATE_PATH;
  await fsExtra.remove(TMP_DIR);
});

describe('recordCompareAndMaybeRender', () => {

  test('returns null when user is logged in (no nag for paying customers)', async () => {
    const { recordCompareAndMaybeRender } = freshModule();
    const result = await recordCompareAndMaybeRender({ loggedIn: true, jsonOutput: false });
    expect(result).toBeNull();
  });

  test('returns null when --json output (machine consumer)', async () => {
    const { recordCompareAndMaybeRender } = freshModule();
    const result = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: true });
    expect(result).toBeNull();
  });

  test('returns null in CI environment', async () => {
    process.env.CI = 'true';
    const { recordCompareAndMaybeRender } = freshModule();
    // Even after several runs, no prompt in CI.
    for (let i = 0; i < 5; i++) {
      const r = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
      expect(r).toBeNull();
    }
  });

  test('returns null on SPECSHIELD_NO_BANNER=1 opt-out', async () => {
    process.env.SPECSHIELD_NO_BANNER = '1';
    const { recordCompareAndMaybeRender } = freshModule();
    for (let i = 0; i < 5; i++) {
      const r = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
      expect(r).toBeNull();
    }
  });

  test('silent for first two compares; fires on the third', async () => {
    const { recordCompareAndMaybeRender } = freshModule();
    expect(await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false })).toBeNull();
    expect(await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false })).toBeNull();
    const third = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(third).toBeTruthy();
    expect(third).toMatch(/Track these comparisons/);
    expect(third).toMatch(/specshield login/);
  });

  test('throttles — does not re-fire on compare #4 right after #3', async () => {
    const { recordCompareAndMaybeRender } = freshModule();
    for (let i = 0; i < 3; i++) {
      await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    }
    // The 4th compare is over threshold but the throttle window hasn't passed.
    const fourth = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(fourth).toBeNull();
  });

  test('escalates copy at 10+ compares', async () => {
    const { recordCompareAndMaybeRender, STATE_PATH } = freshModule();
    // Backfill state to simulate sustained usage.
    await fsExtra.outputJson(STATE_PATH, {
      windowStartedAt: Date.now(),
      compareCount: 10,
      lastPromptAt: 0,
    });
    const result = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(result).toBeTruthy();
    expect(result).toMatch(/team can collaborate|10\+|PR checks/);
  });

  test('escalates further at 25+ compares', async () => {
    const { recordCompareAndMaybeRender, STATE_PATH } = freshModule();
    await fsExtra.outputJson(STATE_PATH, {
      windowStartedAt: Date.now(),
      compareCount: 25,
      lastPromptAt: 0,
    });
    const result = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(result).toBeTruthy();
    expect(result).toMatch(/can-i-deploy|BDCT|Heavy usage/);
  });

  test('window resets after 7 days — old burst does not count', async () => {
    const { recordCompareAndMaybeRender, STATE_PATH } = freshModule();
    // Simulate a 30-day-old window with a high count.
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    await fsExtra.outputJson(STATE_PATH, {
      windowStartedAt: thirtyDaysAgo,
      compareCount: 50,
      lastPromptAt: thirtyDaysAgo,
    });
    // First compare in the new window — should be #1, not fire.
    const first = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(first).toBeNull();
  });

  test('does not throw if state file is corrupted', async () => {
    const { recordCompareAndMaybeRender, STATE_PATH } = freshModule();
    await fsExtra.outputFile(STATE_PATH, '{ not valid json');
    // Should silently treat as fresh state, not crash.
    const result = await recordCompareAndMaybeRender({ loggedIn: false, jsonOutput: false });
    expect(result).toBeNull();   // first compare in a fresh window
  });
});
