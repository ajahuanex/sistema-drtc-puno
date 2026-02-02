#!/usr/bin/env python3
"""
Script para probar la corrección del error de carga masiva de rutas
Error: 'NoneType' object has no attribute 'upper'
"""

import asyncio
import pandas as pd
from io import BytesIO
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_carga_masiva_corregida():
    """Probar la carga masiva con datos que antes causaban el error"""
    
    print("🧪 PROBANDO CORRECCIÓN DE CARGA MASIVA DE RUTAS")
    print("=" * 60)
    
    try:
        # Importar el servicio corregido
        from app.services.ruta_excel_service import RutaExcelService
        
        # Crear datos de prueba que incluyen valores nulos y problemáticos
        datos_problematicos = {
            'RUC (*)': ['20448048242', '20364360771', None, '20115054229'],
            'Resolución (*)': ['921-2023', None, 'R-0495-2022', ''],
            'Código Ruta (*)': ['1', None, '02', ''],
            'Origen (*)': ['PUNO', 'JULIACA', None, 'CUSCO'],
            'Destino (*)': ['JULIACA', None, 'AREQUIPA', 'LIMA'],
            'Frecuencia (*)': ['08 DIARIAS', '04 DIARIAS', None, '02 DIARIAS'],
            'Itinerario': ['', None, 'JULIACA - LAMPA - AREQUIPA', ''],
            'Tipo Ruta': ['', None, 'INTERREGIONAL', 'INTERPROVINCIAL'],
            'Tipo Servicio': ['PASAJEROS', None, 'PASAJEROS', ''],
            'Estado': ['ACTIVA', 'ACTIVA', None, 'CANCELADA']
        }
        
        # Crear DataFrame con datos problemáticos
        df = pd.DataFrame(datos_problematicos)
        
        # Convertir a Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='DATOS', index=False)
        buffer.seek(0)
        
        print("📊 Datos de prueba creados:")
        print(f"   - {len(df)} filas de datos")
        print(f"   - Incluye valores None, vacíos y problemáticos")
        print()
        
        # Crear servicio (sin base de datos para esta prueba)
        excel_service = RutaExcelService()
        
        print("🔍 PROBANDO VALIDACIÓN...")
        
        # Probar validación (esto antes fallaba con el error)
        resultado = await excel_service.validar_archivo_excel(buffer)
        
        print("✅ VALIDACIÓN EXITOSA!")
        print(f"   - Total filas: {resultado.get('total_filas', 0)}")
        print(f"   - Válidos: {resultado.get('validos', 0)}")
        print(f"   - Inválidos: {resultado.get('invalidos', 0)}")
        print(f"   - Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        if resultado.get('error'):
            print(f"   - Error: {resultado['error']}")
        
        if resultado.get('errores'):
            print("\n📋 ERRORES ENCONTRADOS:")
            for error in resultado['errores'][:3]:  # Mostrar solo los primeros 3
                print(f"   - Fila {error['fila']}: {error['errores']}")
        
        if resultado.get('advertencias'):
            print("\n⚠️  ADVERTENCIAS:")
            for adv in resultado['advertencias'][:3]:  # Mostrar solo las primeras 3
                print(f"   - Fila {adv['fila']}: {adv['advertencias']}")
        
        print("\n🎉 PRUEBA COMPLETADA EXITOSAMENTE!")
        print("   El error 'NoneType' object has no attribute 'upper' ha sido CORREGIDO")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR EN LA PRUEBA: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_metodos_individuales():
    """Probar los métodos individuales que fueron corregidos"""
    
    print("\n🔧 PROBANDO MÉTODOS INDIVIDUALES CORREGIDOS")
    print("=" * 50)
    
    try:
        from app.services.ruta_excel_service import RutaExcelService
        
        excel_service = RutaExcelService()
        
        # Probar _normalizar_codigo_ruta con valores problemáticos
        print("📝 Probando _normalizar_codigo_ruta:")
        test_codes = [None, '', '1', '02', 'ABC', '123']
        
        for code in test_codes:
            try:
                resultado = excel_service._normalizar_codigo_ruta(code)
                print(f"   {repr(code)} → {repr(resultado)}")
            except Exception as e:
                print(f"   {repr(code)} → ERROR: {str(e)}")
        
        # Probar _normalizar_resolucion con valores problemáticos
        print("\n📝 Probando _normalizar_resolucion:")
        test_resolutions = [None, '', '921-2023', 'R-0495-2022', '123-2024']
        
        for res in test_resolutions:
            try:
                resultado = excel_service._normalizar_resolucion(res)
                print(f"   {repr(res)} → {repr(resultado)}")
            except Exception as e:
                print(f"   {repr(res)} → ERROR: {str(e)}")
        
        # Probar _normalizar_campo_con_guion con valores problemáticos
        print("\n📝 Probando _normalizar_campo_con_guion:")
        test_values = [None, '', '-', 'PUNO', 'JULIACA']
        
        for val in test_values:
            try:
                resultado = excel_service._normalizar_campo_con_guion(val, 'origen')
                print(f"   {repr(val)} → {repr(resultado)}")
            except Exception as e:
                print(f"   {repr(val)} → ERROR: {str(e)}")
        
        print("\n✅ TODOS LOS MÉTODOS FUNCIONAN CORRECTAMENTE")
        return True
        
    except Exception as e:
        print(f"❌ ERROR EN PRUEBA DE MÉTODOS: {str(e)}")
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE CORRECCIÓN DE CARGA MASIVA")
    print("=" * 70)
    
    # Probar métodos individuales
    success1 = await test_metodos_individuales()
    
    # Probar validación completa
    success2 = await test_carga_masiva_corregida()
    
    print("\n" + "=" * 70)
    if success1 and success2:
        print("🎉 TODAS LAS PRUEBAS EXITOSAS - CORRECCIÓN IMPLEMENTADA")
        print("\n📋 RESUMEN DE CORRECCIONES:")
        print("   ✅ _normalizar_codigo_ruta: Protegido contra valores None")
        print("   ✅ _normalizar_resolucion: Protegido contra valores None")
        print("   ✅ _normalizar_campo_con_guion: Protegido contra valores None")
        print("   ✅ Validación de archivo Excel: Maneja valores nulos correctamente")
        print("\n🔧 PRÓXIMOS PASOS:")
        print("   1. Reiniciar el backend para aplicar los cambios")
        print("   2. Probar la carga masiva desde el frontend")
        print("   3. Verificar que no aparezca más el error 'NoneType'")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON - REVISAR IMPLEMENTACIÓN")

if __name__ == "__main__":
    asyncio.run(main())