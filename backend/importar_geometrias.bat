@echo off
echo ========================================
echo IMPORTAR GEOMETRIAS DESDE GEOJSON
echo ========================================
echo.

cd /d "%~dp0"

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Ejecutando script de importacion...
python scripts\importar_geometrias_geojson.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
