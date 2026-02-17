@echo off
echo ========================================
echo LIMPIEZA: Archivos de Prueba
echo ========================================
echo.

echo Los siguientes archivos de prueba seran eliminados:
echo - TEST_10_ANIOS_*.xlsx
echo - plantilla_resoluciones_vigencia_*.xlsx
echo.

set /p confirmar="Deseas continuar? (S/N): "

if /i "%confirmar%"=="S" (
    echo.
    echo Eliminando archivos...
    del /Q TEST_10_ANIOS_*.xlsx 2>nul
    del /Q plantilla_resoluciones_vigencia_*.xlsx 2>nul
    echo.
    echo ✅ Archivos eliminados
) else (
    echo.
    echo Operacion cancelada
)

echo.
pause
