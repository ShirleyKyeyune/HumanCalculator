#!/bin/bash

# Docker Build Script for Human Calculator
# This script builds the Docker image for the Human Calculator application

set -e  # Exit on any error

echo "🔨 Building Human Calculator Docker image..."
echo "================================"

# Build the Docker image
docker build -t human-calculator .

echo ""
echo "✅ Build completed successfully!"
echo "📋 Image name: human-calculator"
echo ""
echo "Next steps:"
echo "  • Run the app: ./scripts/docker-run.sh"
echo "  • Or run manually: docker run -p 7842:7842 human-calculator"
