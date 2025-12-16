"""
Script para probar creación de ruta usando IDs directos de la BD
"""
import requests
import json

def test_crear_ruta_directo():
    print("=" * 80)
    print("🧪 PRUEBA DIRECTA DE CREACIÓN DE RUTA")
    print("=" * 80)
    
    # IDs que sabemos que existen en la BD
    empresa_id = "693226268a29266aa49f5ebd"  # De verificar_datos_bd.py
    resolucion_id = "69401213e13ebe655c0b1d67"  # Resolución PADRE válida
    
    print(f"📋 Usando IDs conocidos:")
    print(f"   • Empresa ID: {empresa_id}")
    print(f"   • Resolución ID: {resolucion_id}")
    
    # Datos de la ruta
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
        "observaciones": "Ruta de prueba - Test directo",
        "empresaId": empresa_id,
        "resolucionId": resolucion_id,
        "itinerarioIds": []
    }
    
    print(f"\n📝 Datos de la ruta:")
    for key, value in ruta_data.items():
        print(f"   • {key}: {value}")
    
    # Hacer petición POST
    print(f"\n🚀 Enviando petición POST a /api/v1/rutas/...")
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/rutas/",
            json=ruta_data,
            headers=headers,
            timeout=10
        )
        
        print(f"\n📡 Respuesta del servidor:")
        print(f"   • Status Code: {response.status_code}")
        print(f"   • Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            ruta_creada = response.json()
            print(f"\n🎉 ¡RUTA CREADA EXITOSAMENTE!")
            print(f"   • ID: {ruta_creada.get('id', 'N/A')}")
            print(f"   • Código: {ruta_creada.get('codigoRuta', 'N/A')}")
            print(f"   • Nombre: {ruta_creada.get('nombre', 'N/A')}")
            print(f"   • Estado: {ruta_creada.get('estado', 'N/A')}")
            print(f"   • Empresa ID: {ruta_creada.get('empresaId', 'N/A')}")
            print(f"   • Resolución ID: {ruta_creada.get('resolucionId', 'N/A')}")
            
            print(f"\n✅ PRUEBA EXITOSA - ERROR 500 SOLUCIONADO")
            print(f"   ✅ No hubo error de ObjectId 'general'")
            print(f"   ✅ Backend acepta empresa y resolución válidas")
            print(f"   ✅ Ruta creada con código de 2 dígitos")
            
        elif response.status_code == 500:
            print(f"\n❌ ERROR 500 - PROBLEMA PERSISTE")
            try:
                error_detail = response.json()
                print(f"   • Error: {error_detail}")
            except:
                print(f"   • Respuesta: {response.text}")
                
        else:
            print(f"\n⚠️  OTRO ERROR:")
            try:
                error_detail = response.json()
                print(f"   • Detalle: {error_detail}")
            except:
                print(f"   • Respuesta: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ERROR DE CONEXIÓN:")
        print(f"   • {str(e)}")
    
    print("=" * 80)

if __name__ == "__main__":
    test_crear_ruta_directo()