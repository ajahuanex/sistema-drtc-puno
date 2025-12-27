#!/usr/bin/env python3
"""
Verificación rápida de las correcciones aplicadas a los botones
"""

import os
import time

def verificar_archivos_modificados():
    """Verificar que los archivos se hayan modificado correctamente"""
    print("🔍 VERIFICANDO ARCHIVOS MODIFICADOS")
    print("=" * 50)
    
    archivos_verificar = [
        ("frontend/src/app/components/vehiculos/vehiculos.component.html", "route-icon-button"),
        ("frontend/src/app/components/vehiculos/vehiculos.component.scss", ".route-icon-button")
    ]
    
    cambios_aplicados = True
    
    for archivo, buscar in archivos_verificar:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            if buscar in contenido:
                print(f"   ✅ {archivo} - Cambios aplicados")
            else:
                print(f"   ❌ {archivo} - Cambios NO encontrados")
                cambios_aplicados = False
        else:
            print(f"   ❌ {archivo} - Archivo no encontrado")
            cambios_aplicados = False
    
    return cambios_aplicados

def verificar_estructura_css():
    """Verificar estructura específica del CSS"""
    print("\n🎨 VERIFICANDO ESTRUCTURA CSS")
    print("=" * 50)
    
    archivo_css = "frontend/src/app/components/vehiculos/vehiculos.component.scss"
    
    if not os.path.exists(archivo_css):
        print("   ❌ Archivo CSS no encontrado")
        return False
    
    with open(archivo_css, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    verificaciones_css = [
        (".route-icon-button", "Clase específica para botón de rutas"),
        ("width: 40px !important", "Ancho fijo del botón"),
        ("height: 40px !important", "Alto fijo del botón"),
        ("span:not(.mat-icon)", "Ocultar texto adicional"),
        ("display: none !important", "Forzar ocultación"),
        (".mat-menu-panel", "Estilos del menú"),
        ("min-height: 44px", "Altura mínima de items del menú")
    ]
    
    css_correcto = True
    
    for buscar, descripcion in verificaciones_css:
        if buscar in contenido:
            print(f"   ✅ {descripcion}")
        else:
            print(f"   ❌ {descripcion} - NO ENCONTRADO")
            css_correcto = False
    
    return css_correcto

def verificar_estructura_html():
    """Verificar estructura del HTML"""
    print("\n📄 VERIFICANDO ESTRUCTURA HTML")
    print("=" * 50)
    
    archivo_html = "frontend/src/app/components/vehiculos/vehiculos.component.html"
    
    if not os.path.exists(archivo_html):
        print("   ❌ Archivo HTML no encontrado")
        return False
    
    with open(archivo_html, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    verificaciones_html = [
        ('class="route-icon-button"', "Clase CSS aplicada al botón"),
        ('<mat-icon>route</mat-icon>', "Icono de rutas"),
        ('[matMenuTriggerFor]="actionMenu"', "Trigger del menú"),
        ('#actionMenu="matMenu"', "Referencia del menú"),
        ('<mat-icon>more_vert</mat-icon>', "Icono de tres puntos")
    ]
    
    html_correcto = True
    
    for buscar, descripcion in verificaciones_html:
        if buscar in contenido:
            print(f"   ✅ {descripcion}")
        else:
            print(f"   ❌ {descripcion} - NO ENCONTRADO")
            html_correcto = False
    
    return html_correcto

def generar_instrucciones_prueba():
    """Generar instrucciones para probar los cambios"""
    print("\n📋 INSTRUCCIONES DE PRUEBA")
    print("=" * 50)
    
    print("1. 🔄 RECARGAR PÁGINA:")
    print("   - Ir a http://localhost:4200/vehiculos")
    print("   - Presionar Ctrl+F5 (recarga forzada)")
    print("   - Esperar a que cargue completamente")
    print()
    
    print("2. 🔍 VERIFICAR BOTÓN DE RUTAS:")
    print("   ✅ CORRECTO: Solo aparece icono de ruta")
    print("   ❌ INCORRECTO: Aparece texto 'Gestionar Rutas'")
    print("   🖱️ PROBAR: Hacer clic → debe abrir modal")
    print()
    
    print("3. 🔍 VERIFICAR MENÚ DE ACCIONES:")
    print("   ✅ CORRECTO: Solo aparece icono de tres puntos")
    print("   🖱️ PROBAR: Hacer clic → debe abrir menú desplegable")
    print("   📋 VERIFICAR: Menú muestra opciones (Ver Detalles, Editar, etc.)")
    print()
    
    print("4. 🛠️ SI HAY PROBLEMAS:")
    print("   - Abrir DevTools (F12)")
    print("   - Revisar pestaña 'Console' por errores")
    print("   - Revisar pestaña 'Network' por recursos no cargados")
    print("   - Reportar mensaje exacto del error")

def main():
    """Función principal"""
    print("🧪 VERIFICACIÓN CORRECCIÓN BOTONES VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("🎯 Objetivo: Confirmar que las correcciones se aplicaron")
    print()
    
    # Ejecutar verificaciones
    archivos_ok = verificar_archivos_modificados()
    css_ok = verificar_estructura_css()
    html_ok = verificar_estructura_html()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIONES")
    print("=" * 60)
    
    verificaciones = [
        ("Archivos Modificados", archivos_ok),
        ("Estructura CSS", css_ok),
        ("Estructura HTML", html_ok)
    ]
    
    total_ok = 0
    for nombre, resultado in verificaciones:
        if resultado:
            print(f"✅ {nombre}: CORRECTO")
            total_ok += 1
        else:
            print(f"❌ {nombre}: PROBLEMA")
    
    print(f"\n📈 RESULTADO: {total_ok}/{len(verificaciones)} verificaciones exitosas")
    
    # Conclusión
    if total_ok == len(verificaciones):
        print("\n🎉 TODAS LAS CORRECCIONES APLICADAS CORRECTAMENTE")
        print("💡 Los cambios están en el código. Ahora hay que probar en el navegador.")
        print()
        generar_instrucciones_prueba()
        return True
    else:
        print("\n⚠️ ALGUNAS CORRECCIONES NO SE APLICARON CORRECTAMENTE")
        print("🔧 Revisar los problemas antes de probar en el navegador")
        return False

if __name__ == "__main__":
    main()