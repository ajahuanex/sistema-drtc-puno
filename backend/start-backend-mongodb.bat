@echo off
echo 🚀 Iniciando Backend con MongoDB
echo =================================

cd /d "%~dp0"

echo 📋 Configurando MongoDB local...
copy .env.local .env

echo 🔧 Verificando dependencias...
pip install -r requirements.txt

echo 🚀 Iniciando servidor FastAPI...
echo Backend disponible en: http://localhost:8000
echo Documentacion API: http://localhost:8000/docs
echo Base de datos: MongoDB (localhost:27017/drtc_db)
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause