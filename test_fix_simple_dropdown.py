#!/usr/bin/env python3
"""
Test simple para verificar que el dropdown ahora funciona correctamente
"""

import requests
from datetime import datetime

def test_simple():
    """Test simple del filtrado"""
    print("🔧 TEST SIMPLE DEL FIX DEL DROPDOWN")
    print("=" * 50)
    
    empresa_id = "694186fec6302fb8566ba09e"
    
    # Test R-0003-2025 (4 rutas)
    print("1️⃣ Probando R-0003-2025:")
    res_id = "694187b1c6302fb8566ba0a0"
    url = f"http://localhost:8000/api/v1/rutas/empresa/{empresa_id}/resolucion/{res_id}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ {len(rutas)} rutas (esperadas: 4)")
            if len(rutas) == 4:
                print("   ✅ CORRECTO")
            else:
                print("   ❌ INCORRECTO")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test R-0005-2025 (1 ruta)
    print("\n2️⃣ Probando R-0005-2025:")
    res_id = "6941bb5d5e0d9aefe5627d84"
    url = f"http://localhost:8000/api/v1/rutas/empresa/{empresa_id}/resolucion/{res_id}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ {len(rutas)} rutas (esperadas: 1)")
            if len(rutas) == 1:
                print("   ✅ CORRECTO")
            else:
                print("   ❌ INCORRECTO")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n" + "=" * 50)
    print("🎯 AHORA PROBAR EN EL FRONTEND:")
    print("1. Ir a http://localhost:4200/rutas")
    print("2. Seleccionar empresa 'Paputec'")
    print("3. El dropdown debe mostrar:")
    print("   • R-0003-2025 (RENOVACION - PADRE)")
    print("   • R-0005-2025 (PRIMIGENIA - PADRE)")
    print("4. Seleccionar R-0003-2025 → 4 rutas")
    print("5. Seleccionar R-0005-2025 → 1 ruta")
    print("✅ Ahora debería funcionar correctamente!")

if __name__ == "__main__":
    test_simple()