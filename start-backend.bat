@echo off
REM Script para iniciar el backend de SIRRET en Windows

echo.
echo 🚀 Iniciando backend SIRRET...
echo.

REM Ir a la carpeta del backend
cd backend

REM Configurar variables de entorno
set MONGODB_URL=mongodb://admin:admin123@localhost:27017/
set DATABASE_NAME=drtc_db

REM Iniciar el backend
echo ✓ Iniciando servidor en http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
