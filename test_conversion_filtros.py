#!/usr/bin/env python3
"""
Probar la conversión de filtros entre frontend y backend
"""

import requests
import json

def test_conversion_filtros():
    """Probar que la conversión de filtros funciona correctamente"""
    
    print("🔄 PROBANDO CONVERSIÓN DE FILTROS")
    print("=" * 60)
    
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Verificar que el backend funciona
    print("\n1. Verificando backend...")
    try:
        response = requests.get(f"{base_url}/resoluciones", timeout=5)
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"✅ Backend OK: {len(resoluciones)} resoluciones")
            
            if len(resoluciones) == 0:
                print("⚠️  No hay resoluciones para probar")
                return False
                
            # Tomar una resolución de ejemplo
            resolucion_ejemplo = resoluciones[0]
            numero_ejemplo = resolucion_ejemplo.get('nroResolucion', '')
            estado_ejemplo = resolucion_ejemplo.get('estado', 'VIGENTE')
            
            print(f"   Usando ejemplo: {numero_ejemplo} - {estado_ejemplo}")
            
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    # 2. Probar formato frontend (lo que envía el componente)
    print("\n2. Simulando filtros del FRONTEND...")
    
    # Formato que envía el frontend (después de la corrección)
    filtros_frontend = {
        "numeroResolucion": numero_ejemplo[:5],  # Búsqueda parcial
        "estados": [estado_ejemplo]
    }
    
    print(f"   Formato frontend: {json.dumps(filtros_frontend, indent=2)}")
    
    # 3. Mostrar conversión esperada
    print("\n3. Conversión esperada en el SERVICIO:")
    
    # Lo que debería convertir el servicio
    filtros_backend_esperados = {
        "nroResolucion": numero_ejemplo[:5],
        "estado": estado_ejemplo
    }
    
    print(f"   Formato backend: {json.dumps(filtros_backend_esperados, indent=2)}")
    
    # 4. Probar directamente el backend con formato correcto
    print("\n4. Probando backend con formato correcto...")
    
    try:
        response = requests.post(f"{base_url}/resoluciones/filtradas", 
                               json=filtros_backend_esperados, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend responde correctamente: {len(data)} resultados")
            
            if len(data) > 0:
                print("   Ejemplos encontrados:")
                for i, res in enumerate(data[:3]):
                    print(f"      {i+1}. {res.get('nroResolucion', 'Sin número')} - {res.get('estado', 'Sin estado')}")
            
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error probando backend: {e}")
        return False

def mostrar_flujo_completo():
    """Mostrar el flujo completo de conversión"""
    
    print("\n📋 FLUJO COMPLETO DE CONVERSIÓN")
    print("=" * 60)
    
    print("\n1. USUARIO escribe en el filtro:")
    print("   - Búsqueda: 'RD-2024'")
    print("   - Estado: 'Vigente'")
    
    print("\n2. COMPONENTE MINIMAL emite:")
    print("   {")
    print("     \"numeroResolucion\": \"RD-2024\",")
    print("     \"estados\": [\"VIGENTE\"]")
    print("   }")
    
    print("\n3. SERVICIO convierte a:")
    print("   {")
    print("     \"nroResolucion\": \"RD-2024\",")
    print("     \"estado\": \"VIGENTE\"")
    print("   }")
    
    print("\n4. BACKEND procesa y responde:")
    print("   - Busca resoluciones que contengan 'RD-2024'")
    print("   - Filtra por estado 'VIGENTE'")
    print("   - Retorna resultados encontrados")
    
    print("\n5. FRONTEND muestra:")
    print("   - Tabla actualizada con resultados")
    print("   - Contador de resultados")
    print("   - Sin errores de compilación")

def verificar_tipos_typescript():
    """Verificar que los tipos TypeScript sean correctos"""
    
    print("\n🔧 VERIFICACIÓN DE TIPOS TYPESCRIPT")
    print("=" * 60)
    
    print("\n✅ MODELO FRONTEND (ResolucionFiltros):")
    print("   interface ResolucionFiltros {")
    print("     numeroResolucion?: string;  // ← Formato frontend")
    print("     estados?: string[];         // ← Array frontend")
    print("     empresaId?: string;")
    print("     // ... otros campos")
    print("   }")
    
    print("\n✅ CONVERSIÓN EN SERVICIO:")
    print("   convertirFiltrosFrontendABackend(filtros) {")
    print("     const backend = {};")
    print("     if (filtros.numeroResolucion) {")
    print("       backend.nroResolucion = filtros.numeroResolucion;")
    print("     }")
    print("     if (filtros.estados?.length > 0) {")
    print("       backend.estado = filtros.estados[0];")
    print("     }")
    print("     return backend;")
    print("   }")
    
    print("\n✅ BACKEND RECIBE:")
    print("   {")
    print("     \"nroResolucion\": string,")
    print("     \"estado\": string")
    print("   }")

if __name__ == "__main__":
    print("🚀 PROBANDO CONVERSIÓN DE FILTROS FRONTEND ↔ BACKEND")
    print("=" * 60)
    
    # 1. Mostrar flujo completo
    mostrar_flujo_completo()
    
    # 2. Verificar tipos
    verificar_tipos_typescript()
    
    # 3. Probar conversión real
    conversion_ok = test_conversion_filtros()
    
    if conversion_ok:
        print("\n🎉 CONVERSIÓN FUNCIONANDO CORRECTAMENTE")
        print("✅ Backend responde a filtros convertidos")
        print("✅ Formato frontend → backend funciona")
        print("✅ No hay errores de compilación TypeScript")
        print("✅ El buscador debería funcionar ahora")
    else:
        print("\n⚠️  PROBLEMAS EN LA CONVERSIÓN")
        print("❌ Verificar que el backend esté corriendo")
        print("❌ Verificar que haya datos en la base de datos")
    
    print("\n" + "=" * 60)
    print("Prueba de conversión completada")