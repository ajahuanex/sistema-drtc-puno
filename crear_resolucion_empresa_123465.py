"""
Script para crear una resolución para la empresa 123465
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def crear_resolucion():
    """Crea una resolución para la empresa 123465"""
    try:
        print("\n" + "="*70)
        print("  CREACIÓN DE RESOLUCIÓN PARA EMPRESA 123465")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Buscar la empresa 123465
        empresa = db.empresas.find_one({'ruc': '20132465798'})
        
        if not empresa:
            print("❌ No se encontró la empresa con RUC 20132465798")
            return
        
        empresa_id = str(empresa['_id'])
        print(f"✅ Empresa encontrada:")
        print(f"   Nombre: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        print(f"   RUC: {empresa.get('ruc')}")
        print(f"   ID: {empresa_id}\n")
        
        # Crear resolución
        resolucion = {
            "id": str(uuid.uuid4()),
            "nroResolucion": "R-0002-2025",
            "empresaId": empresa_id,
            "fechaEmision": datetime.now(),
            "fechaVigenciaInicio": datetime.now(),
            "fechaVigenciaFin": datetime.now() + timedelta(days=365),
            "tipoResolucion": "PADRE",
            "resolucionPadreId": None,
            "resolucionesHijasIds": [],
            "vehiculosHabilitadosIds": [],
            "rutasAutorizadasIds": [],
            "tipoTramite": "AUTORIZACION_NUEVA",
            "descripcion": "Autorización de rutas para empresa 123465",
            "expedienteId": None,
            "documentoId": None,
            "estaActivo": True,
            "fechaRegistro": datetime.now(),
            "fechaActualizacion": datetime.now(),
            "usuarioEmisionId": None,
            "observaciones": "Resolución creada automáticamente para pruebas",
            "estado": "VIGENTE",
            "motivoSuspension": None,
            "fechaSuspension": None,
            "usuarioSuspensionId": None,
            "motivoAnulacion": None,
            "fechaAnulacion": None,
            "usuarioAnulacionId": None
        }
        
        print("📝 Creando resolución...")
        result = db.resoluciones.insert_one(resolucion)
        resolucion_id = resolucion['id']
        
        print(f"✅ Resolución creada exitosamente")
        print(f"   ID: {resolucion_id}")
        print(f"   Número: {resolucion['nroResolucion']}")
        print(f"   Tipo: {resolucion['tipoResolucion']}")
        print(f"   Estado: {resolucion['estado']}")
        print(f"   Tipo Trámite: {resolucion['tipoTramite']}\n")
        
        # Actualizar la empresa con la resolución
        print("🔄 Actualizando empresa con la resolución...")
        db.empresas.update_one(
            {'_id': empresa['_id']},
            {'$addToSet': {'resolucionesPrimigeniasIds': resolucion_id}}
        )
        print("✅ Empresa actualizada\n")
        
        # Verificar
        print("🔍 VERIFICACIÓN:")
        print("-" * 70)
        resoluciones_empresa = list(db.resoluciones.find({'empresaId': empresa_id}))
        print(f"   Resoluciones de la empresa: {len(resoluciones_empresa)}")
        for res in resoluciones_empresa:
            print(f"      - {res.get('nroResolucion')} ({res.get('tipoResolucion')}, {res.get('estado')})")
        print("-" * 70)
        
        print("\n" + "="*70)
        print("  RESOLUCIÓN CREADA EXITOSAMENTE")
        print("="*70)
        print("\n🚀 Ahora puedes:")
        print("   1. Refrescar el navegador (F5)")
        print("   2. Ir al módulo de Rutas")
        print("   3. Seleccionar empresa: 123465 (RUC: 20132465798)")
        print("   4. Verás la resolución R-0002-2025")
        print("   5. Crear rutas para esta resolución\n")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    crear_resolucion()
