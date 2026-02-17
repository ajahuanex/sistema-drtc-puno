#!/usr/bin/env python3
"""
Script para probar la corrección final de años de vigencia de 10 años
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import pandas as pd
from io import BytesIO

def test_normalizacion_servicio_padres():
    """Probar normalización en el servicio de resoluciones padres"""
    print("=" * 70)
    print("TEST: Normalización en ResolucionPadresService")
    print("=" * 70)
    
    from app.services.resolucion_padres_service import ResolucionPadresService
    
    # Crear DataFrame de prueba con AMBOS formatos
    print("\n📋 Test 1: Formato con ESPACIOS (nuevo)")
    datos_espacios = {
        'RUC Empresa': ['20123456789'],
        'Número Resolución': ['1001-2025'],
        'Resolución Asociada': [''],
        'Tipo Resolución': ['NUEVA'],
        'Fecha Emisión': ['15/02/2025'],
        'Fecha Vigencia Inicio': ['15/02/2025'],
        'Años Vigencia': [10],  # ⭐ 10 AÑOS
        'Fecha Vigencia Fin': ['14/02/2035'],
        'Estado': ['ACTIVA']
    }
    
    df_espacios = pd.DataFrame(datos_espacios)
    print(f"   Columnas ANTES: {list(df_espacios.columns)}")
    print(f"   Años Vigencia: {df_espacios['Años Vigencia'].tolist()}")
    
    df_normalizado = ResolucionPadresService._normalizar_nombres_columnas(df_espacios)
    print(f"\n   Columnas DESPUÉS: {list(df_normalizado.columns)}")
    
    if 'ANIOS_VIGENCIA' in df_normalizado.columns:
        print(f"   ✅ Columna normalizada a 'ANIOS_VIGENCIA'")
        print(f"   Años Vigencia: {df_normalizado['ANIOS_VIGENCIA'].tolist()}")
        
        valor = df_normalizado['ANIOS_VIGENCIA'].iloc[0]
        if int(valor) == 10:
            print(f"   ✅ ¡CORRECTO! El valor de 10 años se preservó")
        else:
            print(f"   ❌ ERROR: Se esperaba 10 pero se obtuvo {valor}")
    else:
        print(f"   ❌ ERROR: No se encontró columna 'ANIOS_VIGENCIA'")
    
    print("\n📋 Test 2: Formato con GUIONES BAJOS (antiguo)")
    datos_guiones = {
        'RUC_EMPRESA_ASOCIADA': ['20234567890'],
        'RESOLUCION_NUMERO': ['1002-2025'],
        'RESOLUCION_ASOCIADA': [''],
        'TIPO_RESOLUCION': ['NUEVA'],
        'FECHA_RESOLUCION': ['16/02/2025'],
        'FECHA_INICIO_VIGENCIA': ['16/02/2025'],
        'ANIOS_VIGENCIA': [10],  # ⭐ 10 AÑOS
        'FECHA_FIN_VIGENCIA': ['15/02/2035'],
        'ESTADO': ['ACTIVA']
    }
    
    df_guiones = pd.DataFrame(datos_guiones)
    print(f"   Columnas ANTES: {list(df_guiones.columns)}")
    print(f"   Años Vigencia: {df_guiones['ANIOS_VIGENCIA'].tolist()}")
    
    df_normalizado2 = ResolucionPadresService._normalizar_nombres_columnas(df_guiones)
    print(f"\n   Columnas DESPUÉS: {list(df_normalizado2.columns)}")
    
    if 'ANIOS_VIGENCIA' in df_normalizado2.columns:
        print(f"   ✅ Columna se mantiene como 'ANIOS_VIGENCIA'")
        print(f"   Años Vigencia: {df_normalizado2['ANIOS_VIGENCIA'].tolist()}")
        
        valor = df_normalizado2['ANIOS_VIGENCIA'].iloc[0]
        if int(valor) == 10:
            print(f"   ✅ ¡CORRECTO! El valor de 10 años se preservó")
        else:
            print(f"   ❌ ERROR: Se esperaba 10 pero se obtuvo {valor}")
    else:
        print(f"   ❌ ERROR: No se encontró columna 'ANIOS_VIGENCIA'")

def test_validacion_con_10_anios():
    """Probar validación con valores de 10 años"""
    print(f"\n" + "=" * 70)
    print("TEST: Validación con 10 años")
    print("=" * 70)
    
    from app.services.resolucion_padres_service import ResolucionPadresService
    
    # Crear DataFrame con 10 años
    datos = {
        'RUC Empresa': ['20123456789', '20234567890'],
        'Número Resolución': ['1001-2025', '1002-2025'],
        'Resolución Asociada': ['', ''],
        'Tipo Resolución': ['NUEVA', 'NUEVA'],
        'Fecha Emisión': ['15/02/2025', '16/02/2025'],
        'Fecha Vigencia Inicio': ['15/02/2025', '16/02/2025'],
        'Años Vigencia': [4, 10],  # ⭐ UNO CON 4, OTRO CON 10
        'Fecha Vigencia Fin': ['14/02/2029', '15/02/2035'],
        'Estado': ['ACTIVA', 'ACTIVA']
    }
    
    df = pd.DataFrame(datos)
    
    print(f"\n📊 DataFrame de prueba:")
    print(df[['Número Resolución', 'Años Vigencia', 'Fecha Vigencia Fin']])
    
    # Normalizar
    df_normalizado = ResolucionPadresService._normalizar_nombres_columnas(df)
    
    print(f"\n📊 DataFrame normalizado:")
    print(df_normalizado[['RESOLUCION_NUMERO', 'ANIOS_VIGENCIA', 'FECHA_FIN_VIGENCIA']])
    
    # Validar
    resultado = ResolucionPadresService.validar_plantilla_padres(df_normalizado)
    
    print(f"\n📋 Resultado de validación:")
    print(f"   Válido: {resultado['valido']}")
    print(f"   Errores: {len(resultado['errores'])}")
    print(f"   Advertencias: {len(resultado['advertencias'])}")
    
    if resultado['errores']:
        print(f"\n❌ Errores:")
        for error in resultado['errores']:
            print(f"      - {error}")
    
    if resultado['advertencias']:
        print(f"\n⚠️  Advertencias:")
        for adv in resultado['advertencias']:
            print(f"      - {adv}")
    
    if resultado['valido']:
        print(f"\n✅ ¡VALIDACIÓN EXITOSA!")
        print(f"   Los valores de 4 y 10 años se validaron correctamente")
    else:
        print(f"\n❌ Validación falló")

def test_lectura_archivo_real():
    """Probar lectura de archivo real con 10 años"""
    print(f"\n" + "=" * 70)
    print("TEST: Lectura de Archivo Real")
    print("=" * 70)
    
    import glob
    from app.services.resolucion_padres_service import ResolucionPadresService
    
    # Buscar archivo de prueba
    archivos = glob.glob("TEST_10_ANIOS_*.xlsx")
    
    if not archivos:
        print(f"\n⚠️  No se encontró archivo de prueba")
        print(f"   Ejecuta: python test_lectura_excel_10_anios.py")
        return
    
    archivo = archivos[0]
    print(f"\n📄 Archivo: {archivo}")
    
    # Leer archivo
    df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
    df = df.fillna('')
    
    print(f"\n📋 Columnas originales: {list(df.columns)}")
    
    # Normalizar
    df_normalizado = ResolucionPadresService._normalizar_nombres_columnas(df)
    
    print(f"📋 Columnas normalizadas: {list(df_normalizado.columns)}")
    
    if 'ANIOS_VIGENCIA' in df_normalizado.columns:
        print(f"\n✅ Columna 'ANIOS_VIGENCIA' encontrada")
        
        valores = df_normalizado['ANIOS_VIGENCIA'].tolist()
        print(f"   Valores: {valores}")
        
        # Contar
        con_10 = sum(1 for v in valores if str(v).strip() == '10')
        
        if con_10 > 0:
            print(f"\n✅ ¡ÉXITO! Se encontraron {con_10} valores de 10 años")
        else:
            print(f"\n❌ ERROR: No se encontraron valores de 10 años")
    else:
        print(f"\n❌ ERROR: No se encontró columna 'ANIOS_VIGENCIA'")

def main():
    """Función principal"""
    print("\n🔧 Prueba de Corrección Final: Años de Vigencia de 10 años\n")
    
    # Test 1: Normalización
    test_normalizacion_servicio_padres()
    
    # Test 2: Validación
    test_validacion_con_10_anios()
    
    # Test 3: Archivo real
    test_lectura_archivo_real()
    
    print("\n" + "=" * 70)
    print("CONCLUSIÓN:")
    print("=" * 70)
    print("Si todos los tests pasaron:")
    print("   ✅ La corrección está funcionando correctamente")
    print("   ✅ Los archivos con 'Años Vigencia' (espacios) funcionan")
    print("   ✅ Los archivos con 'ANIOS_VIGENCIA' (guiones) funcionan")
    print("   ✅ Los valores de 10 años se preservan correctamente")
    print("")
    print("Próximo paso:")
    print("   1. Cargar un archivo Excel con valores de 10 años")
    print("   2. Verificar en el frontend que se muestren correctamente")
    print("=" * 70)

if __name__ == "__main__":
    main()
