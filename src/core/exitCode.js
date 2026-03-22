'use strict';

/**
 * Resolve exit code based on comparison result and options.
 * 0 = success
 * 1 = breaking changes found and fail-on-breaking active
 * 2 = runtime/input error (handled elsewhere)
 */
function resolveExitCode(result, options) {
  const hasBreaking = result.breakingChanges && result.breakingChanges.length > 0;

  if (hasBreaking && options.failOnBreaking && !options.allowBreaking) {
    return 1;
  }

  return 0;
}

module.exports = { resolveExitCode };
