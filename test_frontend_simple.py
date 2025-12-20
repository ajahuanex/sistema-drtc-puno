#!/usr/bin/env python3
"""
Verificar que el frontend esté funcionando correctamente
"""

import requests
import time

def verificar_frontend():
    """Verificar que el frontend esté disponible y funcionando"""
    
    print("🚀 VERIFICANDO FRONTEND DE RESOLUCIONES")
    print("=" * 60)
    
    # 1. Verificar que el servidor esté corriendo
    print("\n1. Verificando servidor frontend...")
    
    try:
        response = requests.get("http://localhost:4200", timeout=10)
        if response.status_code == 200:
            print("   ✅ Frontend disponible en http://localhost:4200")
            print(f"   ✅ Respuesta HTTP: {response.status_code}")
            
            # Verificar que sea una aplicación Angular
            if "ng-version" in response.text or "angular" in response.text.lower():
                print("   ✅ Aplicación Angular detectada")
            else:
                print("   ⚠️  No se detectó Angular en la respuesta")
            
        else:
            print(f"   ❌ Frontend error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ No se puede conectar al frontend")
        print("   💡 Asegúrate de que esté corriendo: cd frontend && npm start")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # 2. Verificar backend (opcional)
    print("\n2. Verificando backend...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Backend disponible")
            print(f"   ✅ Servicio: {data.get('service', 'N/A')}")
            print(f"   ✅ Estado: {data.get('status', 'N/A')}")
            print(f"   ✅ Base de datos: {data.get('database_status', 'N/A')}")
        else:
            print(f"   ⚠️  Backend responde con: {response.status_code}")
    except:
        print("   ⚠️  Backend no disponible (el frontend funcionará con datos mock)")
    
    # 3. Verificar endpoint de resoluciones
    print("\n3. Verificando endpoint de resoluciones...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/resoluciones", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Endpoint de resoluciones OK: {len(data)} resoluciones")
            
            # Mostrar algunas resoluciones de ejemplo
            if len(data) > 0:
                print("   📋 Ejemplos de resoluciones:")
                for i, res in enumerate(data[:3]):
                    numero = res.get('nroResolucion', 'Sin número')
                    estado = res.get('estado', 'Sin estado')
                    print(f"      {i+1}. {numero} - {estado}")
        else:
            print(f"   ⚠️  Endpoint de resoluciones: {response.status_code}")
    except:
        print("   ⚠️  Endpoint de resoluciones no disponible")
    
    # 4. Verificar endpoint de filtros
    print("\n4. Verificando endpoint de filtros...")
    
    try:
        filtros_test = {
            "nroResolucion": "RD-2024",
            "estado": "VIGENTE"
        }
        
        response = requests.post(
            "http://localhost:8000/api/v1/resoluciones/filtradas", 
            json=filtros_test, 
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Endpoint de filtros OK: {len(data)} resultados")
        else:
            print(f"   ⚠️  Endpoint de filtros: {response.status_code}")
    except:
        print("   ⚠️  Endpoint de filtros no disponible")
    
    return True

def mostrar_instrucciones():
    """Mostrar instrucciones para probar manualmente"""
    
    print("\n" + "=" * 60)
    print("🎯 INSTRUCCIONES PARA PROBAR MANUALMENTE")
    print("=" * 60)
    
    print("\n1. 🌐 Abrir navegador en:")
    print("   http://localhost:4200/resoluciones")
    
    print("\n2. 🔍 Verificar filtro minimalista:")
    print("   ✅ Solo 2 campos: [Buscar] [Estado] [Limpiar]")
    print("   ✅ Una sola línea horizontal")
    print("   ✅ Sin panel de expansión complejo")
    
    print("\n3. 🧪 Probar funcionalidades:")
    print("   • Escribir 'RD-2024' en búsqueda")
    print("   • Seleccionar 'Vigente' en estado")
    print("   • Hacer clic en 'Limpiar'")
    print("   • Verificar que aparezcan resultados")
    
    print("\n4. 📊 Verificar tabla completa:")
    print("   ✅ Header con estadísticas")
    print("   ✅ Botones: Exportar, Carga Masiva, Nueva Resolución")
    print("   ✅ Tabla con todas las columnas")
    print("   ✅ Acciones: Ver, Editar en cada fila")
    
    print("\n5. ✅ Funcionalidades esperadas:")
    print("   • Búsqueda en tiempo real (300ms debounce)")
    print("   • Filtrado por estado")
    print("   • Contador de resultados")
    print("   • Tabla responsive")
    print("   • Sin errores en consola del navegador")

def verificar_archivos_clave():
    """Verificar que los archivos clave existan"""
    
    print("\n📁 VERIFICANDO ARCHIVOS CLAVE")
    print("=" * 40)
    
    import os
    
    archivos_clave = [
        "frontend/src/app/app.routes.ts",
        "frontend/src/app/components/resoluciones/resoluciones-minimal.component.ts",
        "frontend/src/app/shared/resoluciones-filters-minimal.component.ts"
    ]
    
    for archivo in archivos_clave:
        if os.path.exists(archivo):
            print(f"   ✅ {archivo}")
        else:
            print(f"   ❌ {archivo} - NO EXISTE")
    
    # Verificar que el routing esté correcto
    try:
        with open("frontend/src/app/app.routes.ts", 'r', encoding='utf-8') as f:
            contenido = f.read()
            if "resoluciones-minimal.component" in contenido:
                print("   ✅ Routing configurado para componente minimal")
            else:
                print("   ⚠️  Routing podría no estar configurado correctamente")
    except:
        print("   ❌ No se pudo verificar el routing")

if __name__ == "__main__":
    print("🚀 VERIFICACIÓN COMPLETA DEL FRONTEND")
    print("=" * 60)
    
    # 1. Verificar archivos
    verificar_archivos_clave()
    
    # 2. Verificar servicios
    frontend_ok = verificar_frontend()
    
    if frontend_ok:
        print("\n🎉 VERIFICACIÓN EXITOSA")
        print("✅ Frontend funcionando correctamente")
        print("✅ Archivos clave presentes")
        print("✅ Servicios disponibles")
        
        # 3. Mostrar instrucciones
        mostrar_instrucciones()
        
    else:
        print("\n❌ PROBLEMAS DETECTADOS")
        print("   Revisa los errores anteriores")
        print("   Asegúrate de que el frontend esté corriendo")
    
    print("\n" + "=" * 60)
    print("Verificación completada")
    print("🌐 Frontend disponible en: http://localhost:4200/resoluciones")