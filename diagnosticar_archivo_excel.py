#!/usr/bin/env python3
"""
Script para diagnosticar problemas en archivos Excel de resoluciones padres
"""
import sys
import pandas as pd
import glob

def diagnosticar_excel(archivo_path):
    """Diagnosticar archivo Excel"""
    print("=" * 70)
    print(f"DIAGNÓSTICO: {archivo_path}")
    print("=" * 70)
    
    try:
        # Leer Excel
        df = pd.read_excel(archivo_path, dtype=str, keep_default_na=False)
        df = df.fillna('')
        
        print(f"\n📊 Información General:")
        print(f"   Total filas: {len(df)}")
        print(f"   Total columnas: {len(df.columns)}")
        
        print(f"\n📋 Columnas encontradas:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. '{col}'")
        
        # Verificar columnas requeridas
        columnas_requeridas = [
            'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO',
            'TIPO_RESOLUCION',
            'FECHA_INICIO_VIGENCIA',
            'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA',
            'ESTADO'
        ]
        
        print(f"\n✅ Verificación de Columnas Requeridas:")
        columnas_faltantes = []
        for col_req in columnas_requeridas:
            if col_req in df.columns:
                print(f"   ✓ {col_req}")
            else:
                print(f"   ✗ {col_req} - FALTANTE")
                columnas_faltantes.append(col_req)
        
        if columnas_faltantes:
            print(f"\n❌ PROBLEMA: Faltan columnas requeridas:")
            for col in columnas_faltantes:
                print(f"   - {col}")
            return
        
        # Verificar datos por fila
        print(f"\n📝 Verificación de Datos por Fila:")
        errores_encontrados = []
        
        for idx, row in df.iterrows():
            fila_num = idx + 2
            errores_fila = []
            
            # RUC
            ruc = str(row.get('RUC_EMPRESA_ASOCIADA', '')).strip()
            if not ruc:
                errores_fila.append("RUC vacío")
            elif len(ruc) != 11:
                errores_fila.append(f"RUC inválido (longitud: {len(ruc)})")
            
            # Número resolución
            numero = str(row.get('RESOLUCION_NUMERO', '')).strip()
            if not numero:
                errores_fila.append("Número resolución vacío")
            
            # Tipo resolución
            tipo = str(row.get('TIPO_RESOLUCION', '')).strip().upper()
            if not tipo:
                errores_fila.append("Tipo resolución vacío")
            elif tipo not in ['NUEVA', 'RENOVACION', 'MODIFICACION']:
                errores_fila.append(f"Tipo resolución inválido: '{tipo}'")
            
            # Años vigencia
            anios = str(row.get('ANIOS_VIGENCIA', '')).strip()
            if not anios:
                errores_fila.append("Años vigencia vacío")
            else:
                try:
                    anios_int = int(float(anios))
                    if anios_int < 1 or anios_int > 20:
                        errores_fila.append(f"Años vigencia fuera de rango: {anios_int}")
                except:
                    errores_fila.append(f"Años vigencia no es número: '{anios}'")
            
            # Estado
            estado = str(row.get('ESTADO', '')).strip().upper()
            if not estado:
                errores_fila.append("Estado vacío")
            elif estado not in ['ACTIVA', 'VENCIDA', 'RENOVADA', 'ANULADA']:
                errores_fila.append(f"Estado inválido: '{estado}'")
            
            # Fecha inicio vigencia
            fecha_inicio = str(row.get('FECHA_INICIO_VIGENCIA', '')).strip()
            if not fecha_inicio:
                errores_fila.append("Fecha inicio vigencia vacía")
            
            # Fecha fin vigencia
            fecha_fin = str(row.get('FECHA_FIN_VIGENCIA', '')).strip()
            if not fecha_fin:
                errores_fila.append("Fecha fin vigencia vacía")
            
            if errores_fila:
                errores_encontrados.append((fila_num, numero, errores_fila))
                print(f"\n   ❌ Fila {fila_num} ({numero}):")
                for error in errores_fila:
                    print(f"      - {error}")
            else:
                print(f"   ✓ Fila {fila_num} ({numero}) - OK")
        
        # Resumen
        print(f"\n" + "=" * 70)
        print("RESUMEN:")
        print("=" * 70)
        print(f"Total filas: {len(df)}")
        print(f"Filas con errores: {len(errores_encontrados)}")
        print(f"Filas correctas: {len(df) - len(errores_encontrados)}")
        
        if errores_encontrados:
            print(f"\n❌ SE ENCONTRARON {len(errores_encontrados)} FILAS CON ERRORES")
            print(f"\nPrimeros errores:")
            for fila_num, numero, errores in errores_encontrados[:3]:
                print(f"\n   Fila {fila_num} ({numero}):")
                for error in errores:
                    print(f"      - {error}")
        else:
            print(f"\n✅ TODAS LAS FILAS SON VÁLIDAS")
        
        # Verificar años de vigencia específicamente
        print(f"\n" + "=" * 70)
        print("ANÁLISIS DE AÑOS DE VIGENCIA:")
        print("=" * 70)
        
        if 'ANIOS_VIGENCIA' in df.columns:
            valores_anios = df['ANIOS_VIGENCIA'].tolist()
            print(f"Valores encontrados: {valores_anios}")
            
            con_4 = sum(1 for v in valores_anios if str(v).strip() == '4')
            con_10 = sum(1 for v in valores_anios if str(v).strip() == '10')
            vacios = sum(1 for v in valores_anios if str(v).strip() == '')
            otros = len(valores_anios) - con_4 - con_10 - vacios
            
            print(f"\nDistribución:")
            print(f"   4 años: {con_4}")
            print(f"   10 años: {con_10}")
            print(f"   Vacíos: {vacios}")
            print(f"   Otros: {otros}")
            
            if con_10 > 0:
                print(f"\n⭐ HAY {con_10} RESOLUCIONES CON 10 AÑOS")
            else:
                print(f"\n⚠️  NO hay resoluciones con 10 años")
        
    except Exception as e:
        print(f"\n❌ Error leyendo archivo: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🔍 Diagnóstico de Archivos Excel\n")
    
    # Buscar archivos
    archivos = glob.glob("plantilla_resoluciones_padres_*.xlsx")
    
    if not archivos:
        print("❌ No se encontraron archivos plantilla_resoluciones_padres_*.xlsx")
        print("\nBusca tu archivo y ejecútalo así:")
        print("   python diagnosticar_archivo_excel.py tu_archivo.xlsx")
        return
    
    # Diagnosticar cada archivo
    for archivo in archivos[:3]:  # Máximo 3 archivos
        diagnosticar_excel(archivo)
        print("\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Archivo específico
        diagnosticar_excel(sys.argv[1])
    else:
        # Buscar archivos automáticamente
        main()
