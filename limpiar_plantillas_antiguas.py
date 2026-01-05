#!/usr/bin/env python3
"""
Script para limpiar plantillas antiguas y mantener solo las más recientes
"""

import os
import glob
from datetime import datetime

def limpiar_plantillas_antiguas():
    """Limpiar plantillas antiguas manteniendo solo las 3 más recientes"""
    
    print("Limpiando plantillas antiguas...")
    
    # Buscar archivos de plantillas
    patrones = [
        "plantilla_resoluciones_padres_*.xlsx",
        "plantilla_resoluciones_*.xlsx",
        "datos_prueba_resoluciones_*.json",
        "reporte_pruebas_resoluciones_*.json"
    ]
    
    for patron in patrones:
        archivos = glob.glob(patron)
        
        if len(archivos) <= 3:
            print(f"  {patron}: {len(archivos)} archivos, no se elimina ninguno")
            continue
        
        # Ordenar por fecha de modificación (más reciente primero)
        archivos_ordenados = sorted(archivos, key=os.path.getmtime, reverse=True)
        
        # Mantener solo los 3 más recientes
        archivos_a_eliminar = archivos_ordenados[3:]
        
        print(f"  {patron}: {len(archivos)} archivos encontrados")
        print(f"    Manteniendo: {len(archivos_ordenados[:3])} más recientes")
        print(f"    Eliminando: {len(archivos_a_eliminar)} antiguos")
        
        for archivo in archivos_a_eliminar:
            try:
                os.remove(archivo)
                print(f"    - Eliminado: {archivo}")
            except Exception as e:
                print(f"    - Error eliminando {archivo}: {str(e)}")
    
    print("Limpieza completada")

def mostrar_archivos_actuales():
    """Mostrar archivos actuales relacionados con plantillas"""
    
    print("\nArchivos actuales:")
    print("=" * 50)
    
    patrones = [
        "plantilla_*.xlsx",
        "*.md",
        "test_*.py",
        "crear_*.py"
    ]
    
    for patron in patrones:
        archivos = glob.glob(patron)
        if archivos:
            print(f"\n{patron}:")
            for archivo in sorted(archivos):
                tamaño = os.path.getsize(archivo) / 1024
                fecha = datetime.fromtimestamp(os.path.getmtime(archivo))
                print(f"  {archivo:<40} {tamaño:>6.1f} KB  {fecha.strftime('%Y-%m-%d %H:%M')}")

if __name__ == "__main__":
    limpiar_plantillas_antiguas()
    mostrar_archivos_actuales()