@echo off
echo ========================================
echo   Verificacion del Sistema SIRRET
echo ========================================
echo.

REM Verificar Python
echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    echo    Instalar desde: https://www.python.org/downloads/
) else (
    python --version
    echo ✅ Python instalado correctamente
)
echo.

REM Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo    Instalar desde: https://nodejs.org/
) else (
    node --version
    echo ✅ Node.js instalado correctamente
)
echo.

REM Verificar npm
echo Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no está disponible
) else (
    npm --version
    echo ✅ npm disponible
)
echo.

REM Verificar Angular CLI
echo Verificando Angular CLI...
ng version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Angular CLI no está instalado globalmente
    echo    Instalar con: npm install -g @angular/cli
) else (
    echo ✅ Angular CLI instalado
)
echo.

REM Verificar estructura del proyecto
echo Verificando estructura del proyecto...
if exist "backend" (
    echo ✅ Directorio backend encontrado
) else (
    echo ❌ Directorio backend no encontrado
)

if exist "frontend" (
    echo ✅ Directorio frontend encontrado
) else (
    echo ❌ Directorio frontend no encontrado
)

if exist "backend\requirements.txt" (
    echo ✅ requirements.txt encontrado
) else (
    echo ❌ requirements.txt no encontrado
)

if exist "frontend\package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json no encontrado
)
echo.

REM Verificar entorno virtual del backend
echo Verificando entorno virtual del backend...
if exist "backend\venv" (
    echo ✅ Entorno virtual encontrado
) else (
    echo ⚠️  Entorno virtual no encontrado
    echo    Se creará automáticamente al ejecutar el backend
)
echo.

REM Verificar dependencias del frontend
echo Verificando dependencias del frontend...
if exist "frontend\node_modules" (
    echo ✅ Dependencias del frontend instaladas
) else (
    echo ⚠️  Dependencias del frontend no instaladas
    echo    Se instalarán automáticamente al ejecutar el frontend
)
echo.

echo ========================================
echo   Resumen de Verificación
echo ========================================
echo.
echo Para iniciar el sistema completo:
echo   start-sistema-completo.bat
echo.
echo Para iniciar solo el backend:
echo   cd backend
echo   start-backend-sqlite.bat
echo.
echo Para iniciar solo el frontend:
echo   cd frontend
echo   start-frontend.bat
echo.
echo URLs del sistema:
echo   Frontend: http://localhost:4200
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
pause