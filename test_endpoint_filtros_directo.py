#!/usr/bin/env python3
"""
Test directo del endpoint de filtros de empresas para diagnosticar el problema.
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi.testclient import TestClient
from app.main import app

def test_endpoint_filtros():
    """Test directo del endpoint de filtros."""
    
    print("🧪 TEST ENDPOINT FILTROS DIRECTO")
    print("=" * 50)
    
    # Crear cliente de test
    client = TestClient(app)
    
    # Test 1: Endpoint básico sin filtros
    print("\n1. Probando endpoint sin filtros...")
    
    try:
        response = client.get("/api/v1/empresas/filtros")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa: {len(data)} empresas")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Detalle: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en request: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Endpoint con filtros
    print(f"\n2. Probando endpoint con filtros...")
    
    try:
        params = {
            "ruc": "2044",
            "skip": 0,
            "limit": 1000
        }
        
        response = client.get("/api/v1/empresas/filtros", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa: {len(data)} empresas")
            
            # Mostrar primera empresa si existe
            if data:
                empresa = data[0]
                print(f"Primera empresa:")
                print(f"   • RUC: {empresa.get('ruc', 'N/A')}")
                print(f"   • Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"   • Estado: {empresa.get('estado', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Detalle: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en request con filtros: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Endpoint con estado específico
    print(f"\n3. Probando endpoint con estado AUTORIZADA...")
    
    try:
        params = {
            "estado": "AUTORIZADA",
            "skip": 0,
            "limit": 10
        }
        
        response = client.get("/api/v1/empresas/filtros", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa: {len(data)} empresas con estado AUTORIZADA")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Detalle: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en request con estado: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 4: Verificar otros endpoints
    print(f"\n4. Probando otros endpoints de empresas...")
    
    try:
        # Endpoint de estadísticas
        response = client.get("/api/v1/empresas/estadisticas")
        print(f"Estadísticas - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas: {stats.get('totalEmpresas', 0)} empresas totales")
        
        # Endpoint básico de empresas
        response = client.get("/api/v1/empresas")
        print(f"Empresas básico - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Empresas básico: {len(empresas)} empresas")
            
    except Exception as e:
        print(f"❌ Error en otros endpoints: {e}")
    
    print(f"\n📊 RESUMEN:")
    print(f"✅ Test completado")
    print(f"ℹ️  Si hay errores 500, revisar logs del backend")
    print(f"ℹ️  Si hay errores de conexión, verificar que el backend esté ejecutándose")

def test_importaciones():
    """Test de importaciones necesarias."""
    
    print(f"\n🧪 TEST IMPORTACIONES")
    print("=" * 30)
    
    try:
        from app.models.empresa import EmpresaFiltros, EstadoEmpresa
        print("✅ Modelos importados correctamente")
        
        from app.services.empresa_service import EmpresaService
        print("✅ Servicio importado correctamente")
        
        from app.routers.empresas_router import router
        print("✅ Router importado correctamente")
        
        # Verificar que EstadoEmpresa tiene AUTORIZADA
        if hasattr(EstadoEmpresa, 'AUTORIZADA'):
            print("✅ EstadoEmpresa.AUTORIZADA disponible")
        else:
            print("❌ EstadoEmpresa.AUTORIZADA no disponible")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en importaciones: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO DIAGNÓSTICO DE FILTROS")
    print("=" * 60)
    
    # Test importaciones
    imports_ok = test_importaciones()
    
    if imports_ok:
        # Test endpoint
        test_endpoint_filtros()
    else:
        print("❌ No se pueden probar endpoints debido a errores de importación")