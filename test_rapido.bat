@echo off
REM Script de Prueba Rápida - Sistema de Vehículos
REM Windows Batch Script

echo ========================================
echo   PRUEBA RAPIDA - SISTEMA DE VEHICULOS
echo ========================================
echo.

REM Verificar Python
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no esta instalado
    pause
    exit /b 1
)
echo OK: Python instalado
echo.

REM Verificar Backend
echo [2/5] Verificando Backend...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend no esta corriendo en puerto 8000
    echo Ejecuta: cd backend ^& uvicorn app.main:app --reload
    pause
    exit /b 1
)
echo OK: Backend corriendo
echo.

REM Verificar Frontend
echo [3/5] Verificando Frontend...
curl -s http://localhost:4200 >nul 2>&1
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Frontend no esta corriendo en puerto 4200
    echo Ejecuta: cd frontend ^& npm start
) else (
    echo OK: Frontend corriendo
)
echo.

REM Ejecutar pruebas automatizadas
echo [4/5] Ejecutando pruebas automatizadas...
echo.
python test_sistema_vehiculos.py
set TEST_RESULT=%errorlevel%
echo.

REM Resultado final
echo [5/5] Resultado final...
echo.
if %TEST_RESULT% equ 0 (
    echo ========================================
    echo   TODAS LAS PRUEBAS PASARON
    echo ========================================
    echo.
    echo El sistema esta funcionando correctamente.
    echo Puedes continuar con las pruebas manuales en:
    echo   - Frontend: http://localhost:4200
    echo   - API Docs: http://localhost:8000/docs
) else (
    echo ========================================
    echo   ALGUNAS PRUEBAS FALLARON
    echo ========================================
    echo.
    echo Revisa los errores arriba para mas detalles.
    echo.
    echo Pasos sugeridos:
    echo 1. Verifica que MongoDB este corriendo
    echo 2. Verifica que haya al menos 1 empresa creada
    echo 3. Revisa los logs del backend
)
echo.

pause
