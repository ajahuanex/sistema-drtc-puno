@echo off
echo ========================================
echo   Backend SIRRET (Modo Debug)
echo ========================================
echo.

cd /d "%~dp0"

REM Activar el entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
) else (
    echo ADVERTENCIA: No se encontro el entorno virtual
    echo Creando entorno virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Instalando dependencias...
    pip install -r requirements.txt
)

echo.
echo Verificando configuracion...
python test-simple.py
if errorlevel 1 (
    echo ERROR: Fallo la verificacion inicial
    pause
    exit /b 1
)

echo.
echo Configurando variables de entorno...
set MONGODB_URL=mongodb://admin:admin123@localhost:27017/
set DATABASE_NAME=drtc_db
set DEBUG=true
set ENVIRONMENT=development

echo.
echo Iniciando servidor FastAPI en http://localhost:8000
echo Base de datos: MongoDB (localhost:27017)
echo Presiona Ctrl+C para detener el servidor
echo.

REM Usar python directamente en lugar de uvicorn para mejor debugging
python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True, log_level='info')"

echo.
echo Servidor detenido.
pause