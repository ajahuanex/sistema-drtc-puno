"""
Script para corregir años de vigencia en resoluciones
Calcula automáticamente basándose en fechaVigenciaInicio y fechaVigenciaFin
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dateutil.relativedelta import relativedelta

async def corregir_anios_vigencia():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    resoluciones_collection = db["resoluciones"]
    
    print("🔍 Buscando resoluciones con años de vigencia incorrectos...")
    
    # Obtener todas las resoluciones que tienen fechas de vigencia
    resoluciones = await resoluciones_collection.find({
        "fechaVigenciaInicio": {"$exists": True, "$ne": None},
        "fechaVigenciaFin": {"$exists": True, "$ne": None}
    }).to_list(length=None)
    
    print(f"📊 Total de resoluciones con fechas de vigencia: {len(resoluciones)}")
    
    corregidas = 0
    sin_cambios = 0
    
    for resolucion in resoluciones:
        try:
            fecha_inicio = resolucion.get("fechaVigenciaInicio")
            fecha_fin = resolucion.get("fechaVigenciaFin")
            anios_actual = resolucion.get("aniosVigencia")
            
            if not fecha_inicio or not fecha_fin:
                continue
            
            # Convertir a datetime si son strings
            if isinstance(fecha_inicio, str):
                fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            if isinstance(fecha_fin, str):
                fecha_fin = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
            
            # Calcular años de vigencia basándose en las fechas
            # La diferencia debe ser aproximadamente N años
            diferencia = relativedelta(fecha_fin, fecha_inicio)
            anios_calculados = diferencia.years
            
            # Ajustar si la diferencia de días sugiere que es un año más
            # (por ejemplo, si va de 01/01/2025 a 31/12/2028, son 4 años)
            if diferencia.months >= 11 and diferencia.days >= 28:
                anios_calculados += 1
            
            # Validar que sea 4 o 10 años (los valores típicos)
            if anios_calculados not in [4, 10]:
                # Si no es exactamente 4 o 10, redondear al más cercano
                if anios_calculados < 7:
                    anios_calculados = 4
                else:
                    anios_calculados = 10
            
            # Actualizar si es diferente
            if anios_actual != anios_calculados:
                await resoluciones_collection.update_one(
                    {"_id": resolucion["_id"]},
                    {"$set": {"aniosVigencia": anios_calculados}}
                )
                print(f"✅ Corregido {resolucion['nroResolucion']}: {anios_actual} → {anios_calculados} años")
                corregidas += 1
            else:
                sin_cambios += 1
                
        except Exception as e:
            print(f"❌ Error procesando {resolucion.get('nroResolucion', 'N/A')}: {str(e)}")
    
    print(f"\n📊 Resumen:")
    print(f"   ✅ Corregidas: {corregidas}")
    print(f"   ⚪ Sin cambios: {sin_cambios}")
    print(f"   📝 Total procesadas: {len(resoluciones)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(corregir_anios_vigencia())
