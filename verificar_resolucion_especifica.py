"""
Script para verificar una resolución específica
"""
from pymongo import MongoClient
from bson import ObjectId

def verificar_resolucion():
    print("=" * 80)
    print("🔍 VERIFICANDO RESOLUCIÓN ESPECÍFICA")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    resolucion_id = "6940105d1e90f8d55bb199f7"
    
    print(f"📋 Buscando resolución: {resolucion_id}")
    
    try:
        resolucion = db.resoluciones.find_one({"_id": ObjectId(resolucion_id)})
        
        if resolucion:
            print(f"\n✅ RESOLUCIÓN ENCONTRADA:")
            print(f"   • ID: {resolucion['_id']}")
            print(f"   • Número: {resolucion.get('nroResolucion', 'N/A')}")
            print(f"   • Tipo Resolución: {resolucion.get('tipoResolucion', 'N/A')}")
            print(f"   • Tipo Trámite: {resolucion.get('tipoTramite', 'N/A')}")
            print(f"   • Estado: {resolucion.get('estado', 'N/A')}")
            print(f"   • Empresa ID: {resolucion.get('empresaId', 'N/A')}")
            print(f"   • Está Activo: {resolucion.get('estaActivo', 'N/A')}")
            
            # Verificar si cumple los requisitos
            print(f"\n🔍 VERIFICACIÓN DE REQUISITOS:")
            
            tipo_resolucion = resolucion.get('tipoResolucion')
            estado = resolucion.get('estado')
            esta_activo = resolucion.get('estaActivo', False)
            
            print(f"   • ¿Es PADRE? {tipo_resolucion == 'PADRE'} (actual: {tipo_resolucion})")
            print(f"   • ¿Es VIGENTE? {estado == 'VIGENTE'} (actual: {estado})")
            print(f"   • ¿Está activo? {esta_activo}")
            
            if tipo_resolucion == 'PADRE' and estado == 'VIGENTE' and esta_activo:
                print(f"\n✅ RESOLUCIÓN VÁLIDA PARA CREAR RUTAS")
            else:
                print(f"\n❌ RESOLUCIÓN NO VÁLIDA:")
                if tipo_resolucion != 'PADRE':
                    print(f"      • Debe ser PADRE, no {tipo_resolucion}")
                if estado != 'VIGENTE':
                    print(f"      • Debe estar VIGENTE, no {estado}")
                if not esta_activo:
                    print(f"      • Debe estar activa")
        else:
            print(f"\n❌ RESOLUCIÓN NO ENCONTRADA")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
    
    # Buscar resoluciones PADRE y VIGENTE
    print(f"\n🔍 BUSCANDO RESOLUCIONES PADRE Y VIGENTES:")
    
    resoluciones_validas = list(db.resoluciones.find({
        "tipoResolucion": "PADRE",
        "estado": "VIGENTE",
        "estaActivo": True
    }))
    
    print(f"   • Total encontradas: {len(resoluciones_validas)}")
    
    for i, res in enumerate(resoluciones_validas, 1):
        print(f"   {i}. {res['nroResolucion']} (ID: {res['_id']})")
    
    client.close()
    print("=" * 80)

if __name__ == "__main__":
    verificar_resolucion()