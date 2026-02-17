@echo off
REM Script para verificar logs del backend

echo ========================================
echo   VERIFICANDO BACKEND
echo ========================================
echo.

REM Verificar si MongoDB está corriendo
echo [1/4] Verificando MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo OK: MongoDB corriendo
) else (
    echo ERROR: MongoDB NO esta corriendo
    echo Inicia MongoDB Compass o el servicio de MongoDB
)
echo.

REM Verificar puerto 8000
echo [2/4] Verificando puerto 8000...
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo OK: Puerto 8000 en uso
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
        echo Proceso: %%a
    )
) else (
    echo ADVERTENCIA: Puerto 8000 libre
)
echo.

REM Verificar archivos del backend
echo [3/4] Verificando archivos del backend...
if exist "backend\app\main.py" (
    echo OK: backend\app\main.py existe
) else (
    echo ERROR: backend\app\main.py NO existe
)

if exist "backend\app\config\settings.py" (
    echo OK: backend\app\config\settings.py existe
) else (
    echo ERROR: backend\app\config\settings.py NO existe
)
echo.

REM Intentar iniciar backend manualmente
echo [4/4] Intentando iniciar backend...
echo.
echo Ejecutando: python -m uvicorn app.main:app --reload --port 8000
echo.
cd backend
python -m uvicorn app.main:app --reload --port 8000
