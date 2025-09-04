# GitHub Copilot Instructions for Bomb Buster Project

## 🎯 Project Context

This is a Vue 3 + Quasar cooperative bomb defusing game with comprehensive testing using Vitest. The codebase follows clean code principles and maintains high test coverage.

## 📋 Code Quality Standards

### Clean Code Principles

- **Single Responsibility**: Each function/class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Many client-specific interfaces better than one general-purpose
- **Dependency Inversion**: Depend on abstractions, not concretions
- **DRY**: Don't Repeat Yourself - extract common patterns
- **YAGNI**: You Aren't Gonna Need It - don't add premature features

### Code Organization

- Use Vue 3 Composition API with `<script setup>`
- Extract reusable logic into composables (`use*` functions)
- Keep components under 100 lines when possible
- Separate concerns: UI logic, business logic, data access
- Use TypeScript-style JSDoc comments for better IntelliSense

### Naming Conventions

- Components: PascalCase (`GameBoard.vue`)
- Composables: camelCase with `use` prefix (`useGameState.js`)
- Functions/Variables: camelCase (`calculateScore`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)
- CSS Classes: kebab-case (`game-board`)
- Files: kebab-case for multi-word (`game-state.js`)

## 🧪 Testing Requirements

### Coverage Goals

- **Minimum 80% code coverage** for all new code
- **100% coverage** for critical game logic (GameState, Player, etc.)
- Test all public methods and edge cases
- Include both positive and negative test scenarios

### Test Structure (AAA Pattern)

```javascript
it('should describe expected behavior', () => {
  // Arrange - Set up test data
  const input = 'test-data'
  const expected = 'expected-result'

  // Act - Execute the function
  const result = functionUnderTest(input)

  // Assert - Verify the outcome
  expect(result).toBe(expected)
})
```

### Test Categories

- **Unit Tests**: Individual functions/methods
- **Integration Tests**: Component interactions
- **Component Tests**: Vue component behavior
- **Edge Cases**: Null/undefined inputs, boundary conditions
- **Error Handling**: Exception paths and error scenarios

## 🏗️ Architecture Patterns

### Vue 3 Component Structure

```vue
<template>
  <!-- Keep template simple and declarative -->
</template>

<script setup>
// 1. Imports
import { ref, computed, onMounted } from 'vue'

// 2. Props with validation
const props = defineProps({
  // Always include type and validation
})

// 3. Emits
const emit = defineEmits(['event-name'])

// 4. Composables
const { state, methods } = useComposable()

// 5. Local reactive state
const localState = ref()

// 6. Computed properties
const computed = computed(() => {})

// 7. Methods (pure functions when possible)
const method = () => {}

// 8. Lifecycle hooks
onMounted(() => {})
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Composable Pattern

```javascript
export function useFeature(dependencies) {
  // Private state
  const state = ref()

  // Private methods
  const privateMethod = () => {}

  // Public API (return only what consumers need)
  return {
    // Computed state
    computedValue: computed(() => state.value),
    // Methods
    publicMethod,
  }
}
```

## 🔧 Function Design

### Pure Functions (Preferred)

```javascript
// Good: Pure function
function calculateDamage(attack, defense) {
  return Math.max(0, attack - defense)
}

// Avoid: Side effects
function calculateDamage(player) {
  player.health -= damage // Mutates input
}
```

### Error Handling

```javascript
function validateInput(data) {
  if (!data) {
    throw new Error('Data is required')
  }

  if (typeof data !== 'object') {
    throw new TypeError('Data must be an object')
  }

  // Continue with validation
}
```

### Async/Await Pattern

```javascript
async function fetchData() {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    console.error('Failed to fetch data:', error)
    throw new Error('Data fetch failed')
  }
}
```

## 📝 Commit Message Format (Conventional Commits 1.0.0)

### Structure

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(game): add double detector equipment functionality

- Implement double detector logic in GameStateManager
- Add UI controls for double detector activation
- Include comprehensive test coverage

Closes #123
```

