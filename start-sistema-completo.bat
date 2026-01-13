@echo off
echo ========================================
echo   SIRRET - Sistema Completo
echo ========================================
echo.
echo Iniciando Backend y Frontend...
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend" (
    echo ERROR: No se encuentra el directorio backend
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: No se encuentra el directorio frontend
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo Iniciando Backend (SQLite)...
start "Backend SIRRET" cmd /k "cd backend && start-backend-sqlite.bat"

echo Esperando 5 segundos para que el backend inicie...
timeout /t 5 /nobreak >nul

echo Iniciando Frontend (Angular)...
start "Frontend SIRRET" cmd /k "cd frontend && start-frontend.bat"

echo.
echo ========================================
echo   Sistema SIRRET Iniciado
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:4200
echo.
echo Presiona cualquier tecla para cerrar este script
echo (Los servidores seguiran ejecutandose en sus ventanas)
pause >nul