@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          VERIFICACIÓN DE BASE DE DATOS MONGODB                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si MongoDB está corriendo
docker ps --filter "name=sirret-mongodb-local" --format "{{.Names}}" | findstr "sirret-mongodb-local" >nul 2>&1
if errorlevel 1 (
    echo ❌ MongoDB no está corriendo
    echo.
    echo Ejecuta primero: INICIAR_SISTEMA_COMPLETO.bat
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB está corriendo
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║              INFORMACIÓN DEL CONTENEDOR                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
docker ps --filter "name=sirret-mongodb-local" --format "Contenedor: {{.Names}}"
docker ps --filter "name=sirret-mongodb-local" --format "Estado: {{.Status}}"
docker ps --filter "name=sirret-mongodb-local" --format "Puerto: {{.Ports}}"
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║              VERIFICANDO COLECCIONES                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Conectando a MongoDB...
echo.

REM Ejecutar comando para listar colecciones
docker exec sirret-mongodb-local mongosh --quiet --username admin --password admin123 --authenticationDatabase admin sirret_db --eval "db.getCollectionNames().forEach(function(col) { print(col + ': ' + db[col].countDocuments() + ' documentos'); })"

if errorlevel 1 (
    echo.
    echo ⚠️  No se pudo conectar a MongoDB o la base de datos está vacía
    echo.
    echo Esto es normal si es la primera vez que usas el sistema.
    echo La base de datos se llenará cuando crees datos desde el frontend.
) else (
    echo.
    echo ✅ Conexión exitosa a MongoDB
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              INFORMACIÓN DE CONEXIÓN                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo URL de conexión: mongodb://admin:admin123@localhost:27017
echo Base de datos: sirret_db
echo Usuario: admin
echo Password: admin123
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              HERRAMIENTAS RECOMENDADAS                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Para explorar la base de datos visualmente, puedes usar:
echo.
echo 1. MongoDB Compass (Recomendado)
echo    - Descarga: https://www.mongodb.com/try/download/compass
echo    - Conecta con: mongodb://admin:admin123@localhost:27017
echo.
echo 2. Desde línea de comandos:
echo    docker exec -it sirret-mongodb-local mongosh -u admin -p admin123
echo.
echo 3. Desde el backend API:
echo    http://localhost:8000/docs
echo.
pause
