#!/usr/bin/env python3
"""
Script para probar el frontend de carga masiva de rutas
"""
import webbrowser
import time
import subprocess
import sys
import os

def verificar_backend():
    """Verificar que el backend esté corriendo"""
    import requests
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        return response.status_code == 200
    except:
        return False

def verificar_frontend():
    """Verificar que el frontend esté corriendo"""
    import requests
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    print("🧪 TESTING FRONTEND CARGA MASIVA DE RUTAS")
    print("=" * 50)
    
    # 1. Verificar que el backend esté corriendo
    print("\n1️⃣ Verificando backend...")
    if verificar_backend():
        print("✅ Backend corriendo en http://localhost:8000")
    else:
        print("❌ Backend no está corriendo")
        print("💡 Inicie el backend con: python -m uvicorn main:app --reload")
        return
    
    # 2. Verificar que el frontend esté corriendo
    print("\n2️⃣ Verificando frontend...")
    if verificar_frontend():
        print("✅ Frontend corriendo en http://localhost:4200")
    else:
        print("❌ Frontend no está corriendo")
        print("💡 Inicie el frontend con: ng serve")
        return
    
    # 3. Crear datos de prueba
    print("\n3️⃣ Creando datos de prueba...")
    try:
        import pandas as pd
        from crear_datos_prueba_rutas import crear_datos_prueba_rutas
        archivo_prueba = crear_datos_prueba_rutas()
        print(f"✅ Datos de prueba creados: {archivo_prueba}")
    except Exception as e:
        print(f"⚠️ No se pudieron crear datos de prueba: {e}")
        print("💡 Puede crear manualmente un archivo Excel con datos de rutas")
    
    # 4. Abrir navegador con las páginas relevantes
    print("\n4️⃣ Abriendo páginas de prueba...")
    
    urls_prueba = [
        ("Carga Masiva de Rutas", "http://localhost:4200/rutas/carga-masiva"),
        ("Lista de Rutas", "http://localhost:4200/rutas"),
        ("API Docs (Backend)", "http://localhost:8000/docs"),
    ]
    
    for nombre, url in urls_prueba:
        print(f"🌐 Abriendo: {nombre}")
        webbrowser.open(url)
        time.sleep(1)  # Esperar un poco entre aperturas
    
    print("\n" + "=" * 50)
    print("🎯 PRUEBAS FRONTEND INICIADAS")
    print("\n📋 PÁGINAS ABIERTAS:")
    for nombre, url in urls_prueba:
        print(f"   • {nombre}: {url}")
    
    print("\n🧪 PASOS DE PRUEBA SUGERIDOS:")
    print("1. En la página de Carga Masiva:")
    print("   • Descargar la plantilla Excel")
    print("   • Subir el archivo de prueba creado")
    print("   • Validar los datos")
    print("   • Procesar la carga masiva")
    
    print("\n2. En la página de Lista de Rutas:")
    print("   • Verificar que aparezcan las nuevas rutas")
    print("   • Probar los filtros por empresa")
    print("   • Verificar la funcionalidad de búsqueda")
    
    print("\n3. En la API Docs:")
    print("   • Probar los endpoints de carga masiva:")
    print("     - GET /rutas/carga-masiva/plantilla")
    print("     - GET /rutas/carga-masiva/ayuda")
    print("     - POST /rutas/carga-masiva/validar-completo")
    print("     - POST /rutas/carga-masiva/procesar-completo")
    
    print("\n📁 ARCHIVOS GENERADOS:")
    if 'archivo_prueba' in locals():
        print(f"   • {archivo_prueba} (datos de prueba)")
    print("   • plantilla_rutas.xlsx (se descarga desde la app)")
    
    print("\n🔍 PUNTOS A VERIFICAR:")
    print("   ✓ Descarga de plantilla funciona")
    print("   ✓ Validación detecta errores correctamente")
    print("   ✓ Procesamiento crea rutas en la BD")
    print("   ✓ Interfaz es intuitiva y responsive")
    print("   ✓ Mensajes de error son claros")
    print("   ✓ Progreso se muestra correctamente")
    
    print("\n⚠️ NOTAS IMPORTANTES:")
    print("   • Actualice los IDs de empresa y resolución en el archivo de prueba")
    print("   • Verifique que tenga permisos de administrador")
    print("   • Los códigos de ruta deben ser únicos por resolución")
    
    input("\n🎯 Presione Enter cuando termine las pruebas...")
    print("✅ Pruebas completadas")

if __name__ == "__main__":
    main()