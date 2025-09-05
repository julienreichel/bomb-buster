# Bomb Buster Project Knowledge Base

## Project Overview

**Bomb Buster** is an implementation of the classic board game featuring strategic gameplay with colored strings and tools. This project combines game logic, AI players, user interface, and analytics in a modern web application.

### Project Details

- **Name**: Bomb Buster
- **Version**: 0.0.1
- **Author**: Julien Reichel
- **Description**: A Bomb Buster board game with AI capabilities

## Technology Stack

### Core Technologies

- **Frontend Framework**: Vue.js 3 (^3.4.18)
- **UI Framework**: Quasar 2 (^2.16.0)
- **Build Tool**: Vite (via @quasar/app-vite)
- **Language**: JavaScript (ES Modules)
- **Routing**: Vue Router 4

### Development Tools

- **Testing Framework**: Vitest (^3.2.4)
- **Test Coverage**: >80% coverage with @vitest/coverage-v8
- **Browser Testing**: @vitest/browser with Playwright integration
- **Linting**: ESLint 9 with Vue plugin and complexity rules (max 16)
- **Formatting**: Prettier with automated formatting checks
- **CSS Preprocessing**: SCSS
- **Build System**: Quasar CLI with Vite
- **CI/CD**: GitHub Actions with comprehensive quality workflows

### Code Quality & CI/CD

- **Automated Quality Checks**: Lint, format, type checking, and tests on every PR
- **Complexity Control**: ESLint complexity limit of 16
- **Security Monitoring**: Weekly CodeQL scans and dependency audits
- **Coverage Enforcement**: CI fails if test coverage drops significantly
- **Pre-commit Hooks**: Quality checks before code is committed

## Architecture & Coding Standards

### Vue.js Standards

- **API Style**: Composition API with `<script setup>` syntax
- **Component Structure**: Single File Components (.vue)
- **Reactivity**: Use Vue 3's reactive system (ref, reactive, computed)

### Code Quality Principles

- **Clean Code**: Maximum function complexity of 16, maximum 100 lines per function
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication through helper functions
- **KISS (Keep It Simple, Stupid)**: Recent refactoring reduced complex functions by extracting helpers
- **SOLID Principles**: Single responsibility through function extraction
- **Testing**: 97.41% test coverage with 265 comprehensive tests
- **Complexity Management**: Recent fixes reduced major functions from 40+ to <16 complexity

## Core Features (Implementation Status)

### 1. Game Logic ✅ IMPLEMENTED

**Status**: Complete with comprehensive testing

- ✅ **Blue, Yellow, and Red Wires**: Core game mechanics implemented
- ✅ **Game State Management**: Complete turn tracking, win/lose conditions
- ✅ **Rule Engine**: Full move validation and game progression
- ✅ **Monte Carlo Analysis**: Advanced probability calculations for AI decisions
- ✅ **Complexity Refactored**: Recent improvements reduced complexity from 47 to <16

**Implementation Notes**:

- GameState.js: Core game logic with 97%+ test coverage
- Composables: Game state management with reactive updates
- Helper functions: Complex algorithms broken into maintainable pieces

### 2. Robot Players (AI) ✅ IMPLEMENTED

**Status**: Advanced AI with multiple strategies

- ✅ **AI Algorithms**: Sophisticated probability-based decision making
- ✅ **Strategy Engine**: Multiple AI personalities and difficulty levels
- ✅ **Decision Making**: Monte Carlo simulations for optimal moves
- ✅ **Performance Analysis**: Detailed win/loss statistics and success rates

**Implementation Notes**:

- GameStateManager.js: AI decision engine with complexity <16
- Probability calculations: Advanced statistical analysis
- Multiple AI strategies: Different personalities and risk tolerances

### 3. User Interface ✅ IMPLEMENTED

**Status**: Complete responsive UI with comprehensive components

- ✅ **Game Board**: Fully interactive visual representation
- ✅ **Controls**: Complete move input and game controls
- ✅ **Responsive Design**: Full mobile and desktop support
- ✅ **Component Library**: 9 fully tested Vue components

**Implementation Notes**:

- PlayArea.vue: Main game board with drag-and-drop
- WireCard.vue, PlayerDeck.vue: Interactive game elements
- DetonatorDial.vue: Visual game state indicator
- All components have comprehensive test coverage

### 4. Statistics & Analysis ✅ IMPLEMENTED

