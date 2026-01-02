@echo off
chcp 65001 >nul
echo ========================================
echo VERIFICACIÓN DEL SISTEMA SIRRET
echo ========================================
echo.

echo [1/6] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker NO está instalado o NO está corriendo
    echo    Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/
) else (
    docker --version
    echo ✅ Docker está disponible
)
echo.

echo [2/6] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python NO está instalado
    echo    Instala Python desde: https://www.python.org/downloads/
) else (
    python --version
    echo ✅ Python está instalado
)
echo.

echo [3/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NO está instalado
    echo    Instala Node.js desde: https://nodejs.org/
) else (
    node --version
    npm --version
    echo ✅ Node.js está instalado
)
echo.

echo [4/6] Verificando MongoDB en Docker...
docker ps | findstr "sirret-mongodb-local" >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB NO está corriendo
    echo    Ejecuta: INICIAR_SISTEMA_LOCAL.bat
) else (
    echo ✅ MongoDB está corriendo en Docker
    docker ps --filter "name=sirret-mongodb-local" --format "   Puerto: {{.Ports}}"
)
echo.

echo [5/6] Verificando Backend (Puerto 8000)...
curl -s http://localhost:8000/docs >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend NO está corriendo
    echo    Ejecuta: start-backend.bat
) else (
    echo ✅ Backend está corriendo
    echo    URL: http://localhost:8000
    echo    Docs: http://localhost:8000/docs
)
echo.

echo [6/6] Verificando Frontend (Puerto 4200)...
curl -s http://localhost:4200 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend NO está corriendo
    echo    Ejecuta: start-frontend.bat
) else (
    echo ✅ Frontend está corriendo
    echo    URL: http://localhost:4200
)
echo.

echo ========================================
echo RESUMEN
echo ========================================
echo.
echo Para iniciar el sistema completo:
echo   1. INICIAR_SISTEMA_LOCAL.bat  (MongoDB)
echo   2. start-backend.bat           (Backend)
echo   3. start-frontend.bat          (Frontend)
echo.
echo Para más información, consulta: GUIA_DESPLIEGUE_LOCAL.md
echo.

pause
