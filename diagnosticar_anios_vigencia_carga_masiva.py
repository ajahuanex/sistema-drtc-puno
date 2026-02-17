#!/usr/bin/env python3
"""
Script para diagnosticar el problema de años de vigencia en carga masiva
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def diagnosticar_problema():
    """Diagnosticar el problema de años de vigencia"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("DIAGNÓSTICO: Años de Vigencia en Carga Masiva")
    print("=" * 70)
    
    try:
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Obtener todas las resoluciones PADRE
        resoluciones_padre = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"\n📊 Total de resoluciones PADRE: {len(resoluciones_padre)}")
        
        # Analizar años de vigencia
        con_4_anios = 0
        con_10_anios = 0
        sin_anios = 0
        otros = 0
        
        print("\n" + "=" * 70)
        print("DETALLE DE RESOLUCIONES PADRE:")
        print("=" * 70)
        
        for res in resoluciones_padre:
            numero = res.get('nroResolucion', 'N/A')
            anios = res.get('aniosVigencia')
            fecha_inicio = res.get('fechaVigenciaInicio', 'N/A')
            fecha_fin = res.get('fechaVigenciaFin', 'N/A')
            
            print(f"\n📋 {numero}")
            print(f"   Años Vigencia: {anios}")
            print(f"   Fecha Inicio: {fecha_inicio}")
            print(f"   Fecha Fin: {fecha_fin}")
            
            if anios is None:
                sin_anios += 1
                print(f"   ⚠️  SIN años de vigencia")
            elif anios == 4:
                con_4_anios += 1
                print(f"   ✅ 4 años")
            elif anios == 10:
                con_10_anios += 1
                print(f"   ✅ 10 años")
            else:
                otros += 1
                print(f"   ℹ️  {anios} años (inusual)")
        
        # Resumen
        print("\n" + "=" * 70)
        print("RESUMEN:")
        print("=" * 70)
        print(f"✅ Con 4 años: {con_4_anios}")
        print(f"✅ Con 10 años: {con_10_anios}")
        print(f"⚠️  Sin años: {sin_anios}")
        print(f"ℹ️  Otros: {otros}")
        
        # Diagnóstico
        print("\n" + "=" * 70)
        print("DIAGNÓSTICO:")
        print("=" * 70)
        
        if sin_anios > 0:
            print(f"\n❌ PROBLEMA DETECTADO:")
            print(f"   {sin_anios} resoluciones PADRE sin años de vigencia")
            print(f"\n💡 POSIBLES CAUSAS:")
            print(f"   1. La columna 'Años Vigencia' está vacía en el Excel")
            print(f"   2. La columna tiene valores NaN o inválidos")
            print(f"   3. El código no está leyendo correctamente la columna")
            
        if con_4_anios == len(resoluciones_padre) and con_10_anios == 0:
            print(f"\n⚠️  ADVERTENCIA:")
            print(f"   Todas las resoluciones tienen 4 años (valor por defecto)")
            print(f"   Esto puede indicar que el Excel no tiene la columna correcta")
            
        if con_10_anios > 0:
            print(f"\n✅ CORRECTO:")
            print(f"   Se encontraron {con_10_anios} resoluciones con 10 años")
            print(f"   El sistema está leyendo correctamente los años de vigencia")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def probar_lectura_excel():
    """Probar lectura de años de vigencia desde Excel"""
    import pandas as pd
    from io import BytesIO
    
    print("\n" + "=" * 70)
    print("PRUEBA: Lectura de Excel")
    print("=" * 70)
    
    # Buscar archivos de plantilla
    import glob
    archivos_excel = glob.glob("plantilla_resoluciones*.xlsx")
    
    if not archivos_excel:
        print("\n⚠️  No se encontraron archivos de plantilla")
        return
    
    for archivo in archivos_excel[:3]:  # Solo los primeros 3
        print(f"\n📄 Archivo: {archivo}")
        try:
            df = pd.read_excel(archivo, dtype=str, keep_default_na=False)
            df = df.fillna('')
            
            print(f"   Columnas: {list(df.columns)}")
            
            if 'Años Vigencia' in df.columns:
                print(f"   ✅ Columna 'Años Vigencia' encontrada")
                
                # Mostrar primeras filas
                for idx, row in df.head(5).iterrows():
                    numero = row.get('Número Resolución', 'N/A')
                    anios_raw = row.get('Años Vigencia', '')
                    anios_str = str(anios_raw).strip()
                    
                    print(f"\n   Fila {idx + 2}:")
                    print(f"      Número: {numero}")
                    print(f"      Años (raw): '{anios_raw}' (tipo: {type(anios_raw).__name__})")
                    print(f"      Años (str): '{anios_str}'")
                    
                    # Intentar convertir
                    if anios_str and anios_str.lower() not in ['nan', 'none', '', 'null']:
                        try:
                            anios_int = int(float(anios_str))
                            print(f"      Años (int): {anios_int} ✅")
                        except (ValueError, TypeError) as e:
                            print(f"      Error conversión: {e} ❌")
                    else:
                        print(f"      Años vacío o NaN, usaría 4 por defecto")
            else:
                print(f"   ❌ Columna 'Años Vigencia' NO encontrada")
                print(f"   Columnas disponibles: {list(df.columns)}")
                
        except Exception as e:
            print(f"   ❌ Error leyendo archivo: {e}")

def main():
    """Función principal"""
    print("\n🔍 Diagnóstico de Años de Vigencia en Carga Masiva\n")
    
    # Diagnosticar base de datos
    asyncio.run(diagnosticar_problema())
    
    # Probar lectura de Excel
    asyncio.run(probar_lectura_excel())
    
    print("\n" + "=" * 70)
    print("RECOMENDACIONES:")
    print("=" * 70)
    print("1. Descargar nueva plantilla desde el frontend")
    print("2. Verificar que la columna F sea 'Años Vigencia'")
    print("3. Llenar con valores 4 o 10 según corresponda")
    print("4. NO dejar celdas vacías en la columna 'Años Vigencia'")
    print("5. Volver a procesar el archivo")
    print("=" * 70)

if __name__ == "__main__":
    main()
