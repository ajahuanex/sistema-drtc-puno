@echo off
echo.
echo ========================================
echo   VERIFICACION DE DEPLOYMENT LOCAL
echo ========================================
echo.

echo [1/5] Verificando contenedores...
docker-compose -f docker-compose.local.yml ps

echo.
echo [2/5] Verificando logs del Backend...
docker logs resoluciones-backend-local --tail 20

echo.
echo [3/5] Verificando logs del Frontend...
docker logs resoluciones-frontend-local --tail 20

echo.
echo [4/5] Probando conectividad Backend...
curl -s http://localhost:8001/docs > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend respondiendo en http://localhost:8001
) else (
    echo [ERROR] Backend NO responde
)

echo.
echo [5/5] Probando conectividad Frontend...
curl -s http://localhost:4201 > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend respondiendo en http://localhost:4201
) else (
    echo [ERROR] Frontend NO responde
)

echo.
echo ========================================
echo   VERIFICACION COMPLETADA
echo ========================================
echo.
echo URLs de acceso:
echo   Frontend: http://localhost:4201
echo   Backend:  http://localhost:8001/docs
echo.
pause
