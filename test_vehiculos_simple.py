#!/usr/bin/env python3
"""
Script para probar el endpoint de vehículos de forma simple y directa
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.config.settings import settings
from backend.app.services.vehiculo_service import VehiculoService
from backend.app.models.vehiculo import VehiculoResponse

async def test_vehiculos_direct():
    """Probar el servicio de vehículos directamente"""
    print("🔍 Probando servicio de vehículos directamente...")
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        print("✅ Conectado a MongoDB")
        
        # Crear servicio
        db = client[settings.DATABASE_NAME]
        service = VehiculoService(db)
        
        # Obtener vehículos
        vehiculos = await service.get_vehiculos(skip=0, limit=10)
        print(f"✅ Obtenidos {len(vehiculos)} vehículos")
        
        # Convertir a response format
        vehiculos_response = []
        for vehiculo in vehiculos:
            response = VehiculoResponse(
                id=vehiculo.id,
                placa=vehiculo.placa,
                empresaActualId=vehiculo.empresaActualId,
                resolucionId=vehiculo.resolucionId,
                rutasAsignadasIds=vehiculo.rutasAsignadasIds or [],
                categoria=vehiculo.categoria,
                marca=vehiculo.marca,
                modelo=vehiculo.modelo,
                anioFabricacion=vehiculo.anioFabricacion,
                estado=vehiculo.estado,
                estaActivo=vehiculo.estaActivo,
                fechaRegistro=vehiculo.fechaRegistro,
                fechaActualizacion=vehiculo.fechaActualizacion,
                datosTecnicos=vehiculo.datosTecnicos,
                color=vehiculo.color,
                numeroSerie=vehiculo.numeroSerie,
                observaciones=vehiculo.observaciones,
                documentosIds=vehiculo.documentosIds or [],
                historialIds=vehiculo.historialIds or [],
                tuc=vehiculo.tuc
            )
            vehiculos_response.append(response)
        
        print("📋 Vehículos encontrados:")
        for v in vehiculos_response:
            print(f"  - {v.placa} ({v.estado}) - Empresa: {v.empresaActualId}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_endpoint_logic():
    """Simular la lógica del endpoint"""
    print("\n🔍 Simulando lógica del endpoint...")
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await client.admin.command('ping')
        
        # Crear servicio (simulando get_vehiculo_service)
        db = client[settings.DATABASE_NAME]
        service = VehiculoService(db)
        
        # Simular parámetros del endpoint
        skip = 0
        limit = 100
        estado = None
        empresa_id = None
        
        # Ejecutar lógica del endpoint
        vehiculos = await service.get_vehiculos(
            skip=skip,
            limit=limit,
            empresa_id=empresa_id,
            estado=estado
        )
        
        # Convertir a formato de respuesta
        response_data = []
        for vehiculo in vehiculos:
            response_data.append({
                "id": vehiculo.id,
                "placa": vehiculo.placa,
                "empresaActualId": vehiculo.empresaActualId,
                "resolucionId": vehiculo.resolucionId,
                "rutasAsignadasIds": vehiculo.rutasAsignadasIds or [],
                "categoria": vehiculo.categoria,
                "marca": vehiculo.marca,
                "modelo": vehiculo.modelo,
                "anioFabricacion": vehiculo.anioFabricacion,
                "estado": str(vehiculo.estado),
                "estaActivo": vehiculo.estaActivo,
                "fechaRegistro": vehiculo.fechaRegistro.isoformat() if vehiculo.fechaRegistro else None,
                "fechaActualizacion": vehiculo.fechaActualizacion.isoformat() if vehiculo.fechaActualizacion else None,
                "datosTecnicos": vehiculo.datosTecnicos,
                "color": vehiculo.color,
                "numeroSerie": vehiculo.numeroSerie,
                "observaciones": vehiculo.observaciones,
                "documentosIds": vehiculo.documentosIds or [],
                "historialIds": vehiculo.historialIds or [],
                "tuc": vehiculo.tuc
            })
        
        print(f"✅ Endpoint simulado exitosamente - {len(response_data)} vehículos")
        print("📄 Respuesta JSON:")
        import json
        print(json.dumps(response_data, indent=2, default=str))
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error simulando endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 Probando endpoint de vehículos de forma directa...\n")
    
    # Test 1: Servicio directo
    service_ok = await test_vehiculos_direct()
    
    # Test 2: Lógica del endpoint
    endpoint_ok = False
    if service_ok:
        endpoint_ok = await test_endpoint_logic()
    
    print("\n📊 RESUMEN:")
    print(f"  Servicio directo: {'✅' if service_ok else '❌'}")
    print(f"  Lógica endpoint: {'✅' if endpoint_ok else '❌'}")
    
    if service_ok and endpoint_ok:
        print("\n🎉 ¡El endpoint de vehículos debería funcionar correctamente!")
        print("💡 El problema está en la inicialización del backend")
        print("🔧 Reinicia el backend para aplicar los cambios")
    else:
        print("\n⚠️ Hay problemas en la lógica del servicio")

if __name__ == "__main__":
    asyncio.run(main())