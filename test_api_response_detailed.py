#!/usr/bin/env python3
"""
Script para probar la respuesta del API de rutas con más detalle
"""

import requests
import json

def test_rutas_api_detailed():
    print("🔍 PROBANDO API DE RUTAS - DETALLADO")
    print("=" * 50)
    
    try:
        # Hacer request al endpoint de rutas
        response = requests.get('http://localhost:8000/api/v1/rutas/')
        
        if response.status_code == 200:
            rutas = response.json()
            
            # Mostrar solo la primera ruta con todos los campos
            if rutas:
                ruta = rutas[0]
                print(f"📋 PRIMERA RUTA:")
                print(f"   ID: {ruta.get('id', 'N/A')}")
                print(f"   Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"   Nombre: {ruta.get('nombre', 'N/A')}")
                
                # Verificar frecuencias
                print(f"\n🕐 FRECUENCIAS:")
                print(f"   frecuencia (singular): {ruta.get('frecuencia', 'N/A')}")
                print(f"   frecuencias (plural): {ruta.get('frecuencias', 'N/A')}")
                
                # Verificar si tiene el campo frecuencias
                if 'frecuencias' in ruta:
                    print(f"   ✅ Campo 'frecuencias' presente: {ruta['frecuencias']}")
                else:
                    print(f"   ❌ Campo 'frecuencias' NO presente")
                
                print(f"\n📊 TODOS LOS CAMPOS:")
                for key, value in ruta.items():
                    print(f"   {key}: {value}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error al hacer request: {e}")

if __name__ == "__main__":
    test_rutas_api_detailed()