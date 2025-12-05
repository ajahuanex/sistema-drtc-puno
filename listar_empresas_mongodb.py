"""
Script para listar todas las empresas en MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"


async def listar_empresas():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("EMPRESAS EN MONGODB")
        print("=" * 80)
        print()
        
        empresas = await db.empresas.find({"estaActivo": True}).to_list(length=None)
        
        print(f"Total de empresas activas: {len(empresas)}")
        print()
        
        if empresas:
            for i, empresa in enumerate(empresas, 1):
                print(f"{i}. ID: {empresa.get('_id', 'N/A')}")
                print(f"   RUC: {empresa.get('ruc', 'N/A')}")
                print(f"   Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"   Estado: {empresa.get('estado', 'N/A')}")
                
                # Contar resoluciones
                empresa_id = str(empresa['_id'])
                resoluciones = await db.resoluciones.find({
                    "empresaId": empresa_id,
                    "estaActivo": True
                }).to_list(length=None)
                
                print(f"   Resoluciones: {len(resoluciones)}")
                
                if resoluciones:
                    for res in resoluciones:
                        print(f"      • {res.get('nroResolucion', 'N/A')} - {res.get('estado', 'N/A')} - {res.get('tipoResolucion', 'N/A')}")
                
                # Contar rutas
                rutas = await db.rutas.find({
                    "empresaId": empresa_id,
                    "estaActivo": True
                }).to_list(length=None)
                
                print(f"   Rutas: {len(rutas)}")
                print()
        else:
            print("⚠️  No hay empresas en MongoDB")
            print()
            print("SOLUCIÓN:")
            print("1. Crear empresas desde el frontend")
            print("2. O ejecutar un script de carga inicial de datos")
        
        print("=" * 80)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(listar_empresas())
