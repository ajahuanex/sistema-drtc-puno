@echo off
echo ========================================
echo  Instalando dependencias del mapa magico
echo ========================================
echo.

cd /d "%~dp0"

echo Instalando leaflet.markercluster...
call npm install leaflet.markercluster@^1.5.3 --save

echo.
echo Instalando leaflet-polylinedecorator...
call npm install leaflet-polylinedecorator@^1.6.0 --save

echo.
echo Instalando tipos de TypeScript...
call npm install @types/leaflet.markercluster@^1.5.4 --save

echo.
echo ========================================
echo  Instalacion completada exitosamente!
echo ========================================
echo.
echo Las siguientes caracteristicas estan disponibles:
echo  - Clusters inteligentes de marcadores
echo  - Lineas animadas con flechas direccionales
echo  - Marcadores personalizados con iconos
echo  - Panel de estadisticas en tiempo real
echo  - Controles interactivos de visualizacion
echo.
echo Ejecuta 'npm start' para ver los cambios
echo.
pause
