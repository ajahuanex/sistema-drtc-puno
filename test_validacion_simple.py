#!/usr/bin/env python3
"""
Prueba simple para verificar que no se crean rutas con datos vacíos
"""

import asyncio
import pandas as pd
from io import BytesIO
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_no_crear_rutas_vacias():
    """Probar que NO se crean rutas con datos vacíos"""
    
    print("🧪 PROBANDO QUE NO SE CREAN RUTAS CON DATOS VACÍOS")
    print("=" * 55)
    
    try:
        from app.services.ruta_excel_service import RutaExcelService
        
        # Crear datos problemáticos que ANTES creaban rutas vacías
        datos_problematicos = {
            'RUC (*)': [None, '', 'nan', '20448048242'],  # 3 vacíos, 1 válido
            'Resolución (*)': ['921-2023', None, '', 'R-0495-2022'],  # 2 vacíos, 2 válidos
            'Código Ruta (*)': ['1', '2', None, '3'],  # 1 vacío, 3 válidos
            'Origen (*)': ['PUNO', 'JULIACA', 'CUSCO', None],  # 1 vacío, 3 válidos
            'Destino (*)': ['JULIACA', None, 'LIMA', 'AREQUIPA'],  # 1 vacío, 3 válidos
            'Frecuencia (*)': [None, '04 DIARIAS', '02 DIARIAS', '06 DIARIAS']  # 1 vacío, 3 válidos
        }
        
        df = pd.DataFrame(datos_problematicos)
        
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='DATOS', index=False)
        buffer.seek(0)
        
        print("📊 Datos de prueba:")
        print("   - 4 filas con diferentes campos vacíos")
        print("   - ANTES: Se creaban rutas con 'SIN RUC', 'Sin resolución', etc.")
        print("   - AHORA: Debe rechazar todas las filas con campos vacíos")
        print()
        
        excel_service = RutaExcelService()
        
        print("🔍 EJECUTANDO VALIDACIÓN...")
        resultado = await excel_service.validar_archivo_excel(buffer)
        
        print("📋 RESULTADOS:")
        print(f"   - Total filas: {resultado.get('total_filas', 0)}")
        print(f"   - Válidos: {resultado.get('validos', 0)}")
        print(f"   - Inválidos: {resultado.get('invalidos', 0)}")
        
        # Verificar que NO hay rutas válidas con datos vacíos
        rutas_validas = resultado.get('rutas_validas', [])
        print(f"   - Rutas válidas encontradas: {len(rutas_validas)}")
        
        # Verificar cada ruta válida
        rutas_con_problemas = []
        for i, ruta in enumerate(rutas_validas):
            problemas = []
            if not ruta.get('ruc') or ruta.get('ruc') in ['', 'nan', 'None']:
                problemas.append('RUC vacío')
            if not ruta.get('resolucionNormalizada') or ruta.get('resolucionNormalizada') in ['', 'nan', 'None']:
                problemas.append('Resolución vacía')
            if not ruta.get('codigoRuta') or ruta.get('codigoRuta') in ['', 'nan', 'None']:
                problemas.append('Código vacío')
            if not ruta.get('origen') or ruta.get('origen') in ['', 'nan', 'None']:
                problemas.append('Origen vacío')
            if not ruta.get('destino') or ruta.get('destino') in ['', 'nan', 'None']:
                problemas.append('Destino vacío')
            if not ruta.get('frecuencia') or ruta.get('frecuencia') in ['', 'nan', 'None']:
                problemas.append('Frecuencia vacía')
            
            if problemas:
                rutas_con_problemas.append({
                    'ruta': i + 1,
                    'problemas': problemas,
                    'datos': ruta
                })
        
        print(f"\n🔍 RUTAS CON DATOS VACÍOS: {len(rutas_con_problemas)}")
        
        if rutas_con_problemas:
            print("❌ PROBLEMA: Se encontraron rutas con datos vacíos:")
            for ruta_prob in rutas_con_problemas:
                print(f"   - Ruta {ruta_prob['ruta']}: {', '.join(ruta_prob['problemas'])}")
                print(f"     RUC: {ruta_prob['datos'].get('ruc', 'N/A')}")
                print(f"     Resolución: {ruta_prob['datos'].get('resolucionNormalizada', 'N/A')}")
                print(f"     Código: {ruta_prob['datos'].get('codigoRuta', 'N/A')}")
            return False
        else:
            print("✅ CORRECTO: No se encontraron rutas con datos vacíos")
            
            # Verificar errores
            errores = resultado.get('errores', [])
            print(f"\n📋 ERRORES DETECTADOS: {len(errores)}")
            for error in errores[:3]:  # Mostrar solo los primeros 3
                print(f"   - Fila {error['fila']}: {error['errores']}")
            
            return True
        
    except Exception as e:
        print(f"❌ ERROR EN LA PRUEBA: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 PRUEBA SIMPLE DE VALIDACIÓN")
    print("=" * 40)
    
    success = await test_no_crear_rutas_vacias()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 PRUEBA EXITOSA!")
        print("✅ No se crean rutas con datos vacíos")
        print("✅ La validación funciona correctamente")
    else:
        print("❌ PRUEBA FALLIDA!")
        print("❌ Aún se están creando rutas con datos vacíos")

if __name__ == "__main__":
    asyncio.run(main())