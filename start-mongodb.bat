@echo off
echo ========================================
echo Iniciando MongoDB en Docker Local
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

REM Copiar archivo de configuración si no existe
if not exist .env (
    echo Copiando .env.local.example a .env...
    copy .env.local.example .env
    echo [OK] Archivo .env creado
    echo.
)

echo Iniciando contenedor de MongoDB...
docker-compose -f docker-compose.db-only.yml up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo MongoDB iniciado exitosamente!
    echo ========================================
    echo.
    echo Detalles de conexión:
    echo   Host: localhost
    echo   Puerto: 27017
    echo   Usuario: admin
    echo   Password: admin123
    echo   Base de datos: sirret_db
    echo.
    echo URL de conexión:
    echo   mongodb://admin:admin123@localhost:27017/
    echo.
    echo Para ver los logs: docker logs -f sirret-mongodb-local
    echo Para detener: docker-compose -f docker-compose.db-only.yml down
    echo.
) else (
    echo.
    echo [ERROR] Hubo un problema al iniciar MongoDB
    echo.
)

pause
