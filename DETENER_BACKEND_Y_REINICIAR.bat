@echo off
echo ========================================
echo DETENIENDO BACKEND Y REINICIANDO
echo ========================================

echo.
echo [1/3] Deteniendo procesos Python/Uvicorn...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Iniciando backend limpiamente...
cd backend
start cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo ========================================
echo Backend reiniciado
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
