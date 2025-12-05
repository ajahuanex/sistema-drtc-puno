@echo off
echo ========================================
echo CORREGIR RELACIONES DE EMPRESA
echo ========================================
echo.
echo Este script corregira automaticamente las
echo relaciones entre la empresa y sus elementos.
echo.
echo ADVERTENCIA: Modificara la base de datos
echo.
echo Necesitas el ID de la empresa de la URL.
echo Por ejemplo, si la URL es:
echo   localhost:4200/empresas/673e33a45-41d1-4607-bbd6-82eaca87b91
echo.
echo El ID es: 673e33a45-41d1-4607-bbd6-82eaca87b91
echo.
set /p empresa_id="Ingresa el ID de la empresa: "

if "%empresa_id%"=="" (
    echo ERROR: Debes ingresar un ID de empresa
    pause
    exit /b
)

echo.
echo Corrigiendo empresa: %empresa_id%
echo.

python corregir_relaciones_empresa.py %empresa_id%

echo.
pause
