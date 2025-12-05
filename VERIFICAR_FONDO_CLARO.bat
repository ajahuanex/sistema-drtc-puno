@echo off
echo ========================================
echo VERIFICACION DE FONDO CLARO - VEHICULOS
echo ========================================
echo.

REM Verificar que existen los archivos necesarios
echo Verificando archivos...
echo.

set ERRORES=0

if not exist "frontend\src\app\components\vehiculos\vehiculos-clean.component.scss" (
    echo ❌ FALTA: vehiculos-clean.component.scss
    set /a ERRORES+=1
) else (
    echo ✓ vehiculos-clean.component.scss
)

if not exist "frontend\src\app\components\vehiculos\vehiculos-simple.component.ts" (
    echo ❌ FALTA: vehiculos-simple.component.ts
    set /a ERRORES+=1
) else (
    echo ✓ vehiculos-simple.component.ts
)

if not exist "frontend\src\app\components\vehiculos\vehiculos.component.html" (
    echo ❌ FALTA: vehiculos.component.html
    set /a ERRORES+=1
) else (
    echo ✓ vehiculos.component.html
)

echo.
echo ========================================

if %ERRORES% EQU 0 (
    echo ✅ TODOS LOS ARCHIVOS ESTAN PRESENTES
    echo.
    echo Para aplicar el fondo claro:
    echo   1. Ejecuta: CAMBIAR_VEHICULOS_ESTILO.bat
    echo   2. Selecciona opcion 1
    echo   3. Reinicia el servidor: cd frontend ^& npm start
    echo.
    echo O aplica directamente:
    echo   copy frontend\src\app\components\vehiculos\vehiculos-clean.component.scss frontend\src\app\components\vehiculos\vehiculos.component.scss
) else (
    echo ❌ FALTAN %ERRORES% ARCHIVO(S)
    echo.
    echo Por favor, verifica que todos los archivos fueron creados correctamente.
)

echo.
echo ========================================
echo VERIFICACION DE CONTENIDO
echo ========================================
echo.

REM Verificar que el SCSS tiene el fondo claro
findstr /C:"background-color: #fafafa" "frontend\src\app\components\vehiculos\vehiculos-clean.component.scss" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ El SCSS contiene estilos de fondo claro
) else (
    echo ❌ El SCSS no contiene estilos de fondo claro
)

findstr /C:":host" "frontend\src\app\components\vehiculos\vehiculos-clean.component.scss" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ El SCSS tiene estilos de host
) else (
    echo ❌ El SCSS no tiene estilos de host
)

findstr /C:"!important" "frontend\src\app\components\vehiculos\vehiculos-clean.component.scss" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ El SCSS usa !important para forzar estilos
) else (
    echo ⚠ El SCSS no usa !important (puede no funcionar)
)

echo.
echo ========================================
echo ESTADO ACTUAL
echo ========================================
echo.

REM Verificar si ya se aplicó la versión simplificada
fc /b "frontend\src\app\components\vehiculos\vehiculos.component.scss" "frontend\src\app\components\vehiculos\vehiculos-simple.component.scss" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ VERSION SIMPLIFICADA YA APLICADA
    echo.
    echo El modulo de vehiculos ya esta usando la version con fondo claro.
    echo Si aun ves fondo oscuro:
    echo   1. Detén el servidor (Ctrl+C)
    echo   2. Limpia cache: rm -rf .angular
    echo   3. Reinicia: npm start
    echo   4. Refresca navegador: Ctrl+F5
) else (
    echo ⏳ VERSION SIMPLIFICADA NO APLICADA
    echo.
    echo Para aplicar la version con fondo claro:
    echo   CAMBIAR_VEHICULOS_ESTILO.bat
    echo   Opcion 1: Cambiar a version SIMPLIFICADA
)

echo.
pause
