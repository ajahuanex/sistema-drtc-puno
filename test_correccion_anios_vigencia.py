#!/usr/bin/env python3
"""
Script para probar la corrección de años de vigencia
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_normalizacion_columnas():
    """Probar normalización de nombres de columnas"""
    import pandas as pd
    from io import BytesIO
    from app.services.resolucion_excel_service import ResolucionExcelService
    
    print("=" * 70)
    print("TEST: Normalización de Columnas")
    print("=" * 70)
    
    service = ResolucionExcelService()
    
    # Crear DataFrame de prueba con nombres con guión bajo (formato antiguo)
    datos_test = {
        'RUC_EMPRESA_ASOCIADA': ['20123456789', '20234567890'],
        'RESOLUCION_NUMERO': ['1001-2025', '1002-2025'],
        'RESOLUCION_ASOCIADA': ['', ''],
        'TIPO_RESOLUCION': ['PADRE', 'PADRE'],
        'FECHA_RESOLUCION': ['15/01/2025', '20/01/2025'],
        'FECHA_INICIO_VIGENCIA': ['15/01/2025', '20/01/2025'],
        'ANIOS_VIGENCIA': ['4', '10'],  # Uno con 4, otro con 10
        'FECHA_FIN_VIGENCIA': ['14/01/2029', '19/01/2035'],
        'ESTADO': ['VIGENTE', 'VIGENTE']
    }
    
    df_test = pd.DataFrame(datos_test)
    
    print("\n📋 DataFrame ANTES de normalizar:")
    print(f"Columnas: {list(df_test.columns)}")
    print(f"\nPrimeras filas:")
    print(df_test.head())
    
    # Normalizar columnas
    df_normalizado = service._normalizar_nombres_columnas(df_test)
    
    print("\n📋 DataFrame DESPUÉS de normalizar:")
    print(f"Columnas: {list(df_normalizado.columns)}")
    print(f"\nPrimeras filas:")
    print(df_normalizado.head())
    
    # Verificar que la columna 'Años Vigencia' existe
    if 'Años Vigencia' in df_normalizado.columns:
        print("\n✅ Columna 'Años Vigencia' encontrada correctamente")
        print(f"Valores: {df_normalizado['Años Vigencia'].tolist()}")
    else:
        print("\n❌ Columna 'Años Vigencia' NO encontrada")
        print(f"Columnas disponibles: {list(df_normalizado.columns)}")
    
    return df_normalizado

async def test_lectura_excel_real():
    """Probar lectura de archivo Excel real"""
    import glob
    import pandas as pd
    from io import BytesIO
    from app.services.resolucion_excel_service import ResolucionExcelService
    
    print("\n" + "=" * 70)
    print("TEST: Lectura de Excel Real")
    print("=" * 70)
    
    # Buscar archivos de plantilla
    archivos_excel = glob.glob("plantilla_resoluciones*.xlsx")
    
    if not archivos_excel:
        print("\n⚠️  No se encontraron archivos de plantilla")
        return
    
    archivo = archivos_excel[0]
    print(f"\n📄 Probando con: {archivo}")
    
    service = ResolucionExcelService()
    
    try:
        # Leer archivo
        with open(archivo, 'rb') as f:
            contenido = f.read()
        
        archivo_bytes = BytesIO(contenido)
        
        # Validar archivo
        print("\n🔍 Validando archivo...")
        resultado = await service.validar_archivo_excel(archivo_bytes)
        
        print(f"\n📊 Resultados de validación:")
        print(f"   Total filas: {resultado.get('total_filas', 0)}")
        print(f"   Válidos: {resultado.get('validos', 0)}")
        print(f"   Inválidos: {resultado.get('invalidos', 0)}")
        print(f"   Con advertencias: {resultado.get('con_advertencias', 0)}")
        
        # Mostrar resoluciones válidas
        if resultado.get('resoluciones_validas'):
            print(f"\n✅ Resoluciones válidas encontradas: {len(resultado['resoluciones_validas'])}")
            
            for i, res in enumerate(resultado['resoluciones_validas'][:3], 1):
                print(f"\n   Resolución {i}:")
                print(f"      Número: {res.get('nroResolucion')}")
                print(f"      Tipo: {res.get('tipoResolucion')}")
                print(f"      Años Vigencia: {res.get('aniosVigencia')} ⭐")
                print(f"      Fecha Inicio: {res.get('fechaVigenciaInicio')}")
                print(f"      Fecha Fin: {res.get('fechaVigenciaFin')}")
        
        # Mostrar errores
        if resultado.get('errores'):
            print(f"\n❌ Errores encontrados: {len(resultado['errores'])}")
            for error in resultado['errores'][:3]:
                print(f"\n   Fila {error.get('fila')}:")
                print(f"      Resolución: {error.get('numero_resolucion')}")
                for err in error.get('errores', []):
                    print(f"      - {err}")
        
        # Mostrar advertencias
        if resultado.get('advertencias'):
            print(f"\n⚠️  Advertencias: {len(resultado['advertencias'])}")
            for adv in resultado['advertencias'][:3]:
                print(f"\n   Fila {adv.get('fila')}:")
                print(f"      Resolución: {adv.get('numero_resolucion')}")
                for a in adv.get('advertencias', []):
                    print(f"      - {a}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def test_conversion_fila():
    """Probar conversión de fila a resolución"""
    import pandas as pd
    from app.services.resolucion_excel_service import ResolucionExcelService
    
    print("\n" + "=" * 70)
    print("TEST: Conversión de Fila a Resolución")
    print("=" * 70)
    
    service = ResolucionExcelService()
    
    # Crear fila de prueba con formato normalizado
    fila_test = pd.Series({
        'Resolución Padre': '',
        'Número Resolución': '1001-2025',
        'RUC Empresa': '20123456789',
        'Fecha Emisión': '15/01/2025',
        'Fecha Vigencia Inicio': '15/01/2025',
        'Años Vigencia': '10',  # Probar con 10 años
        'Fecha Vigencia Fin': '14/01/2035',
        'Tipo Resolución': 'PADRE',
        'Tipo Trámite': 'PRIMIGENIA',
        'Descripción': 'Resolución de prueba con 10 años de vigencia',
        'ID Expediente': '',
        'Usuario Emisión': 'USR001',
        'Estado': 'VIGENTE',
        'Observaciones': ''
    })
    
    print("\n📋 Fila de prueba:")
    print(fila_test)
    
    try:
        resolucion = service._convertir_fila_a_resolucion(fila_test)
        
        print("\n✅ Resolución convertida:")
        print(f"   Número: {resolucion.get('nroResolucion')}")
        print(f"   Tipo: {resolucion.get('tipoResolucion')}")
        print(f"   Años Vigencia: {resolucion.get('aniosVigencia')} ⭐")
        print(f"   Fecha Inicio: {resolucion.get('fechaVigenciaInicio')}")
        print(f"   Fecha Fin: {resolucion.get('fechaVigenciaFin')}")
        
        # Verificar que los años de vigencia se leyeron correctamente
        if resolucion.get('aniosVigencia') == 10:
            print("\n✅ ¡CORRECTO! Los años de vigencia se leyeron como 10")
        else:
            print(f"\n❌ ERROR: Se esperaba 10 años, pero se obtuvo {resolucion.get('aniosVigencia')}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🔍 Prueba de Corrección de Años de Vigencia\n")
    
    # Test 1: Normalización de columnas
    asyncio.run(test_normalizacion_columnas())
    
    # Test 2: Lectura de Excel real
    asyncio.run(test_lectura_excel_real())
    
    # Test 3: Conversión de fila
    asyncio.run(test_conversion_fila())
    
    print("\n" + "=" * 70)
    print("CONCLUSIÓN:")
    print("=" * 70)
    print("Si todos los tests pasaron, la corrección está funcionando.")
    print("Los archivos Excel con formato ANIOS_VIGENCIA ahora se leen correctamente.")
    print("=" * 70)

if __name__ == "__main__":
    main()
