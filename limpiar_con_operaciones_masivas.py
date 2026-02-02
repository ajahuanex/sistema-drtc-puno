#!/usr/bin/env python3
"""
Script para limpiar todas las localidades usando operaciones masivas
"""

import requests
import json

def limpiar_con_operaciones_masivas():
    """Limpiar todas las localidades usando el endpoint de operaciones masivas"""
    
    print("🗑️ LIMPIEZA CON OPERACIONES MASIVAS")
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
        
        # 3. Preparar IDs para operación masiva
        ids = [loc['id'] for loc in localidades]
        print(f"\n🗑️ Preparando eliminación masiva de {len(ids)} localidades...")
        
        # 4. Ejecutar operación masiva en lotes
        batch_size = 50  # Procesar en lotes de 50
        total_eliminadas = 0
        total_errores = 0
        
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(ids) + batch_size - 1) // batch_size
            
            print(f"   📦 Procesando lote {batch_num}/{total_batches} ({len(batch_ids)} localidades)...")
            
            try:
                # Preparar parámetros para operación masiva
                params = {'operacion': 'eliminar'}
                for id_loc in batch_ids:
                    params[f'ids'] = id_loc  # El endpoint espera múltiples parámetros 'ids'
                
                # Hacer la petición
                response = requests.post(
                    'http://localhost:8000/api/v1/localidades/operaciones-masivas',
                    params=params
                )
                
                if response.status_code == 200:
                    result = response.json()
                    procesadas = result.get('procesadas', 0)
                    errores_batch = result.get('total_errores', 0)
                    
                    total_eliminadas += procesadas
                    total_errores += errores_batch
                    
                    print(f"      ✅ Eliminadas: {procesadas}, Errores: {errores_batch}")
                else:
                    print(f"      ❌ Error en lote: {response.status_code}")
                    total_errores += len(batch_ids)
                    
            except Exception as e:
                print(f"      ❌ Error procesando lote: {e}")
                total_errores += len(batch_ids)
        
        # 5. Verificar resultado
        print(f"\n📊 RESULTADO FINAL:")
        print(f"   ✅ Eliminadas: {total_eliminadas}")
        print(f"   ❌ Errores: {total_errores}")
        
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
                # Intentar eliminar las restantes una por una
                return eliminar_restantes(remaining)
        
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al backend")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def eliminar_restantes(localidades_restantes):
    """Eliminar localidades restantes una por una"""
    print(f"\n🔄 Eliminando {len(localidades_restantes)} localidades restantes una por una...")
    
    eliminadas = 0
    for loc in localidades_restantes:
        try:
            response = requests.delete(f"http://localhost:8000/api/v1/localidades/{loc['id']}")
            if response.status_code in [200, 204]:
                eliminadas += 1
            else:
                print(f"   ❌ Error eliminando {loc.get('nombre', 'SIN_NOMBRE')}")
        except Exception as e:
            print(f"   ❌ Error eliminando {loc.get('nombre', 'SIN_NOMBRE')}: {e}")
    
    print(f"   ✅ Eliminadas individualmente: {eliminadas}")
    
    # Verificación final
    verify_response = requests.get('http://localhost:8000/api/v1/localidades')
    if verify_response.status_code == 200:
        final_remaining = verify_response.json()
        if len(final_remaining) == 0:
            print(f"\n🎉 TODAS LAS LOCALIDADES ELIMINADAS")
            return True
        else:
            print(f"\n⚠️ Aún quedan {len(final_remaining)} localidades")
            return False
    
    return False

if __name__ == "__main__":
    success = limpiar_con_operaciones_masivas()
    exit(0 if success else 1)