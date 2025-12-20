#!/usr/bin/env python3
"""
Verificación rápida del sistema completo
"""
import requests

def verificacion_rapida():
    """Verificación rápida de backend y preparación para frontend"""
    
    print("🔍 VERIFICACIÓN RÁPIDA DEL SISTEMA")
    print("=" * 50)
    
    # 1. Verificar backend
    print(f"\n1️⃣ BACKEND")
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/combinaciones-rutas", timeout=5)
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Backend OK: {len(combinaciones)} combinaciones")
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend no accesible")
        return False
    
    # 2. Verificar frontend
    print(f"\n2️⃣ FRONTEND")
    try:
        response = requests.get("http://localhost:4200", timeout=3)
        if response.status_code == 200:
            print(f"   ✅ Frontend OK: Puerto 4200")
        else:
            print(f"   ⚠️ Frontend status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Frontend no accesible")
        print(f"   💡 Ejecutar: ng serve")
    
    # 3. Mostrar datos disponibles
    print(f"\n3️⃣ DATOS DISPONIBLES")
    for i, comb in enumerate(combinaciones[:6]):
        rutas_count = len(comb.get('rutas', []))
        print(f"   {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
    
    # 4. Instrucciones finales
    print(f"\n4️⃣ PARA PROBAR AHORA")
    print(f"   1. Si el frontend no está corriendo:")
    print(f"      cd frontend")
    print(f"      ng serve")
    print(f"   2. Abrir: http://localhost:4200/rutas")
    print(f"   3. Seguir: INSTRUCCIONES_PROBAR_FRONTEND_DATOS_REALES.md")
    
    print(f"\n✅ SISTEMA LISTO PARA PROBAR")
    return True

if __name__ == "__main__":
    verificacion_rapida()