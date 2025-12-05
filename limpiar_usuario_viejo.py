from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_puno_db']

print("\nEliminando usuario viejo (DNI: 00000000)...")
result = db.usuarios.delete_one({'dni': '00000000'})
print(f"✅ Usuario eliminado: {result.deleted_count}")

print("\nUsuarios restantes:")
print("-" * 50)
usuarios = list(db.usuarios.find({}, {'dni': 1, 'nombres': 1, 'apellidos': 1}))
for u in usuarios:
    print(f"DNI: {u.get('dni')}, Nombre: {u.get('nombres')} {u.get('apellidos')}")
print("-" * 50)
print(f"\nTotal: {len(usuarios)} usuarios\n")
