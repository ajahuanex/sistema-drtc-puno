#!/usr/bin/env python3
"""
Prueba directa del servicio de historial vehicular
"""

import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_servicio():
    """Probar el servicio directamente"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from app.services.historial_vehicular_service import HistorialVehicularService
        from app.models.historial_vehicular import FiltrosHistorialVehicular
        
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        
        # Crear servicio
        service = HistorialVehicularService(db)
        
        # Crear filtros
        filtros = FiltrosHistorialVehicular(
            page=1,
            limit=5
        )
        
        # Probar obtener historial
        print("🔍 Probando obtener_historial_vehicular...")
        resultado = await service.obtener_historial_vehicular(filtros)
        print(f"✅ Resultado: {resultado}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_servicio())