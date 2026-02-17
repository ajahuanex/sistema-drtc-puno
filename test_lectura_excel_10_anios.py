#!/usr/bin/env python3
"""
Script para probar la lectura de Excel con valores de 10 años
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import pandas as pd
from io import BytesIO

def test_lectura_directa():
    """Probar lectura directa de Excel"""
    print("=" * 70)
    print("TEST 1: Lectura Directa de Excel")
    print("=" * 70)
    
    # Buscar archivos de plantilla
    import glob
    archivos = glob.glob("plantilla_resoluciones*.xlsx")
    
    if not archivos:
        print("\n⚠️  No se encontraron archivos de plantilla")
        return
    
    for archivo in archivos[:3]:
        print(f"\n📄 Archivo: {archivo}")
        
        try:
            # Leer Excel
            df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
            df = df.fillna('')
            
            print(f"   Columnas: {list(df.columns)}")
            
            # Buscar columna de años de vigencia
            col_anios = None
            for col in df.columns:
                if 'ANIOS' in col.upper() or 'AÑOS' in col.upper():
                    col_anios = col
                    break
            
            if col_anios:
                print(f"   ✅ Columna encontrada: '{col_anios}'")
                
                # Mostrar valores
                valores = df[col_anios].tolist()
                print(f"   Valores: {valores}")
                
                # Contar valores
                con_4 = sum(1 for v in valores if str(v).strip() == '4')
                con_10 = sum(1 for v in valores if str(v).strip() == '10')
                vacios = sum(1 for v in valores if str(v).strip() == '')
                
                print(f"\n   📊 Distribución:")
                print(f"      4 años: {con_4}")
                print(f"      10 años: {con_10}")
                print(f"      Vacíos: {vacios}")
                
                if con_10 == 0:
                    print(f"\n   ❌ NO HAY VALORES DE 10 AÑOS EN ESTE ARCHIVO")
                else:
                    print(f"\n   ✅ Hay {con_10} valores de 10 años")
            else:
                print(f"   ❌ No se encontró columna de años de vigencia")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_con_servicio():
    """Probar con el servicio de Excel"""
    print(f"\n" + "=" * 70)
    print("TEST 2: Lectura con Servicio de Excel")
    print("=" * 70)
    
    from app.services.resolucion_excel_service import ResolucionExcelService
    
    service = ResolucionExcelService()
    
    # Buscar archivos
    import glob
    archivos = glob.glob("plantilla_resoluciones*.xlsx")
    
    if not archivos:
        print("\n⚠️  No se encontraron archivos")
        return
    
    archivo = archivos[0]
    print(f"\n📄 Probando: {archivo}")
    
    try:
        # Leer archivo
        with open(archivo, 'rb') as f:
            contenido = f.read()
        
        # Leer con pandas
        df = pd.read_excel(BytesIO(contenido), dtype=str, keep_default_na=False)
        df = df.fillna('')
        
        print(f"\n📋 ANTES de normalizar:")
        print(f"   Columnas: {list(df.columns)}")
        
        # Normalizar
        df_normalizado = service._normalizar_nombres_columnas(df)
        
        print(f"\n📋 DESPUÉS de normalizar:")
        print(f"   Columnas: {list(df_normalizado.columns)}")
        
        # Verificar columna de años
        if 'Años Vigencia' in df_normalizado.columns:
            print(f"\n✅ Columna 'Años Vigencia' encontrada")
            
            valores = df_normalizado['Años Vigencia'].tolist()
            print(f"   Valores: {valores}")
            
            # Probar conversión
            print(f"\n🔄 Probando conversión:")
            for i, valor in enumerate(valores, 1):
                valor_str = str(valor).strip()
                print(f"\n   Fila {i}: '{valor_str}'")
                
                if valor_str and valor_str.lower() not in ['nan', 'none', '', 'null']:
                    try:
                        anios_int = int(float(valor_str))
                        emoji = "⭐" if anios_int == 10 else "✓" if anios_int == 4 else "⚠️"
                        print(f"      {emoji} Convertido a: {anios_int}")
                    except (ValueError, TypeError) as e:
                        print(f"      ❌ Error: {e}")
                else:
                    print(f"      ⚠️  Vacío o NaN, usaría 4 por defecto")
        else:
            print(f"\n❌ Columna 'Años Vigencia' NO encontrada")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def crear_excel_prueba_10_anios():
    """Crear Excel de prueba con 10 años"""
    print(f"\n" + "=" * 70)
    print("TEST 3: Crear Excel de Prueba con 10 años")
    print("=" * 70)
    
    from datetime import datetime
    
    # Datos de prueba con 10 años
    datos = {
        'Resolución Padre': ['', ''],
        'Número Resolución': ['9001-2025', '9002-2025'],
        'RUC Empresa': ['20123456789', '20234567890'],
        'Fecha Emisión': ['15/02/2025', '16/02/2025'],
        'Fecha Vigencia Inicio': ['15/02/2025', '16/02/2025'],
        'Años Vigencia': [10, 10],  # AMBOS CON 10 AÑOS
        'Fecha Vigencia Fin': ['14/02/2035', '15/02/2035'],
        'Tipo Resolución': ['PADRE', 'PADRE'],
        'Tipo Trámite': ['PRIMIGENIA', 'PRIMIGENIA'],
        'Descripción': [
            'Resolución de prueba con 10 años de vigencia - TEST 1',
            'Resolución de prueba con 10 años de vigencia - TEST 2'
        ],
        'ID Expediente': ['', ''],
        'Usuario Emisión': ['USR001', 'USR001'],
        'Estado': ['VIGENTE', 'VIGENTE'],
        'Observaciones': ['Prueba de 10 años', 'Prueba de 10 años']
    }
    
    df = pd.DataFrame(datos)
    
    # Guardar archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre = f"TEST_10_ANIOS_{timestamp}.xlsx"
    
    df.to_excel(nombre, index=False, engine='openpyxl')
    
    print(f"\n✅ Archivo creado: {nombre}")
    print(f"\n📊 Contenido:")
    print(df[['Número Resolución', 'Años Vigencia', 'Fecha Vigencia Inicio', 'Fecha Vigencia Fin']])
    
    print(f"\n💡 SIGUIENTE PASO:")
    print(f"   1. Cargar este archivo en el sistema")
    print(f"   2. Ejecutar: python test_anios_10_especifico.py")
    print(f"   3. Verificar que las resoluciones 9001-2025 y 9002-2025 tengan 10 años")
    
    return nombre

def main():
    """Función principal"""
    print("\n🔍 Prueba de Lectura de Excel con 10 años\n")
    
    # Test 1: Lectura directa
    test_lectura_directa()
    
    # Test 2: Con servicio
    test_con_servicio()
    
    # Test 3: Crear archivo de prueba
    archivo_prueba = crear_excel_prueba_10_anios()
    
    print("\n" + "=" * 70)
    print("RESUMEN:")
    print("=" * 70)
    print("1. Se verificó la lectura de archivos existentes")
    print("2. Se probó la normalización de columnas")
    print(f"3. Se creó archivo de prueba: {archivo_prueba}")
    print("")
    print("PRÓXIMOS PASOS:")
    print(f"1. Cargar {archivo_prueba} en el sistema")
    print("2. Ejecutar: python test_anios_10_especifico.py")
    print("3. Verificar en la base de datos")
    print("=" * 70)

if __name__ == "__main__":
    main()
