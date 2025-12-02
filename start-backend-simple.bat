@echo off
chcp 65001 >nul
echo ========================================
echo Iniciando Backend Local (FastAPI)
echo ========================================
echo.

cd backend

REM Verificar si existe el entorno virtual
if not exist venv (
    echo Creando entorno virtual de Python...
    python -m venv venv
    echo [OK] Entorno virtual creado
    echo.
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando/actualizando dependencias...
pip install -r requirements.txt >nul 2>&1

echo.
echo ========================================
echo BACKEND CONFIGURADO
echo ========================================
echo.
echo MongoDB URL: mongodb://admin:admin123@localhost:27017/
echo Puerto: 8000
echo Modo: Development (DEBUG=true)
echo.
echo NOTA: Si MongoDB no está corriendo, el backend
echo      intentará conectarse y mostrará advertencias.
echo      Inicia Docker Desktop y MongoDB primero.
echo.
echo ========================================
echo.

REM Configurar variables de entorno
set MONGODB_URL=mongodb://admin:admin123@localhost:27017/
set SECRET_KEY=dev-secret-key-change-in-production
set ENVIRONMENT=development
set DEBUG=true
set ALLOWED_ORIGINS=http://localhost:4200,http://localhost:80

echo Iniciando servidor FastAPI...
echo.
echo El backend estará disponible en:
echo   - API: http://localhost:8000
echo   - Documentación: http://localhost:8000/docs
echo.

REM Iniciar el servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
