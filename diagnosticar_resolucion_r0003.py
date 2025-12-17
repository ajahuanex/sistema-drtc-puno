#!/usr/bin/env python3
"""
Script para diagnosticar específicamente la resolución R-0003-2025 que aparece en la imagen
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def diagnosticar_resolucion_r0003():
    """Diagnosticar la resolución R-0003-2025"""
    print("🔍 DIAGNOSTICANDO RESOLUCIÓN R-0003-2025")
    print("=" * 60)
    
    try:
        # Empresa de la imagen
        empresa_id = "693226268a29266aa49f5ebd"  # Paputec según la imagen
        
        print(f"\n1️⃣ EMPRESA DE LA IMAGEN:")
        print(f"   Empresa: Paputec (según imagen)")
        print(f"   ID: {empresa_id}")
        
        # 1. Obtener todas las resoluciones de la empresa
        print(f"\n2️⃣ OBTENIENDO RESOLUCIONES DE LA EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        
        if response.status_code != 200:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        resoluciones_data = response.json()
        resoluciones = resoluciones_data.get('resoluciones', [])
        print(f"   ✅ Total resoluciones: {len(resoluciones)}")
        
        # Buscar la resolución R-0003-2025
        resolucion_r0003 = None
        for res in resoluciones:
            numero = res.get('nroResolucion', '')
            print(f"      - {numero} (ID: {res.get('id', 'N/A')})")
            if numero == 'R-0003-2025':
                resolucion_r0003 = res
                print(f"        ✅ ENCONTRADA: R-0003-2025")
        
        if not resolucion_r0003:
            print(f"\n   ❌ RESOLUCIÓN R-0003-2025 NO ENCONTRADA")
            print(f"   Las resoluciones disponibles son las listadas arriba")
            return False
        
        resolucion_id = resolucion_r0003.get('id')
        print(f"\n3️⃣ RESOLUCIÓN R-0003-2025 ENCONTRADA:")
        print(f"   ID: {resolucion_id}")
        print(f"   Número: {resolucion_r0003.get('nroResolucion')}")
        print(f"   Tipo Trámite: {resolucion_r0003.get('tipoTramite')}")
        print(f"   Tipo Resolución: {resolucion_r0003.get('tipoResolucion')}")
        print(f"   Estado: {resolucion_r0003.get('estado')}")
        
        # 2. Obtener todas las rutas de la empresa
        print(f"\n4️⃣ OBTENIENDO RUTAS DE LA EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code != 200:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        rutas_empresa = response.json()
        print(f"   ✅ Total rutas de empresa: {len(rutas_empresa)}")
        
        # Verificar si alguna ruta tiene esta resolución
        rutas_con_r0003 = []
        for ruta in rutas_empresa:
            ruta_resolucion_id = ruta.get('resolucionId')
            if ruta_resolucion_id == resolucion_id:
                rutas_con_r0003.append(ruta)
        
        print(f"\n5️⃣ RUTAS CON RESOLUCIÓN R-0003-2025:")
        print(f"   Rutas encontradas: {len(rutas_con_r0003)}")
        
        if rutas_con_r0003:
            for i, ruta in enumerate(rutas_con_r0003, 1):
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      {i}. [{codigo}] {nombre}")
        else:
            print(f"   ❌ NO HAY RUTAS CON ESTA RESOLUCIÓN")
            
            # Mostrar qué resoluciones SÍ tienen rutas
            print(f"\n   📊 RESOLUCIONES QUE SÍ TIENEN RUTAS:")
            resoluciones_con_rutas = {}
            for ruta in rutas_empresa:
                res_id = ruta.get('resolucionId')
                if res_id:
                    if res_id not in resoluciones_con_rutas:
                        resoluciones_con_rutas[res_id] = []
                    resoluciones_con_rutas[res_id].append(ruta)
            
            for res_id, rutas_list in resoluciones_con_rutas.items():
                # Buscar el número de resolución
                numero_res = "Desconocida"
                for res in resoluciones:
                    if res.get('id') == res_id:
                        numero_res = res.get('nroResolucion', 'Sin número')
                        break
                
                print(f"      - {numero_res} (ID: {res_id[:8]}...): {len(rutas_list)} ruta(s)")
        
        # 3. Probar endpoint específico
        print(f"\n6️⃣ PROBANDO ENDPOINT ESPECÍFICO...")
        endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        print(f"   URL: {endpoint_url}")
        
        response = requests.get(endpoint_url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"   ✅ Rutas del endpoint: {len(rutas_filtradas)}")
            
            for ruta in rutas_filtradas:
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      - [{codigo}] {nombre}")
        else:
            print(f"   ❌ Error: {response.text}")
        
        return len(rutas_con_r0003) > 0
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def verificar_datos_imagen():
    """Verificar los datos específicos que aparecen en la imagen"""
    print(f"\n" + "=" * 60)
    print("🖼️ VERIFICANDO DATOS DE LA IMAGEN")
    print("=" * 60)
    
    print(f"\nDatos observados en la imagen:")
    print(f"   - Empresa: 23232323232 - Paputec")
    print(f"   - Resolución seleccionada: R-0003-2025 RENOVACION - PADRE")
    print(f"   - Resultado: 0 rutas encontradas")
    print(f"   - Mensaje: 'No hay rutas para esta empresa'")
    
    print(f"\nPosibles causas:")
    print(f"   1. La resolución R-0003-2025 no tiene rutas asociadas")
    print(f"   2. Error en el ID de la resolución")
    print(f"   3. Problema en el endpoint del backend")
    print(f"   4. Error en el servicio del frontend")
    print(f"   5. Datos de prueba inconsistentes")

if __name__ == "__main__":
    print("🚀 INICIANDO DIAGNÓSTICO DE RESOLUCIÓN R-0003-2025")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    resultado = diagnosticar_resolucion_r0003()
    verificar_datos_imagen()
    
    print(f"\n" + "=" * 60)
    print("🏁 CONCLUSIÓN")
    print("=" * 60)
    
    if resultado:
        print("✅ LA RESOLUCIÓN R-0003-2025 SÍ TIENE RUTAS")
        print("❓ EL PROBLEMA ESTÁ EN EL FRONTEND O SERVICIO")
    else:
        print("❌ LA RESOLUCIÓN R-0003-2025 NO TIENE RUTAS")
        print("✅ EL COMPORTAMIENTO ES CORRECTO")
    
    print(f"\n🔧 PRÓXIMOS PASOS:")
    print(f"   1. Verificar si la resolución debería tener rutas")
    print(f"   2. Revisar la lógica del frontend")
    print(f"   3. Comprobar el servicio de rutas")
    print(f"   4. Verificar datos de prueba")