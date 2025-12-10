#!/usr/bin/env python3
"""
Script para limpiar la base de datos MongoDB
"""
import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient

async def limpiar_db():
    """Limpiar todas las colecciones de la base de datos"""
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['drtc_puno']
        
        print("🧹 Limpiando base de datos...")
        
        # Limpiar todas las colecciones
        colecciones = [
            'resoluciones', 'vehiculos', 'empresas', 'rutas', 
            'expedientes', 'tucs', 'conductores', 'infracciones', 
            'oficinas', 'notificaciones'
        ]
        
        total_eliminados = 0
        for col in colecciones:
            try:
                result = await db[col].delete_many({})
                print(f'✅ {col}: {result.deleted_count} documentos eliminados')
                total_eliminados += result.deleted_count
            except Exception as e:
                print(f'⚠️  Error en {col}: {e}')
        
        client.close()
        print(f'🎉 Base de datos limpiada completamente. Total eliminados: {total_eliminados}')
        
    except Exception as e:
        print(f'❌ Error al limpiar base de datos: {e}')
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(limpiar_db())
    sys.exit(0 if success else 1)