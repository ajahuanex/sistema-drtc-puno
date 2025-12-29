@echo off
echo ========================================
echo   SETUP HISTORIAL VEHICULAR - DRTC PUNO
echo ========================================
echo.

echo 🚀 Configurando historial vehicular en MongoDB...
echo.

REM Verificar si MongoDB está ejecutándose
echo 🔍 Verificando conexión a MongoDB...
mongo --eval "db.adminCommand('ping')" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB no está ejecutándose o no es accesible
    echo    Asegúrate de que MongoDB esté iniciado en localhost:27017
    pause
    exit /b 1
)
echo ✅ MongoDB está ejecutándose

echo.
echo 📋 Opciones disponibles:
echo    1. Agregar colección de historial vehicular (recomendado)
echo    2. Inicializar base de datos completa con historial
echo    3. Generar datos de ejemplo del historial
echo    4. Ejecutar todo (1 + 3)
echo.

set /p opcion="Selecciona una opción (1-4): "

if "%opcion%"=="1" goto agregar_historial
if "%opcion%"=="2" goto init_completo
if "%opcion%"=="3" goto generar_datos
if "%opcion%"=="4" goto ejecutar_todo
goto opcion_invalida

:agregar_historial
echo.
echo 📝 Agregando colección de historial vehicular...
mongo drtc_puno < scripts/add-historial-vehicular.js
if %errorlevel% equ 0 (
    echo ✅ Colección de historial vehicular agregada exitosamente
) else (
    echo ❌ Error agregando colección de historial vehicular
)
goto fin

:init_completo
echo.
echo 🏗️ Inicializando base de datos completa con historial vehicular...
echo ⚠️ ADVERTENCIA: Esto recreará la base de datos completa
set /p confirmar="¿Estás seguro? (s/N): "
if /i not "%confirmar%"=="s" goto cancelado

mongo < scripts/init-mongo-historial.js
if %errorlevel% equ 0 (
    echo ✅ Base de datos inicializada exitosamente con historial vehicular
) else (
    echo ❌ Error inicializando base de datos
)
goto fin

:generar_datos
echo.
echo 📊 Generando datos de ejemplo del historial vehicular...
python scripts/generar_historial_vehicular.py
if %errorlevel% equ 0 (
    echo ✅ Datos de ejemplo generados exitosamente
) else (
    echo ❌ Error generando datos de ejemplo
    echo    Asegúrate de tener Python y pymongo instalados
)
goto fin

:ejecutar_todo
echo.
echo 🔄 Ejecutando configuración completa...
echo.
echo 📝 Paso 1: Agregando colección de historial vehicular...
mongo drtc_puno < scripts/add-historial-vehicular.js
if %errorlevel% neq 0 (
    echo ❌ Error en paso 1
    goto fin
)

echo.
echo 📊 Paso 2: Generando datos de ejemplo...
python scripts/generar_historial_vehicular.py
if %errorlevel% neq 0 (
    echo ❌ Error en paso 2
    goto fin
)

echo ✅ Configuración completa exitosa
goto fin

:opcion_invalida
echo ❌ Opción inválida
goto fin

:cancelado
echo ⏹️ Operación cancelada
goto fin

:fin
echo.
echo ========================================
echo   CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo 📋 Próximos pasos:
echo    1. Reinicia el backend para que reconozca la nueva colección
echo    2. Verifica el historial vehicular en el frontend
echo    3. Los nuevos eventos se registrarán automáticamente
echo.
pause