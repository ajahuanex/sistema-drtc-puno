@echo off
echo ========================================
echo Corrigiendo URLs del API en servicios
echo ========================================
echo.

echo Buscando archivos con URLs hardcodeadas...
echo.

REM Mostrar archivos que necesitan corrección
findstr /S /N /I "localhost:8001\|localhost:8000" frontend\src\app\services\*.ts

echo.
echo ========================================
echo Para corregir automáticamente, ejecuta:
echo   npm run fix-api-urls
echo.
echo O edita manualmente los archivos mostrados arriba
echo para usar: environment.apiUrl
echo ========================================
pause
