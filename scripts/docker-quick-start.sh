#!/bin/bash

# Docker Quick Start Script for Human Calculator
# This script builds and runs the Human Calculator in one go

set -e  # Exit on any error

echo "🚀 Human Calculator - Quick Start"
echo "=================================="
echo ""

# Build the image
echo "🔨 Step 1: Building Docker image..."
docker build -t human-calculator .

echo ""
echo "✅ Build completed!"
echo ""

# Run the container
echo "▶️  Step 2: Starting the application..."
echo "🌐 The app will be available at: http://localhost:7842"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

docker run -p 7842:7842 human-calculator
