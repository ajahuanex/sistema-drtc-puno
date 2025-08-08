#!/bin/bash

echo "🚀 Configurando Sistema DRTC Puno..."

# Verificar prerrequisitos
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 no está instalado"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js no está instalado"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git no está instalado"; exit 1; }

# Configurar backend
echo "📦 Configurando backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Configurar frontend
echo "📦 Configurando frontend..."
cd frontend
npm install
cd ..

# Crear archivos de configuración
echo "⚙️ Creando archivos de configuración..."
cp backend/env.example backend/.env
echo "✅ Configuración completada!"
echo "📝 Edita backend/.env con tus configuraciones"
