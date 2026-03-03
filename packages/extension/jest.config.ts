import type { Config } from 'jest';

const tsJestConfig = {
  useESM: true,
  tsconfig: 'tsconfig.test.json',
  diagnostics: false
};

const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', tsJestConfig]
  },
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', tsJestConfig]
      },
      extensionsToTreatAsEsm: ['.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/**/*.snapshot.test.ts'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts'
      ]
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', tsJestConfig]
      },
      extensionsToTreatAsEsm: ['.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts'
      ]
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'jsdom',
      testTimeout: 10000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', tsJestConfig]
      },
      extensionsToTreatAsEsm: ['.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts'
      ]
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 30000,
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', tsJestConfig]
      },
      extensionsToTreatAsEsm: ['.ts']
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
    '<rootDir>/tests/setup/jest.setup.ts'
  ]
};

export default config;
