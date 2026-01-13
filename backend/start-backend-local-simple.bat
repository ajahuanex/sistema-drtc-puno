@echo off
echo 🚀 Iniciando Backend Local (MongoDB sin autenticacion)
echo ================================================

cd /d "%~dp0"

echo 📋 Copiando configuracion local...
copy .env.local .env

echo 🔧 Instalando dependencias...
pip install -r requirements.txt

echo 🚀 Iniciando servidor FastAPI...
echo Backend disponible en: http://localhost:8000
echo Documentacion API: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause