#!/usr/bin/env python3
"""
Script para diagnosticar el dropdown de resoluciones padre en el formulario de crear resolución
"""

import requests
import json
from datetime import datetime

def diagnosticar_resoluciones_padre():
    """Diagnosticar el estado de las resoluciones padre para el dropdown"""
    
    print("🔍 DIAGNÓSTICO: Dropdown de Resoluciones Padre")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Verificar que el backend esté funcionando
        print("\n1. 🌐 VERIFICANDO BACKEND...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("   ✅ Backend funcionando correctamente")
        else:
            print(f"   ❌ Backend con problemas: {health_response.status_code}")
            return
        
        # 2. Obtener todas las resoluciones
        print("\n2. 📋 OBTENIENDO TODAS LAS RESOLUCIONES...")
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error al obtener resoluciones: {resoluciones_response.status_code}")
            return
        
        resoluciones = resoluciones_response.json()
        print(f"   ✅ Total resoluciones en sistema: {len(resoluciones)}")
        
        # 3. Filtrar resoluciones PADRE
        resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        print(f"   📊 Resoluciones PADRE encontradas: {len(resoluciones_padre)}")
        
        # 4. Agrupar por empresa
        empresas_con_padre = {}
        for resolucion in resoluciones_padre:
            empresa_id = resolucion.get('empresaId')
            if empresa_id:
                if empresa_id not in empresas_con_padre:
                    empresas_con_padre[empresa_id] = []
                empresas_con_padre[empresa_id].append(resolucion)
        
        print(f"   🏢 Empresas con resoluciones PADRE: {len(empresas_con_padre)}")
        
        # 5. Mostrar detalles por empresa
        print("\n3. 📊 DETALLES POR EMPRESA:")
        for empresa_id, resoluciones_empresa in empresas_con_padre.items():
            print(f"\n   🏢 Empresa ID: {empresa_id}")
            print(f"      📋 Resoluciones PADRE: {len(resoluciones_empresa)}")
            
            for i, resolucion in enumerate(resoluciones_empresa, 1):
                numero = resolucion.get('nroResolucion', 'Sin número')
                estado = resolucion.get('estado', 'Sin estado')
                activo = resolucion.get('estaActivo', False)
                fecha_fin = resolucion.get('fechaVigenciaFin')
                
                # Verificar si está vigente
                vigente = "❓"
                if fecha_fin:
                    try:
                        fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
                        vigente = "✅" if fecha_fin_dt > datetime.now() else "❌"
                    except:
                        vigente = "❓"
                
                print(f"      {i}. {numero}")
                print(f"         Estado: {estado} | Activo: {activo} | Vigente: {vigente}")
                if fecha_fin:
                    print(f"         Vence: {fecha_fin}")
        
        # 6. Verificar empresa específica (la que aparece en la imagen)
        print("\n4. 🎯 VERIFICACIÓN EMPRESA ESPECÍFICA:")
        
        # Buscar empresa por RUC o nombre que aparezca en los datos
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code == 200:
            empresas = empresas_response.json()
            print(f"   📊 Total empresas: {len(empresas)}")
            
            # Mostrar primeras empresas con resoluciones padre
            for empresa in empresas[:3]:
                empresa_id = empresa.get('id')
                if empresa_id in empresas_con_padre:
                    ruc = empresa.get('ruc', 'Sin RUC')
                    razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
                    resoluciones_count = len(empresas_con_padre[empresa_id])
                    
                    print(f"\n   🏢 {ruc} - {razon_social}")
                    print(f"      📋 Resoluciones PADRE disponibles: {resoluciones_count}")
                    
                    for resolucion in empresas_con_padre[empresa_id]:
                        numero = resolucion.get('nroResolucion', 'Sin número')
                        estado = resolucion.get('estado', 'Sin estado')
                        print(f"         • {numero} ({estado})")
        
        # 7. Simular llamada del frontend
        print("\n5. 🔄 SIMULANDO LLAMADA DEL FRONTEND:")
        
        # Tomar la primera empresa con resoluciones padre
        if empresas_con_padre:
            primera_empresa_id = list(empresas_con_padre.keys())[0]
            resoluciones_empresa = empresas_con_padre[primera_empresa_id]
            
            print(f"   🎯 Empresa ID: {primera_empresa_id}")
            print(f"   📋 Resoluciones PADRE disponibles para dropdown:")
            
            for i, resolucion in enumerate(resoluciones_empresa, 1):
                numero = resolucion.get('nroResolucion', 'Sin número')
                fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha fin')
                print(f"      {i}. {numero} - Vence: {fecha_fin}")
            
            print(f"\n   ✅ El dropdown debería mostrar {len(resoluciones_empresa)} opciones")
        else:
            print("   ❌ No hay empresas con resoluciones PADRE")
        
        # 8. Recomendaciones
        print("\n6. 💡 RECOMENDACIONES:")
        
        if len(resoluciones_padre) == 0:
            print("   ⚠️  No hay resoluciones PADRE en el sistema")
            print("   📝 Crear al menos una resolución PADRE para probar el dropdown")
        elif len(empresas_con_padre) == 0:
            print("   ⚠️  Las resoluciones PADRE no tienen empresaId válido")
            print("   🔧 Verificar relaciones entre resoluciones y empresas")
        else:
            print("   ✅ Hay resoluciones PADRE disponibles")
            print("   🔍 Verificar que el frontend esté llamando correctamente al endpoint")
            print("   🔍 Verificar que el filtrado por empresa funcione correctamente")
        
        print("\n" + "=" * 60)
        print("🎯 DIAGNÓSTICO COMPLETADO")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        print("💡 Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    diagnosticar_resoluciones_padre()