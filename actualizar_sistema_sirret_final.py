#!/usr/bin/env python3
"""
Script final para actualizar TODAS las referencias de DRTC a SIRRET
Incluye archivos HTML, MD, Python, JavaScript, etc.
"""

import os
import re
from pathlib import Path

def actualizar_archivo(archivo_path, reemplazos):
    """Actualizar un archivo con los reemplazos especificados"""
    try:
        # Determinar encoding
        encodings = ['utf-8', 'latin-1', 'cp1252']
        contenido = None
        encoding_usado = None
        
        for encoding in encodings:
            try:
                with open(archivo_path, 'r', encoding=encoding) as f:
                    contenido = f.read()
                    encoding_usado = encoding
                    break
            except UnicodeDecodeError:
                continue
        
        if contenido is None:
            print(f"❌ No se pudo leer {archivo_path}")
            return False
        
        contenido_original = contenido
        
        for buscar, reemplazar in reemplazos.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding=encoding_usado) as f:
                f.write(contenido)
            print(f"✅ Actualizado: {archivo_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error en {archivo_path}: {e}")
        return False

def buscar_archivos_con_drtc():
    """Buscar todos los archivos que contienen DRTC"""
    archivos_con_drtc = []
    
    # Extensiones a buscar
    extensiones = ['.py', '.js', '.ts', '.html', '.md', '.bat', '.yml', '.yaml', '.json', '.txt', '.svg']
    
    for root, dirs, files in os.walk('.'):
        # Excluir directorios
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'dist', 'build']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensiones):
                archivo_path = os.path.join(root, file)
                try:
                    with open(archivo_path, 'r', encoding='utf-8', errors='ignore') as f:
                        contenido = f.read()
                        if 'DRTC' in contenido or 'drtc' in contenido:
                            archivos_con_drtc.append(archivo_path)
                except:
                    pass
    
    return archivos_con_drtc

