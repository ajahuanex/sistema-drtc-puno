"""
Script para crear un vehículo de prueba y verificar que se guarde correctamente
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Datos de la empresa
EMPRESA_ID_UUID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"  # UUID de la empresa "123"
EMPRESA_ID_OBJECTID = "693062f7f3622e03449d0d21"  # ObjectId de la empresa "123"

def crear_vehiculo():
    print("=" * 80)
    print("CREANDO VEHÍCULO DE PRUEBA")
    print("=" * 80)
    
    # Datos del vehículo con TODOS los campos requeridos
    vehiculo_data = {
        "placa": "ABC-123",
        "empresaActualId": EMPRESA_ID_UUID,  # Usar UUID
        "categoria": "M2",  # REQUERIDO: M2 = 9-16 asientos
        "marca": "Toyota",
        "modelo": "Hiace",
        "anioFabricacion": 2020,  # REQUERIDO
        "sedeRegistro": "PUNO",
        "datosTecnicos": {  # REQUERIDO
            "motor": "MOTOR123456",
            "chasis": "CHASIS123456",
            "ejes": 2,
            "asientos": 15,
            "pesoNeto": 2500.0,
            "pesoBruto": 3500.0,
            "medidas": {
                "largo": 5.5,
                "ancho": 2.0,
                "alto": 2.5
            },
            "tipoCombustible": "DIESEL",
            "cilindrada": 2500.0,
            "potencia": 150.0
        },
        "color": "Blanco",
        "observaciones": "Vehículo de prueba creado desde script"
    }
    
    print(f"\n📝 Datos del vehículo:")
    print(json.dumps(vehiculo_data, indent=2))
    
    print(f"\n🔗 POST {BASE_URL}/vehiculos")
    
    try:
        response = requests.post(
            f"{BASE_URL}/vehiculos",
            json=vehiculo_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            vehiculo_creado = response.json()
            print("\n✅ Vehículo creado exitosamente:")
            print(json.dumps(vehiculo_creado, indent=2))
            
            vehiculo_id = vehiculo_creado.get('id')
            print(f"\n🆔 ID del vehículo: {vehiculo_id}")
            
            return vehiculo_id
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: No se pudo conectar al backend")
        print("   Asegúrate de que el backend esté corriendo en http://localhost:8000")
        return None
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

def verificar_vehiculo_en_db():
    """Verificar que el vehículo se guardó en MongoDB"""
    from pymongo import MongoClient
    
    MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
    DATABASE_NAME = "drtc_puno_db"
    
    try:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        print("\n" + "=" * 80)
        print("VERIFICACIÓN EN MONGODB")
        print("=" * 80)
        
        vehiculos = list(db["vehiculos"].find({}))
        print(f"\n🚗 Total de vehículos en MongoDB: {len(vehiculos)}")
        
        if vehiculos:
            for veh in vehiculos:
                print(f"\n   Vehículo:")
                print(f"   - Placa: {veh.get('placa')}")
                print(f"   - Marca: {veh.get('marca')}")
                print(f"   - Modelo: {veh.get('modelo')}")
                print(f"   - empresaActualId: {veh.get('empresaActualId')}")
                print(f"   - _id: {veh.get('_id')}")
        
        # Verificar empresa
        empresa = db["empresas"].find_one({"id": EMPRESA_ID_UUID})
        if empresa:
            print(f"\n🏢 Empresa '123':")
            print(f"   - vehiculosHabilitadosIds: {empresa.get('vehiculosHabilitadosIds', [])}")
        
    except Exception as e:
        print(f"\n❌ Error verificando MongoDB: {e}")

if __name__ == "__main__":
    vehiculo_id = crear_vehiculo()
    
    if vehiculo_id:
        print("\n⏳ Esperando 2 segundos...")
        import time
        time.sleep(2)
        
        verificar_vehiculo_en_db()
    else:
        print("\n❌ No se pudo crear el vehículo")
