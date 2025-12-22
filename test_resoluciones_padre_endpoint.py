#!/usr/bin/env python3
"""
Script para probar el endpoint de resoluciones y crear resoluciones padre si es necesario
"""

import requests
import json
from datetime import datetime, timedelta

def test_resoluciones_endpoint():
    """Probar el endpoint de resoluciones y crear datos si es necesario"""
    
    print("🔍 PROBANDO ENDPOINT DE RESOLUCIONES")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Probar endpoint de resoluciones
        print("\n1. 🌐 PROBANDO ENDPOINT /resoluciones...")
        
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        print(f"   Status: {resoluciones_response.status_code}")
        
        if resoluciones_response.status_code == 200:
            resoluciones = resoluciones_response.json()
            print(f"   ✅ Endpoint funcionando - {len(resoluciones)} resoluciones encontradas")
            
            # Filtrar resoluciones padre
            resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
            print(f"   📊 Resoluciones PADRE: {len(resoluciones_padre)}")
            
            if len(resoluciones_padre) > 0:
                print("\n   📋 RESOLUCIONES PADRE EXISTENTES:")
                for i, resolucion in enumerate(resoluciones_padre, 1):
                    numero = resolucion.get('nroResolucion', 'Sin número')
                    empresa_id = resolucion.get('empresaId', 'Sin empresa')
                    estado = resolucion.get('estado', 'Sin estado')
                    print(f"      {i}. {numero} - Empresa: {empresa_id[:8]}... - Estado: {estado}")
                
                print(f"\n   ✅ HAY {len(resoluciones_padre)} RESOLUCIONES PADRE DISPONIBLES")
                print("   💡 El dropdown debería mostrar estas resoluciones")
                return True
            else:
                print("   ⚠️  NO HAY RESOLUCIONES PADRE - Creando algunas...")
                return crear_resoluciones_padre_basicas()
        else:
            print(f"   ❌ Error en endpoint: {resoluciones_response.status_code}")
            print(f"   📄 Respuesta: {resoluciones_response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")
        return False

