#!/usr/bin/env node

/**
 * Advanced Test Quality Analyzer
 * Performs deep analysis of test code quality and effectiveness
 */

import fs from 'fs'
import { glob } from 'glob'
import path from 'path'

class TestQualityAnalyzer {
  constructor() {
    this.testFiles = []
    this.srcFiles = []
    this.metrics = {
      testSmells: [],
      complexity: {},
      dependencies: {},
      patterns: {},
    }
  }

  async analyze() {
    console.log('🔬 Advanced Test Quality Analysis')
    console.log('=================================\n')

    await this.loadFiles()
    this.analyzeTestSmells()
    this.analyzeTestPatterns()
    this.analyzeTestComplexity()
    this.generateReport()
  }

  async loadFiles() {
    this.testFiles = await glob('tests/**/*.spec.js')
    this.srcFiles = await glob('src/**/*.js', {
      ignore: ['src/router/**', 'src/pages/**', 'src/layouts/**'],
    })
  }

  analyzeTestSmells() {
    console.log('👃 Test Smell Detection')
    console.log('----------------------')

    const smells = {
      'Excessive Setup': 0,
      'Magic Numbers': 0,
      'Assertion Roulette': 0,
      'Duplicated Test Code': 0,
      'Long Test Methods': 0,
      'Conditional Test Logic': 0,
    }

    this.testFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')

      // Detect excessive setup (beforeEach with many lines)
      const beforeEachMatches = content.match(/beforeEach\s*\([^}]+\}/g) || []
      beforeEachMatches.forEach((match) => {
        if (match.split('\n').length > 10) {
          smells['Excessive Setup']++
        }
      })

      // Detect magic numbers
      const magicNumbers = content.match(/\b\d{2,}\b/g) || []
      smells['Magic Numbers'] += magicNumbers.length