```
fix(player): resolve AI decision-making with probability calculations

The AI was using outdated property names after the recent refactoring.
Updated to use 'number' instead of 'value' in slot probabilities.

BREAKING CHANGE: GameState.monteCarloSlotProbabilities now returns 'number' property
```

## 🔍 Code Review Checklist

Before suggesting code, ensure:

- [ ] Follows Single Responsibility Principle
- [ ] Has proper error handling
- [ ] Includes JSDoc comments for public APIs
- [ ] No code duplication (DRY principle)
- [ ] Variables and functions have descriptive names
- [ ] Edge cases are considered
- [ ] Tests are included for new functionality
- [ ] No magic numbers or strings
- [ ] Proper separation of concerns

## 🚫 Anti-Patterns to Avoid

### Don't

```javascript
// Avoid: Long parameter lists
function createPlayer(name, age, level, health, mana, items, skills) {}

// Avoid: Deeply nested conditions
if (user) {
  if (user.permissions) {
    if (user.permissions.canEdit) {
      // Logic here
    }
  }
}

// Avoid: Magic numbers
setTimeout(callback, 300000) // What is 300000?

// Avoid: Mutating props
props.user.name = 'New Name'
```

### Do

```javascript
// Good: Object parameter
function createPlayer({ name, age, level, health, mana, items, skills }) {}

// Good: Early returns
function canUserEdit(user) {
  if (!user) return false
  if (!user.permissions) return false
  return user.permissions.canEdit
}

// Good: Named constants
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes
setTimeout(callback, CACHE_TIMEOUT)

// Good: Immutable updates
const updatedUser = { ...user, name: 'New Name' }
```

## 🎮 Game-Specific Patterns

### Game State Management

- Use reactive state for game data
- Implement undo/redo functionality
- Validate all player actions
- Log game events for debugging

### AI Decision Making

- Use probability-based algorithms
- Include randomization for unpredictability
- Test with deterministic scenarios
- Document decision logic clearly

### Component Communication

- Use props down, events up pattern
- Emit semantic events (`card-selected`, not `click`)
- Validate all props with proper types
- Use provide/inject for deep prop drilling

## 📚 Documentation Standards

### JSDoc Examples

```javascript
/**
 * Calculates the probability of successfully defusing the bomb
 * @param {Object} gameState - Current game state
 * @param {number} gameState.timeRemaining - Seconds left on timer
 * @param {Array<Player>} gameState.players - Active players
 * @param {number} difficultyLevel - Game difficulty (1-5)
 * @returns {number} Probability between 0 and 1
 * @throws {Error} When gameState is invalid
 * @example
 * const probability = calculateDefuseChance(gameState, 3)
 * console.log(`Success chance: ${probability * 100}%`)
 */
function calculateDefuseChance(gameState, difficultyLevel) {
  // Implementation
}
```

### README Sections

When updating documentation:

- Clear installation instructions
- Usage examples with code
- API documentation for public functions
- Contributing guidelines
- Testing instructions

---

## 💡 General Guidelines for AI Assistance

### When I Ask for Code:

1. **Ask for clarification** if requirements are unclear
2. **Suggest architecture** before implementing
3. **Include tests** with the implementation
4. **Explain design decisions** and trade-offs
5. **Follow the established patterns** in the codebase
6. **Consider edge cases** and error scenarios
7. **Optimize for readability** over clever solutions

### When I Ask for Refactoring:

1. **Preserve existing functionality**
2. **Improve code structure** without breaking changes
3. **Add tests** if missing
4. **Document any breaking changes**
5. **Follow SOLID principles**
6. **Extract reusable patterns**

### When I Ask for Bug Fixes:

1. **Identify root cause** before fixing symptoms
2. **Add tests** to prevent regression
3. **Consider related edge cases**
4. **Update documentation** if needed
5. **Use minimal changes** to fix the issue

Remember: **Quality over quantity**. It's better to write less code that is well-tested, documented, and maintainable than to write more code quickly.
