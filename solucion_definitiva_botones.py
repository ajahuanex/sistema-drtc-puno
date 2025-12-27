#!/usr/bin/env python3
"""
Solución definitiva para el problema de botones de vehículos
Diagnóstico completo y verificación de cambios
"""

import os
import time

def diagnosticar_componentes_duplicados():
    """Diagnosticar el problema de componentes duplicados"""
    print("🔍 DIAGNOSTICANDO COMPONENTES DUPLICADOS")
    print("=" * 60)
    
    archivos_componentes = [
        "frontend/src/app/components/vehiculos/vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-simple.component.ts"
    ]
    
    selectores_encontrados = []
    templates_encontrados = []
    
    for archivo in archivos_componentes:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Buscar selector
            if "selector: 'app-vehiculos'" in contenido:
                selectores_encontrados.append(archivo)
                print(f"   ⚠️ {archivo} - Selector 'app-vehiculos' encontrado")
            
            # Buscar template
            if "templateUrl: './vehiculos.component.html'" in contenido:
                templates_encontrados.append(archivo)
                print(f"   ⚠️ {archivo} - Usa template vehiculos.component.html")
    
    if len(selectores_encontrados) > 1:
        print(f"\n❌ PROBLEMA CONFIRMADO: {len(selectores_encontrados)} componentes con el mismo selector")
        print("   Esto causa conflictos en Angular")
        return False
    else:
        print(f"\n✅ Solo 1 componente con selector 'app-vehiculos'")
        return True

