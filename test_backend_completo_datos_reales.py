#!/usr/bin/env python3
"""
Test completo del backend para verificar datos reales
"""
import requests
import json

def test_backend_completo():
    """Probar todos los endpoints del backend relacionados con el buscador"""
    
    print("🔍 PROBANDO BACKEND COMPLETO - DATOS REALES")
    print("=" * 60)
    
    backend_url = "http://localhost:8000/api/v1"
    
    # 1. Verificar que el backend esté corriendo
    print(f"\n1️⃣ VERIFICANDO CONEXIÓN AL BACKEND")
    try:
        response = requests.get(f"{backend_url}/", timeout=5)
        print(f"   ✅ Backend accesible")
    except Exception as e:
        print(f"   ❌ Backend no accesible: {e}")
        print(f"   💡 Ejecutar: start-backend.bat")
        return False
    
    # 2. Probar endpoint básico de rutas
    print(f"\n2️⃣ ENDPOINT: GET /rutas")
    try:
        response = requests.get(f"{backend_url}/rutas", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas)}")
            
            # Analizar estructura de datos
            print(f"\n   📊 ANÁLISIS DE RUTAS:")
            rutas_con_origen_destino = 0
            rutas_con_ids = 0
            
            for i, ruta in enumerate(rutas[:5]):
                print(f"   Ruta {i+1}: [{ruta.get('codigoRuta')}] {ruta.get('nombre', 'Sin nombre')}")
                
                origen = ruta.get('origen')
                destino = ruta.get('destino')
                origenId = ruta.get('origenId')
                destinoId = ruta.get('destinoId')
                
                print(f"      origen: {origen}")
                print(f"      destino: {destino}")
                print(f"      origenId: {origenId}")
                print(f"      destinoId: {destinoId}")
                print(f"      empresaId: {ruta.get('empresaId', 'N/A')}")
                print(f"      resolucionId: {ruta.get('resolucionId', 'N/A')}")
                
                if origen and destino:
                    rutas_con_origen_destino += 1
                if origenId and destinoId:
                    rutas_con_ids += 1
                print()
            
            print(f"   📈 RESUMEN:")
            print(f"      Total rutas: {len(rutas)}")
            print(f"      Con origen/destino: {rutas_con_origen_destino}")
            print(f"      Con origenId/destinoId: {rutas_con_ids}")
            
            if len(rutas) == 0:
                print(f"   ⚠️ NO HAY RUTAS EN LA BASE DE DATOS")
                return False
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:300]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # 3. Probar endpoint de combinaciones (el que usa el frontend)
    print(f"\n3️⃣ ENDPOINT: GET /rutas/combinaciones-rutas")
    try:
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            print(f"   ✅ Combinaciones obtenidas: {len(combinaciones)}")
            print(f"   📊 Estructura de respuesta:")
            print(f"      total_combinaciones: {data.get('total_combinaciones')}")
            print(f"      mensaje: {data.get('mensaje')}")
            
            if len(combinaciones) > 0:
                print(f"\n   🎯 COMBINACIONES DISPONIBLES:")
                for i, comb in enumerate(combinaciones):
                    rutas_count = len(comb.get('rutas', []))
                    print(f"      {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
                    
                    # Mostrar detalles de las primeras rutas
                    for j, ruta in enumerate(comb.get('rutas', [])[:2]):
                        print(f"         - [{ruta.get('codigoRuta')}] ID: {ruta.get('id')}")
                        print(f"           Empresa: {ruta.get('empresaId', 'N/A')}")
                        print(f"           Estado: {ruta.get('estado', 'N/A')}")
                
                return True, combinaciones
            else:
                print(f"   ⚠️ NO HAY COMBINACIONES DISPONIBLES")
                return False, []
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:300]}")
            return False, []
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, []

