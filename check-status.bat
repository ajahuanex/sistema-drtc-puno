@echo off
echo ========================================
echo Verificación de Estado - Sistema SIRRET
echo ========================================
echo.

echo Verificando Docker...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker está corriendo
) else (
    echo [ERROR] Docker no está corriendo
)

echo.
echo Verificando MongoDB...
docker ps --filter "name=sirret-mongodb-local" --format "{{.Names}}: {{.Status}}" 2>nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB verificado
) else (
    echo [ADVERTENCIA] MongoDB no está corriendo
)

echo.
echo Verificando Backend (puerto 8000)...
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend está corriendo en puerto 8000
) else (
    echo [INFO] Backend no está corriendo
)

echo.
echo Verificando Frontend (puerto 4200)...
netstat -ano | findstr ":4200" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend está corriendo en puerto 4200
) else (
    echo [INFO] Frontend no está corriendo
)

echo.
echo ========================================
echo Resumen de URLs
echo ========================================
echo.
echo MongoDB:    localhost:27017
echo Backend:    http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo Frontend:   http://localhost:4200
echo.

pause
