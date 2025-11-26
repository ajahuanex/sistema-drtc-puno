# 🚀 Guía de Despliegue Local - Sistema DRTC Puno

Esta guía te ayudará a ejecutar el sistema con **MongoDB en Docker** y **Backend/Frontend en tu PC local**.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Docker Desktop** (para Windows)
- ✅ **Python 3.9+** (para el backend)
- ✅ **Node.js 18+** y **npm** (para el frontend)
- ✅ **Git** (para clonar el repositorio)

## 🎯 Opción 1: Inicio Rápido (Recomendado)

### Iniciar Todo Automáticamente

Simplemente ejecuta el script maestro que iniciará todos los servicios en orden:

```bash
start-all-local.bat
```

Este script:
1. ✅ Inicia MongoDB en Docker
2. ✅ Abre una ventana para el Backend (FastAPI)
3. ✅ Abre una ventana para el Frontend (Angular)

### Detener Todo

```bash
stop-all-local.bat
```

## 🔧 Opción 2: Inicio Manual (Paso a Paso)

Si prefieres más control, puedes iniciar cada servicio manualmente:

### Paso 1: Iniciar MongoDB en Docker

```bash
start-mongodb.bat
```

**Detalles de conexión:**
- Host: `localhost`
- Puerto: `27017`
- Usuario: `admin`
- Password: `admin123`
- Base de datos: `drtc_db`
- URL: `mongodb://admin:admin123@localhost:27017/`

### Paso 2: Iniciar Backend (FastAPI)

En una **nueva terminal**, ejecuta:

```bash
start-backend.bat
```

El backend estará disponible en:
- API: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

### Paso 3: Iniciar Frontend (Angular)

En **otra terminal nueva**, ejecuta:

```bash
start-frontend.bat
```

El frontend estará disponible en:
- Aplicación: http://localhost:4200

## 📊 Verificar el Estado de los Servicios

### Ver logs de MongoDB

```bash
docker logs -f drtc-mongodb-local
```

### Ver contenedores en ejecución

```bash
docker ps
```

### Verificar salud de MongoDB

```bash
docker exec drtc-mongodb-local mongosh --eval "db.adminCommand('ping')"
```

## 🛠️ Comandos Útiles

### MongoDB

```bash
# Detener MongoDB
docker-compose -f docker-compose.db-only.yml down

# Reiniciar MongoDB
docker-compose -f docker-compose.db-only.yml restart

# Ver logs
docker logs -f drtc-mongodb-local

# Acceder a la consola de MongoDB
docker exec -it drtc-mongodb-local mongosh -u admin -p admin123
```

### Backend

```bash
# Activar entorno virtual (si no está activado)
cd backend
venv\Scripts\activate.bat

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones (si las hay)
python -m alembic upgrade head

# Iniciar servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Compilar para producción
npm run build
```

## 🔍 Solución de Problemas

### MongoDB no inicia

1. Verifica que Docker Desktop esté corriendo
2. Verifica que el puerto 27017 no esté ocupado:
   ```bash
   netstat -ano | findstr :27017
   ```
3. Si el puerto está ocupado, detén el proceso o cambia el puerto en `.env`

### Backend no puede conectarse a MongoDB

1. Verifica que MongoDB esté corriendo:
   ```bash
   docker ps
   ```
2. Verifica la URL de conexión en las variables de entorno
3. Revisa los logs del backend para más detalles

### Frontend no puede conectarse al Backend

1. Verifica que el backend esté corriendo en http://localhost:8000
2. Verifica la configuración de CORS en el backend
3. Abre la consola del navegador (F12) para ver errores

### Puerto ya en uso

Si algún puerto está ocupado, puedes cambiarlos:

**MongoDB (puerto 27017):**
- Edita `.env` y cambia `MONGODB_PORT=27018`
- Actualiza la URL de conexión en el backend

**Backend (puerto 8000):**
- Edita `start-backend.bat` y cambia `--port 8001`
- Actualiza `API_URL` en el frontend

**Frontend (puerto 4200):**
- Edita `frontend/package.json` en el script `start`
- Agrega `--port 4201`

## 📁 Estructura de Archivos

```
sistema-drtc-puno/
├── docker-compose.db-only.yml    # Docker Compose solo para MongoDB
├── .env.local.example            # Ejemplo de configuración local
├── start-all-local.bat           # Script maestro (inicia todo)
├── start-mongodb.bat             # Inicia solo MongoDB
├── start-backend.bat             # Inicia solo Backend
├── start-frontend.bat            # Inicia solo Frontend
├── stop-all-local.bat            # Detiene todos los servicios
├── backend/                      # Código del backend (FastAPI)
└── frontend/                     # Código del frontend (Angular)
```

## 🌐 URLs de Acceso

Una vez que todo esté corriendo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:4200 | Aplicación web principal |
| Backend API | http://localhost:8000 | API REST |
| API Docs (Swagger) | http://localhost:8000/docs | Documentación interactiva |
| API Docs (Redoc) | http://localhost:8000/redoc | Documentación alternativa |
| MongoDB | localhost:27017 | Base de datos |

## 🔐 Credenciales de Desarrollo

**MongoDB:**
- Usuario: `admin`
- Password: `admin123`

**Aplicación:**
- Las credenciales dependen de los datos en la base de datos

## 📝 Notas Importantes

1. **Primer inicio**: La primera vez puede tardar más porque:
   - Se descargan las imágenes de Docker
   - Se instalan las dependencias de Python
   - Se instalan las dependencias de Node.js

2. **Datos persistentes**: Los datos de MongoDB se guardan en un volumen de Docker llamado `drtc-mongodb-data-local`, por lo que no se perderán al detener el contenedor.

3. **Hot Reload**: Tanto el backend como el frontend tienen hot reload activado, por lo que los cambios en el código se reflejarán automáticamente.

4. **Modo desarrollo**: Esta configuración es solo para desarrollo. Para producción, usa los archivos `docker-compose.yml` o `docker-compose.mesa-partes.prod.yml`.

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa los logs de cada servicio
2. Verifica que todos los requisitos previos estén instalados
3. Consulta la sección de "Solución de Problemas"
4. Revisa la documentación del proyecto en `docs/`

---

**¡Listo para desarrollar! 🎉**
