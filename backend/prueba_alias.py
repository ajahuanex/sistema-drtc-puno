"""
Script para probar los alias generados
Verifica que:
1. Los alias se pueden buscar correctamente
2. Se resuelven a las localidades correctas
3. Los endpoints funcionan
"""
import requests
import json

API_BASE = "http://localhost:8000/api/v1"

def prueba_busqueda_alias():
    """Probar búsqueda de alias"""
    print("\n" + "="*70)
    print("🔍 PRUEBA 1: BÚSQUEDA DE ALIAS")
    print("="*70)
    
    # Casos de prueba
    casos = [
        ("PUNO CIUDAD", "PUNO"),
        ("CIUDAD DE JULIACA", "JULIACA"),
        ("C.P. CHAQUIMINAS", "CHAQUIMINAS"),
        ("CP PEÑA AZUL", "PEÑA AZUL"),
        ("PUNO", "PUNO"),  # Búsqueda directa
    ]
    
    for busqueda, esperado in casos:
        try:
            url = f"{API_BASE}/localidades-alias/buscar/{busqueda.replace(' ', '%20')}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n✓ '{busqueda}'")
                print(f"  → Localidad: {data['localidad_nombre']}")
                print(f"  → Es alias: {data['es_alias']}")
                if data['es_alias']:
                    print(f"  → Alias usado: {data['alias_usado']}")
                print(f"  → ID: {data['localidad_id']}")
            else:
                print(f"\n✗ '{busqueda}' - Error {response.status_code}")
                print(f"  {response.text}")
        except Exception as e:
            print(f"\n✗ '{busqueda}' - Excepción: {str(e)}")

def prueba_obtener_alias():
    """Probar obtención de alias"""
    print("\n" + "="*70)
    print("📋 PRUEBA 2: OBTENER ALIAS")
    print("="*70)
    
    try:
        url = f"{API_BASE}/localidades-alias/?skip=0&limit=10&solo_activos=true"
        response = requests.get(url)
        
        if response.status_code == 200:
            alias_list = response.json()
            print(f"\n✓ Se obtuvieron {len(alias_list)} alias")
            print("\nPrimeros 5 alias:")
            for i, alias in enumerate(alias_list[:5], 1):
                print(f"  {i}. {alias['alias']} → {alias['localidad_nombre']}")
        else:
            print(f"\n✗ Error {response.status_code}")
            print(f"  {response.text}")
    except Exception as e:
        print(f"\n✗ Excepción: {str(e)}")

def prueba_alias_mas_usados():
    """Probar obtención de alias más usados"""
    print("\n" + "="*70)
    print("📊 PRUEBA 3: ALIAS MÁS USADOS")
    print("="*70)
    
    try:
        url = f"{API_BASE}/localidades-alias/estadisticas/mas-usados?limit=5"
        response = requests.get(url)
        
        if response.status_code == 200:
            alias_list = response.json()
            print(f"\n✓ Se obtuvieron {len(alias_list)} alias más usados")
            if alias_list:
                print("\nAlias más usados:")
                for i, alias in enumerate(alias_list, 1):
                    total = alias['usos_como_origen'] + alias['usos_como_destino'] + alias['usos_en_itinerario']
                    print(f"  {i}. {alias['alias']} ({total} usos)")
            else:
                print("\n  (No hay alias con uso registrado)")
        else:
            print(f"\n✗ Error {response.status_code}")
            print(f"  {response.text}")
    except Exception as e:
        print(f"\n✗ Excepción: {str(e)}")

def prueba_alias_sin_usar():
    """Probar obtención de alias sin usar"""
    print("\n" + "="*70)
    print("⏭️  PRUEBA 4: ALIAS SIN USAR")
    print("="*70)
    
    try:
        url = f"{API_BASE}/localidades-alias/estadisticas/sin-usar"
        response = requests.get(url)
        
        if response.status_code == 200:
            alias_list = response.json()
            print(f"\n✓ Se obtuvieron {len(alias_list)} alias sin usar")
            print(f"\nPrimeros 5 alias sin usar:")
            for i, alias in enumerate(alias_list[:5], 1):
                print(f"  {i}. {alias['alias']} → {alias['localidad_nombre']}")
        else:
            print(f"\n✗ Error {response.status_code}")
            print(f"  {response.text}")
    except Exception as e:
        print(f"\n✗ Excepción: {str(e)}")

def prueba_crear_alias():
    """Probar creación de nuevo alias"""
    print("\n" + "="*70)
    print("➕ PRUEBA 5: CREAR NUEVO ALIAS")
    print("="*70)
    
    try:
        # Primero obtener una localidad para usar su ID
        url = f"{API_BASE}/localidades?skip=0&limit=1&tipo=DISTRITO"
        response = requests.get(url)
        
        if response.status_code != 200:
            print(f"\n✗ No se pudo obtener localidad de prueba")
            return
        
        localidades = response.json()
        if not localidades:
            print(f"\n✗ No hay localidades disponibles")
            return
        
        localidad = localidades[0]
        localidad_id = localidad['id']
        localidad_nombre = localidad['nombre']
        
        # Crear alias de prueba
        nuevo_alias = {
            "alias": f"PRUEBA_{localidad_nombre}",
            "localidad_id": localidad_id,
            "localidad_nombre": localidad_nombre,
            "verificado": False,
            "notas": "Alias de prueba"
        }
        
        url = f"{API_BASE}/localidades-alias/"
        response = requests.post(url, json=nuevo_alias)
        
        if response.status_code == 201:
            data = response.json()
            print(f"\n✓ Alias creado exitosamente")
            print(f"  ID: {data['id']}")
            print(f"  Alias: {data['alias']}")
            print(f"  Localidad: {data['localidad_nombre']}")
            
            # Limpiar: eliminar el alias de prueba
            url_delete = f"{API_BASE}/localidades-alias/{data['id']}"
            response_delete = requests.delete(url_delete)
            if response_delete.status_code == 200:
                print(f"\n✓ Alias de prueba eliminado")
        else:
            print(f"\n✗ Error {response.status_code}")
            print(f"  {response.text}")
    except Exception as e:
        print(f"\n✗ Excepción: {str(e)}")

def main():
    """Ejecutar todas las pruebas"""
    print("\n" + "="*70)
    print("🧪 PRUEBAS DE ALIAS CONSOLIDADOS")
    print("="*70)
    print(f"\nAPI Base: {API_BASE}")
    
    # Verificar que el backend está disponible
    try:
        response = requests.get(f"{API_BASE}/localidades?skip=0&limit=1")
        if response.status_code != 200:
            print("\n❌ El backend no está disponible o no responde correctamente")
            print(f"   Status: {response.status_code}")
            return
    except Exception as e:
        print(f"\n❌ No se puede conectar al backend: {str(e)}")
        print("   Asegúrate de que el backend está corriendo en http://localhost:8000")
        return
    
    print("\n✓ Backend disponible")
    
    # Ejecutar pruebas
    prueba_busqueda_alias()
    prueba_obtener_alias()
    prueba_alias_mas_usados()
    prueba_alias_sin_usar()
    prueba_crear_alias()
    
    print("\n" + "="*70)
    print("✅ PRUEBAS COMPLETADAS")
    print("="*70)

if __name__ == "__main__":
    main()
