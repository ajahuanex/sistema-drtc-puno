# 🚀 Deploy Backend Local en Docker

## 1. VERIFICAR MONGODB CORRIENDO

```bash
# Ver contenedores corriendo
docker ps

# Buscar MongoDB
docker ps | grep mongo

# Ejemplo de salida:
# CONTAINER ID   IMAGE     COMMAND                  PORTS
# abc123def456   mongo:7   "docker-entrypoint..."   27017->27017/tcp
```

---

## 2. OBTENER INFORMACIÓN DE MONGODB

```bash
# Ver IP del contenedor MongoDB
docker inspect <container_id> | grep IPAddress

# O si está en una red específica
docker network inspect <network_name>

# Típicamente será algo como: 172.17.0.2
```

---

## 3. CREAR ARCHIVO .env.backend

```bash
# Copiar plantilla
cp .env.backend.example .env.backend

# Editar
nano .env.backend
```

### Contenido de .env.backend para desarrollo local:

```env
# MongoDB Connection (ajusta según tu setup)
# Opción 1: Si MongoDB está en Docker en la misma red
DATABASE_URL=mongodb://admin:admin123@mongodb:27017/sirret_dev

# Opción 2: Si MongoDB está en Docker pero accesible por IP
DATABASE_URL=mongodb://admin:admin123@172.17.0.2:27017/sirret_dev

# Opción 3: Si MongoDB está en localhost (sin Docker)
DATABASE_URL=mongodb://admin:admin123@localhost:27017/sirret_dev

# Security
SECRET_KEY=dev-secret-key-for-local-testing-min-32-chars

# CORS (permite frontend local)
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://127.0.0.1:4200

# Application
ENVIRONMENT=development
LOG_LEVEL=debug
DEBUG=true

# API
API_HOST=0.0.0.0
API_PORT=8000
```

---

## 4. CREAR docker-compose.backend.local.yml

```bash
cat > docker-compose.backend.local.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: sirret-backend-dev
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      ENVIRONMENT: development
      LOG_LEVEL: debug
      DEBUG: "true"
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
      - ./backend:/app
      - ./backend/logs:/app/logs

networks:
  sirret-network:
    driver: bridge
EOF
```

---

## 5. OPCIÓN A: DEPLOY CON SCRIPT

```bash
# Hacer script ejecutable
chmod +x scripts/deploy-backend.sh

# Ejecutar
./scripts/deploy-backend.sh production
```

---

## 6. OPCIÓN B: DEPLOY MANUAL

### Paso 1: Build

```bash
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .
```

### Paso 2: Run

```bash
# Cargar variables de entorno
export $(cat .env.backend | grep -v '#' | xargs)

# Ejecutar
docker-compose -f docker-compose.backend.local.yml up -d
```

### Paso 3: Verificar

```bash
# Ver estado
docker-compose -f docker-compose.backend.local.yml ps

# Ver logs
docker-compose -f docker-compose.backend.local.yml logs -f backend

# Health check
curl http://localhost:8000/health
```

---

## 7. VERIFICAR CONEXIÓN A MONGODB

```bash
# Acceder al contenedor
docker-compose -f docker-compose.backend.local.yml exec backend bash

# Dentro del contenedor, probar conexión
python -c "
from pymongo import MongoClient
try:
    client = MongoClient('$DATABASE_URL')
    client.admin.command('ping')
    print('✅ MongoDB conectado correctamente')
except Exception as e:
    print(f'❌ Error: {e}')
"

# Salir
exit
```

---

## 8. COMANDOS ÚTILES

### Ver Logs

```bash
# Logs en tiempo real
docker-compose -f docker-compose.backend.local.yml logs -f backend

# Últimas 100 líneas
docker-compose -f docker-compose.backend.local.yml logs --tail=100 backend

# Logs de un servicio específico
docker-compose -f docker-compose.backend.local.yml logs backend
```

### Acceso a Shell

```bash
# Bash en el contenedor
docker-compose -f docker-compose.backend.local.yml exec backend bash

# Python interactivo
docker-compose -f docker-compose.backend.local.yml exec backend python
```

### Reiniciar

```bash
# Reiniciar backend
docker-compose -f docker-compose.backend.local.yml restart backend

# Detener
docker-compose -f docker-compose.backend.local.yml down

# Detener y limpiar volúmenes
docker-compose -f docker-compose.backend.local.yml down -v
```

### Rebuild

```bash
# Rebuild sin caché
docker build --no-cache -f docker/backend/Dockerfile -t sirret-backend:latest .

# Rebuild y run
docker-compose -f docker-compose.backend.local.yml up -d --build
```

---

## 9. PROBAR API

```bash
# Health check
curl http://localhost:8000/health

# Ver documentación API
curl http://localhost:8000/docs

# Ejemplo de request
curl -X GET http://localhost:8000/api/rutas \
  -H "Content-Type: application/json"
```

---

## 10. TROUBLESHOOTING

### Error: "Cannot connect to MongoDB"

```bash
# Verificar que MongoDB está corriendo
docker ps | grep mongo

# Verificar IP de MongoDB
docker inspect <mongo_container_id> | grep IPAddress

# Actualizar DATABASE_URL en .env.backend
nano .env.backend

# Reiniciar backend
docker-compose -f docker-compose.backend.local.yml restart backend
```

### Error: "Port 8000 already in use"

```bash
# Ver qué está usando el puerto
lsof -i :8000

# O con netstat
netstat -tulpn | grep 8000

# Cambiar puerto en docker-compose.backend.local.yml
# Cambiar: "8000:8000" a "8001:8000"
```

### Error: "CORS error"

```bash
# Verificar CORS_ORIGINS en .env.backend
cat .env.backend | grep CORS

# Debe incluir la URL del frontend
# Ejemplo: http://localhost:4200
```

### Backend no responde

```bash
# Ver logs detallados
docker-compose -f docker-compose.backend.local.yml logs backend

# Verificar health
docker-compose -f docker-compose.backend.local.yml exec backend curl http://localhost:8000/health

# Reiniciar
docker-compose -f docker-compose.backend.local.yml restart backend
```

---

## 11. CHECKLIST

- [ ] MongoDB está corriendo en Docker
- [ ] Obtuve la IP/host de MongoDB
- [ ] Creé .env.backend con DATABASE_URL correcto
- [ ] DATABASE_URL apunta a MongoDB correctamente
- [ ] CORS_ORIGINS incluye localhost:4200 (para frontend)
- [ ] Backend builds sin errores
- [ ] Backend inicia correctamente
- [ ] Health check responde (curl http://localhost:8000/health)
- [ ] Puedo acceder a /docs (documentación API)
- [ ] Logs muestran que está conectado a MongoDB

---

## 12. PRÓXIMOS PASOS

Una vez que el backend esté corriendo:

1. **Verificar endpoints**: `curl http://localhost:8000/docs`
2. **Probar conexión**: `curl http://localhost:8000/health`
3. **Ver logs**: `docker-compose -f docker-compose.backend.local.yml logs -f backend`
4. **Cuando esté listo**: Iniciar con frontend

---

## 📝 NOTAS IMPORTANTES

- El backend estará disponible en: `http://localhost:8000`
- La documentación interactiva en: `http://localhost:8000/docs`
- Los logs se guardan en: `./backend/logs/`
- La BD está en: `mongodb://admin:admin123@<host>:27017/sirret_dev`

---

**¡Listo para desplegar el backend! 🚀**
