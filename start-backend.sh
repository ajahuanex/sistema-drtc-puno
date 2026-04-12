#!/bin/bash

# Script para iniciar el backend de SIRRET

echo "🚀 Iniciando backend SIRRET..."

# Ir a la carpeta del backend
cd backend

# Configurar variables de entorno
export MONGODB_URL="mongodb://admin:admin123@localhost:27017/"
export DATABASE_NAME="drtc_db"

# Iniciar el backend
echo "✓ Iniciando servidor en http://localhost:8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
