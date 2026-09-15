@echo off
chcp 65001 >nul
REM Script para iniciar el backend de SIRRET conectado a MongoDB Remoto

echo.
echo =====================================================================
echo  🚀 Iniciando backend SIRRET en modo REMOTO (161.132.52.69)...
echo =====================================================================
echo.

cd backend

REM Configurar variables de entorno para MongoDB Remoto
set USE_REMOTE_DB=true
set MONGODB_TARGET=remote
set MONGODB_URL=mongodb://admin_user:ClaveSuperSegura2026!ok@161.132.52.69:27017/?authSource=admin
set DATABASE_NAME=drtc_db

echo ✓ Servidor MongoDB destino: 161.132.52.69:27017 (authSource=admin)
echo ✓ Base de datos: %DATABASE_NAME%
echo ✓ Iniciando API FastAPI en http://localhost:8000 ...
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
