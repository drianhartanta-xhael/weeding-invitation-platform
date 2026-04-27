/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: './__tests__/setup.ts',
  globalTeardown: './__tests__/teardown.ts',
};
