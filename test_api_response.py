#!/usr/bin/env python3
"""
Script para probar la respuesta del API de rutas
"""

import requests
import json

def test_rutas_api():
    print("🔍 PROBANDO API DE RUTAS")
    print("=" * 50)
    
    try:
        # Hacer request al endpoint de rutas
        response = requests.get('http://localhost:8000/api/v1/rutas/')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"Total rutas recibidas: {len(rutas)}")
            
            # Mostrar las primeras 2 rutas para ver la estructura
            for i, ruta in enumerate(rutas[:2], 1):
                print(f"\n📋 RUTA {i}:")
                print(f"   ID: {ruta.get('id', 'N/A')}")
                print(f"   Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"   Origen: {ruta.get('origen', 'N/A')}")
                print(f"   Destino: {ruta.get('destino', 'N/A')}")
                
                # Verificar estructura de empresa
                empresa = ruta.get('empresa', {})
                print(f"   🏢 EMPRESA:")
                print(f"      Tipo: {type(empresa)}")
                if empresa:
                    print(f"      ID: {empresa.get('id', 'N/A')}")
                    print(f"      RUC: {empresa.get('ruc', 'N/A')}")
                    print(f"      Razón Social: {empresa.get('razonSocial', 'N/A')}")
                    print(f"      Tipo razón social: {type(empresa.get('razonSocial', 'N/A'))}")
                else:
                    print(f"      ❌ Empresa vacía")
                
                # Verificar estructura de resolución
                resolucion = ruta.get('resolucion', {})
                print(f"   📄 RESOLUCIÓN:")
                print(f"      Tipo: {type(resolucion)}")
                if resolucion:
                    print(f"      ID: {resolucion.get('id', 'N/A')}")
                    print(f"      Número: {resolucion.get('numero', 'N/A')}")
                else:
                    print(f"      ❌ Resolución vacía")
                
                print(f"   📊 ESTRUCTURA COMPLETA:")
                print(json.dumps(ruta, indent=2, ensure_ascii=False))
                print("-" * 50)
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error al hacer request: {e}")

if __name__ == "__main__":
    test_rutas_api()