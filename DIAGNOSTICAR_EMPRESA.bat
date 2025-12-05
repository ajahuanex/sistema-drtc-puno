@echo off
echo ========================================
echo DIAGNOSTICAR RELACIONES DE EMPRESA
echo ========================================
echo.
echo Este script verificara las relaciones entre
echo la empresa y sus resoluciones, vehiculos, etc.
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
echo Verificando empresa: %empresa_id%
echo.

python verificar_relaciones_empresa.py %empresa_id%

echo.
pause
