#!/usr/bin/env python3
"""
Script para diagnosticar por qué el modal no carga las rutas y se queda en "Cargando rutas disponibles..."
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def get_fresh_token():
    """Obtener token fresco"""
    form_data = {
        'username': '12345678',
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=form_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        return None
    except:
        return None

def diagnosticar_secuencia_modal(token):
    """Diagnosticar la secuencia exacta que ejecuta el modal"""
    
    print("🔍 DIAGNOSTICANDO SECUENCIA DEL MODAL")
    print("=" * 60)
    
    if not token:
        print("❌ No hay token para diagnosticar")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Simular la secuencia exacta del modal paso a paso
    vehiculo_id = "694da819e46133e7b09e981c"  # ID del vehículo del modal
    
    print(f"🚗 Vehículo ID: {vehiculo_id}")
    
    # Paso 1: El modal llama a cargarDatos()
    print(f"\n📋 Paso 1: Modal ejecuta cargarDatos()...")
    
    # Paso 2: Obtener resoluciones
    print(f"📋 Paso 2: Obteniendo resoluciones...")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=30)
        elapsed = time.time() - start_time
        
        print(f"  ⏱️ Tiempo: {elapsed:.2f}s")
        print(f"  📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"  ✅ Resoluciones obtenidas: {len(resoluciones)}")
            
            # Buscar resolución asociada al vehículo
            resolucion_asociada = None
            for resolucion in resoluciones:
                vehiculos_habilitados = resolucion.get('vehiculosHabilitadosIds', [])
                if vehiculo_id in vehiculos_habilitados:
                    resolucion_asociada = resolucion
                    break
            
            if resolucion_asociada:
                print(f"  ✅ Resolución asociada encontrada: {resolucion_asociada.get('nroResolucion')}")
                print(f"  📋 Empresa ID: {resolucion_asociada.get('empresaId')}")
                print(f"  📋 Rutas autorizadas: {len(resolucion_asociada.get('rutasAutorizadasIds', []))}")
            else:
                print(f"  ⚠️ No se encontró resolución asociada al vehículo")
                
        elif response.status_code == 401:
            print(f"  ❌ Error 401 en resoluciones")
            return False
        else:
            print(f"  ❌ Error obteniendo resoluciones: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Excepción obteniendo resoluciones: {e}")
        return False
    
    # Paso 3: Cargar rutas disponibles
    print(f"\n📋 Paso 3: Cargando rutas disponibles...")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=30)
        elapsed = time.time() - start_time
        
        print(f"  ⏱️ Tiempo: {elapsed:.2f}s")
        print(f"  📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            todas_rutas = response.json()
            print(f"  ✅ Todas las rutas obtenidas: {len(todas_rutas)}")
            
            # Filtrar rutas activas
            rutas_activas = [r for r in todas_rutas if r.get('estaActivo', False)]
            print(f"  ✅ Rutas activas: {len(rutas_activas)}")
            
            if resolucion_asociada and resolucion_asociada.get('rutasAutorizadasIds'):
                rutas_autorizadas = [r for r in rutas_activas if r.get('id') in resolucion_asociada.get('rutasAutorizadasIds', [])]
                print(f"  ✅ Rutas autorizadas para la resolución: {len(rutas_autorizadas)}")
            else:
                print(f"  ⚠️ Sin resolución asociada, mostrando todas las rutas activas")
                rutas_autorizadas = rutas_activas
                
        elif response.status_code == 401:
            print(f"  ❌ Error 401 en rutas")
            return False
        else:
            print(f"  ❌ Error obteniendo rutas: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Excepción obteniendo rutas: {e}")
        return False
    
    # Paso 4: Obtener rutas específicas ya asignadas
    print(f"\n📋 Paso 4: Obteniendo rutas específicas ya asignadas...")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/rutas-especificas/vehiculo/{vehiculo_id}", headers=headers, timeout=30)
        elapsed = time.time() - start_time
        
        print(f"  ⏱️ Tiempo: {elapsed:.2f}s")
        print(f"  📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas_especificas = response.json()
            print(f"  ✅ Rutas específicas ya asignadas: {len(rutas_especificas)}")
            
            if rutas_especificas:
                for re in rutas_especificas:
                    print(f"    - {re.get('codigo', 'N/A')}: {re.get('descripcion', 'N/A')}")
            else:
                print(f"    (No hay rutas específicas asignadas)")
                
        elif response.status_code == 401:
            print(f"  ❌ Error 401 en rutas específicas")
            return False
        else:
            print(f"  ⚠️ Status rutas específicas: {response.status_code}")
            print(f"  📋 Respuesta: {response.text}")
            
    except Exception as e:
        print(f"  ❌ Excepción obteniendo rutas específicas: {e}")
        return False
    
    # Paso 5: Verificar empresa
    if resolucion_asociada and resolucion_asociada.get('empresaId'):
        print(f"\n📋 Paso 5: Verificando empresa...")
        try:
            empresa_id = resolucion_asociada.get('empresaId')
            start_time = time.time()
            response = requests.get(f"{BASE_URL}/empresas/{empresa_id}", headers=headers, timeout=30)
            elapsed = time.time() - start_time
            
            print(f"  ⏱️ Tiempo: {elapsed:.2f}s")
            print(f"  📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                empresa = response.json()
                print(f"  ✅ Empresa obtenida: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
            else:
                print(f"  ⚠️ Error obteniendo empresa: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Excepción obteniendo empresa: {e}")
    
    return True

def probar_timeouts():
    """Probar si hay problemas de timeout"""
    
    print(f"\n🕐 PROBANDO TIMEOUTS")
    print("=" * 60)
    
    token = get_fresh_token()
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    endpoints = [
        ("/resoluciones", "Resoluciones"),
        ("/rutas", "Rutas"),
        ("/empresas", "Empresas"),
        (f"/rutas-especificas/vehiculo/694da819e46133e7b09e981c", "Rutas específicas")
    ]
    
    for endpoint, nombre in endpoints:
        print(f"\n🧪 Probando {nombre}...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            elapsed = time.time() - start_time
            
            print(f"  ⏱️ Tiempo: {elapsed:.2f}s")
            print(f"  📊 Status: {response.status_code}")
            
            if elapsed > 3:
                print(f"  ⚠️ LENTO: Más de 3 segundos")
            elif elapsed > 1:
                print(f"  ⚠️ Moderado: Más de 1 segundo")
            else:
                print(f"  ✅ Rápido: Menos de 1 segundo")
                
        except requests.exceptions.Timeout:
            print(f"  ❌ TIMEOUT: Más de 5 segundos")
        except Exception as e:
            print(f"  ❌ Error: {e}")

def generar_solucion_carga_lenta():
    """Generar solución para el problema de carga lenta"""
    
    print(f"\n🔧 SOLUCIÓN PARA CARGA LENTA DEL MODAL")
    print("=" * 60)
    
    script = '''
// SOLUCIÓN PARA MODAL QUE SE QUEDA CARGANDO
// Ejecutar en la consola del navegador (F12)

console.log('🔧 Solucionando modal que se queda cargando...');

// 1. Verificar token actual
const currentToken = localStorage.getItem('token');
console.log('🔑 Token actual:', currentToken ? currentToken.substring(0, 30) + '...' : 'null');

if (!currentToken || currentToken.includes('mock')) {
    console.log('🚨 Token problemático detectado');
    
    // Limpiar y obtener token fresco
    localStorage.clear();
    sessionStorage.clear();
    
    fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'username=12345678&password=admin123&grant_type=password'
    })
    .then(r => r.json())
    .then(data => {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
            id: data.user?.id || '1',
            dni: '12345678',
            nombres: data.user?.nombres || 'Administrador',
            apellidos: data.user?.apellidos || 'del Sistema',
            email: data.user?.email || 'admin@sirret.gob.pe',
            rolId: data.user?.rolId || 'administrador',
            estaActivo: true,
            fechaCreacion: data.user?.fechaCreacion || new Date().toISOString()
        }));
        
        console.log('✅ Token fresco configurado');
        console.log('🔄 Recarga la página y prueba el modal nuevamente');
    });
} else {
    console.log('✅ Token parece correcto');
    
    // Probar endpoints manualmente
    const testEndpoints = async () => {
        const headers = {'Authorization': 'Bearer ' + currentToken};
        
        console.log('🧪 Probando endpoints...');
        
        try {
            // Test resoluciones
            const resResponse = await fetch('http://localhost:8000/api/v1/resoluciones', {headers});
            console.log('📋 Resoluciones:', resResponse.status);
            
            // Test rutas
            const rutasResponse = await fetch('http://localhost:8000/api/v1/rutas', {headers});
            console.log('🛣️ Rutas:', rutasResponse.status);
            
            // Test rutas específicas
            const reResponse = await fetch('http://localhost:8000/api/v1/rutas-especificas/vehiculo/694da819e46133e7b09e981c', {headers});
            console.log('🎯 Rutas específicas:', reResponse.status);
            
            if (resResponse.status === 200 && rutasResponse.status === 200) {
                console.log('✅ Todos los endpoints funcionan');
                console.log('💡 El problema puede ser en el frontend');
                console.log('🔄 Intenta cerrar y abrir el modal nuevamente');
            } else {
                console.log('❌ Algunos endpoints fallan');
                console.log('🔄 Recarga la página y prueba nuevamente');
            }
            
        } catch (error) {
            console.error('❌ Error probando endpoints:', error);
        }
    };
    
    testEndpoints();
}

// Función para forzar recarga del modal
window.recargarModal = function() {
    console.log('🔄 Forzando recarga del modal...');
    // Cerrar modal actual si está abierto
    const closeButtons = document.querySelectorAll('[mat-dialog-close], .close-button');
    closeButtons.forEach(btn => btn.click());
    
    setTimeout(() => {
        console.log('💡 Abre el modal nuevamente desde la interfaz');
    }, 1000);
};

console.log('🛠️ Función disponible: recargarModal()');
'''
    
    print("📋 SCRIPT PARA EL NAVEGADOR:")
    print(script)

def main():
    print("🚀 DIAGNÓSTICO: MODAL SE QUEDA CARGANDO")
    print("🎯 Identificando por qué no carga las rutas")
    print("=" * 70)
    
    # Obtener token
    token = get_fresh_token()
    
    if not token:
        print("❌ No se pudo obtener token para diagnóstico")
        return
    
    print(f"✅ Token obtenido para diagnóstico")
    
    # Diagnosticar secuencia del modal
    success = diagnosticar_secuencia_modal(token)
    
    # Probar timeouts
    probar_timeouts()
    
    # Generar solución
    generar_solucion_carga_lenta()
    
    print(f"\n" + "=" * 70)
    print("📊 DIAGNÓSTICO COMPLETADO")
    
    if success:
        print("✅ Los endpoints del backend funcionan correctamente")
        print("⚠️ El problema puede estar en el frontend:")
        print("  - Token corrupto en el navegador")
        print("  - Timeout en las peticiones del frontend")
        print("  - Error en el componente Angular")
    else:
        print("❌ Hay problemas con los endpoints del backend")
    
    print(f"\n🔧 SOLUCIÓN RECOMENDADA:")
    print("1. Ejecutar el script en la consola del navegador")
    print("2. Verificar que los endpoints respondan rápido")
    print("3. Cerrar y abrir el modal nuevamente")
    print("4. Si persiste, recargar la página completa")

if __name__ == "__main__":
    main()