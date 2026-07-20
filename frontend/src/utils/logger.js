/**
 * Custom logger that only outputs if VITE_APP_ENV is set to local or testing.
 * Prevents debug logs from leaking into production browser console.
 */
export function log(...args) {
  const env = import.meta.env.VITE_APP_ENV || 'production';
  if (env === 'local' || env === 'testing') {
    console.log(...args);
  }
}

export function error(...args) {
  const env = import.meta.env.VITE_APP_ENV || 'production';
  if (env === 'local' || env === 'testing') {
    console.error(...args);
  }
}