def main():
    """Función principal"""
    print("🔄 ACTUALIZACIÓN FINAL DEL SISTEMA A SIRRET")
    print("=" * 50)
    
    # Definir reemplazos completos
    reemplazos = {
        # Nombres del sistema - variaciones
        "SIRRET": "SIRRET",
        "SIRRET": "SIRRET", 
        "Sistema SIRRET": "Sistema SIRRET",
        "Sistema SIRRET": "Sistema SIRRET",
        "Sistema de Gestión SIRRET": "Sistema Regional de Registros de Transporte (SIRRET)",
        "Sistema Regional de Registros de Transporte (SIRRET)": "Sistema Regional de Registros de Transporte (SIRRET)",
        "SISTEMA SIRRET": "SISTEMA SIRRET",
        "SISTEMA SIRRET": "SISTEMA SIRRET",
        "sistema-sirret": "sistema-sirret",
        "sistema-sirret": "sistema-sirret",
        "Dashboard SIRRET": "Dashboard SIRRET",
        "Dashboard SIRRET": "Dashboard SIRRET",
        
        # Base de datos
        "sirret_db": "sirret_db",
        "sirret_db": "sirret_db",
        "sirret_db": "sirret_db",
        "sirret-mongodb": "sirret-mongodb",
        "sirret-mongodb-local": "sirret-mongodb-local",
        "sirret-mongodb-data-local-v2": "sirret-mongodb-data-local-v2",
        "sirret-backend": "sirret-backend",
        "sirret-frontend": "sirret-frontend",
        
        # Emails y dominios
        "admin@sirret.gob.pe": "admin@sirret.gob.pe",
        "funcionario@sirret.gob.pe": "funcionario@sirret.gob.pe",
        "director@sirret.gob.pe": "director@sirret.gob.pe",
        "oficina@sirret.gob.pe": "oficina@sirret.gob.pe",
        "responsable@sirret.gob.pe": "responsable@sirret.gob.pe",
        
        # Selectores y componentes
        "sirret-data-table": "sirret-data-table",
        "ChatbotSIRRET": "ChatbotSIRRET",
        
        # Paths y rutas
        "d:/2025/KIRO3/sistema-sirret": "d:/2025/KIRO3/sistema-sirret",
        "sistema-sirret.git": "sistema-sirret.git",
        "ajahuanex/sistema-sirret": "ajahuanex/sistema-sirret",
        
        # Copyright y títulos
        "Copyright (c) 2025 SIRRET": "Copyright (c) 2025 SIRRET - Sistema Regional de Registros de Transporte",
        "Sistema SIRRET - Frontend": "Sistema SIRRET - Frontend",
        "Sistema SIRRET - Gestión de Transportes": "Sistema Regional de Registros de Transporte (SIRRET)",
        
        # Textos específicos
        "del sistema SIRRET": "del sistema SIRRET",
        "del SIRRET": "del SIRRET",
        "sistema SIRRET": "sistema SIRRET",
        "SIRRET": "SIRRET",
        "SIRRET": "SIRRET",
        
        # Ventanas y procesos
        '"Backend SIRRET"': '"Backend SIRRET"',
        '"Frontend SIRRET"': '"Frontend SIRRET"',
        "Backend SIRRET": "Backend SIRRET",
        "Frontend SIRRET": "Frontend SIRRET",
        
        # Despliegue
        "SISTEMA SIRRET - DESPLIEGUE LOCAL": "SISTEMA SIRRET - DESPLIEGUE LOCAL",
        "SISTEMA SIRRET - INICIO COMPLETO": "SISTEMA SIRRET - INICIO COMPLETO",
        "SISTEMA SIRRET - INICIO RAPIDO": "SISTEMA SIRRET - INICIO RAPIDO",
        
        # Documentación
        "Guía de Despliegue Local - Sistema SIRRET": "Guía de Despliegue Local - Sistema SIRRET",
        "INICIO RÁPIDO - SISTEMA SIRRET": "INICIO RÁPIDO - SISTEMA SIRRET",
        "Test Frontend Completo - Sistema SIRRET": "Test Frontend Completo - Sistema SIRRET",
        "Errores Adicionales Corregidos - SIRRET": "Errores Adicionales Corregidos - SIRRET",
        "Test Dashboard Corregido - SIRRET": "Test Dashboard Corregido - SIRRET",
        
        # Comentarios y autor
        "Sistema SIRRET": "Sistema SIRRET",
        "autor Sistema SIRRET": "autor Sistema SIRRET"
    }
    
    # Buscar todos los archivos que contienen DRTC
    print("🔍 Buscando archivos con referencias a DRTC...")
    archivos_con_drtc = buscar_archivos_con_drtc()
    
    print(f"📋 Encontrados {len(archivos_con_drtc)} archivos con referencias a DRTC")
    
    archivos_actualizados = 0
    
    for archivo in archivos_con_drtc:
        if actualizar_archivo(archivo, reemplazos):
            archivos_actualizados += 1
    
    print(f"\n✅ ACTUALIZACIÓN FINAL COMPLETADA")
    print(f"📊 Archivos actualizados: {archivos_actualizados}")
    print(f"📋 Total archivos procesados: {len(archivos_con_drtc)}")
    
    # Verificación final
    print(f"\n🔍 VERIFICACIÓN FINAL...")
    archivos_restantes = buscar_archivos_con_drtc()
    
    if len(archivos_restantes) == 0:
        print("✅ ¡PERFECTO! No quedan referencias a DRTC")
    else:
        print(f"⚠️  Aún quedan {len(archivos_restantes)} archivos con referencias a DRTC:")
        for archivo in archivos_restantes[:10]:  # Mostrar solo los primeros 10
            print(f"   - {archivo}")
        if len(archivos_restantes) > 10:
            print(f"   ... y {len(archivos_restantes) - 10} más")
    
    print(f"\n🎉 SISTEMA COMPLETAMENTE ACTUALIZADO A SIRRET")

if __name__ == "__main__":
    main()