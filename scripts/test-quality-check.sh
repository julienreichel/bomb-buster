#!/bin/bash

# Test Quality Assessment Script
# Analyzes various aspects of test quality beyond coverage

echo "🔍 Test Quality Assessment Report"
echo "================================="
echo ""

# 1. Test-to-Code Ratio
echo "📊 Test-to-Code Ratio Analysis"
echo "------------------------------"
test_files=$(find tests -name "*.spec.js" | wc -l)
src_files=$(find src -name "*.js" -not -path "*/router/*" -not -path "*/pages/*" -not -path "*/layouts/*" | wc -l)
test_lines=$(find tests -name "*.spec.js" -exec wc -l {} + | tail -1 | awk '{print $1}')
src_lines=$(find src -name "*.js" -not -path "*/router/*" -not -path "*/pages/*" -not -path "*/layouts/*" -exec wc -l {} + | tail -1 | awk '{print $1}')

echo "Test files: $test_files"
echo "Source files: $src_files"
echo "Test lines: $test_lines"
echo "Source lines: $src_lines"
echo "Test-to-source ratio: $(echo "scale=2; $test_lines / $src_lines" | bc)"
echo ""

# 2. Assertion Density
echo "🎯 Assertion Density Analysis"
echo "-----------------------------"
total_assertions=$(grep -r "expect(" tests/ | wc -l)
total_tests=$(grep -r "it(" tests/ | wc -l)
assertions_per_test=$(echo "scale=2; $total_assertions / $total_tests" | bc)

echo "Total assertions: $total_assertions"
echo "Total tests: $total_tests"
echo "Assertions per test: $assertions_per_test"
echo ""

# 3. Test Organization Analysis
echo "📁 Test Organization Analysis"
echo "----------------------------"
describe_blocks=$(grep -r "describe(" tests/ | wc -l)
test_files_count=$(find tests -name "*.spec.js" | wc -l)
avg_describes_per_file=$(echo "scale=2; $describe_blocks / $test_files_count" | bc)

echo "Describe blocks: $describe_blocks"
echo "Test files: $test_files_count"
echo "Average describes per file: $avg_describes_per_file"
echo ""

# 4. Mock Usage Analysis
echo "🎭 Mock Usage Analysis"
echo "---------------------"
mock_usage=$(grep -r "mock\|stub\|spy" tests/ | wc -l)
vi_mocks=$(grep -r "vi.mock\|vi.fn" tests/ | wc -l)
echo "Total mock-related lines: $mock_usage"
echo "Vitest mocks: $vi_mocks"
echo ""

# 5. Test Naming Quality
echo "📝 Test Naming Quality"
echo "---------------------"
should_tests=$(grep -r "should " tests/ | wc -l)
descriptive_tests=$(grep -r "it(" tests/ | grep -E "(when|if|given|should)" | wc -l)
total_its=$(grep -r "it(" tests/ | wc -l)
descriptive_ratio=$(echo "scale=2; $descriptive_tests / $total_its * 100" | bc)

echo "Tests with 'should': $should_tests"
echo "Descriptive test names: $descriptive_tests"
echo "Descriptive naming ratio: $descriptive_ratio%"
echo ""

# 6. Edge Case Testing
echo "⚠️ Edge Case Testing Analysis"
echo "-----------------------------"
edge_cases=$(grep -r -i "edge\|boundary\|null\|undefined\|empty\|invalid\|error" tests/ | wc -l)
error_handling=$(grep -r "toThrow\|catch\|error" tests/ | wc -l)

echo "Edge case related tests: $edge_cases"
echo "Error handling tests: $error_handling"
echo ""

# 7. Test Independence
echo "🔗 Test Independence Analysis"
echo "----------------------------"
beforeeach_usage=$(grep -r "beforeEach" tests/ | wc -l)
aftereach_usage=$(grep -r "afterEach" tests/ | wc -l)
shared_state=$(grep -r "let \|var \|const " tests/ | grep -v "describe\|it\|expect" | wc -l)

