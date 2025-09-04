# Development Workflow & Code Quality Guidelines

## 🚀 Quick Start for Developers

### Prerequisites

- Node.js (18+ recommended)
- Git with configured commit template
- VS Code with recommended extensions

### Setup

```bash
# Install dependencies
npm ci

# Install git hooks
npm run prepare

# Start development server
npm run dev
```

## 📋 Code Quality Standards

### Clean Code Principles

We follow **SOLID principles** and clean code practices:

- **S**ingle Responsibility: Each function/class has one job
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Derived classes must be substitutable
- **I**nterface Segregation: Many specific interfaces > one general
- **D**ependency Inversion: Depend on abstractions, not concretions

### Code Organization

```
src/
├── components/          # Reusable UI components
├── composables/         # Shared business logic
│   ├── models/         # Data models (90%+ coverage required)
│   └── managers/       # Business logic managers (85%+ coverage)
├── pages/              # Route components
└── layouts/            # Layout components
```

### Testing Requirements

- **Minimum 80% code coverage** for all code
- **90%+ coverage** for critical game logic (`models/`, `managers/`)
- Test all public APIs and edge cases
- Follow AAA pattern (Arrange, Act, Assert)

```bash
# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Open coverage report
npm run test:coverage:open
```

## 🔧 Development Commands

### Quality Assurance

```bash
# Check all quality standards
npm run quality:check

# Linting
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues

# Formatting
npm run format            # Format all files
npm run format:check      # Check formatting only
```

### Testing

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test-ui           # Visual test runner
```

### Building

```bash
npm run dev               # Development server
npm run build             # Production build
```

## 📝 Commit Message Format (Conventional Commits)

We use [Conventional Commits 1.0.0](https://conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature addition
feat(game): add double detector equipment

# Bug fix
fix(player): resolve AI decision-making logic

# Breaking change
feat(api): redesign game state interface

BREAKING CHANGE: GameState.slots now returns 'number' instead of 'value'
```

## 🏗️ Architecture Patterns

### Vue 3 Component Structure

```vue
<template>
  <!-- Keep templates simple and declarative -->
</template>

<script setup>
// 1. Imports
import { ref, computed } from 'vue'

// 2. Props (with validation)
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
    validator: (value) => value.length > 0,
  },
})

// 3. Emits
const emit = defineEmits(['update:modelValue'])

// 4. Composables
const { state, methods } = useFeature()

// 5. Local state
const localState = ref('')

// 6. Computed properties
const computedValue = computed(() => {
  return props.modelValue.toUpperCase()
})

// 7. Methods (prefer pure functions)
const handleUpdate = (value) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Composable Pattern

```javascript
export function useGameFeature(initialState) {
  // Private state
  const state = ref(initialState)
  const loading = ref(false)
  const error = ref(null)

  // Private methods
  const validateInput = (input) => {
    if (!input) throw new Error('Input required')
  }

  // Public methods
  const updateState = async (newState) => {
    try {
      loading.value = true
      validateInput(newState)
      state.value = newState
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Public API (only expose what's needed)
  return {
    // Read-only state
    state: readonly(state),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    updateState,
  }
}
```

### Test Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('FeatureName', () => {
  let instance

  beforeEach(() => {
    // Arrange - Setup test data
    instance = createTestInstance()
  })

  describe('methodName', () => {
    it('should handle normal case correctly', () => {
      // Arrange
      const input = 'test-input'
      const expected = 'expected-output'

      // Act
      const result = instance.methodName(input)

      // Assert
      expect(result).toBe(expected)
    })

    it('should handle edge case: null input', () => {
      // Act & Assert
      expect(() => {
        instance.methodName(null)
      }).toThrow('Input required')
    })
  })
})
```

## 🚨 Pre-commit Hooks

Before each commit, the following checks run automatically:

1. **Code formatting** check
2. **ESLint** validation
3. **Test suite** with coverage requirements

If any check fails, the commit is blocked. Fix issues with:

```bash
npm run format        # Fix formatting
npm run lint:fix      # Fix linting issues
npm run test:coverage # Check test coverage
```

## 🎯 VS Code Configuration

The project includes comprehensive VS Code settings:

### Recommended Extensions

- **Vue Language Features (Volar)**: Vue 3 support
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Coverage Gutters**: Test coverage visualization
- **GitLens**: Enhanced Git features
- **GitHub Copilot**: AI-powered coding assistance

### Code Snippets

Use these snippets for consistent code:

- `vue3-comp`: Vue 3 component template
- `use-composable`: Composable function template
- `test-suite`: Test suite template
- `solid-class`: Class with SOLID principles
- `commit-msg`: Conventional commit template

### Tasks & Debugging

- **Ctrl/Cmd + Shift + P**: Command palette
- Available tasks: Test, Lint, Build, Coverage
- Debug configurations for tests and browser

## 🔍 Code Review Checklist

Before submitting code:

### Functionality

- [ ] Code works as expected
- [ ] All tests pass with 80%+ coverage
- [ ] No console errors or warnings

### Code Quality

- [ ] Follows Single Responsibility Principle
- [ ] Functions are small (< 50 lines)
- [ ] No code duplication (DRY)
- [ ] Descriptive naming (no abbreviations)
- [ ] Proper error handling

### Vue.js Best Practices

- [ ] Components are focused and reusable
- [ ] Props have proper validation
- [ ] Events are semantic and documented
- [ ] No prop mutation
- [ ] Reactive data is properly structured

### Testing

- [ ] Unit tests for all public methods
- [ ] Edge cases are covered
- [ ] Mocks are used appropriately
- [ ] Tests are readable and maintainable

### Documentation

- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] Commit follows conventional format
- [ ] Breaking changes are documented

## 🐛 Troubleshooting

### Common Issues

**Tests failing locally but not in CI:**

```bash
# Clear cache and reinstall
rm -rf node_modules coverage .quasar
npm ci
npm run test:coverage
```

**ESLint errors:**

```bash
# Auto-fix common issues
npm run lint:fix

# For complex issues, check eslint.config.js
```

**Coverage below threshold:**

```bash
# Check coverage report
npm run test:coverage:open

# Focus on untested files in coverage/index.html
```

**Git hooks not working:**

```bash
# Reinstall hooks
npm run prepare
chmod +x .husky/pre-commit
```

### Getting Help

1. Check this documentation
2. Review code examples in existing files
3. Use VS Code snippets for consistent patterns
4. Ask for code review early and often

---

💡 **Remember**: Quality over quantity. Write less code that is well-tested, documented, and maintainable.
