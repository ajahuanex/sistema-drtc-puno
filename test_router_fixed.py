#!/usr/bin/env python3
"""
Script para probar el router de vehículos arreglado
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.config.settings import settings
from backend.app.services.vehiculo_service import VehiculoService

# Importar la función helper
from vehiculos_router_fixed import vehiculo_to_response

async def test_vehiculo_to_response():
    """Probar la función de conversión"""
    print("🔍 Probando conversión de vehículo a response...")
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        print("✅ Conectado a MongoDB")
        
        # Crear servicio
        db = client[settings.DATABASE_NAME]
        service = VehiculoService(db)
        
        # Obtener vehículos
        vehiculos = await service.get_vehiculos(skip=0, limit=1)
        print(f"✅ Obtenido {len(vehiculos)} vehículo(s)")
        
        if vehiculos:
            vehiculo = vehiculos[0]
            print(f"📋 Vehículo original: {vehiculo.placa}")
            
            # Convertir a response
            response = vehiculo_to_response(vehiculo)
            print(f"✅ Conversión exitosa: {response.placa}")
            print(f"📄 Sede: {response.sedeRegistro}")
            print(f"📄 Estado: {response.estado}")
            print(f"📄 Datos técnicos: {type(response.datosTecnicos)}")
            
            # Convertir a dict para JSON
            response_dict = response.model_dump()
            print(f"✅ Serialización JSON exitosa")
            
            client.close()
            return True
        else:
            print("⚠️ No hay vehículos en la BD")
            client.close()
            return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_endpoint_simulation():
    """Simular el endpoint completo"""
    print("\n🔍 Simulando endpoint completo...")
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        
        # Crear servicio
        db = client[settings.DATABASE_NAME]
        service = VehiculoService(db)
        
        # Simular parámetros
        skip = 0
        limit = 100
        estado = None
        empresa_id = None
        
        # Obtener vehículos
        vehiculos = await service.get_vehiculos(
            skip=skip,
            limit=limit,
            empresa_id=empresa_id,
            estado=estado
        )
        
        # Convertir a responses
        responses = [vehiculo_to_response(vehiculo) for vehiculo in vehiculos]
        
        print(f"✅ Endpoint simulado exitosamente - {len(responses)} vehículos")
        
        # Convertir a JSON
        import json
        response_data = [r.model_dump() for r in responses]
        json_str = json.dumps(response_data, indent=2, default=str)
        
        print("📄 Respuesta JSON (primeros 500 caracteres):")
        print(json_str[:500] + "..." if len(json_str) > 500 else json_str)
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error simulando endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 Probando router de vehículos arreglado...\n")
    
    # Test 1: Conversión básica
    conversion_ok = await test_vehiculo_to_response()
    
    # Test 2: Endpoint completo
    endpoint_ok = False
    if conversion_ok:
        endpoint_ok = await test_endpoint_simulation()
    
    print("\n📊 RESUMEN:")
    print(f"  Conversión: {'✅' if conversion_ok else '❌'}")
    print(f"  Endpoint: {'✅' if endpoint_ok else '❌'}")
    
    if conversion_ok and endpoint_ok:
        print("\n🎉 ¡Router arreglado funcionando correctamente!")
        print("💡 Ahora puedes reemplazar el router original")
    else:
        print("\n⚠️ Hay problemas que necesitan ser resueltos")

if __name__ == "__main__":
    asyncio.run(main())