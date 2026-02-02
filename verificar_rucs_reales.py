#!/usr/bin/env python3
"""
Script para verificar los RUCs reales que se ven en la imagen
"""
import requests
import json

def verificar_rucs_via_api():
    """Verificar RUCs usando la API del backend"""
    
    print("🔍 VERIFICANDO RUCs REALES VÍA API")
    print("=" * 40)
    
    # RUCs que se ven en la imagen del Excel
    rucs_reales = [
        "20232322862",
        "20364027410"
    ]
    
    print(f"📋 RUCs a verificar (de la imagen):")
    for ruc in rucs_reales:
        print(f"   • {ruc}")
    
    # URL base de la API (asumiendo que está corriendo en localhost:8000)
    base_url = "http://localhost:8000/api/v1"
    
    print(f"\n🔍 Verificando empresas vía API...")
    
    for ruc in rucs_reales:
        print(f"\n🔍 Verificando RUC: {ruc}")
        
        try:
            # Intentar obtener empresa por RUC
            url = f"{base_url}/empresas/validar-ruc/{ruc}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('empresa'):
                    empresa = data['empresa']
                    print(f"   ✅ EMPRESA ENCONTRADA")
                    print(f"      • ID: {empresa.get('id', 'N/A')}")
                    print(f"      • RUC: {empresa.get('ruc', 'N/A')}")
                    
                    razon_social = 'Sin razón social'
                    if 'razonSocial' in empresa:
                        if isinstance(empresa['razonSocial'], dict):
                            razon_social = empresa['razonSocial'].get('principal', 'Sin razón social')
                        else:
                            razon_social = str(empresa['razonSocial'])
                    
                    print(f"      • Razón Social: {razon_social}")
                    print(f"      • Estado: {empresa.get('estado', 'N/A')}")
                    print(f"      • Activa: {empresa.get('estaActivo', 'N/A')}")
                else:
                    print(f"   ❌ EMPRESA NO ENCONTRADA (respuesta vacía)")
            elif response.status_code == 404:
                print(f"   ❌ EMPRESA NO ENCONTRADA (404)")
            else:
                print(f"   ⚠️  Error HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ No se pudo conectar a la API (¿está corriendo el backend?)")
        except requests.exceptions.Timeout:
            print(f"   ⚠️  Timeout al consultar la API")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    # También intentar listar algunas empresas para ver qué hay disponible
    print(f"\n📋 Intentando obtener lista de empresas...")
    
    try:
        url = f"{base_url}/empresas/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"   ✅ Se encontraron {len(empresas)} empresas en el sistema")
            
            if len(empresas) > 0:
                print(f"\n📋 Primeras 10 empresas disponibles:")
                for i, empresa in enumerate(empresas[:10], 1):
                    ruc = empresa.get('ruc', 'Sin RUC')
                    
                    razon_social = 'Sin razón social'
                    if 'razonSocial' in empresa:
                        if isinstance(empresa['razonSocial'], dict):
                            razon_social = empresa['razonSocial'].get('principal', 'Sin razón social')
                        else:
                            razon_social = str(empresa['razonSocial'])
                    
                    activa = empresa.get('estaActivo', False)
                    estado_str = "✅" if activa else "❌"
                    
                    print(f"   {i:2d}. {ruc} - {razon_social[:40]}... ({estado_str})")
        else:
            print(f"   ⚠️  Error obteniendo empresas: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error obteniendo lista de empresas: {str(e)}")

if __name__ == "__main__":
    verificar_rucs_via_api()