@echo off
chcp 65001 >nul
echo ========================================
echo Iniciando Frontend Local (Angular)
echo ========================================
echo.

REM Verificar si Node.js está instalado
echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js está instalado
node --version
npm --version
echo.

cd frontend

REM Verificar si existe node_modules
echo [2/3] Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias de Node.js...
    echo Esto puede tomar varios minutos...
    call npm install
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo.
) else (
    echo [OK] Dependencias ya instaladas
    echo.
)

echo [3/3] Configurando frontend...
echo [OK] Configuración lista
echo.

echo ========================================
echo FRONTEND CONFIGURADO
echo ========================================
echo.
echo API URL: http://localhost:8000
echo Puerto: 4200
echo Modo: Development
echo.
echo El frontend estará disponible en:
echo   - Aplicación: http://localhost:4200
echo.
echo ========================================
echo.

echo Iniciando servidor de desarrollo Angular...
echo.

REM Iniciar el servidor de desarrollo
call npm start
