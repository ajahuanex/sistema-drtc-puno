#!/usr/bin/env python3
"""
Script para verificar que los itinerarios de rutas están correctamente estructurados
y mostrar cómo se verán en el frontend
"""

from pymongo import MongoClient
from datetime import datetime

# Configuración de MongoDB
# Intentar sin autenticación primero
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "drtc_puno_db"

def verificar_itinerarios():
    """Verifica y muestra los itinerarios de las rutas"""
    
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("=" * 80)
    print("VERIFICACIÓN DE ITINERARIOS DE RUTAS")
    print("=" * 80)
    print()
    
    # Obtener todas las rutas
    rutas = list(db.rutas.find().limit(10))
    
    if not rutas:
        print("❌ No se encontraron rutas en la base de datos")
        return
    
    print(f"✅ Se encontraron {db.rutas.count_documents({})} rutas en total")
    print(f"📋 Mostrando las primeras 10 rutas:\n")
    
    for i, ruta in enumerate(rutas, 1):
        print(f"{i}. Ruta: {ruta.get('codigoRuta', 'Sin código')}")
        print(f"   Empresa: {ruta.get('empresa', {}).get('ruc', 'Sin RUC')}")
        print(f"   Origen: {ruta.get('origen', {}).get('nombre', 'Sin origen')}")
        print(f"   Destino: {ruta.get('destino', {}).get('nombre', 'Sin destino')}")
        
        # Verificar estructura del itinerario
        itinerario = ruta.get('itinerario', [])
        
        if isinstance(itinerario, list) and len(itinerario) > 0:
            # Ordenar por el campo 'orden'
            itinerario_ordenado = sorted(itinerario, key=lambda x: x.get('orden', 0))
            
            # Extraer nombres de localidades
            localidades = [loc.get('nombre', 'Sin nombre') for loc in itinerario_ordenado]
            
            # Formatear como se mostrará en el frontend
            itinerario_formateado = ' - '.join(localidades)
            
            print(f"   Itinerario ({len(localidades)} localidades):")
            print(f"   📍 {itinerario_formateado}")
            
            # Mostrar detalles de cada localidad
            print(f"   Detalles:")
            for loc in itinerario_ordenado:
                print(f"      • Orden {loc.get('orden', '?')}: {loc.get('nombre', 'Sin nombre')} (ID: {loc.get('id', 'Sin ID')})")
        
        elif isinstance(itinerario, str):
            print(f"   ⚠️  Itinerario en formato texto (legacy): {itinerario[:100]}...")
            print(f"   ℹ️  Necesita normalización a formato array")
        
        else:
            print(f"   ❌ Sin itinerario definido")
        
        print()
    
    # Estadísticas
    print("=" * 80)
    print("ESTADÍSTICAS DE ITINERARIOS")
    print("=" * 80)
    
    total_rutas = db.rutas.count_documents({})
    rutas_con_itinerario_array = db.rutas.count_documents({
        'itinerario': {'$type': 'array', '$ne': []}
    })
    rutas_con_itinerario_texto = db.rutas.count_documents({
        'itinerario': {'$type': 'string'}
    })
    rutas_sin_itinerario = db.rutas.count_documents({
        '$or': [
            {'itinerario': {'$exists': False}},
            {'itinerario': None},
            {'itinerario': []}
        ]
    })
    
    print(f"Total de rutas: {total_rutas}")
    print(f"✅ Con itinerario estructurado (array): {rutas_con_itinerario_array} ({rutas_con_itinerario_array/total_rutas*100:.1f}%)")
    print(f"⚠️  Con itinerario en texto (legacy): {rutas_con_itinerario_texto} ({rutas_con_itinerario_texto/total_rutas*100:.1f}%)")
    print(f"❌ Sin itinerario: {rutas_sin_itinerario} ({rutas_sin_itinerario/total_rutas*100:.1f}%)")
    print()
    
    if rutas_con_itinerario_texto > 0:
        print("⚠️  RECOMENDACIÓN: Ejecutar script de normalización para convertir itinerarios de texto a array")
        print("   Comando: python normalizar_itinerarios_rutas.py")
    
    client.close()

if __name__ == "__main__":
    try:
        verificar_itinerarios()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
