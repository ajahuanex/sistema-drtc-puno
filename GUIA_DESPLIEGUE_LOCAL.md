# 🚀 Guía de Despliegue Local - Sistema SIRRET

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Docker Desktop** - Para ejecutar MongoDB
   - Descarga: https://www.docker.com/products/docker-desktop/
   - Debe estar corriendo antes de iniciar el sistema

2. **Python 3.8+** - Para el backend
   - Descarga: https://www.python.org/downloads/
   - Verifica con: `python --version`

3. **Node.js 18+** - Para el frontend
   - Descarga: https://nodejs.org/
   - Verifica con: `node --version`

## 🎯 Pasos para Iniciar el Sistema

### Paso 1: Iniciar MongoDB en Docker

Ejecuta el siguiente script:

```bash
INICIAR_SISTEMA_LOCAL.bat
```

Este script:
- ✅ Verifica que Docker esté corriendo
- ✅ Inicia MongoDB en un contenedor Docker
- ✅ Configura la base de datos con las credenciales correctas

**Credenciales de MongoDB:**
- URL: `mongodb://localhost:27017`
- Usuario: `admin`
- Password: `admin123`
- Base de datos: `sirret_db`

### Paso 2: Iniciar el Backend (FastAPI)

Abre una **nueva terminal** y ejecuta:

```bash
start-backend.bat
```

Este script:
- ✅ Verifica que MongoDB esté corriendo
- ✅ Crea un entorno virtual de Python (si no existe)
- ✅ Instala todas las dependencias necesarias
- ✅ Inicia el servidor FastAPI en modo desarrollo

**El backend estará disponible en:**
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

### Paso 3: Iniciar el Frontend (Angular)

Abre **otra terminal nueva** y ejecuta:

```bash
start-frontend.bat
```

Este script:
- ✅ Verifica que Node.js esté instalado
- ✅ Instala las dependencias de npm (si no existen)
- ✅ Inicia el servidor de desarrollo de Angular

**El frontend estará disponible en:**
- Aplicación: http://localhost:4200

## 🛑 Detener el Sistema

Para detener todos los servicios:

```bash
stop-all-local.bat
```

Este script detendrá MongoDB. Para el backend y frontend, simplemente:
- Presiona `Ctrl+C` en cada terminal donde estén corriendo
- O cierra las ventanas de terminal

## 📊 Verificar el Estado

### Verificar MongoDB
```bash
docker ps
```
Deberías ver un contenedor llamado `sirret-mongodb-local`

### Verificar Backend
Abre en tu navegador: http://localhost:8000/docs

### Verificar Frontend
Abre en tu navegador: http://localhost:4200

## 🔧 Solución de Problemas

### MongoDB no inicia
- Verifica que Docker Desktop esté corriendo
- Verifica que el puerto 27017 no esté ocupado
- Ejecuta: `docker-compose -f docker-compose.db-only.yml logs`

### Backend no inicia
- Verifica que Python esté instalado: `python --version`
- Verifica que MongoDB esté corriendo: `docker ps`
- Revisa los logs en la terminal del backend

### Frontend no inicia
- Verifica que Node.js esté instalado: `node --version`
- Elimina `node_modules` y ejecuta `npm install` nuevamente
- Verifica que el puerto 4200 no esté ocupado

### Puerto ocupado
Si algún puerto está ocupado, puedes cambiarlos en el archivo `.env`:
- `MONGODB_PORT=27017`
- `BACKEND_PORT=8000`
- `FRONTEND_PORT=4200`

## 📝 Notas Importantes

1. **Orden de inicio**: Siempre inicia en este orden:
   - Primero: MongoDB (Docker)
   - Segundo: Backend (FastAPI)
   - Tercero: Frontend (Angular)

2. **Modo desarrollo**: Todos los servicios están en modo desarrollo:
   - El backend se recarga automáticamente al cambiar código
   - El frontend se recarga automáticamente al cambiar código
   - MongoDB persiste los datos en un volumen Docker

3. **Primera ejecución**: La primera vez puede tardar más porque:
   - Se descargan las imágenes de Docker
   - Se instalan las dependencias de Python
   - Se instalan las dependencias de Node.js

4. **Datos persistentes**: Los datos de MongoDB se guardan en un volumen Docker llamado `sirret-mongodb-data-local-v2`, por lo que no se pierden al detener el contenedor.

## 🎉 ¡Listo!

Una vez que todos los servicios estén corriendo, puedes acceder a:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

¡Feliz desarrollo! 🚀
