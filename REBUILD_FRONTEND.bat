@echo off
echo ========================================
echo Reconstruyendo Frontend con URLs Corregidas
echo ========================================
echo.

echo [1/3] Deteniendo contenedores...
docker-compose down

echo.
echo [2/3] Reconstruyendo imagen del frontend...
docker-compose build frontend --no-cache

echo.
echo [3/3] Iniciando servicios...
docker-compose up -d

echo.
echo ========================================
echo Verificando estado de los servicios...
echo ========================================
timeout /t 5 /nobreak >nul

docker-compose ps

echo.
echo ========================================
echo Frontend reconstruido exitosamente!
echo ========================================
echo.
echo Accede a:
echo   - Frontend: http://localhost:4200
echo   - Backend:  http://localhost:8001/api/v1
echo   - Docs API: http://localhost:8001/docs
echo.
pause
