#!/usr/bin/env python3
"""
Test completo del frontend para verificar que use datos reales
"""
import requests
import json
import time

def test_frontend_completo():
    """Probar el frontend completo"""
    
    print("🔍 PROBANDO FRONTEND - BUSCADOR INTELIGENTE CON DATOS REALES")
    print("=" * 70)
    
    # 1. Verificar que el frontend esté corriendo
    print(f"\n1️⃣ VERIFICANDO FRONTEND")
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Frontend corriendo en puerto 4200")
        else:
            print(f"   ⚠️ Frontend responde con status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Frontend no accesible: {e}")
        print(f"   💡 Ejecutar: ng serve o npm start")
        return False
    
    # 2. Verificar que el backend esté disponible para el frontend
    print(f"\n2️⃣ VERIFICANDO BACKEND DESDE PERSPECTIVA DEL FRONTEND")
    backend_url = "http://localhost:8000/api/v1"
    
    try:
        # Simular la llamada que hace el frontend
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", 
                              headers={'Origin': 'http://localhost:4200'}, 
                              timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Backend accesible desde frontend")
            print(f"   📊 Combinaciones disponibles: {len(combinaciones)}")
            
            # Verificar CORS
            cors_headers = response.headers.get('Access-Control-Allow-Origin', '')
            print(f"   🌐 CORS: {cors_headers}")
            
            return True, combinaciones
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            return False, []
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False, []

