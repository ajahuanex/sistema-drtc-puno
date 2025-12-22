#!/usr/bin/env python3
"""
Script para verificar las resoluciones padre disponibles en el sistema
"""

import requests
import json
from datetime import datetime

def verificar_resoluciones_padre():
    """Verificar resoluciones padre disponibles"""
    
    print("🔍 VERIFICANDO RESOLUCIONES PADRE DISPONIBLES")
    print("=" * 55)
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # 1. Obtener todas las resoluciones
        print("\n1. 📋 OBTENIENDO RESOLUCIONES...")
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error: {resoluciones_response.status_code}")
            return
        
        resoluciones = resoluciones_response.json()
        print(f"   ✅ Total resoluciones: {len(resoluciones)}")
        
        # 2. Filtrar resoluciones PADRE
        resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        print(f"   📊 Resoluciones PADRE: {len(resoluciones_padre)}")
        
        if len(resoluciones_padre) == 0:
            print("   ⚠️  NO HAY RESOLUCIONES PADRE - El dropdown estará vacío")
            return crear_resoluciones_padre_ejemplo()
        
        # 3. Analizar resoluciones padre por empresa
        print(f"\n2. 🏢 ANÁLISIS POR EMPRESA:")
        
        empresas_con_padre = {}
        for resolucion in resoluciones_padre:
            empresa_id = resolucion.get('empresaId')
            if empresa_id:
                if empresa_id not in empresas_con_padre:
                    empresas_con_padre[empresa_id] = []
                empresas_con_padre[empresa_id].append(resolucion)
        
        print(f"   📊 Empresas con resoluciones PADRE: {len(empresas_con_padre)}")
        
        # 4. Mostrar detalles por empresa
        for i, (empresa_id, resoluciones_empresa) in enumerate(empresas_con_padre.items(), 1):
            print(f"\n   🏢 Empresa {i}: {empresa_id}")
            print(f"      📋 Resoluciones PADRE disponibles: {len(resoluciones_empresa)}")
            
            for j, resolucion in enumerate(resoluciones_empresa, 1):
                numero = resolucion.get('nroResolucion', 'Sin número')
                estado = resolucion.get('estado', 'Sin estado')
                activo = resolucion.get('estaActivo', False)
                fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                
                # Verificar si está vigente
                vigente_str = "❓"
                if fecha_fin and fecha_fin != 'Sin fecha':
                    try:
                        # Manejar diferentes formatos de fecha
                        if 'T' in fecha_fin:
                            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', ''))
                        else:
                            fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
                        vigente_str = "✅" if fecha_fin_dt > datetime.now() else "❌"
                    except:
                        vigente_str = "❓"
                
                print(f"         {j}. {numero}")
                print(f"            Estado: {estado} | Activo: {activo} | Vigente: {vigente_str}")
                if fecha_fin != 'Sin fecha':
                    print(f"            Vence: {fecha_fin[:10]}")
        
        # 5. Verificar si las resoluciones son válidas para el dropdown
        print(f"\n3. ✅ VALIDACIÓN PARA DROPDOWN:")
        
        resoluciones_validas = []
        for resolucion in resoluciones_padre:
            # Criterios para aparecer en dropdown:
            # - Tipo PADRE
            # - Estado VIGENTE
            # - estaActivo = True
            # - Fecha de vigencia futura
            
            es_valida = True
            motivos_invalida = []
            
            if resolucion.get('tipoResolucion') != 'PADRE':
                es_valida = False
                motivos_invalida.append("No es PADRE")
            
            if resolucion.get('estado') != 'VIGENTE':
                es_valida = False
                motivos_invalida.append(f"Estado: {resolucion.get('estado')}")
            
            if not resolucion.get('estaActivo', False):
                es_valida = False
                motivos_invalida.append("No está activa")
            
            fecha_fin = resolucion.get('fechaVigenciaFin')
            if fecha_fin:
                try:
                    if 'T' in fecha_fin:
                        fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', ''))
                    else:
                        fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
                    
                    if fecha_fin_dt <= datetime.now():
                        es_valida = False
                        motivos_invalida.append("Ya venció")
                except:
                    es_valida = False
                    motivos_invalida.append("Fecha inválida")
            
            if es_valida:
                resoluciones_validas.append(resolucion)
            else:
                numero = resolucion.get('nroResolucion', 'Sin número')
                print(f"   ❌ {numero}: {', '.join(motivos_invalida)}")
        
        print(f"\n   📊 RESOLUCIONES VÁLIDAS PARA DROPDOWN: {len(resoluciones_validas)}")
        
        if len(resoluciones_validas) > 0:
            print(f"   ✅ EL DROPDOWN DEBERÍA MOSTRAR {len(resoluciones_validas)} OPCIONES")
            
            # Agrupar válidas por empresa
            validas_por_empresa = {}
            for resolucion in resoluciones_validas:
                empresa_id = resolucion.get('empresaId')
                if empresa_id not in validas_por_empresa:
                    validas_por_empresa[empresa_id] = []
                validas_por_empresa[empresa_id].append(resolucion)
            
            print(f"\n   🏢 DISTRIBUCIÓN POR EMPRESA:")
            for empresa_id, resoluciones_empresa in validas_por_empresa.items():
                print(f"      • {empresa_id[:8]}...: {len(resoluciones_empresa)} resoluciones")
                for resolucion in resoluciones_empresa:
                    numero = resolucion.get('nroResolucion', 'Sin número')
                    print(f"         - {numero}")
        else:
            print(f"   ❌ NO HAY RESOLUCIONES VÁLIDAS - El dropdown estará vacío")
            return crear_resoluciones_padre_ejemplo()
        
        # 6. Instrucciones para probar
        print(f"\n4. 📋 CÓMO PROBAR EL DROPDOWN:")
        print(f"   1. Abrir frontend: http://localhost:4200")
        print(f"   2. Ir a Resoluciones → Nueva Resolución")
        print(f"   3. Seleccionar empresa con ID: {list(validas_por_empresa.keys())[0][:8]}...")
        print(f"   4. Seleccionar expediente tipo INCREMENTO")
        print(f"   5. Verificar dropdown 'RESOLUCIÓN PADRE'")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def crear_resoluciones_padre_ejemplo():
    """Crear resoluciones padre de ejemplo si no existen"""
    
    print(f"\n🔧 CREANDO RESOLUCIONES PADRE DE EJEMPLO...")
    
    base_url = "http://localhost:8000/api/v1"
    
    # Obtener empresas disponibles
    try:
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            print(f"   ❌ No se pueden obtener empresas: {empresas_response.status_code}")
            return False
        
        empresas = empresas_response.json()
        if len(empresas) == 0:
            print(f"   ❌ No hay empresas en el sistema")
            return False
        
        # Tomar la primera empresa
        empresa = empresas[0]
        empresa_id = empresa.get('id')
        ruc = empresa.get('ruc', 'Sin RUC')
        
        print(f"   🏢 Usando empresa: {ruc} (ID: {empresa_id[:8]}...)")
        
        # Crear 2 resoluciones padre
        resoluciones_ejemplo = [
            {
                "nroResolucion": "R-0010-2025",
                "tipoTramite": "AUTORIZACION_NUEVA",
                "tipoResolucion": "PADRE",
                "empresaId": empresa_id,
                "expedienteId": "exp-ejemplo-001",
                "fechaEmision": datetime.now().isoformat(),
                "fechaVigenciaInicio": datetime.now().isoformat(),
                "fechaVigenciaFin": datetime(2030, 12, 31).isoformat(),
                "descripcion": "Resolución padre de ejemplo para dropdown - Autorización nueva",
                "estado": "VIGENTE",
                "estaActivo": True,
                "resolucionesHijasIds": [],
                "vehiculosHabilitadosIds": [],
                "rutasAutorizadasIds": []
            },
            {
                "nroResolucion": "R-0011-2025",
                "tipoTramite": "RENOVACION",
                "tipoResolucion": "PADRE",
                "empresaId": empresa_id,
                "expedienteId": "exp-ejemplo-002",
                "fechaEmision": datetime.now().isoformat(),
                "fechaVigenciaInicio": datetime.now().isoformat(),
                "fechaVigenciaFin": datetime(2029, 12, 31).isoformat(),
                "descripcion": "Resolución padre de ejemplo para dropdown - Renovación",
                "estado": "VIGENTE",
                "estaActivo": True,
                "resolucionesHijasIds": [],
                "vehiculosHabilitadosIds": [],
                "rutasAutorizadasIds": []
            }
        ]
        
        creadas = 0
        for resolucion_data in resoluciones_ejemplo:
            try:
                response = requests.post(
                    f"{base_url}/resoluciones",
                    json=resolucion_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    print(f"   ✅ Creada: {resolucion_data['nroResolucion']}")
                    creadas += 1
                else:
                    print(f"   ❌ Error creando {resolucion_data['nroResolucion']}: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        if creadas > 0:
            print(f"\n   ✅ {creadas} resoluciones padre creadas exitosamente")
            print(f"   💡 Ahora el dropdown debería funcionar")
            return True
        else:
            print(f"\n   ❌ No se pudieron crear resoluciones padre")
            return False
            
    except Exception as e:
        print(f"   ❌ Error creando ejemplos: {e}")
        return False

if __name__ == "__main__":
    verificar_resoluciones_padre()