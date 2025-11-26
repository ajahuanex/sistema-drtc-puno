@echo off
echo ========================================
echo Sistema DRTC Puno - Despliegue Local
echo ========================================
echo.
echo Este script iniciará:
echo   1. MongoDB en Docker
echo   2. Backend (FastAPI) en local
echo   3. Frontend (Angular) en local
echo.
echo Presiona Ctrl+C para cancelar...
timeout /t 5

REM Paso 1: Iniciar MongoDB
echo.
echo ========================================
echo PASO 1: Iniciando MongoDB en Docker
echo ========================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no está corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

if not exist .env (
    copy .env.local.example .env
    echo [OK] Archivo .env creado
)

docker-compose -f docker-compose.db-only.yml up -d

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo iniciar MongoDB
    pause
    exit /b 1
)

echo [OK] MongoDB iniciado
echo Esperando a que MongoDB esté listo...
timeout /t 10

REM Paso 2: Abrir nueva ventana para Backend
echo.
echo ========================================
echo PASO 2: Iniciando Backend
echo ========================================
echo.
echo Abriendo nueva ventana para el Backend...
start "DRTC Backend" cmd /k start-backend.bat

echo Esperando a que el backend inicie...
timeout /t 15

REM Paso 3: Abrir nueva ventana para Frontend
echo.
echo ========================================
echo PASO 3: Iniciando Frontend
echo ========================================
echo.
echo Abriendo nueva ventana para el Frontend...
start "DRTC Frontend" cmd /k start-frontend.bat

echo.
echo ========================================
echo Despliegue Completado!
echo ========================================
echo.
echo Servicios disponibles:
echo   - MongoDB:  localhost:27017
echo   - Backend:  http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo   - Frontend: http://localhost:4200
echo.
echo Para detener MongoDB:
echo   docker-compose -f docker-compose.db-only.yml down
echo.
echo Para detener Backend/Frontend:
echo   Cierra las ventanas correspondientes o presiona Ctrl+C
echo.

pause
