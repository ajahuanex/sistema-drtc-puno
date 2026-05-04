#!/bin/bash

echo "🧹 Limpiando caché y dependencias..."

# Limpiar caché de Angular
rm -rf frontend/.angular/cache
echo "✅ Caché de Angular limpiado"

# Limpiar node_modules
rm -rf frontend/node_modules
echo "✅ node_modules eliminado"

# Limpiar package-lock.json
rm -rf frontend/package-lock.json
echo "✅ package-lock.json eliminado"

# Limpiar dist
rm -rf frontend/dist
echo "✅ dist eliminado"

# Reinstalar dependencias
cd frontend
echo "📦 Reinstalando dependencias..."
npm install
echo "✅ Dependencias reinstaladas"

# Compilar
echo "🔨 Compilando proyecto..."
npm run build
echo "✅ Compilación completada"

echo "✨ ¡Limpieza y reinstalación completadas!"
