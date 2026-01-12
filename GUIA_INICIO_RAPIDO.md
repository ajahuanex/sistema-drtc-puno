# 🚀 SIRRET - Guía de Inicio Rápido

## 📋 Requisitos Previos

### Obligatorios
- **Python 3.8+** - [Descargar aquí](https://www.python.org/downloads/)
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)

### Opcionales (para producción)
- **MongoDB** - Solo si no usas SQLite
- **Docker** - Para contenedores

## 🎯 Inicio Rápido (Recomendado)

### Opción 1: Script Automático
```bash
# Ejecutar desde la raíz del proyecto
start-sistema-completo.bat
```

Este script:
- ✅ Inicia el backend con SQLite (puerto 8000)
- ✅ Inicia el frontend con Angular (puerto 4200)
- ✅ Abre automáticamente el navegador
- ✅ Configura todas las variables de entorno

### Opción 2: Manual

#### Backend (SQLite)
```bash
cd backend
start-backend-sqlite.bat
```

#### Frontend (Angular)
```bash
cd frontend
start-frontend.bat
```

## 🗄️ Configuración de Base de Datos

### SQLite (Desarrollo Local - Recomendado)
- ✅ **Sin instalación adicional**
- ✅ **Configuración automática**
- ✅ **Archivo local**: `backend/drtc_local.db`

### MongoDB (Producción)
```bash
# Opción 1: MongoDB Local
# Instalar MongoDB Community Server
# Iniciar servicio: net start MongoDB

# Opción 2: MongoDB con Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Opción 3: MongoDB Atlas (Cloud)
# Crear cuenta gratuita en MongoDB Atlas
# Actualizar variable MONGODB_URL en .env
```

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Interfaz de usuario |
| **Backend API** | http://localhost:8000 | API REST |
| **Documentación API** | http://localhost:8000/docs | Swagger UI |
| **Base de datos** | `./backend/drtc_local.db` | SQLite local |

## 🔧 Variables de Entorno

### Backend (SQLite)
```bash
USE_SQLITE=true
DATABASE_URL=sqlite:///./drtc_local.db
DEBUG=true
ENVIRONMENT=development
```

### Backend (MongoDB)
```bash
USE_SQLITE=false
MONGODB_URL=mongodb://localhost:27017/drtc_db
DEBUG=true
ENVIRONMENT=development
```

## 📁 Estructura del Proyecto

```
sistema-drtc-puno/
├── backend/                 # API FastAPI
│   ├── app/                # Código de la aplicación
│   ├── venv/               # Entorno virtual Python
│   ├── start-backend-sqlite.bat
│   └── requirements.txt
├── frontend/               # Aplicación Angular
│   ├── src/               # Código fuente
│   ├── start-frontend.bat
│   └── package.json
└── start-sistema-completo.bat  # Script maestro
```

## 🛠️ Comandos Útiles

### Backend
```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar tests
python -m pytest

# Crear migraciones (si usas SQLAlchemy)
alembic revision --autogenerate -m "descripcion"
alembic upgrade head
```

### Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
ng serve

# Construir para producción
ng build --prod

# Ejecutar tests
ng test
```

## 🐛 Solución de Problemas

### Error: "Puerto 8000 ya está en uso"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Error: "Node.js no encontrado"
1. Instalar Node.js desde https://nodejs.org/
2. Reiniciar la terminal
3. Verificar: `node --version`

### Error: "Python no encontrado"
1. Instalar Python desde https://www.python.org/
2. Marcar "Add to PATH" durante la instalación
3. Reiniciar la terminal
4. Verificar: `python --version`

### Error: "Angular CLI no encontrado"
```bash
npm install -g @angular/cli
```

### Error de conexión Backend-Frontend
1. Verificar que el backend esté corriendo en puerto 8000
2. Verificar la configuración en `frontend/src/environments/environment.ts`
3. Revisar CORS en el backend

## 📊 Funcionalidades Principales

- ✅ **Gestión de Empresas de Transporte**
- ✅ **Registro de Vehículos**
- ✅ **Control de Rutas**
- ✅ **Expedientes y Resoluciones**
- ✅ **Carga Masiva de Datos**
- ✅ **Reportes y Estadísticas**
- ✅ **Sistema de Autenticación**

## 🔐 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| usuario | usuario123 | Usuario |

## 📞 Soporte

Si encuentras problemas:
1. Revisa esta guía
2. Verifica los logs en las consolas
3. Consulta la documentación de la API en http://localhost:8000/docs

---

**¡Listo para usar SIRRET! 🎉**