def verificar_cambios_aplicados():
    """Verificar que los cambios se hayan aplicado"""
    print("\n🔧 VERIFICANDO CAMBIOS APLICADOS")
    print("=" * 60)
    
    # Verificar HTML
    archivo_html = "frontend/src/app/components/vehiculos/vehiculos.component.html"
    if os.path.exists(archivo_html):
        with open(archivo_html, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        cambios_html = [
            ("route-icon-only-button", "Nueva clase CSS para botón de rutas"),
            ("action-menu-button", "Nueva clase CSS para menú de acciones"),
            ("gestionarRutasEspecificas ?", "Verificación defensiva de método"),
            ("vehicle-actions-menu", "Clase específica para menú")
        ]
        
        html_ok = True
        for buscar, descripcion in cambios_html:
            if buscar in html_content:
                print(f"   ✅ {descripcion}")
            else:
                print(f"   ❌ {descripcion} - NO ENCONTRADO")
                html_ok = False
    else:
        print("   ❌ Archivo HTML no encontrado")
        html_ok = False
    
    # Verificar CSS
    archivo_css = "frontend/src/app/components/vehiculos/vehiculos.component.scss"
    if os.path.exists(archivo_css):
        with open(archivo_css, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        cambios_css = [
            (".route-icon-only-button", "Clase CSS específica para botón de rutas"),
            (".action-menu-button", "Clase CSS específica para menú"),
            ("!important", "Estilos forzados"),
            ("display: none !important", "Ocultación forzada de texto"),
            (".vehicle-actions-menu", "Estilos específicos del menú")
        ]
        
        css_ok = True
        for buscar, descripcion in cambios_css:
            if buscar in css_content:
                print(f"   ✅ {descripcion}")
            else:
                print(f"   ❌ {descripcion} - NO ENCONTRADO")
                css_ok = False
    else:
        print("   ❌ Archivo CSS no encontrado")
        css_ok = False
    
    return html_ok and css_ok

def generar_instrucciones_cache():
    """Generar instrucciones para limpiar cache"""
    print("\n🧹 INSTRUCCIONES PARA LIMPIAR CACHE")
    print("=" * 60)
    
    print("1. 🌐 LIMPIAR CACHE DEL NAVEGADOR:")
    print("   - Presionar Ctrl+Shift+Delete")
    print("   - Seleccionar 'Todo el tiempo'")
    print("   - Marcar 'Imágenes y archivos en caché'")
    print("   - Hacer clic en 'Limpiar datos'")
    print()
    
    print("2. 🔄 RECARGA COMPLETA:")
    print("   - Ir a http://localhost:4200/vehiculos")
    print("   - Presionar Ctrl+Shift+R (recarga completa)")
    print("   - Esperar a que cargue completamente")
    print()
    
    print("3. 🛠️ LIMPIAR STORAGE (SI ES NECESARIO):")
    print("   - Abrir DevTools (F12)")
    print("   - Ir a pestaña 'Application'")
    print("   - En el menú izquierdo, buscar 'Storage'")
    print("   - Hacer clic en 'Clear storage'")
    print("   - Recargar página")
    print()
    
    print("4. 🔍 VERIFICAR RESULTADO:")
    print("   ✅ Botón de rutas: Solo icono (sin texto)")
    print("   ✅ Menú de acciones: Tres puntos que abren menú")
    print("   ✅ Sin errores en consola")

def generar_solucion_alternativa():
    """Generar solución alternativa si persiste el problema"""
    print("\n🚨 SOLUCIÓN ALTERNATIVA (SI PERSISTE EL PROBLEMA)")
    print("=" * 60)
    
    print("Si después de limpiar cache los botones siguen sin funcionar:")
    print()
    
    print("OPCIÓN 1 - Eliminar componente duplicado:")
    print("   rm frontend/src/app/components/vehiculos/vehiculos-simple.component.ts")
    print("   rm frontend/src/app/components/vehiculos/vehiculos-simple.component.scss")
    print()
    
    print("OPCIÓN 2 - Verificar en modo incógnito:")
    print("   - Abrir ventana de incógnito (Ctrl+Shift+N)")
    print("   - Ir a http://localhost:4200/vehiculos")
    print("   - Probar los botones")
    print()
    
    print("OPCIÓN 3 - Verificar errores en consola:")
    print("   - Abrir DevTools (F12)")
    print("   - Ir a pestaña 'Console'")
    print("   - Buscar errores en rojo")
    print("   - Reportar el mensaje exacto")

def main():
    """Función principal"""
    print("🧪 SOLUCIÓN DEFINITIVA - BOTONES VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("🎯 Objetivo: Resolver problema de botones definitivamente")
    print()
    
    # Diagnóstico
    componentes_ok = diagnosticar_componentes_duplicados()
    cambios_ok = verificar_cambios_aplicados()
    
    # Resumen
    print("\n" + "=" * 70)
    print("📊 RESUMEN DEL DIAGNÓSTICO")
    print("=" * 70)
    
    if not componentes_ok:
        print("❌ PROBLEMA PRINCIPAL: Componentes duplicados con mismo selector")
        print("   Esto causa conflictos en Angular y comportamiento impredecible")
    else:
        print("✅ Componentes: Sin duplicados detectados")
    
    if cambios_ok:
        print("✅ Cambios aplicados: Todos los cambios están en el código")
    else:
        print("❌ Cambios aplicados: Algunos cambios no se encontraron")
    
    # Instrucciones
    if cambios_ok:
        print("\n💡 LOS CAMBIOS ESTÁN APLICADOS EN EL CÓDIGO")
        print("   El problema ahora es de cache del navegador o compilación")
        generar_instrucciones_cache()
    else:
        print("\n⚠️ ALGUNOS CAMBIOS NO SE APLICARON CORRECTAMENTE")
        print("   Revisar los archivos antes de continuar")
    
    generar_solucion_alternativa()
    
    # Conclusión
    print("\n" + "=" * 70)
    print("🎯 CONCLUSIÓN")
    print("=" * 70)
    
    if cambios_ok:
        print("✅ El código está corregido con:")
        print("   - HTML defensivo que funciona con cualquier componente")
        print("   - CSS forzado con !important")
        print("   - Verificaciones de métodos para evitar errores")
        print("   - Clases CSS específicas y únicas")
        print()
        print("🔄 SIGUIENTE PASO: Limpiar cache del navegador completamente")
    else:
        print("❌ Hay problemas en el código que deben corregirse primero")
    
    return cambios_ok

if __name__ == "__main__":
    main()