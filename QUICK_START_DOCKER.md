# 🚀 Quick Start - Docker Deployment

## Inicio Rápido en 3 Pasos

### 1️⃣ Verificar Puertos Disponibles

**Windows:**
```cmd
scripts\check-ports.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/check-ports.sh
./scripts/check-ports.sh
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Si algún puerto está ocupado, editar .env
nano .env
```

**Ejemplo si puertos están ocupados:**
```env
MONGODB_PORT=27018
BACKEND_PORT=8001
FRONTEND_PORT=4201
NGINX_HTTP_PORT=8080
```

### 3️⃣ Iniciar Aplicación

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

## 🌐 Acceder a la Aplicación

### Con Nginx (Recomendado)
```
http://localhost
```

Si cambiaste el puerto de Nginx:
```
http://localhost:8080
```

### Acceso Directo (Solo para debugging)
- **Frontend**: `http://localhost:4200` (o tu puerto configurado)
- **Backend API**: `http://localhost:8000/docs` (o tu puerto configurado)
- **MongoDB**: `localhost:27017` (o tu puerto configurado)

## 🛑 Detener Aplicación

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v
```

## 🔧 Comandos Útiles

```bash
# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir imágenes
docker-compose build --no-cache

# Ver estado de salud
docker-compose ps
```

## ⚠️ Problemas Comunes

### Puerto Ocupado
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Cambiar puerto en .env
BACKEND_PORT=8001
```

### Contenedor No Inicia
```bash
# Ver logs
docker-compose logs backend

# Reconstruir
docker-compose build backend
docker-compose up -d backend
```

### MongoDB No Conecta
```bash
# Verificar estado
docker-compose ps mongodb

# Ver logs
docker-compose logs mongodb

# Probar conexión
docker exec -it drtc-mongodb mongosh -u admin -p password
```

## 📚 Documentación Completa

Para más detalles, consulta:
- **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - Guía completa de despliegue
- **[.env.example](.env.example)** - Variables de entorno disponibles

## 🎯 Arquitectura

```
Usuario → Nginx (80/443) → Frontend (4200) + Backend (8000) → MongoDB (27017)
```

**Ventajas:**
- ✅ Puertos configurables
- ✅ Nginx como reverse proxy
- ✅ Fácil escalamiento
- ✅ Aislamiento de servicios
- ✅ Health checks automáticos
- ✅ Listo para producción

## 🔒 Seguridad en Producción

Antes de desplegar en producción, **CAMBIAR**:

```env
SECRET_KEY=tu-clave-muy-segura-y-larga-aqui
MONGO_INITDB_ROOT_PASSWORD=contraseña-segura-mongodb
ENVIRONMENT=production
DEBUG=false
```

## 📞 Ayuda

Si tienes problemas:
1. Ejecuta `scripts/check-ports.bat` (Windows) o `scripts/check-ports.sh` (Linux/Mac)
2. Revisa los logs: `docker-compose logs -f`
3. Consulta [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
