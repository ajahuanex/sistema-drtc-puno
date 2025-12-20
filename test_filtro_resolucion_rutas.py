#!/usr/bin/env python3
"""
Script para probar el filtro de resolución en el módulo de rutas
"""

import requests
import json

def test_filtro_resolucion_rutas():
    """Probar el filtro de resolución en el módulo de rutas"""
    
    print("🧪 PROBANDO FILTRO DE RESOLUCIÓN EN MÓDULO DE RUTAS")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # IDs conocidos del sistema
    empresa_id = "694186fec6302fb8566ba09e"
    resolucion_id = "694187b1c6302fb8566ba0a0"  # R-0003-2025
    
    print(f"📊 DATOS DE PRUEBA:")
    print(f"   Empresa ID: {empresa_id}")
    print(f"   Resolución ID: {resolucion_id}")
    print()
    
    # 1. Verificar que la empresa existe
    print("1️⃣ VERIFICANDO EMPRESA...")
    try:
        response = requests.get(f"{base_url}/empresas/{empresa_id}")
        if response.status_code == 200:
            empresa = response.json()
            print(f"   ✅ Empresa encontrada: {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
            print(f"   📋 RUC: {empresa.get('ruc', 'Sin RUC')}")
        else:
            print(f"   ❌ Error al obtener empresa: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return
    
    print()
    
    # 2. Verificar que la resolución existe
    print("2️⃣ VERIFICANDO RESOLUCIÓN...")
    try:
        response = requests.get(f"{base_url}/resoluciones/{resolucion_id}")
        if response.status_code == 200:
            resolucion = response.json()
            print(f"   ✅ Resolución encontrada: {resolucion.get('nroResolucion', 'Sin número')}")
            print(f"   📋 Tipo: {resolucion.get('tipoTramite', 'Sin tipo')}")
            print(f"   🏢 Empresa ID: {resolucion.get('empresaId', 'Sin empresa')}")
        else:
            print(f"   ❌ Error al obtener resolución: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return
    
    print()
    
    # 3. Probar el endpoint de rutas por empresa y resolución
    print("3️⃣ PROBANDO FILTRO DE RUTAS POR EMPRESA Y RESOLUCIÓN...")
    try:
        url = f"{base_url}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        print(f"   🌐 URL: {url}")
        
        response = requests.get(url)
        print(f"   📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas encontradas: {len(rutas)}")
            
            if len(rutas) > 0:
                print(f"   📊 DETALLES DE LAS RUTAS:")
                for i, ruta in enumerate(rutas[:3], 1):  # Mostrar solo las primeras 3
                    print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                    print(f"         Origen: {ruta.get('origen', 'Sin origen')} → Destino: {ruta.get('destino', 'Sin destino')}")
                    print(f"         Empresa ID: {ruta.get('empresaId', 'Sin empresa')}")
                    print(f"         Resolución ID: {ruta.get('resolucionId', 'Sin resolución')}")
                
                if len(rutas) > 3:
                    print(f"      ... y {len(rutas) - 3} ruta(s) más")
                
                # Verificar que todas las rutas pertenecen a la empresa y resolución correctas
                rutas_correctas = 0
                for ruta in rutas:
                    if ruta.get('empresaId') == empresa_id and ruta.get('resolucionId') == resolucion_id:
                        rutas_correctas += 1
                
                print(f"   🎯 VERIFICACIÓN:")
                print(f"      Rutas con empresa correcta: {sum(1 for r in rutas if r.get('empresaId') == empresa_id)}/{len(rutas)}")
                print(f"      Rutas con resolución correcta: {sum(1 for r in rutas if r.get('resolucionId') == resolucion_id)}/{len(rutas)}")
                print(f"      Rutas completamente correctas: {rutas_correctas}/{len(rutas)}")
                
                if rutas_correctas == len(rutas):
                    print(f"   ✅ FILTRO FUNCIONANDO CORRECTAMENTE")
                else:
                    print(f"   ⚠️ ALGUNAS RUTAS NO COINCIDEN CON LOS FILTROS")
            else:
                print(f"   ⚠️ NO SE ENCONTRARON RUTAS PARA ESTA COMBINACIÓN")
                print(f"   💡 Esto podría indicar:")
                print(f"      - No hay rutas asignadas a esta resolución")
                print(f"      - Los IDs no coinciden en la base de datos")
                print(f"      - Problema en el endpoint del backend")
        else:
            print(f"   ❌ Error en el endpoint: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   📋 Detalle del error: {error_detail}")
            except:
                print(f"   📋 Respuesta: {response.text}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    print()
    
    # 4. Probar endpoint alternativo de rutas por resolución
    print("4️⃣ PROBANDO ENDPOINT ALTERNATIVO - RUTAS POR RESOLUCIÓN...")
    try:
        url = f"{base_url}/rutas/resolucion/{resolucion_id}"
        print(f"   🌐 URL: {url}")
        
        response = requests.get(url)
        print(f"   📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas encontradas: {len(rutas)}")
            
            if len(rutas) > 0:
                print(f"   📊 PRIMERAS RUTAS:")
                for i, ruta in enumerate(rutas[:2], 1):
                    print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                
                # Verificar que las rutas pertenecen a la resolución
                rutas_correctas = sum(1 for r in rutas if r.get('resolucionId') == resolucion_id)
                print(f"   🎯 Rutas con resolución correcta: {rutas_correctas}/{len(rutas)}")
        else:
            print(f"   ❌ Error en el endpoint: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    print()
    
    # 5. Verificar resoluciones de la empresa
    print("5️⃣ VERIFICANDO RESOLUCIONES DE LA EMPRESA...")
    try:
        url = f"{base_url}/empresas/{empresa_id}/resoluciones"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   ✅ Resoluciones de la empresa: {len(resoluciones)}")
            
            # Buscar la resolución específica
            resolucion_encontrada = None
            for res in resoluciones:
                if res.get('id') == resolucion_id:
                    resolucion_encontrada = res
                    break
            
            if resolucion_encontrada:
                print(f"   ✅ Resolución {resolucion_id} encontrada en la empresa")
                print(f"      Número: {resolucion_encontrada.get('nroResolucion', 'Sin número')}")
                print(f"      Tipo: {resolucion_encontrada.get('tipoTramite', 'Sin tipo')}")
            else:
                print(f"   ❌ Resolución {resolucion_id} NO encontrada en la empresa")
                print(f"   📋 Resoluciones disponibles:")
                for res in resoluciones[:3]:
                    print(f"      - {res.get('id', 'Sin ID')}: {res.get('nroResolucion', 'Sin número')}")
        else:
            print(f"   ❌ Error al obtener resoluciones de empresa: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    print()
    print("🏁 PRUEBA COMPLETADA")
    print("=" * 60)

if __name__ == "__main__":
    test_filtro_resolucion_rutas()