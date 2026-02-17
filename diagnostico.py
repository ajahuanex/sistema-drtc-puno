"""
Script de diagnóstico para verificar el estado del sistema
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def diagnosticar():
    """Diagnosticar el estado del sistema"""
    
    print("🔍 DIAGNÓSTICO DEL SISTEMA DE VEHÍCULOS")
    print("="*70)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
        db = client["sirret_db"]
        
        # Verificar conexión
        await client.server_info()
        print("\n✅ Conexión a MongoDB exitosa")
        
    except Exception as e:
        print(f"\n❌ Error conectando a MongoDB: {e}")
        print("\n💡 Solución:")
        print("   1. Verificar que MongoDB esté corriendo")
        print("   2. Windows: net start MongoDB")
        print("   3. O iniciar desde Services")
        return
    
    # 1. Verificar colecciones
    print("\n" + "="*70)
    print("📊 COLECCIONES EN BASE DE DATOS")
    print("="*70)
    
    collections = await db.list_collection_names()
    print(f"\nTotal de colecciones: {len(collections)}")
    
    colecciones_importantes = {
        'vehiculos': 'Vehículos administrativos',
        'vehiculos_solo': 'Datos técnicos de vehículos',
        'empresas': 'Empresas de transporte',
        'localidades': 'Localidades',
        'rutas': 'Rutas',
        'resoluciones': 'Resoluciones'
    }
    
    for col, descripcion in colecciones_importantes.items():
        if col in collections:
            count = await db[col].count_documents({})
            status = "✅" if count > 0 else "⚠️ "
            print(f"{status} {col:20} - {count:5} documentos - {descripcion}")
        else:
            print(f"❌ {col:20} - NO EXISTE - {descripcion}")
    
    # 2. Verificar vehículos problemáticos
    print("\n" + "="*70)
    print("🔍 ANÁLISIS DE VEHÍCULOS")
    print("="*70)
    
    vehiculos = db["vehiculos"]
    total_vehiculos = await vehiculos.count_documents({})
    
    if total_vehiculos == 0:
        print("\n⚠️  No hay vehículos en la base de datos")
        print("💡 Crear al menos un vehículo para probar el sistema")
        client.close()
        return
    
    print(f"\nTotal de vehículos: {total_vehiculos}")
    
    # Verificar campos nuevos
    sin_tipo_servicio = await vehiculos.count_documents({
        "tipoServicio": {"$exists": False}
    })
    
    sin_vehiculo_data_id = await vehiculos.count_documents({
        "$and": [
            {"vehiculoDataId": {"$exists": False}},
            {"vehiculoSoloId": {"$exists": False}}
        ]
    })
    
    sin_marca = await vehiculos.count_documents({
        "marca": {"$exists": False}
    })
    
    sin_categoria = await vehiculos.count_documents({
        "categoria": {"$exists": False}
    })
    
    print(f"\n📋 Campos faltantes:")
    print(f"   {'Sin tipoServicio:':<30} {sin_tipo_servicio:>5} ({sin_tipo_servicio/total_vehiculos*100:.1f}%)")
    print(f"   {'Sin vehiculoDataId:':<30} {sin_vehiculo_data_id:>5} ({sin_vehiculo_data_id/total_vehiculos*100:.1f}%)")
    print(f"   {'Sin marca:':<30} {sin_marca:>5} ({sin_marca/total_vehiculos*100:.1f}%)")
    print(f"   {'Sin categoría:':<30} {sin_categoria:>5} ({sin_categoria/total_vehiculos*100:.1f}%)")
    
    # 3. Mostrar ejemplo de vehículo
    print("\n" + "="*70)
    print("📄 EJEMPLO DE VEHÍCULO")
    print("="*70)
    
    ejemplo = await vehiculos.find_one({})
    if ejemplo:
        print(f"\n   Placa:           {ejemplo.get('placa', 'N/A')}")
        print(f"   Marca:           {ejemplo.get('marca', 'N/A')}")
        print(f"   Modelo:          {ejemplo.get('modelo', 'N/A')}")
        print(f"   Categoría:       {ejemplo.get('categoria', 'N/A')}")
        print(f"   Tipo Servicio:   {ejemplo.get('tipoServicio', 'N/A')}")
        print(f"   VehiculoDataId:  {ejemplo.get('vehiculoDataId', 'N/A')}")
        print(f"   VehiculoSoloId:  {ejemplo.get('vehiculoSoloId', 'N/A')}")
        print(f"   Estado:          {ejemplo.get('estado', 'N/A')}")
        print(f"   Empresa:         {ejemplo.get('empresaActualId', 'N/A')}")
    
    # 4. Verificar VehiculoData
    print("\n" + "="*70)
    print("🔧 DATOS TÉCNICOS (VehiculoData)")
    print("="*70)
    
    vehiculos_solo = db["vehiculos_solo"]
    total_vehiculos_solo = await vehiculos_solo.count_documents({})
    
    print(f"\nTotal de VehiculoData: {total_vehiculos_solo}")
    
    if total_vehiculos_solo > 0:
        ejemplo_solo = await vehiculos_solo.find_one({})
        print(f"\n   Placa:           {ejemplo_solo.get('placa_actual', 'N/A')}")
        print(f"   Marca:           {ejemplo_solo.get('marca', 'N/A')}")
        print(f"   Modelo:          {ejemplo_solo.get('modelo', 'N/A')}")
        print(f"   Año:             {ejemplo_solo.get('anio_fabricacion', 'N/A')}")
        print(f"   Motor:           {ejemplo_solo.get('numero_motor', 'N/A')}")
        print(f"   VIN:             {ejemplo_solo.get('vin', 'N/A')}")
    
    # 5. Recomendaciones
    print("\n" + "="*70)
    print("💡 RECOMENDACIONES")
    print("="*70)
    
    problemas = []
    
    if sin_tipo_servicio > 0:
        problemas.append(f"⚠️  {sin_tipo_servicio} vehículos sin tipoServicio")
        print(f"\n1. Agregar tipoServicio a {sin_tipo_servicio} vehículos:")
        print("   db.vehiculos.updateMany(")
        print("     { tipoServicio: { $exists: false } },")
        print("     { $set: { tipoServicio: 'NO_ESPECIFICADO' } }")
        print("   )")
    
    if sin_vehiculo_data_id > 0:
        problemas.append(f"⚠️  {sin_vehiculo_data_id} vehículos sin vehiculoDataId")
        print(f"\n2. Copiar vehiculoSoloId a vehiculoDataId:")
        print("   db.vehiculos.updateMany(")
        print("     { vehiculoSoloId: { $exists: true }, vehiculoDataId: { $exists: false } },")
        print("     [{ $set: { vehiculoDataId: '$vehiculoSoloId' } }]")
        print("   )")
    
    if sin_marca > 0:
        problemas.append(f"ℹ️  {sin_marca} vehículos sin marca (mostrarán 'N/A')")
    
    if not problemas:
        print("\n✅ ¡Base de datos está en perfecto estado!")
        print("   Todos los vehículos tienen los campos necesarios")
    else:
        print(f"\n📊 Resumen: {len(problemas)} problema(s) encontrado(s)")
        for problema in problemas:
            print(f"   {problema}")
    
    # 6. Estado del sistema
    print("\n" + "="*70)
    print("🚀 ESTADO DEL SISTEMA")
    print("="*70)
    
    print("\n✅ Checklist:")
    print(f"   [{'✓' if total_vehiculos > 0 else ' '}] Hay vehículos en la base de datos")
    print(f"   [{'✓' if sin_tipo_servicio == 0 else ' '}] Todos los vehículos tienen tipoServicio")
    print(f"   [{'✓' if sin_vehiculo_data_id == 0 else ' '}] Todos los vehículos tienen vehiculoDataId")
    print(f"   [{'✓' if total_vehiculos_solo > 0 else ' '}] Hay datos técnicos (VehiculoData)")
    
    if sin_tipo_servicio == 0 and sin_vehiculo_data_id == 0:
        print("\n🎉 Sistema listo para usar!")
    else:
        print("\n⚠️  Ejecutar migraciones recomendadas antes de usar el sistema")
    
    client.close()

if __name__ == "__main__":
    print("\n")
    try:
        asyncio.run(diagnosticar())
    except KeyboardInterrupt:
        print("\n\n⚠️  Diagnóstico interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error inesperado: {e}")
    
    print("\n" + "="*70)
    print("Diagnóstico completado")
    print("="*70 + "\n")
