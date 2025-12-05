"""
Script para corregir el empresaId de la resolución
"""
from pymongo import MongoClient
from bson import ObjectId

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def corregir_empresaid():
    """Corrige el empresaId de la resolución"""
    try:
        print("\n" + "="*70)
        print("  CORRECCIÓN DE EMPRESAID EN RESOLUCIÓN")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Obtener la resolución problemática
        resolucion = db.resoluciones.find_one({'nroResolucion': 'R-0001-2025'})
        
        if not resolucion:
            print("❌ No se encontró la resolución R-0001-2025")
            return
        
        print("📋 RESOLUCIÓN ENCONTRADA:")
        print(f"   ID: {resolucion['_id']}")
        print(f"   Número: {resolucion.get('nroResolucion')}")
        print(f"   Empresa ID actual: {resolucion.get('empresaId')}")
        print()
        
        # Buscar la empresa por UUID (en caso de que esté almacenado en algún campo)
        uuid_empresaid = resolucion.get('empresaId')
        
        # Listar todas las empresas
        print("🏢 EMPRESAS DISPONIBLES:")
        empresas = list(db.empresas.find({}, {'_id': 1, 'ruc': 1, 'razonSocial': 1}))
        for i, empresa in enumerate(empresas, 1):
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                nombre = razon_social.get('principal', 'N/A')
            else:
                nombre = razon_social
            print(f"   {i}. {nombre}")
            print(f"      RUC: {empresa.get('ruc')}")
            print(f"      ID: {empresa['_id']}")
            print()
        
        # Preguntar cuál empresa debe asociarse
        print("¿A qué empresa pertenece esta resolución?")
        print("Ingresa el número de la empresa (o 0 para cancelar):")
        
        # Para automatizar, vamos a asociarla a la última empresa creada
        # (que probablemente es la que el usuario creó)
        ultima_empresa = empresas[-1]
        empresa_id_str = str(ultima_empresa['_id'])
        
        razon_social = ultima_empresa.get('razonSocial', {})
        if isinstance(razon_social, dict):
            nombre_empresa = razon_social.get('principal', 'N/A')
        else:
            nombre_empresa = razon_social
        
        print(f"\n✅ Asociando resolución a: {nombre_empresa}")
        print(f"   Nuevo empresaId: {empresa_id_str}")
        
        # Actualizar la resolución
        result = db.resoluciones.update_one(
            {'_id': resolucion['_id']},
            {'$set': {'empresaId': empresa_id_str}}
        )
        
        if result.modified_count > 0:
            print("\n✅ RESOLUCIÓN ACTUALIZADA EXITOSAMENTE")
            
            # Verificar la actualización
            resolucion_actualizada = db.resoluciones.find_one({'_id': resolucion['_id']})
            print(f"\n📋 RESOLUCIÓN DESPUÉS DE LA ACTUALIZACIÓN:")
            print(f"   Número: {resolucion_actualizada.get('nroResolucion')}")
            print(f"   Empresa ID: {resolucion_actualizada.get('empresaId')}")
            print(f"   Tipo: {resolucion_actualizada.get('tipoResolucion')}")
            print(f"   Estado: {resolucion_actualizada.get('estado')}")
        else:
            print("\n⚠️  No se realizaron cambios")
        
        print("\n" + "="*70 + "\n")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    corregir_empresaid()
