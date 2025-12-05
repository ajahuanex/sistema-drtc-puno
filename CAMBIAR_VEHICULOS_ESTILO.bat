@echo off
echo ========================================
echo CAMBIAR ESTILO DE MODULO DE VEHICULOS
echo ========================================
echo.
echo Este script te permite cambiar entre:
echo 1. Version ORIGINAL (compleja, muchas funcionalidades)
echo 2. Version SIMPLIFICADA (estilo empresas, mas limpia)
echo.
echo Selecciona una opcion:
echo [1] Cambiar a version SIMPLIFICADA (estilo empresas)
echo [2] Cambiar a version ORIGINAL (compleja)
echo [3] Hacer BACKUP de la version actual
echo [4] Salir
echo.
set /p opcion="Ingresa tu opcion (1-4): "

if "%opcion%"=="1" goto simplificada
if "%opcion%"=="2" goto original
if "%opcion%"=="3" goto backup
if "%opcion%"=="4" goto salir

echo Opcion invalida
pause
exit /b

:simplificada
echo.
echo Cambiando a version SIMPLIFICADA (con fondo claro)...
echo.

REM Hacer backup primero
if not exist "frontend\src\app\components\vehiculos\backup" mkdir "frontend\src\app\components\vehiculos\backup"
copy "frontend\src\app\components\vehiculos\vehiculos.component.ts" "frontend\src\app\components\vehiculos\backup\vehiculos.component.ts.bak" >nul 2>&1
copy "frontend\src\app\components\vehiculos\vehiculos.component.scss" "frontend\src\app\components\vehiculos\backup\vehiculos.component.scss.bak" >nul 2>&1

REM Asegurar que el SCSS simplificado tenga el fondo claro
copy "frontend\src\app\components\vehiculos\vehiculos-clean.component.scss" "frontend\src\app\components\vehiculos\vehiculos-simple.component.scss" >nul 2>&1

REM Copiar version simplificada
copy "frontend\src\app\components\vehiculos\vehiculos-simple.component.ts" "frontend\src\app\components\vehiculos\vehiculos.component.ts" >nul
copy "frontend\src\app\components\vehiculos\vehiculos-simple.component.scss" "frontend\src\app\components\vehiculos\vehiculos.component.scss" >nul

echo.
echo ✓ Version SIMPLIFICADA activada
echo ✓ Backup guardado en: frontend\src\app\components\vehiculos\backup\
echo.
echo IMPORTANTE: El archivo HTML ya esta creado en:
echo   frontend\src\app\components\vehiculos\vehiculos.component.html
echo.
echo Reinicia el servidor de desarrollo para ver los cambios:
echo   cd frontend
echo   npm start
echo.
pause
exit /b

:original
echo.
echo Restaurando version ORIGINAL...
echo.

if not exist "frontend\src\app\components\vehiculos\backup\vehiculos.component.ts.bak" (
    echo ERROR: No se encontro backup de la version original
    echo Por favor, restaura manualmente desde el control de versiones
    pause
    exit /b
)

copy "frontend\src\app\components\vehiculos\backup\vehiculos.component.ts.bak" "frontend\src\app\components\vehiculos\vehiculos.component.ts" >nul
copy "frontend\src\app\components\vehiculos\backup\vehiculos.component.scss.bak" "frontend\src\app\components\vehiculos\vehiculos.component.scss" >nul

REM Eliminar el HTML externo si existe (la version original usa template inline)
if exist "frontend\src\app\components\vehiculos\vehiculos.component.html" (
    ren "frontend\src\app\components\vehiculos\vehiculos.component.html" "vehiculos.component.html.bak"
)

echo.
echo ✓ Version ORIGINAL restaurada
echo.
echo Reinicia el servidor de desarrollo para ver los cambios:
echo   cd frontend
echo   npm start
echo.
pause
exit /b

:backup
echo.
echo Creando BACKUP de la version actual...
echo.

if not exist "frontend\src\app\components\vehiculos\backup" mkdir "frontend\src\app\components\vehiculos\backup"

set timestamp=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

copy "frontend\src\app\components\vehiculos\vehiculos.component.ts" "frontend\src\app\components\vehiculos\backup\vehiculos.component.ts.%timestamp%.bak" >nul
copy "frontend\src\app\components\vehiculos\vehiculos.component.scss" "frontend\src\app\components\vehiculos\backup\vehiculos.component.scss.%timestamp%.bak" >nul
if exist "frontend\src\app\components\vehiculos\vehiculos.component.html" (
    copy "frontend\src\app\components\vehiculos\vehiculos.component.html" "frontend\src\app\components\vehiculos\backup\vehiculos.component.html.%timestamp%.bak" >nul
)

echo.
echo ✓ Backup creado exitosamente
echo ✓ Ubicacion: frontend\src\app\components\vehiculos\backup\
echo ✓ Timestamp: %timestamp%
echo.
pause
exit /b

:salir
echo.
echo Saliendo...
exit /b
