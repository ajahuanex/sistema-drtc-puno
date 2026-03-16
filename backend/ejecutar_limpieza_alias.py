"""
Script para ejecutar la limpieza y recreación de alias a través del API
"""
import requests
import json

API_URL = "http://localhost:8000/api/v1/admin/alias/limpiar-y-recrear"

print("🧹 Ejecutando limpieza y recreación de alias...")
print("=" * 60)

try:
    response = requests.post(API_URL)
    
    if response.status_code == 200:
        resultado = response.json()
        
        print(f"\n✅ Operación completada exitosamente")
        print(f"\n📊 RESUMEN:")
        print(f"   🗑️  Alias eliminados: {resultado['alias_eliminados']}")
        print(f"   ✅ Alias creados: {resultado['alias_creados']}")
        print(f"   ❌ Errores: {resultado['errores']}")
        print(f"   ✅ Alias válidos: {resultado['alias_validos']}")
        print(f"   ⚠️  Alias inválidos: {resultado['alias_invalidos']}")
        
        print(f"\n📋 DETALLES:")
        for detalle in resultado['detalles']:
            print(f"   {detalle}")
        
        print("\n" + "=" * 60)
        
        if resultado['alias_invalidos'] == 0:
            print("🎉 ¡Todos los aliases están correctamente configurados!")
        else:
            print(f"⚠️  Hay {resultado['alias_invalidos']} aliases con problemas")
            
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("❌ Error: No se pudo conectar al servidor")
    print("   Asegúrate de que el backend esté corriendo en http://localhost:8000")
except Exception as e:
    print(f"❌ Error inesperado: {e}")
