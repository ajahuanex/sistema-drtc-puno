#!/usr/bin/env python3
"""
Script para verificar las rutas que se crearon
"""
import requests
import json

def verificar_rutas_creadas():
    """Verificar las rutas que se crearon en la carga masiva"""
    
    print("🔍 VERIFICANDO RUTAS CREADAS")
    print("=" * 40)
    
    # IDs de las rutas creadas (del log del frontend)
    rutas_ids = [
        "697fd48ef55bc6b88340c97f",
        "697fd48ef55bc6b88340c980", 
        "697fd48ef55bc6b88340c981",
        "697fd48ef55bc6b88340c982",
        "697fd48ef55bc6b88340c983",
        "697fd48ef55bc6b88340c984",
        "697fd48ef55bc6b88340c985",
        "697fd48ef55bc6b88340c986",
        "697fd48ef55bc6b88340c987"
    ]
    
    base_url = "http://localhost:8000/api/v1"
    
    print(f"📋 Verificando {len(rutas_ids)} rutas creadas...")
    
    for i, ruta_id in enumerate(rutas_ids, 1):
        print(f"\n🔍 Ruta {i} - ID: {ruta_id}")
        
        try:
            url = f"{base_url}/rutas/{ruta_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                ruta = response.json()
                
                print(f"   ✅ RUTA ENCONTRADA")
                print(f"      • Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"      • Nombre: {ruta.get('nombre', 'N/A')}")
                
                # Verificar empresa
                empresa = ruta.get('empresa')
                if empresa:
                    print(f"      • ✅ TIENE EMPRESA:")
                    print(f"        - ID: {empresa.get('id', 'N/A')}")
                    print(f"        - RUC: {empresa.get('ruc', 'N/A')}")
                    
                    razon_social = 'Sin razón social'
                    if 'razonSocial' in empresa:
                        if isinstance(empresa['razonSocial'], dict):
                            razon_social = empresa['razonSocial'].get('principal', 'Sin razón social')
                        else:
                            razon_social = str(empresa['razonSocial'])
                    
                    print(f"        - Razón Social: {razon_social}")
                else:
                    print(f"      • ❌ NO TIENE EMPRESA")
                
                # Verificar resolución
                resolucion = ruta.get('resolucion')
                if resolucion:
                    print(f"      • ✅ TIENE RESOLUCIÓN:")
                    print(f"        - Número: {resolucion.get('nroResolucion', 'N/A')}")
                    print(f"        - Tipo: {resolucion.get('tipoResolucion', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE RESOLUCIÓN")
                
                # Verificar origen y destino
                origen = ruta.get('origen')
                destino = ruta.get('destino')
                
                if origen:
                    print(f"      • Origen: {origen.get('nombre', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE ORIGEN")
                
                if destino:
                    print(f"      • Destino: {destino.get('nombre', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE DESTINO")
                
            elif response.status_code == 404:
                print(f"   ❌ RUTA NO ENCONTRADA (404)")
            else:
                print(f"   ⚠️  Error HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print(f"\n📊 RESUMEN:")
    print(f"   • Total rutas verificadas: {len(rutas_ids)}")
    print(f"   • Las rutas se crearon pero pueden tener problemas con empresa/resolución")

if __name__ == "__main__":
    verificar_rutas_creadas()