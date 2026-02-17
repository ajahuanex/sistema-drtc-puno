#!/usr/bin/env python3
"""
Script para debuggear el Excel real que está usando el usuario
"""
import pandas as pd
import sys

def analizar_excel(archivo):
    """Analizar el Excel que está causando problemas"""
    print("=" * 70)
    print(f"ANALIZANDO ARCHIVO: {archivo}")
    print("=" * 70)
    
    try:
        # Leer Excel como lo hace el servicio
        print("\n1. Leyendo Excel con dtype=str...")
        df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
        df = df.fillna('')
        
        print(f"\n✅ Archivo leído correctamente")
        print(f"   Total de filas: {len(df)}")
        print(f"   Total de columnas: {len(df.columns)}")
        
        # Mostrar columnas
        print("\n2. Columnas encontradas:")
        for i, col in enumerate(df.columns, 1):
            print(f"   {i}. {col}")
        
        # Verificar si existe la columna Años Vigencia
        if 'Años Vigencia' not in df.columns:
            print("\n❌ ERROR CRÍTICO: La columna 'Años Vigencia' NO existe en el Excel")
            print("\n💡 SOLUCIÓN:")
            print("   1. Descargar nueva plantilla desde el frontend")
            print("   2. Copiar los datos al nuevo Excel")
            print("   3. Asegurarse de que la columna F sea 'Años Vigencia'")
            return False
        
        print("\n✅ Columna 'Años Vigencia' encontrada")
        
        # Analizar cada fila
        print("\n3. Analizando datos de Años Vigencia:")
        print("-" * 70)
        
        for index, row in df.iterrows():
            numero = row.get('Número Resolución', 'N/A')
            tipo = row.get('Tipo Resolución', 'N/A')
            anios_raw = row.get('Años Vigencia', '')
            anios_str = str(anios_raw).strip() if anios_raw is not None and str(anios_raw).strip() else ''
            
            print(f"\nFila {index + 2}: {numero} ({tipo})")
            print(f"   Valor raw: '{anios_raw}' (tipo: {type(anios_raw).__name__})")
            print(f"   Valor str: '{anios_str}'")
            
            # Simular conversión
            if anios_str and anios_str.lower() not in ['nan', 'none', '', 'null']:
                try:
                    anios = int(float(anios_str))
                    print(f"   ✅ Convertido: {anios} años")
                    
                    if anios == 4:
                        print(f"   ℹ️  Se guardará con 4 años de vigencia")
                    elif anios == 10:
                        print(f"   ℹ️  Se guardará con 10 años de vigencia")
                    else:
                        print(f"   ⚠️  Valor inusual: {anios} años")
                        
                except (ValueError, TypeError) as e:
                    print(f"   ❌ Error al convertir: {e}")
                    print(f"   ⚠️  Se usará 4 años por defecto")
            else:
                if tipo == 'PADRE':
                    print(f"   ❌ PROBLEMA: Resolución PADRE sin años de vigencia")
                    print(f"   ⚠️  Se usará 4 años por defecto")
                else:
                    print(f"   ✅ OK: Resolución HIJO (hereda del padre)")
        
        print("\n" + "=" * 70)
        print("RESUMEN")
        print("=" * 70)
        
        # Contar resoluciones por años de vigencia
        padres = df[df['Tipo Resolución'].str.upper() == 'PADRE']
        
        if len(padres) > 0:
            print(f"\nResoluciones PADRE: {len(padres)}")
            
            for index, row in padres.iterrows():
                numero = row.get('Número Resolución', 'N/A')
                anios_raw = row.get('Años Vigencia', '')
                anios_str = str(anios_raw).strip() if anios_raw is not None and str(anios_raw).strip() else ''
                
                if anios_str and anios_str.lower() not in ['nan', 'none', '', 'null']:
                    try:
                        anios = int(float(anios_str))
                        print(f"   {numero}: {anios} años")
                    except:
                        print(f"   {numero}: ERROR - se usará 4 años")
                else:
                    print(f"   {numero}: VACÍO - se usará 4 años")
        
        return True
        
    except FileNotFoundError:
        print(f"\n❌ ERROR: Archivo '{archivo}' no encontrado")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Función principal"""
    if len(sys.argv) < 2:
        print("=" * 70)
        print("USO: python debug_excel_real.py <archivo.xlsx>")
        print("=" * 70)
        print("\nEjemplo:")
        print("   python debug_excel_real.py plantilla_resoluciones.xlsx")
        print("\n💡 Este script analiza el Excel que está usando para")
        print("   identificar por qué los años de vigencia no se leen correctamente")
        return 1
    
    archivo = sys.argv[1]
    resultado = analizar_excel(archivo)
    
    if resultado:
        print("\n✅ Análisis completado")
        print("\n💡 PRÓXIMOS PASOS:")
        print("   1. Revisar los valores mostrados arriba")
        print("   2. Si hay valores vacíos en PADRE, llenarlos con 4 o 10")
        print("   3. Si la columna no existe, descargar nueva plantilla")
        print("   4. Procesar el archivo en el frontend")
        print("   5. Revisar los logs del backend")
        return 0
    else:
        print("\n❌ Análisis falló")
        return 1

if __name__ == "__main__":
    sys.exit(main())
