#!/bin/bash

# Setup script for performance optimizations
# This script installs and configures Redis, Celery, and other performance tools

set -e

echo "========================================="
echo "Mesa de Partes - Performance Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run as root"
    exit 1
fi

# Install Redis
echo "1. Installing Redis..."
if command -v redis-server &> /dev/null; then
    echo "   Redis already installed"
else
    echo "   Installing Redis..."
    sudo apt-get update
    sudo apt-get install -y redis-server
    
    # Configure Redis
    echo "   Configuring Redis..."
    sudo sed -i 's/^# maxmemory <bytes>/maxmemory 2gb/' /etc/redis/redis.conf
    sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    # Start Redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    echo "   Redis installed and configured"
fi

# Test Redis connection
echo "   Testing Redis connection..."
if redis-cli ping | grep -q "PONG"; then
    echo "   ✓ Redis is running"
else
    echo "   ✗ Redis is not responding"
    exit 1
fi

# Install Python dependencies
echo ""
echo "2. Installing Python dependencies..."
pip install -r requirements-performance.txt
echo "   ✓ Dependencies installed"

# Create Celery systemd service
echo ""
echo "3. Setting up Celery worker service..."
cat > /tmp/celery-worker.service << EOF
[Unit]
Description=Celery Worker for Mesa de Partes
After=network.target redis-server.service

[Service]
Type=forking
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/celery -A app.core.task_queue worker --loglevel=info --logfile=/var/log/celery/worker.log --pidfile=/var/run/celery/worker.pid
ExecStop=$(pwd)/venv/bin/celery -A app.core.task_queue control shutdown
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/celery-worker.service /etc/systemd/system/
sudo mkdir -p /var/log/celery /var/run/celery
sudo chown $USER:$USER /var/log/celery /var/run/celery

# Create Celery beat service (for scheduled tasks)
echo "   Setting up Celery beat service..."
cat > /tmp/celery-beat.service << EOF
[Unit]
Description=Celery Beat for Mesa de Partes
After=network.target redis-server.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/celery -A app.core.task_queue beat --loglevel=info --logfile=/var/log/celery/beat.log --pidfile=/var/run/celery/beat.pid
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/celery-beat.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

echo "   ✓ Celery services configured"

# Start services
echo ""
echo "4. Starting services..."
sudo systemctl start celery-worker
sudo systemctl start celery-beat
sudo systemctl enable celery-worker
sudo systemctl enable celery-beat

echo "   ✓ Services started"

# Create database indexes
echo ""
echo "5. Creating database indexes..."
python << EOF
from app.models.mesa_partes.database import engine, Base
from app.models.mesa_partes.documento import Documento, TipoDocumento, ArchivoAdjunto

# Create all tables and indexes
Base.metadata.create_all(bind=engine)
print("   ✓ Database indexes created")
EOF

# Run database optimization
echo ""
echo "6. Optimizing database..."
psql -U postgres -d mesa_partes << EOF
-- Analyze tables
ANALYZE documentos;
ANALYZE derivaciones;
ANALYZE tipos_documento;
ANALYZE archivos_adjuntos;

-- Vacuum tables
VACUUM ANALYZE documentos;
VACUUM ANALYZE derivaciones;

-- Show index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 10;
EOF

echo "   ✓ Database optimized"

# Test setup
echo ""
echo "7. Testing setup..."

# Test Redis
echo "   Testing Redis..."
python << EOF
from app.core.cache import get_cache
cache = get_cache()
if cache.enabled:
    cache.set("test_key", "test_value", ttl=10)
    value = cache.get("test_key")
    if value == "test_value":
        print("   ✓ Redis cache working")
    else:
        print("   ✗ Redis cache not working")
else:
    print("   ✗ Redis not available")
EOF

# Test Celery
echo "   Testing Celery..."
python << EOF
from app.core.task_queue import get_task_queue
task_queue = get_task_queue()
if task_queue.enabled:
    print("   ✓ Celery task queue working")
else:
    print("   ✗ Celery not available")
EOF

# Print status
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Services Status:"
sudo systemctl status redis-server --no-pager | grep "Active:"
sudo systemctl status celery-worker --no-pager | grep "Active:"
sudo systemctl status celery-beat --no-pager | grep "Active:"
echo ""
echo "Monitoring:"
echo "  - Redis: redis-cli MONITOR"
echo "  - Celery: celery -A app.core.task_queue inspect active"
echo "  - Flower: celery -A app.core.task_queue flower (http://localhost:5555)"
echo ""
echo "Logs:"
echo "  - Redis: sudo journalctl -u redis-server -f"
echo "  - Celery Worker: tail -f /var/log/celery/worker.log"
echo "  - Celery Beat: tail -f /var/log/celery/beat.log"
echo ""
echo "Performance optimizations are now active!"
echo "========================================="
