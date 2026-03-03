@echo off
echo ========================================
echo IMPORTADOR DE LOCALIDADES DE PUNO
echo ========================================
echo.

cd /d "%~dp0"

REM Activar entorno virtual si existe
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
)

REM Ejecutar script de importación
python scripts\importar_localidades_completo.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
