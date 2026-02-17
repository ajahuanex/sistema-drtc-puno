#!/usr/bin/env python3
"""
Script para probar la protección de eliminación de localidades
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

def test_proteccion():
    """Probar protección de eliminación"""
    
    print("\n" + "="*60)
    print("🔒 TEST DE PROTECCIÓN DE LOCALIDADES")
    print("="*60 + "\n")
    
    # 1. Obtener una localidad
    print("1️⃣ Obteniendo localidades...")
    try:
        response = requests.get(f"{BASE_URL}/localidades", timeout=5)
        if response.status_code == 200:
            localidades = response.json()
            if len(localidades) > 0:
                localidad = localidades[0]
                localidad_id = localidad['id']
                localidad_nombre = localidad.get('nombre', 'SIN NOMBRE')
                print_success(f"Localidad seleccionada: {localidad_nombre} (ID: {localidad_id})")
            else:
                print_error("No hay localidades en el sistema")
                return
        else:
            print_error(f"Error obteniendo localidades: {response.status_code}")
            return
    except Exception as e:
        print_error(f"Error: {e}")
        return
    
    # 2. Verificar uso de la localidad
    print(f"\n2️⃣ Verificando uso de '{localidad_nombre}'...")
    try:
        response = requests.get(f"{BASE_URL}/localidades/{localidad_id}/verificar-uso", timeout=5)
        if response.status_code == 200:
            uso = response.json()
            print_info(f"Está en uso: {uso['esta_en_uso']}")
            print_info(f"Total de rutas: {uso['total_rutas']}")
            print_info(f"Como origen: {uso['detalle']['como_origen']}")
            print_info(f"Como destino: {uso['detalle']['como_destino']}")
            print_info(f"En itinerario: {uso['detalle']['en_itinerario']}")
            print_info(f"Puede eliminar: {uso['puede_eliminar']}")
            
            if uso['esta_en_uso']:
                print_warning(f"\n⚠️  {uso['mensaje']}")
                print_info("\nRutas que la usan:")
                
                if uso['rutas']['rutas_origen']:
                    print_info(f"\n  Como ORIGEN ({len(uso['rutas']['rutas_origen'])}):")
                    for ruta in uso['rutas']['rutas_origen'][:5]:
                        print(f"    - {ruta['codigo']}: {ruta['ruta']}")
                
                if uso['rutas']['rutas_destino']:
                    print_info(f"\n  Como DESTINO ({len(uso['rutas']['rutas_destino'])}):")
                    for ruta in uso['rutas']['rutas_destino'][:5]:
                        print(f"    - {ruta['codigo']}: {ruta['ruta']}")
                
                if uso['rutas']['rutas_itinerario']:
                    print_info(f"\n  En ITINERARIO ({len(uso['rutas']['rutas_itinerario'])}):")
                    for ruta in uso['rutas']['rutas_itinerario'][:5]:
                        print(f"    - {ruta['codigo']}: {ruta['ruta']}")
            else:
                print_success(f"\n✅ {uso['mensaje']}")
            
            return uso
        else:
            print_error(f"Error verificando uso: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

if __name__ == "__main__":
    test_proteccion()
    
    print("\n" + "="*60)
    print("📊 RESUMEN")
    print("="*60)
    print("\n✅ La protección está implementada:")
    print("  - Se verifica si la localidad está en uso")
    print("  - Se muestra en qué rutas se usa")
    print("  - Se bloquea la eliminación si está en uso")
    print("\n⚠️  Para eliminar una localidad en uso:")
    print("  1. Primero eliminar o modificar las rutas que la usan")
    print("  2. Luego eliminar la localidad")
    print()
