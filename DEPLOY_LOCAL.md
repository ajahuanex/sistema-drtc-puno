# Guía de Despliegue Local con Docker

## 🚀 Inicio Rápido

Esta guía te ayudará a desplegar la aplicación localmente usando Docker con puertos alternativos para evitar conflictos.

## 📋 Requisitos Previos

- Docker Desktop instalado y ejecutándose
- Docker Compose v2.0 o superior
- Al menos 4GB de RAM disponible
- 10GB de espacio en disco

## 🔌 Puertos Utilizados

Para evitar conflictos con servicios existentes, usamos puertos alternativos:

| Servicio | Puerto Estándar | Puerto Local | Acceso |
|----------|----------------|--------------|---------|
| Nginx (HTTP) | 80 | **8080** | http://localhost:8080 |
| Nginx (HTTPS) | 443 | **8443** | https://localhost:8443 |
| Backend API | 8000 | **8001** | http://localhost:8001 |
| Frontend | 80 | **4201** | http://localhost:4201 |
| PostgreSQL | 5432 | **5433** | localhost:5433 |
| Redis | 6379 | **6380** | localhost:6380 |

## 🛠️ Instalación

### Paso 1: Verificar Puertos Disponibles

```cmd
# Verificar que los puertos alternativos estén libres
netstat -ano | findstr "8080 8443 8001 4201 5433 6380"
```

Si algún puerto está ocupado, puedes modificar los puertos en `docker-compose.local.yml`.

### Paso 2: Configurar Variables de Entorno

El archivo `.env.local` ya está configurado con valores por defecto seguros para desarrollo local.

**Opcional:** Si deseas cambiar alguna configuración, edita `.env.local`:

```bash
# Ejemplo: cambiar contraseña de base de datos
POSTGRES_PASSWORD=tu_nueva_contraseña
```

### Paso 3: Construir las Imágenes

```cmd
# Construir todas las imágenes
docker-compose -f docker-compose.local.yml build

# O construir con caché limpio (si hay problemas)
docker-compose -f docker-compose.local.yml build --no-cache
```

### Paso 4: Iniciar los Servicios

```cmd
# Iniciar todos los servicios en segundo plano
docker-compose -f docker-compose.local.yml --env-file .env.local up -d

# Ver los logs en tiempo real
docker-compose -f docker-compose.local.yml logs -f
```

### Paso 5: Verificar el Estado

```cmd
# Ver el estado de los contenedores
docker-compose -f docker-compose.local.yml ps

# Verificar la salud de los servicios
docker-compose -f docker-compose.local.yml ps --format json
```

## 🌐 Acceso a la Aplicación

Una vez que todos los servicios estén ejecutándose:

### Aplicación Principal
- **URL:** http://localhost:8080
- **Descripción:** Acceso completo a la aplicación a través de Nginx

### API Backend (Swagger)
- **URL:** http://localhost:8001/docs
- **Descripción:** Documentación interactiva de la API

### Frontend Directo
- **URL:** http://localhost:4201
- **Descripción:** Acceso directo al frontend (sin proxy)

## 🔍 Verificación de Servicios

### 1. Verificar Base de Datos

```cmd
# Conectar a PostgreSQL
docker exec -it resoluciones-postgres-local psql -U postgres -d resoluciones_db

# Dentro de psql, verificar tablas
\dt

# Salir
\q
```

### 2. Verificar Redis

```cmd
# Conectar a Redis
docker exec -it resoluciones-redis-local redis-cli -a redis123

# Dentro de redis-cli, verificar conexión
PING

# Salir
exit
```

### 3. Verificar Backend

```cmd
# Ver logs del backend
docker-compose -f docker-compose.local.yml logs backend

# Verificar health check
curl http://localhost:8001/health
```

### 4. Verificar Frontend

```cmd
# Ver logs del frontend
docker-compose -f docker-compose.local.yml logs frontend

# Verificar acceso
curl http://localhost:4201
```

## 🛑 Detener los Servicios

```cmd
# Detener todos los servicios
docker-compose -f docker-compose.local.yml down

# Detener y eliminar volúmenes (¡CUIDADO! Esto borra los datos)
docker-compose -f docker-compose.local.yml down -v

# Detener y eliminar todo (imágenes, volúmenes, redes)
docker-compose -f docker-compose.local.yml down -v --rmi all
```

## 🔄 Reiniciar Servicios

