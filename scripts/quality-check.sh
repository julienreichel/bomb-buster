#!/bin/bash

# Local Quality Check Script
# Mirrors the CI pipeline for local development

set -e  # Exit on any error

echo "🚀 Running local quality checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🔍 Running linter..."
if npm run lint; then
    print_status 0 "Linting passed"
else
    print_status 1 "Linting failed"
    echo -e "${YELLOW}💡 Run 'npm run lint:fix' to auto-fix issues${NC}"
    exit 1
fi

echo ""
echo "🎨 Checking code formatting..."
if npm run format:check; then
    print_status 0 "Formatting check passed"
else
    print_status 1 "Formatting check failed"
    echo -e "${YELLOW}💡 Run 'npm run format' to fix formatting${NC}"
    exit 1
fi

echo ""
echo "🧪 Running tests with coverage..."
if npm run test:coverage --silent; then
    print_status 0 "Tests passed with coverage"
else
    print_status 1 "Tests failed"
    exit 1
fi

echo ""
echo "🏗️  Testing production build..."
if npm run build; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All quality checks passed! Your code is ready for commit.${NC}"
echo ""
echo "📊 Coverage report available at: coverage/index.html"
echo "🔧 Build output available at: dist/"
