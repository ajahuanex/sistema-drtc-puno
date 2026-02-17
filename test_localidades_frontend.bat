@echo off
REM Script de Prueba Rápida - Módulo de Localidades
REM Windows Batch Script

echo ========================================
echo   PRUEBA RAPIDA - MODULO DE LOCALIDADES
echo ========================================
echo.

REM Verificar Backend
echo [1/4] Verificando Backend...
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
echo [2/4] Verificando Frontend...
curl -s http://localhost:4200 >nul 2>&1
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Frontend no esta corriendo en puerto 4200
    echo Ejecuta: cd frontend ^& npm start
) else (
    echo OK: Frontend corriendo
)
echo.

REM Verificar localidades en MongoDB
echo [3/4] Verificando localidades en MongoDB...
python verificar_localidades_actual.py
echo.

REM Abrir navegador
echo [4/4] Abriendo módulo de localidades...
echo.
start http://localhost:4200/localidades
echo.

echo ========================================
echo   PRUEBAS A REALIZAR
echo ========================================
echo.
echo 1. Verificar que se muestran 108 localidades
echo 2. Probar búsqueda por nombre (ej: "PUNO")
echo 3. Probar filtros por provincia
echo 4. Probar paginación
echo 5. Ver detalle de una localidad
echo 6. Crear nueva localidad (opcional)
echo 7. Editar localidad (opcional)
echo.
echo Consulta LOCALIDADES_LISTAS.md para más detalles
echo.

pause
