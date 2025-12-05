"""
Script para verificar el estado de todas las resoluciones
"""

from pymongo import MongoClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"
EMPRESA_ID_UUID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"

def verificar():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("VERIFICACIÓN DE ESTADO DE RESOLUCIONES")
    print("=" * 80)
    
    resoluciones = list(db["resoluciones"].find({"empresaId": EMPRESA_ID_UUID}))
    
    for res in resoluciones:
        tipo = res.get('tipoResolucion', 'SIN TIPO')
        numero = res.get('nroResolucion', 'SIN NÚMERO')
        estado = res.get('estado', 'SIN ESTADO')
        esta_activo = res.get('estaActivo', False)
        
        print(f"\n{tipo}: {numero}")
        print(f"   estado: {estado}")
        print(f"   estaActivo: {esta_activo}")
        
        # Verificar si pasaría el filtro del frontend
        pasa_filtro = esta_activo and (estado == 'VIGENTE' or not estado)
        print(f"   ¿Pasa filtro?: {'✅ SÍ' if pasa_filtro else '❌ NO'}")

if __name__ == "__main__":
    verificar()
