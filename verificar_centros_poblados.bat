@echo off
echo ========================================
echo VERIFICAR CENTROS POBLADOS IMPORTADOS
echo ========================================
echo.

cd backend

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Verificando datos en MongoDB...
python scripts\verificar_centros_poblados.py

echo.
echo Presiona cualquier tecla para salir...
pause > nul
