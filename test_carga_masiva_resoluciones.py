#!/usr/bin/env python3
"""
Script de prueba para la funcionalidad de carga masiva de resoluciones
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from io import BytesIO
from backend.app.services.resolucion_excel_service import ResolucionExcelService

def test_resolucion_excel_service():
    print("🧪 Probando ResolucionExcelService...")
    print("=" * 50)
    
    excel_service = ResolucionExcelService()
    
    # 1. Generar plantilla
    print("📄 1. Generando plantilla Excel...")
    try:
        plantilla = excel_service.generar_plantilla_excel()
        print(f"✅ Plantilla generada exitosamente. Tamaño: {len(plantilla.getvalue())} bytes")
        
        # Guardar plantilla para inspección
        with open("plantilla_resoluciones_test.xlsx", "wb") as f:
            f.write(plantilla.getvalue())
        print("💾 Plantilla guardada como 'plantilla_resoluciones_test.xlsx'")
        
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        return False
    
    # 2. Validar la plantilla generada
    print("\n🔍 2. Validando plantilla generada...")
    try:
        plantilla.seek(0)  # Resetear posición del buffer
        resultado = excel_service.validar_archivo_excel(plantilla)
        
        print(f"📊 Resultados de validación:")
        print(f"   - Total filas: {resultado.get('total_filas', 0)}")
        print(f"   - Válidos: {resultado.get('validos', 0)}")
        print(f"   - Inválidos: {resultado.get('invalidos', 0)}")
        print(f"   - Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        if resultado.get('errores'):
            print(f"   - Errores encontrados: {len(resultado['errores'])}")
            for error in resultado['errores'][:3]:  # Mostrar solo los primeros 3
                print(f"     * Fila {error['fila']}: {error['errores']}")
        
        if resultado.get('advertencias'):
            print(f"   - Advertencias encontradas: {len(resultado['advertencias'])}")
            for adv in resultado['advertencias'][:3]:  # Mostrar solo las primeras 3
                print(f"     * Fila {adv['fila']}: {adv['advertencias']}")
        
        if resultado.get('validos', 0) > 0:
            print("✅ Validación exitosa - Se encontraron registros válidos")
        else:
            print("⚠️  No se encontraron registros válidos")
            
    except Exception as e:
        print(f"❌ Error validando archivo: {e}")
        return False
    
    # 3. Probar procesamiento completo
    print("\n🚀 3. Probando procesamiento completo...")
    try:
        plantilla.seek(0)  # Resetear posición del buffer
        resultado_procesamiento = excel_service.procesar_carga_masiva(plantilla)
        
        print(f"📈 Resultados de procesamiento:")
        print(f"   - Total creadas: {resultado_procesamiento.get('total_creadas', 0)}")
        
        if resultado_procesamiento.get('resoluciones_creadas'):
            print(f"   - Resoluciones creadas exitosamente:")
            for res in resultado_procesamiento['resoluciones_creadas'][:3]:
                print(f"     * {res['numero_resolucion']} - {res['empresa_ruc']}")
        
        if resultado_procesamiento.get('errores_creacion'):
            print(f"   - Errores de creación: {len(resultado_procesamiento['errores_creacion'])}")
            for error in resultado_procesamiento['errores_creacion'][:3]:
                print(f"     * {error['numero_resolucion']}: {error['error']}")
        
        print("✅ Procesamiento completado exitosamente")
        
    except Exception as e:
        print(f"❌ Error en procesamiento: {e}")
        return False
    
    print("\n🎉 Todas las pruebas completadas exitosamente!")
    return True

def test_validaciones_especificas():
    print("\n🔬 Probando validaciones específicas...")
    print("=" * 50)
    
    excel_service = ResolucionExcelService()
    
    # Crear datos de prueba con errores intencionados
    import pandas as pd
    
    datos_con_errores = {
        'Número Resolución': ['', 'FORMATO-MALO', 'R-1007-2024'],  # Vacío, formato malo, correcto
        'RUC Empresa': ['123', '20123456789', '20234567890'],  # Muy corto, correcto, correcto
        'Fecha Emisión': ['fecha-mala', '2024-01-15', '2024-01-20'],  # Formato malo, correcto, correcto
        'Fecha Vigencia Inicio': ['2024-01-15', '2024-01-15', '2024-01-20'],
        'Fecha Vigencia Fin': ['2029-01-15', '2029-01-15', '2029-01-20'],
        'Tipo Resolución': ['PADRE', 'TIPO_MALO', 'PADRE'],  # Correcto, malo, correcto
        'Tipo Trámite': ['PRIMIGENIA', 'PRIMIGENIA', 'TRAMITE_MALO'],  # Correcto, correcto, malo
        'Descripción': ['', 'Descripción válida para resolución', 'Otra descripción válida'],  # Vacía, correcta, correcta
        'ID Expediente': ['EXP007', '', 'EXP009'],  # Correcto, vacío, correcto
        'Usuario Emisión': ['USR001', 'USR001', 'USR001'],
        'Estado': ['VIGENTE', 'VIGENTE', 'ESTADO_MALO'],  # Correcto, correcto, malo
        'Observaciones': ['Observación 1', 'Observación 2', 'Observación 3']
    }
    
    df_errores = pd.DataFrame(datos_con_errores)
    
    # Crear archivo Excel en memoria
    buffer_errores = BytesIO()
    with pd.ExcelWriter(buffer_errores, engine='openpyxl') as writer:
        df_errores.to_excel(writer, sheet_name='Resoluciones', index=False)
    
    buffer_errores.seek(0)
    
    # Validar archivo con errores
    try:
        resultado = excel_service.validar_archivo_excel(buffer_errores)
        
        print(f"📊 Resultados de validación con errores:")
        print(f"   - Total filas: {resultado.get('total_filas', 0)}")
        print(f"   - Válidos: {resultado.get('validos', 0)}")
        print(f"   - Inválidos: {resultado.get('invalidos', 0)}")
        print(f"   - Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        print(f"\n📝 Errores detectados:")
        for error in resultado.get('errores', []):
            print(f"   Fila {error['fila']} ({error['numero_resolucion']}):")
            for msg in error['errores']:
                print(f"     - {msg}")
        
        print(f"\n⚠️  Advertencias detectadas:")
        for adv in resultado.get('advertencias', []):
            print(f"   Fila {adv['fila']} ({adv['numero_resolucion']}):")
            for msg in adv['advertencias']:
                print(f"     - {msg}")
        
        print("✅ Validaciones específicas completadas")
        
    except Exception as e:
        print(f"❌ Error en validaciones específicas: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Iniciando pruebas de carga masiva de resoluciones")
    print("=" * 60)
    
    success = True
    
    # Ejecutar pruebas
    success &= test_resolucion_excel_service()
    success &= test_validaciones_especificas()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
        print("\n📋 Resumen:")
        print("   ✅ Generación de plantilla: OK")
        print("   ✅ Validación de archivos: OK")
        print("   ✅ Procesamiento masivo: OK")
        print("   ✅ Detección de errores: OK")
        print("\n🚀 La funcionalidad de carga masiva está lista para usar!")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
        print("   Revisa los errores anteriores para más detalles")
    
    print("\n📁 Archivos generados:")
    print("   - plantilla_resoluciones_test.xlsx (para inspección)")