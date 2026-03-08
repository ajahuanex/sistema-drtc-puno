@echo off
echo ========================================
echo PRUEBAS DEL API DE GEOMETRIAS
echo ========================================
echo.
echo IMPORTANTE: Asegurate de que el backend este corriendo
echo            en otra terminal antes de ejecutar estas pruebas.
echo.
pause

cd /d "%~dp0"

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Ejecutando pruebas...
python test_geometrias_api.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
