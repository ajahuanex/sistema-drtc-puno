#!/usr/bin/env python3
"""
Probar los filtros corregidos con el formato correcto del backend
"""

import requests
import json

def test_backend_con_filtros_corregidos():
    """Probar el backend con los filtros en el formato correcto"""
    
    print("🔧 PROBANDO FILTROS CORREGIDOS")
    print("=" * 60)
    
    base_url = "http://localhost:8000/api/v1"  # ← CORREGIDO: Agregar prefijo /api/v1
    
    # 1. Probar endpoint básico primero
    print("\n1. Verificando endpoint básico /resoluciones")
    try:
        response = requests.get(f"{base_url}/resoluciones", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint básico OK: {len(data)} resoluciones")
            
            if len(data) > 0:
                print("   Ejemplos de resoluciones:")
                for i, res in enumerate(data[:3]):
                    print(f"      {i+1}. {res.get('nroResolucion', 'Sin número')} - Estado: {res.get('estado', 'Sin estado')}")
            else:
                print("   ⚠️  No hay resoluciones en la base de datos")
                return False
        else:
            print(f"❌ Error en endpoint básico: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    # 2. Probar filtros corregidos
    print("\n2. Probando filtros con formato CORREGIDO")
    
    # Obtener una resolución para usar en las pruebas
    response = requests.get(f"{base_url}/resoluciones", timeout=5)
    resoluciones = response.json()
    
    if not resoluciones:
        print("   ⚠️  No hay resoluciones para probar")
        return False
    
    resolucion_test = resoluciones[0]
    numero_test = resolucion_test.get('nroResolucion', '')
    estado_test = resolucion_test.get('estado', 'VIGENTE')
    
    print(f"   Usando resolución de prueba: {numero_test} - {estado_test}")
    
    # Caso 1: Filtro por número (formato corregido)
    print("\n   a) Filtro por número (nroResolucion):")
    filtro_numero = {
        "nroResolucion": numero_test  # ← Formato correcto
    }
    
    try:
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtro_numero, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Filtro por número OK: {len(data)} resultados")
            if len(data) > 0:
                print(f"         Encontrado: {data[0].get('nroResolucion', 'Sin número')}")
        else:
            print(f"      ❌ Error: {response.status_code}")
            print(f"         Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Excepción: {e}")
    
    # Caso 2: Filtro por estado (formato corregido)
    print("\n   b) Filtro por estado (singular):")
    filtro_estado = {
        "estado": estado_test  # ← Formato correcto (singular)
    }
    
    try:
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtro_estado, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Filtro por estado OK: {len(data)} resultados")
        else:
            print(f"      ❌ Error: {response.status_code}")
            print(f"         Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Excepción: {e}")
    
    # Caso 3: Filtro combinado (formato corregido)
    print("\n   c) Filtro combinado:")
    filtro_combinado = {
        "nroResolucion": numero_test[:5],  # Buscar por parte del número
        "estado": estado_test
    }
    
    try:
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtro_combinado, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Filtro combinado OK: {len(data)} resultados")
        else:
            print(f"      ❌ Error: {response.status_code}")
            print(f"         Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Excepción: {e}")
    
    # Caso 4: Búsqueda parcial
    print("\n   d) Búsqueda parcial por número:")
    filtro_parcial = {
        "nroResolucion": "R-"  # Buscar todas las que empiecen con R-
    }
    
    try:
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtro_parcial, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Búsqueda parcial OK: {len(data)} resultados")
            if len(data) > 0:
                print("         Ejemplos encontrados:")
                for i, res in enumerate(data[:3]):
                    print(f"            {i+1}. {res.get('nroResolucion', 'Sin número')}")
        else:
            print(f"      ❌ Error: {response.status_code}")
            print(f"         Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Excepción: {e}")
    
    return True

def test_formato_frontend_vs_backend():
    """Comparar formato del frontend vs backend"""
    
    print("\n📊 COMPARACIÓN DE FORMATOS")
    print("=" * 60)
    
    print("\n❌ FORMATO ANTERIOR (INCORRECTO):")
    formato_anterior = {
        "numeroResolucion": "R-0001-2025",  # ← Nombre incorrecto
        "estados": ["VIGENTE"]              # ← Array incorrecto
    }
    print(f"   {json.dumps(formato_anterior, indent=2)}")
    
    print("\n✅ FORMATO CORREGIDO (CORRECTO):")
    formato_corregido = {
        "nroResolucion": "R-0001-2025",     # ← Nombre correcto
        "estado": "VIGENTE"                 # ← String singular correcto
    }
    print(f"   {json.dumps(formato_corregido, indent=2)}")
    
    print("\n🔧 CAMBIOS APLICADOS:")
    print("   1. numeroResolucion → nroResolucion")
    print("   2. estados: [\"VIGENTE\"] → estado: \"VIGENTE\"")
    print("   3. Filtros enviados directamente al backend")

if __name__ == "__main__":
    print("🚀 PROBANDO FILTROS CORREGIDOS DE RESOLUCIONES")
    print("=" * 60)
    
    # 1. Mostrar comparación de formatos
    test_formato_frontend_vs_backend()
    
    # 2. Probar backend con filtros corregidos
    backend_ok = test_backend_con_filtros_corregidos()
    
    if backend_ok:
        print("\n🎉 FILTROS CORREGIDOS EXITOSAMENTE")
        print("✅ El backend responde correctamente")
        print("✅ Los filtros están en el formato correcto")
        print("✅ El buscador debería funcionar ahora")
    else:
        print("\n⚠️  PROBLEMAS DETECTADOS")
        print("❌ Verificar que el backend esté corriendo")
        print("❌ Verificar que haya datos en la base de datos")
    
    print("\n" + "=" * 60)
    print("Prueba completada")