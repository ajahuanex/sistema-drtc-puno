#!/usr/bin/env python3
"""
Script para probar la validación de códigos únicos por resolución en carga masiva
"""

import asyncio
import pandas as pd
from io import BytesIO
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_codigos_unicos_por_resolucion():
    """Probar que los códigos son únicos solo dentro de cada resolución"""
    
    print("🧪 PROBANDO VALIDACIÓN DE CÓDIGOS ÚNICOS POR RESOLUCIÓN")
    print("=" * 65)
    
    try:
        from app.services.ruta_excel_service import RutaExcelService
        
        # Crear datos de prueba con códigos duplicados en diferentes resoluciones (VÁLIDO)
        # y códigos duplicados en la misma resolución (INVÁLIDO)
        datos_prueba = {
            'RUC (*)': [
                '20448048242',  # Resolución R-0921-2023, Código 01 ✅
                '20364360771',  # Resolución R-0495-2022, Código 01 ✅ (mismo código, diferente resolución)
                '20115054229',  # Resolución R-0921-2023, Código 02 ✅
                '20123456789',  # Resolución R-0921-2023, Código 01 ❌ (código duplicado en misma resolución)
                '20987654321',  # Resolución R-0495-2022, Código 02 ✅
                '20555666777',  # Resolución R-0495-2022, Código 01 ❌ (código duplicado en misma resolución)
            ],
            'Resolución (*)': [
                '921-2023',     # Se normalizará a R-0921-2023
                'R-0495-2022',  # Ya normalizada
                '921-2023',     # Misma resolución que fila 1
                '921-2023',     # Misma resolución que fila 1 y 3
                'R-0495-2022',  # Misma resolución que fila 2
                'R-0495-2022',  # Misma resolución que fila 2 y 5
            ],
            'Código Ruta (*)': [
                '1',    # Se normalizará a 01
                '1',    # Se normalizará a 01 (mismo código, diferente resolución = OK)
                '2',    # Se normalizará a 02
                '1',    # Se normalizará a 01 (mismo código, misma resolución = ERROR)
                '2',    # Se normalizará a 02
                '1',    # Se normalizará a 01 (mismo código, misma resolución = ERROR)
            ],
            'Origen (*)': [
                'PUNO', 'JULIACA', 'CUSCO', 'AREQUIPA', 'TACNA', 'MOQUEGUA'
            ],
            'Destino (*)': [
                'JULIACA', 'AREQUIPA', 'LIMA', 'TACNA', 'ILO', 'TACNA'
            ],
            'Frecuencia (*)': [
                '08 DIARIAS', '04 DIARIAS', '02 DIARIAS', '06 DIARIAS', '03 DIARIAS', '01 DIARIA'
            ]
        }
        
        # Crear DataFrame
        df = pd.DataFrame(datos_prueba)
        
        # Convertir a Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='DATOS', index=False)
        buffer.seek(0)
        
        print("📊 Datos de prueba creados:")
        print("   CASOS VÁLIDOS (mismo código, diferente resolución):")
        print("   - Fila 2: R-0921-2023, Código 01")
        print("   - Fila 3: R-0495-2022, Código 01 ✅")
        print()
        print("   CASOS INVÁLIDOS (mismo código, misma resolución):")
        print("   - Fila 2: R-0921-2023, Código 01")
        print("   - Fila 5: R-0921-2023, Código 01 ❌ DUPLICADO")
        print("   - Fila 3: R-0495-2022, Código 01")
        print("   - Fila 7: R-0495-2022, Código 01 ❌ DUPLICADO")
        print()
        
        # Crear servicio
        excel_service = RutaExcelService()
        
        print("🔍 EJECUTANDO VALIDACIÓN...")
        
        # Probar validación
        resultado = await excel_service.validar_archivo_excel(buffer)
        
        print("📋 RESULTADOS DE VALIDACIÓN:")
        print(f"   - Total filas: {resultado.get('total_filas', 0)}")
        print(f"   - Válidos: {resultado.get('validos', 0)}")
        print(f"   - Inválidos: {resultado.get('invalidos', 0)}")
        print(f"   - Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        if resultado.get('error'):
            print(f"   - Error: {resultado['error']}")
            return False
        
        # Verificar errores específicos de códigos duplicados
        errores_duplicados = []
        if resultado.get('errores'):
            print("\n❌ ERRORES ENCONTRADOS:")
            for error in resultado['errores']:
                print(f"   - Fila {error['fila']}: {error['errores']}")
                
                # Buscar errores de códigos duplicados
                for err_msg in error['errores']:
                    if 'duplicado' in err_msg.lower():
                        errores_duplicados.append({
                            'fila': error['fila'],
                            'error': err_msg
                        })
        
        # Verificar que se detectaron los duplicados esperados
        print(f"\n🔍 ERRORES DE CÓDIGOS DUPLICADOS DETECTADOS: {len(errores_duplicados)}")
        for err in errores_duplicados:
            print(f"   - Fila {err['fila']}: {err['error']}")
        
        # Validar resultados esperados
        exito = True
        
        # Debe haber exactamente 2 errores de códigos duplicados
        if len(errores_duplicados) != 2:
            print(f"❌ ERROR: Se esperaban 2 códigos duplicados, se encontraron {len(errores_duplicados)}")
            exito = False
        else:
            print("✅ CORRECTO: Se detectaron exactamente 2 códigos duplicados")
        
        # Los códigos válidos (mismo código, diferente resolución) no deben generar errores
        filas_con_errores = [err['fila'] for err in resultado.get('errores', [])]
        
        # Fila 2 (R-0921-2023, Código 01) y Fila 3 (R-0495-2022, Código 01) NO deben tener errores
        if 2 in filas_con_errores or 3 in filas_con_errores:
            # Verificar si los errores son por códigos duplicados o por otros motivos
            errores_fila_2 = [err for err in resultado.get('errores', []) if err['fila'] == 2]
            errores_fila_3 = [err for err in resultado.get('errores', []) if err['fila'] == 3]
            
            tiene_error_duplicado_f2 = any('duplicado' in str(err).lower() for err in errores_fila_2)
            tiene_error_duplicado_f3 = any('duplicado' in str(err).lower() for err in errores_fila_3)
            
            if tiene_error_duplicado_f2 or tiene_error_duplicado_f3:
                print("❌ ERROR: Las filas 2 y 3 NO deberían tener errores de códigos duplicados (diferentes resoluciones)")
                exito = False
            else:
                print("✅ CORRECTO: Las filas 2 y 3 no tienen errores de códigos duplicados")
        else:
            print("✅ CORRECTO: Las filas 2 y 3 no tienen errores")
        
        if exito:
            print("\n🎉 PRUEBA EXITOSA!")
            print("✅ La validación de códigos únicos por resolución funciona correctamente")
            print("✅ Permite códigos iguales en resoluciones diferentes")
            print("✅ Detecta códigos duplicados en la misma resolución")
        else:
            print("\n❌ PRUEBA FALLIDA!")
            print("❌ La validación de códigos únicos por resolución tiene problemas")
        
        return exito
        
    except Exception as e:
        print(f"❌ ERROR EN LA PRUEBA: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_casos_edge_codigos():
    """Probar casos edge de códigos únicos"""
    
    print("\n🔧 PROBANDO CASOS EDGE DE CÓDIGOS ÚNICOS")
    print("=" * 50)
    
    try:
        from app.services.ruta_excel_service import RutaExcelService
        
        # Casos edge: códigos que se normalizan al mismo valor
        datos_edge = {
            'RUC (*)': ['20448048242', '20364360771', '20115054229'],
            'Resolución (*)': ['921-2023', '921-2023', '921-2023'],  # Misma resolución
            'Código Ruta (*)': ['1', '01', '001'],  # Todos se normalizan a '01'
            'Origen (*)': ['PUNO', 'JULIACA', 'CUSCO'],
            'Destino (*)': ['JULIACA', 'AREQUIPA', 'LIMA'],
            'Frecuencia (*)': ['08 DIARIAS', '04 DIARIAS', '02 DIARIAS']
        }
        
        df = pd.DataFrame(datos_edge)
        
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='DATOS', index=False)
        buffer.seek(0)
        
        excel_service = RutaExcelService()
        resultado = await excel_service.validar_archivo_excel(buffer)
        
        print("📊 Probando códigos que se normalizan igual:")
        print("   - '1' → '01'")
        print("   - '01' → '01'") 
        print("   - '001' → '01' (si se acepta)")
        print()
        
        errores_duplicados = []
        if resultado.get('errores'):
            for error in resultado['errores']:
                for err_msg in error['errores']:
                    if 'duplicado' in err_msg.lower():
                        errores_duplicados.append(error['fila'])
        
        print(f"🔍 Errores de duplicados detectados en filas: {errores_duplicados}")
        
        # Debe detectar que '1' y '01' son el mismo código normalizado
        if len(errores_duplicados) >= 1:
            print("✅ CORRECTO: Se detectó que códigos normalizados son duplicados")
        else:
            print("❌ ERROR: No se detectó que códigos normalizados son duplicados")
        
        return len(errores_duplicados) >= 1
        
    except Exception as e:
        print(f"❌ ERROR EN PRUEBA EDGE: {str(e)}")
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE CÓDIGOS ÚNICOS POR RESOLUCIÓN")
    print("=" * 70)
    
    # Probar validación básica
    success1 = await test_codigos_unicos_por_resolucion()
    
    # Probar casos edge
    success2 = await test_casos_edge_codigos()
    
    print("\n" + "=" * 70)
    if success1 and success2:
        print("🎉 TODAS LAS PRUEBAS EXITOSAS!")
        print("\n📋 FUNCIONALIDAD CONFIRMADA:")
        print("   ✅ Códigos únicos validados por resolución")
        print("   ✅ Permite códigos iguales en resoluciones diferentes")
        print("   ✅ Detecta códigos duplicados en la misma resolución")
        print("   ✅ Maneja normalización de códigos correctamente")
        print("\n🎯 LA LÓGICA DE NEGOCIO ES CORRECTA:")
        print("   'El código de ruta es único dentro de una resolución solamente'")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
        if not success1:
            print("   ❌ Validación básica de códigos únicos por resolución")
        if not success2:
            print("   ❌ Casos edge de normalización de códigos")

if __name__ == "__main__":
    asyncio.run(main())