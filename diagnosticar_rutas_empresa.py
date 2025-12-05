"""
Script para diagnosticar por qué no se encuentran rutas de una empresa
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"
EMPRESA_ID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"


async def diagnosticar():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("DIAGNÓSTICO DE RUTAS POR EMPRESA")
        print("=" * 80)
        print(f"\nEmpresa ID: {EMPRESA_ID}")
        print()
        
        # 1. Verificar que la empresa existe
        print("1️⃣ VERIFICANDO EMPRESA...")
        
        # Primero intentar como string (UUID)
        empresa = await db.empresas.find_one({"_id": EMPRESA_ID})
        
        if empresa:
            print(f"   ✅ Empresa encontrada (UUID):")
            print(f"      ID: {empresa.get('_id', 'N/A')}")
            print(f"      RUC: {empresa.get('ruc', 'N/A')}")
            print(f"      Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
            print(f"      Estado: {empresa.get('estado', 'N/A')}")
            print(f"      Activa: {empresa.get('estaActivo', False)}")
        else:
            # Intentar como ObjectId
            try:
                empresa = await db.empresas.find_one({"_id": ObjectId(EMPRESA_ID)})
                if empresa:
                    print(f"   ✅ Empresa encontrada (ObjectId):")
                    print(f"      RUC: {empresa.get('ruc', 'N/A')}")
                    print(f"      Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                else:
                    print(f"   ❌ Empresa NO encontrada")
                    return
            except:
                print(f"   ❌ Empresa NO encontrada")
                return
        
        print()
        
        # 2. Verificar resoluciones de la empresa
        print("2️⃣ VERIFICANDO RESOLUCIONES DE LA EMPRESA...")
        
        # Buscar por string (UUID)
        resoluciones = await db.resoluciones.find({
            "empresaId": EMPRESA_ID,
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"   Resoluciones encontradas: {len(resoluciones)}")
        
        if resoluciones:
            print(f"\n   📋 RESOLUCIONES ENCONTRADAS: {len(resoluciones)}")
            for res in resoluciones:
                print(f"\n      • ID: {res['_id']}")
                print(f"        Número: {res.get('nroResolucion', 'N/A')}")
                print(f"        Tipo: {res.get('tipoResolucion', 'N/A')}")
                print(f"        Estado: {res.get('estado', 'N/A')}")
                print(f"        Tipo Trámite: {res.get('tipoTramite', 'N/A')}")
                print(f"        Empresa ID (en resolución): {res.get('empresaId', 'N/A')}")
                
                # Verificar si es VIGENTE y PADRE
                es_vigente = res.get('estado') == 'VIGENTE'
                es_padre = res.get('tipoResolucion') == 'PADRE'
                es_autorizacion = res.get('tipoTramite') == 'AUTORIZACION_NUEVA'
                
                print(f"        ✓ VIGENTE: {es_vigente}")
                print(f"        ✓ PADRE: {es_padre}")
                print(f"        ✓ AUTORIZACION_NUEVA: {es_autorizacion}")
                
                if es_vigente and es_padre and es_autorizacion:
                    print(f"        ✅ VÁLIDA PARA RUTAS")
                else:
                    print(f"        ⚠️  NO VÁLIDA PARA RUTAS")
        else:
            print(f"   ❌ NO se encontraron resoluciones para esta empresa")
        
        print()
        
        # 3. Verificar rutas directamente por empresaId
        print("3️⃣ VERIFICANDO RUTAS DIRECTAMENTE POR EMPRESA ID...")
        
        # Buscar por string (UUID)
        rutas = await db.rutas.find({
            "empresaId": EMPRESA_ID,
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"   Rutas encontradas: {len(rutas)}")
        
        if rutas:
            print(f"\n   🛣️  RUTAS ENCONTRADAS: {len(rutas)}")
            for ruta in rutas:
                print(f"\n      • Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"        Nombre: {ruta.get('nombre', 'N/A')}")
                print(f"        Empresa ID: {ruta.get('empresaId', 'N/A')}")
                print(f"        Resolución ID: {ruta.get('resolucionId', 'N/A')}")
                print(f"        Estado: {ruta.get('estado', 'N/A')}")
        else:
            print(f"   ❌ NO se encontraron rutas para esta empresa")
        
        print()
        
        # 4. Verificar rutas por resolución
        if resoluciones:
            print("4️⃣ VERIFICANDO RUTAS POR RESOLUCIÓN...")
            
            for res in resoluciones:
                res_id = str(res['_id'])
                print(f"\n   📋 Resolución: {res.get('nroResolucion', 'N/A')} (ID: {res_id})")
                
                # Buscar rutas por string de resolución
                rutas_res = await db.rutas.find({
                    "resolucionId": res_id,
                    "estaActivo": True
                }).to_list(length=None)
                
                print(f"      Rutas encontradas: {len(rutas_res)}")
                
                if rutas_res:
                    print(f"      ✅ {len(rutas_res)} rutas encontradas")
                    for ruta in rutas_res:
                        print(f"         - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'N/A')}")
                else:
                    print(f"      ⚠️  No hay rutas para esta resolución")
        
        print()
        
        # 5. Verificar todas las rutas del sistema
        print("5️⃣ VERIFICANDO TODAS LAS RUTAS DEL SISTEMA...")
        todas_rutas = await db.rutas.find({"estaActivo": True}).to_list(length=None)
        print(f"   Total de rutas activas en el sistema: {len(todas_rutas)}")
        
        if todas_rutas:
            print("\n   📊 RESUMEN DE RUTAS:")
            for ruta in todas_rutas:
                print(f"      • {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'N/A')}")
                print(f"        Empresa ID: {ruta.get('empresaId', 'N/A')}")
                print(f"        Resolución ID: {ruta.get('resolucionId', 'N/A')}")
        
        print()
        print("=" * 80)
        print("FIN DEL DIAGNÓSTICO")
        print("=" * 80)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(diagnosticar())
