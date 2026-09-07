# 🚀 Guía Rápida - Deployment Docker Separado

## Estructura Actual

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │   MongoDB        │  │   Backend        │            │
│  │  (Ya Desplegado) │  │   Docker         │            │
│  │  Host:Port       │  │   Puerto 8000    │            │
│  └──────────────────┘  └──────────────────┘            │
│         ▲                      ▲                        │
│         │                      │                        │
│         └──────────────────────┘                        │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │   Frontend Docker                    │              │
│  │   Puerto 80/443                      │              │
│  │   (Nginx + Angular)                  │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ PREPARACIÓN INICIAL

### Paso 1: Crear Archivos de Configuración

```bash
# Copiar plantillas
cp .env.backend.example .env.backend
cp .env.frontend.example .env.frontend

# Editar con valores reales
nano .env.backend
nano .env.frontend
```

### Paso 2: Configurar Variables

**Para .env.backend:**
```env
DATABASE_URL=mongodb://user:password@your-mongodb-host:27017/sirret_prod
SECRET_KEY=your-secret-key-min-32-chars
CORS_ORIGINS=https://yourdomain.com
```

**Para .env.frontend:**
```env
API_URL=https://api.yourdomain.com
```

### Paso 3: Hacer Scripts Ejecutables

```bash
chmod +x scripts/deploy-backend.sh
chmod +x scripts/deploy-frontend.sh
chmod +x scripts/deploy-all.sh
```

---

## 2️⃣ DEPLOYMENT BACKEND

### Opción A: Script Automático (Recomendado)

```bash
./scripts/deploy-backend.sh production
```

### Opción B: Manual

```bash
# Build
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

# Run
docker-compose -f docker-compose.backend.yml up -d

# Verificar
docker-compose -f docker-compose.backend.yml ps
docker-compose -f docker-compose.backend.yml logs -f backend
```

### Verificar Backend

```bash
# Health check
curl http://localhost:8000/health

# Logs
docker-compose -f docker-compose.backend.yml logs backend

# Acceso a shell
docker-compose -f docker-compose.backend.yml exec backend bash
```

---

## 3️⃣ DEPLOYMENT FRONTEND

### Opción A: Script Automático (Recomendado)

```bash
./scripts/deploy-frontend.sh production
```

### Opción B: Manual

```bash
# Build
docker build -f docker/frontend/Dockerfile -t sirret-frontend:latest .

# Run
docker-compose -f docker-compose.frontend.yml up -d

# Verificar
docker-compose -f docker-compose.frontend.yml ps
docker-compose -f docker-compose.frontend.yml logs -f frontend
```

### Verificar Frontend

```bash
# Health check
curl http://localhost/health

# Logs
docker-compose -f docker-compose.frontend.yml logs frontend

# Acceso a shell
docker-compose -f docker-compose.frontend.yml exec frontend sh
```

---

## 4️⃣ DEPLOYMENT COMPLETO

```bash
# Deploy todo de una vez
./scripts/deploy-all.sh production
```

---

## 5️⃣ COMANDOS ÚTILES

### Backend

```bash
# Ver estado
docker-compose -f docker-compose.backend.yml ps

# Ver logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Reiniciar
docker-compose -f docker-compose.backend.yml restart backend

# Detener
docker-compose -f docker-compose.backend.yml down

# Acceso a shell
docker-compose -f docker-compose.backend.yml exec backend bash

# Health check
docker-compose -f docker-compose.backend.yml exec backend curl http://localhost:8000/health
```

### Frontend

```bash
# Ver estado
docker-compose -f docker-compose.frontend.yml ps

# Ver logs
docker-compose -f docker-compose.frontend.yml logs -f frontend

# Reiniciar
docker-compose -f docker-compose.frontend.yml restart frontend

# Detener
docker-compose -f docker-compose.frontend.yml down

# Acceso a shell
docker-compose -f docker-compose.frontend.yml exec frontend sh

# Health check
docker-compose -f docker-compose.frontend.yml exec frontend wget --quiet --tries=1 --spider http://localhost/health
```

### Sistema Completo

```bash
# Ver todos los contenedores
docker ps --filter "name=sirret"

# Ver estadísticas
docker stats sirret-backend sirret-frontend

# Limpiar todo
docker system prune -a
```

---

## 6️⃣ ACTUALIZAR CÓDIGO

### Actualizar Backend

```bash
# 1. Hacer cambios en código
# 2. Commit y push
git add .
git commit -m "fix: descripción del cambio"
git push origin master

# 3. En servidor: pull y redeploy
git pull origin master
./scripts/deploy-backend.sh production
```

### Actualizar Frontend

```bash
# 1. Hacer cambios en código
# 2. Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin master

# 3. En servidor: pull y redeploy
git pull origin master
./scripts/deploy-frontend.sh production
```

---

## 7️⃣ TROUBLESHOOTING

### Backend no inicia

```bash
# Ver logs detallados
docker-compose -f docker-compose.backend.yml logs backend

# Verificar conexión a BD
docker-compose -f docker-compose.backend.yml exec backend \
  python -c "from pymongo import MongoClient; print('BD OK')"

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

# Ping entre contenedores
docker-compose -f docker-compose.backend.yml exec backend \
  ping sirret-frontend
```

---

## 8️⃣ MONITOREO

### Ver Estado en Tiempo Real

```bash
# Terminal 1: Backend logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Terminal 2: Frontend logs
docker-compose -f docker-compose.frontend.yml logs -f frontend

# Terminal 3: Estadísticas
watch -n 1 'docker stats sirret-backend sirret-frontend'
```

### Alertas Importantes

```bash
# Si backend no responde
docker-compose -f docker-compose.backend.yml restart backend

# Si frontend no carga
docker-compose -f docker-compose.frontend.yml restart frontend

# Si hay problemas de memoria
docker system prune -a
```

---

## 9️⃣ CHECKLIST DE DEPLOYMENT

- [ ] .env.backend configurado con DATABASE_URL correcto
- [ ] .env.frontend configurado con API_URL correcto
- [ ] Scripts tienen permisos de ejecución (chmod +x)
- [ ] MongoDB está accesible desde los contenedores
- [ ] Backend builds sin errores
- [ ] Backend health check pasa (curl http://localhost:8000/health)
- [ ] Frontend builds sin errores
- [ ] Frontend health check pasa (curl http://localhost/health)
- [ ] API_URL en frontend apunta al backend correcto
- [ ] CORS configurado en backend
- [ ] Logs se guardan correctamente
- [ ] Contenedores reinician automáticamente

---

## 🔟 ACCESO A SERVICIOS

```
Backend API:     http://localhost:8000
Frontend:        http://localhost
MongoDB:         mongodb://user:pass@host:27017/sirret_prod

API Health:      http://localhost:8000/health
Frontend Health: http://localhost/health
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, ver: `DEPLOYMENT_DOCKER_SEPARADO.md`

---

## 🆘 SOPORTE RÁPIDO

```bash
# Problema: Backend no inicia
→ docker-compose -f docker-compose.backend.yml logs backend

# Problema: Frontend no carga
→ docker-compose -f docker-compose.frontend.yml logs frontend

# Problema: Conexión rechazada
→ docker ps --filter "name=sirret"

# Problema: Cambios no se ven
→ git pull origin master && ./scripts/deploy-all.sh production
```

---

**¡Listo para deployar! 🚀**
