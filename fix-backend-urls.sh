#!/bin/bash

# Script para actualizar todas las URLs del backend a localhost:8001

echo "🔧 Actualizando URLs del backend en todos los servicios..."

# Actualizar auth.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/auth.service.ts

# Actualizar empresa.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/empresa.service.ts

# Actualizar expediente.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/expediente.service.ts

# Actualizar localidad.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/localidad.service.ts

# Actualizar resolucion.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/resolucion.service.ts

# Actualizar ruta.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/ruta.service.ts

# Actualizar tuc.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/tuc.service.ts

# Actualizar data-manager-client.service.ts
sed -i "s|http://localhost:8000|http://localhost:8001|g" frontend/src/app/services/data-manager-client.service.ts

# Actualizar resolucion-bajas-integration.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/resolucion-bajas-integration.service.ts

# Mesa Partes services
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/mesa-partes/documento.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/mesa-partes/derivacion.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/mesa-partes/notificacion.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/mesa-partes/integracion.service.ts
sed -i "s|http://localhost:8000/api/v1|http://localhost:8001/api/v1|g" frontend/src/app/services/mesa-partes/reporte.service.ts

# WebSocket URL
sed -i "s|ws://localhost:8000/ws|ws://localhost:8001/ws|g" frontend/src/app/services/mesa-partes/notificacion.service.ts

# eager-init.service.ts
sed -i "s|http://localhost:8003|http://localhost:8001/api/v1|g" frontend/src/app/services/eager-init.service.ts

echo "✅ URLs actualizadas correctamente"
echo "🔄 Reiniciando contenedor frontend..."

docker-compose -f docker-compose.local.yml restart frontend

echo "✅ Completado! Espera 1-2 minutos y recarga la página"
