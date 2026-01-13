#!/usr/bin/env python3
"""
Script para probar la integración entre el módulo de empresas y el módulo de rutas optimizado
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:4200"

def test_navegacion_empresas_rutas():
    """Probar la navegación desde empresas hacia rutas"""
    
    print("🧪 PROBANDO INTEGRACIÓN EMPRESAS → RUTAS")
    print("=" * 50)
    
    # 1. Verificar que el backend esté funcionando
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend funcionando correctamente")
        else:
            print("❌ Backend no responde correctamente")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    # 2. Obtener lista de empresas
    try:
        response = requests.get(f"{BASE_URL}/api/empresas")
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Empresas obtenidas: {len(empresas)} empresas")
            
            if len(empresas) > 0:
                empresa_test = empresas[0]
                print(f"📋 Empresa de prueba: {empresa_test.get('ruc')} - {empresa_test.get('razonSocial', {}).get('principal', 'Sin nombre')}")
                
                # 3. Probar navegación con parámetros
                test_params = {
                    'empresaId': empresa_test.get('id'),
                    'empresaRuc': empresa_test.get('ruc'),
                    'empresaNombre': empresa_test.get('razonSocial', {}).get('principal', ''),
                    'accion': 'crear'
                }
                
                print(f"🔗 URL de navegación simulada:")
                print(f"   {FRONTEND_URL}/rutas?{format_query_params(test_params)}")
                
                return True
            else:
                print("⚠️ No hay empresas para probar")
                return False
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error obteniendo empresas: {e}")
        return False

def test_rutas_por_empresa():
    """Probar la obtención de rutas por empresa"""
    
    print("\n🧪 PROBANDO RUTAS POR EMPRESA")
    print("=" * 50)
    
    try:
        # Obtener empresas
        response = requests.get(f"{BASE_URL}/api/empresas")
        if response.status_code == 200:
            empresas = response.json()
            
            if len(empresas) > 0:
                empresa_test = empresas[0]
                empresa_id = empresa_test.get('id')
                
                # Obtener rutas de la empresa
                response = requests.get(f"{BASE_URL}/api/rutas?empresaId={empresa_id}")
                if response.status_code == 200:
                    rutas = response.json()
                    print(f"✅ Rutas de la empresa obtenidas: {len(rutas)} rutas")
                    
                    if len(rutas) > 0:
                        ruta_test = rutas[0]
                        print(f"📋 Ruta de prueba: {ruta_test.get('codigoRuta')} - {ruta_test.get('nombre', 'Sin nombre')}")
                        print(f"   Origen: {ruta_test.get('origen', {}).get('nombre', 'No especificado')}")
                        print(f"   Destino: {ruta_test.get('destino', {}).get('nombre', 'No especificado')}")
                        
                        # Verificar estructura de resolución embebida
                        resolucion = ruta_test.get('resolucion', {})
                        if resolucion:
                            print(f"   Resolución: {resolucion.get('nroResolucion', 'No especificada')}")
                            print(f"   Tipo: {resolucion.get('tipoResolucion', 'No especificado')}")
                        
                        return True
                    else:
                        print("⚠️ La empresa no tiene rutas asignadas")
                        return True
                else:
                    print(f"❌ Error obteniendo rutas: {response.status_code}")
                    return False
            else:
                print("⚠️ No hay empresas para probar")
                return False
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en prueba de rutas por empresa: {e}")
        return False

def test_resoluciones_por_empresa():
    """Probar la obtención de resoluciones por empresa"""
    
    print("\n🧪 PROBANDO RESOLUCIONES POR EMPRESA")
    print("=" * 50)
    
    try:
        # Obtener empresas
        response = requests.get(f"{BASE_URL}/api/empresas")
        if response.status_code == 200:
            empresas = response.json()
            
            if len(empresas) > 0:
                empresa_test = empresas[0]
                empresa_id = empresa_test.get('id')
                
                # Obtener resoluciones de la empresa
                response = requests.get(f"{BASE_URL}/api/resoluciones?empresaId={empresa_id}")
                if response.status_code == 200:
                    resoluciones = response.json()
                    print(f"✅ Resoluciones de la empresa obtenidas: {len(resoluciones)} resoluciones")
                    
                    if len(resoluciones) > 0:
                        resolucion_test = resoluciones[0]
                        print(f"📋 Resolución de prueba: {resolucion_test.get('nroResolucion')} - {resolucion_test.get('tipoTramite')}")
                        print(f"   Tipo: {resolucion_test.get('tipoResolucion')}")
                        print(f"   Estado: {resolucion_test.get('estado')}")
                        
                        return True
                    else:
                        print("⚠️ La empresa no tiene resoluciones")
                        return True
                else:
                    print(f"❌ Error obteniendo resoluciones: {response.status_code}")
                    return False
            else:
                print("⚠️ No hay empresas para probar")
                return False
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error en prueba de resoluciones por empresa: {e}")
        return False

def format_query_params(params):
    """Formatear parámetros de query string"""
    return "&".join([f"{k}={v}" for k, v in params.items() if v])

def test_endpoints_integracion():
    """Probar endpoints específicos de integración"""
    
    print("\n🧪 PROBANDO ENDPOINTS DE INTEGRACIÓN")
    print("=" * 50)
    
    endpoints_to_test = [
        "/api/empresas",
        "/api/rutas", 
        "/api/resoluciones",
        "/api/localidades",
        "/health"
    ]
    
    results = {}
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                data = response.json()
                results[endpoint] = {
                    'status': 'OK',
                    'count': len(data) if isinstance(data, list) else 1
                }
                print(f"✅ {endpoint}: OK ({results[endpoint]['count']} elementos)")
            else:
                results[endpoint] = {
                    'status': 'ERROR',
                    'code': response.status_code
                }
                print(f"❌ {endpoint}: ERROR {response.status_code}")
        except Exception as e:
            results[endpoint] = {
                'status': 'EXCEPTION',
                'error': str(e)
            }
            print(f"❌ {endpoint}: EXCEPTION {e}")
    
    return results

def main():
    """Función principal"""
    
    print("🚀 INICIANDO PRUEBAS DE INTEGRACIÓN EMPRESAS ↔ RUTAS")
    print("=" * 60)
    print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Backend: {BASE_URL}")
    print(f"🖥️ Frontend: {FRONTEND_URL}")
    print()
    
    # Ejecutar pruebas
    tests = [
        ("Navegación Empresas → Rutas", test_navegacion_empresas_rutas),
        ("Rutas por Empresa", test_rutas_por_empresa),
        ("Resoluciones por Empresa", test_resoluciones_por_empresa),
        ("Endpoints de Integración", test_endpoints_integracion)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ Error en {test_name}: {e}")
            results[test_name] = False
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        if result:
            print(f"✅ {test_name}: PASÓ")
            passed += 1
        else:
            print(f"❌ {test_name}: FALLÓ")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas de integración pasaron!")
        return True
    else:
        print("⚠️ Algunas pruebas fallaron. Revisar la integración.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)