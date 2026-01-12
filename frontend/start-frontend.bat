@echo off
echo ========================================
echo   Frontend SIRRET (Angular)
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si Angular CLI está instalado
ng version >nul 2>&1
if errorlevel 1 (
    echo Angular CLI no encontrado, instalando...
    npm install -g @angular/cli
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    npm install
)

echo.
echo Configurando variables de entorno...
set API_URL=http://localhost:8000
set ENVIRONMENT=development

echo.
echo Iniciando servidor de desarrollo Angular en http://localhost:4200
echo Backend esperado en: http://localhost:8000
echo Presiona Ctrl+C para detener el servidor
echo.

ng serve --open --port 4200