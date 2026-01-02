# Guía de Despliegue con Docker

## 📋 Arquitectura

El sistema utiliza **4 contenedores Docker** separados:

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Puerto 80/443)                │
│              Reverse Proxy & Load Balancer              │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│   Frontend   │  │    Backend    │
│  Angular     │  │   FastAPI     │
│  (Puerto     │  │  (Puerto      │
│   4200)      │  │   8000)       │
└──────────────┘  └───────┬───────┘
                          │
                  ┌───────▼────────┐
                  │    MongoDB     │
                  │  (Puerto       │
                  │   27017)       │
                  └────────────────┘
```

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

### 2. Cambiar Puertos si están Ocupados

Si algún puerto está ocupado en tu servidor, edita el archivo `.env`:

```env
# Ejemplo: Si el puerto 8000 está ocupado, usa 8001
BACKEND_PORT=8001

# Si el puerto 80 está ocupado, usa 8080
NGINX_HTTP_PORT=8080

# Si el puerto 4200 está ocupado, usa 4201
FRONTEND_PORT=4201
```

### 3. Iniciar los Contenedores

```bash
# Desarrollo
docker-compose up -d

# Producción (con build)
docker-compose up -d --build
```

### 4. Verificar Estado

```bash
# Ver logs
docker-compose logs -f

# Ver estado de contenedores
docker-compose ps

# Verificar salud
curl http://localhost/health
```

## 🔧 Configuración de Puertos

### Puertos por Defecto

| Servicio | Puerto Interno | Puerto Externo | Configurable en .env |
|----------|---------------|----------------|---------------------|
| MongoDB  | 27017 | 27017 | `MONGODB_PORT` |
| Backend  | 8000 | 8000 | `BACKEND_PORT` |
| Frontend | 4200 | 4200 | `FRONTEND_PORT` |
| Nginx HTTP | 80 | 80 | `NGINX_HTTP_PORT` |
| Nginx HTTPS | 443 | 443 | `NGINX_HTTPS_PORT` |

### Ejemplo de Configuración Alternativa

Si todos los puertos estándar están ocupados:

```env
MONGODB_PORT=27018
BACKEND_PORT=8001
FRONTEND_PORT=4201
NGINX_HTTP_PORT=8080
NGINX_HTTPS_PORT=8443
```

Luego accede a:
- **Aplicación**: `http://localhost:8080`
- **API directa**: `http://localhost:8001` (no recomendado, usar Nginx)
- **Frontend directo**: `http://localhost:4201` (no recomendado, usar Nginx)

## 🌐 Acceso a la Aplicación

### Desarrollo

```bash
# A través de Nginx (RECOMENDADO)
http://localhost

# API directa (solo para debugging)
http://localhost:8000/docs

# Frontend directo (solo para debugging)
http://localhost:4200
```

### Producción

```bash
# HTTP
http://tu-dominio.com

# HTTPS (después de configurar SSL)
https://tu-dominio.com
```

## 🔒 Configuración SSL/HTTPS

### 1. Obtener Certificados

```bash
# Opción 1: Let's Encrypt (Recomendado)
sudo certbot certonly --standalone -d tu-dominio.com

# Opción 2: Certificado autofirmado (solo desarrollo)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 2. Copiar Certificados

```bash
# Si usas Let's Encrypt
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/key.pem
```

### 3. Descomentar Configuración HTTPS

Edita `nginx/nginx.conf` y descomenta la sección del servidor HTTPS.

### 4. Reiniciar Nginx

```bash
docker-compose restart nginx
```

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs de un servicio
docker-compose logs -f backend

# Reconstruir imágenes
docker-compose build --no-cache

# Limpiar todo (¡CUIDADO! Elimina datos)
docker-compose down -v
```

### Debugging

```bash
# Entrar a un contenedor
docker exec -it sirret-backend bash
docker exec -it sirret-frontend sh
docker exec -it sirret-mongodb mongosh

# Ver uso de recursos
docker stats

# Inspeccionar red
docker network inspect drtc-network

# Ver logs en tiempo real
docker-compose logs -f --tail=100
```

### Base de Datos

```bash
# Backup de MongoDB
docker exec sirret-mongodb mongodump --out /data/backup

# Restore de MongoDB
docker exec sirret-mongodb mongorestore /data/backup

# Conectar a MongoDB
docker exec -it sirret-mongodb mongosh -u admin -p password
```

## 🔍 Solución de Problemas

### Puerto Ocupado

**Error**: `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solución**:
```bash
# 1. Identificar qué está usando el puerto
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# 2. Cambiar el puerto en .env
BACKEND_PORT=8001

# 3. Reiniciar
docker-compose down
docker-compose up -d
```

### Contenedor No Inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Verificar configuración
docker-compose config

# Reconstruir imagen
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Problemas de Conexión

```bash
# Verificar red
docker network inspect drtc-network

# Verificar health checks
docker-compose ps

# Probar conectividad entre contenedores
docker exec sirret-backend ping mongodb
docker exec sirret-frontend ping backend
```

### MongoDB No Conecta

```bash
# Verificar que MongoDB esté corriendo
docker-compose ps mongodb

# Ver logs de MongoDB
docker-compose logs mongodb

# Verificar credenciales en .env
cat .env | grep MONGO

# Probar conexión manual
docker exec -it sirret-mongodb mongosh -u admin -p password
```

## 📊 Monitoreo

### Health Checks

Todos los servicios tienen health checks configurados:

```bash
# Verificar estado
docker-compose ps

# Nginx health
curl http://localhost/health

# Backend health
curl http://localhost:8000/health

# MongoDB health
docker exec sirret-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo errores
docker-compose logs -f | grep ERROR

# Últimas 100 líneas
docker-compose logs --tail=100

# Desde hace 1 hora
docker-compose logs --since 1h
```

## 🚀 Despliegue en Producción

### Checklist Pre-Despliegue

- [ ] Cambiar `SECRET_KEY` en `.env`
- [ ] Cambiar contraseñas de MongoDB
- [ ] Configurar `ALLOWED_ORIGINS` correctamente
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo
- [ ] Probar en ambiente de staging
- [ ] Documentar configuración específica del servidor

### Variables de Entorno Críticas

```env
# CAMBIAR EN PRODUCCIÓN
SECRET_KEY=tu-clave-secreta-muy-larga-y-aleatoria-aqui
MONGO_INITDB_ROOT_PASSWORD=contraseña-segura-mongodb
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://tu-dominio.com
```

### Comandos de Producción

```bash
# Build y deploy
docker-compose -f docker-compose.yml up -d --build

# Ver logs sin seguir
docker-compose logs --tail=100

# Backup antes de actualizar
./scripts/backup.sh

# Actualizar código
git pull
docker-compose build
docker-compose up -d

# Rollback si hay problemas
docker-compose down
git checkout <commit-anterior>
docker-compose up -d
```

## 📝 Notas Importantes

1. **Nginx es el punto de entrada**: Todos los requests deben pasar por Nginx (puerto 80/443)
2. **No exponer puertos internos**: En producción, solo exponer puerto 80/443 de Nginx
3. **Usar variables de entorno**: Nunca hardcodear credenciales
4. **Health checks**: Aseguran que los servicios estén listos antes de recibir tráfico
5. **Backups regulares**: Configurar backups automáticos de MongoDB
6. **Monitoreo**: Implementar monitoreo de logs y métricas

## 🔗 Enlaces Útiles

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Angular Deployment](https://angular.io/guide/deployment)

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica la configuración: `docker-compose config`
3. Consulta esta guía
4. Revisa la documentación oficial de cada servicio
