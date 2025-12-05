"""
Script para verificar las relaciones entre empresas, resoluciones y vehículos
"""
import sys
from pymongo import MongoClient
from bson import ObjectId

def verificar_relaciones(empresa_id_str):
    """Verificar las relaciones de una empresa"""
    
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['drtc_puno']
        
        print("=" * 70)
        print("VERIFICACIÓN DE RELACIONES DE EMPRESA")
        print("=" * 70)
        
        # Convertir ID a ObjectId
        try:
            empresa_id = ObjectId(empresa_id_str)
        except:
            print(f"❌ ERROR: '{empresa_id_str}' no es un ObjectId válido")
            return
        
        # 1. Verificar empresa
        print(f"\n📋 Buscando empresa con ID: {empresa_id}")
        empresa = db.empresas.find_one({"_id": empresa_id})
        
        if not empresa:
            print(f"❌ ERROR: No se encontró empresa con ID {empresa_id}")
            return
        
        print(f"\n✅ EMPRESA ENCONTRADA")
        print(f"   RUC: {empresa.get('ruc', 'N/A')}")
        print(f"   Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        print(f"   Estado: {empresa.get('estado', 'N/A')}")
        
        # 2. Verificar arrays en la empresa
        print(f"\n📊 ARRAYS EN LA EMPRESA:")
        vehiculos_ids = empresa.get('vehiculosHabilitadosIds', [])
        resoluciones_ids = empresa.get('resolucionesPrimigeniasIds', [])
        conductores_ids = empresa.get('conductoresHabilitadosIds', [])
        rutas_ids = empresa.get('rutasAutorizadasIds', [])
        
        print(f"   - Vehículos en array: {len(vehiculos_ids)}")
        print(f"   - Resoluciones en array: {len(resoluciones_ids)}")
        print(f"   - Conductores en array: {len(conductores_ids)}")
        print(f"   - Rutas en array: {len(rutas_ids)}")
        
        # 3. Verificar resoluciones en la base de datos
        print(f"\n🔍 VERIFICANDO RESOLUCIONES EN DB:")
        resoluciones = list(db.resoluciones.find({"empresaId": str(empresa_id)}))
        print(f"   Total encontradas: {len(resoluciones)}")
        
        if resoluciones:
            print(f"\n   Detalles:")
            for i, res in enumerate(resoluciones, 1):
                print(f"   {i}. {res.get('nroResolucion', 'SIN NÚMERO')}")
                print(f"      - ID: {res.get('_id')}")
                print(f"      - Empresa ID: {res.get('empresaId', '❌ SIN EMPRESA')}")
                print(f"      - Estado: {res.get('estado', 'N/A')}")
                print(f"      - Tipo: {res.get('tipoTramite', 'N/A')}")
                print(f"      - Vehículos: {len(res.get('vehiculosHabilitadosIds', []))}")
        else:
            print(f"   ⚠️  No se encontraron resoluciones con empresaId = {empresa_id}")
        
        # 4. Verificar vehículos en la base de datos
        print(f"\n🚗 VERIFICANDO VEHÍCULOS EN DB:")
        vehiculos = list(db.vehiculos.find({"empresaActualId": str(empresa_id)}))
        print(f"   Total encontrados: {len(vehiculos)}")
        
        if vehiculos:
            print(f"\n   Detalles:")
            for i, veh in enumerate(vehiculos, 1):
                print(f"   {i}. {veh.get('placa', 'SIN PLACA')}")
                print(f"      - ID: {veh.get('_id')}")
                print(f"      - Empresa ID: {veh.get('empresaActualId', '❌ SIN EMPRESA')}")
                print(f"      - Estado: {veh.get('estado', 'N/A')}")
                print(f"      - Marca: {veh.get('marca', 'N/A')}")
        else:
            print(f"   ⚠️  No se encontraron vehículos con empresaActualId = {empresa_id}")
        
        # 5. Verificar conductores
        print(f"\n👤 VERIFICANDO CONDUCTORES EN DB:")
        conductores = list(db.conductores.find({"empresaId": str(empresa_id)}))
        print(f"   Total encontrados: {len(conductores)}")
        
        # 6. Verificar rutas
        print(f"\n🛣️  VERIFICANDO RUTAS EN DB:")
        rutas = list(db.rutas.find({"empresaId": str(empresa_id)}))
        print(f"   Total encontrados: {len(rutas)}")
        
        # 7. Resumen de inconsistencias
        print(f"\n" + "=" * 70)
        print("RESUMEN DE INCONSISTENCIAS")
        print("=" * 70)
        
        inconsistencias = []
        
        if len(vehiculos) != len(vehiculos_ids):
            inconsistencias.append(f"❌ Vehículos: {len(vehiculos)} en DB vs {len(vehiculos_ids)} en array")
        else:
            print(f"✅ Vehículos: Consistente ({len(vehiculos)})")
        
        if len(resoluciones) != len(resoluciones_ids):
            inconsistencias.append(f"❌ Resoluciones: {len(resoluciones)} en DB vs {len(resoluciones_ids)} en array")
        else:
            print(f"✅ Resoluciones: Consistente ({len(resoluciones)})")
        
        if len(conductores) != len(conductores_ids):
            inconsistencias.append(f"❌ Conductores: {len(conductores)} en DB vs {len(conductores_ids)} en array")
        else:
            print(f"✅ Conductores: Consistente ({len(conductores)})")
        
        if len(rutas) != len(rutas_ids):
            inconsistencias.append(f"❌ Rutas: {len(rutas)} en DB vs {len(rutas_ids)} en array")
        else:
            print(f"✅ Rutas: Consistente ({len(rutas)})")
        
        if inconsistencias:
            print(f"\n⚠️  SE ENCONTRARON {len(inconsistencias)} INCONSISTENCIAS:")
            for inc in inconsistencias:
                print(f"   {inc}")
        else:
            print(f"\n✅ NO SE ENCONTRARON INCONSISTENCIAS")
        
        print(f"\n" + "=" * 70)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python verificar_relaciones_empresa.py <EMPRESA_ID>")
        print("\nEjemplo:")
        print("  python verificar_relaciones_empresa.py 673e33a45-41d1-4607-bbd6-82eaca87b91")
        sys.exit(1)
    
    empresa_id = sys.argv[1]
    verificar_relaciones(empresa_id)
