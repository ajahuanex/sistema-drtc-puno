#!/bin/bash
set -e

echo "🚀 Deploying SIRRET System..."
echo ""

# Deploy Backend
echo "📦 Step 1: Deploying Backend..."
./scripts/deploy-backend.sh production
echo ""

# Deploy Frontend
echo "📦 Step 2: Deploying Frontend..."
./scripts/deploy-frontend.sh production
echo ""

echo "✅ Complete deployment finished!"
echo ""
echo "📊 System Status:"
docker ps --filter "name=sirret" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🔗 Access Points:"
echo "   Backend API: http://localhost:8000"
echo "   Frontend: http://localhost"
echo ""
echo "📋 View Logs:"
echo "   Backend:  docker-compose -f docker-compose.backend.yml logs -f backend"
echo "   Frontend: docker-compose -f docker-compose.frontend.yml logs -f frontend"
