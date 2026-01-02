from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['sirret_db']

print("\nUsuarios en la base de datos:")
print("-" * 50)
usuarios = list(db.usuarios.find({}, {'dni': 1, 'nombres': 1, 'apellidos': 1, 'email': 1}))
for u in usuarios:
    print(f"DNI: {u.get('dni')}, Nombre: {u.get('nombres')} {u.get('apellidos')}, Email: {u.get('email')}")
print("-" * 50)
print(f"\nTotal: {len(usuarios)} usuarios\n")
