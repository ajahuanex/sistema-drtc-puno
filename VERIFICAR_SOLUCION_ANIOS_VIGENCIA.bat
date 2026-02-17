@echo off
echo ========================================
echo VERIFICACION: Solucion Anios Vigencia
echo ========================================
echo.

echo 1. Probando normalizacion de columnas...
python test_correccion_anios_vigencia.py
echo.

echo 2. Generando plantilla actualizada...
python generar_plantilla_vigencia_actualizada.py
echo.

echo ========================================
echo VERIFICACION COMPLETADA
echo ========================================
echo.
echo Archivos generados:
echo - plantilla_resoluciones_vigencia_*.xlsx
echo.
echo Proximos pasos:
echo 1. Usar la plantilla generada para cargar resoluciones
echo 2. Verificar en el frontend que los anios se guardaron correctamente
echo 3. Ejecutar: python verificar_anios_vigencia_bd.py (requiere MongoDB)
echo.
pause
