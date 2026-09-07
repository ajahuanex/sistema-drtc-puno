@echo off
chcp 65001 > nul
title Instalacion e Indexacion Vectorial del Codigo - DRTC Puno

echo ========================================================
echo   INSTALACION DE BUSQUEDA VECTORIAL Y AGENTES DRTC PUNO
echo ========================================================
echo.

echo [1/3] Verificando entorno Python...
python --version
if %errorlevel% neq 0 (
    echo Error: Python no esta instalado o no se encuentra en el PATH.
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando librerias de indexacion y empaquetado de tokens...
pip install sentence-transformers chromadb scikit-learn numpy --quiet --suppress-output
npx -y repomix --version > nul 2>&1

echo.
echo [3/3] Generando indice vectorial del codigo del proyecto...
python scripts/vector_code_indexer.py

echo.
echo ========================================================
echo   ¡INDEXACION VECTORIAL COMPLETADA CON EXITO!
echo ========================================================
echo.
echo Para buscar codigo semánticamente y ahorrar tokens:
echo   python scripts/vector_code_search.py "logica de resoluciones"
echo.
pause
