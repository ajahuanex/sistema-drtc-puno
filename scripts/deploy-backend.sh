#!/bin/bash
set -e

ENV=${1:-production}
echo "🚀 Deploying Backend to $ENV..."

# Validar .env
if [ ! -f ".env.backend" ]; then
    echo "❌ Error: .env.backend not found"
    echo "   Please create .env.backend with required variables"
    exit 1
fi

# Cargar variables
export $(cat .env.backend | grep -v '#' | xargs)

# Build image
echo "🔨 Building backend image..."
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

# Stop old container
echo "⏹️  Stopping old backend container..."
docker-compose -f docker-compose.backend.yml down 2>/dev/null || true

# Start new container
echo "▶️  Starting new backend container..."
docker-compose -f docker-compose.backend.yml up -d

# Wait for health
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Check health
if docker-compose -f docker-compose.backend.yml exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend deployed successfully!"
    echo ""
    echo "📊 Backend Status:"
    docker-compose -f docker-compose.backend.yml ps
else
    echo "❌ Backend health check failed"
    echo ""
    echo "📋 Backend Logs:"
    docker-compose -f docker-compose.backend.yml logs backend
    exit 1
fi
