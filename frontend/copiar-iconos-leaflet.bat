@echo off
echo ========================================
echo  Copiando iconos de Leaflet a assets
echo ========================================
echo.

cd /d "%~dp0"

echo Creando directorio assets si no existe...
if not exist "src\assets" mkdir "src\assets"

echo Copiando marker-icon.png...
copy "node_modules\leaflet\dist\images\marker-icon.png" "src\assets\marker-icon.png" /Y

echo Copiando marker-icon-2x.png...
copy "node_modules\leaflet\dist\images\marker-icon-2x.png" "src\assets\marker-icon-2x.png" /Y

echo Copiando marker-shadow.png...
copy "node_modules\leaflet\dist\images\marker-shadow.png" "src\assets\marker-shadow.png" /Y

echo.
echo ========================================
echo  Iconos copiados exitosamente!
echo ========================================
echo.
echo Los iconos ahora estan en:
echo   src\assets\marker-icon.png
echo   src\assets\marker-icon-2x.png
echo   src\assets\marker-shadow.png
echo.
echo Reinicia el servidor si esta corriendo:
echo   npm start
echo.
pause
