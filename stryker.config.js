// Stryker mutation testing configuration
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--experimental-loader', '@stryker-mutator/javascript-mutator/register'],
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.js',
    '!src/router/**',
    '!src/pages/**',
    '!src/layouts/**',
    '!src/boot/**',
  ],
  // Focus on critical game logic first
  files: ['src/**/*.js', 'tests/**/*.spec.js', '!src/**/*.spec.js'],
  // Start with a subset for faster feedback
  mutator: {
    plugins: ['javascript'],
    excludedMutations: [
      'StringLiteral', // Skip string mutations for now
      'ObjectLiteral', // Skip object literal mutations
    ],
  },
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  timeoutMS: 30000,
  // Focus on most critical modules first
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,
}
