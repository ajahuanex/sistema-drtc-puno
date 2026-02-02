#!/usr/bin/env python3
"""
Script para verificar las resoluciones del Excel
"""
import requests
import json

def verificar_resoluciones_via_api():
    """Verificar resoluciones usando la API del backend"""
    
    print("🔍 VERIFICANDO RESOLUCIONES DEL EXCEL VÍA API")
    print("=" * 50)
    
    # Resoluciones que se ven en la imagen del Excel
    resoluciones_excel = [
        "0921-2023",
        "0495-2022", 
        "0290-2023",
        "0685-2021"
    ]
    
    print(f"📋 Resoluciones a verificar (de la imagen):")
    for res in resoluciones_excel:
        print(f"   • {res}")
    
    # URL base de la API
    base_url = "http://localhost:8000/api/v1"
    
    print(f"\n🔍 Verificando resoluciones vía API...")
    
    # Primero obtener todas las resoluciones para ver qué formato tienen
    try:
        url = f"{base_url}/resoluciones/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            todas_resoluciones = response.json()
            print(f"   ✅ Se encontraron {len(todas_resoluciones)} resoluciones en el sistema")
            
            # Mostrar algunas resoluciones de ejemplo
            print(f"\n📋 Primeras 10 resoluciones en el sistema:")
            for i, res in enumerate(todas_resoluciones[:10], 1):
                numero = res.get('nroResolucion', 'Sin número')
                tipo = res.get('tipoResolucion', 'Sin tipo')
                estado = res.get('estado', 'Sin estado')
                activa = res.get('estaActivo', False)
                
                estado_str = "✅" if activa else "❌"
                tipo_str = "🔵 PADRE" if tipo == "PADRE" else "🔸 HIJO"
                estado_res = "🟢 VIGENTE" if estado == "VIGENTE" else f"🔴 {estado}"
                
                print(f"   {i:2d}. {numero} ({tipo_str}) ({estado_res}) ({estado_str})")
            
            # Ahora verificar cada resolución del Excel
            print(f"\n🔍 VERIFICANDO RESOLUCIONES ESPECÍFICAS DEL EXCEL:")
            print("-" * 55)
            
            for res_excel in resoluciones_excel:
                print(f"\n🔍 Buscando resolución: {res_excel}")
                
                # Normalizar la resolución (agregar R- si no lo tiene)
                res_normalizada = res_excel
                if not res_excel.startswith('R-'):
                    # Convertir 0921-2023 a R-0921-2023
                    res_normalizada = f"R-{res_excel}"
                
                print(f"   📝 Resolución normalizada: {res_normalizada}")
                
                # Buscar en la lista de resoluciones
                encontrada = None
                for res in todas_resoluciones:
                    if res.get('nroResolucion') == res_normalizada or res.get('nroResolucion') == res_excel:
                        encontrada = res
                        break
                
                if encontrada:
                    print(f"   ✅ RESOLUCIÓN ENCONTRADA")
                    print(f"      • ID: {encontrada.get('id', 'N/A')}")
                    print(f"      • Número: {encontrada.get('nroResolucion', 'N/A')}")
                    print(f"      • Tipo: {encontrada.get('tipoResolucion', 'N/A')}")
                    print(f"      • Estado: {encontrada.get('estado', 'N/A')}")
                    print(f"      • Activa: {encontrada.get('estaActivo', 'N/A')}")
                    
                    # Verificar si es PADRE y VIGENTE
                    es_padre = encontrada.get('tipoResolucion') == 'PADRE'
                    es_vigente = encontrada.get('estado') == 'VIGENTE'
                    esta_activa = encontrada.get('estaActivo', False)
                    
                    if es_padre and es_vigente and esta_activa:
                        print(f"      ✅ VÁLIDA PARA CARGA MASIVA (PADRE + VIGENTE + ACTIVA)")
                    else:
                        print(f"      ❌ NO VÁLIDA PARA CARGA MASIVA:")
                        if not es_padre:
                            print(f"         • No es PADRE (es {encontrada.get('tipoResolucion')})")
                        if not es_vigente:
                            print(f"         • No está VIGENTE (está {encontrada.get('estado')})")
                        if not esta_activa:
                            print(f"         • No está activa")
                else:
                    print(f"   ❌ RESOLUCIÓN NO ENCONTRADA")
                    
                    # Buscar resoluciones similares
                    similares = []
                    for res in todas_resoluciones:
                        numero = res.get('nroResolucion', '')
                        if res_excel in numero or res_normalizada in numero:
                            similares.append(res)
                    
                    if similares:
                        print(f"      🔍 Resoluciones similares encontradas:")
                        for sim in similares[:3]:
                            numero = sim.get('nroResolucion', 'Sin número')
                            tipo = sim.get('tipoResolucion', 'Sin tipo')
                            estado = sim.get('estado', 'Sin estado')
                            print(f"         • {numero} ({tipo}) ({estado})")
                    else:
                        print(f"      • No se encontraron resoluciones similares")
            
            # Resumen
            print(f"\n📊 RESUMEN:")
            print("=" * 20)
            
            resoluciones_validas = []
            resoluciones_invalidas = []
            
            for res_excel in resoluciones_excel:
                res_normalizada = f"R-{res_excel}" if not res_excel.startswith('R-') else res_excel
                
                encontrada = None
                for res in todas_resoluciones:
                    if res.get('nroResolucion') == res_normalizada or res.get('nroResolucion') == res_excel:
                        encontrada = res
                        break
                
                if encontrada:
                    es_padre = encontrada.get('tipoResolucion') == 'PADRE'
                    es_vigente = encontrada.get('estado') == 'VIGENTE'
                    esta_activa = encontrada.get('estaActivo', False)
                    
                    if es_padre and es_vigente and esta_activa:
                        resoluciones_validas.append(res_excel)
                    else:
                        resoluciones_invalidas.append(res_excel)
                else:
                    resoluciones_invalidas.append(res_excel)
            
            print(f"   • Resoluciones válidas: {len(resoluciones_validas)}")
            print(f"   • Resoluciones inválidas: {len(resoluciones_invalidas)}")
            
            if resoluciones_validas:
                print(f"\n✅ RESOLUCIONES VÁLIDAS:")
                for res in resoluciones_validas:
                    print(f"   • {res}")
            
            if resoluciones_invalidas:
                print(f"\n❌ RESOLUCIONES INVÁLIDAS:")
                for res in resoluciones_invalidas:
                    print(f"   • {res}")
        
        else:
            print(f"   ❌ Error obteniendo resoluciones: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    verificar_resoluciones_via_api()