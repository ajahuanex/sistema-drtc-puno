@echo off
echo ========================================
echo DIAGNOSTICO COMPLETO: Anios de Vigencia
echo ========================================
echo.

echo Paso 1: Verificando archivos Excel existentes...
echo ------------------------------------------------
python test_lectura_excel_10_anios.py
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

echo.
echo Paso 2: Verificando base de datos...
echo ------------------------------------------------
python test_anios_10_especifico.py
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

echo.
echo Paso 3: Probando actualizacion...
echo ------------------------------------------------
python test_actualizacion_10_anios.py
echo.

echo.
echo ========================================
echo DIAGNOSTICO COMPLETADO
echo ========================================
echo.
echo Revisa los resultados arriba para identificar el problema.
echo.
echo Si necesitas mas ayuda, lee: DIAGNOSTICO_FINAL_10_ANIOS.md
echo.
pause
