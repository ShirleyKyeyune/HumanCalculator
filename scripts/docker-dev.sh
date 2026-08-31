#!/bin/bash

# Docker Dev Script for Human Calculator
# Builds and runs the development container for Docker Desktop

set -e

echo "🚀 Human Calculator - Dev Container"
echo "===================================="
echo ""

docker compose -f docker-compose.dev.yml up --build
