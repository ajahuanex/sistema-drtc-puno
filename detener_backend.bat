@echo off
REM Detener todos los procesos Python y uvicorn

echo Deteniendo procesos Python...
taskkill /IM python.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Procesos Python detenidos
) else (
    echo ✗ No hay procesos Python ejecutándose
)

echo.
echo Deteniendo procesos uvicorn...
taskkill /IM uvicorn.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Procesos uvicorn detenidos
) else (
    echo ✗ No hay procesos uvicorn ejecutándose
)

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak

echo.
echo Verificando procesos activos...
tasklist | findstr python
if %ERRORLEVEL% EQU 1 (
    echo ✓ No hay procesos Python activos
) else (
    echo ✗ Aún hay procesos Python activos
)

echo.
echo Listo. Puedes iniciar el backend nuevamente.
pause