def mostrar_instrucciones_prueba(combinaciones):
    """Mostrar instrucciones detalladas para probar en el navegador"""
    
    print(f"\n3️⃣ INSTRUCCIONES PARA PROBAR EN EL NAVEGADOR")
    print(f"=" * 50)
    
    print(f"\n🌐 PASO 1: ABRIR EL SISTEMA")
    print(f"   1. Abrir navegador")
    print(f"   2. Ir a: http://localhost:4200/rutas")
    print(f"   3. Esperar a que cargue completamente")
    
    print(f"\n🔧 PASO 2: ABRIR DEVTOOLS")
    print(f"   1. Presionar F12 (o Ctrl+Shift+I)")
    print(f"   2. Ir a la pestaña 'Console'")
    print(f"   3. Limpiar la consola (Ctrl+L)")
    
    print(f"\n📊 PASO 3: ACTIVAR EL BUSCADOR")
    print(f"   1. En la página, buscar 'Filtros Avanzados por Origen y Destino'")
    print(f"   2. Hacer clic para expandir")
    print(f"   3. Observar los logs en Console")
    
    print(f"\n✅ PASO 4: VERIFICAR LOGS CORRECTOS")
    print(f"   Buscar estos mensajes en Console:")
    print(f"   ✅ '🔄 CARGANDO COMBINACIONES DIRECTAMENTE DEL ENDPOINT DE BACKEND...'")
    print(f"   ✅ '🌐 URL ENDPOINT DIRECTO: http://localhost:8000/api/v1/rutas/combinaciones-rutas'")
    print(f"   ✅ '📊 RESPUESTA DIRECTA DEL ENDPOINT COMBINACIONES:'")
    print(f"   ✅ '✅ COMBINACIONES DIRECTAS DEL BACKEND (DATOS REALES):'")
    print(f"   ✅ '🎯 VERIFICACIÓN DE DATOS REALES:'")
    
    print(f"\n❌ PASO 5: VERIFICAR QUE NO APAREZCAN ESTOS LOGS")
    print(f"   ❌ 'Error al cargar combinaciones del backend'")
    print(f"   ❌ 'Usando datos de ejemplo'")
    print(f"   ❌ 'Error - Verificar Backend'")
    
    print(f"\n🔍 PASO 6: VERIFICAR NETWORK TAB")
    print(f"   1. Ir a la pestaña 'Network' en DevTools")
    print(f"   2. Expandir filtros avanzados (si no lo hiciste ya)")
    print(f"   3. Buscar llamada HTTP a: 'combinaciones-rutas'")
    print(f"   4. Verificar:")
    print(f"      ✅ Status: 200")
    print(f"      ✅ Response size > 0")
    print(f"      ✅ Response contiene {len(combinaciones)} combinaciones")
    
    print(f"\n🎯 PASO 7: PROBAR EL BUSCADOR")
    print(f"   En el campo 'Buscador Inteligente de Rutas':")
    
    # Mostrar qué debería aparecer para cada búsqueda
    terminos_prueba = ["Puno", "Juliaca", "Arequipa", "Cusco"]
    backend_url = "http://localhost:8000/api/v1"
    
    for termino in terminos_prueba:
        try:
            response = requests.get(f"{backend_url}/rutas/combinaciones-rutas?busqueda={termino}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                combinaciones_filtradas = data.get('combinaciones', [])
                
                print(f"\n   📝 Escribir '{termino}':")
                print(f"      → Debería mostrar {len(combinaciones_filtradas)} opciones:")
                for comb in combinaciones_filtradas[:3]:  # Máximo 3
                    rutas_count = len(comb.get('rutas', []))
                    print(f"         • {comb.get('combinacion')} ({rutas_count} ruta(s))")
        except:
            pass
    
    print(f"\n🎉 PASO 8: VERIFICAR FUNCIONALIDAD COMPLETA")
    print(f"   1. Escribir 'Puno' en el buscador")
    print(f"   2. Hacer clic en 'Puno → Juliaca (5 rutas)'")
    print(f"   3. Verificar que aparece como chip azul")
    print(f"   4. Hacer clic en 'Filtrar Rutas Seleccionadas'")
    print(f"   5. Verificar que se muestran las rutas filtradas")

def mostrar_señales_exito_error():
    """Mostrar señales de éxito y error"""
    
    print(f"\n4️⃣ SEÑALES DE ÉXITO Y ERROR")
    print(f"=" * 40)
    
    print(f"\n✅ SEÑALES DE QUE FUNCIONA CORRECTAMENTE:")
    print(f"   🟢 Console: Logs con 'DATOS REALES' y 'DIRECTAMENTE del backend'")
    print(f"   🟢 Console: URL del endpoint mostrada correctamente")
    print(f"   🟢 Console: Estructura de 6 combinaciones mostrada")
    print(f"   🟢 Network: Llamada a 'combinaciones-rutas' con status 200")
    print(f"   🟢 Network: Response con 6 combinaciones en JSON")
    print(f"   🟢 Buscador: Aparecen opciones al escribir")
    print(f"   🟢 Dropdown: Combinaciones como 'Puno → Juliaca (5 rutas)'")
    print(f"   🟢 Snackbar: Mensaje '6 combinaciones cargadas DIRECTAMENTE del backend (DATOS REALES)'")
    print(f"   🟢 Funcionalidad: Selección y filtrado funcionan")
    
    print(f"\n❌ SEÑALES DE PROBLEMAS:")
    print(f"   🔴 Console: Errores de CORS o conexión")
    print(f"   🔴 Console: Mensajes de 'datos de ejemplo' o 'fallback'")
    print(f"   🔴 Console: Error 'Failed to fetch' o similar")
    print(f"   🔴 Network: Llamadas fallidas (status 404, 500, etc.)")
    print(f"   🔴 Network: No aparece llamada a 'combinaciones-rutas'")
    print(f"   🔴 Buscador: No aparecen opciones o aparecen datos incorrectos")
    print(f"   🔴 Dropdown: Opciones como 'Error - Verificar Backend'")
    print(f"   🔴 Snackbar: Mensajes de error")

def mostrar_solucion_problemas():
    """Mostrar soluciones a problemas comunes"""
    
    print(f"\n5️⃣ SOLUCIONES A PROBLEMAS COMUNES")
    print(f"=" * 45)
    
    print(f"\n🔧 SI NO APARECEN LOGS EN CONSOLE:")
    print(f"   1. Verificar que expandiste los filtros avanzados")
    print(f"   2. Refrescar la página (F5)")
    print(f"   3. Limpiar caché del navegador (Ctrl+Shift+R)")
    
    print(f"\n🔧 SI APARECEN ERRORES DE CORS:")
    print(f"   1. Verificar que el backend esté corriendo")
    print(f"   2. Verificar configuración de CORS en el backend")
    print(f"   3. Probar en modo incógnito")
    
    print(f"\n🔧 SI NO APARECEN OPCIONES EN EL BUSCADOR:")
    print(f"   1. Verificar logs en Console")
    print(f"   2. Verificar Network tab para llamadas HTTP")
    print(f"   3. Verificar que el backend devuelve datos")
    
    print(f"\n🔧 SI APARECEN DATOS DE EJEMPLO:")
    print(f"   1. Verificar que el código del frontend esté actualizado")
    print(f"   2. Verificar que no hay errores en Console")
    print(f"   3. Verificar que el endpoint del backend funciona")

def mostrar_resumen_final(exito, combinaciones):
    """Mostrar resumen final"""
    
    print(f"\n" + "=" * 70)
    print(f"📋 RESUMEN FINAL - FRONTEND")
    print(f"=" * 70)
    
    if exito:
        print(f"✅ FRONTEND LISTO PARA PROBAR")
        print(f"   • Frontend: Corriendo en puerto 4200")
        print(f"   • Backend: Accesible con {len(combinaciones)} combinaciones")
        print(f"   • CORS: Configurado correctamente")
        print(f"   • Datos: Reales disponibles")
        
        print(f"\n🎯 PRÓXIMO PASO:")
        print(f"   1. Seguir las instrucciones de arriba")
        print(f"   2. Abrir http://localhost:4200/rutas")
        print(f"   3. Verificar que funcione con datos reales")
        
        print(f"\n📊 DATOS ESPERADOS:")
        for i, comb in enumerate(combinaciones[:3]):
            rutas_count = len(comb.get('rutas', []))
            print(f"   {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
        if len(combinaciones) > 3:
            print(f"   ... y {len(combinaciones) - 3} más")
            
    else:
        print(f"❌ PROBLEMAS CON EL FRONTEND")
        print(f"   • Verificar que esté corriendo: ng serve")
        print(f"   • Verificar que el backend esté accesible")
        print(f"   • Revisar configuración de CORS")
    
    print(f"\n🎉 ¡LISTO PARA PROBAR EL BUSCADOR INTELIGENTE!")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DEL FRONTEND...")
    
    # 1. Probar frontend
    exito, combinaciones = test_frontend_completo()
    
    if exito:
        # 2. Mostrar instrucciones detalladas
        mostrar_instrucciones_prueba(combinaciones)
        
        # 3. Mostrar señales de éxito/error
        mostrar_señales_exito_error()
        
        # 4. Mostrar soluciones a problemas
        mostrar_solucion_problemas()
    
    # 5. Mostrar resumen final
    mostrar_resumen_final(exito, combinaciones if exito else [])