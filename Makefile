# Human Calculator - Makefile
# Simple commands to build and run the application

.PHONY: help build run quick-start clean dev stop logs

# Default target
help:
	@echo "🧮 Human Calculator - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "🚀 make quick-start  - Build and run in one command"
	@echo "🔨 make build        - Build Docker image only"
	@echo "▶️  make run          - Run existing Docker image"
	@echo "🔄 make dev          - Run in detached mode (background)"
	@echo "⏹️  make stop         - Stop detached container"
	@echo "📋 make logs         - View container logs"
	@echo "🧹 make clean        - Remove Docker image"
	@echo "ℹ️  make help         - Show this help message"
	@echo ""

# Build Docker image
build:
	@echo "🔨 Building Human Calculator Docker image..."
	docker build -t human-calculator .
	@echo "✅ Build completed!"

# Run Docker container
run:
	@echo "▶️  Starting Human Calculator..."
	@echo "🌐 Open http://localhost:7842 in your browser"
	docker run -p 7842:7842 human-calculator

# Build and run in one command
quick-start:
	@echo "🚀 Quick Start - Building and running Human Calculator..."
	docker build -t human-calculator .
	@echo "🌐 Opening http://localhost:7842 in your browser"
	docker run -p 7842:7842 human-calculator

# Run in detached mode (background)
dev:
	@echo "🔄 Starting Human Calculator in detached mode..."
	docker build -t human-calculator .
	@echo "🌐 Starting container in background..."
	docker run -d -p 7842:7842 --name human-calculator-dev human-calculator
	@echo "✅ Container started! Open http://localhost:7842 in your browser"
	@echo "💡 Use 'make stop' to stop the container"
	@echo "📋 Use 'make logs' to view logs"

# Stop detached container
stop:
	@echo "⏹️  Stopping Human Calculator container..."
	docker stop human-calculator-dev || true
	docker rm human-calculator-dev || true
	@echo "✅ Container stopped and removed!"

# View container logs
logs:
	@echo "📋 Viewing Human Calculator logs..."
	docker logs -f human-calculator-dev

# Clean up Docker image
clean:
	@echo "🧹 Removing Human Calculator Docker image..."
	docker stop human-calculator-dev || true
	docker rm human-calculator-dev || true
	docker rmi human-calculator || true
	@echo "✅ Cleanup completed!"

# Alternative targets with different names
start: quick-start
docker: quick-start
