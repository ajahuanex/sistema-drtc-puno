"""
Script para limpiar resoluciones huérfanas (sin empresa válida)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"


async def limpiar_resoluciones():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("LIMPIEZA DE RESOLUCIONES HUÉRFANAS")
        print("=" * 80)
        print()
        
        # Obtener todas las resoluciones
        resoluciones = await db.resoluciones.find({}).to_list(length=None)
        
        print(f"Total de resoluciones: {len(resoluciones)}")
        print()
        
        resoluciones_a_desactivar = []
        resoluciones_validas = []
        
        for res in resoluciones:
            empresa_id = res.get('empresaId')
            
            if not empresa_id:
                resoluciones_a_desactivar.append(res)
                continue
            
            # Verificar si la empresa existe
            try:
                empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
                if empresa:
                    resoluciones_validas.append(res)
                else:
                    resoluciones_a_desactivar.append(res)
            except:
                # Si falla al convertir a ObjectId, la empresa no existe
                resoluciones_a_desactivar.append(res)
        
        print(f"✅ Resoluciones válidas: {len(resoluciones_validas)}")
        print(f"⚠️  Resoluciones huérfanas: {len(resoluciones_a_desactivar)}")
        print()
        
        if resoluciones_a_desactivar:
            print("RESOLUCIONES A DESACTIVAR:")
            print("-" * 80)
            for res in resoluciones_a_desactivar:
                print(f"  • {res.get('nroResolucion', 'N/A')} (Empresa: {res.get('empresaId', 'N/A')})")
            print()
            
            respuesta = input("¿Deseas desactivar estas resoluciones? (s/n): ")
            
            if respuesta.lower() == 's':
                for res in resoluciones_a_desactivar:
                    await db.resoluciones.update_one(
                        {"_id": res['_id']},
                        {"$set": {"estaActivo": False}}
                    )
                    print(f"  ✅ Desactivada: {res.get('nroResolucion', 'N/A')}")
                
                print()
                print(f"✅ {len(resoluciones_a_desactivar)} resoluciones desactivadas")
            else:
                print("❌ Operación cancelada")
        else:
            print("✅ No hay resoluciones huérfanas para limpiar")
        
        print()
        print("=" * 80)
        print("RESUMEN FINAL")
        print("=" * 80)
        
        # Contar resoluciones activas
        activas = await db.resoluciones.count_documents({"estaActivo": True})
        inactivas = await db.resoluciones.count_documents({"estaActivo": False})
        
        print(f"Resoluciones activas: {activas}")
        print(f"Resoluciones inactivas: {inactivas}")
        print()
        
        # Mostrar resoluciones VIGENTES y PADRE activas
        vigentes_padre = await db.resoluciones.find({
            "estado": "VIGENTE",
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"Resoluciones VIGENTES y PADRE: {len(vigentes_padre)}")
        for res in vigentes_padre:
            empresa_id = res.get('empresaId')
            empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
            if empresa:
                print(f"  ✅ {res.get('nroResolucion', 'N/A')} - {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        
        print()
        print("=" * 80)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(limpiar_resoluciones())
