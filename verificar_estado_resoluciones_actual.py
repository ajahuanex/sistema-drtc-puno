"""
Script para verificar el estado actual de las resoluciones
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"


async def verificar_resoluciones():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("ESTADO ACTUAL DE RESOLUCIONES")
        print("=" * 80)
        print()
        
        # Obtener todas las resoluciones
        resoluciones = await db.resoluciones.find({}).to_list(length=None)
        
        print(f"Total de resoluciones: {len(resoluciones)}")
        print()
        
        if resoluciones:
            for i, res in enumerate(resoluciones, 1):
                print(f"{i}. ID: {res.get('_id', 'N/A')}")
                print(f"   Número: {res.get('nroResolucion', 'N/A')}")
                print(f"   Estado: {res.get('estado', 'N/A')}")
                print(f"   Tipo Resolución: {res.get('tipoResolucion', 'N/A')}")
                print(f"   Tipo Trámite: {res.get('tipoTramite', 'N/A')}")
                print(f"   Empresa ID: {res.get('empresaId', 'N/A')}")
                print(f"   Activa: {res.get('estaActivo', False)}")
                
                # Verificar empresa
                empresa_id = res.get('empresaId')
                if empresa_id:
                    try:
                        empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
                        if empresa:
                            print(f"   Empresa: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                        else:
                            print(f"   ⚠️  Empresa no encontrada")
                    except:
                        print(f"   ⚠️  Error al buscar empresa")
                
                # Contar rutas
                res_id = str(res['_id'])
                rutas = await db.rutas.find({
                    "resolucionId": res_id,
                    "estaActivo": True
                }).to_list(length=None)
                
                print(f"   Rutas: {len(rutas)}")
                
                if rutas:
                    for ruta in rutas:
                        print(f"      • {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'N/A')}")
                
                print()
        else:
            print("⚠️  No hay resoluciones en el sistema")
        
        print("=" * 80)
        
        # Verificar resoluciones VIGENTES y PADRE
        print("\nRESOLUCIONES VIGENTES Y PADRE:")
        print("=" * 80)
        
        resoluciones_validas = await db.resoluciones.find({
            "estado": "VIGENTE",
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"Total: {len(resoluciones_validas)}")
        print()
        
        if resoluciones_validas:
            for res in resoluciones_validas:
                print(f"✅ {res.get('nroResolucion', 'N/A')}")
                print(f"   ID: {res['_id']}")
                print(f"   Empresa ID: {res.get('empresaId', 'N/A')}")
                print()
        else:
            print("⚠️  No hay resoluciones VIGENTES y PADRE")
        
        print("=" * 80)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(verificar_resoluciones())