**Status**: Advanced analytics and simulation capabilities

- ✅ **Game History**: Complete game storage and retrieval
- ✅ **Performance Metrics**: Detailed win/loss ratios and analysis
- ✅ **Simulation Engine**: Monte Carlo game simulations
- ✅ **Data Visualization**: Interactive statistics dashboard

**Implementation Notes**:

- SimulateGamesPage.vue: Advanced simulation interface (complexity reduced from 40 to <16)
- GameHistory.vue: Complete game tracking
- LocalStorage integration: Persistent data storage
- Statistical analysis: Success rates, dial counts, and performance metrics

**Implementation Notes**:

- Use local storage or IndexedDB for data persistence
- Implement data export/import functionality
- Consider using Chart.js or similar for visualizations

### 5. Unit Testing ✅ IMPLEMENTED

**Status**: Comprehensive test suite with excellent coverage

- ✅ **Test Coverage**: 97.41% coverage across all components and logic
- ✅ **Testing Framework**: Vitest with @vitest/browser integration
- ✅ **Test Types**: 265 tests including unit, integration, and browser tests
- ✅ **Continuous Testing**: Automated testing on every commit via CI/CD
- ✅ **Quality Gates**: Tests must pass before code can be merged

**Implementation Notes**:

- Vitest configuration with Playwright browser testing
- Comprehensive test utilities in tests/test-utils.js
- Component tests for all 9 Vue components
- Unit tests for all game logic and AI algorithms
- CI/CD integration with automated test running and coverage reporting

## Project Structure (Current Implementation)

```
src/
├── components/          # 9 fully tested Vue components
│   ├── DetonatorDial.vue      # Game state indicator
│   ├── GameHistory.vue        # Historical game data
│   ├── GameStatus.vue         # Current game status
│   ├── LoadingState.vue       # Loading indicators
│   ├── PlayArea.vue           # Main game board
│   ├── PlayerDeck.vue         # Player wire management
│   ├── PlayerSelector.vue     # Player configuration
│   ├── WireCard.vue          # Individual wire cards
│   └── WireTracker.vue       # Wire tracking display
├── composables/         # Game logic and state management
│   ├── managers/
│   │   ├── GameSetupHelpers.js    # Game initialization
│   │   └── GameStateManager.js    # AI and game flow
│   └── models/
│       ├── Equipment.js       # Equipment card logic
│       ├── GameState.js       # Core game state (complexity reduced)
│       ├── Player.js          # Player management
│       └── WireTile.js        # Wire tile logic
├── assets/             # Static assets
├── css/                # Global SCSS styles
├── layouts/            # Page layouts
│   └── MainLayout.vue
├── pages/              # Route components
│   ├── ErrorNotFound.vue
│   ├── GamePage.vue
│   ├── SimulateGamesPage.vue  # Advanced simulation (complexity reduced)
│   └── StartGamePage.vue
└── router/             # Route configuration

tests/                  # Comprehensive test suite (265 tests)
├── test-utils.js           # Testing utilities
├── components/             # Component tests (9 files)
└── unit/                   # Unit tests for business logic

.github/workflows/      # CI/CD automation
├── ci.yml                  # Main CI pipeline
├── pr-checks.yml          # PR validation
└── maintenance.yml        # Weekly maintenance

scripts/                # Development tools
└── quality-check.sh       # Local quality validation

docs/                   # Project documentation
└── CI_IMPROVEMENTS.md     # Comprehensive CI/CD documentation
```

## Development Workflow (Current Implementation)

### Environment Setup

- Node.js (^18, ^20, ^22, ^24, ^26, ^28)
- Package Manager: npm (with npm ci for CI/CD)
- Development Server: `quasar dev`
- Local Quality Checks: `npm run quality:local`

### Code Standards & Quality Gates

- **Linting**: ESLint 9 with complexity rules (max 16) and Vue plugin
- **Formatting**: Prettier with automated CI checks
- **No Console Rule**: Disabled for development flexibility
- **Testing**: 97.41% coverage requirement enforced by CI
- **Complexity Control**: Recent refactoring brought all functions under complexity limit

### Automated Workflows

#### Main CI Pipeline (`ci.yml`)

- Runs on every push and PR
- Linting, formatting, type checking
- Comprehensive test suite with coverage
- Automated build and deployment to GitHub Pages

#### PR Validation (`pr-checks.yml`)

- Complexity violation detection
- Automated quality status comments
- Coverage threshold validation
- Draft PR protection

