"""
Test de hash de contraseña
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "admin123"

# Truncar como lo hace el servicio
password_bytes = password.encode('utf-8')[:72]
password_truncated = password_bytes.decode('utf-8', errors='ignore')

print(f"Password original: {password}")
print(f"Password truncado: {password_truncated}")
print(f"Son iguales: {password == password_truncated}")

# Generar hash
hashed = pwd_context.hash(password_truncated)
print(f"\nHash generado: {hashed}")

# Verificar
result = pwd_context.verify(password_truncated, hashed)
print(f"Verificación: {result}")

# Verificar con el hash de la BD
from pymongo import MongoClient

client = MongoClient("mongodb://admin:admin123@localhost:27017/")
db = client["sirret_db"]
usuario = db.usuarios.find_one({"dni": "12345678"})

if usuario:
    print(f"\nHash en BD: {usuario['passwordHash']}")
    result_bd = pwd_context.verify(password_truncated, usuario['passwordHash'])
    print(f"Verificación con BD: {result_bd}")
else:
    print("\nNo se encontró el usuario")

client.close()