echo "beforeEach blocks: $beforeeach_usage"
echo "afterEach blocks: $aftereach_usage"
echo "Shared state variables: $shared_state"
echo ""

# 8. Async Testing Quality
echo "⏱️ Async Testing Analysis"
echo "------------------------"
async_tests=$(grep -r "async\|await" tests/ | wc -l)
promise_tests=$(grep -r "\.then\|\.catch" tests/ | wc -l)

echo "Async/await usage: $async_tests"
echo "Promise usage: $promise_tests"
echo ""

# 9. Test Quality Score
echo "🏆 Overall Test Quality Score"
echo "=============================="

score=0

# Scoring criteria
if (( $(echo "$assertions_per_test >= 2" | bc -l) )); then
  score=$((score + 20))
  echo "✅ Good assertion density (≥2 per test): +20"
else
  echo "❌ Low assertion density (<2 per test): +0"
fi

if (( $(echo "$descriptive_ratio >= 70" | bc -l) )); then
  score=$((score + 15))
  echo "✅ Good test naming (≥70% descriptive): +15"
else
  echo "❌ Poor test naming (<70% descriptive): +0"
fi

if (( $(echo "$edge_cases >= 20" | bc -l) )); then
  score=$((score + 15))
  echo "✅ Good edge case coverage: +15"
else
  echo "❌ Limited edge case coverage: +0"
fi

if (( $(echo "$error_handling >= 10" | bc -l) )); then
  score=$((score + 15))
  echo "✅ Good error handling tests: +15"
else
  echo "❌ Limited error handling tests: +0"
fi

if (( $(echo "$beforeeach_usage >= 5" | bc -l) )); then
  score=$((score + 10))
  echo "✅ Good test setup practices: +10"
else
  echo "❌ Limited test setup: +0"
fi

# Mock usage scoring (balanced approach)
if (( $(echo "$vi_mocks > 0 && $vi_mocks < 50" | bc -l) )); then
  score=$((score + 10))
  echo "✅ Balanced mock usage: +10"
elif (( $(echo "$vi_mocks == 0" | bc -l) )); then
  score=$((score + 5))
  echo "⚠️ No mocks (Detroit style): +5"
else
  echo "❌ Excessive mock usage: +0"
fi

if (( $(echo "$avg_describes_per_file >= 3" | bc -l) )); then
  score=$((score + 10))
  echo "✅ Good test organization: +10"
else
  echo "❌ Poor test organization: +0"
fi

if (( $(echo "$test_lines / $src_lines >= 0.8" | bc -l) )); then
  score=$((score + 5))
  echo "✅ Good test-to-code ratio: +5"
else
  echo "❌ Low test-to-code ratio: +0"
fi

echo ""
echo "Final Score: $score/100"

if (( score >= 80 )); then
  echo "🏆 Excellent test quality!"
elif (( score >= 60 )); then
  echo "✅ Good test quality"
elif (( score >= 40 )); then
  echo "⚠️ Moderate test quality - room for improvement"
else
  echo "❌ Poor test quality - needs significant improvement"
fi

echo ""
echo "💡 Recommendations:"
echo "==================="

if (( $(echo "$assertions_per_test < 2" | bc -l) )); then
  echo "• Add more assertions per test to verify behavior thoroughly"
fi

if (( $(echo "$descriptive_ratio < 70" | bc -l) )); then
  echo "• Improve test naming with more descriptive 'should/when/given' patterns"
fi

if (( $(echo "$edge_cases < 20" | bc -l) )); then
  echo "• Add more edge case and boundary testing"
fi

if (( $(echo "$error_handling < 10" | bc -l) )); then
  echo "• Add more error handling and exception testing"
fi

if (( $(echo "$vi_mocks > 50" | bc -l) )); then
  echo "• Consider reducing mock usage for more integration-style testing"
fi

echo "• Consider running mutation testing: npm run test:mutation"
echo "• Analyze test coverage gaps: npm run test:coverage"
echo "• Review test execution time and optimize slow tests"
