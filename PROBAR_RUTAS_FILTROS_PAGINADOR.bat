@echo off
echo ========================================
echo PROBANDO FILTROS Y PAGINADOR DE RUTAS
echo ========================================
echo.

echo 1. Iniciando el sistema completo...
echo.

echo Iniciando MongoDB...
start "MongoDB" cmd /c "cd backend && python -c \"from app.database.connection import get_database; print('MongoDB conectado')\" && pause"

timeout /t 3 /nobreak >nul

echo Iniciando Backend...
start "Backend" cmd /c "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak >nul

echo Iniciando Frontend...
start "Frontend" cmd /c "cd frontend && ng serve --host 0.0.0.0 --port 4200"

timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo SISTEMA INICIADO - INSTRUCCIONES DE PRUEBA
echo ========================================
echo.
echo 1. Abrir navegador en: http://localhost:4200/rutas
echo.
echo 2. PROBAR FILTROS:
echo    - Buscar empresa por RUC o razon social
echo    - Seleccionar empresa del dropdown
echo    - Verificar que se carguen las resoluciones
echo    - Seleccionar una resolucion especifica
echo    - Verificar que se filtren las rutas correctamente
echo.
echo 3. PROBAR PAGINADOR:
echo    - Cambiar tamano de pagina (5, 10, 25, 50, 100)
echo    - Navegar entre paginas usando los botones
echo    - Verificar contador "Mostrando X de Y rutas"
echo    - Probar con filtros activos
echo.
echo 4. PROBAR COMBINACION:
echo    - Aplicar filtro por empresa
echo    - Verificar que paginador se resetee
echo    - Navegar paginas con filtro activo
echo    - Cambiar tamano de pagina con filtro
echo.
echo 5. PROBAR RESPONSIVE:
echo    - Reducir tamano de ventana
echo    - Verificar scroll horizontal de tabla
echo    - Verificar adaptacion del paginador
echo.
echo ========================================
echo FUNCIONALIDADES IMPLEMENTADAS:
echo ========================================
echo [✓] Filtro por empresa con autocompletado
echo [✓] Filtro por resolucion (padre/hijas)
echo [✓] Paginador completo con navegacion
echo [✓] Selector de tamano de pagina
echo [✓] Informacion de paginacion
echo [✓] Integracion filtros + paginador
echo [✓] Diseno responsive
echo [✓] Estilos CSS profesionales
echo [✓] Manejo de errores
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start http://localhost:4200/rutas

echo.
echo ¡Sistema listo para probar!
echo Revisa las ventanas del backend y frontend para ver los logs.
echo.
pause