#!/usr/bin/env python3
"""
Script para verificar empresas en la base de datos
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd

async def verificar_empresas():
    """Verificar empresas en la base de datos"""
    
    print("🔍 VERIFICANDO EMPRESAS EN LA BASE DE DATOS")
    print("=" * 50)
    
    # Conectar a MongoDB (sin autenticación según .env)
    MONGODB_URL = "mongodb://localhost:27017/"
    DATABASE_NAME = "drtc_db"
    
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        empresas_collection = db["empresas"]
        
        print(f"✅ Conectado a MongoDB: {MONGODB_URL}")
        print(f"✅ Base de datos: {DATABASE_NAME}")
        
        # RUCs del Excel
        rucs_excel = [
            "20448048242",
            "20364360771", 
            "20115054229",
            "20123456789"
        ]
        
        print(f"\n📋 RUCs a verificar del Excel:")
        for ruc in rucs_excel:
            print(f"   • {ruc}")
        
        # Obtener todas las empresas activas
        print(f"\n🔍 Consultando empresas en la base de datos...")
        
        todas_empresas = await empresas_collection.find({}).to_list(length=None)
        print(f"📊 Total de empresas en BD: {len(todas_empresas)}")
        
        if len(todas_empresas) == 0:
            print("❌ No hay empresas registradas en la base de datos")
            return
        
        # Mostrar algunas empresas de ejemplo
        print(f"\n📋 Primeras 10 empresas en la BD:")
        for i, empresa in enumerate(todas_empresas[:10], 1):
            ruc = empresa.get('ruc', 'Sin RUC')
            razon_social = 'Sin razón social'
            
            if 'razonSocial' in empresa:
                if isinstance(empresa['razonSocial'], dict):
                    razon_social = empresa['razonSocial'].get('principal', 'Sin razón social')
                else:
                    razon_social = str(empresa['razonSocial'])
            elif 'nombre' in empresa:
                razon_social = empresa['nombre']
            
            estado = empresa.get('estaActivo', False)
            estado_str = "✅ ACTIVA" if estado else "❌ INACTIVA"
            
            print(f"   {i:2d}. {ruc} - {razon_social[:50]}... ({estado_str})")
        
        # Verificar cada RUC del Excel
        print(f"\n🔍 VERIFICANDO RUCs DEL EXCEL:")
        print("-" * 40)
        
        empresas_encontradas = []
        empresas_no_encontradas = []
        empresas_inactivas = []
        
        for ruc in rucs_excel:
            print(f"\n🔍 Buscando RUC: {ruc}")
            
            # Buscar empresa exacta
            empresa = await empresas_collection.find_one({"ruc": ruc})
            
            if empresa:
                # Extraer información de la empresa
                razon_social = 'Sin razón social'
                if 'razonSocial' in empresa:
                    if isinstance(empresa['razonSocial'], dict):
                        razon_social = empresa['razonSocial'].get('principal', 'Sin razón social')
                    else:
                        razon_social = str(empresa['razonSocial'])
                elif 'nombre' in empresa:
                    razon_social = empresa['nombre']
                
                esta_activo = empresa.get('estaActivo', False)
                estado_empresa = empresa.get('estado', 'Sin estado')
                
                if esta_activo:
                    print(f"   ✅ ENCONTRADA Y ACTIVA")
                    print(f"      • ID: {empresa['_id']}")
                    print(f"      • Razón Social: {razon_social}")
                    print(f"      • Estado: {estado_empresa}")
                    
                    empresas_encontradas.append({
                        'ruc': ruc,
                        'id': str(empresa['_id']),
                        'razon_social': razon_social,
                        'estado': estado_empresa,
                        'activa': True
                    })
                else:
                    print(f"   ⚠️  ENCONTRADA PERO INACTIVA")
                    print(f"      • ID: {empresa['_id']}")
                    print(f"      • Razón Social: {razon_social}")
                    print(f"      • Estado: {estado_empresa}")
                    print(f"      • estaActivo: {esta_activo}")
                    
                    empresas_inactivas.append({
                        'ruc': ruc,
                        'id': str(empresa['_id']),
                        'razon_social': razon_social,
                        'estado': estado_empresa,
                        'activa': False
                    })
            else:
                print(f"   ❌ NO ENCONTRADA")
                empresas_no_encontradas.append(ruc)
                
                # Buscar empresas similares
                print(f"      🔍 Buscando empresas similares...")
                similares = []
                
                for emp in todas_empresas:
                    emp_ruc = emp.get('ruc', '')
                    if emp_ruc and (ruc in emp_ruc or emp_ruc in ruc or abs(len(ruc) - len(emp_ruc)) <= 2):
                        razon_emp = 'Sin razón social'
                        if 'razonSocial' in emp:
                            if isinstance(emp['razonSocial'], dict):
                                razon_emp = emp['razonSocial'].get('principal', 'Sin razón social')
                            else:
                                razon_emp = str(emp['razonSocial'])
                        elif 'nombre' in emp:
                            razon_emp = emp['nombre']
                        
                        similares.append({
                            'ruc': emp_ruc,
                            'razon_social': razon_emp,
                            'activa': emp.get('estaActivo', False)
                        })
                
                if similares:
                    print(f"      📋 Empresas similares encontradas:")
                    for sim in similares[:3]:  # Mostrar máximo 3
                        estado_sim = "✅" if sim['activa'] else "❌"
                        print(f"         • {sim['ruc']} - {sim['razon_social'][:40]}... ({estado_sim})")
                else:
                    print(f"      • No se encontraron empresas similares")
        
        # Resumen final
        print(f"\n📊 RESUMEN FINAL:")
        print("=" * 30)
        print(f"   • RUCs verificados: {len(rucs_excel)}")
        print(f"   • Empresas encontradas y activas: {len(empresas_encontradas)}")
        print(f"   • Empresas encontradas pero inactivas: {len(empresas_inactivas)}")
        print(f"   • Empresas no encontradas: {len(empresas_no_encontradas)}")
        
        if empresas_encontradas:
            print(f"\n✅ EMPRESAS VÁLIDAS PARA CARGA MASIVA:")
            for emp in empresas_encontradas:
                print(f"   • {emp['ruc']} - {emp['razon_social']}")
        
        if empresas_inactivas:
            print(f"\n⚠️  EMPRESAS INACTIVAS (necesitan activarse):")
            for emp in empresas_inactivas:
                print(f"   • {emp['ruc']} - {emp['razon_social']} (Estado: {emp['estado']})")
        
        if empresas_no_encontradas:
            print(f"\n❌ EMPRESAS NO ENCONTRADAS (necesitan registrarse):")
            for ruc in empresas_no_encontradas:
                print(f"   • {ruc}")
        
        # Sugerencias
        print(f"\n💡 RECOMENDACIONES:")
        if empresas_inactivas:
            print(f"   1. Activar las empresas inactivas desde el módulo de empresas")
        if empresas_no_encontradas:
            print(f"   2. Registrar las empresas faltantes en el sistema")
        if len(empresas_encontradas) > 0:
            print(f"   3. Las empresas activas pueden procesarse sin problemas")
        
        # Mostrar RUCs de empresas activas disponibles
        empresas_activas = [emp for emp in todas_empresas if emp.get('estaActivo', False)]
        if len(empresas_activas) > 0:
            print(f"\n📋 ALGUNAS EMPRESAS ACTIVAS DISPONIBLES EN EL SISTEMA:")
            for i, emp in enumerate(empresas_activas[:10], 1):
                ruc = emp.get('ruc', 'Sin RUC')
                razon_social = 'Sin razón social'
                if 'razonSocial' in emp:
                    if isinstance(emp['razonSocial'], dict):
                        razon_social = emp['razonSocial'].get('principal', 'Sin razón social')
                    else:
                        razon_social = str(emp['razonSocial'])
                elif 'nombre' in emp:
                    razon_social = emp['nombre']
                
                print(f"   {i:2d}. {ruc} - {razon_social[:50]}...")
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(verificar_empresas())