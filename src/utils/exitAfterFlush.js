'use strict';

// process.exit() discards whatever is still buffered in stdout. Writes to a
// pipe are asynchronous, so `specshield <cmd> --json | jq` truncated large
// output mid-JSON and still exited 0. Queue an empty chunk and exit from its
// callback: stream callbacks run in order, so ours fires once every earlier
// chunk has reached the OS.
//
// Use this instead of process.exit() anywhere the command has already written
// to stdout. See tests/compareStdoutFlush.test.js.
function exitAfterFlush(code) {
  process.stdout.write('', () => process.exit(code));
}

module.exports = exitAfterFlush;
