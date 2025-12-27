#!/usr/bin/env python3
"""
Test final para verificar que los botones del módulo de vehículos funcionen
Sin usar npx ni build, solo verificación de estructura y disponibilidad
"""

import requests
import time
import os

def verificar_frontend_activo():
    """Verificar que el frontend esté corriendo"""
    print("🌐 VERIFICANDO FRONTEND ACTIVO")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend disponible en http://localhost:4200")
            return True
        else:
            print(f"   ❌ Frontend responde con código {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Frontend no disponible: {e}")
        return False

def verificar_estructura_archivos():
    """Verificar que los archivos necesarios existan"""
    print("\n📁 VERIFICANDO ESTRUCTURA DE ARCHIVOS")
    print("=" * 50)
    
    archivos_criticos = [
        "frontend/src/app/components/vehiculos/vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos.component.html", 
        "frontend/src/app/components/vehiculos/vehiculos.component.scss",
        "frontend/src/app/components/vehiculos/gestionar-rutas-especificas-modal.component.ts",
        "frontend/src/app/app.routes.ts"
    ]
    
    todos_existen = True
    
    for archivo in archivos_criticos:
        if os.path.exists(archivo):
            print(f"   ✅ {archivo}")
        else:
            print(f"   ❌ {archivo} - NO ENCONTRADO")
            todos_existen = False
    
    return todos_existen

def verificar_configuracion_componente():
    """Verificar configuración del componente principal"""
    print("\n🔧 VERIFICANDO CONFIGURACIÓN DEL COMPONENTE")
    print("=" * 50)
    
    archivo_ts = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    
    if not os.path.exists(archivo_ts):
        print("   ❌ Archivo TypeScript no encontrado")
        return False
    
    with open(archivo_ts, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    verificaciones = [
        ("gestionarRutasEspecificas", "Método para gestionar rutas"),
        ("GestionarRutasEspecificasModalComponent", "Import del modal"),
        ("MatMenuModule", "Import del módulo de menú"),
        ("'rutas-especificas'", "Configuración de columna de rutas"),
        ("label: 'RUTAS'", "Label correcto de columna")
    ]
    
    problemas = []
    
    for buscar, descripcion in verificaciones:
        if buscar in contenido:
            print(f"   ✅ {descripcion}")
        else:
            print(f"   ❌ {descripcion} - NO ENCONTRADO")
            problemas.append(descripcion)
    
    return len(problemas) == 0

def verificar_template_html():
    """Verificar template HTML"""
    print("\n📄 VERIFICANDO TEMPLATE HTML")
    print("=" * 50)
    
    archivo_html = "frontend/src/app/components/vehiculos/vehiculos.component.html"
    
    if not os.path.exists(archivo_html):
        print("   ❌ Archivo HTML no encontrado")
        return False
    
    with open(archivo_html, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    verificaciones = [
        ('(click)="gestionarRutasEspecificas(vehiculo)"', "Event binding de rutas"),
        ('[matMenuTriggerFor]="actionMenu"', "Trigger del menú"),
        ('#actionMenu="matMenu"', "Referencia del menú"),
        ('<mat-icon>route</mat-icon>', "Icono de rutas"),
        ('<mat-icon>more_vert</mat-icon>', "Icono de menú")
    ]
    
    problemas = []
    
    for buscar, descripcion in verificaciones:
        if buscar in contenido:
            print(f"   ✅ {descripcion}")
        else:
            print(f"   ❌ {descripcion} - NO ENCONTRADO")
            problemas.append(descripcion)
    
    return len(problemas) == 0

def verificar_rutas_angular():
    """Verificar configuración de rutas"""
    print("\n🛣️ VERIFICANDO RUTAS DE ANGULAR")
    print("=" * 50)
    
    archivo_rutas = "frontend/src/app/app.routes.ts"
    
    if not os.path.exists(archivo_rutas):
        print("   ❌ Archivo de rutas no encontrado")
        return False
    
    with open(archivo_rutas, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    if "path: 'vehiculos', component: VehiculosComponent" in contenido:
        print("   ✅ Ruta de vehículos configurada correctamente")
        return True
    else:
        print("   ❌ Ruta de vehículos no encontrada o mal configurada")
        return False

def generar_instrucciones_prueba():
    """Generar instrucciones para prueba manual"""
    print("\n📋 INSTRUCCIONES PARA PRUEBA MANUAL")
    print("=" * 50)
    
    print("1. 🌐 ABRIR EN NAVEGADOR:")
    print("   - Ir a: http://localhost:4200/vehiculos")
    print("   - Esperar a que cargue la tabla de vehículos")
    print()
    
    print("2. 🔍 VERIFICAR BOTÓN DE RUTAS:")
    print("   - En la columna 'RUTAS' debe aparecer solo un icono de ruta")
    print("   - NO debe aparecer texto como 'Gestionar Rutas'")
    print("   - Hacer clic en el icono → debe abrir modal de rutas específicas")
    print()
    
    print("3. 🔍 VERIFICAR MENÚ DE ACCIONES:")
    print("   - En la columna 'ACCIONES' debe aparecer icono de tres puntos")
    print("   - Hacer clic en los tres puntos → debe abrir menú desplegable")
    print("   - El menú debe mostrar opciones como 'Ver Detalles', 'Editar', etc.")
    print()
    
    print("4. 🛠️ SI HAY PROBLEMAS:")
    print("   - Abrir DevTools (F12)")
    print("   - Ir a pestaña 'Console'")
    print("   - Buscar errores en rojo")
    print("   - Reportar el mensaje exacto del error")
    print()
    
    print("5. ✅ RESULTADO ESPERADO:")
    print("   - Botón de rutas: Solo icono, funciona al hacer clic")
    print("   - Menú de acciones: Se abre al hacer clic en tres puntos")
    print("   - Sin errores en la consola del navegador")

def main():
    """Función principal"""
    print("🧪 TEST FINAL - BOTONES MÓDULO VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("🎯 Objetivo: Verificar que botones funcionen correctamente")
    print()
    
    # Ejecutar verificaciones
    frontend_ok = verificar_frontend_activo()
    archivos_ok = verificar_estructura_archivos()
    componente_ok = verificar_configuracion_componente()
    template_ok = verificar_template_html()
    rutas_ok = verificar_rutas_angular()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIONES")
    print("=" * 60)
    
    verificaciones = [
        ("Frontend Activo", frontend_ok),
        ("Estructura de Archivos", archivos_ok),
        ("Configuración Componente", componente_ok),
        ("Template HTML", template_ok),
        ("Rutas Angular", rutas_ok)
    ]
    
    total_ok = 0
    for nombre, resultado in verificaciones:
        if resultado:
            print(f"✅ {nombre}: CORRECTO")
            total_ok += 1
        else:
            print(f"❌ {nombre}: PROBLEMA")
    
    print(f"\n📈 RESULTADO: {total_ok}/{len(verificaciones)} verificaciones exitosas")
    
    # Conclusión y próximos pasos
    if total_ok == len(verificaciones):
        print("\n🎉 TODAS LAS VERIFICACIONES PASARON")
        print("💡 El código está correcto. Si los botones no funcionan:")
        print("   1. Verificar manualmente en el navegador")
        print("   2. Revisar la consola por errores JavaScript")
        print("   3. Confirmar que hay datos en la tabla")
        print()
        generar_instrucciones_prueba()
        return True
    else:
        print("\n⚠️ SE ENCONTRARON PROBLEMAS")
        print("🔧 Corregir los problemas antes de probar manualmente")
        return False

if __name__ == "__main__":
    main()