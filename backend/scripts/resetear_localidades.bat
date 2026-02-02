@echo off
echo 🇵🇪 RESETEO COMPLETO DE LOCALIDADES DEL PERU
echo ==========================================
echo.
echo Este script eliminara TODAS las localidades existentes
echo e importara 40 localidades reales basadas en UBIGEO oficial del INEI
echo.
set /p respuesta="¿Continuar? (s/N): "
if /i "%respuesta%"=="s" goto ejecutar
if /i "%respuesta%"=="si" goto ejecutar
if /i "%respuesta%"=="y" goto ejecutar
if /i "%respuesta%"=="yes" goto ejecutar

echo ❌ Operacion cancelada
pause
exit /b

:ejecutar
echo.
echo 🔄 Ejecutando reseteo...
cd /d "%~dp0\.."
python scripts/resetear_localidades.py
echo.
echo ✅ Proceso completado
pause