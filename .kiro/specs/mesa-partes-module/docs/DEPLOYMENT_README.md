# Mesa de Partes - Deployment Files

Este directorio contiene todos los archivos necesarios para desplegar el Módulo de Mesa de Partes.

## Estructura de Archivos

```
.
├── backend/
│   └── Dockerfile.mesa-partes          # Dockerfile para backend
├── frontend/
│   ├── Dockerfile.mesa-partes          # Dockerfile para frontend
│   └── nginx.conf                       # Configuración de Nginx para frontend
├── nginx/
│   └── nginx.mesa-partes.conf          # Configuración de Nginx para producción
├── monitoring/
│   ├── prometheus.mesa-partes.yml      # Configuración de Prometheus
│   └── alerts/
│       └── mesa-partes-alerts.yml      # Reglas de alertas
├── .github/
│   └── workflows/
│       └── mesa-partes-ci-cd.yml       # Pipeline CI/CD
├── docker-compose.mesa-partes.yml      # Compose principal
├── docker-compose.mesa-partes.prod.yml # Overrides para producción
├── docker-compose.mesa-partes.monitoring.yml # Stack de monitoreo
└── .env.mesa-partes.example            # Ejemplo de variables de entorno
```

## Quick Start

### Desarrollo Local

1. **Copiar archivo de configuración:**
```bash
cp .env.mesa-partes.example .env
```

2. **Editar variables de entorno:**
```bash
nano .env
# Actualizar valores según su entorno
```

3. **Iniciar servicios:**
```bash
docker-compose -f docker-compose.mesa-partes.yml up -d
```

4. **Verificar servicios:**
```bash
docker-compose -f docker-compose.mesa-partes.yml ps
```

5. **Ver logs:**
```bash
docker-compose -f docker-compose.mesa-partes.yml logs -f
```

6. **Acceder a la aplicación:**
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Producción

1. **Preparar servidor:**
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clonar repositorio:**
```bash
git clone https://github.com/[org]/mesa-partes.git
cd mesa-partes
```

3. **Configurar variables de entorno:**
```bash
cp .env.mesa-partes.example .env
nano .env
# Actualizar con valores de producción
```

4. **Configurar SSL:**
```bash
# Obtener certificados con Let's Encrypt
sudo certbot certonly --standalone -d mesapartes.ejemplo.gob.pe

# Copiar certificados
sudo cp /etc/letsencrypt/live/mesapartes.ejemplo.gob.pe/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/mesapartes.ejemplo.gob.pe/privkey.pem nginx/ssl/
```

5. **Inicializar base de datos:**
```bash
# Iniciar solo PostgreSQL
docker-compose -f docker-compose.mesa-partes.yml up -d postgres

# Ejecutar migraciones
docker-compose -f docker-compose.mesa-partes.yml run --rm backend python -m alembic upgrade head

# Crear usuario administrador
docker-compose -f docker-compose.mesa-partes.yml run --rm backend python scripts/create_admin.py
```

6. **Desplegar aplicación:**
```bash
docker-compose -f docker-compose.mesa-partes.yml -f docker-compose.mesa-partes.prod.yml up -d
```

7. **Configurar monitoreo (opcional):**
```bash
docker-compose -f docker-compose.mesa-partes.monitoring.yml up -d
```

## Comandos Útiles

### Gestión de Servicios

```bash
# Iniciar servicios
docker-compose -f docker-compose.mesa-partes.yml up -d

# Detener servicios
docker-compose -f docker-compose.mesa-partes.yml down

# Reiniciar servicios
docker-compose -f docker-compose.mesa-partes.yml restart

# Ver estado de servicios
docker-compose -f docker-compose.mesa-partes.yml ps

# Ver logs
docker-compose -f docker-compose.mesa-partes.yml logs -f [servicio]

# Rebuild después de cambios
docker-compose -f docker-compose.mesa-partes.yml up -d --build
```

### Base de Datos

```bash
# Ejecutar migraciones
docker-compose -f docker-compose.mesa-partes.yml exec backend python -m alembic upgrade head

# Crear migración
docker-compose -f docker-compose.mesa-partes.yml exec backend python -m alembic revision --autogenerate -m "descripcion"

# Backup de base de datos
docker-compose -f docker-compose.mesa-partes.yml exec postgres pg_dump -U mesapartes_user mesapartes > backup.sql

# Restaurar base de datos
cat backup.sql | docker-compose -f docker-compose.mesa-partes.yml exec -T postgres psql -U mesapartes_user mesapartes
```

### Mantenimiento

```bash
# Limpiar contenedores detenidos
docker-compose -f docker-compose.mesa-partes.yml down --remove-orphans

# Limpiar volúmenes no utilizados
docker volume prune

# Limpiar imágenes no utilizadas
docker image prune -a

# Ver uso de recursos
docker stats
```

## Configuración de Variables de Entorno

Las variables más importantes a configurar:

### Seguridad
```bash
SECRET_KEY=generate-secure-key-here
JWT_SECRET_KEY=generate-secure-key-here
```

