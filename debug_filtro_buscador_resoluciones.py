#!/usr/bin/env python3
"""
Debug del filtro buscador de resoluciones - Diagnosticar problema de filtrado
"""

import requests
import json

def test_backend_resoluciones():
    """Probar endpoints del backend de resoluciones"""
    
    print("🔍 DIAGNOSTICANDO BACKEND DE RESOLUCIONES")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Probar endpoint básico de resoluciones
    print("\n1. Probando endpoint básico /resoluciones")
    try:
        response = requests.get(f"{base_url}/resoluciones", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint básico OK: {len(data)} resoluciones")
            
            # Mostrar algunas resoluciones para debug
            for i, res in enumerate(data[:3]):
                print(f"   Resolución {i+1}: {res.get('nroResolucion', 'Sin número')} - Empresa: {res.get('empresaId', 'Sin empresa')}")
        else:
            print(f"❌ Error en endpoint básico: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    # 2. Probar endpoint de filtros
    print("\n2. Probando endpoint /resoluciones/filtradas")
    try:
        # Filtro vacío
        filtros_vacios = {}
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtros_vacios, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Filtros vacíos OK: {len(data)} resoluciones")
        else:
            print(f"❌ Error con filtros vacíos: {response.status_code}")
            print(f"   Respuesta: {response.text}")
    except Exception as e:
        print(f"❌ Error con filtros vacíos: {e}")
    
    # 3. Probar filtro por número de resolución
    print("\n3. Probando filtro por número de resolución")
    try:
        # Obtener una resolución para probar
        response = requests.get(f"{base_url}/resoluciones", timeout=5)
        if response.status_code == 200:
            resoluciones = response.json()
            if resoluciones:
                numero_test = resoluciones[0].get('nroResolucion', '')
                print(f"   Probando con número: {numero_test}")
                
                # Probar filtro completo
                filtros_numero = {
                    "numeroResolucion": numero_test
                }
                
                response = requests.post(f"{base_url}/resoluciones/filtradas", 
                                       json=filtros_numero, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Filtro por número OK: {len(data)} resultados")
                    if len(data) > 0:
                        print(f"   Encontrado: {data[0].get('nroResolucion', 'Sin número')}")
                    else:
                        print("   ⚠️  No se encontraron resultados")
                else:
                    print(f"❌ Error con filtro por número: {response.status_code}")
                    print(f"   Respuesta: {response.text}")
            else:
                print("   ⚠️  No hay resoluciones para probar")
    except Exception as e:
        print(f"❌ Error probando filtro por número: {e}")
    
    # 4. Probar filtro por estado
    print("\n4. Probando filtro por estado")
    try:
        filtros_estado = {
            "estados": ["VIGENTE"]
        }
        
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtros_estado, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Filtro por estado OK: {len(data)} resultados")
        else:
            print(f"❌ Error con filtro por estado: {response.status_code}")
            print(f"   Respuesta: {response.text}")
    except Exception as e:
        print(f"❌ Error probando filtro por estado: {e}")
    
    # 5. Probar filtro combinado
    print("\n5. Probando filtro combinado")
    try:
        filtros_combinados = {
            "numeroResolucion": "R-",
            "estados": ["VIGENTE"]
        }
        
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtros_combinados, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Filtro combinado OK: {len(data)} resultados")
        else:
            print(f"❌ Error con filtro combinado: {response.status_code}")
            print(f"   Respuesta: {response.text}")
    except Exception as e:
        print(f"❌ Error probando filtro combinado: {e}")
    
    return True

def test_frontend_filtros():
    """Simular el comportamiento del frontend"""
    
    print("\n🎯 SIMULANDO COMPORTAMIENTO DEL FRONTEND")
    print("=" * 60)
    
    # Simular los filtros que envía el componente minimal
    print("\n1. Filtros que envía ResolucionesFiltersMinimalComponent:")
    
    # Caso 1: Solo búsqueda
    filtro_busqueda = {
        "numeroResolucion": "R-0001"
    }
    print(f"   Búsqueda: {json.dumps(filtro_busqueda, indent=2)}")
    
    # Caso 2: Solo estado
    filtro_estado = {
        "estados": ["VIGENTE"]
    }
    print(f"   Estado: {json.dumps(filtro_estado, indent=2)}")
    
    # Caso 3: Combinado
    filtro_combinado = {
        "numeroResolucion": "R-0001",
        "estados": ["VIGENTE"]
    }
    print(f"   Combinado: {json.dumps(filtro_combinado, indent=2)}")
    
    # Probar cada uno contra el backend
    base_url = "http://localhost:8000"
    
    for nombre, filtros in [
        ("Búsqueda", filtro_busqueda),
        ("Estado", filtro_estado), 
        ("Combinado", filtro_combinado)
    ]:
        print(f"\n2. Probando filtro {nombre}:")
        try:
            response = requests.post(f"{base_url}/resoluciones/filtradas", 
                                   json=filtros, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {nombre} OK: {len(data)} resultados")
                
                # Mostrar algunos resultados
                for i, res in enumerate(data[:2]):
                    print(f"      {i+1}. {res.get('nroResolucion', 'Sin número')} - {res.get('estado', 'Sin estado')}")
            else:
                print(f"   ❌ {nombre} Error: {response.status_code}")
                print(f"      Respuesta: {response.text}")
        except Exception as e:
            print(f"   ❌ {nombre} Excepción: {e}")

def verificar_datos_mock():
    """Verificar si hay datos mock en el frontend"""
    
    print("\n🧹 VERIFICANDO DATOS MOCK EN FRONTEND")
    print("=" * 60)
    
    # Archivos que podrían contener datos mock
    archivos_sospechosos = [
        "frontend/src/app/services/resolucion.service.ts",
        "frontend/src/app/shared/resoluciones-table.component.ts",
        "frontend/src/app/components/resoluciones/resoluciones-minimal.component.ts",
        "frontend/src/app/models/resolucion-table.model.ts"
    ]
    
    import os
    
    for archivo in archivos_sospechosos:
        if os.path.exists(archivo):
            print(f"\n📁 Revisando: {archivo}")
            
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
                # Buscar patrones de datos mock
                patrones_mock = [
                    "mockData",
                    "MOCK_",
                    "datos_mock",
                    "fake_data",
                    "test_data",
                    "R-0001-2025",
                    "R-0002-2025",
                    "// Mock data",
                    "/* Mock data"
                ]
                
                encontrados = []
                for patron in patrones_mock:
                    if patron.lower() in contenido.lower():
                        encontrados.append(patron)
                
                if encontrados:
                    print(f"   ⚠️  Posibles datos mock encontrados: {', '.join(encontrados)}")
                else:
                    print(f"   ✅ No se encontraron datos mock obvios")
        else:
            print(f"\n📁 {archivo} - No existe")

def generar_solucion():
    """Generar script de solución"""
    
    print("\n🔧 GENERANDO SOLUCIÓN")
    print("=" * 60)
    
    solucion = """
# SOLUCIÓN PARA EL PROBLEMA DEL BUSCADOR

## Problema identificado:
El filtro minimalista no está funcionando correctamente.

## Posibles causas:
1. El backend no está procesando correctamente los filtros
2. Hay datos mock interfiriendo
3. El mapeo de filtros entre frontend y backend es incorrecto
4. El componente ResolucionesTableService no está sincronizado

## Solución paso a paso:

### 1. Verificar backend
```bash
# Probar endpoint directo
curl -X GET "http://localhost:8000/resoluciones"

# Probar filtros
curl -X POST "http://localhost:8000/resoluciones/filtradas" \\
  -H "Content-Type: application/json" \\
  -d '{"numeroResolucion": "R-0001"}'
```

### 2. Limpiar datos mock
- Revisar ResolucionService
- Revisar ResolucionesTableComponent  
- Eliminar cualquier dato hardcodeado

### 3. Corregir filtros
- Verificar que ResolucionesFiltersMinimalComponent emita correctamente
- Verificar que ResolucionesMinimalComponent procese correctamente
- Verificar que el backend reciba los filtros correctos

### 4. Probar funcionalidad
- Buscar por número de resolución
- Filtrar por estado
- Combinar filtros
"""
    
    print(solucion)

if __name__ == "__main__":
    print("🚀 DIAGNÓSTICO DEL FILTRO BUSCADOR DE RESOLUCIONES")
    print("=" * 60)
    
    # 1. Probar backend
    backend_ok = test_backend_resoluciones()
    
    if backend_ok:
        # 2. Probar comportamiento del frontend
        test_frontend_filtros()
    
    # 3. Verificar datos mock
    verificar_datos_mock()
    
    # 4. Generar solución
    generar_solucion()
    
    print("\n" + "=" * 60)
    print("Diagnóstico completado")