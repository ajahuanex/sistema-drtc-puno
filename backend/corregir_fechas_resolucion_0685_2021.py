"""
Script para corregir las fechas de la resolución R-0685-2021
Calculará las fechas basándose en los 10 años de vigencia
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dateutil.relativedelta import relativedelta

async def corregir_fechas():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    resoluciones_collection = db["resoluciones"]
    
    # Buscar la resolución R-0685-2021
    resolucion = await resoluciones_collection.find_one({
        "nroResolucion": "R-0685-2021"
    })
    
    if not resolucion:
        print("❌ Resolución R-0685-2021 NO encontrada")
        return
    
    print("=" * 70)
    print("CORRIGIENDO FECHAS DE R-0685-2021")
    print("=" * 70)
    
    # Obtener el año de la resolución (2021)
    anio_resolucion = 2021
    anios_vigencia = resolucion.get('aniosVigencia', 10)
    
    # Establecer fecha de inicio: 01/01/2021 (típico para resoluciones del año)
    fecha_inicio = datetime(anio_resolucion, 1, 1)
    
    # Calcular fecha de fin: 10 años después
    fecha_fin = fecha_inicio + relativedelta(years=anios_vigencia)
    
    print(f"Años de vigencia: {anios_vigencia}")
    print(f"Fecha inicio calculada: {fecha_inicio.strftime('%d/%m/%Y')}")
    print(f"Fecha fin calculada: {fecha_fin.strftime('%d/%m/%Y')}")
    
    # Actualizar en la base de datos
    resultado = await resoluciones_collection.update_one(
        {"_id": resolucion['_id']},
        {
            "$set": {
                "fechaVigenciaInicio": fecha_inicio,
                "fechaVigenciaFin": fecha_fin,
                "aniosVigencia": anios_vigencia,
                "fechaActualizacion": datetime.now()
            }
        }
    )
    
    if resultado.modified_count > 0:
        print("\n✅ Resolución actualizada correctamente")
        
        # Verificar
        resolucion_actualizada = await resoluciones_collection.find_one({
            "nroResolucion": "R-0685-2021"
        })
        
        print("\nVerificación:")
        print(f"  Fecha inicio: {resolucion_actualizada.get('fechaVigenciaInicio')}")
        print(f"  Fecha fin: {resolucion_actualizada.get('fechaVigenciaFin')}")
        print(f"  Años vigencia: {resolucion_actualizada.get('aniosVigencia')}")
    else:
        print("\n❌ No se pudo actualizar la resolución")
    
    print("=" * 70)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(corregir_fechas())
