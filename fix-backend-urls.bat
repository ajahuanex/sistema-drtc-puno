@echo off
echo.
echo ========================================
echo   ACTUALIZANDO URLs DEL BACKEND
echo ========================================
echo.

echo Actualizando servicios principales...
powershell -Command "(Get-Content frontend/src/app/services/auth.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/auth.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/empresa.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/empresa.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/expediente.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/expediente.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/localidad.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/localidad.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/resolucion.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/resolucion.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/ruta.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/ruta.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/tuc.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/tuc.service.ts"

echo Actualizando servicios de integracion...
powershell -Command "(Get-Content frontend/src/app/services/data-manager-client.service.ts) -replace 'http://localhost:8000', 'http://localhost:8001' | Set-Content frontend/src/app/services/data-manager-client.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/resolucion-bajas-integration.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/resolucion-bajas-integration.service.ts"

echo Actualizando servicios de Mesa Partes...
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/documento.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/mesa-partes/documento.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/derivacion.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/mesa-partes/derivacion.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/notificacion.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/mesa-partes/notificacion.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/notificacion.service.ts) -replace 'ws://localhost:8000/ws', 'ws://localhost:8001/ws' | Set-Content frontend/src/app/services/mesa-partes/notificacion.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/integracion.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/mesa-partes/integracion.service.ts"
powershell -Command "(Get-Content frontend/src/app/services/mesa-partes/reporte.service.ts) -replace 'http://localhost:8000/api/v1', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/mesa-partes/reporte.service.ts"

echo Actualizando eager-init.service...
powershell -Command "(Get-Content frontend/src/app/services/eager-init.service.ts) -replace 'http://localhost:8003', 'http://localhost:8001/api/v1' | Set-Content frontend/src/app/services/eager-init.service.ts"

echo.
echo ========================================
echo   URLs ACTUALIZADAS
echo ========================================
echo.

echo Reiniciando contenedor frontend...
docker-compose -f docker-compose.local.yml restart frontend

echo.
echo ========================================
echo   COMPLETADO
echo ========================================
echo.
echo Espera 1-2 minutos para que Angular recompile
echo Luego recarga la pagina con Ctrl+F5
echo.
pause
