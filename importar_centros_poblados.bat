@echo off
echo ========================================
echo IMPORTAR CENTROS POBLADOS DE PUNO
echo ========================================
echo.

cd backend

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Ejecutando script de importacion...
python scripts\importar_centros_poblados_geojson.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
