"""
Script para sincronizar centros poblados desde geometrias a localidades
"""
from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("SINCRONIZACION DE CENTROS POBLADOS")
print("=" * 80)

# Contar centros poblados en cada colección
cp_geometrias = db.geometrias.count_documents({'tipo': 'CENTRO_POBLADO'})
cp_localidades = db.localidades.count_documents({'tipo': 'CENTRO_POBLADO'})

print(f"\nEstado actual:")
print(f"  Centros poblados en 'geometrias': {cp_geometrias}")
print(f"  Centros poblados en 'localidades': {cp_localidades}")
print(f"  Diferencia: {cp_geometrias - cp_localidades}")

# Preguntar si desea continuar
respuesta = input("\n¿Desea sincronizar los centros poblados faltantes? (si/no): ")

if respuesta.lower() not in ['si', 's', 'yes', 'y']:
    print("Operación cancelada")
    exit()

print("\nIniciando sincronización...")

# Obtener todos los centros poblados de geometrias
centros_geometrias = list(db.geometrias.find({'tipo': 'CENTRO_POBLADO'}))

importados = 0
actualizados = 0
errores = 0

for i, cp in enumerate(centros_geometrias, 1):
    try:
        nombre = cp.get('nombre')
        ubigeo = cp.get('ubigeo')
        distrito = cp.get('distrito')
        provincia = cp.get('provincia')
        
        # Verificar si ya existe en localidades
        existe = db.localidades.find_one({
            'nombre': nombre,
            'tipo': 'CENTRO_POBLADO',
            'distrito': distrito
        })
        
        if not existe:
            # Crear nuevo documento en localidades
            localidad_doc = {
                'nombre': nombre,
                'tipo': 'CENTRO_POBLADO',
                'ubigeo': ubigeo,
                'departamento': 'PUNO',
                'provincia': provincia,
                'distrito': distrito,
                'coordenadas': {
                    'latitud': cp.get('centroide_lat'),
                    'longitud': cp.get('centroide_lon')
                },
                'estado': 'ACTIVO',
                'fechaCreacion': datetime.utcnow(),
                'fechaActualizacion': datetime.utcnow()
            }
            
            db.localidades.insert_one(localidad_doc)
            importados += 1
        else:
            # Actualizar coordenadas si no las tiene
            if not existe.get('coordenadas') or not existe['coordenadas'].get('latitud'):
                db.localidades.update_one(
                    {'_id': existe['_id']},
                    {'$set': {
                        'coordenadas': {
                            'latitud': cp.get('centroide_lat'),
                            'longitud': cp.get('centroide_lon')
                        },
                        'ubigeo': ubigeo,
                        'fechaActualizacion': datetime.utcnow()
                    }}
                )
                actualizados += 1
        
        if i % 1000 == 0:
            print(f"  Procesados: {i}/{len(centros_geometrias)}")
            
    except Exception as e:
        errores += 1
        if errores <= 5:
            print(f"  Error en {nombre}: {e}")

print(f"\nResultados:")
print(f"  Importados: {importados}")
print(f"  Actualizados: {actualizados}")
print(f"  Errores: {errores}")

# Verificar resultado
cp_localidades_final = db.localidades.count_documents({'tipo': 'CENTRO_POBLADO'})
print(f"\nEstado final:")
print(f"  Centros poblados en 'localidades': {cp_localidades_final}")

# Verificar YUNGUYO específicamente
print("\nVerificación de YUNGUYO:")
yunguyo_cp = db.localidades.find_one({
    'nombre': 'YUNGUYO',
    'tipo': 'CENTRO_POBLADO',
    'distrito': 'YUNGUYO'
})

if yunguyo_cp:
    print(f"  ✓ Centro poblado YUNGUYO encontrado en 'localidades'")
    print(f"    Distrito: {yunguyo_cp.get('distrito')}")
    print(f"    Provincia: {yunguyo_cp.get('provincia')}")
    coords = yunguyo_cp.get('coordenadas', {})
    print(f"    Coordenadas: Lat={coords.get('latitud')}, Lng={coords.get('longitud')}")
else:
    print(f"  ✗ Centro poblado YUNGUYO NO encontrado")

print("\n" + "=" * 80)
print("SINCRONIZACION COMPLETADA")
print("=" * 80)
