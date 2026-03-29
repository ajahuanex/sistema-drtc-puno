# Plan de Limpieza de Código Basura y Deployment Docker

## 1. ANÁLISIS DE CÓDIGO BASURA

### Archivos a Eliminar (Raíz del Proyecto)
- **Scripts de prueba/debug**: `test_*.py`, `debug_*.py`, `verificar_*.py`, `diagnosticar_*.py`
- **Scripts de migración antiguos**: `migracion_*.py`, `actualizar_*.py`, `crear_*.py`
- **Documentos de proceso**: `RESUMEN_*.md`, `ESTADO_*.md`, `SOLUCION_*.md`, `PLAN_*.md`
- **Archivos temporales**: `*.tmp`, `*.json` (datos de prueba), `*.xlsx` (plantillas antiguas)
- **Backups**: `backup_*/`, `curl` (archivo sin extensión)

### Carpetas a Limpiar
- `backup_resoluciones_componentes/` - Backups antiguos
- `backup_templates_problematicos/` - Backups antiguos
- `__pycache__/` - Caché de Python

### Archivos a Mantener
- `docker-compose.yml` - Configuración principal
- `docker-compose.local.yml` - Desarrollo local
- `.env.example` - Plantilla de variables
- `README.md` - Documentación principal
- `CONTRIBUTING.md` - Guía de contribución
- Archivos en `backend/`, `frontend/`, `nginx/`, `monitoring/`, `scripts/`

---

## 2. PLAN DE LIMPIEZA

### Fase 1: Identificar y Documentar
```bash
# Contar archivos basura
find . -maxdepth 1 -name "*.py" -o -name "*.md" | wc -l
# Resultado esperado: ~500+ archivos

# Listar solo archivos de prueba
find . -maxdepth 1 -name "test_*.py" | wc -l
find . -maxdepth 1 -name "debug_*.py" | wc -l
find . -maxdepth 1 -name "verificar_*.py" | wc -l
```

### Fase 2: Crear .gitignore Mejorado
```
# Archivos de prueba
test_*.py
debug_*.py
verificar_*.py
diagnosticar_*.py
crear_*.py
actualizar_*.py
migracion_*.py
arreglar_*.py
limpiar_*.py
fix_*.py
reparar_*.py
revertir_*.py
simular_*.py
check_*.py
probar_*.py
start_*.py
restart_*.py
restore_*.py
obtener_*.py
insertar_*.py
iniciar_*.py
inicializar_*.py
activar_*.py
borrar_*.py
agregar_*.py
analizar_*.py
arreglo_*.py
capturar_*.py
clean_*.py
consultar_*.py
convertir_*.py
corregir_*.py
demo_*.py
ejecutar_*.py
encontrar_*.py
generar_*.py
importar_*.py
listar_*.py
mostrar_*.py
optimizar_*.py
reset_*.py
simple_*.py
solucion_*.py
start_*.py
test_*.py

# Documentos de proceso
RESUMEN_*.md
ESTADO_*.md
SOLUCION_*.md
PLAN_*.md
ANALISIS_*.md
ARREGLO_*.md
CAMBIOS_*.md
CHECKLIST_*.md
CORRECCION_*.md
CORRECCIONES_*.md
DEBUG_*.md
DEPURACION_*.md
DESPLIEGUE_*.md
DIAGNOSTICO_*.md
DISEÑO_*.md
EJEMPLO_*.md
ELIMINACION_*.md
EMPEZAR_*.md
EMPRESAS_*.md
ESTADISTICAS_*.md
ESTADO_*.md
ESTRATEGIA_*.md
EXITO_*.md
FASE_*.md
FILTRO_*.md
FIX_*.md
FORMATEO_*.md
FORMATO_*.md
FRONTEND_*.md
FUENTES_*.md
FUNCIONALIDAD_*.md
FUNCIONALIDADES_*.md
GITHUB_*.md
GUIA_*.md
HABILITACION_*.md
HACER_*.md
ICONOS_*.md
IMPLEMENTACION_*.md
INDICE_*.md
INICIO_*.md
INSTRUCCIONES_*.md
INTEGRACION_*.md
LIMPIAR_*.md
LIMPIEZA_*.md
LISTO_*.md
LOCALIDADES_*.md
MANUAL_*.md
MAPA_*.md
MEJORA_*.md
MEJORAS_*.md
MODELO_*.md
MODULO_*.md
MONGODB_*.md
NIVELES_*.md
OPCIONES_*.md
OPTIMIZACION_*.md
PAGINADOR_*.md
PARA_*.md
PERFORMANCE_*.md
PLANTILLA_*.md
PROPUESTA_*.md
PROTECCION_*.md
PROTOCOLO_*.md
PRUEBA_*.md
PRUEBAS_*.md
QUE_*.md
QUICK_*.md
README_*.md
REBUILD_*.md
RECOMENDACION_*.md
REEMPLAZAR_*.md
REESTRUCTURACION_*.md
REFACTORIZACION_*.md
REINICIAR_*.md
REPARACION_*.md
REPORTE_*.md
RESOLUCION_*.md
RESULTADO_*.md
REVISION_*.md
RUTAS_*.md
SCRIPT_*.md
SEDES_*.md
SIMPLIFICACION_*.md
SINCRONIZACION_*.md
SISTEMA_*.md
SUGERENCIAS_*.md
TABLA_*.md
TASK_*.md
VALIDACION_*.md
VEHICULOS_*.md
VERIFICACION_*.md
VERIFICAR_*.md
VISTA_*.md

# Archivos temporales
*.tmp
*.bak
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Datos de prueba
datos_prueba_*.json
datos_prueba_*.xlsx
plantilla_*.xlsx
test_*.xlsx
test_*.csv
test_*.json
reporte_*.json

# Backups
backup_*/
*.backup

# Archivos sin extensión sospechosos
curl
er.name
```

