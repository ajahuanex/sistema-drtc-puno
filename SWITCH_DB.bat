@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title SIRRET - Switch de Base de Datos MongoDB

if "%~1"=="remote" goto :switch_remote
if "%~1"=="local" goto :switch_local
if "%~1"=="status" goto :show_status
if "%~1"=="sync" goto :sync_data

:menu
cls
echo =====================================================================
echo               SISTEMA DRTC PUNO - SWITCH DE BASE DE DATOS
echo =====================================================================
echo.
echo   [1] Conectar a MongoDB REMOTO (Servidor 161.132.52.69:27017)
echo   [2] Conectar a MongoDB LOCAL  (localhost:27017)
echo   [3] Ver estado y latencia de ambas bases de datos
echo   [4] Sincronizar datos (Copiar de Local a Servidor Remoto)
echo   [5] Iniciar Backend con MongoDB REMOTO
echo   [6] Iniciar Backend con MongoDB LOCAL
echo   [7] Salir
echo.
echo =====================================================================
set /p OPCION="Selecciona una opción (1-7): "

if "%OPCION%"=="1" goto :switch_remote
if "%OPCION%"=="2" goto :switch_local
if "%OPCION%"=="3" goto :show_status
if "%OPCION%"=="4" goto :sync_data
if "%OPCION%"=="5" goto :run_remote
if "%OPCION%"=="6" goto :run_local
if "%OPCION%"=="7" exit /b 0

echo Opción inválida.
timeout /t 2 >nul
goto :menu

:switch_remote
echo.
python backend\switch_db.py remote
echo.
pause
goto :menu

:switch_local
echo.
python backend\switch_db.py local
echo.
pause
goto :menu

:show_status
echo.
python backend\switch_db.py status
echo.
pause
goto :menu

:sync_data
echo.
python backend\switch_db.py sync
echo.
pause
goto :menu

:run_remote
echo.
echo Configurando e iniciando backend en modo REMOTO...
python backend\switch_db.py remote
call start-backend-remote.bat
goto :menu

:run_local
echo.
echo Configurando e iniciando backend en modo LOCAL...
python backend\switch_db.py local
call start-backend.bat
goto :menu
