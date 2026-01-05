#!/usr/bin/env python3
"""
Script de prueba simple para la plantilla de resoluciones padres
"""

import pandas as pd
import os
import subprocess
import glob

def test_plantilla():
    print("Iniciando pruebas de plantilla de resoluciones padres...")
    
    # 1. Generar plantilla
    print("\n1. Generando plantilla...")
    try:
        result = subprocess.run(
            ["python", "crear_plantilla_resoluciones_padres.py"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"Error generando plantilla: {result.stderr}")
            return False
        
        print("Plantilla generada exitosamente")
        
    except Exception as e:
        print(f"Error ejecutando script: {str(e)}")
        return False
    
    # 2. Buscar archivo generado
    print("\n2. Buscando archivo generado...")
    archivos_plantilla = glob.glob("plantilla_resoluciones_padres_*.xlsx")
    
    if not archivos_plantilla:
        print("No se encontro archivo de plantilla generado")
        return False
    
    archivo_plantilla = max(archivos_plantilla, key=os.path.getctime)
    print(f"Archivo encontrado: {archivo_plantilla}")
    
    # 3. Validar estructura
    print("\n3. Validando estructura...")
    try:
        df = pd.read_excel(archivo_plantilla, sheet_name='Resoluciones_Padres')
        
        columnas_esperadas = [
            'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO', 
            'RESOLUCION_ASOCIADA',
            'TIPO_RESOLUCION',
            'FECHA_RESOLUCION',
            'ESTADO',
            'FECHA_INICIO_VIGENCIA',
            'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA'
        ]
        
        columnas_faltantes = [col for col in columnas_esperadas if col not in df.columns]
        if columnas_faltantes:
            print(f"Columnas faltantes: {columnas_faltantes}")
            return False
        
        print("Todas las columnas requeridas estan presentes")
        print(f"Columnas: {list(df.columns)}")
        print(f"Filas de ejemplo: {len(df)}")
        
        if len(df) > 0:
            print("\nDatos de ejemplo:")
            for idx, row in df.iterrows():
                print(f"   Fila {idx + 1}: {row['RESOLUCION_NUMERO']} - {row['ESTADO']} - {row['TIPO_RESOLUCION']}")
        
    except Exception as e:
        print(f"Error leyendo plantilla: {str(e)}")
        return False
    
    print("\nTodas las pruebas pasaron exitosamente!")
    print(f"Archivo: {archivo_plantilla}")
    print(f"Tamaño: {os.path.getsize(archivo_plantilla) / 1024:.1f} KB")
    
    return True

if __name__ == "__main__":
    test_plantilla()