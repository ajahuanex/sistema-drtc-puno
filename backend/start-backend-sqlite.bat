@echo off
echo ========================================
echo   Backend SIRRET (Modo SQLite Local)
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
echo Configurando variables de entorno para SQLite...
set USE_SQLITE=true
set DATABASE_URL=sqlite:///./drtc_local.db
set DEBUG=true
set ENVIRONMENT=development

echo.
echo Verificando dependencias SQLite...
pip show sqlalchemy >nul 2>&1
if errorlevel 1 (
    echo Instalando SQLAlchemy...
    pip install sqlalchemy
)

echo.
echo Iniciando servidor FastAPI en http://localhost:8000
echo Modo: Desarrollo Local con SQLite
echo Base de datos: SQLite (drtc_local.db)
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload --port 8000 --host 0.0.0.0