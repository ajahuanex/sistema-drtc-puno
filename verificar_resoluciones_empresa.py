"""
Script para verificar las resoluciones de la empresa y su tipo
"""

from pymongo import MongoClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

EMPRESA_ID_UUID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"

def verificar():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("VERIFICACIÓN DE RESOLUCIONES")
    print("=" * 80)
    
    resoluciones_col = db["resoluciones"]
    
    # Buscar resoluciones de la empresa
    resoluciones = list(resoluciones_col.find({"empresaId": EMPRESA_ID_UUID}))
    
    print(f"\n📋 Total de resoluciones: {len(resoluciones)}")
    
    padres = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
    hijas = [r for r in resoluciones if r.get('tipoResolucion') == 'HIJO']
    
    print(f"   - PADRE: {len(padres)}")
    print(f"   - HIJO: {len(hijas)}")
    
    print("\n📊 DETALLE DE RESOLUCIONES:")
    
    for res in resoluciones:
        tipo = res.get('tipoResolucion', 'SIN TIPO')
        numero = res.get('nroResolucion', 'SIN NÚMERO')
        padre_id = res.get('resolucionPadreId', None)
        
        print(f"\n   {tipo}: {numero}")
        print(f"      ID: {res['_id']}")
        if padre_id:
            print(f"      Padre ID: {padre_id}")
        print(f"      Vehículos: {len(res.get('vehiculosHabilitadosIds', []))}")
        print(f"      Rutas: {len(res.get('rutasAutorizadasIds', []))}")

if __name__ == "__main__":
    verificar()
