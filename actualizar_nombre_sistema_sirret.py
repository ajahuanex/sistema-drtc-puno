#!/usr/bin/env python3
"""
Script para actualizar todas las referencias del sistema a SIRRET
"""

import os
import re
from pathlib import Path

def actualizar_archivo(archivo_path, cambios):
    """Actualizar un archivo con los cambios especificados"""
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        for patron, reemplazo in cambios:
            contenido = re.sub(patron, reemplazo, contenido, flags=re.IGNORECASE)
        
        if contenido != contenido_original:
            with open(archivo_path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Actualizado: {archivo_path}")
            return True
        else:
            return False
    except Exception as e:
        print(f"❌ Error actualizando {archivo_path}: {e}")
        return False

def main():
    """Función principal"""
    print("🔄 Actualizando referencias del sistema a SIRRET...")
    
    # Definir los cambios a realizar
    cambios = [
        # Nombres de base de datos
        (r'sirret_db', 'sirret_db'),
        (r'sirret_db', 'sirret_db'),
        (r'"sirret_db"', '"sirret_db"'),
        (r"'sirret_db'", "'sirret_db'"),
        
        # URLs y dominios
        (r'drtc-puno\.gob\.pe', 'sirret.gob.pe'),
        (r'api\.drtc-puno\.gob\.pe', 'api.sirret.gob.pe'),
        
        # Nombres de contenedores Docker
        (r'sirret-mongodb', 'sirret-mongodb'),
        
        # Variables de entorno
        (r'DRTC_PUNO', 'SIRRET'),
        (r'drtc-puno-secret', 'sirret-secret'),
        
        # Comentarios y documentación
        (r'Sistema.*DRTC.*Puno', 'Sistema Regional de Registros de Transporte (SIRRET)'),
        (r'DRTC.*Puno', 'SIRRET'),
        (r'Dirección Regional.*Puno', 'Sistema Regional de Registros de Transporte'),
    ]
    
    # Archivos a actualizar
    archivos_a_actualizar = [
        # Archivos de configuración de base de datos
        '.env.example',
        '.env.local.example',
        'backend/env.example',
        
        # Scripts de Python
        'activar_empresas.py',
        'activar_resolucion.py',
        'arreglar_empresas.py',
        'check_specific_id.py',
        'clear_expedientes_db.py',
        'corregir_empresaid_resolucion.py',
        'corregir_empresas_formato.py',
        
        # Archivos de Docker
        'backend/Dockerfile',
        'docker-compose.yml',
        'docker-compose.local.yml',
        
        # Archivos de documentación
        'ACTUALIZACION_MONGODB_EMPRESAS.md',
        'CAMBIAR_A_BASE_DATOS_REAL.md',
        'backend/CARGA_MASIVA_EMPRESAS.md',
        'backend/SISTEMA_DATOS_PERSISTENTES.md',
        'backend/LOGICA_VALIDACION_HIBRIDA.md',
        
        # Archivos de configuración del frontend
        'frontend/src/environments/environment.prod.ts',
        'frontend/src/app/components/oficinas/oficina-form.component.ts',
        'frontend/src/app/components/mesa-partes/mesa-partes.component.ts',
        'frontend/src/app/shared/empresa-selector.component.ts',
        'frontend/src/app/shared/resolucion-selector.component.ts',
        'frontend/src/app/services/flujo-trabajo.service.ts',
        
        # Archivos de modelos
        'backend/app/models/documento.py',
        'frontend/src/app/models/expediente.model.ts',
        
        # Archivos de especificaciones
        '.kiro/specs/integrate-unused-components/requirements.md',
        '.kiro/specs/integrate-unused-components/design.md',
        '.kiro/specs/mesa-partes-module/docs/INTEGRATION_GUIDE.md',
    ]
    
    archivos_actualizados = 0
    
    for archivo in archivos_a_actualizar:
        if os.path.exists(archivo):
            if actualizar_archivo(archivo, cambios):
                archivos_actualizados += 1
        else:
            print(f"⚠️  Archivo no encontrado: {archivo}")
    
    print(f"\n✅ Proceso completado. {archivos_actualizados} archivos actualizados.")
    print("\n📋 RESUMEN DE CAMBIOS:")
    print("• Nombre del sistema: SIRRET (Sistema Regional de Registros de Transporte)")
    print("• Base de datos: sirret_db")
    print("• Dominio: sirret.gob.pe")
    print("• Contenedores Docker: sirret-*")
    print("\n🔄 Recuerda:")
    print("1. Reiniciar los servicios para aplicar los cambios")
    print("2. Actualizar las variables de entorno si es necesario")
    print("3. Verificar que las conexiones de base de datos funcionen correctamente")

if __name__ == "__main__":
    main()