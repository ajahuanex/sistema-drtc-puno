"""
Script de prueba para verificar el sistema de vehículos simplificado
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test_vehiculo_simplificado():
    """Prueba de creación de vehículo simplificado"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sirret_db"]
    
    print("🔍 Verificando estructura de la base de datos...")
    
    # 1. Verificar que existe al menos un VehiculoData
    vehiculos_solo = db["vehiculos_solo"]
    count_vehiculos_solo = await vehiculos_solo.count_documents({})
    print(f"✅ VehiculoData (vehiculos_solo): {count_vehiculos_solo} registros")
    
    if count_vehiculos_solo > 0:
        # Obtener un ejemplo
        ejemplo = await vehiculos_solo.find_one({})
        print(f"   Ejemplo: {ejemplo.get('placa_actual')} - {ejemplo.get('marca')} {ejemplo.get('modelo')}")
    
    # 2. Verificar empresas
    empresas = db["empresas"]
    count_empresas = await empresas.count_documents({})
    print(f"✅ Empresas: {count_empresas} registros")
    
    if count_empresas > 0:
        ejemplo_empresa = await empresas.find_one({})
        print(f"   Ejemplo: {ejemplo_empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
    
    # 3. Verificar vehículos administrativos
    vehiculos = db["vehiculos"]
    count_vehiculos = await vehiculos.count_documents({})
    print(f"✅ Vehículos (administrativos): {count_vehiculos} registros")
    
    # 4. Verificar si hay vehículos con vehiculoDataId
    vehiculos_con_data_id = await vehiculos.count_documents({"vehiculoDataId": {"$exists": True}})
    print(f"✅ Vehículos con vehiculoDataId: {vehiculos_con_data_id}")
    
    # 5. Verificar si hay vehículos con tipoServicio
    vehiculos_con_tipo_servicio = await vehiculos.count_documents({"tipoServicio": {"$exists": True}})
    print(f"✅ Vehículos con tipoServicio: {vehiculos_con_tipo_servicio}")
    
    print("\n" + "="*60)
    print("📊 RESUMEN")
    print("="*60)
    
    if count_vehiculos_solo == 0:
        print("⚠️  No hay datos técnicos (VehiculoData)")
        print("   Crear al menos uno en: http://localhost:4200/vehiculos-solo/nuevo")
    
    if count_empresas == 0:
        print("⚠️  No hay empresas")
        print("   Crear al menos una en: http://localhost:4200/empresas/nuevo")
    
    if count_vehiculos_solo > 0 and count_empresas > 0:
        print("✅ Sistema listo para crear vehículos administrativos")
        print("   Ir a: http://localhost:4200/vehiculos/nuevo")
    
    # 6. Crear un vehículo de prueba (opcional)
    if count_vehiculos_solo > 0 and count_empresas > 0:
        print("\n¿Deseas crear un vehículo de prueba? (s/n)")
        # Por ahora solo mostramos la estructura
        
        vehiculo_solo_ejemplo = await vehiculos_solo.find_one({})
        empresa_ejemplo = await empresas.find_one({})
        
        print("\n📝 Estructura de vehículo de prueba:")
        print({
            "placa": vehiculo_solo_ejemplo.get('placa_actual'),
            "vehiculoDataId": str(vehiculo_solo_ejemplo.get('_id')),
            "empresaActualId": empresa_ejemplo.get('id') or str(empresa_ejemplo.get('_id')),
            "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
            "estado": "ACTIVO",
            "observaciones": "Vehículo de prueba - Sistema simplificado"
        })
    
    client.close()

if __name__ == "__main__":
    print("🚀 Iniciando prueba del sistema de vehículos simplificado...")
    print("="*60)
    asyncio.run(test_vehiculo_simplificado())
