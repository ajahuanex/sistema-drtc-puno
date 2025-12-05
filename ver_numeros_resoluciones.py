"""
Ver todos los números de resoluciones existentes
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"


async def ver_numeros():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        resoluciones = await db.resoluciones.find({}).to_list(length=None)
        
        print("=" * 80)
        print("NÚMEROS DE RESOLUCIONES EXISTENTES")
        print("=" * 80)
        print()
        
        activas = [r for r in resoluciones if r.get('estaActivo', False)]
        inactivas = [r for r in resoluciones if not r.get('estaActivo', False)]
        
        print(f"ACTIVAS ({len(activas)}):")
        for r in activas:
            print(f"  • {r.get('nroResolucion', 'N/A')} - {r.get('estado', 'N/A')}")
        
        print()
        print(f"INACTIVAS ({len(inactivas)}):")
        for r in inactivas:
            print(f"  • {r.get('nroResolucion', 'N/A')} - {r.get('estado', 'N/A')}")
        
        print()
        print("=" * 80)
        print("CONSEJO: Usa un número diferente para crear una nueva resolución")
        print("=" * 80)
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(ver_numeros())
