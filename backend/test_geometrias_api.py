"""
Script de prueba para el API de geometrías
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/geometrias"

def print_resultado(titulo: str, exito: bool, datos: Any = None):
    """Imprimir resultado de prueba"""
    simbolo = "✅" if exito else "❌"
    print(f"\n{simbolo} {titulo}")
    if datos:
        print(f"   {datos}")

def test_stats_resumen():
    """Probar endpoint de estadísticas"""
    print("\n" + "="*60)
    print("TEST: Estadísticas de Geometrías")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/stats/resumen")
        
        if response.status_code == 200:
            data = response.json()
            print_resultado("Estadísticas obtenidas", True)
            print(f"   Total: {data.get('total', 0)}")
            print(f"   Por tipo: {json.dumps(data.get('por_tipo', {}), indent=6)}")
            return True
        else:
            print_resultado(f"Error: {response.status_code}", False, response.text)
            return False
    except Exception as e:
        print_resultado(f"Error de conexión", False, str(e))
        return False

def test_listar_geometrias(tipo: str = None):
    """Probar listado de geometrías"""
    print("\n" + "="*60)
    print(f"TEST: Listar Geometrías {f'(tipo={tipo})' if tipo else ''}")
    print("="*60)
    
    try:
        params = {"tipo": tipo} if tipo else {}
        response = requests.get(BASE_URL, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print_resultado(f"Geometrías listadas: {len(data)}", True)
            
            if data and len(data) > 0:
                primera = data[0]
                print(f"\n   Ejemplo:")
                print(f"      ID: {primera.get('id', 'N/A')}")
                print(f"      Nombre: {primera.get('nombre', 'N/A')}")
                print(f"      Tipo: {primera.get('tipo', 'N/A')}")
                print(f"      UBIGEO: {primera.get('ubigeo', 'N/A')}")
                print(f"      Área: {primera.get('area_km2', 'N/A')} km²")
            
            return True
        else:
            print_resultado(f"Error: {response.status_code}", False, response.text)
            return False
    except Exception as e:
        print_resultado(f"Error de conexión", False, str(e))
        return False

def test_geojson(tipo: str = None, provincia: str = None):
    """Probar endpoint GeoJSON"""
    print("\n" + "="*60)
    filtros = []
    if tipo:
        filtros.append(f"tipo={tipo}")
    if provincia:
        filtros.append(f"provincia={provincia}")
    
    titulo = f"TEST: GeoJSON {' '.join(filtros) if filtros else ''}"
    print(titulo)
    print("="*60)
    
    try:
        params = {}
        if tipo:
            params["tipo"] = tipo
        if provincia:
            params["provincia"] = provincia
        
        response = requests.get(f"{BASE_URL}/geojson", params=params)
        
        if response.status_code == 200:
            data = response.json()
            features = data.get("features", [])
            print_resultado(f"GeoJSON obtenido: {len(features)} features", True)
            
            if features and len(features) > 0:
                primera = features[0]
                props = primera.get("properties", {})
                geom = primera.get("geometry", {})
                
                print(f"\n   Ejemplo:")
                print(f"      Nombre: {props.get('nombre', 'N/A')}")
                print(f"      Tipo: {props.get('tipo', 'N/A')}")
                print(f"      Geometría: {geom.get('type', 'N/A')}")
                
                if geom.get('type') == 'Polygon':
                    coords = geom.get('coordinates', [[]])
                    if coords and len(coords) > 0:
                        print(f"      Puntos: {len(coords[0])}")
            
            return True
        else:
            print_resultado(f"Error: {response.status_code}", False, response.text)
            return False
    except Exception as e:
        print_resultado(f"Error de conexión", False, str(e))
        return False

def test_buscar_por_ubigeo(ubigeo: str):
    """Probar búsqueda por UBIGEO"""
    print("\n" + "="*60)
    print(f"TEST: Buscar por UBIGEO ({ubigeo})")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/ubigeo/{ubigeo}")
        
        if response.status_code == 200:
            data = response.json()
            print_resultado("Geometría encontrada", True)
            print(f"   Nombre: {data.get('nombre', 'N/A')}")
            print(f"   Tipo: {data.get('tipo', 'N/A')}")
            print(f"   Provincia: {data.get('provincia', 'N/A')}")
            print(f"   Distrito: {data.get('distrito', 'N/A')}")
            return True
        elif response.status_code == 404:
            print_resultado("Geometría no encontrada", False)
            return False
        else:
            print_resultado(f"Error: {response.status_code}", False, response.text)
            return False
    except Exception as e:
        print_resultado(f"Error de conexión", False, str(e))
        return False

def main():
    print("\n" + "🗺️ " * 20)
    print("PRUEBAS DEL API DE GEOMETRÍAS")
    print("🗺️ " * 20)
    
    resultados = []
    
    # Test 1: Estadísticas
    resultados.append(("Estadísticas", test_stats_resumen()))
    
    # Test 2: Listar todas las geometrías
    resultados.append(("Listar todas", test_listar_geometrias()))
    
    # Test 3: Listar provincias
    resultados.append(("Listar provincias", test_listar_geometrias("PROVINCIA")))
    
    # Test 4: Listar distritos
    resultados.append(("Listar distritos", test_listar_geometrias("DISTRITO")))
    
    # Test 5: GeoJSON de todas las provincias
    resultados.append(("GeoJSON provincias", test_geojson("PROVINCIA")))
    
    # Test 6: GeoJSON de distritos de Puno
    resultados.append(("GeoJSON distritos Puno", test_geojson("DISTRITO", "PUNO")))
    
    # Test 7: Buscar por UBIGEO (Puno provincia)
    resultados.append(("Buscar UBIGEO 2101", test_buscar_por_ubigeo("2101")))
    
    # Test 8: Buscar por UBIGEO (Puno distrito)
    resultados.append(("Buscar UBIGEO 210101", test_buscar_por_ubigeo("210101")))
    
    # Resumen
    print("\n" + "="*60)
    print("RESUMEN DE PRUEBAS")
    print("="*60)
    
    exitosas = sum(1 for _, exito in resultados if exito)
    total = len(resultados)
    
    for nombre, exito in resultados:
        simbolo = "✅" if exito else "❌"
        print(f"{simbolo} {nombre}")
    
    print(f"\n📊 Resultado: {exitosas}/{total} pruebas exitosas")
    
    if exitosas == total:
        print("🎉 ¡Todas las pruebas pasaron!")
    else:
        print("⚠️  Algunas pruebas fallaron")
    
    return exitosas == total

if __name__ == "__main__":
    try:
        exito = main()
        exit(0 if exito else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Pruebas interrumpidas por el usuario")
        exit(1)
