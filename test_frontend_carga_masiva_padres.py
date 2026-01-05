#!/usr/bin/env python3
"""
Script de prueba para verificar la implementación frontend de carga masiva de resoluciones padres
"""

import os
import subprocess
import sys

def verificar_archivos_frontend():
    """Verificar que todos los archivos frontend estén creados"""
    
    print("Verificando archivos frontend...")
    
    archivos_requeridos = [
        'frontend/src/app/components/resoluciones/carga-masiva-resoluciones-padres.component.ts',
        'frontend/src/app/components/resoluciones/carga-masiva-resoluciones-padres.component.html',
        'frontend/src/app/components/resoluciones/carga-masiva-resoluciones-padres.component.scss',
        'frontend/src/app/components/resoluciones/index.ts',
        'frontend/src/app/app.routes.ts',
        'frontend/src/app/services/resolucion.service.ts'
    ]
    
    archivos_faltantes = []
    archivos_existentes = []
    
    for archivo in archivos_requeridos:
        if os.path.exists(archivo):
            archivos_existentes.append(archivo)
            print(f"  ✓ {archivo}")
        else:
            archivos_faltantes.append(archivo)
            print(f"  ✗ {archivo}")
    
    print(f"\nResumen:")
    print(f"  Archivos existentes: {len(archivos_existentes)}")
    print(f"  Archivos faltantes: {len(archivos_faltantes)}")
    
    return len(archivos_faltantes) == 0

def verificar_contenido_archivos():
    """Verificar que los archivos tengan el contenido esperado"""
    
    print("\nVerificando contenido de archivos...")
    
    verificaciones = [
        {
            'archivo': 'frontend/src/app/components/resoluciones/carga-masiva-resoluciones-padres.component.ts',
            'contenido_esperado': ['CargaMasivaResolucionesPadresComponent', 'descargarPlantillaResolucionesPadres', 'procesarCargaMasivaResolucionesPadres']
        },
        {
            'archivo': 'frontend/src/app/components/resoluciones/carga-masiva-resoluciones-padres.component.html',
            'contenido_esperado': ['Carga Masiva de Resoluciones Padres', 'RESOLUCION_ASOCIADA', 'ESTADO']
        },
        {
            'archivo': 'frontend/src/app/services/resolucion.service.ts',
            'contenido_esperado': ['descargarPlantillaResolucionesPadres', 'validarArchivoResolucionesPadres', 'procesarCargaMasivaResolucionesPadres']
        },
        {
            'archivo': 'frontend/src/app/app.routes.ts',
            'contenido_esperado': ['carga-masiva-padres', 'CargaMasivaResolucionesPadresComponent']
        },
        {
            'archivo': 'frontend/src/app/components/resoluciones/index.ts',
            'contenido_esperado': ['CargaMasivaResolucionesPadresComponent']
        }
    ]
    
    errores = []
    
    for verificacion in verificaciones:
        archivo = verificacion['archivo']
        contenido_esperado = verificacion['contenido_esperado']
        
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_faltante = []
            for esperado in contenido_esperado:
                if esperado not in contenido:
                    contenido_faltante.append(esperado)
            
            if contenido_faltante:
                errores.append(f"{archivo}: Falta contenido {contenido_faltante}")
                print(f"  ✗ {archivo}: Falta {contenido_faltante}")
            else:
                print(f"  ✓ {archivo}: Contenido correcto")
                
        except Exception as e:
            errores.append(f"{archivo}: Error leyendo archivo - {str(e)}")
            print(f"  ✗ {archivo}: Error - {str(e)}")
    
    return len(errores) == 0, errores

def verificar_navegacion():
    """Verificar que la navegación esté configurada correctamente"""
    
    print("\nVerificando configuración de navegación...")
    
    try:
        # Verificar que el botón esté en el componente principal
        with open('frontend/src/app/components/resoluciones/resoluciones-minimal.component.ts', 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        elementos_navegacion = [
            'cargaMasivaResolucionesPadres()',
            'Carga Padres',
            '/resoluciones/carga-masiva-padres'
        ]
        
        navegacion_ok = True
        for elemento in elementos_navegacion:
            if elemento not in contenido:
                print(f"  ✗ Falta elemento de navegación: {elemento}")
                navegacion_ok = False
            else:
                print(f"  ✓ Elemento de navegación presente: {elemento}")
        
        return navegacion_ok
        
    except Exception as e:
        print(f"  ✗ Error verificando navegación: {str(e)}")
        return False

def verificar_backend_endpoints():
    """Verificar que los endpoints del backend estén implementados"""
    
    print("\nVerificando endpoints del backend...")
    
    try:
        with open('backend/app/routers/resoluciones_router.py', 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        endpoints_esperados = [
            '/padres/plantilla',
            '/padres/validar',
            '/padres/procesar',
            '/padres/reporte-estados'
        ]
        
        endpoints_ok = True
        for endpoint in endpoints_esperados:
            if endpoint in contenido:
                print(f"  ✓ Endpoint presente: {endpoint}")
            else:
                print(f"  ✗ Endpoint faltante: {endpoint}")
                endpoints_ok = False
        
        return endpoints_ok
        
    except Exception as e:
        print(f"  ✗ Error verificando endpoints: {str(e)}")
        return False

def main():
    """Función principal de verificación"""
    
    print("=== VERIFICACIÓN DE IMPLEMENTACIÓN FRONTEND ===")
    print("Carga Masiva de Resoluciones Padres")
    print("=" * 50)
    
    # Verificar archivos
    archivos_ok = verificar_archivos_frontend()
    
    # Verificar contenido
    contenido_ok, errores_contenido = verificar_contenido_archivos()
    
    # Verificar navegación
    navegacion_ok = verificar_navegacion()
    
    # Verificar backend
    backend_ok = verificar_backend_endpoints()
    
    # Resumen final
    print("\n" + "=" * 50)
    print("RESUMEN DE VERIFICACIÓN")
    print("=" * 50)
    
    print(f"Archivos frontend: {'✓ OK' if archivos_ok else '✗ ERROR'}")
    print(f"Contenido archivos: {'✓ OK' if contenido_ok else '✗ ERROR'}")
    print(f"Navegación: {'✓ OK' if navegacion_ok else '✗ ERROR'}")
    print(f"Endpoints backend: {'✓ OK' if backend_ok else '✗ ERROR'}")
    
    if not contenido_ok:
        print("\nErrores de contenido:")
        for error in errores_contenido:
            print(f"  - {error}")
    
    # Resultado final
    todo_ok = archivos_ok and contenido_ok and navegacion_ok and backend_ok
    
    if todo_ok:
        print("\n🎉 ¡IMPLEMENTACIÓN COMPLETA Y CORRECTA!")
        print("\nPróximos pasos:")
        print("1. Compilar el frontend: ng build")
        print("2. Probar la navegación: /resoluciones/carga-masiva-padres")
        print("3. Verificar que los endpoints del backend respondan")
        print("4. Probar la descarga de plantilla")
        print("5. Probar la carga de archivos")
        return True
    else:
        print("\n❌ HAY ERRORES EN LA IMPLEMENTACIÓN")
        print("Revise los errores mostrados arriba y corrija antes de continuar.")
        return False

if __name__ == "__main__":
    exito = main()
    sys.exit(0 if exito else 1)