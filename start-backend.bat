@echo off
REM Script para iniciar el backend de SIRRET en Windows

echo.
echo 🚀 Iniciando backend SIRRET...
echo.

REM Ir a la carpeta del backend
cd backend

if "%~1"=="remote" (
    echo [MODO FORZADO: REMOTO]
    set USE_REMOTE_DB=true
    set MONGODB_TARGET=remote
) else if "%~1"=="local" (
    echo [MODO FORZADO: LOCAL]
    set USE_REMOTE_DB=false
    set MONGODB_TARGET=local
)

REM Iniciar el backend (leerá la configuración activa de .env)
echo ✓ Iniciando servidor en http://localhost:8000 (respetando switch en .env)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
