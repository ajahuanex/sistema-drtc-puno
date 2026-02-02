#!/usr/bin/env python3
"""
Script para debuggear problemas con empresas en carga masiva de rutas
"""
import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

async def debug_empresas_excel():
    """Debuggear empresas en Excel vs Base de datos"""
    
    # Conectar a MongoDB
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "sirret")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    empresas_collection = db["empresas"]
    
    print("🔍 DIAGNÓSTICO DE EMPRESAS EN CARGA MASIVA")
    print("=" * 60)
    
    # 1. Leer archivo Excel (buscar el archivo más reciente)
    excel_files = [f for f in os.listdir('.') if f.endswith('.xlsx') and 'ruta' in f.lower()]
    
    if not excel_files:
        print("❌ No se encontraron archivos Excel de rutas")
        print("   Coloca el archivo Excel en el directorio actual")
        return
    
    excel_file = excel_files[0]  # Tomar el primero
    print(f"📁 Archivo Excel encontrado: {excel_file}")
    
    try:
        # Intentar leer diferentes hojas
        df = None
        try:
            df = pd.read_excel(excel_file, sheet_name='DATOS')
            print("✅ Leído desde hoja 'DATOS'")
        except:
            try:
                df = pd.read_excel(excel_file, sheet_name=0)
                print("✅ Leído desde primera hoja")
            except:
                df = pd.read_excel(excel_file)
                print("✅ Leído desde hoja por defecto")
        
        if df is None or df.empty:
            print("❌ El archivo Excel está vacío")
            return
        
        # Normalizar nombres de columnas
        df.columns = df.columns.str.strip()
        df.columns = df.columns.str.replace(r'\s*\(\*\)\s*', '', regex=True)
        df.columns = df.columns.str.replace(r'\s*\([^)]*\)\s*', '', regex=True)
        
        print(f"📊 Columnas encontradas: {list(df.columns)}")
        print(f"📊 Total de filas: {len(df)}")
        
        # Filtrar filas vacías
        df = df.dropna(how='all')
        print(f"📊 Filas después de filtrar vacías: {len(df)}")
        
        # 2. Extraer RUCs del Excel
        rucs_excel = set()
        rucs_problematicos = []
        
        for index, row in df.iterrows():
            ruc_raw = row.get('RUC', '')
            if pd.notna(ruc_raw):
                ruc = str(ruc_raw).strip()
                if ruc and ruc not in ['nan', 'None']:
                    rucs_excel.add(ruc)
                    
                    # Validar formato
                    if not (ruc.isdigit() and len(ruc) == 11):
                        rucs_problematicos.append({
                            'fila': index + 2,
                            'ruc': ruc,
                            'problema': 'Formato inválido (debe ser 11 dígitos)'
                        })
        
        print(f"\n📋 RUCs encontrados en Excel: {len(rucs_excel)}")
        for ruc in sorted(rucs_excel):
            print(f"   • {ruc}")
        
        if rucs_problematicos:
            print(f"\n⚠️  RUCs con problemas de formato: {len(rucs_problematicos)}")
            for problema in rucs_problematicos:
                print(f"   • Fila {problema['fila']}: {problema['ruc']} - {problema['problema']}")
        
        # 3. Consultar empresas en la base de datos
        print(f"\n🔍 Consultando empresas en la base de datos...")
        
        empresas_encontradas = []
        empresas_no_encontradas = []
        empresas_inactivas = []
        
        for ruc in rucs_excel:
            # Buscar empresa exacta
            empresa = await empresas_collection.find_one({"ruc": ruc})
            
            if empresa:
                if empresa.get("estaActivo", False):
                    empresas_encontradas.append({
                        'ruc': ruc,
                        'id': str(empresa['_id']),
                        'razon_social': empresa.get('razonSocial', {}).get('principal', 'Sin razón social'),
                        'estado': empresa.get('estado', 'Sin estado')
                    })
                else:
                    empresas_inactivas.append({
                        'ruc': ruc,
                        'id': str(empresa['_id']),
                        'razon_social': empresa.get('razonSocial', {}).get('principal', 'Sin razón social'),
                        'estado': empresa.get('estado', 'Sin estado')
                    })
            else:
                empresas_no_encontradas.append(ruc)
        
        # 4. Mostrar resultados
        print(f"\n✅ EMPRESAS ENCONTRADAS Y ACTIVAS: {len(empresas_encontradas)}")
        for emp in empresas_encontradas:
            print(f"   • {emp['ruc']} - {emp['razon_social']} (Estado: {emp['estado']})")
        
        print(f"\n⚠️  EMPRESAS INACTIVAS: {len(empresas_inactivas)}")
        for emp in empresas_inactivas:
            print(f"   • {emp['ruc']} - {emp['razon_social']} (Estado: {emp['estado']})")
        
        print(f"\n❌ EMPRESAS NO ENCONTRADAS: {len(empresas_no_encontradas)}")
        for ruc in empresas_no_encontradas:
            print(f"   • {ruc}")
        
        # 5. Buscar empresas similares para RUCs no encontrados
        if empresas_no_encontradas:
            print(f"\n🔍 Buscando empresas similares...")
            
            # Obtener todas las empresas activas
            todas_empresas = await empresas_collection.find({
                "estaActivo": True
            }).to_list(length=None)
            
            print(f"📊 Total de empresas activas en BD: {len(todas_empresas)}")
            
            for ruc_no_encontrado in empresas_no_encontradas:
                print(f"\n🔍 Buscando similares para RUC: {ruc_no_encontrado}")
                
                # Buscar por RUC parcial
                similares = []
                for empresa in todas_empresas:
                    emp_ruc = empresa.get('ruc', '')
                    if emp_ruc and (ruc_no_encontrado in emp_ruc or emp_ruc in ruc_no_encontrado):
                        similares.append({
                            'ruc': emp_ruc,
                            'razon_social': empresa.get('razonSocial', {}).get('principal', 'Sin razón social'),
                            'similitud': 'RUC parcial'
                        })
                
                if similares:
                    print(f"   Empresas similares encontradas:")
                    for sim in similares[:5]:  # Mostrar máximo 5
                        print(f"     • {sim['ruc']} - {sim['razon_social']} ({sim['similitud']})")
                else:
                    print(f"   No se encontraron empresas similares")
        
        # 6. Resumen y recomendaciones
        print(f"\n📊 RESUMEN:")
        print(f"   • RUCs en Excel: {len(rucs_excel)}")
        print(f"   • Empresas encontradas y activas: {len(empresas_encontradas)}")
        print(f"   • Empresas inactivas: {len(empresas_inactivas)}")
        print(f"   • Empresas no encontradas: {len(empresas_no_encontradas)}")
        print(f"   • RUCs con formato inválido: {len(rucs_problematicos)}")
        
        if empresas_no_encontradas or empresas_inactivas or rucs_problematicos:
            print(f"\n💡 RECOMENDACIONES:")
            
            if rucs_problematicos:
                print(f"   1. Corregir formato de RUCs inválidos (deben ser 11 dígitos)")
            
            if empresas_no_encontradas:
                print(f"   2. Registrar las empresas faltantes en el módulo de empresas")
                print(f"   3. Verificar que los RUCs estén escritos correctamente")
            
            if empresas_inactivas:
                print(f"   4. Activar las empresas inactivas si es necesario")
        else:
            print(f"\n✅ Todas las empresas están correctas y pueden procesarse")
    
    except Exception as e:
        print(f"❌ Error al procesar archivo Excel: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_empresas_excel())