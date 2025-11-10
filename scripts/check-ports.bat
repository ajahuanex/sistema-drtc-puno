@echo off
REM Script para verificar si los puertos están disponibles en Windows

echo Verificando disponibilidad de puertos...
echo.

set "all_available=true"

REM Función para verificar puerto
call :check_port 27017 "MongoDB"
call :check_port 8000 "Backend"
call :check_port 4200 "Frontend"
call :check_port 80 "Nginx HTTP"
call :check_port 443 "Nginx HTTPS"

echo.

if "%all_available%"=="true" (
    echo [32mTodos los puertos estan disponibles![0m
    echo Puedes iniciar Docker Compose con:
    echo   docker-compose up -d
) else (
    echo [33mAlgunos puertos estan ocupados[0m
    echo.
    echo Opciones:
    echo 1. Detener los servicios que usan esos puertos
    echo 2. Usar puertos alternativos en el archivo .env:
    echo.
    echo    # Ejemplo de .env con puertos alternativos
    echo    MONGODB_PORT=27018
    echo    BACKEND_PORT=8001
    echo    FRONTEND_PORT=4201
    echo    NGINX_HTTP_PORT=8080
    echo    NGINX_HTTPS_PORT=8443
    echo.
    echo Luego ejecuta:
    echo   docker-compose up -d
)

echo.
echo Para mas informacion, consulta: DOCKER_DEPLOYMENT_GUIDE.md
pause
exit /b

:check_port
set "port=%~1"
set "service=%~2"

netstat -ano | findstr ":%port% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [31m[X][0m Puerto %port% ^(%service%^) esta OCUPADO
    echo   Proceso usando el puerto:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%port% " ^| findstr "LISTENING"') do (
        for /f "tokens=1" %%b in ('tasklist /fi "PID eq %%a" /fo table /nh') do (
            echo   PID: %%a - %%b
        )
    )
    set "all_available=false"
) else (
    echo [32m[OK][0m Puerto %port% ^(%service%^) esta disponible
)
exit /b
