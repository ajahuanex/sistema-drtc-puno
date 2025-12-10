from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_puno_db']

result = db.empresas.update_many({}, {'$set': {'estaActivo': True}})
print(f'Empresas activadas: {result.modified_count}')

client.close()