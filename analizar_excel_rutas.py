#!/usr/bin/env python3
"""
Script para analizar archivo Excel de rutas y mostrar problemas con empresas
"""
import pandas as pd
import os
import sys

def analizar_excel_rutas():
    """Analizar archivo Excel de rutas paso a paso"""
    
    print("🔍 ANALIZADOR DE EXCEL DE RUTAS")
    print("=" * 50)
    
    # Buscar archivos Excel
    excel_files = [f for f in os.listdir('.') if f.endswith('.xlsx') and not f.startswith('~')]
    
    if not excel_files:
        print("❌ No se encontraron archivos Excel (.xlsx) en el directorio actual")
        print("💡 Coloca el archivo Excel en el mismo directorio que este script")
        return
    
    # Mostrar archivos encontrados
    print(f"📁 Archivos Excel encontrados:")
    for i, archivo in enumerate(excel_files, 1):
        print(f"   {i}. {archivo}")
    
    # Seleccionar archivo
    if len(excel_files) == 1:
        archivo_seleccionado = excel_files[0]
        print(f"\n📄 Usando archivo: {archivo_seleccionado}")
    else:
        try:
            seleccion = input(f"\nSelecciona un archivo (1-{len(excel_files)}): ")
            indice = int(seleccion) - 1
            archivo_seleccionado = excel_files[indice]
            print(f"📄 Usando archivo: {archivo_seleccionado}")
        except (ValueError, IndexError):
            archivo_seleccionado = excel_files[0]
            print(f"📄 Usando primer archivo por defecto: {archivo_seleccionado}")
    
    try:
        # Leer archivo Excel
        print(f"\n📖 Leyendo archivo Excel...")
        
        df = None
        hoja_usada = None
        
        # Intentar diferentes hojas
        try:
            df = pd.read_excel(archivo_seleccionado, sheet_name='DATOS')
            hoja_usada = 'DATOS'
        except:
            try:
                df = pd.read_excel(archivo_seleccionado, sheet_name=0)
                hoja_usada = 'Primera hoja'
            except:
                df = pd.read_excel(archivo_seleccionado)
                hoja_usada = 'Hoja por defecto'
        
        print(f"✅ Archivo leído desde: {hoja_usada}")
        print(f"📊 Dimensiones: {df.shape[0]} filas x {df.shape[1]} columnas")
        
        # Mostrar columnas
        print(f"\n📋 Columnas encontradas:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. '{col}'")
        
        # Normalizar nombres de columnas
        print(f"\n🔧 Normalizando nombres de columnas...")
        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)
        df.columns = df.columns.str.replace(r'\s*\([^)]*\)\s*', '', regex=True)
        
        print(f"📋 Columnas normalizadas:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. '{col}'")
        
        # Filtrar filas vacías
        filas_antes = len(df)
        df = df.dropna(how='all')
        filas_despues = len(df)
        
        print(f"\n🧹 Filtrado de filas vacías:")
        print(f"   • Antes: {filas_antes} filas")
        print(f"   • Después: {filas_despues} filas")
        print(f"   • Eliminadas: {filas_antes - filas_despues} filas")
        
        if filas_despues == 0:
            print("❌ No quedan filas válidas para procesar")
            return
        
        # Analizar columna RUC específicamente
        print(f"\n🏢 ANÁLISIS DE EMPRESAS (RUC):")
        print("-" * 30)
        
        if 'RUC' not in df.columns:
            print("❌ Columna 'RUC' no encontrada")
            print("📋 Columnas disponibles:", list(df.columns))
            return
        
        # Extraer RUCs
        rucs_raw = df['RUC'].dropna()
        print(f"📊 RUCs encontrados (no nulos): {len(rucs_raw)}")
        
        if len(rucs_raw) == 0:
            print("❌ No se encontraron RUCs válidos")
            return
        
        # Analizar cada RUC
        rucs_validos = []
        rucs_invalidos = []
        
        print(f"\n📋 Análisis detallado de RUCs:")
        
        for idx, ruc_raw in rucs_raw.items():
            fila_excel = idx + 2  # +2 porque Excel empieza en 1 y tiene header
            ruc_str = str(ruc_raw).strip()
            
            # Validar formato
            es_valido = ruc_str.isdigit() and len(ruc_str) == 11
            
            if es_valido:
                rucs_validos.append((fila_excel, ruc_str))
                print(f"   ✅ Fila {fila_excel}: {ruc_str}")
            else:
                rucs_invalidos.append((fila_excel, ruc_str, ruc_raw))
                print(f"   ❌ Fila {fila_excel}: '{ruc_raw}' → '{ruc_str}' (formato inválido)")
        
        print(f"\n📊 RESUMEN DE RUCs:")
        print(f"   • Total procesados: {len(rucs_raw)}")
        print(f"   • Válidos: {len(rucs_validos)}")
        print(f"   • Inválidos: {len(rucs_invalidos)}")
        
        if rucs_invalidos:
            print(f"\n⚠️  RUCs con problemas:")
            for fila, ruc_procesado, ruc_original in rucs_invalidos:
                print(f"   • Fila {fila}: '{ruc_original}' → '{ruc_procesado}'")
                
                # Sugerir correcciones
                if ruc_procesado.isdigit():
                    if len(ruc_procesado) < 11:
                        sugerencia = ruc_procesado.zfill(11)
                        print(f"     💡 Sugerencia: {sugerencia}")
                    elif len(ruc_procesado) > 11:
                        print(f"     💡 Problema: Demasiados dígitos")
                else:
                    # Extraer solo números
                    import re
                    solo_numeros = re.sub(r'[^0-9]', '', str(ruc_original))
                    if len(solo_numeros) == 11:
                        print(f"     💡 Sugerencia: {solo_numeros}")
        
        # Mostrar RUCs únicos válidos
        if rucs_validos:
            rucs_unicos = list(set([ruc for _, ruc in rucs_validos]))
            print(f"\n📋 RUCs únicos válidos ({len(rucs_unicos)}):")
            for ruc in sorted(rucs_unicos):
                # Contar cuántas veces aparece
                apariciones = len([r for _, r in rucs_validos if r == ruc])
                print(f"   • {ruc} (aparece {apariciones} vez/veces)")
        
        # Analizar otras columnas importantes
        print(f"\n📋 ANÁLISIS DE OTRAS COLUMNAS:")
        print("-" * 35)
        
        columnas_importantes = ['Resolución', 'Código Ruta', 'Origen', 'Destino', 'Frecuencia']
        
        for columna in columnas_importantes:
            if columna in df.columns:
                valores_no_nulos = df[columna].dropna()
                valores_vacios = len(df) - len(valores_no_nulos)
                valores_unicos = valores_no_nulos.nunique()
                
                print(f"\n   📊 {columna}:")
                print(f"      • Valores no nulos: {len(valores_no_nulos)}/{len(df)}")
                print(f"      • Valores vacíos: {valores_vacios}")
                print(f"      • Valores únicos: {valores_unicos}")
                
                if len(valores_no_nulos) > 0:
                    ejemplos = valores_no_nulos.head(3).tolist()
                    print(f"      • Ejemplos: {ejemplos}")
                    
                    # Mostrar valores problemáticos
                    valores_problematicos = []
                    for idx, valor in valores_no_nulos.items():
                        valor_str = str(valor).strip()
                        if valor_str in ['nan', 'None', '', '-']:
                            valores_problematicos.append((idx + 2, valor))
                    
                    if valores_problematicos:
                        print(f"      • Valores problemáticos: {len(valores_problematicos)}")
                        for fila, valor in valores_problematicos[:3]:
                            print(f"        - Fila {fila}: '{valor}'")
            else:
                print(f"\n   ❌ {columna}: Columna no encontrada")
        
        # Mostrar primeras filas completas
        print(f"\n📄 PRIMERAS 3 FILAS COMPLETAS:")
        print("-" * 40)
        
        for idx in range(min(3, len(df))):
            fila_excel = idx + 2
            print(f"\n   📝 Fila {fila_excel}:")
            
            for columna in ['RUC', 'Resolución', 'Código Ruta', 'Origen', 'Destino']:
                if columna in df.columns:
                    valor_raw = df.iloc[idx][columna]
                    valor_procesado = str(valor_raw).strip() if pd.notna(valor_raw) else ''
                    
                    if valor_procesado in ['nan', 'None']:
                        valor_procesado = '(vacío)'
                    
                    estado = "✅" if valor_procesado and valor_procesado != '(vacío)' else "❌"
                    print(f"      {estado} {columna}: '{valor_raw}' → '{valor_procesado}'")
        
        print(f"\n✅ ANÁLISIS COMPLETADO")
        print(f"💡 Para resolver problemas de empresas:")
        print(f"   1. Verifica que los RUCs tengan exactamente 11 dígitos")
        print(f"   2. Asegúrate de que las empresas estén registradas en el sistema")
        print(f"   3. Verifica que las empresas estén activas")
        
    except Exception as e:
        print(f"❌ Error al analizar archivo: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analizar_excel_rutas()