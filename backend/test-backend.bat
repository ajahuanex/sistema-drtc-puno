@echo off
echo ========================================
echo   Probando Backend en Puerto 8003
echo ========================================
echo.

echo 1. Verificando si el puerto 8003 esta en uso...
netstat -ano | findstr ":8003" | findstr "LISTENING"
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Backend esta corriendo en puerto 8003
) else (
    echo    [ERROR] Backend NO esta corriendo en puerto 8003
    echo    Ejecuta: start-backend.bat
    exit /b 1
)

echo.
echo 2. Probando endpoint /docs...
curl -s -o nul -w "   Status: %%{http_code}\n" http://localhost:8003/docs

echo.
echo 3. Probando endpoint /api/v1/health (si existe)...
curl -s -o nul -w "   Status: %%{http_code}\n" http://localhost:8003/api/v1/health

echo.
echo 4. Abriendo documentacion de la API en el navegador...
start http://localhost:8003/docs

echo.
echo ========================================
echo   Prueba Completada
echo ========================================
