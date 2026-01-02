@echo off
echo ======================================================================
echo   SISTEMA SIRRET - INICIO RAPIDO
echo ======================================================================
echo.

echo [1/3] Verificando MongoDB...
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://admin:admin123@localhost:27017/'); client.admin.command('ping'); print('✅ MongoDB conectado')" 2>nul
if errorlevel 1 (
    echo ❌ MongoDB no esta corriendo
    echo    Inicia MongoDB primero con: start-mongodb.bat
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando usuario administrador...
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://admin:admin123@localhost:27017/'); db = client['sirret_db']; usuario = db.usuarios.find_one({'dni': '12345678'}); print('✅ Usuario administrador existe' if usuario else '⚠️  Usuario no encontrado')"

echo.
echo [3/3] Verificando empresas...
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://admin:admin123@localhost:27017/'); db = client['sirret_db']; count = db.empresas.count_documents({}); print(f'✅ {count} empresas en la base de datos')"

echo.
echo ======================================================================
echo   CREDENCIALES DE ACCESO
echo ======================================================================
echo   DNI:        12345678
echo   Contraseña: admin123
echo   URL:        http://localhost:4200
echo ======================================================================
echo.

echo ¿Deseas abrir el sistema en el navegador? (S/N)
set /p ABRIR=
if /i "%ABRIR%"=="S" (
    echo.
    echo 🌐 Abriendo navegador...
    start http://localhost:4200
)

echo.
echo ✅ Sistema listo para usar
echo.
pause
