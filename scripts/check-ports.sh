#!/bin/bash

# Script para verificar si los puertos están disponibles
# y sugerir alternativas si están ocupados

echo "🔍 Verificando disponibilidad de puertos..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar puerto
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}✗${NC} Puerto $port ($service) está OCUPADO"
        echo "  Proceso usando el puerto:"
        lsof -Pi :$port -sTCP:LISTEN | tail -n +2
        return 1
    else
        echo -e "${GREEN}✓${NC} Puerto $port ($service) está disponible"
        return 0
    fi
}

# Verificar puertos
all_available=true

check_port 27017 "MongoDB" || all_available=false
check_port 8000 "Backend" || all_available=false
check_port 4200 "Frontend" || all_available=false
check_port 80 "Nginx HTTP" || all_available=false
check_port 443 "Nginx HTTPS" || all_available=false

echo ""

if [ "$all_available" = true ]; then
    echo -e "${GREEN}✓ Todos los puertos están disponibles!${NC}"
    echo "Puedes iniciar Docker Compose con:"
    echo "  docker-compose up -d"
else
    echo -e "${YELLOW}⚠ Algunos puertos están ocupados${NC}"
    echo ""
    echo "Opciones:"
    echo "1. Detener los servicios que usan esos puertos"
    echo "2. Usar puertos alternativos en el archivo .env:"
    echo ""
    echo "   # Ejemplo de .env con puertos alternativos"
    echo "   MONGODB_PORT=27018"
    echo "   BACKEND_PORT=8001"
    echo "   FRONTEND_PORT=4201"
    echo "   NGINX_HTTP_PORT=8080"
    echo "   NGINX_HTTPS_PORT=8443"
    echo ""
    echo "Luego ejecuta:"
    echo "  docker-compose up -d"
fi

echo ""
echo "Para más información, consulta: DOCKER_DEPLOYMENT_GUIDE.md"
