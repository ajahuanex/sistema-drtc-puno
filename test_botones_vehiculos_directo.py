#!/usr/bin/env python3
"""
Test directo de los botones del módulo de vehículos
Verifica que los elementos estén presentes en el HTML renderizado
"""

import requests
import time
import re
from urllib.parse import urljoin

def test_modulo_vehiculos_completo():
    """Test completo del módulo de vehículos"""
    
    print("🚗 TEST COMPLETO MÓDULO VEHÍCULOS")
    print("=" * 60)
    
    base_url = "http://localhost:4200"
    
    try:
        # 1. Verificar página principal
        print("1. Verificando página principal...")
        response = requests.get(base_url, timeout=10)
        if response.status_code != 200:
            print(f"   ❌ Error en página principal: {response.status_code}")
            return False
        print("   ✅ Página principal accesible")
        
        # 2. Verificar módulo de vehículos
        print("\n2. Verificando módulo de vehículos...")
        vehiculos_url = urljoin(base_url, "/vehiculos")
        response = requests.get(vehiculos_url, timeout=10)
        
        if response.status_code == 404:
            print("   ⚠️ Ruta /vehiculos no encontrada, probando rutas alternativas...")
            
            # Probar rutas alternativas
            rutas_alternativas = [
                "/",
                "/#/vehiculos",
                "/main/vehiculos"
            ]
            
            for ruta in rutas_alternativas:
                try:
                    alt_url = urljoin(base_url, ruta)
                    alt_response = requests.get(alt_url, timeout=5)
                    if alt_response.status_code == 200:
                        print(f"   ✅ Ruta alternativa funciona: {ruta}")
                        response = alt_response
                        break
                except:
                    continue
        
        html_content = response.text
        
        # 3. Análisis del HTML
        print("\n3. Analizando contenido HTML...")
        
        # Buscar elementos clave
        elementos_encontrados = {}
        
        # Título del módulo
        if re.search(r'veh[íi]culos\s+registrados', html_content, re.IGNORECASE):
            elementos_encontrados['titulo'] = True
            print("   ✅ Título 'VEHÍCULOS REGISTRADOS' encontrado")
        else:
            elementos_encontrados['titulo'] = False
            print("   ❌ Título no encontrado")
        
        # Tabla de datos
        if re.search(r'mat-table|<table', html_content, re.IGNORECASE):
            elementos_encontrados['tabla'] = True
            print("   ✅ Tabla de datos encontrada")
        else:
            elementos_encontrados['tabla'] = False
            print("   ❌ Tabla de datos no encontrada")
        
        # Botones de icono
        botones_icono = re.findall(r'mat-icon-button', html_content, re.IGNORECASE)
        if botones_icono:
            elementos_encontrados['botones_icono'] = len(botones_icono)
            print(f"   ✅ {len(botones_icono)} botones de icono encontrados")
        else:
            elementos_encontrados['botones_icono'] = 0
            print("   ❌ No se encontraron botones de icono")
        
        # Icono de rutas
        if re.search(r'route', html_content, re.IGNORECASE):
            elementos_encontrados['icono_rutas'] = True
            print("   ✅ Icono de rutas encontrado")
        else:
            elementos_encontrados['icono_rutas'] = False
            print("   ❌ Icono de rutas no encontrado")
        
        # Menú de acciones (three dots)
        if re.search(r'more_vert', html_content, re.IGNORECASE):
            elementos_encontrados['menu_acciones'] = True
            print("   ✅ Icono de menú (more_vert) encontrado")
        else:
            elementos_encontrados['menu_acciones'] = False
            print("   ❌ Icono de menú no encontrado")
        
        # Configuración de menú
        if re.search(r'matMenuTriggerFor|mat-menu', html_content, re.IGNORECASE):
            elementos_encontrados['config_menu'] = True
            print("   ✅ Configuración de menú encontrada")
        else:
            elementos_encontrados['config_menu'] = False
            print("   ❌ Configuración de menú no encontrada")
        
        # Métodos de JavaScript/TypeScript
        metodos_js = []
        if re.search(r'gestionarRutasEspecificas', html_content, re.IGNORECASE):
            metodos_js.append('gestionarRutasEspecificas')
        if re.search(r'verDetalle', html_content, re.IGNORECASE):
            metodos_js.append('verDetalle')
        if re.search(r'editarVehiculo', html_content, re.IGNORECASE):
            metodos_js.append('editarVehiculo')
        
        elementos_encontrados['metodos_js'] = metodos_js
        if metodos_js:
            print(f"   ✅ Métodos JS encontrados: {', '.join(metodos_js)}")
        else:
            print("   ❌ No se encontraron métodos JS")
        
        # 4. Verificar estructura específica de botones
        print("\n4. Verificando estructura específica de botones...")
        
        # Buscar patrones específicos de botones de rutas
        patron_boton_rutas = r'<button[^>]*mat-icon-button[^>]*>[\s\S]*?<mat-icon[^>]*>route</mat-icon>[\s\S]*?</button>'
        botones_rutas = re.findall(patron_boton_rutas, html_content, re.IGNORECASE | re.MULTILINE)
        
        if botones_rutas:
            print(f"   ✅ {len(botones_rutas)} botones de rutas específicos encontrados")
            
            # Verificar que no tengan texto adicional
            for i, boton in enumerate(botones_rutas[:3]):  # Solo los primeros 3
                if re.search(r'>\s*[a-zA-Z]+\s*<', boton):
                    print(f"   ⚠️ Botón {i+1} contiene texto (debería ser solo icono)")
                else:
                    print(f"   ✅ Botón {i+1} es solo icono (correcto)")
        else:
            print("   ❌ No se encontraron botones de rutas específicos")
        
        # Buscar patrones de menú de acciones
        patron_menu_acciones = r'<button[^>]*matMenuTriggerFor[^>]*>[\s\S]*?<mat-icon[^>]*>more_vert</mat-icon>[\s\S]*?</button>'
        menus_acciones = re.findall(patron_menu_acciones, html_content, re.IGNORECASE | re.MULTILINE)
        
        if menus_acciones:
            print(f"   ✅ {len(menus_acciones)} menús de acciones encontrados")
        else:
            print("   ❌ No se encontraron menús de acciones")
        
        # 5. Verificar referencias de template
        print("\n5. Verificando referencias de template...")
        
        # Verificar referencia correcta del menú
        if re.search(r'#actionMenu', html_content):
            print("   ✅ Referencia #actionMenu encontrada (correcto)")
        elif re.search(r'#menu[^A-Za-z]', html_content):
            print("   ⚠️ Referencia #menu encontrada (podría ser incorrecta)")
        else:
            print("   ❌ No se encontraron referencias de menú")
        
        # Verificar eventos de clic
        eventos_clic = []
        if re.search(r'\(click\)\s*=\s*["\']gestionarRutasEspecificas', html_content):
            eventos_clic.append('gestionarRutasEspecificas')
        if re.search(r'\(click\)\s*=\s*["\']verDetalle', html_content):
            eventos_clic.append('verDetalle')
        if re.search(r'\(click\)\s*=\s*["\']editarVehiculo', html_content):
            eventos_clic.append('editarVehiculo')
        
        if eventos_clic:
            print(f"   ✅ Eventos de clic encontrados: {', '.join(eventos_clic)}")
        else:
            print("   ❌ No se encontraron eventos de clic")
        
        # 6. Resumen y diagnóstico
        print("\n" + "=" * 60)
        print("📋 RESUMEN DEL ANÁLISIS")
        print("=" * 60)
        
        problemas = []
        
        if not elementos_encontrados.get('titulo', False):
            problemas.append("Título del módulo no encontrado")
        
        if not elementos_encontrados.get('tabla', False):
            problemas.append("Tabla de datos no encontrada")
        
        if elementos_encontrados.get('botones_icono', 0) == 0:
            problemas.append("No se encontraron botones de icono")
        
        if not elementos_encontrados.get('icono_rutas', False):
            problemas.append("Icono de rutas no encontrado")
        
        if not elementos_encontrados.get('menu_acciones', False):
            problemas.append("Icono de menú de acciones no encontrado")
        
        if not elementos_encontrados.get('config_menu', False):
            problemas.append("Configuración de menú no encontrada")
        
        if not elementos_encontrados.get('metodos_js'):
            problemas.append("Métodos JavaScript no encontrados")
        
        if problemas:
            print("❌ PROBLEMAS DETECTADOS:")
            for problema in problemas:
                print(f"   - {problema}")
        else:
            print("✅ NO SE DETECTARON PROBLEMAS MAYORES")
        
        # Recomendaciones específicas
        print("\n📝 RECOMENDACIONES:")
        
        if not elementos_encontrados.get('icono_rutas', False) or not elementos_encontrados.get('menu_acciones', False):
            print("1. Verificar que los iconos estén correctamente definidos:")
            print("   - <mat-icon>route</mat-icon> para rutas")
            print("   - <mat-icon>more_vert</mat-icon> para menú")
        
        if not elementos_encontrados.get('config_menu', False):
            print("2. Verificar configuración del menú:")
            print("   - [matMenuTriggerFor]=\"actionMenu\"")
            print("   - <mat-menu #actionMenu=\"matMenu\">")
        
        if not elementos_encontrados.get('metodos_js'):
            print("3. Verificar que los métodos estén implementados en el componente:")
            print("   - gestionarRutasEspecificas(vehiculo)")
            print("   - verDetalle(vehiculo), editarVehiculo(vehiculo), etc.")
        
        print("\n4. Para probar manualmente:")
        print("   - Abrir http://localhost:4200/vehiculos en el navegador")
        print("   - Abrir DevTools (F12) y revisar la consola")
        print("   - Hacer clic en los botones y verificar errores")
        
        return len(problemas) == 0
        
    except Exception as e:
        print(f"\n❌ ERROR DURANTE EL TEST: {e}")
        return False

def main():
    """Función principal"""
    print("🧪 TEST DIRECTO DE BOTONES MÓDULO VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    success = test_modulo_vehiculos_completo()
    
    if success:
        print("\n🎉 TEST COMPLETADO - ESTRUCTURA CORRECTA")
        print("💡 Si los botones aún no funcionan, el problema podría estar en:")
        print("   - Eventos JavaScript no vinculados correctamente")
        print("   - Errores en la consola del navegador")
        print("   - Problemas de compilación en tiempo de ejecución")
    else:
        print("\n⚠️ TEST COMPLETADO - SE DETECTARON PROBLEMAS")
        print("🔧 Revisar las recomendaciones anteriores para solucionarlos")
    
    return success

if __name__ == "__main__":
    main()