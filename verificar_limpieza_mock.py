"""
Script para verificar que los datos mock fueron eliminados correctamente del DataManager
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.data_manager_service import get_data_manager

def verificar_limpieza():
    """Verificar que los datos mock fueron eliminados"""
    print("=" * 60)
    print("VERIFICACIÓN DE LIMPIEZA DE DATOS MOCK")
    print("=" * 60)
    
    dm = get_data_manager()
    
    # Verificar empresas (deben existir 3)
    print(f"\n✓ Empresas: {len(dm.empresas)} (esperado: 3)")
    if len(dm.empresas) == 3:
        print("  ✅ CORRECTO - Empresas de prueba mantenidas")
    else:
        print("  ❌ ERROR - Número incorrecto de empresas")
    
    # Verificar vehículos (deben estar vacíos)
    print(f"\n✓ Vehículos: {len(dm.vehiculos)} (esperado: 0)")
    if len(dm.vehiculos) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de vehículos")
        print(f"  Vehículos encontrados: {list(dm.vehiculos.keys())}")
    
    # Verificar conductores (deben estar vacíos)
    print(f"\n✓ Conductores: {len(dm.conductores)} (esperado: 0)")
    if len(dm.conductores) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de conductores")
        print(f"  Conductores encontrados: {list(dm.conductores.keys())}")
    
    # Verificar rutas (deben estar vacías)
    print(f"\n✓ Rutas: {len(dm.rutas)} (esperado: 0)")
    if len(dm.rutas) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de rutas")
        print(f"  Rutas encontradas: {list(dm.rutas.keys())}")
    
    # Verificar expedientes (deben estar vacíos)
    print(f"\n✓ Expedientes: {len(dm.expedientes)} (esperado: 0)")
    if len(dm.expedientes) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de expedientes")
        print(f"  Expedientes encontrados: {list(dm.expedientes.keys())}")
    
    # Verificar resoluciones (deben estar vacías)
    print(f"\n✓ Resoluciones: {len(dm.resoluciones)} (esperado: 0)")
    if len(dm.resoluciones) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de resoluciones")
        print(f"  Resoluciones encontradas: {list(dm.resoluciones.keys())}")
    
    # Verificar historial de validaciones (debe estar vacío)
    print(f"\n✓ Historial Validaciones: {len(dm.validaciones_historial)} (esperado: 0)")
    if len(dm.validaciones_historial) == 0:
        print("  ✅ CORRECTO - Datos mock eliminados")
    else:
        print("  ❌ ERROR - Aún hay datos mock de validaciones")
        print(f"  Validaciones encontradas: {list(dm.validaciones_historial.keys())}")
    
    # Verificar estadísticas
    print("\n" + "=" * 60)
    print("ESTADÍSTICAS GLOBALES")
    print("=" * 60)
    stats = dm.obtener_estadisticas_globales()
    
    print(f"\nEstadísticas Generales:")
    print(f"  - Total Empresas: {stats['estadisticas_generales']['total_empresas']}")
    print(f"  - Total Vehículos: {stats['estadisticas_generales']['total_vehiculos']}")
    print(f"  - Total Conductores: {stats['estadisticas_generales']['total_conductores']}")
    print(f"  - Total Rutas: {stats['estadisticas_generales']['total_rutas']}")
    print(f"  - Total Expedientes: {stats['estadisticas_generales']['total_expedientes']}")
    print(f"  - Total Resoluciones: {stats['estadisticas_generales']['total_resoluciones']}")
    print(f"  - Total Validaciones: {stats['estadisticas_generales']['total_validaciones']}")
    
    # Resultado final
    print("\n" + "=" * 60)
    total_mock = (len(dm.vehiculos) + len(dm.conductores) + len(dm.rutas) + 
                  len(dm.expedientes) + len(dm.resoluciones) + len(dm.validaciones_historial))
    
    if total_mock == 0 and len(dm.empresas) == 3:
        print("✅ LIMPIEZA EXITOSA - Todos los datos mock fueron eliminados")
        print("✅ Solo quedan las 3 empresas de prueba")
        return True
    else:
        print("❌ LIMPIEZA INCOMPLETA - Aún hay datos mock en el sistema")
        return False

if __name__ == "__main__":
    try:
        exitoso = verificar_limpieza()
        sys.exit(0 if exitoso else 1)
    except Exception as e:
        print(f"\n❌ ERROR durante la verificación: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
