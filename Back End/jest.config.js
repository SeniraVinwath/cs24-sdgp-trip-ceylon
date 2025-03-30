module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'controllers/**/*.js',
      'routes/**/*.js',
      '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    testTimeout: 10000
  };