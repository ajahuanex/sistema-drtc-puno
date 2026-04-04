#!/bin/bash
set -e

ENV=${1:-production}
echo "🚀 Deploying Frontend to $ENV..."

# Validar .env
if [ ! -f ".env.frontend" ]; then
    echo "❌ Error: .env.frontend not found"
    echo "   Please create .env.frontend with required variables"
    exit 1
fi

# Cargar variables
export $(cat .env.frontend | grep -v '#' | xargs)

# Build image
echo "🔨 Building frontend image..."
docker build \
    -f docker/frontend/Dockerfile \
    --build-arg API_URL=${API_URL:-http://localhost:8000} \
    -t sirret-frontend:latest .

# Stop old container
echo "⏹️  Stopping old frontend container..."
docker-compose -f docker-compose.frontend.yml down 2>/dev/null || true

# Start new container
echo "▶️  Starting new frontend container..."
docker-compose -f docker-compose.frontend.yml up -d

# Wait for health
echo "⏳ Waiting for frontend to be healthy..."
sleep 5

# Check health
if docker-compose -f docker-compose.frontend.yml exec -T frontend wget --quiet --tries=1 --spider http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend deployed successfully!"
    echo ""
    echo "📊 Frontend Status:"
    docker-compose -f docker-compose.frontend.yml ps
else
    echo "❌ Frontend health check failed"
    echo ""
    echo "📋 Frontend Logs:"
    docker-compose -f docker-compose.frontend.yml logs frontend
    exit 1
fi
