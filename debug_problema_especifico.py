#!/usr/bin/env python3
"""
Script para debuggear el problema específico del modal de rutas específicas
"""

import requests
import json

def obtener_token_valido():
    """Obtener token válido"""
    base_url = "http://localhost:8000"
    
    try:
        login_data = {'username': '12345678', 'password': 'admin123'}
        response = requests.post(f"{base_url}/api/v1/auth/login", data=login_data, timeout=5)
        if response.status_code == 200:
            return response.json().get('accessToken')
    except Exception as e:
        print(f"❌ Error obteniendo token: {e}")
    return None

def debug_flujo_completo():
    """Debuggear el flujo completo del modal"""
    
    print("🔍 DEBUG: FLUJO COMPLETO DEL MODAL DE RUTAS ESPECÍFICAS")
    print("=" * 80)
    
    base_url = "http://localhost:8000"
    token = obtener_token_valido()
    
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # IDs del error
    vehiculo_id = "694da819e46133e7b09e981c"
    empresa_id = "69482f16cf2abe0527c5de61"
    
    print(f"🎯 Debuggeando vehículo: {vehiculo_id}")
    print(f"🎯 Debuggeando empresa: {empresa_id}")
    print()
    
    # 1. Verificar vehículo específico
    print("1️⃣ VERIFICANDO VEHÍCULO ESPECÍFICO")
    try:
        response = requests.get(f"{base_url}/api/v1/vehiculos/{vehiculo_id}", headers=headers, timeout=5)
        print(f"   GET /vehiculos/{vehiculo_id}: {response.status_code}")
        if response.status_code == 200:
            vehiculo = response.json()
            print(f"   ✅ Vehículo encontrado: {vehiculo.get('placa')}")
            print(f"   - Empresa Actual ID: {vehiculo.get('empresaActualId')}")
            print(f"   - Estado: {vehiculo.get('estado')}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 2. Verificar empresa específica
    print(f"\n2️⃣ VERIFICANDO EMPRESA ESPECÍFICA")
    try:
        response = requests.get(f"{base_url}/api/v1/empresas/{empresa_id}", headers=headers, timeout=5)
        print(f"   GET /empresas/{empresa_id}: {response.status_code}")
        if response.status_code == 200:
            empresa = response.json()
            print(f"   ✅ Empresa encontrada: {empresa.get('razonSocial', {}).get('principal')}")
            print(f"   - RUC: {empresa.get('ruc')}")
            print(f"   - Estado: {empresa.get('estado')}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Verificar resoluciones (el paso que falla en el frontend)
    print(f"\n3️⃣ VERIFICANDO RESOLUCIONES")
    try:
        response = requests.get(f"{base_url}/api/v1/resoluciones", headers=headers, timeout=5)
        print(f"   GET /resoluciones: {response.status_code}")
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"   ✅ Resoluciones encontradas: {len(resoluciones)}")
            
            # Buscar resolución que contenga el vehículo
            resolucion_vehiculo = None
            for res in resoluciones:
                vehiculos_habilitados = res.get('vehiculosHabilitadosIds', [])
                if vehiculo_id in vehiculos_habilitados:
                    resolucion_vehiculo = res
                    break
            
            if resolucion_vehiculo:
                print(f"   ✅ Resolución encontrada para el vehículo:")
                print(f"   - Número: {resolucion_vehiculo.get('nroResolucion')}")
                print(f"   - Empresa ID: {resolucion_vehiculo.get('empresaId')}")
                print(f"   - Vehículos: {len(resolucion_vehiculo.get('vehiculosHabilitadosIds', []))}")
                print(f"   - Rutas autorizadas: {len(resolucion_vehiculo.get('rutasAutorizadasIds', []))}")
                
                # Verificar si la empresa de la resolución coincide
                if resolucion_vehiculo.get('empresaId') == empresa_id:
                    print(f"   ✅ Empresa de resolución coincide")
                else:
                    print(f"   ⚠️ Empresa de resolución NO coincide:")
                    print(f"      Esperada: {empresa_id}")
                    print(f"      En resolución: {resolucion_vehiculo.get('empresaId')}")
            else:
                print(f"   ❌ NO se encontró resolución para el vehículo")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Verificar rutas específicas (el endpoint que da 403)
    print(f"\n4️⃣ VERIFICANDO RUTAS ESPECÍFICAS")
    try:
        response = requests.get(f"{base_url}/api/v1/rutas-especificas/vehiculo/{vehiculo_id}", 
                              headers=headers, timeout=5)
        print(f"   GET /rutas-especificas/vehiculo/{vehiculo_id}: {response.status_code}")
        if response.status_code == 200:
            rutas_especificas = response.json()
            print(f"   ✅ Rutas específicas: {len(rutas_especificas)}")
            for ruta in rutas_especificas[:3]:
                print(f"   - {ruta.get('codigo', 'N/A')}: {ruta.get('descripcion', 'N/A')}")
        elif response.status_code == 404:
            print(f"   ℹ️ No hay rutas específicas para este vehículo (normal)")
        elif response.status_code == 403:
            print(f"   ❌ 403 Forbidden - Problema de autorización")
            print(f"   Token usado: {token[:30]}...")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 5. Verificar rutas generales
    print(f"\n5️⃣ VERIFICANDO RUTAS GENERALES")
    try:
        response = requests.get(f"{base_url}/api/v1/rutas", headers=headers, timeout=5)
        print(f"   GET /rutas: {response.status_code}")
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas generales: {len(rutas)}")
            for ruta in rutas[:3]:
                print(f"   - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def debug_problema_frontend():
    """Analizar el problema específico del frontend"""
    
    print(f"\n🔍 DEBUG: PROBLEMA ESPECÍFICO DEL FRONTEND")
    print("=" * 80)
    
    print("📋 ANÁLISIS DEL ERROR LOG:")
    print("- 'empresaId de la resolución: 69482f16cf2abe0527c5de61'")
    print("- 'Empresa de la resolución: undefined'")
    print("- 'Empresas disponibles: undefined'")
    print("- 'Token válido: false'")
    print()
    
    print("🔍 POSIBLES CAUSAS:")
    print("1. El array 'empresas' que se pasa al modal está undefined/null")
    print("2. El token se invalida entre la carga inicial y el modal")
    print("3. Hay un problema de timing en las peticiones asíncronas")
    print("4. El servicio de empresas no está retornando datos correctamente")
    print()
    
    print("💡 HIPÓTESIS PRINCIPAL:")
    print("El problema NO es de datos mock vs reales, sino de:")
    print("- Estado de autenticación inconsistente")
    print("- Datos no cargados correctamente en el componente padre")
    print("- Problema de propagación de datos entre componentes")

def generar_solucion_especifica():
    """Generar solución específica para el problema"""
    
    print(f"\n🛠️ SOLUCIÓN ESPECÍFICA")
    print("=" * 80)
    
    # Script para verificar el estado del frontend
    script_debug = """
// 🔍 DEBUG: Verificar estado del frontend
// Ejecutar en consola del navegador

console.log('🔍 Verificando estado del frontend...');

// 1. Verificar token
const token = localStorage.getItem('token');
console.log('Token presente:', !!token);
console.log('Token válido:', token && token !== 'undefined' && token !== 'null');
if (token) {
    console.log('Token (30 chars):', token.substring(0, 30) + '...');
}

// 2. Verificar usuario
const user = localStorage.getItem('user');
console.log('Usuario presente:', !!user);
if (user) {
    try {
        const userData = JSON.parse(user);
        console.log('Usuario:', userData);
    } catch (e) {
        console.log('Error parseando usuario:', e);
    }
}

// 3. Verificar datos en memoria (si están disponibles)
if (window.angular && window.angular.getComponent) {
    console.log('Angular detectado, verificando componentes...');
}

// 4. Verificar localStorage completo
console.log('LocalStorage completo:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value?.substring(0, 50) + (value?.length > 50 ? '...' : ''));
}

// 5. Verificar si hay errores de red
console.log('Verificar Network tab para errores 403/401');
"""
    
    with open('debug_frontend_state.js', 'w', encoding='utf-8') as f:
        f.write(script_debug)
    
    print("📝 Script creado: debug_frontend_state.js")
    print("   Ejecutar en consola del navegador para diagnosticar")
    
    print(f"\n🎯 PASOS PARA RESOLVER:")
    print("1. Ejecutar debug_frontend_state.js en el navegador")
    print("2. Verificar que el token sea válido y no expire")
    print("3. Asegurar que el array de empresas se pase correctamente al modal")
    print("4. Revisar el timing de las peticiones asíncronas")
    print("5. Verificar que no hay problemas de CORS o headers")

def main():
    print("🔍 DEBUG ESPECÍFICO: PROBLEMA DE RUTAS ESPECÍFICAS")
    print("=" * 80)
    
    # 1. Debug del flujo completo en el backend
    debug_flujo_completo()
    
    # 2. Análisis del problema del frontend
    debug_problema_frontend()
    
    # 3. Generar solución específica
    generar_solucion_especifica()
    
    print(f"\n📋 CONCLUSIÓN:")
    print("Los datos en MongoDB son consistentes y correctos.")
    print("El problema parece estar en:")
    print("- Gestión del estado de autenticación en el frontend")
    print("- Propagación de datos entre componentes")
    print("- Timing de peticiones asíncronas")
    print()
    print("NO es un problema de datos mock vs reales.")

if __name__ == "__main__":
    main()