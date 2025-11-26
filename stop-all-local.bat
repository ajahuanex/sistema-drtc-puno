@echo off
echo ========================================
echo Deteniendo Servicios Locales
echo ========================================
echo.

echo Deteniendo MongoDB en Docker...
docker-compose -f docker-compose.db-only.yml down

if %errorlevel% equ 0 (
    echo [OK] MongoDB detenido
) else (
    echo [ADVERTENCIA] No se pudo detener MongoDB o ya estaba detenido
)

echo.
echo ========================================
echo Servicios detenidos
echo ========================================
echo.
echo NOTA: El Backend y Frontend deben cerrarse manualmente
echo       cerrando sus ventanas de terminal o presionando Ctrl+C
echo.

pause
