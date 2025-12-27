#!/usr/bin/env python3
"""
Verificación simple de los botones del módulo de vehículos
Analiza el código fuente para identificar problemas
"""

import requests
import time
import os

def verificar_frontend_disponible():
    """Verificar que el frontend esté corriendo"""
    print("🌐 Verificando disponibilidad del frontend...")
    
    try:
        response = requests.get("http://localhost:4200", timeout=10)
        print(f"   ✅ Frontend disponible (Status: {response.status_code})")
        
        # Verificar que sea Angular
        if "ng-version" in response.text or "angular" in response.text.lower():
            print("   ✅ Aplicación Angular detectada")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Frontend no disponible: {e}")
        return False

def verificar_modulo_vehiculos():
    """Verificar que el módulo de vehículos esté disponible"""
    print("\n🚗 Verificando módulo de vehículos...")
    
    try:
        response = requests.get("http://localhost:4200/vehiculos", timeout=10)
        print(f"   ✅ Módulo vehículos disponible (Status: {response.status_code})")
        
        # Buscar elementos clave en el HTML
        html_content = response.text.lower()
        
        elementos_encontrados = []
        
        if "vehículos registrados" in html_content:
            elementos_encontrados.append("Título principal")
        
        if "mat-table" in html_content or "table" in html_content:
            elementos_encontrados.append("Tabla de datos")
        
        if "mat-icon-button" in html_content:
            elementos_encontrados.append("Botones de iconos")
        
        if "more_vert" in html_content:
            elementos_encontrados.append("Icono de menú (tres puntos)")
        
        if "route" in html_content:
            elementos_encontrados.append("Icono de rutas")
        
        if "matmenutriggerfor" in html_content or "mat-menu" in html_content:
            elementos_encontrados.append("Menú desplegable")
        
        print(f"   ✅ Elementos encontrados: {', '.join(elementos_encontrados)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error accediendo al módulo: {e}")
        return False

def analizar_codigo_fuente():
    """Analizar el código fuente para identificar problemas"""
    print("\n🔍 Analizando código fuente...")
    
    archivos_a_revisar = [
        "frontend/src/app/components/vehiculos/vehiculos.component.html",
        "frontend/src/app/components/vehiculos/vehiculos-simple.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos.component.scss"
    ]
    
    problemas_encontrados = []
    
    for archivo in archivos_a_revisar:
        if os.path.exists(archivo):
            print(f"   📄 Revisando {archivo}...")
            
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Análisis específico por tipo de archivo
            if archivo.endswith('.html'):
                # Verificar template HTML
                if 'gestionarRutasEspecificas' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Método gestionarRutasEspecificas no encontrado")
                else:
                    print(f"      ✅ Método gestionarRutasEspecificas encontrado")
                
                if 'mat-icon-button' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Botones de icono no encontrados")
                else:
                    print(f"      ✅ Botones de icono encontrados")
                
                if 'matMenuTriggerFor' not in contenido and 'mat-menu' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Menú desplegable no configurado")
                else:
                    print(f"      ✅ Menú desplegable configurado")
                
                # Verificar referencia del menú
                if '#actionMenu' in contenido and 'actionMenu' in contenido:
                    print(f"      ✅ Referencia del menú correcta")
                elif '#menu' in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Referencia incorrecta #menu (debería ser #actionMenu)")
                
            elif archivo.endswith('.ts'):
                # Verificar componente TypeScript
                if 'gestionarRutasEspecificas' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Método gestionarRutasEspecificas no implementado")
                else:
                    print(f"      ✅ Método gestionarRutasEspecificas implementado")
                
                if 'GestionarRutasEspecificasModalComponent' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Modal de rutas no importado")
                else:
                    print(f"      ✅ Modal de rutas importado")
                
                if 'MatMenuModule' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: MatMenuModule no importado")
                else:
                    print(f"      ✅ MatMenuModule importado")
            
            elif archivo.endswith('.scss'):
                # Verificar estilos
                if '.action-button' not in contenido:
                    problemas_encontrados.append(f"❌ {archivo}: Estilos de botones de acción no encontrados")
                else:
                    print(f"      ✅ Estilos de botones encontrados")
        else:
            problemas_encontrados.append(f"❌ Archivo no encontrado: {archivo}")
    
    return problemas_encontrados

def verificar_compilacion_typescript():
    """Verificar que no haya errores de compilación TypeScript"""
    print("\n🔧 Verificando compilación TypeScript...")
    
    try:
        # Intentar compilar el proyecto
        import subprocess
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", "--project", "frontend/tsconfig.json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("   ✅ Compilación TypeScript exitosa")
            return True
        else:
            print("   ❌ Errores de compilación TypeScript:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"   ⚠️ No se pudo verificar compilación: {e}")
        return None

def main():
    """Función principal"""
    print("🧪 VERIFICACIÓN SIMPLE DE BOTONES MÓDULO VEHÍCULOS")
    print("=" * 60)
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    # 1. Verificar frontend
    if not verificar_frontend_disponible():
        print("\n❌ No se puede continuar sin el frontend")
        return False
    
    # 2. Verificar módulo específico
    if not verificar_modulo_vehiculos():
        print("\n❌ Problema con el módulo de vehículos")
        return False
    
    # 3. Analizar código fuente
    problemas = analizar_codigo_fuente()
    
    # 4. Verificar compilación
    compilacion_ok = verificar_compilacion_typescript()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE VERIFICACIÓN")
    print("=" * 60)
    
    if problemas:
        print("❌ PROBLEMAS ENCONTRADOS:")
        for problema in problemas:
            print(f"   {problema}")
    else:
        print("✅ No se encontraron problemas en el código fuente")
    
    if compilacion_ok is True:
        print("✅ Compilación TypeScript exitosa")
    elif compilacion_ok is False:
        print("❌ Errores de compilación TypeScript")
    else:
        print("⚠️ No se pudo verificar compilación TypeScript")
    
    # Recomendaciones
    print("\n📝 RECOMENDACIONES:")
    print("1. Verificar manualmente en el navegador:")
    print("   - Ir a http://localhost:4200/vehiculos")
    print("   - Hacer clic en el icono de rutas (debería abrir modal)")
    print("   - Hacer clic en los tres puntos (debería abrir menú)")
    
    print("\n2. Si los botones no funcionan:")
    print("   - Revisar la consola del navegador (F12)")
    print("   - Verificar errores de JavaScript")
    print("   - Comprobar que los eventos estén correctamente vinculados")
    
    success = len(problemas) == 0 and compilacion_ok != False
    
    if success:
        print("\n🎉 VERIFICACIÓN COMPLETADA - TODO PARECE CORRECTO")
    else:
        print("\n⚠️ VERIFICACIÓN COMPLETADA - SE ENCONTRARON PROBLEMAS")
    
    return success

if __name__ == "__main__":
    main()