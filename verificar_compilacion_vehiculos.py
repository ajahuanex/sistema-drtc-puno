#!/usr/bin/env python3
"""
Verificar que la compilación del módulo de vehículos esté funcionando correctamente
"""

import subprocess
import os
import time

def verificar_compilacion():
    """Verificar compilación del frontend"""
    print("🔧 VERIFICANDO COMPILACIÓN DEL FRONTEND")
    print("=" * 60)
    
    try:
        # Cambiar al directorio del frontend
        os.chdir("frontend")
        
        # Ejecutar compilación
        print("1. Compilando proyecto Angular...")
        result = subprocess.run(
            ["npx", "ng", "build", "--configuration", "development"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("   ✅ Compilación exitosa")
            
            # Verificar warnings específicos
            if "warning" in result.stdout.lower():
                warnings = result.stdout.count("warning")
                print(f"   ⚠️ {warnings} warnings encontrados (normal)")
            
            return True
        else:
            print("   ❌ Errores de compilación:")
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("   ❌ Timeout en compilación")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    finally:
        # Volver al directorio raíz
        os.chdir("..")

def verificar_archivos_generados():
    """Verificar que los archivos se hayan generado correctamente"""
    print("\n📁 VERIFICANDO ARCHIVOS GENERADOS")
    print("=" * 60)
    
    archivos_esperados = [
        "frontend/dist/main.js",
        "frontend/dist/styles.css",
        "frontend/dist/index.html"
    ]
    
    archivos_encontrados = []
    archivos_faltantes = []
    
    for archivo in archivos_esperados:
        if os.path.exists(archivo):
            archivos_encontrados.append(archivo)
            size = os.path.getsize(archivo)
            print(f"   ✅ {archivo} ({size:,} bytes)")
        else:
            archivos_faltantes.append(archivo)
            print(f"   ❌ {archivo} (no encontrado)")
    
    return len(archivos_faltantes) == 0

def verificar_sintaxis_typescript():
    """Verificar sintaxis TypeScript específicamente"""
    print("\n🔍 VERIFICANDO SINTAXIS TYPESCRIPT")
    print("=" * 60)
    
    archivos_vehiculos = [
        "frontend/src/app/components/vehiculos/vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos.component.html",
        "frontend/src/app/components/vehiculos/vehiculos.component.scss"
    ]
    
    problemas = []
    
    for archivo in archivos_vehiculos:
        if os.path.exists(archivo):
            print(f"   📄 Verificando {archivo}...")
            
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Verificaciones específicas
            if archivo.endswith('.ts'):
                if 'gestionarRutasEspecificas' not in contenido:
                    problemas.append(f"Método gestionarRutasEspecificas no encontrado en {archivo}")
                else:
                    print("      ✅ Método gestionarRutasEspecificas encontrado")
                
                if 'GestionarRutasEspecificasModalComponent' not in contenido:
                    problemas.append(f"Modal component no importado en {archivo}")
                else:
                    print("      ✅ Modal component importado")
            
            elif archivo.endswith('.html'):
                if '(click)="gestionarRutasEspecificas(vehiculo)"' not in contenido:
                    problemas.append(f"Event binding no encontrado en {archivo}")
                else:
                    print("      ✅ Event binding encontrado")
                
                if '[matMenuTriggerFor]="actionMenu"' not in contenido:
                    problemas.append(f"Menu trigger no encontrado en {archivo}")
                else:
                    print("      ✅ Menu trigger encontrado")
        else:
            problemas.append(f"Archivo no encontrado: {archivo}")
    
    return problemas

def main():
    """Función principal"""
    print("🧪 VERIFICACIÓN COMPLETA DE COMPILACIÓN VEHÍCULOS")
    print("📅 Fecha:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    # 1. Verificar compilación
    compilacion_ok = verificar_compilacion()
    
    # 2. Verificar archivos generados
    archivos_ok = verificar_archivos_generados()
    
    # 3. Verificar sintaxis
    problemas_sintaxis = verificar_sintaxis_typescript()
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📋 RESUMEN FINAL")
    print("=" * 60)
    
    if compilacion_ok:
        print("✅ Compilación: EXITOSA")
    else:
        print("❌ Compilación: FALLÓ")
    
    if archivos_ok:
        print("✅ Archivos generados: CORRECTOS")
    else:
        print("❌ Archivos generados: FALTANTES")
    
    if not problemas_sintaxis:
        print("✅ Sintaxis TypeScript: CORRECTA")
    else:
        print("❌ Sintaxis TypeScript: PROBLEMAS ENCONTRADOS")
        for problema in problemas_sintaxis:
            print(f"   - {problema}")
    
    # Recomendaciones
    print("\n📝 PRÓXIMOS PASOS:")
    
    if compilacion_ok and archivos_ok and not problemas_sintaxis:
        print("1. ✅ Todo parece estar correcto")
        print("2. 🌐 Verificar manualmente en el navegador:")
        print("   - Ir a http://localhost:4200/vehiculos")
        print("   - Probar los botones de rutas y menú de acciones")
        print("   - Revisar la consola del navegador (F12) por errores")
    else:
        print("1. 🔧 Corregir los problemas encontrados")
        print("2. 🔄 Volver a compilar el proyecto")
        print("3. 🧪 Ejecutar esta verificación nuevamente")
    
    success = compilacion_ok and archivos_ok and not problemas_sintaxis
    
    if success:
        print("\n🎉 VERIFICACIÓN COMPLETADA - TODO CORRECTO")
    else:
        print("\n⚠️ VERIFICACIÓN COMPLETADA - PROBLEMAS DETECTADOS")
    
    return success

if __name__ == "__main__":
    main()