#!/usr/bin/env python3
"""
Script simple para verificar MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verificar_mongo():
    """Verificar MongoDB directamente"""
    try:
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017")
        db = client["drtc_db"]
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conectado a MongoDB")
        
        # Contar resoluciones
        total = await db.resoluciones.count_documents({})
        print(f"📊 Total resoluciones: {total}")
        
        if total > 0:
            # Obtener una resolución de muestra
            resolucion = await db.resoluciones.find_one({})
            print(f"\n📋 Muestra de resolución:")
            print(f"   ID: {resolucion.get('_id')}")
            print(f"   Número: {resolucion.get('nroResolucion')}")
            print(f"   Empresa ID: {resolucion.get('empresaId')}")
            print(f"   Fecha Emisión: {resolucion.get('fechaEmision', 'N/A')}")
            print(f"   Fecha Vigencia Inicio: {resolucion.get('fechaVigenciaInicio')}")
            print(f"   Estado: {resolucion.get('estado')}")
            print(f"   Está Activo: {resolucion.get('estaActivo')}")
        
        client.close()
        return total > 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(verificar_mongo())
    if success:
        print("\n✅ Las resoluciones están en la base de datos")
        print("El problema está en el modelo Pydantic del backend")
    else:
        print("\n❌ No hay resoluciones en la base de datos")