### Fase 3: Eliminar Archivos
```bash
# Script de limpieza seguro
#!/bin/bash

# Crear backup antes de limpiar
tar -czf backup_limpieza_$(date +%Y%m%d_%H%M%S).tar.gz \
  test_*.py debug_*.py verificar_*.py diagnosticar_*.py \
  RESUMEN_*.md ESTADO_*.md SOLUCION_*.md 2>/dev/null

# Eliminar archivos de prueba
rm -f test_*.py debug_*.py verificar_*.py diagnosticar_*.py
rm -f crear_*.py actualizar_*.py migracion_*.py arreglar_*.py
rm -f limpiar_*.py fix_*.py reparar_*.py revertir_*.py
rm -f simular_*.py check_*.py probar_*.py start_*.py
rm -f restart_*.py restore_*.py obtener_*.py insertar_*.py
rm -f iniciar_*.py inicializar_*.py activar_*.py borrar_*.py
rm -f agregar_*.py analizar_*.py arreglo_*.py capturar_*.py
rm -f clean_*.py consultar_*.py convertir_*.py corregir_*.py
rm -f demo_*.py ejecutar_*.py encontrar_*.py generar_*.py
rm -f importar_*.py listar_*.py mostrar_*.py optimizar_*.py
rm -f reset_*.py simple_*.py solucion_*.py

# Eliminar documentos de proceso
rm -f RESUMEN_*.md ESTADO_*.md SOLUCION_*.md PLAN_*.md
rm -f ANALISIS_*.md ARREGLO_*.md CAMBIOS_*.md CHECKLIST_*.md
rm -f CORRECCION_*.md CORRECCIONES_*.md DEBUG_*.md DEPURACION_*.md
rm -f DESPLIEGUE_*.md DIAGNOSTICO_*.md DISEÑO_*.md EJEMPLO_*.md
rm -f ELIMINACION_*.md EMPEZAR_*.md EMPRESAS_*.md ESTADISTICAS_*.md
rm -f ESTRATEGIA_*.md EXITO_*.md FASE_*.md FILTRO_*.md FIX_*.md
rm -f FORMATEO_*.md FORMATO_*.md FRONTEND_*.md FUENTES_*.md
rm -f FUNCIONALIDAD_*.md FUNCIONALIDADES_*.md GITHUB_*.md GUIA_*.md
rm -f HABILITACION_*.md HACER_*.md ICONOS_*.md IMPLEMENTACION_*.md
rm -f INDICE_*.md INICIO_*.md INSTRUCCIONES_*.md INTEGRACION_*.md
rm -f LIMPIAR_*.md LIMPIEZA_*.md LISTO_*.md LOCALIDADES_*.md
rm -f MANUAL_*.md MAPA_*.md MEJORA_*.md MEJORAS_*.md MODELO_*.md
rm -f MODULO_*.md MONGODB_*.md NIVELES_*.md OPCIONES_*.md
rm -f OPTIMIZACION_*.md PAGINADOR_*.md PARA_*.md PERFORMANCE_*.md
rm -f PLANTILLA_*.md PROPUESTA_*.md PROTECCION_*.md PROTOCOLO_*.md
rm -f PRUEBA_*.md PRUEBAS_*.md QUE_*.md QUICK_*.md README_*.md
rm -f REBUILD_*.md RECOMENDACION_*.md REEMPLAZAR_*.md REESTRUCTURACION_*.md
rm -f REFACTORIZACION_*.md REINICIAR_*.md REPARACION_*.md REPORTE_*.md
rm -f RESOLUCION_*.md RESULTADO_*.md REVISION_*.md RUTAS_*.md
rm -f SCRIPT_*.md SEDES_*.md SIMPLIFICACION_*.md SINCRONIZACION_*.md
rm -f SISTEMA_*.md SUGERENCIAS_*.md TABLA_*.md TASK_*.md
rm -f VALIDACION_*.md VEHICULOS_*.md VERIFICACION_*.md VERIFICAR_*.md
rm -f VISTA_*.md

# Eliminar datos de prueba
rm -f datos_prueba_*.json datos_prueba_*.xlsx
rm -f plantilla_*.xlsx test_*.xlsx test_*.csv test_*.json
rm -f reporte_*.json

# Eliminar archivos temporales
rm -f *.tmp *.bak *.swp *.swo *~
rm -f curl er.name

# Limpiar backups antiguos
rm -rf backup_resoluciones_componentes/
rm -rf backup_templates_problematicos/

# Limpiar caché
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null

echo "Limpieza completada"
```

