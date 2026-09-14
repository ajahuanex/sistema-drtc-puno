import pymongo

client = pymongo.MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']
empresas = db['empresas']

updated_count = 0
for empresa in empresas.find():
    ds = empresa.get('datosSunat')
    rz = empresa.get('razonSocial')
    
    needs_update = False
    
    if ds and isinstance(ds, dict):
        condicion = str(ds.get('condicion', 'HABIDO')).upper()
        es_habido = (condicion == 'HABIDO') or ds.get('valido', True)
        
        # Enrich datosSunat object with all missing SUNAT state fields
        ds['estado'] = ds.get('estado') or 'ACTIVO'
        ds['ddp_estado'] = ds.get('ddp_estado') or '00'
        ds['desc_estado'] = ds.get('desc_estado') or 'ACTIVO'
        ds['desc_flag22'] = ds.get('desc_flag22') or condicion
        ds['esActivo'] = ds.get('esActivo') if ds.get('esActivo') is not None else True
        ds['esHabido'] = ds.get('esHabido') if ds.get('esHabido') is not None else es_habido
        
        sunat_nombre = ds.get('ddp_nombre') or ds.get('razonSocial')
        if not sunat_nombre and isinstance(rz, dict):
            sunat_nombre = rz.get('principal')
        if sunat_nombre and 'ddp_nombre' not in ds:
            ds['ddp_nombre'] = sunat_nombre
        if sunat_nombre and 'razonSocial' not in ds:
            ds['razonSocial'] = sunat_nombre
            
        needs_update = True
        
    # Enrich razonSocial with sunat field
    if rz:
        sunat_val = ds.get('ddp_nombre') if isinstance(ds, dict) else None
        if isinstance(rz, dict):
            if not rz.get('sunat') and sunat_val:
                rz['sunat'] = sunat_val
                needs_update = True
        elif isinstance(rz, str):
            rz = {
                'principal': rz,
                'sunat': sunat_val or rz,
                'minimo': None
            }
            needs_update = True
            
    if needs_update:
        update_payload = {}
        if ds:
            update_payload['datosSunat'] = ds
        if rz:
            update_payload['razonSocial'] = rz
        empresas.update_one({'_id': empresa['_id']}, {'$set': update_payload})
        updated_count += 1

print(f'Actualizados exitosamente {updated_count} de {empresas.count_documents({})} documentos de empresas en MongoDB.')

# Verify sample
sample = empresas.find_one({'datosSunat': {'$exists': True}})
if sample:
    print('Muestra de razonSocial y datosSunat actualizados:')
    print('razonSocial:', sample.get('razonSocial'))
    print('datosSunat:', sample.get('datosSunat'))
