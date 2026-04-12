# 🚀 Backend Deployment en Remoto - Paso a Paso

## REQUISITOS PREVIOS

En tu servidor remoto necesitas:
- Docker instalado
- Docker Compose instalado
- Git instalado
- MongoDB ya corriendo (con usuario y contraseña)

---

## PASO 1: Conectarse al Servidor Remoto

```bash
# Desde tu máquina local
ssh usuario@tu-servidor-ip

# Ejemplo:
ssh root@192.168.1.100
```

---

## PASO 2: Clonar el Repositorio

```bash
# En el servidor remoto
cd /home/usuario  # o donde quieras

git clone https://github.com/ajahuanex/sistema-drtc-puno.git

cd sistema-drtc-puno
```

---

## PASO 3: Crear Archivo de Configuración

```bash
# En el servidor remoto, crear archivo .env.backend
nano .env.backend
```

**Pegar esto (reemplaza los valores):**

```env
DATABASE_URL=mongodb://sirret_user:tu_password@localhost:27017/sirret_prod
SECRET_KEY=tu-clave-secreta-aqui-minimo-32-caracteres
CORS_ORIGINS=https://tu-dominio.com
ENVIRONMENT=production
LOG_LEVEL=info
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000
```

**Guardar:** Presiona `Ctrl+X`, luego `Y`, luego `Enter`

---

## PASO 4: Verificar Conexión a MongoDB

```bash
# En el servidor remoto, verificar que MongoDB está corriendo
docker ps | grep mongo

# Debería mostrar algo como:
# mongo-container    mongo:7.0    Up 2 days
```

Si no ves MongoDB, necesitas desplegarlo primero.

---

## PASO 5: Hacer Script Ejecutable

```bash
# En el servidor remoto
chmod +x scripts/deploy-backend.sh
```

---

## PASO 6: Desplegar Backend

```bash
# En el servidor remoto
./scripts/deploy-backend.sh production
```

**Esto hará:**
1. Build de la imagen Docker
2. Detener contenedor anterior (si existe)
3. Iniciar nuevo contenedor
4. Verificar que esté saludable

---

## PASO 7: Verificar que Funciona

```bash
# Ver si el contenedor está corriendo
docker ps | grep sirret-backend

# Ver logs
docker-compose -f docker-compose.backend.yml logs -f backend

# Probar que responde
curl http://localhost:8000/health

# Debería responder algo como:
# {"status":"ok"}
```

---

## PASO 8: Acceder desde Afuera

Si quieres acceder desde tu máquina local:

```bash
# Desde tu máquina local
curl http://tu-servidor-ip:8000/health

# Ejemplo:
curl http://192.168.1.100:8000/health
```

---

## ✅ LISTO

El backend está corriendo en:
- **URL**: `http://tu-servidor-ip:8000`
- **Health Check**: `http://tu-servidor-ip:8000/health`

---

## 🔧 COMANDOS ÚTILES DESPUÉS

### Ver estado
```bash
docker-compose -f docker-compose.backend.yml ps
```

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.backend.yml logs -f backend
```

### Reiniciar si hay problemas
```bash
docker-compose -f docker-compose.backend.yml restart backend
```

### Detener
```bash
docker-compose -f docker-compose.backend.yml down
```

### Ver estadísticas
```bash
docker stats sirret-backend
```

---

## 🆘 PROBLEMAS COMUNES

### "Connection refused"
```bash
# Verificar que MongoDB está corriendo
docker ps | grep mongo

# Si no está, necesitas desplegarlo
```

### "Port 8000 already in use"
```bash
# Cambiar puerto en docker-compose.backend.yml
# Cambiar: "8000:8000" por "8001:8000"
```

### "Build failed"
```bash
# Ver logs del build
docker build -f docker/backend/Dockerfile -t sirret-backend:latest .

# Buscar el error en la salida
```

### "Health check failed"
```bash
# Ver logs
docker-compose -f docker-compose.backend.yml logs backend

# Buscar el error
```

---

## 📝 RESUMEN RÁPIDO

```bash
# 1. Conectar
ssh usuario@servidor

# 2. Clonar
git clone https://github.com/ajahuanex/sistema-drtc-puno.git
cd sistema-drtc-puno

# 3. Configurar
nano .env.backend
# (Pegar valores y guardar)

# 4. Desplegar
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh production

# 5. Verificar
curl http://localhost:8000/health
```

---

## 🎯 SIGUIENTE PASO

Una vez que el backend esté corriendo, haremos el frontend.

¿Necesitas ayuda con algún paso?
