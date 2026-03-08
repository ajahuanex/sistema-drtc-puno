@echo off
echo ========================================
echo VERIFICAR GEOMETRIAS EN BASE DE DATOS
echo ========================================
echo.

cd /d "%~dp0"

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Ejecutando verificacion...
python scripts\verificar_geometrias.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