```cmd
# Reiniciar todos los servicios
docker-compose -f docker-compose.local.yml restart

# Reiniciar un servicio específico
docker-compose -f docker-compose.local.yml restart backend
```

## 📊 Monitoreo y Logs

### Ver Logs

```cmd
# Todos los servicios
docker-compose -f docker-compose.local.yml logs -f

# Servicio específico
docker-compose -f docker-compose.local.yml logs -f backend

# Últimas 100 líneas
docker-compose -f docker-compose.local.yml logs --tail=100
```

### Estadísticas de Recursos

```cmd
# Ver uso de recursos
docker stats

# Ver uso de un contenedor específico
docker stats resoluciones-backend-local
```

## 🐛 Solución de Problemas

### Problema: Puerto ya en uso

**Síntoma:** Error al iniciar: "port is already allocated"

**Solución:**
1. Verificar qué proceso usa el puerto:
   ```cmd
   netstat -ano | findstr ":8080"
   ```
2. Detener el proceso o cambiar el puerto en `docker-compose.local.yml`

### Problema: Contenedor no inicia

**Síntoma:** Contenedor en estado "Restarting" o "Exited"

**Solución:**
```cmd
# Ver logs del contenedor
docker-compose -f docker-compose.local.yml logs [servicio]

# Ver logs detallados
docker logs resoluciones-backend-local --tail 50
```

### Problema: Base de datos no conecta

**Síntoma:** Backend no puede conectar a PostgreSQL

**Solución:**
```cmd
# Verificar que PostgreSQL esté saludable
docker-compose -f docker-compose.local.yml ps postgres

# Reiniciar PostgreSQL
docker-compose -f docker-compose.local.yml restart postgres

# Verificar logs
docker-compose -f docker-compose.local.yml logs postgres
```

### Problema: Cambios no se reflejan

**Síntoma:** Los cambios en el código no aparecen en la aplicación

**Solución:**
```cmd
# Reconstruir las imágenes
docker-compose -f docker-compose.local.yml build --no-cache

# Reiniciar los servicios
docker-compose -f docker-compose.local.yml up -d --force-recreate
```

### Problema: Error de permisos

**Síntoma:** "Permission denied" en volúmenes

**Solución:**
```cmd
# En Windows, asegúrate de que Docker Desktop tenga acceso a la carpeta
# Settings > Resources > File Sharing

# Reiniciar Docker Desktop
```

## 🧹 Limpieza

### Limpiar Contenedores Detenidos

```cmd
docker container prune -f
```

### Limpiar Imágenes No Usadas

```cmd
docker image prune -a -f
```

### Limpiar Volúmenes No Usados

```cmd
docker volume prune -f
```

### Limpieza Completa

```cmd
# ¡CUIDADO! Esto elimina TODO lo de Docker
docker system prune -a --volumes -f
```

## 📝 Comandos Útiles

### Ejecutar Comandos en Contenedores

```cmd
# Bash en el backend
docker exec -it resoluciones-backend-local bash

# Bash en el frontend
docker exec -it resoluciones-frontend-local sh

# Ejecutar comando sin entrar
docker exec resoluciones-backend-local python -c "print('Hello')"
```

### Copiar Archivos

```cmd
# Desde contenedor a host
docker cp resoluciones-backend-local:/app/logs/app.log ./logs/

# Desde host a contenedor
docker cp ./config.json resoluciones-backend-local:/app/config.json
```

### Inspeccionar Contenedores

```cmd
# Ver configuración completa
docker inspect resoluciones-backend-local

# Ver solo la IP
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' resoluciones-backend-local
```

## 🔐 Seguridad

### Cambiar Contraseñas por Defecto

Para producción, **SIEMPRE** cambia las contraseñas en `.env.local`:

```bash
# Generar contraseña segura
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 64)
```

### Habilitar HTTPS

Para habilitar HTTPS en local:

1. Generar certificados auto-firmados:
   ```cmd
   mkdir nginx\ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx\ssl\nginx.key -out nginx\ssl\nginx.crt
   ```

2. Acceder a: https://localhost:8443

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose -f docker-compose.local.yml logs`
2. Verifica el estado: `docker-compose -f docker-compose.local.yml ps`
3. Consulta esta guía de solución de problemas
4. Contacta al equipo de desarrollo

---

**¡Listo para desarrollar! 🎉**

Accede a la aplicación en: http://localhost:8080
