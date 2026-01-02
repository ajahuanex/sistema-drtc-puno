"""
Corregir la resolución recién creada para asociarla a una empresa válida
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"


async def corregir_resolucion():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("CORRECCIÓN DE RESOLUCIÓN NUEVA")
        print("=" * 80)
        print()
        
        # Buscar la resolución R-0009-2025
        resolucion = await db.resoluciones.find_one({"nroResolucion": "R-0009-2025"})
        
        if not resolucion:
            print("❌ No se encontró la resolución R-0009-2025")
            return
        
        print(f"✅ Resolución encontrada: {resolucion['nroResolucion']}")
        print(f"   ID: {resolucion['_id']}")
        print(f"   Empresa actual: {resolucion.get('empresaId', 'N/A')}")
        print()
        
        # Buscar empresa válida
        empresa = await db.empresas.find_one({"ruc": "20505050505"})
        
        if not empresa:
            print("❌ No se encontró la empresa válida")
            return
        
        empresa_id = str(empresa['_id'])
        print(f"✅ Empresa válida encontrada:")
        print(f"   ID: {empresa_id}")
        print(f"   RUC: {empresa['ruc']}")
        print(f"   Razón Social: {empresa['razonSocial']['principal']}")
        print()
        
        # Actualizar resolución
        print("🔄 Actualizando resolución...")
        await db.resoluciones.update_one(
            {"_id": resolucion['_id']},
            {"$set": {"empresaId": empresa_id}}
        )
        
        # Agregar resolución a la empresa
        await db.empresas.update_one(
            {"_id": empresa['_id']},
            {"$addToSet": {"resolucionesPrimigeniasIds": str(resolucion['_id'])}}
        )
        
        print("✅ Resolución actualizada correctamente")
        print()
        
        # Verificar
        resolucion_actualizada = await db.resoluciones.find_one({"_id": resolucion['_id']})
        print("📊 ESTADO FINAL:")
        print(f"   Resolución: {resolucion_actualizada['nroResolucion']}")
        print(f"   Empresa ID: {resolucion_actualizada['empresaId']}")
        print(f"   Estado: {resolucion_actualizada['estado']}")
        print(f"   Tipo: {resolucion_actualizada['tipoResolucion']}")
        print()
        
        print("=" * 80)
        print("✅ CORRECCIÓN COMPLETADA")
        print("=" * 80)
        print()
        print("Ahora la resolución debería aparecer en el frontend")
        print("Recarga la página para ver los cambios")
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(corregir_resolucion())
