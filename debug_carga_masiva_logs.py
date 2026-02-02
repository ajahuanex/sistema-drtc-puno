#!/usr/bin/env python3
"""
Script para mostrar logs detallados de la carga masiva de rutas
"""
import pandas as pd
import re

def debug_excel_lectura(archivo_excel):
    """Debuggear la lectura del archivo Excel paso a paso"""
    
    print("🔍 DIAGNÓSTICO DETALLADO DE LECTURA DE EXCEL")
    print("=" * 60)
    
    try:
        # Paso 1: Intentar leer el archivo
        print("📁 Paso 1: Leyendo archivo Excel...")
        
        df = None
        sheet_name_used = None
        
        try:
            df = pd.read_excel(archivo_excel, sheet_name='DATOS')
            sheet_name_used = 'DATOS'
            print(f"✅ Leído exitosamente desde hoja 'DATOS'")
        except Exception as e1:
            print(f"⚠️  No se pudo leer hoja 'DATOS': {str(e1)}")
            try:
                df = pd.read_excel(archivo_excel, sheet_name=0)
                sheet_name_used = 'Primera hoja (índice 0)'
                print(f"✅ Leído exitosamente desde primera hoja")
            except Exception as e2:
                print(f"⚠️  No se pudo leer primera hoja: {str(e2)}")
                try:
                    df = pd.read_excel(archivo_excel)
                    sheet_name_used = 'Hoja por defecto'
                    print(f"✅ Leído exitosamente desde hoja por defecto")
                except Exception as e3:
                    print(f"❌ Error leyendo archivo: {str(e3)}")
                    return
        
        # Paso 2: Analizar estructura
        print(f"\n📊 Paso 2: Analizando estructura del DataFrame...")
        print(f"   • Hoja utilizada: {sheet_name_used}")
        print(f"   • Forma del DataFrame: {df.shape}")
        print(f"   • Columnas originales: {list(df.columns)}")
        
        # Paso 3: Normalizar columnas
        print(f"\n🔧 Paso 3: Normalizando nombres de columnas...")
        columnas_originales = list(df.columns)
        
        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)
        df.columns = df.columns.str.replace(r'\s*\([^)]*\)\s*', '', regex=True)
        
        columnas_normalizadas = list(df.columns)
        print(f"   • Columnas normalizadas: {columnas_normalizadas}")
        
        if columnas_originales != columnas_normalizadas:
            print(f"   • Cambios realizados:")
            for orig, norm in zip(columnas_originales, columnas_normalizadas):
                if orig != norm:
                    print(f"     - '{orig}' → '{norm}'")
        
        # Paso 4: Filtrar filas vacías
        print(f"\n🧹 Paso 4: Filtrando filas vacías...")
        filas_antes = len(df)
        df = df.dropna(how='all')
        filas_despues = len(df)
        
        print(f"   • Filas antes: {filas_antes}")
        print(f"   • Filas después: {filas_despues}")
        print(f"   • Filas eliminadas: {filas_antes - filas_despues}")
        
        if filas_despues == 0:
            print("❌ No quedan filas válidas después del filtrado")
            return
        
        # Paso 5: Analizar datos por columna
        print(f"\n📋 Paso 5: Analizando datos por columna...")
        
        columnas_importantes = ['RUC', 'Resolución', 'Código Ruta', 'Origen', 'Destino', 'Frecuencia']
        
        for columna in columnas_importantes:
            if columna in df.columns:
                valores_no_nulos = df[columna].dropna()
                valores_unicos = valores_no_nulos.nunique()
                
                print(f"\n   📊 Columna '{columna}':")
                print(f"      • Valores no nulos: {len(valores_no_nulos)}/{len(df)}")
                print(f"      • Valores únicos: {valores_unicos}")
                
                if len(valores_no_nulos) > 0:
                    # Mostrar algunos ejemplos
                    ejemplos = valores_no_nulos.head(3).tolist()
                    print(f"      • Ejemplos: {ejemplos}")
                    
                    # Para RUC, validar formato
                    if columna == 'RUC':
                        rucs_validos = 0
                        rucs_invalidos = []
                        
                        for idx, valor in valores_no_nulos.items():
                            ruc_str = str(valor).strip()
                            if ruc_str.isdigit() and len(ruc_str) == 11:
                                rucs_validos += 1
                            else:
                                rucs_invalidos.append((idx + 2, ruc_str))  # +2 para número de fila en Excel
                        
                        print(f"      • RUCs válidos: {rucs_validos}/{len(valores_no_nulos)}")
                        
                        if rucs_invalidos:
                            print(f"      • RUCs inválidos:")
                            for fila, ruc in rucs_invalidos[:5]:  # Mostrar máximo 5
                                print(f"        - Fila {fila}: '{ruc}'")
            else:
                print(f"\n   ❌ Columna '{columna}' no encontrada")
        
        # Paso 6: Procesar fila por fila (primeras 5)
        print(f"\n🔍 Paso 6: Procesando primeras 5 filas detalladamente...")
        
        for index, row in df.head(5).iterrows():
            fila_num = index + 2  # +2 porque Excel empieza en 1 y tiene header
            print(f"\n   📝 Fila {fila_num}:")
            
            # Extraer campos importantes
            campos = {}
            for columna in columnas_importantes:
                if columna in df.columns:
                    valor_raw = row.get(columna, '')
                    valor_procesado = str(valor_raw).strip() if pd.notna(valor_raw) else ''
                    
                    # Limpiar valores que pandas convierte a 'nan' string
                    if valor_procesado in ['nan', 'None']:
                        valor_procesado = ''
                    
                    campos[columna] = {
                        'raw': valor_raw,
                        'procesado': valor_procesado,
                        'valido': bool(valor_procesado)
                    }
            
            # Mostrar campos
            for columna, info in campos.items():
                estado = "✅" if info['valido'] else "❌"
                print(f"      {estado} {columna}: '{info['raw']}' → '{info['procesado']}'")
            
            # Validaciones específicas
            validaciones = []
            
            if 'RUC' in campos:
                ruc = campos['RUC']['procesado']
                if not ruc:
                    validaciones.append("❌ RUC vacío")
                elif not (ruc.isdigit() and len(ruc) == 11):
                    validaciones.append(f"❌ RUC formato inválido: '{ruc}'")
                else:
                    validaciones.append(f"✅ RUC válido: {ruc}")
            
            if validaciones:
                print(f"      Validaciones:")
                for validacion in validaciones:
                    print(f"        {validacion}")
        
        # Paso 7: Resumen final
        print(f"\n📊 RESUMEN FINAL:")
        print(f"   • Archivo leído exitosamente: ✅")
        print(f"   • Hoja utilizada: {sheet_name_used}")
        print(f"   • Total de filas procesables: {len(df)}")
        print(f"   • Columnas encontradas: {len(df.columns)}")
        
        # Verificar columnas obligatorias
        columnas_obligatorias = ['RUC', 'Resolución', 'Código Ruta', 'Origen', 'Destino', 'Frecuencia']
        columnas_faltantes = [col for col in columnas_obligatorias if col not in df.columns]
        
        if columnas_faltantes:
            print(f"   • ❌ Columnas obligatorias faltantes: {columnas_faltantes}")
        else:
            print(f"   • ✅ Todas las columnas obligatorias presentes")
        
        return df
        
    except Exception as e:
        print(f"❌ Error general en diagnóstico: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Función para usar desde el navegador o línea de comandos
def main():
    import sys
    
    if len(sys.argv) > 1:
        archivo = sys.argv[1]
    else:
        # Buscar archivo Excel en el directorio actual
        import os
        excel_files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
        
        if not excel_files:
            print("❌ No se encontraron archivos Excel (.xlsx) en el directorio actual")
            print("💡 Uso: python debug_carga_masiva_logs.py archivo.xlsx")
            return
        
        archivo = excel_files[0]
        print(f"📁 Usando archivo encontrado: {archivo}")
    
    debug_excel_lectura(archivo)

if __name__ == "__main__":
    main()