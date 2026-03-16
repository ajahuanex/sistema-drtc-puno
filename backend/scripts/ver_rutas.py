"""
Script para ver las primeras 10 rutas de la base de datos
"""
import asyncio
import sys
from pathlib import Path
import json

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

def serializar_objectid(obj):
    """Convierte ObjectId a string para JSON"""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: serializar_objectid(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serializar_objectid(item) for item in obj]
    return obj

async def ver_rutas():
    """Ver las primeras 10 rutas"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    rutas_collection = db["rutas"]
    
    print("=" * 100)
    print("📋 PRIMERAS 10 RUTAS DE LA BASE DE DATOS")
    print("=" * 100)
    
    # Obtener primeras 10 rutas
    rutas = await rutas_collection.find({}).limit(10).to_list(length=10)
    
    print(f"\n📊 Total de rutas encontradas: {len(rutas)}")
    print("-" * 100)
    
    for idx, ruta in enumerate(rutas, 1):
        print(f"\n{'='*100}")
        print(f"RUTA #{idx}")
        print(f"{'='*100}")
        
        # Información básica
        print(f"ID:              {ruta.get('_id')}")
        print(f"Código Ruta:     {ruta.get('codigoRuta', 'N/A')}")
        print(f"Nombre:          {ruta.get('nombre', 'N/A')}")
        print(f"Estado:          {ruta.get('estado', 'N/A')}")
        
        # Empresa
        empresa = ruta.get('empresa', {})
        if isinstance(empresa, dict):
            print(f"\n📌 EMPRESA:")
            print(f"   RUC:          {empresa.get('ruc', 'N/A')}")
            razon_social = empresa.get('razonSocial', 'N/A')
            if isinstance(razon_social, dict):
                print(f"   Razón Social: {razon_social.get('principal', 'N/A')}")
            else:
                print(f"   Razón Social: {razon_social}")
        
        # Resolución
        resolucion = ruta.get('resolucion', {})
        if isinstance(resolucion, dict):
            print(f"\n📄 RESOLUCIÓN:")
            print(f"   Número:       {resolucion.get('nroResolucion', 'N/A')}")
            print(f"   Tipo:         {resolucion.get('tipoResolucion', 'N/A')}")
        
        # Origen
        origen = ruta.get('origen', {})
        if isinstance(origen, dict):
            print(f"\n🚩 ORIGEN:")
            print(f"   ID:           {origen.get('id', 'N/A')}")
            print(f"   Nombre:       {origen.get('nombre', 'N/A')}")
            print(f"   Tipo:         {origen.get('tipo', 'N/A')}")
            print(f"   Ubigeo:       {origen.get('ubigeo', 'N/A')}")
            print(f"   Departamento: {origen.get('departamento', 'N/A')}")
            print(f"   Provincia:    {origen.get('provincia', 'N/A')}")
            print(f"   Distrito:     {origen.get('distrito', 'N/A')}")
            coords = origen.get('coordenadas', {})
            if coords:
                print(f"   Coordenadas:  Lat: {coords.get('latitud', 'N/A')}, Lon: {coords.get('longitud', 'N/A')}")
        
        # Destino
        destino = ruta.get('destino', {})
        if isinstance(destino, dict):
            print(f"\n🏁 DESTINO:")
            print(f"   ID:           {destino.get('id', 'N/A')}")
            print(f"   Nombre:       {destino.get('nombre', 'N/A')}")
            print(f"   Tipo:         {destino.get('tipo', 'N/A')}")
            print(f"   Ubigeo:       {destino.get('ubigeo', 'N/A')}")
            print(f"   Departamento: {destino.get('departamento', 'N/A')}")
            print(f"   Provincia:    {destino.get('provincia', 'N/A')}")
            print(f"   Distrito:     {destino.get('distrito', 'N/A')}")
            coords = destino.get('coordenadas', {})
            if coords:
                print(f"   Coordenadas:  Lat: {coords.get('latitud', 'N/A')}, Lon: {coords.get('longitud', 'N/A')}")
        
        # Itinerario
        itinerario = ruta.get('itinerario', [])
        if itinerario and len(itinerario) > 0:
            print(f"\n🛣️  ITINERARIO ({len(itinerario)} paradas):")
            for parada in itinerario[:5]:  # Solo primeras 5 paradas
                if isinstance(parada, dict):
                    orden = parada.get('orden', 'N/A')
                    nombre = parada.get('nombre', 'N/A')
                    tipo = parada.get('tipo', 'N/A')
                    print(f"   {orden}. {nombre} ({tipo})")
            if len(itinerario) > 5:
                print(f"   ... y {len(itinerario) - 5} paradas más")
        
        # Frecuencia
        frecuencia = ruta.get('frecuencia', {})
        if isinstance(frecuencia, dict):
            print(f"\n⏰ FRECUENCIA:")
            print(f"   Tipo:         {frecuencia.get('tipo', 'N/A')}")
            print(f"   Cantidad:     {frecuencia.get('cantidad', 'N/A')}")
            print(f"   Descripción:  {frecuencia.get('descripcion', 'N/A')}")
        
        # Verificar sincronización
        tiene_info_completa = (
            origen.get('tipo') and origen.get('ubigeo') and origen.get('departamento') and
            destino.get('tipo') and destino.get('ubigeo') and destino.get('departamento')
        )
        
        print(f"\n✅ ESTADO DE SINCRONIZACIÓN:")
        print(f"   Información completa: {'SÍ ✓' if tiene_info_completa else 'NO ✗'}")
        if not tiene_info_completa:
            problemas = []
            if not origen.get('tipo'): problemas.append("origen sin tipo")
            if not origen.get('ubigeo'): problemas.append("origen sin ubigeo")
            if not origen.get('departamento'): problemas.append("origen sin departamento")
            if not destino.get('tipo'): problemas.append("destino sin tipo")
            if not destino.get('ubigeo'): problemas.append("destino sin ubigeo")
            if not destino.get('departamento'): problemas.append("destino sin departamento")
            print(f"   Problemas: {', '.join(problemas)}")
    
    # Resumen general
    print(f"\n{'='*100}")
    print("📊 RESUMEN")
    print(f"{'='*100}")
    
    total_con_info = sum(1 for r in rutas if (
        r.get('origen', {}).get('tipo') and r.get('origen', {}).get('departamento') and
        r.get('destino', {}).get('tipo') and r.get('destino', {}).get('departamento')
    ))
    
    print(f"Rutas con información completa: {total_con_info} de {len(rutas)} ({total_con_info/len(rutas)*100:.1f}%)")
    print(f"Rutas que necesitan sincronización: {len(rutas) - total_con_info}")
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(ver_rutas())
