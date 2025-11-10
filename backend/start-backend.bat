@echo off
echo ========================================
echo   Iniciando Backend en Puerto 8003
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
echo Iniciando servidor FastAPI en http://localhost:8003
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload --port 8003 --host 0.0.0.0
