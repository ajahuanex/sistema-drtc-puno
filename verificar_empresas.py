from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_puno_db']

print("\nEmpresas en la base de datos:")
print("-" * 70)
empresas = list(db.empresas.find({}, {'ruc': 1, 'razonSocial': 1, 'nombreComercial': 1}))
for e in empresas:
    print(f"RUC: {e.get('ruc')}, Razón Social: {e.get('razonSocial')}")
    print(f"   Nombre Comercial: {e.get('nombreComercial')}")
    print()
print("-" * 70)
print(f"\nTotal: {len(empresas)} empresas\n")
