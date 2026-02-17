"""
Script para verificar y corregir la resolución R-0685-2021
que debería tener 10 años de vigencia pero muestra 4 años
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dateutil.relativedelta import relativedelta

async def corregir_resolucion():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    resoluciones_collection = db["resoluciones"]
    
    # Buscar la resolución R-0685-2021
    resolucion = await resoluciones_collection.find_one({
        "nroResolucion": "R-0685-2021"
    })
    
    if not resolucion:
        print("❌ Resolución R-0685-2021 NO encontrada en la base de datos")
        return
    
    print("=" * 70)
    print("RESOLUCIÓN R-0685-2021 - ESTADO ACTUAL")
    print("=" * 70)
    print(f"ID: {resolucion.get('_id')}")
    print(f"Número: {resolucion.get('nroResolucion')}")
    print(f"Años de vigencia: {resolucion.get('aniosVigencia', 'NO DEFINIDO')}")
    print(f"Fecha inicio vigencia: {resolucion.get('fechaInicioVigencia')}")
    print(f"Fecha fin vigencia: {resolucion.get('fechaFinVigencia')}")
    print(f"Estado: {resolucion.get('estado')}")
    
    # Verificar si tiene el campo aniosVigencia
    anios_actuales = resolucion.get('aniosVigencia')
    
    # Verificar fechas
    fecha_inicio = resolucion.get('fechaInicioVigencia')
    fecha_fin = resolucion.get('fechaFinVigencia')
    
    if fecha_inicio is None or fecha_fin is None:
        print("\n⚠️  PROBLEMA ENCONTRADO: Las fechas de vigencia están en None")
        print("   Esto causa que el frontend calcule incorrectamente los años")
        print("\nBuscando información en otros campos...")
        
        # Buscar en campos alternativos
        fecha_resolucion = resolucion.get('fechaResolucion')
        print(f"   Fecha resolución: {fecha_resolucion}")
        
        # Si no hay fechas, no podemos corregir automáticamente
        print("\n❌ No se pueden corregir las fechas automáticamente sin datos de origen")
        print("   Necesitas reprocesar esta resolución desde el Excel")
        
    elif anios_actuales == 10:
        print("\n✅ La resolución YA tiene 10 años de vigencia correctamente")
        print(f"   Fecha inicio: {fecha_inicio}")
        print(f"   Fecha fin: {fecha_fin}")
    elif anios_actuales == 4:
        print("\n⚠️  La resolución tiene 4 años pero debería tener 10 años")
        print("\n¿Desea corregir a 10 años? (s/n)")
        
        # Para script automático, corregir directamente
        print("Corrigiendo automáticamente...")
        
        # Calcular nueva fecha de fin con 10 años
        fecha_inicio = resolucion.get('fechaInicioVigencia')
        if isinstance(fecha_inicio, str):
            fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
        
        nueva_fecha_fin = fecha_inicio + relativedelta(years=10)
        
        # Actualizar en la base de datos
        resultado = await resoluciones_collection.update_one(
            {"_id": resolucion['_id']},
            {
                "$set": {
                    "aniosVigencia": 10,
                    "fechaFinVigencia": nueva_fecha_fin
                }
            }
        )
        
        if resultado.modified_count > 0:
            print("\n✅ Resolución actualizada correctamente")
            print(f"   Años de vigencia: 4 → 10")
            print(f"   Nueva fecha fin: {nueva_fecha_fin.strftime('%Y-%m-%d')}")
        else:
            print("\n❌ No se pudo actualizar la resolución")
    else:
        print(f"\n⚠️  La resolución tiene {anios_actuales} años (valor inesperado)")
    
    print("=" * 70)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(corregir_resolucion())
