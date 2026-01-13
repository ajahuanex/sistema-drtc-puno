#!/usr/bin/env python3
"""
Script para limpiar logs de debug del módulo de vehículos
"""

import os
import re
import glob

def limpiar_logs_archivo(archivo_path):
    """Limpiar logs de debug de un archivo específico"""
    
    print(f"🧹 Limpiando logs de: {archivo_path}")
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        # Patrones de logs a remover
        patrones_logs = [
            r'console\.log\([^)]*\);\s*\n?',
            r'console\.warn\([^)]*\);\s*\n?',
            r'console\.debug\([^)]*\);\s*\n?',
            r'console\.info\([^)]*\);\s*\n?',
            # Logs multilinea
            r'console\.log\(\s*`[^`]*`[^)]*\);\s*\n?',
            r'console\.log\(\s*\'[^\']*\'[^)]*\);\s*\n?',
            r'console\.log\(\s*\"[^\"]*\"[^)]*\);\s*\n?',
        ]
        
        # Aplicar cada patrón
        for patron in patrones_logs:
            contenido = re.sub(patron, '', contenido, flags=re.MULTILINE | re.DOTALL)
        
        # Limpiar líneas vacías excesivas
        contenido = re.sub(r'\n\s*\n\s*\n', '\n\n', contenido)
        
        # Solo escribir si hubo cambios
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            
            print(f"✅ Logs limpiados en: {archivo_path}")
            return True
        else:
            print(f"ℹ️ No se encontraron logs en: {archivo_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error procesando {archivo_path}: {e}")
        return False

def limpiar_tipos_any(archivo_path):
    """Corregir tipos 'any' por tipos más específicos"""
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        # Reemplazos de tipos any
        reemplazos = [
            (r': any\[\]', ': unknown[]'),
            (r': any\s*=', ': unknown ='),
            (r'\(.*?: any\)', lambda m: m.group(0).replace('any', 'unknown')),
        ]
        
        for patron, reemplazo in reemplazos:
            if callable(reemplazo):
                contenido = re.sub(patron, reemplazo, contenido)
            else:
                contenido = re.sub(patron, reemplazo, contenido)
        
        # Solo escribir si hubo cambios
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            
            print(f"✅ Tipos corregidos en: {archivo_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error corrigiendo tipos en {archivo_path}: {e}")
        return False

def main():
    """Función principal"""
    
    print("🚀 INICIANDO LIMPIEZA DEL MÓDULO DE VEHÍCULOS")
    print("=" * 50)
    
    # Buscar archivos del módulo de vehículos
    patron_archivos = "frontend/src/app/components/vehiculos/*.ts"
    archivos = glob.glob(patron_archivos)
    
    if not archivos:
        print("❌ No se encontraron archivos TypeScript en el módulo de vehículos")
        return
    
    print(f"📁 Encontrados {len(archivos)} archivos para procesar")
    
    archivos_logs_limpiados = 0
    archivos_tipos_corregidos = 0
    
    for archivo in archivos:
        print(f"\n📄 Procesando: {os.path.basename(archivo)}")
        
        # Limpiar logs
        if limpiar_logs_archivo(archivo):
            archivos_logs_limpiados += 1
        
        # Corregir tipos
        if limpiar_tipos_any(archivo):
            archivos_tipos_corregidos += 1
    
    # Resumen
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE LIMPIEZA")
    print("=" * 50)
    print(f"📁 Archivos procesados: {len(archivos)}")
    print(f"🧹 Archivos con logs limpiados: {archivos_logs_limpiados}")
    print(f"🔧 Archivos con tipos corregidos: {archivos_tipos_corregidos}")
    
    if archivos_logs_limpiados > 0 or archivos_tipos_corregidos > 0:
        print("\n✅ Limpieza completada exitosamente")
        print("💡 Recomendación: Compilar el proyecto para verificar que no hay errores")
    else:
        print("\nℹ️ No se realizaron cambios")

if __name__ == "__main__":
    main()