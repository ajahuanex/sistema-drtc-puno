#!/usr/bin/env python3
"""Script de prueba para verificar la instanciación de vehículos"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.mock_data import mock_service
from app.models.vehiculo import VehiculoInDB

def test_vehiculos():
    """Probar la instanciación de vehículos"""
    try:
        print("🔍 Probando instanciación de vehículos...")
        
        # Verificar si hay vehículos en el mock service
        print(f"📊 Total de vehículos en mock service: {len(mock_service.vehiculos)}")
        
        # Intentar acceder a los vehículos
        for vehiculo_id, vehiculo in mock_service.vehiculos.items():
            print(f"✅ Vehículo {vehiculo_id}: {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}")
        
        print("🎉 Todos los vehículos se instanciaron correctamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error al instanciar vehículos: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_vehiculos()
    sys.exit(0 if success else 1) 