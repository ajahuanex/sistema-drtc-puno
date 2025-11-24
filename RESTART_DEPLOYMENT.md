# 🔄 Guía de Reinicio del Deployment Local

## Problema Detectado
Los contenedores Docker no están corriendo o se detuvieron.

## Solución Rápida

### Opción 1: Usar el script de inicio
```bash
start-local.bat
```

### Opción 2: Comandos manuales

#### 1. Verificar estado actual
```bash
docker-compose -f docker-compose.local.yml ps
```

#### 2. Levantar servicios
```bash
docker-compose -f docker-compose.local.yml up -d
```

#### 3. Verificar logs
```bash
# Ver todos los logs
docker-compose -f docker-compose.local.yml logs

# Ver logs de un servicio específico
docker-compose -f docker-compose.local.yml logs frontend
docker-compose -f docker-compose.local.yml logs backend
```

#### 4. Verificar que estén corriendo
```bash
docker-compose -f docker-compose.local.yml ps
```

## Si los servicios no inician

### Paso 1: Verificar Docker Desktop
- Asegúrate de que Docker Desktop esté corriendo
- Verifica que tenga recursos suficientes (CPU, RAM)

### Paso 2: Limpiar y reconstruir
```bash
# Detener todo
docker-compose -f docker-compose.local.yml down -v

# Reconstruir imágenes
docker-compose -f docker-compose.local.yml build --no-cache

# Levantar servicios
docker-compose -f docker-compose.local.yml up -d
```

### Paso 3: Verificar logs de errores
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.local.yml logs -f
```

## Verificación de Conectividad

### Backend
```bash
# Probar API
curl http://localhost:8001/docs

# O abrir en navegador
start http://localhost:8001/docs
```

### Frontend
```bash
# Probar frontend
curl http://localhost:4201

# O abrir en navegador
start http://localhost:4201
```

## Tiempos de Espera

- **PostgreSQL y Redis**: 10-15 segundos
- **Backend**: 30-60 segundos
- **Frontend**: 2-3 minutos (compilación de Angular)

## Script de Verificación

Ejecuta el script de verificación:
```bash
CHECK_DEPLOYMENT.bat
```

## Comandos Útiles

### Ver estado
```bash
docker-compose -f docker-compose.local.yml ps
```

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.local.yml logs -f
```

### Reiniciar un servicio
```bash
docker-compose -f docker-compose.local.yml restart frontend
docker-compose -f docker-compose.local.yml restart backend
```

### Entrar a un contenedor
```bash
# Backend
docker exec -it resoluciones-backend-local /bin/bash

# Frontend
docker exec -it resoluciones-frontend-local /bin/sh
```

## Troubleshooting Común

### Error: "Cannot connect to Docker daemon"
- Inicia Docker Desktop
- Espera a que esté completamente iniciado

### Error: "Port already in use"
```bash
# Ver qué está usando el puerto
netstat -ano | findstr "4201"
netstat -ano | findstr "8001"

# Matar el proceso o cambiar el puerto en docker-compose.local.yml
```

### Error: "No space left on device"
```bash
# Limpiar Docker
docker system prune -a
docker volume prune
```

### Frontend no compila
```bash
# Ver logs detallados
docker logs resoluciones-frontend-local

# Si hay errores TypeScript, reconstruir
docker-compose -f docker-compose.local.yml build --no-cache frontend
docker-compose -f docker-compose.local.yml up -d frontend
```

### Backend no inicia
```bash
# Ver logs
docker logs resoluciones-backend-local

# Verificar PostgreSQL
docker logs resoluciones-postgres-local

# Reiniciar
docker-compose -f docker-compose.local.yml restart backend postgres
```

## URLs de Acceso

Una vez que todo esté funcionando:

- **Frontend**: http://localhost:4201
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Nginx**: http://localhost:8080

## Soporte

Si después de seguir estos pasos aún no funciona:

1. Ejecuta `CHECK_DEPLOYMENT.bat` y comparte la salida
2. Ejecuta `docker-compose -f docker-compose.local.yml logs` y comparte los logs
3. Verifica que Docker Desktop tenga suficientes recursos asignados

