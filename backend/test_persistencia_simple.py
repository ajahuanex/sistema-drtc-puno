#!/usr/bin/env python3
"""
🗄️ PRUEBA SIMPLE DE PERSISTENCIA DE DATOS
==========================================

Este script verifica que los datos realmente persistan entre diferentes
importaciones y usos del DataManager.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.data_manager_service import get_data_manager

def test_persistencia():
    """Probar persistencia de datos"""
    
    print("🗄️ PRUEBA DE PERSISTENCIA DE DATOS")
    print("=" * 50)
    
    # Primera instancia
    print("\n📋 Primera instancia del DataManager:")
    dm1 = get_data_manager()
    print(f"   • Total empresas: {len(dm1.empresas)}")
    print(f"   • Total vehículos: {len(dm1.vehiculos)}")
    print(f"   • Total conductores: {len(dm1.conductores)}")
    
    # Agregar una empresa nueva
    print("\n📋 Agregando nueva empresa...")
    nueva_empresa = {
        "razonSocial": "Empresa de Prueba Persistencia S.A.C.",
        "ruc": "20999999999",
        "representanteLegal": "Test Persistencia",
        "telefono": "051-999999",
        "email": "test@persistencia.com",
        "direccion": "Av. Persistencia 123",
        "estado": "ACTIVO"
    }
    
    empresa_id = dm1.agregar_empresa(nueva_empresa)
    print(f"   ✅ Empresa agregada con ID: {empresa_id}")
    print(f"   • Total empresas después: {len(dm1.empresas)}")
    
    # Segunda instancia (debería ser la misma)
    print("\n📋 Segunda instancia del DataManager:")
    dm2 = get_data_manager()
    print(f"   • Total empresas: {len(dm2.empresas)}")
    print(f"   • Total vehículos: {len(dm2.vehiculos)}")
    print(f"   • Total conductores: {len(dm2.conductores)}")
    
    # Verificar que son la misma instancia
    print(f"\n🔍 ¿Son la misma instancia? {dm1 is dm2}")
    print(f"🔍 ¿Tienen los mismos datos? {len(dm1.empresas) == len(dm2.empresas)}")
    
    # Verificar que la empresa agregada existe en ambas
    empresa_existe_dm1 = empresa_id in dm1.empresas
    empresa_existe_dm2 = empresa_id in dm2.empresas
    
    print(f"🔍 ¿Empresa existe en dm1? {empresa_existe_dm1}")
    print(f"🔍 ¿Empresa existe en dm2? {empresa_existe_dm2}")
    
    if empresa_existe_dm1 and empresa_existe_dm2:
        print("✅ PERSISTENCIA EXITOSA: Los datos se mantienen entre instancias")
    else:
        print("❌ PERSISTENCIA FALLIDA: Los datos no se mantienen")
    
    # Tercera instancia después de importar nuevamente
    print("\n📋 Tercera instancia (nueva importación):")
    from app.services.data_manager_service import get_data_manager as get_dm_nuevo
    dm3 = get_dm_nuevo()
    
    print(f"   • Total empresas: {len(dm3.empresas)}")
    print(f"🔍 ¿Es la misma instancia que dm1? {dm1 is dm3}")
    print(f"🔍 ¿Empresa existe en dm3? {empresa_id in dm3.empresas}")
    
    # Estadísticas finales
    print("\n📊 ESTADÍSTICAS FINALES:")
    stats = dm3.obtener_estadisticas_globales()
    print(f"   • Total empresas: {stats['estadisticas_generales']['total_empresas']}")
    print(f"   • Total vehículos: {stats['estadisticas_generales']['total_vehiculos']}")
    print(f"   • Total conductores: {stats['estadisticas_generales']['total_conductores']}")
    print(f"   • Total operaciones: {len(dm3.log_operaciones)}")
    
    # Mostrar últimas operaciones
    print("\n📝 ÚLTIMAS OPERACIONES:")
    for i, op in enumerate(dm3.log_operaciones[-3:], 1):
        print(f"   {i}. [{op['timestamp']}] {op['tipo']}: {op['descripcion']}")
    
    return empresa_existe_dm1 and empresa_existe_dm2 and (empresa_id in dm3.empresas)

if __name__ == "__main__":
    resultado = test_persistencia()
    
    print("\n" + "=" * 50)
    if resultado:
        print("🎉 PRUEBA EXITOSA: Los datos persisten correctamente")
    else:
        print("💥 PRUEBA FALLIDA: Los datos no persisten")
    print("=" * 50)