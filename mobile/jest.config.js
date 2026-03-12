/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/mobile/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    }],
  },
};
