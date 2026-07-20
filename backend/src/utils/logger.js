/**
 * Custom logger that only outputs if NODE_ENV is set to local or testing.
 * Prevents debug logs from leaking into production console.
 */
function log(...args) {
  const env = process.env.NODE_ENV || 'production';
  if (env === 'local' || env === 'testing') {
    console.log(...args);
  }
}

function error(...args) {
  const env = process.env.NODE_ENV || 'production';
  if (env === 'local' || env === 'testing') {
    console.error(...args);
  }
}

module.exports = {
  log,
  error
};
