#!/usr/bin/env python3
"""
Script para crear resoluciones padre necesarias para el dropdown
"""

import requests
import json
from datetime import datetime, timedelta

def crear_resoluciones_padre():
    """Crear resoluciones padre para que aparezcan en el dropdown"""
    
    print("🔧 CREANDO RESOLUCIONES PADRE PARA DROPDOWN")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Verificar backend
        print("\n1. 🌐 VERIFICANDO BACKEND...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code != 200:
            print(f"   ❌ Backend no disponible: {health_response.status_code}")
            return
        print("   ✅ Backend funcionando")
        
        # 2. Obtener empresas disponibles
        print("\n2. 🏢 OBTENIENDO EMPRESAS...")
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        
        if empresas_response.status_code != 200:
            print(f"   ❌ Error al obtener empresas: {empresas_response.status_code}")
            return
        
        empresas = empresas_response.json()
        print(f"   ✅ Empresas encontradas: {len(empresas)}")
        
        if len(empresas) == 0:
            print("   ❌ No hay empresas en el sistema")
            return
        
        # 3. Tomar las primeras 2 empresas para crear resoluciones padre
        empresas_seleccionadas = empresas[:2]
        
        for i, empresa in enumerate(empresas_seleccionadas, 1):
            empresa_id = empresa.get('id')
            ruc = empresa.get('ruc', 'Sin RUC')
            razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
            
            print(f"\n3.{i} 📋 CREANDO RESOLUCIONES PADRE PARA: {ruc} - {razon_social}")
            
            # Crear 2-3 resoluciones padre por empresa
            resoluciones_a_crear = [
                {
                    "tipo": "PRIMIGENIA",
                    "numero": f"000{i}",
                    "descripcion": f"Resolución primigenia para {razon_social[:30]}",
                    "vigencia_anos": 5
                },
                {
                    "tipo": "RENOVACION", 
                    "numero": f"000{i+2}",
                    "descripcion": f"Resolución de renovación para {razon_social[:30]}",
                    "vigencia_anos": 4
                }
            ]
            
            for j, resolucion_data in enumerate(resoluciones_a_crear, 1):
                print(f"      📝 Creando resolución {j}: R-{resolucion_data['numero']}-2025")
                
                # Calcular fechas
                fecha_inicio = datetime.now()
                fecha_fin = fecha_inicio + timedelta(days=365 * resolucion_data['vigencia_anos'])
                
                # Datos de la resolución
                resolucion_payload = {
                    "nroResolucion": f"R-{resolucion_data['numero']}-2025",
                    "tipoTramite": resolucion_data["tipo"],
                    "tipoResolucion": "PADRE",
                    "empresaId": empresa_id,
                    "expedienteId": "exp-default-001",  # Expediente por defecto
                    "fechaEmision": fecha_inicio.isoformat(),
                    "fechaVigenciaInicio": fecha_inicio.isoformat(),
                    "fechaVigenciaFin": fecha_fin.isoformat(),
                    "descripcion": resolucion_data["descripcion"],
                    "estado": "VIGENTE",
                    "estaActivo": True,
                    "resolucionesHijasIds": [],
                    "vehiculosHabilitadosIds": [],
                    "rutasAutorizadasIds": []
                }
                
                # Intentar crear la resolución
                try:
                    create_response = requests.post(
                        f"{base_url}/resoluciones",
                        json=resolucion_payload,
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    
                    if create_response.status_code in [200, 201]:
                        print(f"         ✅ Resolución creada exitosamente")
                    else:
                        print(f"         ❌ Error al crear resolución: {create_response.status_code}")
                        print(f"         📄 Respuesta: {create_response.text[:200]}")
                        
                except requests.exceptions.RequestException as e:
                    print(f"         ❌ Error de conexión: {e}")
        
        # 4. Verificar resoluciones creadas
        print(f"\n4. 🔍 VERIFICANDO RESOLUCIONES CREADAS...")
        
        try:
            # Intentar diferentes endpoints para obtener resoluciones
            endpoints_a_probar = [
                "/resoluciones",
                "/api/v1/resoluciones", 
                "/resoluciones/all"
            ]
            
            resoluciones_encontradas = []
            
            for endpoint in endpoints_a_probar:
                try:
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    if response.status_code == 200:
                        resoluciones_encontradas = response.json()
                        print(f"   ✅ Endpoint funcionando: {endpoint}")
                        break
                except:
                    continue
            
            if resoluciones_encontradas:
                resoluciones_padre = [r for r in resoluciones_encontradas if r.get('tipoResolucion') == 'PADRE']
                print(f"   📊 Total resoluciones PADRE: {len(resoluciones_padre)}")
                
                # Agrupar por empresa
                por_empresa = {}
                for resolucion in resoluciones_padre:
                    empresa_id = resolucion.get('empresaId')
                    if empresa_id not in por_empresa:
                        por_empresa[empresa_id] = []
                    por_empresa[empresa_id].append(resolucion)
                
                print(f"   🏢 Empresas con resoluciones PADRE: {len(por_empresa)}")
                
                for empresa_id, resoluciones in por_empresa.items():
                    print(f"      • Empresa {empresa_id[:8]}...: {len(resoluciones)} resoluciones")
                    for resolucion in resoluciones:
                        numero = resolucion.get('nroResolucion', 'Sin número')
                        estado = resolucion.get('estado', 'Sin estado')
                        print(f"        - {numero} ({estado})")
            else:
                print("   ❌ No se pudieron obtener las resoluciones creadas")
        
        except Exception as e:
            print(f"   ❌ Error al verificar: {e}")
        
        # 5. Instrucciones para el usuario
        print(f"\n5. 📋 INSTRUCCIONES PARA PROBAR EL DROPDOWN:")
        print("   1. Abrir el frontend: http://localhost:4200")
        print("   2. Ir al módulo de Resoluciones")
        print("   3. Hacer clic en 'Nueva Resolución'")
        print("   4. Seleccionar una empresa")
        print("   5. Seleccionar un expediente de tipo INCREMENTO")
        print("   6. Verificar que el dropdown 'RESOLUCIÓN PADRE' muestre las opciones")
        
        print(f"\n6. 🔧 SI EL DROPDOWN SIGUE VACÍO:")
        print("   • Verificar que el endpoint /resoluciones funcione")
        print("   • Verificar que las resoluciones tengan empresaId correcto")
        print("   • Verificar que el filtrado en el frontend funcione")
        print("   • Abrir consola del navegador (F12) para ver logs")
        
        print("\n" + "=" * 50)
        print("✅ PROCESO COMPLETADO")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    crear_resoluciones_padre()