#### Weekly Maintenance (`maintenance.yml`)

- Security audits with CodeQL
- Dependency update monitoring
- Technical debt tracking (TODO/FIXME)
- Quality health reports

### Local Development Tools

```bash
# Quick quality check (mirrors CI)
npm run quality:local

# Individual checks
npm run lint              # ESLint validation
npm run lint:fix         # Auto-fix linting issues
npm run format:check     # Prettier validation
npm run format           # Auto-format code
npm run test             # Run test suite
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode for development

# Build and deployment
npm run build            # Production build
npm run dev              # Development server
```

### Quality Achievements

- **Zero ESLint Complexity Violations**: All functions now under complexity limit of 16
- **97.41% Test Coverage**: 265 tests across 15 test files
- **Automated Quality Gates**: CI prevents merging of low-quality code
- **Clean Code Practices**: Recent refactoring improved maintainability significantly

## Game Rules & Mechanics

### Basic Game Concept

**Bomb Busters** is a cooperative deduction game where players are a team of bomb disposal experts trying to defuse a bomb by safely cutting wires.

#### Objective

- The team wins by cutting all safe wires (blue and yellow) without:
  - Cutting a red wire (instant explosion)
  - Letting the detonator dial reach the explosion icon (💀)

#### Players

- Human vs AI, AI vs AI, Human vs Human
- Each player takes a Character card and 1 or 2 tile stands with face-down wire tiles (depending on player count)

#### Components

- Wire tiles: Blue (safe), Yellow (safe but harder to identify), Red (cut = instant explosion!)
- Info tokens, equipment cards, detonator dial

#### Game Setup

1. Pick a mission (missions get harder over time)
2. Choose a Captain (rotates each mission)
3. Distribute Character cards and wire tiles
4. Place info tokens, equipment cards, and the detonator dial

#### Gameplay (Turns in Clockwise Order)

On your turn, choose one of these 3 actions:

1. **Dual Cut**
   - Try to cut a wire from your hand and one from a teammate's hand, of the same value.
   - Guess your teammate’s wire value.
   - If correct: both wires are revealed and safely cut.
   - If wrong:
     - If red: 💥 game over!
     - If blue/yellow: dial advances + info token is placed.

2. **Solo Cut**
   - If all remaining wires of a value are in your own hand, you can cut 2 or 4 identical wires by yourself.
   - Safe only if you're sure of their values.

3. **Reveal Red Wires**
   - If all your remaining wires are red, you can reveal them without cutting.

#### Yellow Wires

- Treated as “YELLOW” (not by number).
- Cut using the same Dual or Solo method.
- If guessed wrong, the dial still advances.

#### Clues and Info Tokens

- Each player gives one public clue at the start by placing an info token on a wire in their own hand.
- More info tokens are revealed during failed guesses.

#### Equipment

- Becomes usable when 2 wires of its number are cut.
- Can be used once, sometimes even outside your turn.
- Abilities vary (e.g., scanning wires, protecting from errors, etc.).

#### Characters

- Each has a 1-use special ability per mission (e.g., guessing 2 wires at once).

#### Game Over

- You lose if:
  - A red wire is cut.
  - The detonator dial reaches the skull.
- You win if:
  - All safe wires are cut and no wires remain in any player's stand.

#### Game Flow

1. **Initialization**: Set up board, mission, and players
2. **Turn Management**: Alternate between players, Captain rotates each mission
3. **Action Selection**: Choose Dual Cut, Solo Cut, or Reveal Red Wires
4. **Move Validation**: Ensure legal moves and apply consequences
5. **Win/Lose Check**: Check for victory or defeat conditions
6. **Result Recording**: Store game statistics

## Future Enhancements

### Phase 2 Features

- **Tools System**: Additional game mechanics beyond strings
- **AI Training**: Machine learning for AI improvement

### Technical Improvements ✅ COMPLETED

- ✅ **Code Quality**: Comprehensive ESLint rules with complexity control
- ✅ **CI/CD Pipeline**: Full automation with GitHub Actions
- ✅ **Performance**: Optimized through complexity reduction and helper function extraction
- ✅ **Testing Infrastructure**: Comprehensive Vitest setup with browser testing
- ✅ **Developer Experience**: Local quality tools and automated feedback

### Future Enhancements

