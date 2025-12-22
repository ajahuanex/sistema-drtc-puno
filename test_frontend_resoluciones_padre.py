#!/usr/bin/env python3
"""
Script para probar el frontend y verificar que el dropdown de resoluciones padre funcione
"""

import requests
import json
from datetime import datetime, timedelta

def test_frontend_resoluciones_padre():
    """Probar el frontend y el dropdown de resoluciones padre"""
    
    print("🔍 PROBANDO FRONTEND - DROPDOWN RESOLUCIONES PADRE")
    print("=" * 60)
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # 1. Verificar que hay resoluciones padre disponibles
        print("\n1. 📋 VERIFICANDO RESOLUCIONES PADRE DISPONIBLES...")
        
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error obteniendo resoluciones: {resoluciones_response.status_code}")
            return False
        
        resoluciones = resoluciones_response.json()
        resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        
        print(f"   ✅ Total resoluciones: {len(resoluciones)}")
        print(f"   📊 Resoluciones PADRE: {len(resoluciones_padre)}")
        
        if len(resoluciones_padre) == 0:
            print("   ⚠️  NO HAY RESOLUCIONES PADRE - Creando algunas...")
            if not crear_mas_resoluciones_padre():
                return False
            
            # Volver a obtener después de crear
            resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
            resoluciones = resoluciones_response.json()
            resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        
        # 2. Obtener empresas disponibles
        print(f"\n2. 🏢 VERIFICANDO EMPRESAS DISPONIBLES...")
        
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
            return False
        
        empresas = empresas_response.json()
        print(f"   ✅ Total empresas: {len(empresas)}")
        
        if len(empresas) == 0:
            print("   ❌ NO HAY EMPRESAS - No se puede probar el dropdown")
            return False
        
        # 3. Verificar que hay empresas con resoluciones padre
        print(f"\n3. 🔗 VERIFICANDO RELACIONES EMPRESA-RESOLUCIÓN...")
        
        empresas_con_padre = {}
        for resolucion in resoluciones_padre:
            empresa_id = resolucion.get('empresaId')
            if empresa_id:
                if empresa_id not in empresas_con_padre:
                    empresas_con_padre[empresa_id] = []
                empresas_con_padre[empresa_id].append(resolucion)
        
        print(f"   📊 Empresas con resoluciones PADRE: {len(empresas_con_padre)}")
        
        if len(empresas_con_padre) == 0:
            print("   ⚠️  NO HAY EMPRESAS CON RESOLUCIONES PADRE - Creando relaciones...")
            if not crear_resoluciones_para_empresas_existentes(empresas):
                return False
            
            # Volver a verificar
            resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
            resoluciones = resoluciones_response.json()
            resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
            
            empresas_con_padre = {}
            for resolucion in resoluciones_padre:
                empresa_id = resolucion.get('empresaId')
                if empresa_id:
                    if empresa_id not in empresas_con_padre:
                        empresas_con_padre[empresa_id] = []
                    empresas_con_padre[empresa_id].append(resolucion)
        
        # 4. Mostrar detalles para el usuario
        print(f"\n4. 📋 DATOS PARA PROBAR EL DROPDOWN:")
        
        for i, (empresa_id, resoluciones_empresa) in enumerate(empresas_con_padre.items(), 1):
            # Buscar datos de la empresa
            empresa_data = next((e for e in empresas if e.get('id') == empresa_id), None)
            
            if empresa_data:
                ruc = empresa_data.get('ruc', 'Sin RUC')
                razon_social = empresa_data.get('razonSocial', {}).get('principal', 'Sin razón social')
                
                print(f"\n   🏢 EMPRESA {i}: {ruc} - {razon_social}")
                print(f"      ID: {empresa_id}")
                print(f"      📋 Resoluciones PADRE disponibles: {len(resoluciones_empresa)}")
                
                for j, resolucion in enumerate(resoluciones_empresa, 1):
                    numero = resolucion.get('nroResolucion', 'Sin número')
                    estado = resolucion.get('estado', 'Sin estado')
                    activo = resolucion.get('estaActivo', False)
                    fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                    
                    print(f"         {j}. {numero} ({estado}) - Activo: {activo}")
                    if fecha_fin != 'Sin fecha':
                        print(f"            Vence: {fecha_fin[:10]}")
        
        # 5. Simular la llamada que hace el frontend
        print(f"\n5. 🔄 SIMULANDO LLAMADA DEL FRONTEND...")
        
        primera_empresa_id = list(empresas_con_padre.keys())[0]
        primera_empresa = next((e for e in empresas if e.get('id') == primera_empresa_id), None)
        
        print(f"   🎯 Empresa seleccionada: {primera_empresa.get('ruc')} - {primera_empresa.get('razonSocial', {}).get('principal')}")
        print(f"   🔍 Simulando filtrado de resoluciones padre...")
        
        # El frontend llama a getResoluciones() y luego filtra localmente
        resoluciones_filtradas = [r for r in resoluciones_padre if 
                                r.get('empresaId') == primera_empresa_id and
                                r.get('tipoResolucion') == 'PADRE' and
                                r.get('estaActivo', False) and
                                r.get('estado') == 'VIGENTE']
        
        print(f"   📊 Resoluciones que aparecerían en el dropdown: {len(resoluciones_filtradas)}")
        
        for resolucion in resoluciones_filtradas:
            numero = resolucion.get('nroResolucion', 'Sin número')
            fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
            print(f"      • {numero} - Vence: {fecha_fin[:10] if fecha_fin != 'Sin fecha' else 'Sin fecha'}")
        
        # 6. Instrucciones finales
        print(f"\n6. 📋 INSTRUCCIONES PARA PROBAR:")
        print(f"   1. Abrir frontend: http://localhost:4200")
        print(f"   2. Ir a Resoluciones → Nueva Resolución")
        print(f"   3. Seleccionar empresa: {primera_empresa.get('ruc')} - {primera_empresa.get('razonSocial', {}).get('principal')}")
        print(f"   4. Seleccionar expediente tipo INCREMENTO")
        print(f"   5. El dropdown 'RESOLUCIÓN PADRE' debería mostrar {len(resoluciones_filtradas)} opciones")
        
        if len(resoluciones_filtradas) > 0:
            print(f"\n   ✅ EL DROPDOWN DEBERÍA FUNCIONAR CORRECTAMENTE")
            return True
        else:
            print(f"\n   ❌ EL DROPDOWN SEGUIRÁ VACÍO - Faltan resoluciones válidas")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def crear_mas_resoluciones_padre():
    """Crear más resoluciones padre si no existen"""
    
    print("   🔧 CREANDO RESOLUCIONES PADRE ADICIONALES...")
    
    base_url = "http://localhost:8000/api/v1"
    
    # Obtener empresas
    try:
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            return False
        
        empresas = empresas_response.json()
        if len(empresas) == 0:
            return False
        
        # Crear resoluciones para las primeras 2 empresas
        empresas_seleccionadas = empresas[:2]
        creadas = 0
        
        for i, empresa in enumerate(empresas_seleccionadas):
            empresa_id = empresa.get('id')
            ruc = empresa.get('ruc', 'Sin RUC')
            
            resoluciones_empresa = [
                {
                    "nroResolucion": f"R-{str(20 + i*2).zfill(4)}-2025",
                    "tipoTramite": "AUTORIZACION_NUEVA",
                    "tipoResolucion": "PADRE",
                    "empresaId": empresa_id,
                    "expedienteId": f"exp-{empresa_id[:8]}-001",
                    "fechaEmision": datetime.now().isoformat(),
                    "fechaVigenciaInicio": datetime.now().isoformat(),
                    "fechaVigenciaFin": (datetime.now() + timedelta(days=365*5)).isoformat(),
                    "descripcion": f"Resolución padre para {ruc} - Autorización nueva",
                    "estado": "VIGENTE",
                    "estaActivo": True,
                    "resolucionesHijasIds": [],
                    "vehiculosHabilitadosIds": [],
                    "rutasAutorizadasIds": []
                },
                {
                    "nroResolucion": f"R-{str(21 + i*2).zfill(4)}-2025",
                    "tipoTramite": "RENOVACION",
                    "tipoResolucion": "PADRE",
                    "empresaId": empresa_id,
                    "expedienteId": f"exp-{empresa_id[:8]}-002",
                    "fechaEmision": datetime.now().isoformat(),
                    "fechaVigenciaInicio": datetime.now().isoformat(),
                    "fechaVigenciaFin": (datetime.now() + timedelta(days=365*4)).isoformat(),
                    "descripcion": f"Resolución padre para {ruc} - Renovación",
                    "estado": "VIGENTE",
                    "estaActivo": True,
                    "resolucionesHijasIds": [],
                    "vehiculosHabilitadosIds": [],
                    "rutasAutorizadasIds": []
                }
            ]
            
            for resolucion_data in resoluciones_empresa:
                try:
                    response = requests.post(
                        f"{base_url}/resoluciones",
                        json=resolucion_data,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    
                    if response.status_code in [200, 201]:
                        creadas += 1
                        print(f"      ✅ Creada: {resolucion_data['nroResolucion']} para {ruc}")
                    else:
                        print(f"      ❌ Error: {response.status_code} para {resolucion_data['nroResolucion']}")
                        
                except Exception as e:
                    print(f"      ❌ Error creando resolución: {e}")
        
        print(f"   📊 Total resoluciones padre creadas: {creadas}")
        return creadas > 0
        
    except Exception as e:
        print(f"   ❌ Error creando resoluciones: {e}")
        return False

def crear_resoluciones_para_empresas_existentes(empresas):
    """Crear resoluciones padre para empresas existentes"""
    
    print("   🔧 CREANDO RESOLUCIONES PARA EMPRESAS EXISTENTES...")
    
    base_url = "http://localhost:8000/api/v1"
    creadas = 0
    
    for i, empresa in enumerate(empresas[:3]):  # Solo primeras 3 empresas
        empresa_id = empresa.get('id')
        ruc = empresa.get('ruc', 'Sin RUC')
        
        resolucion_data = {
            "nroResolucion": f"R-{str(100 + i).zfill(4)}-2025",
            "tipoTramite": "AUTORIZACION_NUEVA",
            "tipoResolucion": "PADRE",
            "empresaId": empresa_id,
            "expedienteId": f"exp-{empresa_id[:8]}-padre",
            "fechaEmision": datetime.now().isoformat(),
            "fechaVigenciaInicio": datetime.now().isoformat(),
            "fechaVigenciaFin": (datetime.now() + timedelta(days=365*5)).isoformat(),
            "descripcion": f"Resolución padre para empresa {ruc} - Para dropdown",
            "estado": "VIGENTE",
            "estaActivo": True,
            "resolucionesHijasIds": [],
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": []
        }
        
        try:
            response = requests.post(
                f"{base_url}/resoluciones",
                json=resolucion_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                creadas += 1
                print(f"      ✅ Creada para {ruc}: {resolucion_data['nroResolucion']}")
            else:
                print(f"      ❌ Error para {ruc}: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Error para {ruc}: {e}")
    
    print(f"   📊 Resoluciones creadas para empresas: {creadas}")
    return creadas > 0

if __name__ == "__main__":
    success = test_frontend_resoluciones_padre()
    
    if success:
        print(f"\n🎉 ÉXITO: El dropdown debería funcionar correctamente")
    else:
        print(f"\n❌ PROBLEMA: El dropdown puede seguir vacío")
    
    print(f"\n💡 NOTA: Si el dropdown sigue vacío, verificar:")
    print(f"   • Que el frontend esté conectado al backend correcto")
    print(f"   • Que no haya errores en la consola del navegador (F12)")
    print(f"   • Que el método cargarResolucionesPadre() esté funcionando")
    
    print(f"\n" + "=" * 60)