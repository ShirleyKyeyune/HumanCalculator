# Human Calculator - Makefile
# Simple commands to build and run the application

.PHONY: help build run quick-start clean

# Default target
help:
	@echo "🧮 Human Calculator - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "🚀 make quick-start  - Build and run in one command"
	@echo "🔨 make build        - Build Docker image only"
	@echo "▶️  make run          - Run existing Docker image"
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

# Clean up Docker image
clean:
	@echo "🧹 Removing Human Calculator Docker image..."
	docker rmi human-calculator || true
	@echo "✅ Cleanup completed!"

# Alternative targets with different names
start: quick-start
dev: quick-start
docker: quick-start
