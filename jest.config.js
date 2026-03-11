/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  testEnvironmentOptions: {},
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      testMatch: [
        '**/__tests__/api/**/*.test.ts',
        '**/__tests__/apis/**/*.test.ts',
        '**/__tests__/utils/**/*.test.ts',
      ],
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      testMatch: ['**/__tests__/hooks/**/*.test.ts'],
    },
  ],
};
