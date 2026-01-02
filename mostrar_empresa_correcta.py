"""
Script para mostrar claramente qué empresa tiene resoluciones
"""
from pymongo import MongoClient

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def mostrar_empresa_correcta():
    """Muestra la empresa correcta para crear rutas"""
    try:
        print("\n" + "="*70)
        print("  ¿QUÉ EMPRESA DEBO SELECCIONAR?")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Obtener todas las empresas
        empresas = list(db.empresas.find({}, {'_id': 1, 'ruc': 1, 'razonSocial': 1}))
        
        # Obtener todas las resoluciones
        resoluciones = list(db.resoluciones.find({
            'estado': 'VIGENTE',
            'tipoResolucion': 'PADRE',
            'estaActivo': True
        }, {'_id': 1, 'nroResolucion': 1, 'empresaId': 1}))
        
        print("📋 EMPRESAS CON RESOLUCIONES VIGENTES Y PADRE:\n")
        
        empresas_con_resoluciones = []
        
        for empresa in empresas:
            empresa_id_str = str(empresa['_id'])
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                nombre = razon_social.get('principal', 'N/A')
            else:
                nombre = razon_social
            
            # Buscar resoluciones de esta empresa
            resoluciones_empresa = [r for r in resoluciones if r.get('empresaId') == empresa_id_str]
            
            if resoluciones_empresa:
                empresas_con_resoluciones.append({
                    'nombre': nombre,
                    'ruc': empresa.get('ruc'),
                    'id': empresa_id_str,
                    'resoluciones': resoluciones_empresa
                })
        
        if empresas_con_resoluciones:
            for i, emp in enumerate(empresas_con_resoluciones, 1):
                print(f"✅ OPCIÓN {i}:")
                print(f"   Nombre: {emp['nombre']}")
                print(f"   RUC: {emp['ruc']}")
                print(f"   Resoluciones:")
                for res in emp['resoluciones']:
                    print(f"      - {res.get('nroResolucion')}")
                print()
            
            print("="*70)
            print("  INSTRUCCIONES")
            print("="*70)
            print("\n1. Refresca el navegador (F5)")
            print("2. En el módulo de Rutas, busca por RUC o nombre:")
            for emp in empresas_con_resoluciones:
                print(f"   - Busca: \"{emp['ruc']}\" o \"{emp['nombre']}\"")
            print("3. Selecciona la empresa")
            print("4. Verás las resoluciones disponibles")
            print("5. Selecciona una resolución")
            print("6. Click en 'Nueva Ruta'\n")
        else:
            print("❌ NO HAY EMPRESAS CON RESOLUCIONES VIGENTES Y PADRE")
            print("\nPara crear rutas, primero debes:")
            print("1. Ir al módulo de Resoluciones")
            print("2. Crear una resolución PADRE para una empresa")
            print("3. Asegurarte de que esté VIGENTE")
            print("4. Luego podrás crear rutas\n")
        
        print("="*70 + "\n")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    mostrar_empresa_correcta()
