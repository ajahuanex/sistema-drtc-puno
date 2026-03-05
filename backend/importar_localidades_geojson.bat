@echo off
echo ========================================
echo Importacion de Localidades desde GeoJSON
echo ========================================
echo.

REM Activar entorno virtual si existe
if exist venv\Scripts\activate.bat (
    echo Activando entorno virtual...
    call venv\Scripts\activate.bat
)

REM Ejecutar script de importacion
echo Ejecutando script de importacion...
python scripts\importar_localidades_desde_geojson.py

echo.
echo ========================================
echo Proceso completado
echo ========================================
pause
