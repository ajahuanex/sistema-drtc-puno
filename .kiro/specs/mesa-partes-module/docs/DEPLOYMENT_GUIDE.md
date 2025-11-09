# Guía de Deployment - Módulo de Mesa de Partes

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Arquitectura de Deployment](#arquitectura-de-deployment)
4. [Deployment con Docker](#deployment-con-docker)
5. [Deployment en Producción](#deployment-en-producción)
6. [Configuración de Base de Datos](#configuración-de-base-de-datos)
7. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
8. [SSL/TLS y Seguridad](#ssltls-y-seguridad)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Backup y Recuperación](#backup-y-recuperación)
11. [Escalamiento](#escalamiento)
12. [Troubleshooting](#troubleshooting)

---

## Introducción

Esta guía proporciona instrucciones detalladas para desplegar el Módulo de Mesa de Partes en diferentes entornos.

### Entornos Soportados

- **Desarrollo**: Para desarrollo local
- **Staging**: Para pruebas pre-producción
- **Producción**: Para uso en producción

---

## Requisitos del Sistema

### Hardware Mínimo

**Para Desarrollo:**
- CPU: 2 cores
- RAM: 4 GB
- Disco: 20 GB SSD

**Para Producción (hasta 1000 usuarios):**
- CPU: 4 cores
- RAM: 8 GB
- Disco: 100 GB SSD
- Ancho de banda: 100 Mbps

**Para Producción (más de 1000 usuarios):**
- CPU: 8+ cores
- RAM: 16+ GB
- Disco: 500+ GB SSD
- Ancho de banda: 1 Gbps

### Software Requerido

**Backend:**
- Python 3.11+
- PostgreSQL 14+
- Redis 7+

**Frontend:**
- Node.js 18+
- npm 9+

**Infraestructura:**
- Docker 24+
- Docker Compose 2.20+
- Nginx 1.24+ (para proxy reverso)

### Puertos Requeridos

- `80`: HTTP (redirige a HTTPS)
- `443`: HTTPS
- `5432`: PostgreSQL (solo interno)
- `6379`: Redis (solo interno)
- `8000`: Backend API (solo interno)
- `4200`: Frontend (solo desarrollo)

---

## Arquitectura de Deployment

### Diagrama de Arquitectura

```
                    Internet
                       |
                   [Firewall]
                       |
                   [Nginx]
                  (SSL/TLS)
                       |
        +--------------+---------------+
        |                              |
   [Frontend]                     [Backend]
   (Angular)                      (FastAPI)
        |                              |
        |                         [PostgreSQL]
        |                              |
        |                          [Redis]
        |                              |
        +------------------------------+
                       |
              [File Storage]
```

### Componentes

1. **Nginx**: Proxy reverso y terminación SSL
2. **Frontend**: Aplicación Angular servida estáticamente
3. **Backend**: API FastAPI
4. **PostgreSQL**: Base de datos principal
5. **Redis**: Caché y sesiones
6. **File Storage**: Almacenamiento de archivos adjuntos

---

## Deployment con Docker

### Estructura de Archivos

```
mesa-partes/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env
├── .env.example
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
└── nginx/
    ├── nginx.conf
    └── ssl/
```

### Docker Compose para Desarrollo

Ver archivo `docker-compose.yml` en la sección de archivos.

### Comandos de Deployment

**Iniciar servicios:**
```bash
docker-compose up -d
```

**Ver logs:**
```bash
docker-compose logs -f
```

**Detener servicios:**
```bash
docker-compose down
```

**Rebuild después de cambios:**
```bash
docker-compose up -d --build
```

---

## Deployment en Producción

### Paso 1: Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Crear usuario para la aplicación
sudo useradd -m -s /bin/bash mesapartes
sudo usermod -aG docker mesapartes
```

### Paso 2: Clonar Repositorio

```bash
# Como usuario mesapartes
su - mesapartes
git clone https://github.com/[org]/mesa-partes.git
cd mesa-partes
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

Ver sección de Variables de Entorno para detalles.

### Paso 4: Configurar SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --standalone -d mesapartes.ejemplo.gob.pe

# Copiar certificados
sudo cp /etc/letsencrypt/live/mesapartes.ejemplo.gob.pe/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/mesapartes.ejemplo.gob.pe/privkey.pem nginx/ssl/
sudo chown mesapartes:mesapartes nginx/ssl/*
```

### Paso 5: Inicializar Base de Datos

```bash
# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Esperar que inicie
sleep 10

# Ejecutar migraciones
docker-compose run --rm backend python -m alembic upgrade head

# Crear usuario administrador
docker-compose run --rm backend python scripts/create_admin.py
```

### Paso 6: Desplegar Aplicación

```bash
# Usar configuración de producción
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Paso 7: Configurar Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Paso 8: Configurar Backup Automático

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-mesapartes.sh

# Ver sección de Backup para contenido del script

# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-mesapartes.sh

# Configurar cron
sudo crontab -e
# Agregar: 0 2 * * * /usr/local/bin/backup-mesapartes.sh
```

---

## Configuración de Base de Datos

### PostgreSQL

**Configuración Recomendada:**

```sql
-- Crear base de datos
CREATE DATABASE mesapartes;

-- Crear usuario
CREATE USER mesapartes_user WITH PASSWORD 'secure_password';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE mesapartes TO mesapartes_user;

-- Configurar extensiones
\c mesapartes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**Optimizaciones:**

```sql
-- Configurar parámetros de rendimiento
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '10MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Reiniciar PostgreSQL
SELECT pg_reload_conf();
```

### Redis

**Configuración Recomendada:**

```conf
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

---

## Configuración de Variables de Entorno

### Archivo .env

```bash
# Entorno
ENVIRONMENT=production

# Base de Datos
DATABASE_URL=postgresql://mesapartes_user:secure_password@postgres:5432/mesapartes
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_CACHE_TTL=3600

# Seguridad
SECRET_KEY=generate-a-very-secure-random-key-here
JWT_SECRET_KEY=generate-another-secure-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# CORS
CORS_ORIGINS=https://mesapartes.ejemplo.gob.pe

# File Storage
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,docx,xlsx

# Email
SMTP_HOST=smtp.ejemplo.gob.pe
SMTP_PORT=587
SMTP_USER=mesapartes@ejemplo.gob.pe
SMTP_PASSWORD=email_password
SMTP_FROM=mesapartes@ejemplo.gob.pe
SMTP_TLS=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000

# WebSocket
WEBSOCKET_URL=wss://mesapartes.ejemplo.gob.pe/ws

# Frontend
API_URL=https://mesapartes.ejemplo.gob.pe/api/v1
```

### Generar Claves Seguras

```bash
# Generar SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generar JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## SSL/TLS y Seguridad

### Configuración de Nginx con SSL

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name mesapartes.ejemplo.gob.pe;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mesapartes.ejemplo.gob.pe;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 10M;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Renovación Automática de Certificados

```bash
# Crear script de renovación
sudo nano /usr/local/bin/renew-ssl.sh
```

```bash
#!/bin/bash
certbot renew --quiet
docker-compose restart nginx
```

```bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/renew-ssl.sh

# Configurar cron (ejecutar diariamente)
sudo crontab -e
# Agregar: 0 3 * * * /usr/local/bin/renew-ssl.sh
```

---

## Monitoreo y Logs

### Configuración de Logging

**Backend (Python):**

```python
# logging_config.py
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        },
        "json": {
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "json",
            "filename": "/app/logs/app.log",
            "maxBytes": 10485760,
            "backupCount": 10
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"]
    }
}
```

### Monitoreo con Prometheus y Grafana

**docker-compose.monitoring.yml:**

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

volumes:
  prometheus_data:
  grafana_data:
```

### Métricas a Monitorear

1. **Sistema:**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network I/O

2. **Aplicación:**
   - Request rate
   - Response time
   - Error rate
   - Active users

3. **Base de Datos:**
   - Connection pool
   - Query performance
   - Slow queries
   - Database size

4. **Redis:**
   - Memory usage
   - Hit rate
   - Connected clients

### Alertas

Configure alertas para:
- CPU > 80%
- Memory > 85%
- Disk > 90%
- Error rate > 5%
- Response time > 2s
- Database connections > 80% pool

---

## Backup y Recuperación

### Script de Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-mesapartes.sh

BACKUP_DIR="/backups/mesapartes"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de PostgreSQL
docker exec postgres pg_dump -U mesapartes_user mesapartes | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/lib/docker/volumes/mesapartes_uploads

# Backup de configuración
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /home/mesapartes/mesa-partes/.env /home/mesapartes/mesa-partes/nginx

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Subir a almacenamiento remoto (opcional)
# aws s3 sync $BACKUP_DIR s3://backups-mesapartes/

echo "Backup completado: $DATE"
```

### Restauración desde Backup

```bash
#!/bin/bash
# restore-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore-backup.sh <archivo_backup>"
    exit 1
fi

# Detener servicios
docker-compose down

# Restaurar base de datos
gunzip < $BACKUP_FILE | docker exec -i postgres psql -U mesapartes_user mesapartes

# Restaurar archivos
# tar -xzf files_backup.tar.gz -C /

# Iniciar servicios
docker-compose up -d

echo "Restauración completada"
```

---

## Escalamiento

### Escalamiento Horizontal

**Backend:**

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

**Load Balancer (Nginx):**

```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

### Escalamiento Vertical

Ajustar recursos en docker-compose:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

### Base de Datos

**Replicación Read-Only:**

```yaml
services:
  postgres-primary:
    image: postgres:14
    environment:
      - POSTGRES_REPLICATION_MODE=master

  postgres-replica:
    image: postgres:14
    environment:
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_MASTER_HOST=postgres-primary
```

---

## Troubleshooting

### Problema: Contenedor no inicia

**Diagnóstico:**
```bash
docker-compose logs backend
docker inspect mesa-partes_backend_1
```

**Soluciones:**
- Verificar variables de entorno
- Verificar permisos de archivos
- Verificar puertos disponibles

### Problema: Error de conexión a base de datos

**Diagnóstico:**
```bash
docker-compose exec backend python -c "from app.database import engine; engine.connect()"
```

**Soluciones:**
- Verificar que PostgreSQL esté corriendo
- Verificar DATABASE_URL
- Verificar credenciales

### Problema: Alto uso de memoria

**Diagnóstico:**
```bash
docker stats
```

**Soluciones:**
- Ajustar pool de conexiones
- Configurar límites de memoria
- Optimizar queries
- Aumentar recursos

### Problema: Lentitud en respuestas

**Diagnóstico:**
```bash
# Ver queries lentas
docker-compose exec postgres psql -U mesapartes_user -d mesapartes -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Soluciones:**
- Agregar índices
- Optimizar queries
- Aumentar caché
- Escalar horizontalmente

---

## Checklist de Deployment

- [ ] Servidor preparado con Docker instalado
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Certificados SSL configurados
- [ ] Base de datos inicializada
- [ ] Migraciones ejecutadas
- [ ] Usuario administrador creado
- [ ] Servicios iniciados correctamente
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoreo configurado
- [ ] Logs funcionando correctamente
- [ ] SSL/TLS verificado
- [ ] Pruebas de funcionalidad realizadas
- [ ] Documentación actualizada
- [ ] Equipo capacitado

---

## Soporte

Para asistencia con deployment:

**Soporte Técnico:**
- Email: devops@[institucion].gob.pe
- Teléfono: [número]
- Horario: 24/7 para producción

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Módulo**: Mesa de Partes - Deployment