---

## 3. ESTRUCTURA DOCKER RECOMENDADA

```
proyecto/
├── docker/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── entrypoint.sh
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── nginx.conf
│   └── mongodb/
│       └── Dockerfile (opcional)
├── docker-compose.yml (producción)
├── docker-compose.dev.yml (desarrollo)
├── docker-compose.local.yml (local)
├── backend/
├── frontend/
├── nginx/
├── scripts/
└── docs/
```

---

## 4. DOCKERFILES

### Backend Dockerfile
```dockerfile
# docker/backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY backend/requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY backend/ .

# Crear usuario no-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
# docker/frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine

COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/sirret-frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config
```nginx
# docker/frontend/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 5. DOCKER-COMPOSE

### Producción
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: sirret-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DB}
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - sirret-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: sirret-backend
    restart: always
    environment:
      DATABASE_URL: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/${MONGO_DB}
      ENVIRONMENT: production
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - sirret-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: sirret-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - sirret-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  mongodb_data:
  mongodb_config:

networks:
  sirret-network:
    driver: bridge
```

### Desarrollo
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: sirret-mongodb-dev
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: sirret_dev
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data_dev:/data/db
    networks:
      - sirret-network-dev

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: sirret-backend-dev
    environment:
      DATABASE_URL: mongodb://admin:admin123@mongodb:27017/sirret_dev
      ENVIRONMENT: development
      DEBUG: "true"
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    depends_on:
      - mongodb
    networks:
      - sirret-network-dev
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: sirret-frontend-dev
    ports:
      - "4200:80"
    depends_on:
      - backend
    networks:
      - sirret-network-dev

volumes:
  mongodb_data_dev:

networks:
  sirret-network-dev:
    driver: bridge
```

---

## 6. VARIABLES DE ENTORNO

### .env.production
```
# MongoDB
MONGO_USER=sirret_user
MONGO_PASSWORD=<strong_password>
MONGO_DB=sirret_prod

# Backend
SECRET_KEY=<generate_with_openssl>
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production

# Frontend
API_URL=https://api.yourdomain.com
```

### .env.development
```
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=admin123
MONGO_DB=sirret_dev

# Backend
SECRET_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:4200,http://localhost:3000
ENVIRONMENT=development

# Frontend
API_URL=http://localhost:8000
```

---

## 7. SCRIPTS DE DEPLOYMENT

### Deploy Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENV=${1:-production}
echo "Deploying to $ENV..."

# Validar .env
if [ ! -f ".env.$ENV" ]; then
    echo "Error: .env.$ENV not found"
    exit 1
fi

# Cargar variables
export $(cat .env.$ENV | grep -v '#' | xargs)

# Build images
echo "Building Docker images..."
docker-compose -f docker-compose.yml build

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Stop old containers
echo "Stopping old containers..."
docker-compose -f docker-compose.yml down

# Start new containers
echo "Starting new containers..."
docker-compose -f docker-compose.yml up -d

# Wait for services
echo "Waiting for services to be healthy..."
sleep 10

# Run migrations if needed
echo "Running migrations..."
docker-compose -f docker-compose.yml exec -T backend python -m alembic upgrade head

echo "Deployment completed successfully!"
```

### Local Development Script
```bash
#!/bin/bash
# scripts/dev.sh

echo "Starting development environment..."

# Build images
docker-compose -f docker-compose.dev.yml build

# Start services
docker-compose -f docker-compose.dev.yml up

# Cleanup on exit
trap "docker-compose -f docker-compose.dev.yml down" EXIT
```

---

## 8. CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear estructura de carpetas `docker/`
- [ ] Crear Dockerfiles para backend y frontend
- [ ] Crear nginx.conf
- [ ] Crear docker-compose.yml (producción)
- [ ] Crear docker-compose.dev.yml (desarrollo)
- [ ] Crear .dockerignore files
- [ ] Crear .env.example files
- [ ] Crear scripts de deployment
- [ ] Actualizar .gitignore
- [ ] Limpiar código basura
- [ ] Documentar en README
- [ ] Probar en desarrollo local
- [ ] Probar en staging
- [ ] Deploy a producción

---

## 9. COMANDOS ÚTILES

```bash
# Desarrollo
./scripts/dev.sh

# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Limpiar todo
docker-compose down -v
docker system prune -a

# Deploy
./scripts/deploy.sh production

# Acceder a contenedor
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## 10. PRÓXIMOS PASOS

1. **Inmediato**: Ejecutar limpieza de código basura
2. **Corto plazo**: Implementar estructura Docker
3. **Mediano plazo**: Configurar CI/CD (GitHub Actions)
4. **Largo plazo**: Kubernetes deployment
