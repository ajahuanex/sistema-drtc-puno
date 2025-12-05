@echo off
echo ========================================
echo APLICAR FONDO CLARO A MODULO VEHICULOS
echo ========================================
echo.
echo Este script aplicara los estilos con fondo claro
echo al modulo de vehiculos (estilo empresas)
echo.
pause

echo.
echo Aplicando estilos con fondo claro...
echo.

REM Copiar el SCSS limpio al archivo simplificado
copy frontend\src\app\components\vehiculos\vehiculos-clean.component.scss frontend\src\app\components\vehiculos\vehiculos-simple.component.scss >nul

echo ✓ Estilos actualizados
echo.
echo IMPORTANTE: Si ya aplicaste la version simplificada, ejecuta:
echo   CAMBIAR_VEHICULOS_ESTILO.bat
echo   Opcion 1: Cambiar a version SIMPLIFICADA
echo.
echo O si quieres aplicar directamente:
echo   copy frontend\src\app\components\vehiculos\vehiculos-simple.component.scss frontend\src\app\components\vehiculos\vehiculos.component.scss
echo.
echo Luego reinicia el servidor:
echo   cd frontend
echo   npm start
echo.
pause
