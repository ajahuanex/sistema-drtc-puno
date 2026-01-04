@echo off
chcp 65001 >nul
echo ========================================
echo Iniciando Backend Local (FastAPI)
echo ========================================
echo.

REM Verificar si MongoDB está corriendo localmente
echo [1/4] Verificando MongoDB local...
netstat -an | findstr "27017" >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] MongoDB no está corriendo en puerto 27017
    echo Por favor, inicia MongoDB localmente primero
    echo.
    choice /C SN /M "¿Deseas continuar de todas formas?"
    if errorlevel 2 exit /b 1
) else (
    echo [OK] MongoDB está corriendo en puerto 27017
)
echo.

cd backend

REM Verificar si existe el entorno virtual
echo [2/4] Configurando entorno virtual de Python...
if not exist venv (
    echo Creando entorno virtual de Python...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual
        echo Verifica que Python esté instalado correctamente
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado
    echo.
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat
echo [OK] Entorno virtual activado
echo.

echo [3/4] Instalando/actualizando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

echo [4/4] Configurando variables de entorno...
REM Configurar variables de entorno para MongoDB local
set MONGODB_URL=mongodb://localhost:27017/sirret_db
set SECRET_KEY=dev-secret-key-change-in-production
set ENVIRONMENT=development
set DEBUG=true
set ALLOWED_ORIGINS=http://localhost:4200,http://localhost:80
echo [OK] Variables configuradas
echo.

echo ========================================
echo BACKEND CONFIGURADO
echo ========================================
echo.
echo MongoDB URL: mongodb://localhost:27017/sirret_db
echo Puerto: 8000
echo Modo: Development (DEBUG=true)
echo.
echo El backend estará disponible en:
echo   - API: http://localhost:8000
echo   - Documentación: http://localhost:8000/docs
echo   - Redoc: http://localhost:8000/redoc
echo.
echo ========================================
echo.

echo Iniciando servidor FastAPI...
echo.

REM Iniciar el servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000