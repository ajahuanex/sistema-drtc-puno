#!/usr/bin/env python3
"""
Script para limpiar todas las rutas usando la API del backend
"""

import requests
import json

def limpiar_rutas_via_api():
    """Limpiar todas las rutas usando el endpoint de la API"""
    
    print("🧹 LIMPIANDO TODAS LAS RUTAS VIA API")
    print("=" * 40)
    
    try:
        # URL del endpoint para limpiar rutas
        url = "http://localhost:8000/rutas/limpiar-todas"
        
        print("🔍 Verificando estado actual...")
        
        # Primero verificar cuántas rutas hay
        response_check = requests.get(url)
        
        if response_check.status_code == 200:
            data = response_check.json()
            total_rutas = data.get('total_rutas_actuales', 0)
            print(f"📊 Rutas actuales: {total_rutas}")
            
            if total_rutas == 0:
                print("✅ No hay rutas para eliminar")
                return True
            
            print(f"\n⚠️  Se eliminarán {total_rutas} rutas (incluyendo las que tienen datos vacíos)")
            
            # Confirmar eliminación
            print("🗑️  Procediendo con la eliminación...")
            
            # Llamar al endpoint con confirmación
            response_delete = requests.post(f"{url}?confirmar=true")
            
            if response_delete.status_code == 200:
                result = response_delete.json()
                print(f"✅ {result.get('mensaje', 'Eliminación completada')}")
                print(f"📊 Total eliminadas: {result.get('total_eliminadas', 0)}")
                
                if result.get('referencias_limpiadas'):
                    print("🧹 Referencias limpiadas en empresas y resoluciones")
                
                print("\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE")
                print("\n🧪 AHORA PUEDES PROBAR LA CARGA MASIVA:")
                print("   1. Ve al módulo de Rutas en el frontend")
                print("   2. Usa la función 'Carga Masiva'")
                print("   3. Sube un archivo Excel")
                print("   4. Verifica que NO se crean rutas con:")
                print("      - 'SIN RUC'")
                print("      - 'Sin resolución'")
                print("      - 'Sin frecuencia'")
                print("   5. Solo deben crearse rutas con todos los campos completos")
                
                return True
            else:
                print(f"❌ Error al eliminar rutas: {response_delete.status_code}")
                print(f"   Respuesta: {response_delete.text}")
                return False
        else:
            print(f"❌ Error al verificar rutas: {response_check.status_code}")
            print(f"   Respuesta: {response_check.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: No se puede conectar al backend")
        print("🔧 Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Función principal"""
    print("🚀 LIMPIEZA DE RUTAS VIA API")
    print("=" * 30)
    
    success = limpiar_rutas_via_api()
    
    print("\n" + "=" * 30)
    if success:
        print("✅ LIMPIEZA EXITOSA")
        print("🎯 Listo para probar la corrección")
    else:
        print("❌ LIMPIEZA FALLIDA")
        print("🔧 Verifica que el backend esté ejecutándose")

if __name__ == "__main__":
    main()