"""
Script para corregir TODAS las resoluciones con 10 años que tengan fechas en None
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dateutil.relativedelta import relativedelta
import re

async def corregir_todas():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    resoluciones_collection = db["resoluciones"]
    
    # Buscar todas las resoluciones con 10 años
    resoluciones = await resoluciones_collection.find({
        "aniosVigencia": 10
    }).to_list(length=None)
    
    print("=" * 70)
    print(f"ENCONTRADAS {len(resoluciones)} RESOLUCIONES CON 10 AÑOS")
    print("=" * 70)
    
    corregidas = 0
    ya_correctas = 0
    
    for resolucion in resoluciones:
        numero = resolucion.get('nroResolucion', 'SIN NÚMERO')
        fecha_inicio = resolucion.get('fechaVigenciaInicio')
        fecha_fin = resolucion.get('fechaVigenciaFin')
        
        # Si las fechas ya existen, no hacer nada
        if fecha_inicio is not None and fecha_fin is not None:
            ya_correctas += 1
            print(f"✓ {numero}: Ya tiene fechas correctas")
            continue
        
        # Extraer el año del número de resolución (formato R-XXXX-YYYY)
        match = re.search(r'R-\d+-(\d{4})', numero)
        if not match:
            print(f"⚠️  {numero}: No se pudo extraer el año del número")
            continue
        
        anio_resolucion = int(match.group(1))
        anios_vigencia = resolucion.get('aniosVigencia', 10)
        
        # Establecer fecha de inicio: 01/01/AÑO
        fecha_inicio_nueva = datetime(anio_resolucion, 1, 1)
        
        # Calcular fecha de fin
        fecha_fin_nueva = fecha_inicio_nueva + relativedelta(years=anios_vigencia)
        
        # Actualizar en la base de datos
        resultado = await resoluciones_collection.update_one(
            {"_id": resolucion['_id']},
            {
                "$set": {
                    "fechaVigenciaInicio": fecha_inicio_nueva,
                    "fechaVigenciaFin": fecha_fin_nueva,
                    "fechaActualizacion": datetime.now()
                }
            }
        )
        
        if resultado.modified_count > 0:
            corregidas += 1
            print(f"✅ {numero}: Corregida ({fecha_inicio_nueva.strftime('%d/%m/%Y')} - {fecha_fin_nueva.strftime('%d/%m/%Y')})")
        else:
            print(f"❌ {numero}: No se pudo actualizar")
    
    print("=" * 70)
    print(f"RESUMEN:")
    print(f"  Total encontradas: {len(resoluciones)}")
    print(f"  Ya correctas: {ya_correctas}")
    print(f"  Corregidas: {corregidas}")
    print("=" * 70)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(corregir_todas())
