@echo off
echo ========================================
echo   Iniciando Backend SIRRET (Modo Local)
echo ========================================
echo.

cd /d "%~dp0"

REM Activar el entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo ADVERTENCIA: No se encontro el entorno virtual
    echo Asegurate de tener las dependencias instaladas
)

echo.
echo Configurando variables de entorno para modo local...
set MONGODB_URL=mongodb://localhost:27017/
set DATABASE_NAME=drtc_db
set DEBUG=true
set ENVIRONMENT=development

echo.
echo Iniciando servidor FastAPI en http://localhost:8000
echo Modo: Desarrollo Local
echo Base de datos: MongoDB (localhost:27017)
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload --port 8000 --host 0.0.0.0