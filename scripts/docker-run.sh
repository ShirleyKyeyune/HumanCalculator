#!/bin/bash

# Docker Run Script for Human Calculator
# This script runs the Human Calculator Docker container

set -e  # Exit on any error

echo "▶️  Starting Human Calculator..."
echo "================================"

# Check if the image exists
if ! docker image inspect human-calculator >/dev/null 2>&1; then
    echo "❌ Docker image 'human-calculator' not found!"
    echo "   Please build it first using: ./scripts/docker-build.sh"
    exit 1
fi

# Run the Docker container
echo "🚀 Starting container on port 7842..."
docker run -p 7842:7842 human-calculator

echo ""
echo "🌐 Open your browser and go to: http://localhost:7842"
