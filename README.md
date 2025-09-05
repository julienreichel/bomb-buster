# 💣 Bomb Buster

> A cooperative deduction game where players work together as bomb disposal experts to defuse bombs by safely cutting wires.

## 🎮 Live Demo

**[Play Bomb Buster](https://julienreichel.github.io/bomb-buster/)** 🚀

Experience the tension of defusing bombs with advanced AI opponents or test your skills in our comprehensive game simulation engine.

## 🎯 About This Project

**Bomb Buster** is a full-featured implementation of the classic cooperative board game, built as a modern web application. Players must work together to cut all safe wires (blue and yellow) while avoiding red wires that cause instant explosions, all before the detonator dial reaches the critical point.

### 🤖 Built with AI Assistance

This project was developed with the assistance of **GitHub Copilot** and advanced AI coding tools, showcasing how modern AI can help create sophisticated, well-tested applications. The entire codebase, from complex game logic to comprehensive testing, was collaboratively built through human-AI pair programming.

## ✨ Key Features

- 🎲 **Complete Game Implementation**: Full rule set with win/lose conditions
- 🤖 **Advanced AI Players**: Multiple AI strategies with Monte Carlo analysis
- 📊 **Game Analytics**: Comprehensive statistics and simulation engine
- 🎨 **Responsive UI**: Modern Vue.js interface with Quasar components
- 🧪 **Excellent Test Coverage**: 97.41% coverage with 265 comprehensive tests
- 🔧 **Quality Assurance**: Automated CI/CD with complexity control and security scanning

## 🚀 Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **UI Framework**: Quasar 2
- **Build Tool**: Vite
- **Testing**: Vitest with Playwright browser testing
- **Code Quality**: ESLint + Prettier with automated complexity control
- **CI/CD**: GitHub Actions with comprehensive quality workflows

## 📈 Project Stats

- **97.41% Test Coverage** (265 tests across 15 files)
- **Zero ESLint Complexity Violations** (all functions under complexity limit of 16)
- **9 Fully Tested Vue Components**
- **Advanced AI with Multiple Strategies**
- **Complete Game Rule Implementation**

## 🛠️ Development

### Prerequisites

- Node.js (^18, ^20, ^22, ^24, ^26, ^28)
- npm (recommended) or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# or
quasar dev

# Run comprehensive quality checks (mirrors CI)
npm run quality:local
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production

# Testing
npm run test            # Run test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report

# Code Quality
npm run lint            # Check code with ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run quality:check   # Run comprehensive quality checks
npm run quality:local   # Local quality validation (mirrors CI)
```

### Project Structure

```
src/
├── components/          # 9 fully tested Vue components
├── composables/         # Game logic and state management
├── pages/              # Route components (Game, Simulation, etc.)
├── layouts/            # Page layouts
└── router/             # Route configuration

tests/                  # Comprehensive test suite (265 tests)
├── components/         # Component tests
└── unit/              # Unit tests for business logic

.github/workflows/      # CI/CD automation
├── ci.yml             # Main CI pipeline
├── pr-checks.yml      # PR validation
└── maintenance.yml    # Weekly maintenance
```

## 🎯 Game Rules

**Bomb Buster** is a cooperative deduction game where players work as a team of bomb disposal experts:

### Objective

- **Win**: Cut all safe wires (blue and yellow) before the detonator explodes
- **Lose**: Cut a red wire (instant explosion) or let the detonator dial reach 💀

### Gameplay

- **Dual Cut**: Guess a teammate's wire value and cut matching wires
- **Solo Cut**: Cut multiple identical wires from your own hand
- **Equipment**: Use special abilities when certain wires are cut
- **Detonator Dial**: Advances on wrong guesses, bringing you closer to defeat

### Features

- **Multiple AI Strategies**: Different AI personalities and difficulty levels
- **Game Simulation**: Monte Carlo analysis for strategy optimization
- **Statistics Tracking**: Detailed performance metrics and game history
- **Responsive Design**: Play on desktop, tablet, or mobile

## 🔧 Quality & Testing

This project maintains high code quality standards:

- **Automated CI/CD**: GitHub Actions with comprehensive quality checks
- **Code Complexity Control**: ESLint rules prevent overly complex functions
- **Security Scanning**: Weekly CodeQL analysis and dependency audits
- **Test Coverage**: 97.41% coverage enforced by CI
- **Code Formatting**: Prettier with automated formatting checks

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Run quality checks**: `npm run quality:local`
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

All PRs are automatically validated with comprehensive quality checks including linting, formatting, testing, and complexity analysis.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with **GitHub Copilot** and AI-assisted development
- Game mechanics inspired by the classic Bomb Buster board game
- Vue.js and Quasar communities for excellent frameworks
- Open source testing and development tools

---

**[🎮 Play Now](https://julienreichel.github.io/bomb-buster/)** | **[📚 Documentation](docs/)** | **[🐛 Report Issues](https://github.com/julienreichel/bomb-buster/issues)**
