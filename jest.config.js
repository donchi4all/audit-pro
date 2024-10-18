module.exports = {
    preset: 'ts-jest', // Use ts-jest preset for TypeScript support
    testEnvironment: 'node', // Use Node.js environment for testing
    moduleFileExtensions: ['ts', 'js', 'json', 'node'], // Specify file extensions
    testPathIgnorePatterns: ['/node_modules/', '/donsoft/','/src/example'], // Ignore specified paths
    coverageDirectory: 'coverage', // Directory for coverage reports
    collectCoverage: true, // Collect coverage information
    collectCoverageFrom: [
      'src/**/*.ts', // Collect coverage from all TypeScript files in src
      '!src/index.ts', // Exclude index.ts from coverage (optional)
      '!src/example/**/*.ts',
    ],
    roots: ['<rootDir>/tests', '<rootDir>/src'], // Specify roots for test searching
    testMatch: ['**/tests/**/*.test.ts'], // Match test files in __tests__ directory
  };
  