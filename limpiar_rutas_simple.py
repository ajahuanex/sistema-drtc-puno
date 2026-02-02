#!/usr/bin/env python3
"""
Script simple para limpiar todas las rutas
"""

import requests

def limpiar_rutas():
    """Limpiar todas las rutas usando el endpoint DELETE"""
    
    print("🧹 LIMPIANDO TODAS LAS RUTAS")
    print("=" * 30)
    
    try:
        # Usar el endpoint DELETE que sí existe
        url = "http://localhost:8000/api/v1/rutas/"
        
        print("🔍 Verificando rutas actuales...")
        
        # Primero verificar sin confirmar
        response_check = requests.delete(url)
        
        if response_check.status_code == 200:
            data = response_check.json()
            total_rutas = data.get('total_rutas', 0)
            print(f"📊 Rutas actuales: {total_rutas}")
            
            if total_rutas == 0:
                print("✅ No hay rutas para eliminar")
                return True
            
            print(f"\n⚠️  Se eliminarán {total_rutas} rutas")
            print("   (Incluyendo las rutas con 'SIN RUC', 'Sin resolución', etc.)")
            
            # Confirmar eliminación
            print("\n🗑️  Eliminando todas las rutas...")
            response_delete = requests.delete(f"{url}?confirmar=true")
            
            if response_delete.status_code == 200:
                result = response_delete.json()
                print(f"✅ {result.get('mensaje', 'Eliminación completada')}")
                print(f"📊 Total eliminadas: {result.get('total_eliminadas', 0)}")
                
                print("\n🎉 LIMPIEZA COMPLETADA")
                print("\n🧪 AHORA PRUEBA LA CARGA MASIVA CORREGIDA:")
                print("   1. Ve al módulo de Rutas")
                print("   2. Carga Masiva")
                print("   3. Sube un Excel")
                print("   4. Verifica que NO aparezcan rutas con datos vacíos")
                
                return True
            else:
                print(f"❌ Error al eliminar: {response_delete.status_code}")
                print(f"   {response_delete.text}")
                return False
        else:
            print(f"❌ Error al verificar: {response_check.status_code}")
            print(f"   {response_check.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    limpiar_rutas()