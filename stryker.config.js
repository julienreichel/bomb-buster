// Stryker mutation testing configuration
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
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
  // Use ignorePatterns instead of deprecated files property
  ignorePatterns: ['!src/**/*.spec.js', '!src/**/*.test.js'],
  // Disable type checking to avoid HTML parsing errors
  disableTypeChecks: false,
  // Start with a subset for faster feedback, excluding debugging/logging mutations
  mutator: {
    excludedMutations: [
      'StringLiteral', // Skip string mutations (mostly log messages)
      'ObjectLiteral', // Skip object literal mutations
      'ConsoleLogs', // Skip console.log mutations
      'ArrayDeclaration', // Skip array literal mutations
      'ConditionalExpression', // Skip conditional expressions (includes verbose checks)
      'BooleanLiteral', // Skip boolean literal mutations (verbose flags)
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
