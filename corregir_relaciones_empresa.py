"""
Script para corregir las relaciones entre empresas y sus elementos relacionados
"""
import sys
from pymongo import MongoClient
from bson import ObjectId

def corregir_relaciones(empresa_id_str):
    """Corregir las relaciones de una empresa"""
    
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['sirret_db']
        
        print("=" * 70)
        print("CORRECCIÓN DE RELACIONES DE EMPRESA")
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
        
        # 2. Buscar y actualizar resoluciones
        print(f"\n🔍 BUSCANDO RESOLUCIONES...")
        resoluciones = list(db.resoluciones.find({"empresaId": str(empresa_id)}))
        print(f"   Encontradas: {len(resoluciones)}")
        
        resoluciones_ids = [str(r['_id']) for r in resoluciones]
        
        # 3. Buscar y actualizar vehículos
        print(f"\n🚗 BUSCANDO VEHÍCULOS...")
        vehiculos = list(db.vehiculos.find({"empresaActualId": str(empresa_id)}))
        print(f"   Encontrados: {len(vehiculos)}")
        
        vehiculos_ids = [str(v['_id']) for v in vehiculos]
        
        # 4. Buscar conductores
        print(f"\n👤 BUSCANDO CONDUCTORES...")
        conductores = list(db.conductores.find({"empresaId": str(empresa_id)}))
        print(f"   Encontrados: {len(conductores)}")
        
        conductores_ids = [str(c['_id']) for c in conductores]
        
        # 5. Buscar rutas
        print(f"\n🛣️  BUSCANDO RUTAS...")
        rutas = list(db.rutas.find({"empresaId": str(empresa_id)}))
        print(f"   Encontradas: {len(rutas)}")
        
        rutas_ids = [str(r['_id']) for r in rutas]
        
        # 6. Actualizar empresa con los IDs correctos
        print(f"\n💾 ACTUALIZANDO EMPRESA...")
        
        update_data = {
            "resolucionesPrimigeniasIds": resoluciones_ids,
            "vehiculosHabilitadosIds": vehiculos_ids,
            "conductoresHabilitadosIds": conductores_ids,
            "rutasAutorizadasIds": rutas_ids
        }
        
        result = db.empresas.update_one(
            {"_id": empresa_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            print(f"   ✅ Empresa actualizada exitosamente")
        else:
            print(f"   ⚠️  No se realizaron cambios (los datos ya estaban correctos)")
        
        # 7. Mostrar resumen
        print(f"\n" + "=" * 70)
        print("RESUMEN DE CORRECCIÓN")
        print("=" * 70)
        print(f"✅ Resoluciones: {len(resoluciones_ids)} IDs agregados")
        print(f"✅ Vehículos: {len(vehiculos_ids)} IDs agregados")
        print(f"✅ Conductores: {len(conductores_ids)} IDs agregados")
        print(f"✅ Rutas: {len(rutas_ids)} IDs agregados")
        
        print(f"\n📊 VERIFICACIÓN FINAL:")
        empresa_actualizada = db.empresas.find_one({"_id": empresa_id})
        print(f"   - Resoluciones en array: {len(empresa_actualizada.get('resolucionesPrimigeniasIds', []))}")
        print(f"   - Vehículos en array: {len(empresa_actualizada.get('vehiculosHabilitadosIds', []))}")
        print(f"   - Conductores en array: {len(empresa_actualizada.get('conductoresHabilitadosIds', []))}")
        print(f"   - Rutas en array: {len(empresa_actualizada.get('rutasAutorizadasIds', []))}")
        
        print(f"\n✅ CORRECCIÓN COMPLETADA")
        print(f"\nRecarga la página en el navegador para ver los cambios.")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python corregir_relaciones_empresa.py <EMPRESA_ID>")
        print("\nEjemplo:")
        print("  python corregir_relaciones_empresa.py 673e33a45-41d1-4607-bbd6-82eaca87b91")
        sys.exit(1)
    
    empresa_id = sys.argv[1]
    
    print("\n⚠️  ADVERTENCIA: Este script modificará la base de datos")
    respuesta = input("¿Deseas continuar? (s/n): ")
    
    if respuesta.lower() == 's':
        corregir_relaciones(empresa_id)
    else:
        print("Operación cancelada")
