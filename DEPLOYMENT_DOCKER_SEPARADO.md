# Deployment Docker Separado - Backend y Frontend

## 1. ESTRUCTURA DE DEPLOYMENT

```
Producción:
├── MongoDB (Ya desplegado)
├── Backend Docker (Puerto 8000)
└── Frontend Docker (Puerto 80/443)

Desarrollo Local:
├── MongoDB Docker (Puerto 27017)
├── Backend Docker (Puerto 8000)
└── Frontend Docker (Puerto 4200)
```

---

## 2. VARIABLES DE ENTORNO

### Backend (.env.backend)
```env
# Base de datos
DATABASE_URL=mongodb://user:password@mongodb-host:27017/sirret_prod
MONGO_USER=sirret_user
MONGO_PASSWORD=your_secure_password
MONGO_DB=sirret_prod

# Seguridad
SECRET_KEY=your-secret-key-here-min-32-chars
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Aplicación
ENVIRONMENT=production
LOG_LEVEL=info
DEBUG=false

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (.env.frontend)
```env
# API Backend
API_URL=https://api.yourdomain.com
API_TIMEOUT=30000

# Aplicación
ENVIRONMENT=production
LOG_LEVEL=info
```

---

## 3. DOCKER-COMPOSE SEPARADOS

### Backend Only (docker-compose.backend.yml)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: sirret-backend
    restart: always
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      ENVIRONMENT: production
      LOG_LEVEL: info
    ports:
      - "8000:8000"
    networks:
      - sirret-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    volumes:
      - ./backend/logs:/app/logs

networks:
  sirret-network:
    driver: bridge
```

### Frontend Only (docker-compose.frontend.yml)
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      args:
        API_URL: ${API_URL}
    container_name: sirret-frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    networks:
      - sirret-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./docker/frontend/nginx.conf:/etc/nginx/nginx.conf:ro

networks:
  sirret-network:
    driver: bridge
```

---

## 4. DOCKERFILES MEJORADOS

### Backend Dockerfile (docker/backend/Dockerfile)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
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
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (docker/frontend/Dockerfile)
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

# Build con variables de entorno
ARG API_URL=http://localhost:8000
ENV API_URL=$API_URL

RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/sirret-frontend /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. SCRIPTS DE DEPLOYMENT

### Deploy Backend (scripts/deploy-backend.sh)
```bash
#!/bin/bash
set -e

ENV=${1:-production}
echo "🚀 Deploying Backend to $ENV..."

# Validar .env
if [ ! -f ".env.backend" ]; then
    echo "❌ Error: .env.backend not found"
    exit 1
fi

# Cargar variables
export $(cat .env.backend | grep -v '#' | xargs)

# Build image
echo "🔨 Building backend image..."
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

# Stop old container
echo "⏹️  Stopping old backend container..."
docker-compose -f docker-compose.backend.yml down 2>/dev/null || true

# Start new container
echo "▶️  Starting new backend container..."
docker-compose -f docker-compose.backend.yml up -d

# Wait for health
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Check health
if docker-compose -f docker-compose.backend.yml exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend deployed successfully!"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.backend.yml logs backend
    exit 1
fi
```

### Deploy Frontend (scripts/deploy-frontend.sh)
```bash
#!/bin/bash
set -e

ENV=${1:-production}
echo "🚀 Deploying Frontend to $ENV..."

# Validar .env
if [ ! -f ".env.frontend" ]; then
    echo "❌ Error: .env.frontend not found"
    exit 1
fi

# Cargar variables
export $(cat .env.frontend | grep -v '#' | xargs)

# Build image
echo "🔨 Building frontend image..."
docker build \
    -f docker/frontend/Dockerfile \
    --build-arg API_URL=$API_URL \
    -t sirret-frontend:latest .

# Stop old container
echo "⏹️  Stopping old frontend container..."
docker-compose -f docker-compose.frontend.yml down 2>/dev/null || true

# Start new container
echo "▶️  Starting new frontend container..."
docker-compose -f docker-compose.frontend.yml up -d

# Wait for health
echo "⏳ Waiting for frontend to be healthy..."
sleep 5

# Check health
if docker-compose -f docker-compose.frontend.yml exec -T frontend wget --quiet --tries=1 --spider http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend deployed successfully!"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.frontend.yml logs frontend
    exit 1
fi
```

### Deploy All (scripts/deploy-all.sh)
```bash
#!/bin/bash
set -e

echo "🚀 Deploying SIRRET System..."
echo ""

# Deploy Backend
echo "📦 Step 1: Deploying Backend..."
./scripts/deploy-backend.sh production
echo ""

# Deploy Frontend
echo "📦 Step 2: Deploying Frontend..."
./scripts/deploy-frontend.sh production
echo ""

echo "✅ Complete deployment finished!"
echo ""
echo "📊 System Status:"
docker ps --filter "name=sirret" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 6. GUÍA DE DEPLOYMENT PASO A PASO

### Paso 1: Preparar Archivos de Configuración

```bash
# Crear archivos de entorno
cp .env.example .env.backend
cp .env.example .env.frontend

# Editar con valores reales
nano .env.backend
nano .env.frontend
```

### Paso 2: Hacer Scripts Ejecutables

