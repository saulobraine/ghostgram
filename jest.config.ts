import type { Config } from 'jest';

const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts'
  ],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js', '<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      extensionsToTreatAsEsm: ['.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/**/*.snapshot.test.ts'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js', '<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      extensionsToTreatAsEsm: ['.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js', '<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'jsdom',
      testTimeout: 10000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      extensionsToTreatAsEsm: ['.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js'
      ]
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js', '<rootDir>/tests/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 30000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {}
    }
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.snapshot.test.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ]
};

export default config;