- **TypeScript**: Gradual migration for enhanced type safety
- **PWA**: Progressive Web App capabilities for offline play
- **Internationalization**: Multi-language support
- **Enhanced AI**: Machine learning for AI improvement
- **Real-time Multiplayer**: WebSocket integration for live games

## Dependencies & Libraries (Current Implementation)

### Production Dependencies

- **Vue.js 3** (^3.4.18): Core reactive framework
- **Quasar** (^2.16.0): UI components and framework
- **Vue Router** (^4.0.0): Client-side routing
- **@quasar/extras** (^1.16.4): Icon sets and fonts

### Development Dependencies

#### Build & Development Tools

- **@quasar/app-vite** (^2.1.0): Build system and dev server
- **@vitejs/plugin-vue** (^6.0.1): Vue support for Vite
- **vite-plugin-checker** (^0.9.0): Type checking integration

#### Code Quality & Linting

- **ESLint** (^9.14.0): JavaScript/Vue linting
- **@eslint/js** (^9.14.0): ESLint core rules
- **eslint-plugin-vue** (^9.30.0): Vue-specific linting rules
- **@vue/eslint-config-prettier** (^10.1.0): Prettier integration
- **globals** (^15.12.0): Global variable definitions
- **Prettier** (^3.3.3): Code formatting

#### Testing Framework

- **Vitest** (^3.2.4): Main testing framework
- **@vitest/coverage-v8** (^3.2.4): Coverage reporting
- **@vitest/ui** (^3.2.4): Test UI dashboard
- **@vitest/browser** (^3.2.4): Browser testing
- **vitest-browser-vue** (^1.1.0): Vue component testing in browser
- **Playwright** (^1.55.0): Browser automation for testing

#### Build Tools

- **PostCSS** (^8.4.14): CSS processing
- **Autoprefixer** (^10.4.2): CSS vendor prefixing

### Current Statistics

- **Test Coverage**: 97.41%
- **Total Tests**: 265 tests across 15 files
- **Components Tested**: 9/9 Vue components
- **Business Logic Coverage**: Complete coverage of game logic and AI

## Project Status & Achievements

### 🎉 Completed Features

✅ **Full Game Implementation**: Complete Bomb Buster game with all rules
✅ **Advanced AI System**: Sophisticated AI with multiple strategies and Monte Carlo analysis
✅ **Comprehensive UI**: 9 fully tested Vue components with responsive design
✅ **Statistics & Analytics**: Game simulation, history tracking, and performance analysis
✅ **Testing Excellence**: 97.41% coverage with 265 comprehensive tests
✅ **Code Quality**: Zero complexity violations, all functions under complexity limit of 16
✅ **CI/CD Pipeline**: Automated quality gates, security scanning, and deployment
✅ **Developer Tools**: Local quality scripts and comprehensive documentation

### 📊 Key Metrics

- **Lines of Code**: Well-organized codebase with clean architecture
- **Test Coverage**: 97.41% (265 tests across 15 files)
- **Code Complexity**: All functions now under ESLint limit of 16
- **Components**: 9 fully tested Vue components
- **AI Strategies**: Multiple AI personalities with statistical analysis
- **Game Features**: Complete rule implementation with win/loss detection

### 🚀 Recent Improvements (Last 13 Commits)

1. **Complexity Reduction**: Reduced major functions from 40+ complexity to <16
2. **Helper Function Extraction**: Broke down complex algorithms into maintainable pieces
3. **Enhanced CI/CD**: Added comprehensive quality workflows and automation
4. **Security Integration**: Weekly CodeQL scans and dependency monitoring
5. **Developer Experience**: Local quality tools and automated feedback systems

## Next Steps & Maintenance

### Immediate Priorities

1. **Monitor CI/CD**: Ensure new workflows operate smoothly
2. **Code Review**: Use enhanced PR checks for quality maintenance
3. **Performance Monitoring**: Track application performance in production
4. **User Feedback**: Gather feedback on game balance and AI difficulty

### Long-term Roadmap

1. **TypeScript Migration**: Gradual adoption for better type safety
2. **PWA Implementation**: Offline capability and app-like experience
3. **Multiplayer Features**: Real-time gameplay with WebSocket integration
4. **AI Enhancement**: Machine learning integration for adaptive difficulty
5. **Mobile Optimization**: Enhanced touch interfaces and responsive design

---

_This knowledge base reflects the current state of the project after 13 commits of systematic improvements and represents a fully functional, well-tested, and maintainable Bomb Buster implementation._
