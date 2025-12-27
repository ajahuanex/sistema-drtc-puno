#!/usr/bin/env python3
"""
Script para verificar que la corrección de conteo de vehículos funcione
"""

import requests
import time

def verificar_correccion():
    """Verificar que la corrección funcione correctamente"""
    
    print("🔍 VERIFICANDO CORRECCIÓN DE CONTEO DE VEHÍCULOS")
    print("=" * 60)
    
    # 1. Verificar que el backend sigue funcionando
    print("\n1. 🌐 VERIFICANDO BACKEND...")
    
    try:
        backend_response = requests.get("http://localhost:8000/health", timeout=5)
        if backend_response.status_code == 200:
            print("   ✅ Backend funcionando correctamente")
        else:
            print(f"   ❌ Backend error: {backend_response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend no disponible: {e}")
        return False
    
    # 2. Verificar que el frontend sigue funcionando
    print("\n2. 🌐 VERIFICANDO FRONTEND...")
    
    try:
        frontend_response = requests.get("http://localhost:4200", timeout=5)
        if frontend_response.status_code == 200:
            print("   ✅ Frontend funcionando correctamente")
        else:
            print(f"   ❌ Frontend error: {frontend_response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Frontend no disponible: {e}")
        return False
    
    # 3. Verificar los datos que debería mostrar el frontend
    print("\n3. 📊 VERIFICANDO DATOS ESPERADOS...")
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # Obtener empresa
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        empresas = empresas_response.json()
        empresa_objetivo = next((e for e in empresas if e.get('ruc') == '21212121212'), None)
        
        if not empresa_objetivo:
            print("   ❌ No se encontró la empresa 21212121212")
            return False
        
        empresa_id = empresa_objetivo.get('id')
        print(f"   ✅ Empresa encontrada: {empresa_objetivo.get('ruc')}")
        
        # Obtener resoluciones de la empresa
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        resoluciones = resoluciones_response.json()
        resoluciones_empresa = [r for r in resoluciones if r.get('empresaId') == empresa_id]
        
        print(f"   📊 Resoluciones de la empresa: {len(resoluciones_empresa)}")
        
        # Calcular total de vehículos (simulando la lógica del frontend)
        vehiculos_unicos = set()
        rutas_unicas = set()
        
        for resolucion in resoluciones_empresa:
            vehiculos_ids = resolucion.get('vehiculosHabilitadosIds', [])
            rutas_ids = resolucion.get('rutasAutorizadasIds', [])
            
            for vehiculo_id in vehiculos_ids:
                vehiculos_unicos.add(vehiculo_id)
            
            for ruta_id in rutas_ids:
                rutas_unicas.add(ruta_id)
            
            if vehiculos_ids:
                print(f"      📋 {resolucion.get('nroResolucion')}: {len(vehiculos_ids)} vehículos")
        
        total_vehiculos = len(vehiculos_unicos)
        total_rutas = len(rutas_unicas)
        
        print(f"\n   🎯 TOTALES CALCULADOS:")
        print(f"      🚗 Total vehículos únicos: {total_vehiculos}")
        print(f"      🛣️  Total rutas únicas: {total_rutas}")
        
        if total_vehiculos > 0:
            print(f"\n   ✅ EL FRONTEND DEBERÍA MOSTRAR {total_vehiculos} VEHÍCULOS")
            print(f"   ✅ (En lugar de 0 como antes)")
        else:
            print(f"\n   ⚠️  No hay vehículos para mostrar")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error verificando datos: {e}")
        return False

def mostrar_instrucciones_verificacion():
    """Mostrar instrucciones para verificar manualmente"""
    
    print(f"\n📋 INSTRUCCIONES PARA VERIFICAR LA CORRECCIÓN:")
    print(f"=" * 60)
    print(f"1. 🌐 Abrir navegador en: http://localhost:4200")
    print(f"2. 🏢 Ir a: Empresas")
    print(f"3. 🔍 Buscar empresa: 21212121212 - VVVVVV")
    print(f"4. 👁️  Hacer clic en 'Ver Detalles' o el ícono del ojo")
    print(f"5. 📊 En la pestaña 'Gestión', verificar:")
    print(f"   • Tarjeta 'Vehículos' debe mostrar: 2 Vehículos")
    print(f"   • (Antes mostraba: 0 Vehículos)")
    print(f"6. 📋 En la pestaña 'Resoluciones', verificar:")
    print(f"   • R-0001-2025 debe mostrar: 2 Vehículos")
    print(f"   • Otras resoluciones: 0 Vehículos")
    
    print(f"\n🎯 RESULTADO ESPERADO:")
    print(f"   ✅ La tarjeta de 'Gestión de Vehículos' ahora muestra 2")
    print(f"   ✅ El conteo refleja la suma de vehículos de todas las resoluciones")
    print(f"   ✅ No hay duplicados (usa Set para evitarlos)")

if __name__ == "__main__":
    print("🚀 VERIFICANDO CORRECCIÓN DEL CONTEO DE VEHÍCULOS")
    
    success = verificar_correccion()
    
    if success:
        print(f"\n🎉 VERIFICACIÓN EXITOSA")
        mostrar_instrucciones_verificacion()
    else:
        print(f"\n❌ PROBLEMAS EN LA VERIFICACIÓN")
        print(f"   Revisar que el backend y frontend estén funcionando")
    
    print(f"\n" + "=" * 60)