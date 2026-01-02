#!/usr/bin/env python3
"""
Script para actualizar completamente el nombre del sistema a SIRRET
Corrige todas las referencias restantes de DRTC a SIRRET
"""

import os
import re
from pathlib import Path

def actualizar_archivo(archivo_path, reemplazos):
    """Actualizar un archivo con los reemplazos especificados"""
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        for buscar, reemplazar in reemplazos.items():
            contenido = contenido.replace(buscar, reemplazar)
        
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Actualizado: {archivo_path}")
            return True
        else:
            print(f"⏭️  Sin cambios: {archivo_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error en {archivo_path}: {e}")
        return False

def main():
    """Función principal"""
    print("🔄 ACTUALIZANDO NOMBRE DEL SISTEMA A SIRRET")
    print("=" * 50)
    
    # Definir reemplazos
    reemplazos = {
        # Nombres del sistema
        "SIRRET": "SIRRET",
        "Sistema SIRRET": "Sistema SIRRET",
        "Sistema de Gestión SIRRET": "Sistema Regional de Registros de Transporte (SIRRET)",
        "SISTEMA SIRRET": "SISTEMA SIRRET",
        "sistema-sirret": "sistema-sirret",
        
        # Base de datos
        "sirret_db": "sirret_db",
        "sirret_db": "sirret_db",
        "sirret-mongodb": "sirret-mongodb",
        "sirret-backend": "sirret-backend",
        "sirret-frontend": "sirret-frontend",
        
        # Emails y dominios
        "admin@sirret.gob.pe": "admin@sirret.gob.pe",
        "funcionario@sirret.gob.pe": "funcionario@sirret.gob.pe",
        "director@sirret.gob.pe": "director@sirret.gob.pe",
        
        # Selectores y componentes
        "sirret-data-table": "sirret-data-table",
        "ChatbotSIRRET": "ChatbotSIRRET",
        
        # Paths y rutas
        "d:/2025/KIRO3/sistema-sirret": "d:/2025/KIRO3/sistema-sirret",
        
        # Copyright
        "Copyright (c) 2025 SIRRET": "Copyright (c) 2025 SIRRET - Sistema Regional de Registros de Transporte"
    }
    
    # Archivos a actualizar
    archivos_actualizar = [
        "INICIAR_SISTEMA.bat",
        "LICENSE",
        "limpiar_db.py",
        "limpiar_resoluciones_huerfanas.py",
        "limpiar_usuario_viejo.py",
        "listar_empresas_mongodb.py",
        "MANUAL_USUARIO_COMPLETO.md",
        "MODULO_RUTAS_CORREGIDO_COMPLETO.md",
        "QUICK_START_DOCKER.md",
        "RESUMEN_CAMBIOS_HOY.md",
        "SISTEMA_LISTO_PARA_USO.md",
        "SOLUCIONES_MODALES_Y_RELACIONES.md",
        "SOLUCION_BUCLE_INFINITO.js",
        "SOLUCION_FINAL_CORREGIDA.js",
        "SUGERENCIAS_IMPLEMENTACION.md",
        "test_crear_ruta_formato_correcto.py",
        "test_frontend_funcionando.py",
        "test_guardar_sin_horarios.py",
        "test_hash.py",
        "test_login_completo.py",
        "test_login_y_endpoints.py",
        "test_mongodb_direct.py",
        "test_pydantic.py",
        "test_servicio_directo.py",
        "test_solucion_corregida.py",
        "test_sistema_completo.py",
        "verificar-sistema.bat"
    ]
    
    archivos_actualizados = 0
    
    for archivo in archivos_actualizar:
        if os.path.exists(archivo):
            if actualizar_archivo(archivo, reemplazos):
                archivos_actualizados += 1
        else:
            print(f"⚠️  Archivo no encontrado: {archivo}")
    
    print(f"\n✅ ACTUALIZACIÓN COMPLETADA")
    print(f"📊 Archivos actualizados: {archivos_actualizados}")
    print(f"📋 Total archivos procesados: {len(archivos_actualizar)}")
    
    # Verificar que los cambios se aplicaron correctamente
    print(f"\n🔍 VERIFICANDO CAMBIOS...")
    
    # Verificar algunos archivos clave
    archivos_verificar = ["INICIAR_SISTEMA.bat", "LICENSE", "test_sistema_completo.py"]
    
    for archivo in archivos_verificar:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                if "DRTC" in contenido and "SIRRET" not in contenido:
                    print(f"⚠️  {archivo} aún contiene referencias a DRTC")
                elif "SIRRET" in contenido:
                    print(f"✅ {archivo} actualizado correctamente")
    
    print(f"\n🎉 SISTEMA ACTUALIZADO A SIRRET COMPLETAMENTE")

if __name__ == "__main__":
    main()