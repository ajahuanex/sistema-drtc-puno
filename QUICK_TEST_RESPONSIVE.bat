@echo off
echo.
echo ========================================
echo   QUICK TEST - RESPONSIVE DESIGN
echo ========================================
echo.

echo Abriendo aplicacion en navegador...
start http://localhost:4201

echo.
echo ========================================
echo   INSTRUCCIONES DE TESTING
echo ========================================
echo.
echo 1. ACTIVAR MODO RESPONSIVE:
echo    - Presiona F12 (DevTools)
echo    - Presiona Ctrl+Shift+M (Modo responsive)
echo.
echo 2. PROBAR TAMAÑOS:
echo    Mobile:  375px, 390px, 412px
echo    Tablet:  768px, 1024px
echo    Desktop: 1280px, 1920px
echo.
echo 3. VERIFICAR EN MOBILE (^<768px):
echo    - Vista de cards (no tabla)
echo    - Boton "Filtros" en toolbar
echo    - Modal fullscreen de filtros
echo    - Filtros rapidos funcionando
echo    - Chips de filtros activos
echo    - Menu de acciones en cards
echo.
echo 4. VERIFICAR EN TABLET (768-1024px):
echo    - Tabla con scroll horizontal
echo    - Selector de columnas touch-optimized
echo    - Touch targets grandes (44x44px)
echo.
echo 5. VERIFICAR EN DESKTOP (^>1024px):
echo    - Tabla completa visible
echo    - Expansion panel de filtros
echo    - Todas las columnas accesibles
echo.
echo ========================================
echo   TESTING DE ACCESIBILIDAD
echo ========================================
echo.
echo 1. NAVEGACION POR TECLADO:
echo    Tab       - Navegar elementos
echo    Shift+Tab - Navegar atras
echo    Enter     - Activar elemento
echo    Espacio   - Seleccionar
echo    Escape    - Cerrar modal
echo.
echo 2. LIGHTHOUSE AUDIT:
echo    F12 ^> Lighthouse ^> Accessibility ^> Run
echo    Objetivo: Score ^>90
echo.
echo 3. AXE DEVTOOLS:
echo    Instalar extension "axe DevTools"
echo    F12 ^> axe DevTools ^> Scan
echo    Objetivo: 0 violations
echo.
echo ========================================
echo.
pause
