#!/usr/bin/env python3
"""
Script para analizar la consistencia entre datos mock y datos reales de MongoDB
"""

import requests
import json
from datetime import datetime

def obtener_token_valido():
    """Obtener token válido para consultas autenticadas"""
    base_url = "http://localhost:8000"
    
    try:
        login_data = {
            'username': '12345678',
            'password': 'admin123'
        }
        
        response = requests.post(f"{base_url}/api/v1/auth/login", data=login_data, timeout=5)
        if response.status_code == 200:
            login_response = response.json()
            token = login_response.get('accessToken') or login_response.get('access_token')
            return token
    except Exception as e:
        print(f"❌ Error obteniendo token: {e}")
    
    return None

def analizar_datos_reales():
    """Analizar los datos reales en MongoDB"""
    
    print("🔍 ANALIZANDO DATOS REALES EN MONGODB")
    print("=" * 70)
    
    base_url = "http://localhost:8000"
    token = obtener_token_valido()
    
    if not token:
        print("❌ No se pudo obtener token válido")
        return {}
    
    headers = {'Authorization': f'Bearer {token}'}
    datos_reales = {}
    
    # 1. Analizar empresas
    try:
        response = requests.get(f"{base_url}/api/v1/empresas", timeout=5)
        if response.status_code == 200:
            empresas = response.json()
            datos_reales['empresas'] = empresas
            print(f"📊 EMPRESAS: {len(empresas)} encontradas")
            for emp in empresas:
                print(f"   - ID: {emp.get('id', 'N/A')}")
                print(f"     RUC: {emp.get('ruc', 'N/A')}")
                print(f"     Razón Social: {emp.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"     Estado: {emp.get('estado', 'N/A')}")
                print()
    except Exception as e:
        print(f"❌ Error consultando empresas: {e}")
    
    # 2. Analizar vehículos
    try:
        response = requests.get(f"{base_url}/api/v1/vehiculos", headers=headers, timeout=5)
        if response.status_code == 200:
            vehiculos = response.json()
            datos_reales['vehiculos'] = vehiculos
            print(f"🚗 VEHÍCULOS: {len(vehiculos)} encontrados")
            for veh in vehiculos[:3]:  # Primeros 3
                print(f"   - ID: {veh.get('id', 'N/A')}")
                print(f"     Placa: {veh.get('placa', 'N/A')}")
                print(f"     Empresa Actual ID: {veh.get('empresaActualId', 'N/A')}")
                print(f"     Estado: {veh.get('estado', 'N/A')}")
                print()
    except Exception as e:
        print(f"❌ Error consultando vehículos: {e}")
    
    # 3. Analizar resoluciones
    try:
        response = requests.get(f"{base_url}/api/v1/resoluciones", headers=headers, timeout=5)
        if response.status_code == 200:
            resoluciones = response.json()
            datos_reales['resoluciones'] = resoluciones
            print(f"📋 RESOLUCIONES: {len(resoluciones)} encontradas")
            for res in resoluciones[:3]:  # Primeras 3
                print(f"   - ID: {res.get('id', 'N/A')}")
                print(f"     Número: {res.get('nroResolucion', 'N/A')}")
                print(f"     Empresa ID: {res.get('empresaId', 'N/A')}")
                print(f"     Vehículos Habilitados: {len(res.get('vehiculosHabilitadosIds', []))}")
                print(f"     Rutas Autorizadas: {len(res.get('rutasAutorizadasIds', []))}")
                print()
    except Exception as e:
        print(f"❌ Error consultando resoluciones: {e}")
    
    # 4. Analizar rutas
    try:
        response = requests.get(f"{base_url}/api/v1/rutas", headers=headers, timeout=5)
        if response.status_code == 200:
            rutas = response.json()
            datos_reales['rutas'] = rutas
            print(f"🛣️ RUTAS: {len(rutas)} encontradas")
            for ruta in rutas[:3]:  # Primeras 3
                print(f"   - ID: {ruta.get('id', 'N/A')}")
                print(f"     Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"     Origen: {ruta.get('origen', 'N/A')}")
                print(f"     Destino: {ruta.get('destino', 'N/A')}")
                print(f"     Estado: {ruta.get('estaActivo', 'N/A')}")
                print()
    except Exception as e:
        print(f"❌ Error consultando rutas: {e}")
    
    return datos_reales

def analizar_inconsistencias(datos_reales):
    """Analizar inconsistencias específicas del error"""
    
    print("🔍 ANALIZANDO INCONSISTENCIAS ESPECÍFICAS")
    print("=" * 70)
    
    # Del error log sabemos:
    vehiculo_id_error = "694da819e46133e7b09e981c"
    empresa_id_error = "69482f16cf2abe0527c5de61"
    
    print(f"🎯 VEHÍCULO DEL ERROR: {vehiculo_id_error}")
    print(f"🎯 EMPRESA DEL ERROR: {empresa_id_error}")
    print()
    
    # 1. Verificar si el vehículo existe
    vehiculos = datos_reales.get('vehiculos', [])
    vehiculo_encontrado = None
    for veh in vehiculos:
        if veh.get('id') == vehiculo_id_error:
            vehiculo_encontrado = veh
            break
    
    if vehiculo_encontrado:
        print(f"✅ Vehículo encontrado:")
        print(f"   - Placa: {vehiculo_encontrado.get('placa')}")
        print(f"   - Empresa Actual ID: {vehiculo_encontrado.get('empresaActualId')}")
        print(f"   - Estado: {vehiculo_encontrado.get('estado')}")
    else:
        print(f"❌ Vehículo NO encontrado en la BD")
        print(f"   Esto indica que el ID {vehiculo_id_error} es un ID mock")
    
    # 2. Verificar si la empresa existe
    empresas = datos_reales.get('empresas', [])
    empresa_encontrada = None
    for emp in empresas:
        if emp.get('id') == empresa_id_error:
            empresa_encontrada = emp
            break
    
    if empresa_encontrada:
        print(f"✅ Empresa encontrada:")
        print(f"   - RUC: {empresa_encontrada.get('ruc')}")
        print(f"   - Razón Social: {empresa_encontrada.get('razonSocial', {}).get('principal')}")
    else:
        print(f"❌ Empresa NO encontrada en la BD")
        print(f"   Esto indica que el ID {empresa_id_error} es un ID mock")
    
    # 3. Verificar resoluciones que referencian estos IDs
    resoluciones = datos_reales.get('resoluciones', [])
    resoluciones_con_vehiculo = []
    resoluciones_con_empresa = []
    
    for res in resoluciones:
        vehiculos_habilitados = res.get('vehiculosHabilitadosIds', [])
        if vehiculo_id_error in vehiculos_habilitados:
            resoluciones_con_vehiculo.append(res)
        
        if res.get('empresaId') == empresa_id_error:
            resoluciones_con_empresa.append(res)
    
    print(f"\n🔍 RESOLUCIONES QUE REFERENCIAN EL VEHÍCULO: {len(resoluciones_con_vehiculo)}")
    for res in resoluciones_con_vehiculo:
        print(f"   - {res.get('nroResolucion')} (ID: {res.get('id')})")
    
    print(f"\n🔍 RESOLUCIONES QUE REFERENCIAN LA EMPRESA: {len(resoluciones_con_empresa)}")
    for res in resoluciones_con_empresa:
        print(f"   - {res.get('nroResolucion')} (ID: {res.get('id')})")
    
    return {
        'vehiculo_existe': vehiculo_encontrado is not None,
        'empresa_existe': empresa_encontrada is not None,
        'vehiculo_data': vehiculo_encontrado,
        'empresa_data': empresa_encontrada,
        'resoluciones_vehiculo': resoluciones_con_vehiculo,
        'resoluciones_empresa': resoluciones_con_empresa
    }

def generar_solucion_consistencia(datos_reales, inconsistencias):
    """Generar solución para los problemas de consistencia"""
    
    print("\n🛠️ GENERANDO SOLUCIÓN PARA CONSISTENCIA DE DATOS")
    print("=" * 70)
    
    if not inconsistencias['vehiculo_existe'] or not inconsistencias['empresa_existe']:
        print("❌ PROBLEMA CONFIRMADO: IDs mock mezclados con datos reales")
        print()
        
        # Opción 1: Usar datos reales existentes
        vehiculos_reales = datos_reales.get('vehiculos', [])
        empresas_reales = datos_reales.get('empresas', [])
        
        if vehiculos_reales and empresas_reales:
            vehiculo_real = vehiculos_reales[0]
            empresa_real = empresas_reales[0]
            
            print("💡 SOLUCIÓN 1: Usar datos reales existentes")
            print(f"   - Vehículo real: {vehiculo_real.get('placa')} (ID: {vehiculo_real.get('id')})")
            print(f"   - Empresa real: {empresa_real.get('razonSocial', {}).get('principal')} (ID: {empresa_real.get('id')})")
            
            # Crear script para actualizar el frontend
            script_fix = f"""
// 🔧 SOLUCIÓN: Usar datos reales en lugar de mocks
// Ejecutar en consola del navegador

console.log('🔧 Actualizando a datos reales...');

// Datos reales para usar
const datosReales = {{
    vehiculo: {{
        id: '{vehiculo_real.get('id')}',
        placa: '{vehiculo_real.get('placa')}',
        empresaActualId: '{vehiculo_real.get('empresaActualId', empresa_real.get('id'))}'
    }},
    empresa: {{
        id: '{empresa_real.get('id')}',
        ruc: '{empresa_real.get('ruc')}',
        razonSocial: {{
            principal: '{empresa_real.get('razonSocial', {}).get('principal', 'Empresa Real')}'
        }}
    }}
}};

console.log('✅ Datos reales:', datosReales);
console.log('💡 Usar estos IDs en lugar de los mocks');
"""
            
            with open('fix_datos_reales.js', 'w', encoding='utf-8') as f:
                f.write(script_fix)
            
            print("📝 Script creado: fix_datos_reales.js")
        
        # Opción 2: Crear datos que coincidan con los mocks
        print(f"\n💡 SOLUCIÓN 2: Crear datos reales que coincidan con los mocks")
        print("   (Requiere acceso al backend para crear registros)")
        
        # Opción 3: Limpiar datos mock del frontend
        print(f"\n💡 SOLUCIÓN 3: Limpiar completamente los datos mock del frontend")
        print("   - Revisar localStorage")
        print("   - Revisar datos hardcodeados en componentes")
        print("   - Asegurar que todo viene del backend")
    
    else:
        print("✅ Los datos parecen consistentes")
        print("   El problema puede ser de otra naturaleza")

def main():
    print("🔍 ANÁLISIS DE CONSISTENCIA: DATOS MOCK vs DATOS REALES")
    print("=" * 80)
    print("Investigando el problema reportado de IDs inconsistentes...")
    print()
    
    # 1. Obtener datos reales
    datos_reales = analizar_datos_reales()
    
    # 2. Analizar inconsistencias específicas
    inconsistencias = analizar_inconsistencias(datos_reales)
    
    # 3. Generar solución
    generar_solucion_consistencia(datos_reales, inconsistencias)
    
    print(f"\n📋 RESUMEN DEL ANÁLISIS:")
    print(f"- Vehículo del error existe en BD: {inconsistencias['vehiculo_existe']}")
    print(f"- Empresa del error existe en BD: {inconsistencias['empresa_existe']}")
    
    if not inconsistencias['vehiculo_existe'] or not inconsistencias['empresa_existe']:
        print(f"\n⚠️ CONFIRMADO: Hay IDs mock mezclados con datos reales")
        print(f"   Esto explica los errores de 'undefined' y referencias no encontradas")
        print(f"   La aplicación está intentando usar IDs que no existen en MongoDB")
    
    print(f"\n🎯 PRÓXIMOS PASOS:")
    print(f"1. Decidir si usar datos reales existentes o crear datos que coincidan")
    print(f"2. Limpiar referencias a IDs mock en el frontend")
    print(f"3. Asegurar consistencia entre frontend y backend")

if __name__ == "__main__":
    main()