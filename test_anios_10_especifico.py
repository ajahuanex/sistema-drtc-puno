#!/usr/bin/env python3
"""
Script para probar específicamente los años de vigencia de 10 años
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_resoluciones_10_anios():
    """Verificar resoluciones con 10 años de vigencia en la BD"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("VERIFICACIÓN: Resoluciones con 10 años de vigencia")
    print("=" * 70)
    
    try:
        db = await get_database()
        if not db:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar todas las resoluciones PADRE
        resoluciones_padre = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"\n📊 Total resoluciones PADRE: {len(resoluciones_padre)}")
        
        # Filtrar por años de vigencia
        con_4_anios = [r for r in resoluciones_padre if r.get('aniosVigencia') == 4]
        con_10_anios = [r for r in resoluciones_padre if r.get('aniosVigencia') == 10]
        sin_anios = [r for r in resoluciones_padre if r.get('aniosVigencia') is None]
        otros = [r for r in resoluciones_padre if r.get('aniosVigencia') not in [None, 4, 10]]
        
        print(f"\n📈 Distribución:")
        print(f"   ✅ Con 4 años: {len(con_4_anios)}")
        print(f"   ✅ Con 10 años: {len(con_10_anios)}")
        print(f"   ⚠️  Sin años: {len(sin_anios)}")
        print(f"   ℹ️  Otros: {len(otros)}")
        
        # Mostrar detalles de las que tienen 10 años
        if con_10_anios:
            print(f"\n" + "=" * 70)
            print(f"RESOLUCIONES CON 10 AÑOS ({len(con_10_anios)}):")
            print("=" * 70)
            
            for res in con_10_anios:
                numero = res.get('nroResolucion', 'N/A')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio', 'N/A')
                fecha_fin = res.get('fechaVigenciaFin', 'N/A')
                fecha_registro = res.get('fechaRegistro', 'N/A')
                
                print(f"\n📋 {numero}")
                print(f"   Años Vigencia: {anios} ⭐")
                print(f"   Fecha Inicio: {fecha_inicio}")
                print(f"   Fecha Fin: {fecha_fin}")
                print(f"   Fecha Registro: {fecha_registro}")
        else:
            print(f"\n❌ NO SE ENCONTRARON RESOLUCIONES CON 10 AÑOS")
            print(f"\n💡 Esto indica que:")
            print(f"   1. No se han cargado resoluciones con 10 años, O")
            print(f"   2. Los valores de 10 años no se están guardando correctamente")
        
        # Mostrar algunas con 4 años para comparar
        if con_4_anios:
            print(f"\n" + "=" * 70)
            print(f"MUESTRA DE RESOLUCIONES CON 4 AÑOS (primeras 3):")
            print("=" * 70)
            
            for res in con_4_anios[:3]:
                numero = res.get('nroResolucion', 'N/A')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio', 'N/A')
                fecha_fin = res.get('fechaVigenciaFin', 'N/A')
                
                print(f"\n📋 {numero}")
                print(f"   Años Vigencia: {anios}")
                print(f"   Fecha Inicio: {fecha_inicio}")
                print(f"   Fecha Fin: {fecha_fin}")
        
        # Diagnóstico
        print(f"\n" + "=" * 70)
        print("DIAGNÓSTICO:")
        print("=" * 70)
        
        if len(con_10_anios) == 0 and len(con_4_anios) > 0:
            print(f"\n❌ PROBLEMA CONFIRMADO:")
            print(f"   - Hay {len(con_4_anios)} resoluciones con 4 años")
            print(f"   - NO hay resoluciones con 10 años")
            print(f"\n💡 POSIBLES CAUSAS:")
            print(f"   1. El Excel no tiene valores de 10 años")
            print(f"   2. Los valores de 10 años no se están leyendo correctamente")
            print(f"   3. Los valores de 10 años se están convirtiendo a 4")
            print(f"\n🔧 SIGUIENTE PASO:")
            print(f"   Ejecutar: python test_lectura_excel_10_anios.py")
        elif len(con_10_anios) > 0:
            print(f"\n✅ CORRECTO:")
            print(f"   Se encontraron {len(con_10_anios)} resoluciones con 10 años")
            print(f"   El sistema está funcionando correctamente")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def buscar_ultima_carga():
    """Buscar las últimas resoluciones cargadas"""
    from app.dependencies.db import get_database
    from datetime import datetime, timedelta
    
    print(f"\n" + "=" * 70)
    print("ÚLTIMAS RESOLUCIONES CARGADAS (últimas 24 horas):")
    print("=" * 70)
    
    try:
        db = await get_database()
        if not db:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar resoluciones de las últimas 24 horas
        hace_24h = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        
        resoluciones_recientes = await resoluciones_collection.find({
            "fechaRegistro": {"$gte": hace_24h},
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).sort("fechaRegistro", -1).to_list(length=20)
        
        if resoluciones_recientes:
            print(f"\n📊 Encontradas {len(resoluciones_recientes)} resoluciones recientes:")
            
            for res in resoluciones_recientes:
                numero = res.get('nroResolucion', 'N/A')
                anios = res.get('aniosVigencia', 'N/A')
                fecha_registro = res.get('fechaRegistro', 'N/A')
                
                emoji = "⭐" if anios == 10 else "✓" if anios == 4 else "⚠️"
                print(f"\n{emoji} {numero}")
                print(f"   Años: {anios}")
                print(f"   Registrado: {fecha_registro}")
        else:
            print(f"\n⚠️  No se encontraron resoluciones cargadas en las últimas 24 horas")
            print(f"   Intenta cargar un archivo Excel con resoluciones de 10 años")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🔍 Verificación Específica: Años de Vigencia de 10 años\n")
    
    # Verificar resoluciones con 10 años
    asyncio.run(verificar_resoluciones_10_anios())
    
    # Buscar últimas cargas
    asyncio.run(buscar_ultima_carga())
    
    print("\n" + "=" * 70)
    print("RECOMENDACIONES:")
    print("=" * 70)
    print("1. Si NO hay resoluciones con 10 años:")
    print("   - Generar plantilla: python generar_plantilla_vigencia_actualizada.py")
    print("   - Llenar con valores de 10 años")
    print("   - Cargar en el sistema")
    print("   - Volver a ejecutar este script")
    print("")
    print("2. Si hay resoluciones con 10 años:")
    print("   - El sistema está funcionando correctamente")
    print("   - Verificar en el frontend que se muestren correctamente")
    print("=" * 70)

if __name__ == "__main__":
    main()
