module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
};
