@echo off
echo ========================================
echo REINICIAR SERVIDOR FRONTEND
echo ========================================
echo.
echo Este script reiniciara el servidor de desarrollo
echo para aplicar los cambios del modulo de vehiculos
echo.
echo IMPORTANTE: Asegurate de que el servidor este detenido
echo antes de ejecutar este script.
echo.
pause

echo.
echo Navegando a la carpeta frontend...
cd frontend

echo.
echo Limpiando cache de Angular...
if exist ".angular" (
    rmdir /s /q .angular
    echo ✓ Cache limpiado
) else (
    echo ⚠ No se encontro cache para limpiar
)

echo.
echo Iniciando servidor de desarrollo...
echo.
echo ========================================
echo SERVIDOR INICIANDO...
echo ========================================
echo.
echo Una vez que veas "Compiled successfully", abre:
echo   http://localhost:4200/vehiculos
echo.
echo Para detener el servidor: Ctrl+C
echo.
echo ========================================
echo.

npm start