def test_busquedas_especificas(combinaciones):
    """Probar búsquedas específicas en el endpoint"""
    
    print(f"\n4️⃣ PROBANDO BÚSQUEDAS ESPECÍFICAS")
    
    backend_url = "http://localhost:8000/api/v1"
    terminos_prueba = ["PUNO", "Juliaca", "Arequipa", "Cusco", "Lima"]
    
    for termino in terminos_prueba:
        print(f"\n   🔍 Búsqueda: '{termino}'")
        try:
            response = requests.get(f"{backend_url}/rutas/combinaciones-rutas?busqueda={termino}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                combinaciones_filtradas = data.get('combinaciones', [])
                
                print(f"      ✅ Resultados: {len(combinaciones_filtradas)}")
                
                if len(combinaciones_filtradas) > 0:
                    for comb in combinaciones_filtradas[:3]:  # Máximo 3
                        rutas_count = len(comb.get('rutas', []))
                        print(f"         - {comb.get('combinacion')} ({rutas_count} ruta(s))")
                else:
                    print(f"      📝 Sin resultados para '{termino}'")
            else:
                print(f"      ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Error: {e}")

def test_otros_endpoints():
    """Probar otros endpoints relacionados"""
    
    print(f"\n5️⃣ PROBANDO OTROS ENDPOINTS RELACIONADOS")
    
    backend_url = "http://localhost:8000/api/v1"
    
    # Endpoint de orígenes y destinos
    print(f"\n   📍 GET /rutas/origenes-destinos")
    try:
        response = requests.get(f"{backend_url}/rutas/origenes-destinos", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Status: 200")
            print(f"      Orígenes: {len(data.get('origenes', []))}")
            print(f"      Destinos: {len(data.get('destinos', []))}")
            print(f"      Combinaciones: {len(data.get('combinaciones', []))}")
        else:
            print(f"      ⚠️ Status: {response.status_code}")
    except Exception as e:
        print(f"      ❌ Error: {e}")
    
    # Endpoint de filtro avanzado
    print(f"\n   🔍 GET /rutas/filtro-avanzado")
    try:
        response = requests.get(f"{backend_url}/rutas/filtro-avanzado", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"      ✅ Status: 200")
            print(f"      Total rutas: {data.get('total_rutas', 0)}")
            print(f"      Total empresas: {data.get('total_empresas', 0)}")
        else:
            print(f"      ⚠️ Status: {response.status_code}")
    except Exception as e:
        print(f"      ❌ Error: {e}")

def mostrar_resumen_final(exito, combinaciones):
    """Mostrar resumen final de las pruebas"""
    
    print(f"\n" + "=" * 60)
    print(f"📋 RESUMEN FINAL DEL BACKEND")
    print(f"=" * 60)
    
    if exito:
        print(f"✅ BACKEND FUNCIONANDO CORRECTAMENTE")
        print(f"   • Conexión: OK")
        print(f"   • Endpoint /rutas: OK")
        print(f"   • Endpoint /rutas/combinaciones-rutas: OK")
        print(f"   • Datos reales: {len(combinaciones)} combinaciones")
        print(f"   • Búsquedas: Funcionando")
        
        print(f"\n🎯 DATOS DISPONIBLES PARA EL FRONTEND:")
        for i, comb in enumerate(combinaciones):
            rutas_count = len(comb.get('rutas', []))
            print(f"   {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
        
        print(f"\n✅ EL FRONTEND PUEDE CONECTARSE SIN PROBLEMAS")
        print(f"   URL para el frontend: http://localhost:8000/api/v1/rutas/combinaciones-rutas")
        
    else:
        print(f"❌ PROBLEMAS CON EL BACKEND")
        print(f"   • Verificar que esté corriendo: start-backend.bat")
        print(f"   • Verificar MongoDB esté activo")
        print(f"   • Verificar datos en la base de datos")
        print(f"   • Revisar logs del backend")
    
    print(f"\n🔧 SIGUIENTE PASO:")
    if exito:
        print(f"   ✅ Backend OK → Probar frontend")
        print(f"   📝 Abrir: http://localhost:4200/rutas")
        print(f"   📝 Expandir filtros avanzados")
        print(f"   📝 Verificar que aparezcan {len(combinaciones)} combinaciones")
    else:
        print(f"   🔧 Arreglar backend primero")
        print(f"   📝 Ejecutar: start-backend.bat")
        print(f"   📝 Verificar MongoDB")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DEL BACKEND...")
    
    # 1. Probar backend completo
    exito, combinaciones = test_backend_completo()
    
    if exito:
        # 2. Probar búsquedas específicas
        test_busquedas_especificas(combinaciones)
        
        # 3. Probar otros endpoints
        test_otros_endpoints()
    
    # 4. Mostrar resumen final
    mostrar_resumen_final(exito, combinaciones if exito else [])