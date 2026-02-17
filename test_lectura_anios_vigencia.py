#!/usr/bin/env python3
"""
Script para probar la lectura de años de vigencia desde Excel
"""
import pandas as pd
from io import BytesIO
from datetime import datetime

def crear_excel_prueba():
    """Crear Excel de prueba con diferentes años de vigencia"""
    datos = {
        'Resolución Padre': ['', '', ''],
        'Número Resolución': ['1001-2024', '1002-2024', '1003-2024'],
        'RUC Empresa': ['20123456789', '20234567890', '20345678901'],
        'Fecha Emisión': ['15/01/2024', '20/03/2024', '10/06/2024'],
        'Fecha Vigencia Inicio': ['15/01/2024', '20/03/2024', '10/06/2024'],
        'Años Vigencia': [4, 10, 4],  # Valores numéricos
        'Fecha Vigencia Fin': ['14/01/2028', '19/03/2034', '09/06/2028'],
        'Tipo Resolución': ['PADRE', 'PADRE', 'PADRE'],
        'Tipo Trámite': ['PRIMIGENIA', 'PRIMIGENIA', 'PRIMIGENIA'],
        'Descripción': [
            'Autorización con 4 años de vigencia',
            'Autorización con 10 años de vigencia',
            'Autorización con 4 años de vigencia'
        ],
        'ID Expediente': ['123-2024', '456-2024', '789-2024'],
        'Usuario Emisión': ['USR001', 'USR001', 'USR001'],
        'Estado': ['VIGENTE', 'VIGENTE', 'VIGENTE'],
        'Observaciones': ['Prueba 4 años', 'Prueba 10 años', 'Prueba 4 años']
    }
    
    df = pd.DataFrame(datos)
    
    # Guardar en BytesIO
    buffer = BytesIO()
    df.to_excel(buffer, index=False, engine='openpyxl')
    buffer.seek(0)
    
    return buffer, df

def probar_lectura_excel():
    """Probar lectura de Excel"""
    print("=" * 70)
    print("PRUEBA DE LECTURA DE AÑOS DE VIGENCIA DESDE EXCEL")
    print("=" * 70)
    
    # Crear Excel de prueba
    print("\n1. Creando Excel de prueba...")
    buffer, df_original = crear_excel_prueba()
    
    print("\n📊 Datos originales:")
    print(df_original[['Número Resolución', 'Años Vigencia']].to_string(index=False))
    
    # Leer Excel como lo hace el servicio
    print("\n2. Leyendo Excel con pandas (dtype=str)...")
    buffer.seek(0)
    df_leido = pd.read_excel(buffer, dtype=str, keep_default_na=False)
    df_leido = df_leido.fillna('')
    
    print("\n📊 Datos leídos (dtype=str):")
    print(df_leido[['Número Resolución', 'Años Vigencia']].to_string(index=False))
    
    # Procesar cada fila
    print("\n3. Procesando cada fila...")
    print("-" * 70)
    
    for index, row in df_leido.iterrows():
        numero = row.get('Número Resolución', '')
        anios_str = str(row.get('Años Vigencia', '')).strip() if row.get('Años Vigencia') and str(row.get('Años Vigencia')).strip() else ''
        
        print(f"\nFila {index + 2}:")
        print(f"  Número: {numero}")
        print(f"  Años Vigencia (raw): '{anios_str}' (tipo: {type(anios_str).__name__})")
        
        # Intentar convertir
        if anios_str and anios_str.lower() not in ['nan', 'none', '']:
            try:
                anios = int(float(anios_str))
                print(f"  Años Vigencia (convertido): {anios} ✅")
            except (ValueError, TypeError) as e:
                print(f"  Error al convertir: {e} ❌")
        else:
            print(f"  Años Vigencia: vacío o NaN, usando 4 por defecto ⚠️")
    
    print("\n" + "=" * 70)
    
    # Probar con diferentes formatos
    print("\n4. Probando diferentes formatos de lectura...")
    print("-" * 70)
    
    # Sin dtype=str
    buffer.seek(0)
    df_sin_dtype = pd.read_excel(buffer)
    
    print("\n📊 Lectura SIN dtype=str:")
    for index, row in df_sin_dtype.iterrows():
        numero = row.get('Número Resolución', '')
        anios = row.get('Años Vigencia', '')
        print(f"  {numero}: Años = {anios} (tipo: {type(anios).__name__})")
    
    # Con dtype específico para Años Vigencia
    buffer.seek(0)
    df_dtype_especifico = pd.read_excel(buffer, dtype={'Años Vigencia': int})
    
    print("\n📊 Lectura con dtype={'Años Vigencia': int}:")
    for index, row in df_dtype_especifico.iterrows():
        numero = row.get('Número Resolución', '')
        anios = row.get('Años Vigencia', '')
        print(f"  {numero}: Años = {anios} (tipo: {type(anios).__name__})")
    
    print("\n" + "=" * 70)
    print("✅ PRUEBA COMPLETADA")
    print("=" * 70)

def probar_con_archivo_real():
    """Probar con un archivo Excel real si existe"""
    import os
    import glob
    
    print("\n" + "=" * 70)
    print("PRUEBA CON ARCHIVO EXCEL REAL")
    print("=" * 70)
    
    # Buscar archivos de plantilla
    archivos = glob.glob('plantilla_*.xlsx')
    
    if not archivos:
        print("\n⚠️  No se encontraron archivos de plantilla")
        return
    
    archivo = archivos[0]
    print(f"\n📄 Usando archivo: {archivo}")
    
    # Leer archivo
    df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
    df = df.fillna('')
    
    print("\n📊 Columnas encontradas:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")
    
    if 'Años Vigencia' not in df.columns:
        print("\n❌ ERROR: Columna 'Años Vigencia' no encontrada")
        return
    
    print("\n📊 Datos de Años Vigencia:")
    print("-" * 70)
    for index, row in df.iterrows():
        numero = row.get('Número Resolución', 'N/A')
        tipo = row.get('Tipo Resolución', 'N/A')
        anios_str = str(row.get('Años Vigencia', '')).strip()
        
        print(f"Fila {index + 2}: {numero} ({tipo}) - Años: '{anios_str}'")
        
        if anios_str and anios_str.lower() not in ['nan', 'none', '']:
            try:
                anios = int(float(anios_str))
                print(f"  → Convertido: {anios} años ✅")
            except Exception as e:
                print(f"  → Error: {e} ❌")
        else:
            print(f"  → Vacío o NaN ⚠️")

def main():
    print("\n🚀 Iniciando pruebas de lectura de años de vigencia...\n")
    
    # Prueba 1: Con Excel generado
    probar_lectura_excel()
    
    # Prueba 2: Con archivo real si existe
    probar_con_archivo_real()
    
    print("\n💡 RECOMENDACIONES:")
    print("   1. Verificar que la columna 'Años Vigencia' tenga valores numéricos")
    print("   2. Evitar celdas vacías en resoluciones PADRE")
    print("   3. Usar valores enteros (4, 10) sin decimales")
    print("   4. Revisar los logs del backend al procesar")

if __name__ == "__main__":
    main()
