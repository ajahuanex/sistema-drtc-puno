@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     SISTEMA DRTC PUNO - DESPLIEGUE LOCAL COMPLETO             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Este script verificará e iniciará todos los componentes del sistema:
echo   1. Docker Desktop y MongoDB
echo   2. Backend (FastAPI)
echo   3. Frontend (Angular)
echo.
pause
cls

REM ============================================
REM PASO 1: VERIFICAR DOCKER
REM ============================================
echo ╔════════════════════════════════════════════════════════════════╗
echo ║ PASO 1/3: VERIFICANDO DOCKER DESKTOP                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Docker no está instalado
    echo.
    echo Por favor instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo ✅ Docker está instalado
docker --version
echo.

REM Verificar si Docker está corriendo
docker ps >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker Desktop no está corriendo
    echo.
    echo Por favor:
    echo   1. Abre Docker Desktop
    echo   2. Espera a que inicie completamente
    echo   3. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop está corriendo
echo.

REM ============================================
REM PASO 2: VERIFICAR/INICIAR MONGODB
REM ============================================
echo ╔════════════════════════════════════════════════════════════════╗
echo ║ PASO 2/3: VERIFICANDO MONGODB                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

docker ps --filter "name=drtc-mongodb-local" --format "{{.Names}}" | findstr "drtc-mongodb-local" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB no está corriendo, iniciando...
    echo.
    docker-compose -f docker-compose.db-only.yml up -d
    if errorlevel 1 (
        echo ❌ ERROR: No se pudo iniciar MongoDB
        pause
        exit /b 1
    )
    echo.
    echo ⏳ Esperando a que MongoDB esté listo...
    timeout /t 15 /nobreak >nul
    echo ✅ MongoDB iniciado
) else (
    echo ✅ MongoDB ya está corriendo
)
echo.

REM Mostrar información de MongoDB
echo 📊 Información de MongoDB:
docker ps --filter "name=drtc-mongodb-local" --format "   Contenedor: {{.Names}}" 
docker ps --filter "name=drtc-mongodb-local" --format "   Estado: {{.Status}}"
docker ps --filter "name=drtc-mongodb-local" --format "   Puerto: {{.Ports}}"
echo.

REM ============================================
REM PASO 3: VERIFICAR REQUISITOS
REM ============================================
echo ╔════════════════════════════════════════════════════════════════╗
echo ║ PASO 3/3: VERIFICANDO REQUISITOS DEL SISTEMA                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [Python]
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    echo    Descarga desde: https://www.python.org/downloads/
) else (
    python --version
    echo ✅ Python está instalado
)
echo.

echo [Node.js]
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo    Descarga desde: https://nodejs.org/
) else (
    node --version
    npm --version
    echo ✅ Node.js está instalado
)
echo.

REM ============================================
REM RESUMEN Y SIGUIENTES PASOS
REM ============================================
cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SISTEMA LISTO                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo ✅ MongoDB está corriendo en Docker
echo    URL: mongodb://admin:admin123@localhost:27017
echo    Base de datos: drtc_puno_db
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              SIGUIENTES PASOS                                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Para iniciar el BACKEND:
echo   1. Abre una nueva terminal (CMD o PowerShell)
echo   2. Ejecuta: start-backend.bat
echo   3. Espera a ver: "Application startup complete"
echo   4. Backend disponible en: http://localhost:8000
echo.
echo Para iniciar el FRONTEND:
echo   1. Abre otra terminal nueva
echo   2. Ejecuta: start-frontend.bat
echo   3. Espera a ver: "Compiled successfully"
echo   4. Frontend disponible en: http://localhost:4200
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              VERIFICAR BASE DE DATOS                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Para verificar la base de datos MongoDB:
echo   Ejecuta: verificar-db.bat
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              DOCUMENTACIÓN                                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo - Guía completa: GUIA_DESPLIEGUE_LOCAL.md
echo - Análisis del módulo: ANALISIS_MODULO_RESOLUCION.md
echo - Limpieza de mock: LIMPIEZA_MOCK_RESUMEN.md
echo.
pause
