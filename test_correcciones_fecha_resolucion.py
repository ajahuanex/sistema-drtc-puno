#!/usr/bin/env python3
"""
Script de prueba para verificar las correcciones en el manejo de fechas
- FECHA_RESOLUCION es opcional
- FECHA_INICIO_VIGENCIA es obligatoria y se usa para cálculos
- Columna ESTADO al final
"""

import pandas as pd
import sys
import os
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_validacion_fecha_opcional():
    """Probar que la validación funciona con fecha de resolución opcional"""
    
    print("🧪 Probando validación con fecha de resolución opcional...")
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Crear DataFrame de prueba con fecha de resolución vacía
        datos_prueba = [
            {
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': '0001-2025',
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': '',  # VACÍA - debe ser válido
                'FECHA_INICIO_VIGENCIA': '01/01/2025',
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': '31/12/2028',
                'ESTADO': 'ACTIVA'
            },
            {
                'RUC_EMPRESA_ASOCIADA': '20987654321',
                'RESOLUCION_NUMERO': '0002-2025',
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': '15/01/2025',  # CON FECHA - debe ser válido
                'FECHA_INICIO_VIGENCIA': '15/01/2025',
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': '14/01/2029',
                'ESTADO': 'ACTIVA'
            }
        ]
        
        df_prueba = pd.DataFrame(datos_prueba)
        
        # Validar usando el servicio
        resultado = ResolucionPadresService.validar_plantilla_padres(df_prueba)
        
        print(f"✅ Validación completada:")
        print(f"   - Válido: {resultado['valido']}")
        print(f"   - Errores: {len(resultado['errores'])}")
        print(f"   - Advertencias: {len(resultado['advertencias'])}")
        
        if resultado['errores']:
            print("❌ Errores encontrados:")
            for error in resultado['errores']:
                print(f"   - {error}")
        
        if resultado['advertencias']:
            print("⚠️ Advertencias:")
            for advertencia in resultado['advertencias']:
                print(f"   - {advertencia}")
        
        return resultado['valido']
        
    except Exception as e:
        print(f"❌ Error en la prueba: {str(e)}")
        return False

def test_orden_columnas():
    """Probar que el orden de columnas es correcto (ESTADO al final)"""
    
    print("\n🧪 Probando orden de columnas...")
    
    try:
        # Ejecutar el script de creación de plantilla
        import subprocess
        result = subprocess.run(
            ["python", "crear_plantilla_resoluciones_padres.py"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        if result.returncode != 0:
            print(f"❌ Error ejecutando script: {result.stderr}")
            return False
        
        # Buscar el archivo generado
        import glob
        archivos_plantilla = glob.glob("plantilla_resoluciones_padres_*.xlsx")
        
        if not archivos_plantilla:
            print("❌ No se encontró archivo de plantilla generado")
            return False
        
        archivo_plantilla = archivos_plantilla[-1]  # El más reciente
        print(f"📄 Verificando archivo: {archivo_plantilla}")
        
        # Leer y verificar columnas
        df = pd.read_excel(archivo_plantilla, sheet_name='Resoluciones_Padres')
        columnas = list(df.columns)
        
        print("📋 Columnas encontradas:")
        for i, col in enumerate(columnas, 1):
            print(f"   {i}. {col}")
        
        # Verificar que ESTADO esté al final
        if columnas[-1] == 'ESTADO':
            print("✅ ESTADO está correctamente al final")
            estado_correcto = True
        else:
            print(f"❌ ESTADO no está al final. Última columna: {columnas[-1]}")
            estado_correcto = False
        
        # Verificar que FECHA_INICIO_VIGENCIA esté antes que FECHA_FIN_VIGENCIA
        try:
            idx_inicio = columnas.index('FECHA_INICIO_VIGENCIA')
            idx_fin = columnas.index('FECHA_FIN_VIGENCIA')
            if idx_inicio < idx_fin:
                print("✅ FECHA_INICIO_VIGENCIA está antes que FECHA_FIN_VIGENCIA")
                orden_fechas_correcto = True
            else:
                print("❌ Orden de fechas incorrecto")
                orden_fechas_correcto = False
        except ValueError as e:
            print(f"❌ Error verificando orden de fechas: {e}")
            orden_fechas_correcto = False
        
        return estado_correcto and orden_fechas_correcto
        
    except Exception as e:
        print(f"❌ Error en la prueba: {str(e)}")
        return False

def test_coherencia_fechas():
    """Probar que la validación de coherencia de fechas funciona correctamente"""
    
    print("\n🧪 Probando validación de coherencia de fechas...")
    
    try:
        from backend.app.utils.resolucion_utils import validar_coherencia_fechas
        from datetime import datetime
        
        # Caso 1: Sin fecha de resolución (debe ser válido)
        fecha_inicio = datetime(2025, 1, 1)
        fecha_fin = datetime(2028, 12, 31)
        anios_vigencia = 4
        
        es_valido, mensaje = validar_coherencia_fechas(
            fecha_inicio, fecha_fin, anios_vigencia, None
        )
        
        print(f"📅 Caso 1 - Sin fecha resolución:")
        print(f"   - Válido: {es_valido}")
        print(f"   - Mensaje: {mensaje}")
        
        # Caso 2: Con fecha de resolución válida
        fecha_resolucion = datetime(2024, 12, 15)  # Antes del inicio
        
        es_valido2, mensaje2 = validar_coherencia_fechas(
            fecha_inicio, fecha_fin, anios_vigencia, fecha_resolucion
        )
        
        print(f"📅 Caso 2 - Con fecha resolución válida:")
        print(f"   - Válido: {es_valido2}")
        print(f"   - Mensaje: {mensaje2}")
        
        # Caso 3: Con fecha de resolución inválida (posterior al inicio)
        fecha_resolucion_invalida = datetime(2025, 2, 1)  # Después del inicio
        
        es_valido3, mensaje3 = validar_coherencia_fechas(
            fecha_inicio, fecha_fin, anios_vigencia, fecha_resolucion_invalida
        )
        
        print(f"📅 Caso 3 - Con fecha resolución inválida:")
        print(f"   - Válido: {es_valido3}")
        print(f"   - Mensaje: {mensaje3}")
        
        return es_valido and es_valido2 and not es_valido3
        
    except Exception as e:
        print(f"❌ Error en la prueba: {str(e)}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    
    print("🚀 Iniciando pruebas de correcciones de fecha de resolución")
    print("=" * 60)
    
    # Ejecutar pruebas
    prueba1 = test_validacion_fecha_opcional()
    prueba2 = test_orden_columnas()
    prueba3 = test_coherencia_fechas()
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS:")
    print(f"   ✅ Validación fecha opcional: {'PASS' if prueba1 else 'FAIL'}")
    print(f"   ✅ Orden de columnas: {'PASS' if prueba2 else 'FAIL'}")
    print(f"   ✅ Coherencia de fechas: {'PASS' if prueba3 else 'FAIL'}")
    
    todas_exitosas = prueba1 and prueba2 and prueba3
    
    if todas_exitosas:
        print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("✅ Las correcciones están funcionando correctamente:")
        print("   - FECHA_RESOLUCION es opcional")
        print("   - FECHA_INICIO_VIGENCIA es obligatoria para cálculos")
        print("   - Columna ESTADO está al final")
    else:
        print("\n❌ Algunas pruebas fallaron. Revisar las correcciones.")
    
    return todas_exitosas

if __name__ == "__main__":
    exito = main()
    sys.exit(0 if exito else 1)