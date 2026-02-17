"""
Script de prueba para endpoints CRUD del módulo de rutas
Prueba: CREATE, READ, UPDATE, DELETE
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "admin123"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

# Variables globales
token = None
ruta_id_creada = None
empresa_id = None
resolucion_id = None
empresa_data = {}
resolucion_data = {}

def login():
    """Autenticación (opcional - los endpoints funcionan sin auth)"""
    global token
    print_info("=== PASO 1: AUTENTICACIÓN ===")
    print_warning("Los endpoints de rutas no requieren autenticación")
    print_success("Continuando sin autenticación...")
    return True

def get_headers():
    """Headers con autenticación (opcional)"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def obtener_empresa_y_resolucion():
    """Obtener una empresa y resolución existente para las pruebas"""
    global empresa_id, resolucion_id
    print_info("\n=== PASO 2: OBTENER EMPRESA Y RESOLUCIÓN ===")
    
    try:
        # Obtener empresas
        response = requests.get(
            f"{BASE_URL}/empresas",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            empresas = response.json()
            if empresas:
                empresa = empresas[0]
                empresa_id = empresa.get("id")
                # Guardar datos completos de la empresa
                global empresa_data
                empresa_data = {
                    "id": empresa.get("id"),
                    "ruc": empresa.get("ruc", "20123456789"),
                    "razonSocial": empresa.get("razonSocial", {}).get("principal") if isinstance(empresa.get("razonSocial"), dict) else empresa.get("razonSocial", "Empresa Test")
                }
                print_success(f"Empresa obtenida: {empresa_data['razonSocial']} (RUC: {empresa_data['ruc']})")
            else:
                print_warning("No hay empresas en el sistema")
                return False
        else:
            print_error(f"Error obteniendo empresas: {response.status_code}")
            return False
        
        # Obtener resoluciones
        response = requests.get(
            f"{BASE_URL}/resoluciones",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            resoluciones = response.json()
            if resoluciones:
                resolucion = resoluciones[0]
                resolucion_id = resolucion.get("id")
                # Guardar datos completos de la resolución
                global resolucion_data
                resolucion_data = {
                    "id": resolucion.get("id"),
                    "nroResolucion": resolucion.get("numeroResolucion", "R-TEST-001"),
                    "tipoResolucion": resolucion.get("tipoResolucion", "PRIMIGENIA"),
                    "estado": resolucion.get("estado", "VIGENTE")
                }
                print_success(f"Resolución obtenida: {resolucion_data['nroResolucion']} (Tipo: {resolucion_data['tipoResolucion']})")
                return True
            else:
                print_warning("No hay resoluciones en el sistema")
                return False
        else:
            print_error(f"Error obteniendo resoluciones: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Excepción obteniendo datos: {str(e)}")
        return False

def test_create_ruta():
    """Prueba: CREATE - Crear nueva ruta"""
    global ruta_id_creada
    print_info("\n=== PASO 3: CREATE - Crear Ruta ===")
    
    # Datos de prueba con TODOS los campos obligatorios
    codigo_ruta = f"TEST-{datetime.now().strftime('%H%M%S')}"
    nueva_ruta = {
        "codigoRuta": codigo_ruta,
        "nombre": "PUNO - JULIACA",  # ✅ Campo obligatorio
        "tipoServicio": "PASAJEROS",  # ✅ Campo obligatorio
        "origen": {
            "id": "test_origen_id",
            "nombre": "PUNO"
        },
        "destino": {
            "id": "test_destino_id",
            "nombre": "JULIACA"
        },
        "itinerario": [],  # Lista vacía por defecto
        "frecuencia": {
            "tipo": "DIARIO",
            "cantidad": 1,
            "dias": [],
            "descripcion": "01 DIARIA"
        },
        "horarios": [],  # Lista vacía por defecto
        "descripcion": "Ruta de prueba CRUD",
        "observaciones": "Creada por script de prueba",
        "tipoRuta": "INTERREGIONAL",  # Opcional
        "empresa": {
            "id": empresa_data["id"],
            "ruc": empresa_data["ruc"],
            "razonSocial": empresa_data["razonSocial"]
        },
        "resolucion": {
            "id": resolucion_data["id"],
            "nroResolucion": resolucion_data["nroResolucion"],
            "tipoResolucion": resolucion_data["tipoResolucion"],
            "estado": resolucion_data["estado"]
        }
    }
    
    print_info(f"Datos a enviar:")
    print_info(f"  - Código: {codigo_ruta}")
    print_info(f"  - Nombre: {nueva_ruta['nombre']}")
    print_info(f"  - Tipo Servicio: {nueva_ruta['tipoServicio']}")
    print_info(f"  - Empresa: {empresa_data['razonSocial']}")
    print_info(f"  - Resolución: {resolucion_data['nroResolucion']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/rutas",
            headers=get_headers(),
            json=nueva_ruta
        )
        
        if response.status_code == 201:
            ruta_creada = response.json()
            ruta_id_creada = ruta_creada.get("id")
            print_success(f"Ruta creada exitosamente")
            print_info(f"  - ID: {ruta_id_creada}")
            print_info(f"  - Código: {ruta_creada.get('codigoRuta')}")
            print_info(f"  - Nombre: {ruta_creada.get('nombre')}")
            print_info(f"  - Origen: {ruta_creada.get('origen', {}).get('nombre')}")
            print_info(f"  - Destino: {ruta_creada.get('destino', {}).get('nombre')}")
            return True
        else:
            print_error(f"Error creando ruta: {response.status_code}")
            print_error(response.text[:500])  # Limitar output
            return False
    except Exception as e:
        print_error(f"Excepción creando ruta: {str(e)}")
        return False

def test_read_ruta():
    """Prueba: READ - Leer ruta por ID"""
    print_info("\n=== PASO 4: READ - Leer Ruta por ID ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas/{ruta_id_creada}",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            ruta = response.json()
            print_success(f"Ruta leída exitosamente")
            print_info(f"  - ID: {ruta.get('id')}")
            print_info(f"  - Código: {ruta.get('codigoRuta')}")
            print_info(f"  - Estado: {ruta.get('estado')}")
            print_info(f"  - Descripción: {ruta.get('descripcion')}")
            return True
        else:
            print_error(f"Error leyendo ruta: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción leyendo ruta: {str(e)}")
        return False

def test_read_all_rutas():
    """Prueba: READ - Listar todas las rutas"""
    print_info("\n=== PASO 5: READ - Listar Todas las Rutas ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas",
            headers=get_headers(),
            params={"limit": 5}
        )
        
        if response.status_code == 200:
            rutas = response.json()
            print_success(f"Rutas listadas exitosamente: {len(rutas)} rutas")
            for i, ruta in enumerate(rutas[:3], 1):
                print_info(f"  {i}. {ruta.get('codigoRuta')} - {ruta.get('origen', {}).get('nombre')} → {ruta.get('destino', {}).get('nombre')}")
            return True
        else:
            print_error(f"Error listando rutas: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción listando rutas: {str(e)}")
        return False

def test_update_ruta():
    """Prueba: UPDATE - Actualizar ruta"""
    print_info("\n=== PASO 6: UPDATE - Actualizar Ruta ===")
    
    # Datos de actualización
    actualizacion = {
        "descripcion": "Ruta de prueba ACTUALIZADA",
        "observaciones": "Actualizada por script de prueba",
        "frecuencia": {
            "tipo": "DIARIO",
            "cantidad": 2,
            "dias": [],
            "descripcion": "02 DIARIAS"
        }
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/rutas/{ruta_id_creada}",
            headers=get_headers(),
            json=actualizacion
        )
        
        if response.status_code == 200:
            ruta_actualizada = response.json()
            print_success(f"Ruta actualizada exitosamente")
            print_info(f"  - Descripción: {ruta_actualizada.get('descripcion')}")
            print_info(f"  - Observaciones: {ruta_actualizada.get('observaciones')}")
            print_info(f"  - Frecuencia: {ruta_actualizada.get('frecuencia', {}).get('descripcion')}")
            return True
        else:
            print_error(f"Error actualizando ruta: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción actualizando ruta: {str(e)}")
        return False

def test_read_rutas_por_resolucion():
    """Prueba: READ - Leer rutas por resolución"""
    print_info("\n=== PASO 7: READ - Rutas por Resolución ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas/resolucion/{resolucion_id}",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            rutas = response.json()
            print_success(f"Rutas por resolución: {len(rutas)} rutas")
            for i, ruta in enumerate(rutas[:3], 1):
                print_info(f"  {i}. {ruta.get('codigoRuta')}")
            return True
        else:
            print_error(f"Error obteniendo rutas por resolución: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción obteniendo rutas por resolución: {str(e)}")
        return False

def test_estadisticas():
    """Prueba: READ - Estadísticas de rutas"""
    print_info("\n=== PASO 8: READ - Estadísticas ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas/estadisticas",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            stats = response.json()
            print_success(f"Estadísticas obtenidas")
            print_info(f"  - Total rutas: {stats.get('total', 0)}")
            print_info(f"  - Rutas activas: {stats.get('activas', 0)}")
            print_info(f"  - Rutas inactivas: {stats.get('inactivas', 0)}")
            return True
        else:
            print_error(f"Error obteniendo estadísticas: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción obteniendo estadísticas: {str(e)}")
        return False

def test_delete_ruta():
    """Prueba: DELETE - Eliminar ruta"""
    print_info("\n=== PASO 9: DELETE - Eliminar Ruta ===")
    
    try:
        response = requests.delete(
            f"{BASE_URL}/rutas/{ruta_id_creada}",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            print_success(f"Ruta eliminada exitosamente")
            
            # Verificar que ya no existe
            response_verify = requests.get(
                f"{BASE_URL}/rutas/{ruta_id_creada}",
                headers=get_headers()
            )
            
            if response_verify.status_code == 404:
                print_success(f"Verificado: La ruta ya no existe")
                return True
            else:
                print_warning(f"La ruta aún existe después de eliminar")
                return False
        else:
            print_error(f"Error eliminando ruta: {response.status_code}")
            print_error(response.text)
            return False
    except Exception as e:
        print_error(f"Excepción eliminando ruta: {str(e)}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("\n" + "="*60)
    print("  PRUEBA DE ENDPOINTS CRUD - MÓDULO DE RUTAS")
    print("="*60)
    
    resultados = {
        "exitosas": 0,
        "fallidas": 0
    }
    
    # Ejecutar pruebas en orden
    pruebas = [
        ("Login", login),
        ("Obtener Empresa y Resolución", obtener_empresa_y_resolucion),
        ("CREATE - Crear Ruta", test_create_ruta),
        ("READ - Leer Ruta por ID", test_read_ruta),
        ("READ - Listar Todas las Rutas", test_read_all_rutas),
        ("UPDATE - Actualizar Ruta", test_update_ruta),
        ("READ - Rutas por Resolución", test_read_rutas_por_resolucion),
        ("READ - Estadísticas", test_estadisticas),
        ("DELETE - Eliminar Ruta", test_delete_ruta)
    ]
    
    for nombre, prueba in pruebas:
        try:
            if prueba():
                resultados["exitosas"] += 1
            else:
                resultados["fallidas"] += 1
                print_warning(f"Prueba '{nombre}' falló, continuando...")
        except Exception as e:
            resultados["fallidas"] += 1
            print_error(f"Error en prueba '{nombre}': {str(e)}")
    
    # Resumen final
    print("\n" + "="*60)
    print("  RESUMEN DE PRUEBAS")
    print("="*60)
    print_success(f"Pruebas exitosas: {resultados['exitosas']}")
    if resultados["fallidas"] > 0:
        print_error(f"Pruebas fallidas: {resultados['fallidas']}")
    else:
        print_success("¡Todas las pruebas pasaron!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
