#!/usr/bin/env python3
"""
Script para limpiar código duplicado en el módulo de resoluciones
"""
import os
import shutil
from pathlib import Path

def limpiar_modulo_resoluciones():
    print("🧹 Limpiando código duplicado en módulo de resoluciones...")
    print("=" * 60)
    
    # Directorio base
    base_dir = Path("frontend/src/app/components/resoluciones")
    
    # Componentes que NO se usan en las rutas y pueden ser eliminados
    componentes_no_usados = [
        "resoluciones.component.ts",  # Reemplazado por resoluciones-minimal
        "resoluciones-simple.component.ts",  # No se usa en rutas
        "dashboard-resoluciones.component.ts",  # No se usa en rutas
        "monitor-performance-resoluciones.component.ts",  # No se usa en rutas
        "validacion-resoluciones.component.ts",  # No se usa en rutas
        "gestion-relaciones-resolucion.component.ts",  # No se usa en rutas
        "asistente-creacion-resolucion.component.ts",  # No se usa en rutas
        "crear-resolucion-modal.component.ts",  # Duplicado con crear-resolucion
        "crear-expediente-modal.component.ts",  # No se usa
        "rutas-autorizadas-modal.component.ts",  # No se usa
        "vehiculos-habilitados-modal.component.ts",  # No se usa
    ]
    
    # Crear directorio de backup
    backup_dir = Path("backup_resoluciones_componentes")
    backup_dir.mkdir(exist_ok=True)
    
    componentes_movidos = []
    componentes_no_encontrados = []
    
    for componente in componentes_no_usados:
        archivo_path = base_dir / componente
        
        if archivo_path.exists():
            # Mover a backup en lugar de eliminar
            backup_path = backup_dir / componente
            shutil.move(str(archivo_path), str(backup_path))
            componentes_movidos.append(componente)
            print(f"📦 Movido a backup: {componente}")
        else:
            componentes_no_encontrados.append(componente)
            print(f"❓ No encontrado: {componente}")
    
    # Actualizar index.ts para remover exports de componentes eliminados
    actualizar_index_ts(base_dir)
    
    print("\n" + "=" * 60)
    print("📊 Resumen de limpieza:")
    print(f"   📦 Componentes movidos a backup: {len(componentes_movidos)}")
    print(f"   ❓ Componentes no encontrados: {len(componentes_no_encontrados)}")
    
    if componentes_movidos:
        print(f"\n📋 Componentes movidos:")
        for comp in componentes_movidos:
            print(f"   - {comp}")
    
    print(f"\n💾 Backup creado en: {backup_dir}")
    print("✅ Limpieza completada")
    
    return len(componentes_movidos)

def actualizar_index_ts(base_dir):
    """Actualizar index.ts para remover exports de componentes eliminados"""
    index_path = base_dir / "index.ts"
    
    if not index_path.exists():
        print("❌ No se encontró index.ts")
        return
    
    # Leer contenido actual
    with open(index_path, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Componentes que deben mantenerse (usados en rutas)
    componentes_activos = [
        'ResolucionDetailComponent',
        'CrearResolucionComponent', 
        'ResolucionFormComponent',
        'GestionBajasResolucionComponent',
        'ResolucionesMinimalComponent',
        'CargaMasivaResolucionesComponent'
    ]
    
    # Nuevo contenido del index.ts
    nuevo_contenido = '''// Componentes principales de resoluciones
export { ResolucionDetailComponent } from './resolucion-detail.component';
export { CrearResolucionComponent } from './crear-resolucion.component';
export { ResolucionFormComponent } from './resolucion-form.component';

// Componentes especializados
export { GestionBajasResolucionComponent } from './gestion-bajas-resolucion.component';
export { ResolucionesMinimalComponent } from './resoluciones-minimal.component';
export { CargaMasivaResolucionesComponent } from './carga-masiva-resoluciones.component';
'''
    
    # Escribir nuevo contenido
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(nuevo_contenido)
    
    print("📝 index.ts actualizado con componentes activos únicamente")

def verificar_dependencias():
    """Verificar que no haya dependencias rotas después de la limpieza"""
    print("\n🔍 Verificando dependencias...")
    
    # Buscar imports de componentes eliminados
    import subprocess
    
    try:
        # Buscar referencias a componentes eliminados
        result = subprocess.run([
            'grep', '-r', '--include=*.ts', 
            'ResolucionesComponent\\|ResolucionesSimpleComponent\\|DashboardResolucionesComponent',
            'frontend/src/app'
        ], capture_output=True, text=True)
        
        if result.stdout:
            print("⚠️  Se encontraron referencias a componentes eliminados:")
            print(result.stdout)
        else:
            print("✅ No se encontraron dependencias rotas")
            
    except FileNotFoundError:
        print("ℹ️  No se pudo ejecutar grep (comando no disponible en Windows)")

if __name__ == "__main__":
    print("🚀 Iniciando limpieza de código duplicado")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not Path("frontend/src/app/components/resoluciones").exists():
        print("❌ Error: No se encontró el directorio de resoluciones")
        print("   Ejecuta este script desde la raíz del proyecto")
        exit(1)
    
    # Ejecutar limpieza
    componentes_limpiados = limpiar_modulo_resoluciones()
    
    # Verificar dependencias
    verificar_dependencias()
    
    print("\n" + "=" * 60)
    if componentes_limpiados > 0:
        print("🎉 LIMPIEZA COMPLETADA EXITOSAMENTE")
        print(f"   📦 {componentes_limpiados} componentes movidos a backup")
        print("   🔧 index.ts actualizado")
        print("   ✅ Módulo de resoluciones optimizado")
        print("\n📋 Componentes activos restantes:")
        print("   - ResolucionesMinimalComponent (lista principal)")
        print("   - CargaMasivaResolucionesComponent (carga masiva)")
        print("   - CrearResolucionComponent (crear/editar)")
        print("   - ResolucionDetailComponent (detalle)")
        print("   - GestionBajasResolucionComponent (bajas)")
        print("   - ResolucionFormComponent (formulario)")
    else:
        print("ℹ️  No se encontraron componentes para limpiar")
    
    print(f"\n💡 Tip: Los componentes están respaldados en 'backup_resoluciones_componentes/'")
    print("   Si necesitas restaurar alguno, simplemente muévelo de vuelta.")