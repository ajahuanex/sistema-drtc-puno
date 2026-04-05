#!/bin/bash
set -e

echo "🚀 Starting Backend Local Development..."
echo ""

# Verificar .env.backend
if [ ! -f ".env.backend" ]; then
    echo "❌ Error: .env.backend not found"
    echo ""
    echo "📝 Creating .env.backend from template..."
    cp .env.backend.example .env.backend
    echo ""
    echo "⚠️  Please edit .env.backend with your MongoDB connection details:"
    echo "   nano .env.backend"
    echo ""
    echo "Then run this script again:"
    echo "   ./scripts/start-backend-local.sh"
    exit 1
fi

# Cargar variables
export $(cat .env.backend | grep -v '#' | xargs)

echo "📋 Configuration:"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   CORS_ORIGINS: $CORS_ORIGINS"
echo "   ENVIRONMENT: development"
echo ""

# Build image
echo "🔨 Building backend image..."
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

echo ""
echo "▶️  Starting backend container..."
docker-compose -f docker-compose.backend.local.yml up -d

echo ""
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Check health
if docker-compose -f docker-compose.backend.local.yml exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running!"
    echo ""
    echo "📊 Backend Status:"
    docker-compose -f docker-compose.backend.local.yml ps
    echo ""
    echo "🔗 Access Points:"
    echo "   API:           http://localhost:8000"
    echo "   Documentation: http://localhost:8000/docs"
    echo "   Health Check:  http://localhost:8000/health"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:     docker-compose -f docker-compose.backend.local.yml logs -f backend"
    echo "   Shell access:  docker-compose -f docker-compose.backend.local.yml exec backend bash"
    echo "   Stop:          docker-compose -f docker-compose.backend.local.yml down"
    echo "   Restart:       docker-compose -f docker-compose.backend.local.yml restart backend"
else
    echo "❌ Backend health check failed"
    echo ""
    echo "📋 Backend Logs:"
    docker-compose -f docker-compose.backend.local.yml logs backend
    exit 1
fi
