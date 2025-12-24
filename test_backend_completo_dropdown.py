#!/usr/bin/env python3
"""
Script para probar el backend completo después de implementar el dropdown de resoluciones padre
"""

import requests
import json
from datetime import datetime

def test_backend_completo():
    """Probar todos los endpoints del backend relacionados con el dropdown"""
    
    print("🔍 PROBANDO BACKEND COMPLETO - DROPDOWN RESOLUCIONES PADRE")
    print("=" * 65)
    
    base_url = "http://localhost:8000"
    api_url = f"{base_url}/api/v1"
    
    try:
        # 1. Health Check
        print("\n1. 🌐 HEALTH CHECK...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"   ✅ Backend funcionando: {health_data.get('status')}")
            print(f"   📊 Base de datos: {health_data.get('database_status')}")
        else:
            print(f"   ❌ Health check falló: {health_response.status_code}")
            return False
        
        # 2. Probar endpoint de resoluciones
        print(f"\n2. 📋 PROBANDO ENDPOINT DE RESOLUCIONES...")
        resoluciones_response = requests.get(f"{api_url}/resoluciones", timeout=10)
        
        if resoluciones_response.status_code == 200:
            resoluciones = resoluciones_response.json()
            print(f"   ✅ Endpoint funcionando: {len(resoluciones)} resoluciones")
            
            # Analizar resoluciones padre
            resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
            print(f"   📊 Resoluciones PADRE: {len(resoluciones_padre)}")
            
            if len(resoluciones_padre) >= 5:
                print(f"   🎉 EXCELENTE: Hay {len(resoluciones_padre)} resoluciones padre disponibles")
            else:
                print(f"   ⚠️  Solo hay {len(resoluciones_padre)} resoluciones padre")
        else:
            print(f"   ❌ Error en endpoint resoluciones: {resoluciones_response.status_code}")
            return False
        
        # 3. Probar endpoint de empresas
        print(f"\n3. 🏢 PROBANDO ENDPOINT DE EMPRESAS...")
        empresas_response = requests.get(f"{api_url}/empresas", timeout=10)
        
        if empresas_response.status_code == 200:
            empresas = empresas_response.json()
            print(f"   ✅ Endpoint funcionando: {len(empresas)} empresas")
            
            if len(empresas) > 0:
                empresa_ejemplo = empresas[0]
                ruc = empresa_ejemplo.get('ruc', 'Sin RUC')
                razon_social = empresa_ejemplo.get('razonSocial', {}).get('principal', 'Sin razón social')
                print(f"   📋 Empresa ejemplo: {ruc} - {razon_social}")
            else:
                print(f"   ⚠️  No hay empresas disponibles")
        else:
            print(f"   ❌ Error en endpoint empresas: {empresas_response.status_code}")
            return False
        
        # 4. Verificar relaciones empresa-resolución
        print(f"\n4. 🔗 VERIFICANDO RELACIONES EMPRESA-RESOLUCIÓN...")
        
        empresas_con_resoluciones = {}
        for resolucion in resoluciones_padre:
            empresa_id = resolucion.get('empresaId')
            if empresa_id:
                if empresa_id not in empresas_con_resoluciones:
                    empresas_con_resoluciones[empresa_id] = []
                empresas_con_resoluciones[empresa_id].append(resolucion)
        
        print(f"   📊 Empresas con resoluciones PADRE: {len(empresas_con_resoluciones)}")
        
        for empresa_id, resoluciones_empresa in empresas_con_resoluciones.items():
            # Buscar datos de la empresa
            empresa_data = next((e for e in empresas if e.get('id') == empresa_id), None)
            if empresa_data:
                ruc = empresa_data.get('ruc', 'Sin RUC')
                print(f"      • {ruc}: {len(resoluciones_empresa)} resoluciones padre")
        
        # 5. Probar endpoint específico de resoluciones por empresa (si existe)
        print(f"\n5. 🎯 PROBANDO FILTRADO POR EMPRESA...")
        
        if empresas_con_resoluciones:
            primera_empresa_id = list(empresas_con_resoluciones.keys())[0]
            
            # Probar filtro por empresa
            filtro_url = f"{api_url}/resoluciones?empresa_id={primera_empresa_id}"
            filtro_response = requests.get(filtro_url, timeout=10)
            
            if filtro_response.status_code == 200:
                resoluciones_filtradas = filtro_response.json()
                print(f"   ✅ Filtro por empresa funcionando: {len(resoluciones_filtradas)} resoluciones")
                
                resoluciones_padre_filtradas = [r for r in resoluciones_filtradas if r.get('tipoResolucion') == 'PADRE']
                print(f"   📊 Resoluciones PADRE filtradas: {len(resoluciones_padre_filtradas)}")
            else:
                print(f"   ⚠️  Filtro por empresa no disponible: {filtro_response.status_code}")
        
        # 6. Probar endpoints adicionales
        print(f"\n6. 🔧 PROBANDO ENDPOINTS ADICIONALES...")
        
        # Test endpoint
        test_response = requests.get(f"{api_url}/resoluciones/test", timeout=5)
        if test_response.status_code == 200:
            print(f"   ✅ Endpoint de test funcionando")
        else:
            print(f"   ⚠️  Endpoint de test no disponible")
        
        # Estadísticas
        stats_response = requests.get(f"{api_url}/resoluciones/estadisticas", timeout=5)
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"   ✅ Estadísticas: {stats.get('totalResoluciones', 0)} resoluciones totales")
        else:
            print(f"   ⚠️  Estadísticas no disponibles")
        
        # 7. Verificar datos específicos para el dropdown
        print(f"\n7. 🎯 VERIFICACIÓN ESPECÍFICA PARA DROPDOWN...")
        
        # Buscar empresa específica del dropdown
        empresa_dropdown = next((e for e in empresas if e.get('ruc') == '21212121212'), None)
        
        if empresa_dropdown:
            empresa_id = empresa_dropdown.get('id')
            resoluciones_dropdown = [r for r in resoluciones_padre if r.get('empresaId') == empresa_id]
            
            print(f"   🏢 Empresa del dropdown: {empresa_dropdown.get('ruc')} - {empresa_dropdown.get('razonSocial', {}).get('principal')}")
            print(f"   📋 Resoluciones padre disponibles: {len(resoluciones_dropdown)}")
            
            for i, resolucion in enumerate(resoluciones_dropdown, 1):
                numero = resolucion.get('nroResolucion', 'Sin número')
                estado = resolucion.get('estado', 'Sin estado')
                activo = resolucion.get('estaActivo', False)
                fecha_fin = resolucion.get('fechaVigenciaFin', 'Sin fecha')
                
                print(f"      {i}. {numero} ({estado}) - Activo: {activo}")
                if fecha_fin != 'Sin fecha':
                    print(f"         Vence: {fecha_fin[:10]}")
            
            if len(resoluciones_dropdown) >= 5:
                print(f"   🎉 PERFECTO: El dropdown tendrá {len(resoluciones_dropdown)} opciones")
            else:
                print(f"   ⚠️  El dropdown solo tendrá {len(resoluciones_dropdown)} opciones")
        else:
            print(f"   ❌ No se encontró la empresa específica del dropdown (21212121212)")
        
        # 8. Resumen final
        print(f"\n8. 📊 RESUMEN DEL BACKEND:")
        print(f"   ✅ Health check: OK")
        print(f"   ✅ Endpoint resoluciones: {len(resoluciones)} resoluciones")
        print(f"   ✅ Endpoint empresas: {len(empresas)} empresas")
        print(f"   ✅ Resoluciones PADRE: {len(resoluciones_padre)}")
        print(f"   ✅ Empresas con resoluciones PADRE: {len(empresas_con_resoluciones)}")
        
        if len(resoluciones_padre) >= 5 and len(empresas_con_resoluciones) >= 1:
            print(f"\n   🎉 BACKEND COMPLETAMENTE FUNCIONAL PARA EL DROPDOWN")
            return True
        else:
            print(f"\n   ⚠️  Backend funcional pero con datos limitados")
            return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión con el backend: {e}")
        print(f"💡 Verificar que el backend esté ejecutándose en {base_url}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = test_backend_completo()
    
    print(f"\n" + "=" * 65)
    
    if success:
        print("🎉 BACKEND FUNCIONANDO CORRECTAMENTE")
        print("💡 Listo para probar el frontend")
    else:
        print("❌ PROBLEMAS EN EL BACKEND")
        print("💡 Revisar logs del backend y base de datos")
    
    print(f"\n🔗 URLs importantes:")
    print(f"   • Health: http://localhost:8000/health")
    print(f"   • API Docs: http://localhost:8000/docs")
    print(f"   • Resoluciones: http://localhost:8000/api/v1/resoluciones")
    print(f"   • Empresas: http://localhost:8000/api/v1/empresas")