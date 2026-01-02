@echo off
echo ========================================
echo REINICIO COMPLETO DEL SISTEMA SIRRET
echo ========================================
echo.

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no está corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker está corriendo
echo.

REM Detener cualquier proceso previo
echo [1/5] Deteniendo procesos previos...
docker-compose -f docker-compose.db-only.yml down 2>nul
echo.

REM Copiar archivo de configuración si no existe
if not exist .env (
    echo [2/5] Copiando .env.local.example a .env...
    copy .env.local.example .env
    echo [OK] Archivo .env creado
) else (
    echo [2/5] Archivo .env ya existe
)
echo.

REM Iniciar MongoDB
echo [3/5] Iniciando MongoDB...
docker-compose -f docker-compose.db-only.yml up -d

if %errorlevel% neq 0 (
    echo [ERROR] No se pudo iniciar MongoDB
    pause
    exit /b 1
)

echo [OK] MongoDB iniciado
echo.

REM Esperar a que MongoDB esté listo
echo [4/5] Esperando a que MongoDB esté listo...
timeout /t 10 /nobreak >nul

REM Crear datos iniciales
echo [5/5] Creando datos iniciales...
python crear_datos_iniciales.py

echo.
echo ========================================
echo SISTEMA INICIADO EXITOSAMENTE
echo ========================================
echo.
echo MongoDB: http://localhost:27017
echo   Usuario: admin
echo   Password: admin123
echo   Base de datos: sirret_db
echo.
echo Para iniciar el backend: start-backend.bat
echo Para iniciar el frontend: start-frontend.bat
echo.
pause