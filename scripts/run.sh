#!/bin/bash

# eBayClone GraphQL Server Build and Run Script
# This script builds and starts the GraphQL server

set -e  # Exit on any error

echo "🚀 Starting eBayClone GraphQL Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Navigate to project root
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Validate GraphQL schema
echo "🔍 Validating GraphQL schema..."
if command -v graphql-schema-linter &> /dev/null; then
    npx graphql-schema-linter schema/*.graphql
    echo "✅ Schema validation passed"
else
    echo "⚠️  graphql-schema-linter not found, skipping schema validation"
fi

# Build step (not needed for Node.js, but included for completeness)
echo "🔨 Building application..."
npm run build

# Start the server
echo "🚀 Starting GraphQL server..."
echo "📍 Server will be available at: http://localhost:4000/graphql"
echo "📊 GraphQL Playground will be available at: http://localhost:4000/graphql"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
