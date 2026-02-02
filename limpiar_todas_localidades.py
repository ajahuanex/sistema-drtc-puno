#!/usr/bin/env python3
"""
Script para eliminar TODAS las localidades existentes y empezar desde cero
"""

import requests
import json

def limpiar_todas_localidades():
    """Eliminar todas las localidades existentes"""
    
    print("🗑️ ELIMINACIÓN COMPLETA DE LOCALIDADES")
    print("=" * 50)
    
    try:
        # 1. Obtener todas las localidades
        print("1. 📋 Obteniendo todas las localidades...")
        response = requests.get('http://localhost:8000/api/v1/localidades', params={'limit': 1000})
        
        if response.status_code != 200:
            print(f"❌ Error obteniendo localidades: {response.status_code}")
            return False
        
        localidades = response.json()
        print(f"   Encontradas: {len(localidades)} localidades")
        
        if len(localidades) == 0:
            print("✅ No hay localidades para eliminar")
            return True
        
        # 2. Confirmar eliminación
        print(f"\n⚠️ ATENCIÓN: Se eliminarán {len(localidades)} localidades")
        print("   Esta acción NO se puede deshacer")
        confirmacion = input("\n¿Continuar? Escriba 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("❌ Operación cancelada")
            return False
        
        # 3. Eliminar todas las localidades
        print(f"\n🗑️ Eliminando localidades...")
        eliminadas = 0
        errores = 0
        
        for i, localidad in enumerate(localidades, 1):
            try:
                delete_response = requests.delete(f"http://localhost:8000/api/v1/localidades/{localidad['id']}")
                
                if delete_response.status_code in [200, 204]:
                    eliminadas += 1
                    if eliminadas % 10 == 0:
                        print(f"   ✅ Eliminadas: {eliminadas}/{len(localidades)}")
                else:
                    errores += 1
                    print(f"   ❌ Error eliminando {localidad.get('nombre', 'SIN_NOMBRE')}: {delete_response.status_code}")
                    
            except Exception as e:
                errores += 1
                print(f"   ❌ Error eliminando {localidad.get('nombre', 'SIN_NOMBRE')}: {e}")
        
        # 4. Verificar resultado
        print(f"\n📊 RESULTADO:")
        print(f"   ✅ Eliminadas: {eliminadas}")
        print(f"   ❌ Errores: {errores}")
        
        # Verificar que no queden localidades
        verify_response = requests.get('http://localhost:8000/api/v1/localidades')
        if verify_response.status_code == 200:
            remaining = verify_response.json()
            print(f"   📋 Localidades restantes: {len(remaining)}")
            
            if len(remaining) == 0:
                print(f"\n🎉 ELIMINACIÓN COMPLETADA EXITOSAMENTE")
                print("   La base de datos está limpia y lista para los datos oficiales del INEI")
                return True
            else:
                print(f"\n⚠️ Aún quedan {len(remaining)} localidades")
                return False
        
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al backend")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = limpiar_todas_localidades()
    exit(0 if success else 1)