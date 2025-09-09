# Test Quality Assessment Guide

## 🎯 Overview

Beyond code coverage, we use multiple techniques to ensure our tests actually validate the correct behavior and catch bugs effectively.

## 🔧 Available Tools

### 1. Basic Test Quality Analysis

```bash
npm run test:quality
```

**What it measures:**

- Test-to-code ratio
- Assertion density
- Test organization
- Mock usage balance
- Edge case coverage
- Error handling coverage

**Current Score: 85/100** 🏆

### 2. Advanced Test Quality Analysis

```bash
npm run test:quality:advanced
```

**What it detects:**

- Test smells (magic numbers, long methods, etc.)
- Test patterns (AAA, Given-When-Then)
- Cyclomatic complexity
- Code duplication

**Current Score: 81/100** ✅

### 3. Mutation Testing

```bash
npm run test:mutation:critical    # Fast - critical modules only
npm run test:mutation            # Full suite (slower)
```

**What it does:**

- Introduces small bugs (mutations) into your code
- Checks if tests catch these bugs
- Reveals weak spots in test coverage

## 📊 Current Assessment

### Strengths ✅

- **Excellent assertion density** (2.77 per test)
- **Good test organization** (3.26 describes per file)
- **Strong edge case coverage** (157 edge case tests)
- **Balanced mock usage** (Detroit-style with strategic mocking)
- **High test-to-code ratio** (3.61:1)

### Areas for Improvement ⚠️

- **Test naming** (51% descriptive - target 70%+)
- **Magic numbers** (117 instances - extract constants)
- **Test complexity** (some files >20 complexity)

## 🎨 Test Quality Patterns We Use

### 1. Detroit Style Testing (Primary)

```javascript
// Real objects, state-based verification
const ai = new AIPlayer({ id: 1, name: 'AI', hand: [...] })
const gameState = new GameState({ players: [ai] })
const result = ai.pickCard(gameState)
expect(ai.hand[0].infoToken).toBe(true)
```

### 2. Strategic Mocking (Components Only)

```javascript
// Mock external dependencies in Vue components
vi.mock('../../src/composables/managers/GameStateManager.js', () => ({
  useGameStateManager: () => ({ playRound: mockPlayRound }),
}))
```

## 🧬 Mutation Testing Results

Run mutation testing to see how well tests catch actual bugs:

```bash
# Quick check on critical game logic
npm run test:mutation:critical

# Full mutation testing (takes longer)
npm run test:mutation
```

**Target mutation score: 80%+**

## 📝 Writing Quality Tests

### ✅ Good Test Example

```javascript
describe('AIPlayer', () => {
  describe('when picking cards', () => {
    it('should set infoToken on blue card when valid options exist', async () => {
      // Arrange
      const ai = new AIPlayer({
        id: 1,
        hand: [{ color: 'blue', number: 1, infoToken: false }],
      })
      const gameState = new GameState({ players: [ai] })

      // Act
      const result = await ai.pickCard(gameState)

      // Assert
      expect(result).toBe(0)
      expect(ai.hand[0].infoToken).toBe(true)
    })
  })
})
```

### ❌ Test Smells to Avoid

```javascript
// DON'T: Magic numbers
expect(player.hand.length).toBe(12) // What is 12?

// DO: Named constants
const EXPECTED_HAND_SIZE = 12
expect(player.hand.length).toBe(EXPECTED_HAND_SIZE)

// DON'T: Assertion roulette
it('should do everything', () => {
  expect(a).toBe(1)
  expect(b).toBe(2)
  expect(c).toBe(3)
  expect(d).toBe(4)
  expect(e).toBe(5) // Which assertion failed?
})

// DO: Focused tests
it('should set correct player count', () => {
  expect(game.players.length).toBe(EXPECTED_PLAYER_COUNT)
})
```

## 🎯 Quality Gates

### Pre-commit Requirements

- ✅ 97%+ code coverage
- ✅ All tests passing
- ✅ ESLint passing
- ✅ Prettier formatting

### Additional Quality Checks

- 🎯 Test quality score: 80+
- 🧬 Mutation score: 80+
- 📝 Descriptive test names: 70%+
- ⚠️ Test smells: <5 per category

## 🔍 Continuous Improvement

### Weekly Quality Review

1. Run `npm run test:quality:advanced`
2. Check mutation testing results
3. Review complex test files
4. Refactor test smells

### Quality Metrics Dashboard

Track these metrics over time:

- Mutation score trend
- Test complexity trend
- Test smell reduction
- Coverage stability

## 🚀 Future Enhancements

- **Property-based testing** for complex game logic
- **Visual regression testing** for UI components
- **Performance testing** for AI algorithms
- **Contract testing** for component interfaces
