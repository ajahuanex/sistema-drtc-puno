#!/usr/bin/env python3
"""
Script para verificar las resoluciones cargadas en la base de datos
"""
import sys
import os
import asyncio

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_resoluciones():
    """Verificar las resoluciones en la base de datos"""
    print("🔍 VERIFICANDO RESOLUCIONES EN LA BASE DE DATOS")
    print("=" * 60)
    
    try:
        from backend.app.dependencies.db import get_database
        
        # Obtener conexión a la base de datos
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Contar resoluciones
        total = await resoluciones_collection.count_documents({})
        print(f"📊 Total de resoluciones: {total}")
        
        if total == 0:
            print("❌ No hay resoluciones en la base de datos")
            return False
        
        # Obtener algunas resoluciones de muestra
        print(f"\n📋 Primeras 5 resoluciones:")
        print("-" * 80)
        
        resoluciones = await resoluciones_collection.find({}).limit(5).to_list(5)
        
        for i, resolucion in enumerate(resoluciones, 1):
            print(f"\n{i}. ID: {resolucion.get('_id')}")
            print(f"   Número: {resolucion.get('nroResolucion', 'N/A')}")
            print(f"   Empresa ID: {resolucion.get('empresaId', 'N/A')}")
            print(f"   Fecha Emisión: {resolucion.get('fechaEmision', 'N/A')}")
            print(f"   Fecha Vigencia Inicio: {resolucion.get('fechaVigenciaInicio', 'N/A')}")
            print(f"   Estado: {resolucion.get('estado', 'N/A')}")
            print(f"   Está Activo: {resolucion.get('estaActivo', 'N/A')}")
            print(f"   Tipo Resolución: {resolucion.get('tipoResolucion', 'N/A')}")
        
        # Verificar estructura de campos
        print(f"\n🔍 VERIFICANDO ESTRUCTURA DE CAMPOS:")
        print("-" * 50)
        
        if resoluciones:
            primer_resolucion = resoluciones[0]
            campos_esperados = [
                '_id', 'nroResolucion', 'empresaId', 'tipoResolucion', 
                'fechaVigenciaInicio', 'fechaVigenciaFin', 'estado', 'estaActivo'
            ]
            
            for campo in campos_esperados:
                tiene_campo = campo in primer_resolucion
                valor = primer_resolucion.get(campo, 'N/A')
                status = "✅" if tiene_campo else "❌"
                print(f"{status} {campo}: {valor}")
        
        # Verificar filtros comunes
        print(f"\n📊 ESTADÍSTICAS:")
        print("-" * 30)
        
        activas = await resoluciones_collection.count_documents({"estaActivo": True})
        inactivas = await resoluciones_collection.count_documents({"estaActivo": False})
        vigentes = await resoluciones_collection.count_documents({"estado": "VIGENTE"})
        padres = await resoluciones_collection.count_documents({"tipoResolucion": "PADRE"})
        
        print(f"Activas: {activas}")
        print(f"Inactivas: {inactivas}")
        print(f"Vigentes: {vigentes}")
        print(f"Tipo PADRE: {padres}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando resoluciones: {e}")
        import traceback
        traceback.print_exc()
        return False

async def verificar_endpoint_api():
    """Verificar si el endpoint de la API funciona"""
    print(f"\n🌐 VERIFICANDO ENDPOINT DE API")
    print("=" * 40)
    
    try:
        import aiohttp
        
        async with aiohttp.ClientSession() as session:
            # Probar endpoint básico
            async with session.get('http://localhost:8000/api/v1/resoluciones') as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ API responde correctamente")
                    print(f"   Status: {response.status}")
                    print(f"   Resoluciones devueltas: {len(data) if isinstance(data, list) else 'N/A'}")
                    
                    if isinstance(data, list) and len(data) > 0:
                        print(f"   Primera resolución ID: {data[0].get('id', 'N/A')}")
                        print(f"   Primera resolución número: {data[0].get('nroResolucion', 'N/A')}")
                    
                    return True
                else:
                    print(f"❌ API error: Status {response.status}")
                    text = await response.text()
                    print(f"   Respuesta: {text[:200]}...")
                    return False
                    
    except Exception as e:
        print(f"❌ Error verificando API: {e}")
        print("   ¿Está el backend ejecutándose en puerto 8000?")
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO VERIFICACIÓN DE RESOLUCIONES")
    print("=" * 60)
    
    db_ok = await verificar_resoluciones()
    api_ok = await verificar_endpoint_api()
    
    print("\n" + "=" * 60)
    print("📋 RESUMEN:")
    print(f"   Base de datos: {'✅ OK' if db_ok else '❌ ERROR'}")
    print(f"   API endpoint: {'✅ OK' if api_ok else '❌ ERROR'}")
    
    if db_ok and not api_ok:
        print("\n💡 POSIBLES CAUSAS:")
        print("   - Backend no está ejecutándose")
        print("   - Puerto 8000 no disponible")
        print("   - Error en el endpoint de resoluciones")
    elif not db_ok:
        print("\n💡 POSIBLES CAUSAS:")
        print("   - Carga masiva no se completó correctamente")
        print("   - Problema de conexión a MongoDB")
        print("   - Datos no se guardaron en la colección correcta")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())