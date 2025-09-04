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

- **Linting**: ESLint 9 with Vue plugin
- **Formatting**: Prettier
- **CSS Preprocessing**: SCSS
- **Build System**: Quasar CLI with Vite

## Architecture & Coding Standards

### Vue.js Standards

- **API Style**: Composition API with `<script setup>` syntax
- **Component Structure**: Single File Components (.vue)
- **Reactivity**: Use Vue 3's reactive system (ref, reactive, computed)

### Code Quality Principles

- **DRY (Don't Repeat Yourself)**: Eliminate code duplication through proper abstraction
- **KISS (Keep It Simple, Stupid)**: Favor simple, readable solutions over complex ones
- **Best Practices**: Follow Vue.js and JavaScript best practices
- **Testing**: All components must have unit tests

## Core Features to Implement

### 1. Game Logic

**Priority**: High

- **Blue, Yellow, and Red Strings**: Core game mechanics
- **Game State Management**: Turn tracking, win/lose conditions
- **Rule Engine**: Validate moves and game progression
- **Future Extensions**: Tools and additional functionalities

**Implementation Notes**:

- Create composables for game state management
- Use Pinia for state management if needed
- Separate business logic from UI components

### 2. Robot Players (AI)

**Priority**: High

- **AI Algorithms**: Best capacity as possible based on statistics
- **Strategy Engine**: Different AI personalities/strategies
- **Decision Making**: Move calculation and optimization
- **Learning Capabilities**: Analyze game patterns

**Implementation Notes**:

- Create separate AI modules/classes
- Implement strategy pattern for different AI types

### 3. User Interface

**Priority**: High

- **Game Board**: Interactive visual representation
- **Controls**: Move input, game controls
- **Responsive Design**: Mobile and desktop support
- **Accessibility**: WCAG compliance

**Implementation Notes**:

- Use Quasar components for consistent UI
- Implement touch and mouse interactions
- Use CSS Grid/Flexbox for board layout

### 4. Statistics & Analysis

**Priority**: Medium

- **Game History**: Store and retrieve past games
- **Performance Metrics**: Win/loss ratios, move analysis
- **Strategy Analysis**: Pattern recognition in gameplay
- **Data Visualization**: Charts and graphs for insights

**Implementation Notes**:

- Use local storage or IndexedDB for data persistence
- Implement data export/import functionality
- Consider using Chart.js or similar for visualizations

### 5. Unit Testing

**Priority**: High

- **Test Coverage**: 100% for game logic, high for UI components
- **Testing Framework**: To be selected (Jest, Vitest recommended)
- **Test Types**: Unit tests, integration tests
- **Continuous Testing**: Run tests on every commit

**Implementation Notes**:

- Set up testing framework early in development
- Write tests before implementing features (TDD approach)
- Mock external dependencies

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── composables/         # Vue composition functions
├── stores/             # State management (Pinia)
├── services/           # Business logic and API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions (if adopted)
├── assets/             # Static assets
├── css/                # Global styles
├── layouts/            # Page layouts
├── pages/              # Route components
└── router/             # Route configuration

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── __mocks__/          # Test mocks
```

## Development Workflow

### Environment Setup

- Node.js (^18, ^20, ^22, ^24, ^26, ^28)
- Package Manager: npm or yarn
- Development Server: `quasar dev`

### Code Standards

- **Linting**: ESLint configuration with Vue plugin
- **Formatting**: Prettier for consistent code style
- **Git Hooks**: Pre-commit hooks for linting and testing

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows (future consideration)

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

### Technical Improvements

- **TypeScript**: Gradual migration for better type safety
- **PWA**: Progressive Web App capabilities
- **Performance**: Optimize for large-scale gameplay
- **Internationalization**: Multi-language support

## Dependencies & Libraries

### Production Dependencies

- Vue.js 3: Core framework
- Quasar: UI components and framework
- Vue Router: Client-side routing

### Development Dependencies

- ESLint: Code linting
- Prettier: Code formatting
- Vite: Build tool and dev server

### Testing Dependencies (To Add)

- Vitest: Testing framework
- Vue Test Utils: Vue component testing
- @testing-library/vue: Testing utilities

## Next Steps

2. **Set Up Testing**: Configure Jest/Vitest and testing utilities
3. **Create Core Components**: Start with game board and basic UI
4. **Implement Game Logic**: Begin with basic string mechanics
5. **Add AI Players**: Start with simple AI algorithms
6. **Iterate and Test**: Continuous development with testing

---

_This knowledge base should be updated as the project evolves and new requirements are discovered._
