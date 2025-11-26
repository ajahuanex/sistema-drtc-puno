@echo off
chcp 65001 >nul
echo ========================================
echo SISTEMA DRTC - DESPLIEGUE LOCAL
echo ========================================
echo.
echo Este script iniciará:
echo 1. MongoDB en Docker
echo 2. Backend (FastAPI) en PC local
echo 3. Frontend (Angular) en PC local
echo.
echo ========================================
echo.

REM Verificar si Docker está corriendo
echo [1/3] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no está instalado o no está corriendo
    echo Por favor, inicia Docker Desktop y vuelve a ejecutar este script
    pause
    exit /b 1
)
echo [OK] Docker está disponible
echo.

REM Iniciar MongoDB en Docker
echo [2/3] Iniciando MongoDB en Docker...
docker-compose -f docker-compose.db-only.yml up -d
if errorlevel 1 (
    echo [ERROR] No se pudo iniciar MongoDB
    pause
    exit /b 1
)
echo [OK] MongoDB iniciado en Docker
echo.

REM Esperar a que MongoDB esté listo
echo Esperando a que MongoDB esté listo...
timeout /t 10 /nobreak >nul
echo [OK] MongoDB está listo
echo.

echo ========================================
echo ESTADO DEL SISTEMA
echo ========================================
echo.
echo MongoDB: http://localhost:27017
echo   Usuario: admin
echo   Password: admin123
echo   Base de datos: drtc_db
echo.
echo ========================================
echo.
echo Ahora puedes iniciar el backend y frontend:
echo.
echo Para iniciar el BACKEND:
echo   Abre una nueva terminal y ejecuta: start-backend.bat
echo.
echo Para iniciar el FRONTEND:
echo   Abre otra terminal y ejecuta: start-frontend.bat
echo.
echo ========================================
echo.

pause
