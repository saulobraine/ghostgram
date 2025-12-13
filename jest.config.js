export default {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {},
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.snapshot.test.js'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {},
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js'],
      testEnvironment: 'jsdom',
      testTimeout: 10000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {},
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testEnvironment: 'node',
      testTimeout: 30000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {}
    }
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.snapshot.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ]
};

