#!/bin/bash

# Script de despliegue para SIRRET
# Sistema Regional de Registros de Transporte

set -e

echo "🚀 Iniciando despliegue de SIRRET..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

log "✅ Docker y Docker Compose están disponibles"

# Crear directorios necesarios
log "📁 Creando directorios necesarios..."
mkdir -p backend/uploads
mkdir -p logs

# Verificar archivos de configuración
log "🔍 Verificando archivos de configuración..."

if [ ! -f "backend/.env" ]; then
    warn "Archivo .env no encontrado, creando uno por defecto..."
    cp backend/env.example backend/.env 2>/dev/null || echo "MONGODB_URL=mongodb://admin:admin123@mongodb:27017/
DATABASE_NAME=drtc_db
SECRET_KEY=sirret-production-secret-key-2025-very-secure
DEBUG=false" > backend/.env
fi

# Construir y desplegar servicios
log "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

log "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
log "🔍 Verificando estado de los servicios..."

# Verificar MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log "✅ MongoDB está funcionando correctamente"
else
    error "❌ MongoDB no está respondiendo"
fi

# Verificar Backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    log "✅ Backend está funcionando correctamente"
else
    warn "⚠️  Backend no está respondiendo aún, puede necesitar más tiempo"
fi

# Verificar Frontend (si está habilitado)
if curl -f http://localhost:4200/health > /dev/null 2>&1; then
    log "✅ Frontend está funcionando correctamente"
else
    warn "⚠️  Frontend no está respondiendo aún, puede necesitar más tiempo"
fi

# Mostrar información de despliegue
echo ""
log "🎉 Despliegue completado!"
echo ""
echo -e "${BLUE}📋 Información del despliegue:${NC}"
echo -e "   🌐 Backend API: http://localhost:8000"
echo -e "   📚 Documentación API: http://localhost:8000/docs"
echo -e "   🖥️  Frontend: http://localhost:4200"
echo -e "   🗄️  MongoDB: localhost:27017"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   Ver logs: docker-compose logs -f"
echo -e "   Parar servicios: docker-compose down"
echo -e "   Reiniciar servicios: docker-compose restart"
echo -e "   Ver estado: docker-compose ps"
echo ""

# Mostrar logs en tiempo real (opcional)
read -p "¿Deseas ver los logs en tiempo real? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "📋 Mostrando logs en tiempo real (Ctrl+C para salir)..."
    docker-compose logs -f
fi