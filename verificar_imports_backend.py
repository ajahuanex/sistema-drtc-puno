#!/usr/bin/env python3
"""
Verificar que no haya errores de importación en el backend
"""

import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("🔍 Verificando importaciones del backend...")
print()

try:
    print("1. Importando app.main...")
    import app.main
    print("   ✅ app.main OK")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

try:
    print("2. Importando app.models...")
    import app.models
    print("   ✅ app.models OK")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

try:
    print("3. Importando app.routers...")
    import app.routers
    print("   ✅ app.routers OK")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print()
print("✅ Todas las importaciones OK")
print()
print("Ahora puedes iniciar el backend:")
print("  cd backend")
print("  python -m uvicorn app.main:app --reload --port 8000")