      // Detect assertion roulette (tests with many assertions)
      const testBlocks = content.match(/it\([^}]+\}(\s*\))?/g) || []
      testBlocks.forEach((block) => {
        const assertions = (block.match(/expect\(/g) || []).length
        if (assertions > 5) {
          smells['Assertion Roulette']++
        }
      })

      // Detect long test methods
      testBlocks.forEach((block) => {
        if (block.split('\n').length > 20) {
          smells['Long Test Methods']++
        }
      })

      // Detect conditional logic in tests
      const conditionals = (content.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length
      smells['Conditional Test Logic'] += conditionals
    })

    Object.entries(smells).forEach(([smell, count]) => {
      const status = count === 0 ? '✅' : count < 5 ? '⚠️' : '❌'
      console.log(`${status} ${smell}: ${count}`)
    })

    this.metrics.testSmells = smells
    console.log('')
  }

  analyzeTestPatterns() {
    console.log('🎨 Test Pattern Analysis')
    console.log('------------------------')

    const patterns = {
      'AAA Pattern': 0,
      'Given-When-Then': 0,
      'Builder Pattern': 0,
      'Object Mother': 0,
      'Test Data Builders': 0,
    }

    this.testFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8')

      // Detect AAA pattern (Arrange, Act, Assert comments)
      if (
        content.includes('// Arrange') ||
        content.includes('// Act') ||
        content.includes('// Assert')
      ) {
        patterns['AAA Pattern']++
      }

      // Detect Given-When-Then
      if (content.includes('given') || content.includes('when') || content.includes('then')) {
        patterns['Given-When-Then']++
      }

      // Detect builder patterns
      if (content.includes('.build()') || content.includes('Builder')) {
        patterns['Builder Pattern']++
      }

      // Detect object mother pattern
      if (
        (content.includes('create') && content.includes('Player')) ||
        content.includes('GameState')
      ) {
        patterns['Object Mother']++
      }
    })

    Object.entries(patterns).forEach(([pattern, count]) => {
      const status = count > 0 ? '✅' : '⚠️'
      console.log(`${status} ${pattern}: ${count} files`)
    })

    this.metrics.patterns = patterns
    console.log('')
  }

  analyzeTestComplexity() {
    console.log('🧮 Test Complexity Analysis')
    console.log('---------------------------')

    let totalCyclomaticComplexity = 0
    let maxComplexity = 0
    const complexTests = []

    this.testFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8')

      // Simple cyclomatic complexity calculation
      const complexityKeywords =
        content.match(/if|else|for|while|switch|case|catch|\?|&&|\|\|/g) || []
      const fileComplexity = complexityKeywords.length + 1

      totalCyclomaticComplexity += fileComplexity

      if (fileComplexity > maxComplexity) {
        maxComplexity = fileComplexity
      }

      if (fileComplexity > 20) {
        complexTests.push({ file: path.basename(filePath), complexity: fileComplexity })
      }
    })

    const avgComplexity = totalCyclomaticComplexity / this.testFiles.length

    console.log(`Average test complexity: ${avgComplexity.toFixed(2)}`)
    console.log(`Maximum test complexity: ${maxComplexity}`)
    console.log(`Complex test files (>20): ${complexTests.length}`)

    if (complexTests.length > 0) {
      console.log('\nMost complex test files:')
      complexTests
        .sort((a, b) => b.complexity - a.complexity)
        .slice(0, 3)
        .forEach((test) => {
          console.log(`  • ${test.file}: ${test.complexity}`)
        })
    }

    this.metrics.complexity = {
      average: avgComplexity,
      maximum: maxComplexity,
      complexFiles: complexTests.length,
    }
    console.log('')
  }

  generateReport() {
    console.log('📊 Test Quality Summary')
    console.log('======================')

    let score = 100

    // Deduct points for test smells
    Object.entries(this.metrics.testSmells).forEach(([smell, count]) => {
      if (count > 10) score -= 10
      else if (count > 5) score -= 5
      else if (count > 0) score -= 2
    })

    // Add points for good patterns
    if (this.metrics.patterns['AAA Pattern'] > 0) score += 5
    if (this.metrics.patterns['Given-When-Then'] > 0) score += 5

    // Deduct for high complexity
    if (this.metrics.complexity.average > 15) score -= 10
    if (this.metrics.complexity.complexFiles > 3) score -= 10

    score = Math.max(0, Math.min(100, score))

    console.log(`\n🎯 Advanced Quality Score: ${score}/100`)

    if (score >= 90) {
      console.log('🏆 Outstanding test quality!')
    } else if (score >= 80) {
      console.log('✅ Excellent test quality!')
    } else if (score >= 70) {
      console.log('👍 Good test quality')
    } else if (score >= 60) {
      console.log('⚠️ Moderate test quality')
    } else {
      console.log('❌ Poor test quality')
    }

    this.generateRecommendations()
  }

  generateRecommendations() {
    console.log('\n💡 Advanced Recommendations:')
    console.log('============================')

    const smells = this.metrics.testSmells

    if (smells['Excessive Setup'] > 0) {
      console.log('• Refactor beforeEach blocks - consider test data builders')
    }

    if (smells['Magic Numbers'] > 20) {
      console.log('• Replace magic numbers with named constants')
    }

    if (smells['Assertion Roulette'] > 0) {
      console.log('• Split tests with too many assertions into focused tests')
    }

    if (smells['Long Test Methods'] > 0) {
      console.log('• Break down long tests into smaller, focused tests')
    }

    if (smells['Conditional Test Logic'] > 5) {
      console.log('• Remove conditional logic from tests - create separate test cases')
    }

    if (this.metrics.patterns['AAA Pattern'] === 0) {
      console.log('• Consider using AAA (Arrange-Act-Assert) pattern for clarity')
    }

    if (this.metrics.complexity.average > 10) {
      console.log('• Reduce test complexity by extracting helper methods')
    }

    console.log('• Run mutation testing to verify test effectiveness')
    console.log('• Consider property-based testing for complex logic')
    console.log('• Review test execution time and identify slow tests')
  }
}

// Run the analyzer
const analyzer = new TestQualityAnalyzer()
analyzer.analyze().catch(console.error)
