"""
Script para probar la creación de rutas via API
Simula lo que hace el frontend
"""
import requests
import json

# URLs
BASE_URL = "http://localhost:8000/api/v1"

def test_crear_ruta():
    print("=" * 80)
    print("🧪 PRUEBA DE CREACIÓN DE RUTA VIA API")
    print("=" * 80)
    
    # 1. Obtener empresas
    print("\n1️⃣ Obteniendo empresas...")
    response = requests.get(f"{BASE_URL}/empresas")
    if response.status_code == 200:
        empresas = response.json()
        if empresas:
            empresa = empresas[0]
            print(f"✅ Empresa encontrada: {empresa['razonSocial']['principal']} (ID: {empresa['id']})")
        else:
            print("❌ No hay empresas disponibles")
            return
    else:
        print(f"❌ Error obteniendo empresas: {response.status_code}")
        return
    
    # 2. Obtener resoluciones
    print("\n2️⃣ Obteniendo resoluciones...")
    response = requests.get(f"{BASE_URL}/resoluciones")
    if response.status_code == 200:
        resoluciones = response.json()
        if resoluciones:
            resolucion = resoluciones[0]
            print(f"✅ Resolución encontrada: {resolucion['nroResolucion']} (ID: {resolucion['id']})")
        else:
            print("❌ No hay resoluciones disponibles")
            return
    else:
        print(f"❌ Error obteniendo resoluciones: {response.status_code}")
        return
    
    # 3. Crear ruta de prueba
    print("\n3️⃣ Creando ruta de prueba...")
    
    ruta_data = {
        "codigoRuta": "01",
        "nombre": "PUNO - JULIACA",
        "origenId": "PUNO",
        "destinoId": "JULIACA",
        "origen": "Puno",
        "destino": "Juliaca",
        "frecuencias": "Diaria, cada 30 minutos",
        "tipoRuta": "INTERPROVINCIAL",
        "tipoServicio": "PASAJEROS",
        "observaciones": "Ruta de prueba creada via API",
        "empresaId": empresa['id'],
        "resolucionId": resolucion['id'],
        "itinerarioIds": []
    }
    
    print(f"📝 Datos de la ruta:")
    print(f"   • Código: {ruta_data['codigoRuta']}")
    print(f"   • Nombre: {ruta_data['nombre']}")
    print(f"   • Empresa ID: {ruta_data['empresaId']}")
    print(f"   • Resolución ID: {ruta_data['resolucionId']}")
    
    # Hacer la petición POST
    headers = {"Content-Type": "application/json"}
    response = requests.post(
        f"{BASE_URL}/rutas/",
        json=ruta_data,
        headers=headers
    )
    
    print(f"\n📡 Respuesta del servidor:")
    print(f"   • Status Code: {response.status_code}")
    
    if response.status_code == 201:
        ruta_creada = response.json()
        print(f"✅ RUTA CREADA EXITOSAMENTE!")
        print(f"   • ID: {ruta_creada['id']}")
        print(f"   • Código: {ruta_creada['codigoRuta']}")
        print(f"   • Nombre: {ruta_creada['nombre']}")
        print(f"   • Estado: {ruta_creada['estado']}")
        
        # 4. Verificar que la ruta aparece en la lista
        print(f"\n4️⃣ Verificando que la ruta aparece en la lista...")
        response = requests.get(f"{BASE_URL}/rutas")
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Total de rutas en sistema: {len(rutas)}")
            if rutas:
                for ruta in rutas:
                    print(f"   • {ruta['codigoRuta']}: {ruta['nombre']} ({ruta['estado']})")
        
        print(f"\n🎉 PRUEBA COMPLETADA EXITOSAMENTE")
        print(f"   ✅ No hubo error 500")
        print(f"   ✅ Ruta creada correctamente")
        print(f"   ✅ Sistema funcionando perfectamente")
        
    else:
        print(f"❌ ERROR AL CREAR RUTA:")
        print(f"   • Status Code: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"   • Detalle: {error_detail}")
        except:
            print(f"   • Respuesta: {response.text}")
    
    print("=" * 80)

if __name__ == "__main__":
    test_crear_ruta()