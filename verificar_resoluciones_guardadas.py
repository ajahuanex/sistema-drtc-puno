#!/usr/bin/env python3
"""
Script para verificar las resoluciones guardadas
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar():
    """Verificar resoluciones en BD"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("VERIFICACIÓN: Resoluciones Guardadas")
    print("=" * 70)
    
    try:
        db = await get_database()
        if db is None:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Contar total
        total = await resoluciones_collection.count_documents({"estaActivo": True})
        print(f"\n📊 Total resoluciones activas: {total}")
        
        # Contar por años de vigencia
        con_4 = await resoluciones_collection.count_documents({
            "estaActivo": True,
            "tipoResolucion": "PADRE",
            "aniosVigencia": 4
        })
        
        con_10 = await resoluciones_collection.count_documents({
            "estaActivo": True,
            "tipoResolucion": "PADRE",
            "aniosVigencia": 10
        })
        
        sin_anios = await resoluciones_collection.count_documents({
            "estaActivo": True,
            "tipoResolucion": "PADRE",
            "aniosVigencia": None
        })
        
        print(f"\n📈 Resoluciones PADRE por años de vigencia:")
        print(f"   Con 4 años: {con_4}")
        print(f"   Con 10 años: {con_10}")
        print(f"   Sin años: {sin_anios}")
        
        if con_10 > 0:
            print(f"\n⭐ ¡HAY {con_10} RESOLUCIONES CON 10 AÑOS!")
            
            # Mostrar algunas
            resoluciones_10 = await resoluciones_collection.find({
                "estaActivo": True,
                "tipoResolucion": "PADRE",
                "aniosVigencia": 10
            }).limit(5).to_list(length=5)
            
            print(f"\nPrimeras 5 resoluciones con 10 años:")
            for res in resoluciones_10:
                numero = res.get('nroResolucion')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio')
                fecha_fin = res.get('fechaVigenciaFin')
                print(f"\n   {numero}")
                print(f"      Años: {anios}")
                print(f"      Inicio: {fecha_inicio}")
                print(f"      Fin: {fecha_fin}")
        
        # Verificar si hay algún campo problemático
        print(f"\n🔍 Verificando campos problemáticos...")
        resoluciones_sample = await resoluciones_collection.find({
            "estaActivo": True
        }).limit(1).to_list(length=1)
        
        if resoluciones_sample:
            res = resoluciones_sample[0]
            print(f"\nCampos de una resolución de ejemplo:")
            for key in res.keys():
                valor = res[key]
                tipo = type(valor).__name__
                print(f"   {key}: {tipo}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verificar())
