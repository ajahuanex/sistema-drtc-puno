"""
Diagnóstico de vehículos y su relación con empresas
"""

from pymongo import MongoClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def diagnosticar():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("DIAGNÓSTICO DE VEHÍCULOS")
    print("=" * 80)
    
    empresas_col = db["empresas"]
    vehiculos_col = db["vehiculos"]
    
    # 1. Listar empresas con sus IDs
    print("\n📊 EMPRESAS:")
    empresas = list(empresas_col.find({}))
    
    for emp in empresas:
        print(f"\n   🏢 {emp.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        print(f"      RUC: {emp.get('ruc')}")
        print(f"      _id (ObjectId): {emp['_id']}")
        print(f"      id (UUID): {emp.get('id', 'NO TIENE')}")
        print(f"      vehiculosHabilitadosIds: {emp.get('vehiculosHabilitadosIds', [])}")
    
    # 2. Listar vehículos
    print("\n\n🚗 VEHÍCULOS EN LA BASE DE DATOS:")
    vehiculos = list(vehiculos_col.find({}))
    
    if not vehiculos:
        print("   ❌ NO HAY VEHÍCULOS EN LA BASE DE DATOS")
    else:
        for veh in vehiculos:
            print(f"\n   🚙 Placa: {veh.get('placa', 'Sin placa')}")
            print(f"      _id: {veh.get('_id')}")
            print(f"      id: {veh.get('id', 'NO TIENE')}")
            print(f"      empresaId: {veh.get('empresaId', 'NO TIENE')}")
            print(f"      tipo empresaId: {type(veh.get('empresaId')).__name__}")
    
    # 3. Verificar consistencia
    print("\n\n🔍 VERIFICACIÓN DE CONSISTENCIA:")
    
    for emp in empresas:
        empresa_objectid = str(emp['_id'])
        empresa_uuid = emp.get('id')
        nombre = emp.get('razonSocial', {}).get('principal', 'Sin nombre')
        
        print(f"\n   🏢 {nombre}:")
        
        # Buscar vehículos por ObjectId
        vehiculos_por_objectid = list(vehiculos_col.find({"empresaId": empresa_objectid}))
        print(f"      Vehículos con empresaId={empresa_objectid}: {len(vehiculos_por_objectid)}")
        
        # Buscar vehículos por UUID
        if empresa_uuid:
            vehiculos_por_uuid = list(vehiculos_col.find({"empresaId": empresa_uuid}))
            print(f"      Vehículos con empresaId={empresa_uuid}: {len(vehiculos_por_uuid)}")
        
        # Array en empresa
        array_vehiculos = emp.get('vehiculosHabilitadosIds', [])
        print(f"      Array vehiculosHabilitadosIds: {len(array_vehiculos)} elementos")
        
        if len(array_vehiculos) > 0:
            print(f"      IDs en array: {array_vehiculos[:3]}...")  # Mostrar primeros 3
    
    # 4. Conclusión
    print("\n" + "=" * 80)
    print("CONCLUSIÓN")
    print("=" * 80)
    
    if not vehiculos:
        print("\n✅ NO HAY VEHÍCULOS EN LA BASE DE DATOS")
        print("   Esto es normal si aún no se han creado vehículos.")
        print("\n📝 PRÓXIMOS PASOS:")
        print("   1. Crear vehículos desde el módulo de empresas")
        print("   2. Asegurarse de que usen el campo 'id' (UUID) de la empresa")
        print("   3. Verificar que se actualice el array vehiculosHabilitadosIds")
    else:
        print("\n📊 RESUMEN:")
        print(f"   Total de vehículos: {len(vehiculos)}")
        print(f"   Total de empresas: {len(empresas)}")
        
        # Verificar si hay vehículos huérfanos
        empresas_ids_objectid = [str(e['_id']) for e in empresas]
        empresas_ids_uuid = [e.get('id') for e in empresas if e.get('id')]
        
        vehiculos_huerfanos = []
        for veh in vehiculos:
            emp_id = veh.get('empresaId')
            if emp_id not in empresas_ids_objectid and emp_id not in empresas_ids_uuid:
                vehiculos_huerfanos.append(veh)
        
        if vehiculos_huerfanos:
            print(f"\n   ⚠️  {len(vehiculos_huerfanos)} vehículos huérfanos encontrados")
            print("   (vehículos que apuntan a empresas inexistentes)")

if __name__ == "__main__":
    diagnosticar()
