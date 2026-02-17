@echo off
echo ========================================
echo REINICIANDO BACKEND SIRRET
echo ========================================

cd backend

echo.
echo Matando procesos Python existentes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Iniciando backend en puerto 8000...
start "SIRRET Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ========================================
echo Backend iniciado en http://localhost:8000
echo Documentacion: http://localhost:8000/docs
echo ========================================
echo.
pause
