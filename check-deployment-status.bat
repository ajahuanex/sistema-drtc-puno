@echo off
echo ========================================
echo Verificando Estado del Deployment
echo ========================================
echo.

echo [1] Verificando contenedores Docker...
echo.
docker-compose ps
echo.

echo [2] Verificando Backend (puerto 8001)...
curl -s http://localhost:8001/api/v1/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend respondiendo en puerto 8001
) else (
    echo    ❌ Backend NO responde en puerto 8001
)
echo.

echo [3] Verificando Frontend (puerto 4200)...
curl -s http://localhost:4200 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Frontend respondiendo en puerto 4200
) else (
    echo    ❌ Frontend NO responde en puerto 4200
)
echo.

echo [4] Verificando configuración de environment.ts...
findstr "apiUrl" frontend\src\environments\environment.ts
echo.

echo ========================================
echo Resumen
echo ========================================
echo.
echo Si el backend responde pero el frontend no conecta,
echo necesitas reconstruir el frontend:
echo.
echo    REBUILD_FRONTEND.bat
echo.
echo ========================================
pause