```bash
chmod +x scripts/deploy-backend.sh
chmod +x scripts/deploy-frontend.sh
chmod +x scripts/deploy-all.sh
```

### Paso 3: Deploy Backend

```bash
# Opción 1: Deploy individual
./scripts/deploy-backend.sh production

# Opción 2: Manual
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d

# Verificar
docker-compose -f docker-compose.backend.yml logs -f backend
docker-compose -f docker-compose.backend.yml ps
```

### Paso 4: Deploy Frontend

```bash
# Opción 1: Deploy individual
./scripts/deploy-frontend.sh production

# Opción 2: Manual
docker-compose -f docker-compose.frontend.yml build
docker-compose -f docker-compose.frontend.yml up -d

# Verificar
docker-compose -f docker-compose.frontend.yml logs -f frontend
docker-compose -f docker-compose.frontend.yml ps
```

### Paso 5: Deploy Completo

```bash
./scripts/deploy-all.sh production
```

---

## 7. COMANDOS ÚTILES

### Backend

```bash
# Build
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

# Run
docker-compose -f docker-compose.backend.yml up -d

# Logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Stop
docker-compose -f docker-compose.backend.yml down

# Restart
docker-compose -f docker-compose.backend.yml restart backend

# Shell
docker-compose -f docker-compose.backend.yml exec backend bash

# Health check
docker-compose -f docker-compose.backend.yml exec backend curl http://localhost:8000/health
```

### Frontend

```bash
# Build
docker build -f docker/frontend/Dockerfile -t sirret-frontend:latest .

# Run
docker-compose -f docker-compose.frontend.yml up -d

# Logs
docker-compose -f docker-compose.frontend.yml logs -f frontend

# Stop
docker-compose -f docker-compose.frontend.yml down

# Restart
docker-compose -f docker-compose.frontend.yml restart frontend

# Shell
docker-compose -f docker-compose.frontend.yml exec frontend sh

# Health check
docker-compose -f docker-compose.frontend.yml exec frontend wget --quiet --tries=1 --spider http://localhost/health
```

### Sistema Completo

```bash
# Ver todos los contenedores
docker ps --filter "name=sirret"

# Ver logs de todos
docker-compose -f docker-compose.backend.yml logs -f &
docker-compose -f docker-compose.frontend.yml logs -f &

# Detener todo
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.frontend.yml down

# Limpiar todo
docker system prune -a
```

---

## 8. MONITOREO Y MANTENIMIENTO

### Ver Estado

```bash
# Status
docker-compose -f docker-compose.backend.yml ps
docker-compose -f docker-compose.frontend.yml ps

# Estadísticas
docker stats sirret-backend sirret-frontend

# Logs en tiempo real
docker-compose -f docker-compose.backend.yml logs -f --tail=100 backend
docker-compose -f docker-compose.frontend.yml logs -f --tail=100 frontend
```

### Actualizar Backend

```bash
# 1. Hacer cambios en código
# 2. Commit a git
git add .
git commit -m "fix: actualización backend"
git push origin master

# 3. Pull en servidor
git pull origin master

# 4. Rebuild y deploy
./scripts/deploy-backend.sh production
```

### Actualizar Frontend

```bash
# 1. Hacer cambios en código
# 2. Commit a git
git add .
git commit -m "feat: actualización frontend"
git push origin master

# 3. Pull en servidor
git pull origin master

# 4. Rebuild y deploy
./scripts/deploy-frontend.sh production
```

---

## 9. TROUBLESHOOTING

### Backend no inicia

```bash
# Ver logs
docker-compose -f docker-compose.backend.yml logs backend

# Verificar conexión a BD
docker-compose -f docker-compose.backend.yml exec backend \
  python -c "from pymongo import MongoClient; MongoClient('$DATABASE_URL')"

# Reiniciar
docker-compose -f docker-compose.backend.yml restart backend
```

### Frontend no carga

```bash
# Ver logs
docker-compose -f docker-compose.frontend.yml logs frontend

# Verificar nginx
docker-compose -f docker-compose.frontend.yml exec frontend nginx -t

# Reiniciar
docker-compose -f docker-compose.frontend.yml restart frontend
```

### Problemas de conexión

```bash
# Verificar red
docker network ls
docker network inspect sirret-network

# Verificar DNS
docker-compose -f docker-compose.backend.yml exec backend nslookup mongodb-host

# Ping entre contenedores
docker-compose -f docker-compose.backend.yml exec backend ping sirret-frontend
```

---

## 10. CHECKLIST DE DEPLOYMENT

- [ ] Archivos .env.backend y .env.frontend configurados
- [ ] Scripts de deployment tienen permisos de ejecución
- [ ] MongoDB está accesible desde los contenedores
- [ ] Backend builds correctamente
- [ ] Backend health check pasa
- [ ] Frontend builds correctamente
- [ ] Frontend health check pasa
- [ ] API_URL en frontend apunta al backend correcto
- [ ] CORS configurado correctamente en backend
- [ ] Logs se guardan correctamente
- [ ] Backups configurados
- [ ] Monitoreo activo

---

## 11. PRÓXIMOS PASOS

1. **Inmediato**: Crear archivos .env y scripts
2. **Corto plazo**: Deploy backend y frontend
3. **Mediano plazo**: Configurar SSL/TLS con Let's Encrypt
4. **Largo plazo**: Kubernetes deployment
