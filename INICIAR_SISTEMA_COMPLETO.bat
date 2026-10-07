@echo off
echo ========================================
echo   SISTEMA SIRRETT - INICIO COMPLETO
echo ========================================
echo.

echo 🔍 Verificando MongoDB...
python -c "
import pymongo
try:
    client = pymongo.MongoClient('mongodb://admin:admin123@localhost:27017', serverSelectionTimeoutMS=3000)
    client.server_info()
    print('✅ MongoDB conectado correctamente')
    db = client['sirret_db']
    vehiculos_count = db.vehiculos.count_documents({})
    empresas_count = db.empresas.count_documents({})
    print(f'📊 Datos disponibles: {vehiculos_count} vehículos, {empresas_count} empresas')
    client.close()
except Exception as e:
    print(f'❌ Error MongoDB: {e}')
    print('💡 Asegúrate de que MongoDB esté corriendo')
    pause
    exit(1)
"

echo.
echo 🚀 Iniciando Backend (FastAPI)...
start "Backend SIRRETT" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ⏳ Esperando que el backend inicie...
timeout /t 5 /nobreak > nul

echo.
echo 🔍 Verificando Backend...
python -c "
import requests
import time
for i in range(10):
    try:
        response = requests.get('http://localhost:8000/health', timeout=3)
        if response.status_code == 200:
            print('✅ Backend iniciado correctamente')
            data = response.json()
            print(f'📊 Estado: {data.get(\"status\")}')
            print(f'🗄️ Base de datos: {data.get(\"database_status\")}')
            break
    except:
        print(f'⏳ Intento {i+1}/10 - Esperando backend...')
        time.sleep(2)
else:
    print('❌ Backend no responde después de 10 intentos')
"

echo.
echo 🎨 Iniciando Frontend (Angular)...
start "Frontend SIRRETT" cmd /k "cd frontend && ng serve --host 0.0.0.0 --port 4200 --open"

echo.
echo ========================================
echo   SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo 🌐 URLs del sistema:
echo   • Frontend: http://localhost:4200
echo   • Backend API: http://localhost:8000
echo   • Documentación API: http://localhost:8000/docs
echo   • MongoDB: mongodb://localhost:27017
echo.
echo 📊 Estado actual:
echo   • Base de datos: MongoDB conectada
echo   • Backend: FastAPI corriendo
echo   • Frontend: Angular iniciando...
echo.
echo ⚠️  IMPORTANTE:
echo   • El frontend tardará unos minutos en compilar
echo   • Una vez listo, se abrirá automáticamente en el navegador
echo   • Usa Ctrl+C en cada ventana para detener los servicios
echo.
echo 🔧 Para desarrollo:
echo   • Backend con hot-reload habilitado
echo   • Frontend con live-reload habilitado
echo   • Cambios se reflejan automáticamente
echo.
pause