def crear_resoluciones_padre_basicas():
    """Crear resoluciones padre básicas para el dropdown"""
    
    print("\n2. 🔧 CREANDO RESOLUCIONES PADRE BÁSICAS...")
    
    base_url = "http://localhost:8000"
    
    # Datos de resoluciones padre de ejemplo
    resoluciones_ejemplo = [
        {
            "nroResolucion": "R-0001-2025",
            "tipoTramite": "AUTORIZACION_NUEVA",
            "tipoResolucion": "PADRE",
            "empresaId": "67418b1c6302fb8566ba0a0f",  # ID de empresa de ejemplo
            "expedienteId": "exp-001",
            "fechaEmision": datetime.now().isoformat(),
            "fechaVigenciaInicio": datetime.now().isoformat(),
            "fechaVigenciaFin": (datetime.now() + timedelta(days=365*5)).isoformat(),
            "descripcion": "Resolución padre de autorización nueva para pruebas del dropdown",
            "estado": "VIGENTE",
            "estaActivo": True,
            "resolucionesHijasIds": [],
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": []
        },
        {
            "nroResolucion": "R-0002-2025",
            "tipoTramite": "RENOVACION",
            "tipoResolucion": "PADRE",
            "empresaId": "67418b1c6302fb8566ba0a0f",  # Misma empresa
            "expedienteId": "exp-002",
            "fechaEmision": datetime.now().isoformat(),
            "fechaVigenciaInicio": datetime.now().isoformat(),
            "fechaVigenciaFin": (datetime.now() + timedelta(days=365*4)).isoformat(),
            "descripcion": "Resolución padre de renovación para pruebas del dropdown",
            "estado": "VIGENTE",
            "estaActivo": True,
            "resolucionesHijasIds": [],
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": []
        },
        {
            "nroResolucion": "R-0003-2025",
            "tipoTramite": "AUTORIZACION_NUEVA",
            "tipoResolucion": "PADRE",
            "empresaId": "67418b1c6302fb8566ba0a10",  # Otra empresa
            "expedienteId": "exp-003",
            "fechaEmision": datetime.now().isoformat(),
            "fechaVigenciaInicio": datetime.now().isoformat(),
            "fechaVigenciaFin": (datetime.now() + timedelta(days=365*5)).isoformat(),
            "descripcion": "Resolución padre para segunda empresa - pruebas dropdown",
            "estado": "VIGENTE",
            "estaActivo": True,
            "resolucionesHijasIds": [],
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": []
        }
    ]
    
    creadas_exitosamente = 0
    
    for i, resolucion_data in enumerate(resoluciones_ejemplo, 1):
        print(f"   📝 Creando resolución {i}: {resolucion_data['nroResolucion']}")
        
        try:
            create_response = requests.post(
                f"{base_url}/resoluciones",
                json=resolucion_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if create_response.status_code in [200, 201]:
                print(f"      ✅ Creada exitosamente")
                creadas_exitosamente += 1
            else:
                print(f"      ❌ Error: {create_response.status_code}")
                print(f"      📄 Respuesta: {create_response.text[:100]}")
                
        except requests.exceptions.RequestException as e:
            print(f"      ❌ Error de conexión: {e}")
        except Exception as e:
            print(f"      ❌ Error inesperado: {e}")
    
    print(f"\n   📊 RESULTADO: {creadas_exitosamente}/{len(resoluciones_ejemplo)} resoluciones creadas")
    
    if creadas_exitosamente > 0:
        print("   ✅ RESOLUCIONES PADRE CREADAS EXITOSAMENTE")
        print("   💡 Ahora el dropdown debería mostrar opciones")
        return True
    else:
        print("   ❌ NO SE PUDIERON CREAR RESOLUCIONES PADRE")
        return False

def verificar_dropdown_funcionando():
    """Verificar que el dropdown tenga datos para mostrar"""
    
    print("\n3. 🔍 VERIFICACIÓN FINAL DEL DROPDOWN...")
    
    base_url = "http://localhost:8000"
    
    try:
        # Obtener resoluciones nuevamente
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        
        if resoluciones_response.status_code == 200:
            resoluciones = resoluciones_response.json()
            resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
            
            print(f"   📊 Total resoluciones PADRE disponibles: {len(resoluciones_padre)}")
            
            if len(resoluciones_padre) > 0:
                # Agrupar por empresa
                por_empresa = {}
                for resolucion in resoluciones_padre:
                    empresa_id = resolucion.get('empresaId')
                    if empresa_id not in por_empresa:
                        por_empresa[empresa_id] = []
                    por_empresa[empresa_id].append(resolucion)
                
                print(f"   🏢 Empresas con resoluciones PADRE: {len(por_empresa)}")
                
                for empresa_id, resoluciones_empresa in por_empresa.items():
                    print(f"\n      🏢 Empresa {empresa_id[:8]}...:")
                    print(f"         📋 Resoluciones disponibles para dropdown: {len(resoluciones_empresa)}")
                    
                    for resolucion in resoluciones_empresa:
                        numero = resolucion.get('nroResolucion', 'Sin número')
                        estado = resolucion.get('estado', 'Sin estado')
                        fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                        print(f"            • {numero} ({estado}) - Vence: {fecha_fin[:10]}")
                
                print(f"\n   ✅ EL DROPDOWN DEBERÍA FUNCIONAR CORRECTAMENTE")
                print(f"   💡 Cada empresa tendrá {len(resoluciones_padre)} opciones disponibles")
                return True
            else:
                print("   ❌ AÚN NO HAY RESOLUCIONES PADRE")
                return False
        else:
            print(f"   ❌ Error al verificar: {resoluciones_response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error en verificación: {e}")
        return False

def main():
    """Función principal"""
    
    print("🎯 DIAGNÓSTICO Y REPARACIÓN DEL DROPDOWN DE RESOLUCIONES PADRE")
    print("=" * 70)
    
    # Paso 1: Probar endpoint
    endpoint_ok = test_resoluciones_endpoint()
    
    if endpoint_ok:
        # Paso 2: Verificar que funcione
        dropdown_ok = verificar_dropdown_funcionando()
        
        if dropdown_ok:
            print(f"\n🎉 ÉXITO: El dropdown de resoluciones padre debería funcionar")
            print(f"\n📋 INSTRUCCIONES PARA PROBAR:")
            print(f"   1. Abrir frontend: http://localhost:4200")
            print(f"   2. Ir a Resoluciones → Nueva Resolución")
            print(f"   3. Seleccionar una empresa")
            print(f"   4. Seleccionar expediente tipo INCREMENTO")
            print(f"   5. Verificar que aparezcan opciones en 'RESOLUCIÓN PADRE'")
        else:
            print(f"\n❌ PROBLEMA: El dropdown puede seguir vacío")
            print(f"💡 Revisar logs del frontend (F12) para más detalles")
    else:
        print(f"\n❌ PROBLEMA: El endpoint de resoluciones no funciona")
        print(f"💡 Verificar que el backend esté ejecutándose correctamente")
    
    print(f"\n" + "=" * 70)

if __name__ == "__main__":
    main()