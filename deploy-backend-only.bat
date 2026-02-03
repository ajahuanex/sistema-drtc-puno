@echo off
chcp 65001 >nul
echo ========================================
echo DESPLEGANDO SOLO BACKEND - SIRRET
echo ========================================
echo.

REM Detener servicios existentes
echo [1/5] Deteniendo servicios existentes...
docker-compose down 2>nul
docker stop sirret-backend sirret-mongodb 2>nul
docker rm sirret-backend sirret-mongodb 2>nul
echo [OK] Servicios detenidos
echo.

REM Iniciar solo MongoDB
echo [2/5] Iniciando MongoDB...
docker-compose -f docker-compose.db-only.yml up -d
if errorlevel 1 (
    echo [ERROR] No se pudo iniciar MongoDB
    pause
    exit /b 1
)
echo [OK] MongoDB iniciado
echo.

REM Esperar a que MongoDB esté listo
echo [3/5] Esperando a que MongoDB esté listo...
timeout /t 10 /nobreak >nul
echo [OK] MongoDB listo
echo.

REM Configurar backend
echo [4/5] Configurando backend...
cd backend

REM Crear entorno virtual si no existe
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Instalar dependencias
echo Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias
    pause
    exit /b 1
)

REM Configurar variables de entorno
set MONGODB_URL=mongodb://admin:admin123@localhost:27017/
set DATABASE_NAME=sirret_db
set SECRET_KEY=sirret-backend-secret-key-2025
set DEBUG=true
set ENVIRONMENT=development
set ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:80

echo [OK] Backend configurado
echo.

echo [5/5] Iniciando servidor backend...
echo.
echo ========================================
echo BACKEND DESPLEGADO EXITOSAMENTE
echo ========================================
echo.
echo Servicios disponibles:
echo   - Backend API: http://localhost:8000
echo   - Documentación: http://localhost:8000/docs
echo   - MongoDB: localhost:27017
echo.
echo Credenciales MongoDB:
echo   - Usuario: admin
echo   - Contraseña: admin123
echo   - Base de datos: sirret_db
echo.
echo ========================================
echo.

REM Iniciar el servidor FastAPI
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000