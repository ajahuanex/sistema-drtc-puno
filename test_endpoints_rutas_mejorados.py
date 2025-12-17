#!/usr/bin/env python3
"""
Test de los nuevos endpoints para resoluciones primigenias
"""

import requests
import json

def test_resoluciones_primigenias():
    """Test del endpoint de todas las resoluciones primigenias"""
    print("🧪 Probando endpoint de resoluciones primigenias...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/resoluciones-primigenias", timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"✅ Resoluciones primigenias encontradas: {len(resoluciones)}")
            
            for i, resolucion in enumerate(resoluciones[:3], 1):  # Mostrar solo las primeras 3
                print(f"\n   {i}. Resolución: {resolucion.get('nroResolucion', 'Sin número')}")
                print(f"      ID: {resolucion.get('id', 'Sin ID')}")
                print(f"      Tipo: {resolucion.get('tipoTramite', 'Sin tipo')}")
                print(f"      Estado: {resolucion.get('estado', 'Sin estado')}")
                
                empresa = resolucion.get('empresa')
                if empresa:
                    print(f"      Empresa: {empresa.get('ruc', 'Sin RUC')} - {empresa.get('razonSocial', 'Sin razón social')}")
                else:
                    print(f"      Empresa: No asociada")
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Detalle: {error_detail}")
            except:
                print(f"   Respuesta: {response.text[:300]}")
                
    except Exception as e:
        print(f"❌ Error probando resoluciones primigenias: {e}")

def test_resoluciones_por_empresa():
    """Test del endpoint de resoluciones por empresa"""
    print("\n🧪 Probando endpoint de resoluciones por empresa...")
    
    # Usar una empresa conocida
    empresa_id = "693226268a29266aa49f5ebd"  # ID de empresa de pruebas anteriores
    
    try:
        url = f"http://localhost:8000/api/v1/rutas/empresa/{empresa_id}/resoluciones-primigenias"
        response = requests.get(url, timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        print(f"🏢 Empresa ID: {empresa_id}")
        
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"✅ Resoluciones de la empresa: {len(resoluciones)}")
            
            for i, resolucion in enumerate(resoluciones, 1):
                print(f"\n   {i}. Resolución: {resolucion.get('nroResolucion', 'Sin número')}")
                print(f"      ID: {resolucion.get('id', 'Sin ID')}")
                print(f"      Tipo: {resolucion.get('tipoTramite', 'Sin tipo')}")
                print(f"      Estado: {resolucion.get('estado', 'Sin estado')}")
                print(f"      Tipo Resolución: {resolucion.get('tipoResolucion', 'Sin tipo resolución')}")
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Detalle: {error_detail}")
            except:
                print(f"   Respuesta: {response.text[:300]}")
                
    except Exception as e:
        print(f"❌ Error probando resoluciones por empresa: {e}")

def test_siguiente_codigo():
    """Test del endpoint de siguiente código"""
    print("\n🧪 Probando endpoint de siguiente código...")
    
    # Usar una resolución conocida
    resolucion_id = "6940105d1e90f8d55bb199f7"  # ID de resolución de pruebas anteriores
    
    try:
        url = f"http://localhost:8000/api/v1/rutas/resolucion/{resolucion_id}/siguiente-codigo"
        response = requests.get(url, timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        print(f"📄 Resolución ID: {resolucion_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Siguiente código disponible: {data.get('siguienteCodigo', 'No disponible')}")
            print(f"   Para resolución: {data.get('resolucionId', 'No especificada')}")
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Detalle: {error_detail}")
            except:
                print(f"   Respuesta: {response.text[:300]}")
                
    except Exception as e:
        print(f"❌ Error probando siguiente código: {e}")

def main():
    """Función principal"""
    print("🚀 TEST DE ENDPOINTS MEJORADOS DE RUTAS")
    print("="*50)
    
    test_resoluciones_primigenias()
    test_resoluciones_por_empresa()
    test_siguiente_codigo()
    
    print("\n" + "="*50)
    print("✅ PRUEBAS COMPLETADAS")

if __name__ == "__main__":
    main()