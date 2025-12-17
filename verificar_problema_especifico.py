#!/usr/bin/env python3
"""
Script para verificar el problema específico que está viendo el usuario
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def verificar_problema_especifico():
    """Verificar exactamente lo que está pasando en el frontend"""
    print("🔍 VERIFICANDO PROBLEMA ESPECÍFICO DEL FRONTEND")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    resolucion_id = "694187b1c6302fb8566ba0a0"  # R-0003-2025
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    print(f"📋 RESOLUCIÓN: R-0003-2025")
    print(f"   ID: {resolucion_id}")
    
    # 1. Verificar que la empresa tiene rutas
    print(f"\n1️⃣ VERIFICANDO RUTAS DE LA EMPRESA")
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Total rutas de la empresa: {len(rutas_empresa)}")
            
            # Contar rutas por resolución
            rutas_por_resolucion = {}
            for ruta in rutas_empresa:
                res_id = ruta.get('resolucionId')
                if res_id:
                    if res_id not in rutas_por_resolucion:
                        rutas_por_resolucion[res_id] = []
                    rutas_por_resolucion[res_id].append(ruta)
            
            print(f"   📊 Rutas por resolución:")
            for res_id, rutas in rutas_por_resolucion.items():
                print(f"      {res_id}: {len(rutas)} ruta(s)")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return False
    
    # 2. Verificar el endpoint específico que usa el frontend
    print(f"\n2️⃣ VERIFICANDO ENDPOINT ESPECÍFICO")
    endpoint_especifico = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
    print(f"   🌐 Endpoint: {endpoint_especifico}")
    
    try:
        response = requests.get(endpoint_especifico)
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"   ✅ Rutas filtradas: {len(rutas_filtradas)}")
            
            if len(rutas_filtradas) > 0:
                print(f"   📝 RUTAS ENCONTRADAS:")
                for i, ruta in enumerate(rutas_filtradas, 1):
                    codigo = ruta.get('codigoRuta', 'N/A')
                    nombre = ruta.get('nombre', 'Sin nombre')
                    print(f"      {i}. [{codigo}] {nombre}")
                return True
            else:
                print(f"   ⚠️ NO SE ENCONTRARON RUTAS (esto es el problema)")
                return False
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return False

def verificar_resolucion_info():
    """Verificar información de la resolución"""
    print(f"\n3️⃣ VERIFICANDO INFORMACIÓN DE LA RESOLUCIÓN")
    
    resolucion_id = "694187b1c6302fb8566ba0a0"
    
    try:
        response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
        
        if response.status_code == 200:
            resolucion = response.json()
            print(f"   ✅ Resolución encontrada:")
            print(f"      Número: {resolucion.get('nroResolucion', 'N/A')}")
            print(f"      Tipo Trámite: {resolucion.get('tipoTramite', 'N/A')}")
            print(f"      Tipo Resolución: {resolucion.get('tipoResolucion', 'N/A')}")
            print(f"      Empresa ID: {resolucion.get('empresaId', 'N/A')}")
            return True
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return False

def diagnosticar_problema():
    """Diagnosticar posibles causas del problema"""
    print(f"\n4️⃣ DIAGNÓSTICO DEL PROBLEMA")
    
    # Verificar si el problema está en el backend
    empresa_id = "694186fec6302fb8566ba09e"
    resolucion_id = "694187b1c6302fb8566ba0a0"
    
    print(f"   🔍 Posibles causas:")
    
    # Causa 1: Problema en el endpoint
    print(f"\n   📋 CAUSA 1: Problema en el endpoint del backend")
    try:
        response = requests.get(f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}")
        if response.status_code == 200:
            rutas = response.json()
            if len(rutas) > 0:
                print(f"      ✅ Backend funciona correctamente ({len(rutas)} rutas)")
            else:
                print(f"      ❌ Backend devuelve 0 rutas (PROBLEMA AQUÍ)")
        else:
            print(f"      ❌ Backend devuelve error {response.status_code}")
    except Exception as e:
        print(f"      ❌ Error conectando al backend: {e}")
    
    # Causa 2: Problema en el frontend
    print(f"\n   📋 CAUSA 2: Problema en el frontend")
    print(f"      🔍 Verificar en el navegador:")
    print(f"         • Console logs del método filtrarRutasPorEmpresaYResolucion")
    print(f"         • Network tab para ver las llamadas HTTP")
    print(f"         • Que el resolucionId sea el correcto")
    
    # Causa 3: IDs incorrectos
    print(f"\n   📋 CAUSA 3: IDs incorrectos")
    print(f"      🔍 Verificar que el frontend use estos IDs:")
    print(f"         • Empresa ID: {empresa_id}")
    print(f"         • Resolución ID: {resolucion_id}")
    print(f"         • NO usar IDs como 'ed6b078b...' o '824108dd...'")

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN DEL PROBLEMA ESPECÍFICO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar verificaciones
    problema_empresa = verificar_problema_especifico()
    info_resolucion = verificar_resolucion_info()
    
    # Diagnóstico
    diagnosticar_problema()
    
    # Conclusión
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    if problema_empresa and info_resolucion:
        print("✅ EL BACKEND FUNCIONA CORRECTAMENTE")
        print("❌ EL PROBLEMA ESTÁ EN EL FRONTEND")
        print(f"\n🔧 SOLUCIÓN:")
        print(f"   1. Verificar logs del navegador")
        print(f"   2. Verificar que se use el ID correcto: 694187b1c6302fb8566ba0a0")
        print(f"   3. Verificar el método filtrarRutasPorEmpresaYResolucion")
    else:
        print("❌ HAY PROBLEMAS EN EL BACKEND")
        print("🔧 Revisar los endpoints del backend primero")
    
    print(f"\n💡 PRÓXIMO PASO:")
    print(f"   Revisar los logs del navegador cuando selecciones la resolución")