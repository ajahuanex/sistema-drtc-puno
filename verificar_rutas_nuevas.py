#!/usr/bin/env python3
"""
Script para verificar las rutas recién creadas
"""
import requests
import json

def verificar_rutas_nuevas():
    """Verificar las rutas recién creadas en la carga masiva"""
    
    print("🔍 VERIFICANDO RUTAS RECIÉN CREADAS")
    print("=" * 50)
    
    # IDs de las rutas recién creadas (del log del backend)
    rutas_ids = [
        "697fdd3009ae5fc23277b9ab",
        "697fdd3009ae5fc23277b9ac",
        "697fdd3009ae5fc23277b9ad",
        "697fdd3009ae5fc23277b9ae",
        "697fdd3009ae5fc23277b9af"
    ]
    
    base_url = "http://localhost:8000/api/v1"
    
    print(f"📋 Verificando {len(rutas_ids)} rutas recién creadas...")
    
    rutas_con_empresa = 0
    rutas_sin_empresa = 0
    
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
                if empresa and empresa.get('ruc') and empresa.get('ruc') != '':
                    print(f"      • ✅ TIENE EMPRESA:")
                    print(f"        - ID: {empresa.get('id', 'N/A')}")
                    print(f"        - RUC: {empresa.get('ruc', 'N/A')}")
                    
                    razon_social = 'Sin razón social'
                    if isinstance(empresa.get('razonSocial'), str):
                        razon_social = empresa.get('razonSocial')
                    elif isinstance(empresa.get('razonSocial'), dict):
                        razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
                    
                    print(f"        - Razón Social: {razon_social}")
                    rutas_con_empresa += 1
                else:
                    print(f"      • ❌ NO TIENE EMPRESA O ESTÁ VACÍA")
                    print(f"        - Empresa object: {empresa}")
                    rutas_sin_empresa += 1
                
                # Verificar resolución
                resolucion = ruta.get('resolucion')
                if resolucion and resolucion.get('nroResolucion'):
                    print(f"      • ✅ TIENE RESOLUCIÓN: {resolucion.get('nroResolucion', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE RESOLUCIÓN")
                
                # Verificar origen y destino
                origen = ruta.get('origen')
                destino = ruta.get('destino')
                
                if origen and origen.get('nombre'):
                    print(f"      • Origen: {origen.get('nombre', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE ORIGEN")
                
                if destino and destino.get('nombre'):
                    print(f"      • Destino: {destino.get('nombre', 'N/A')}")
                else:
                    print(f"      • ❌ NO TIENE DESTINO")
                
            elif response.status_code == 404:
                print(f"   ❌ RUTA NO ENCONTRADA (404)")
                rutas_sin_empresa += 1
            else:
                print(f"   ⚠️  Error HTTP {response.status_code}: {response.text}")
                rutas_sin_empresa += 1
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            rutas_sin_empresa += 1
    
    print(f"\n📊 RESUMEN FINAL:")
    print("=" * 30)
    print(f"   • Total rutas verificadas: {len(rutas_ids)}")
    print(f"   • Rutas CON empresa: {rutas_con_empresa}")
    print(f"   • Rutas SIN empresa: {rutas_sin_empresa}")
    
    if rutas_con_empresa == len(rutas_ids):
        print(f"\n🎉 ¡ÉXITO TOTAL! Todas las rutas tienen información de empresa embebida")
        print(f"✅ El problema de la carga masiva está COMPLETAMENTE RESUELTO")
    elif rutas_con_empresa > 0:
        print(f"\n✅ ÉXITO PARCIAL: {rutas_con_empresa}/{len(rutas_ids)} rutas tienen empresa")
        print(f"⚠️  Algunas rutas aún no tienen empresa embebida")
    else:
        print(f"\n❌ PROBLEMA PERSISTE: Ninguna ruta tiene información de empresa")

if __name__ == "__main__":
    verificar_rutas_nuevas()