Generar claves seguras:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Base de Datos
```bash
POSTGRES_DB=mesapartes
POSTGRES_USER=mesapartes_user
POSTGRES_PASSWORD=secure_password_here
```

### Email
```bash
SMTP_HOST=smtp.ejemplo.gob.pe
SMTP_PORT=587
SMTP_USER=mesapartes@ejemplo.gob.pe
SMTP_PASSWORD=email_password
```

### URLs
```bash
API_URL=https://mesapartes.ejemplo.gob.pe/api/v1
WEBSOCKET_URL=wss://mesapartes.ejemplo.gob.pe/ws
CORS_ORIGINS=https://mesapartes.ejemplo.gob.pe
```

## Monitoreo

### Acceder a Servicios de Monitoreo

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Alertmanager**: http://localhost:9093

### Dashboards de Grafana

Los dashboards están pre-configurados en `monitoring/grafana/dashboards/`:

1. **Sistema**: CPU, memoria, disco, red
2. **Aplicación**: Requests, errores, latencia
3. **Base de Datos**: Conexiones, queries, performance
4. **Redis**: Memoria, hits, comandos

### Alertas

Las alertas están configuradas en `monitoring/alerts/mesa-partes-alerts.yml`:

- CPU > 80%
- Memoria > 85%
- Disco > 90%
- Servicio caído
- Error rate > 5%
- Response time > 2s

## CI/CD

El pipeline de CI/CD está configurado en `.github/workflows/mesa-partes-ci-cd.yml`.

### Flujo de Trabajo

1. **Push a develop**: Deploy automático a staging
2. **Push a main**: Deploy automático a producción (requiere aprobación)
3. **Pull Request**: Ejecuta tests y E2E

### Configurar Secrets en GitHub

Necesita configurar estos secrets en GitHub:

```
STAGING_HOST=staging.mesapartes.ejemplo.gob.pe
STAGING_USER=deploy
STAGING_SSH_KEY=[private-key]

PRODUCTION_HOST=mesapartes.ejemplo.gob.pe
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=[private-key]
```

## Backup y Recuperación

### Backup Automático

El script de backup está en `/usr/local/bin/backup-mesapartes.sh`.

Configurar cron:
```bash
sudo crontab -e
# Agregar: 0 2 * * * /usr/local/bin/backup-mesapartes.sh
```

### Backup Manual

```bash
# Backup completo
./scripts/backup.sh

# Solo base de datos
docker-compose -f docker-compose.mesa-partes.yml exec postgres pg_dump -U mesapartes_user mesapartes | gzip > backup_$(date +%Y%m%d).sql.gz

# Solo archivos
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/mesapartes_uploads
```

### Restauración

```bash
# Restaurar base de datos
gunzip < backup_20250115.sql.gz | docker-compose -f docker-compose.mesa-partes.yml exec -T postgres psql -U mesapartes_user mesapartes

# Restaurar archivos
tar -xzf uploads_backup_20250115.tar.gz -C /
```

## Troubleshooting

### Problema: Contenedor no inicia

```bash
# Ver logs detallados
docker-compose -f docker-compose.mesa-partes.yml logs [servicio]

# Inspeccionar contenedor
docker inspect mesa-partes-[servicio]

# Verificar configuración
docker-compose -f docker-compose.mesa-partes.yml config
```

### Problema: Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose -f docker-compose.mesa-partes.yml ps postgres

# Probar conexión
docker-compose -f docker-compose.mesa-partes.yml exec postgres psql -U mesapartes_user -d mesapartes

# Ver logs de PostgreSQL
docker-compose -f docker-compose.mesa-partes.yml logs postgres
```

### Problema: Alto uso de recursos

```bash
# Ver uso de recursos
docker stats

# Ajustar límites en docker-compose.mesa-partes.prod.yml
# Reiniciar servicios
docker-compose -f docker-compose.mesa-partes.yml -f docker-compose.mesa-partes.prod.yml restart
```

## Seguridad

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Generar claves secretas únicas
- [ ] Configurar SSL/TLS
- [ ] Configurar firewall
- [ ] Restringir acceso a puertos internos
- [ ] Configurar rate limiting
- [ ] Habilitar logs de auditoría
- [ ] Configurar backups automáticos
- [ ] Actualizar regularmente las imágenes
- [ ] Revisar logs de seguridad

### Actualización de Seguridad

```bash
# Actualizar imágenes
docker-compose -f docker-compose.mesa-partes.yml pull

# Reiniciar con nuevas imágenes
docker-compose -f docker-compose.mesa-partes.yml up -d

# Verificar versiones
docker-compose -f docker-compose.mesa-partes.yml images
```

## Soporte

Para más información, consulte:

- [Guía de Usuario](./USER_GUIDE.md)
- [Documentación de API](./API_DOCUMENTATION.md)
- [Guía de Integraciones](./INTEGRATION_GUIDE.md)
- [Guía de Deployment](./DEPLOYMENT_GUIDE.md)

**Soporte Técnico:**
- Email: devops@[institucion].gob.pe
- Teléfono: [número]
- Horario: 24/7 para producción

---

**Versión**: 1.0  
**Última actualización**: Enero 2025
