#!/usr/bin/env python3
"""
Script para actualizar años de vigencia de resoluciones existentes
"""
import asyncio
import sys
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def actualizar_resolucion(numero_resolucion, nuevos_anios):
    """Actualizar años de vigencia de una resolución"""
    from app.dependencies.db import get_database
    
    try:
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Buscar resolución
        resolucion = await resoluciones_collection.find_one({
            "nroResolucion": numero_resolucion
        })
        
        if not resolucion:
            print(f"❌ Resolución {numero_resolucion} no encontrada")
            return False
        
        # Obtener fecha de inicio
        fecha_inicio_str = resolucion.get('fechaVigenciaInicio')
        if not fecha_inicio_str:
            print(f"❌ Resolución {numero_resolucion} no tiene fecha de inicio")
            return False
        
        # Parsear fecha de inicio
        if 'T' in fecha_inicio_str:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio_str.replace('Z', '+00:00'))
        else:
            fecha_inicio_dt = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
        
        # Calcular nueva fecha fin
        fecha_fin_dt = fecha_inicio_dt + relativedelta(years=nuevos_anios) - relativedelta(days=1)
        fecha_fin_str = fecha_fin_dt.strftime('%Y-%m-%d')
        
        # Mostrar cambios
        anios_actual = resolucion.get('aniosVigencia', 4)
        fecha_fin_actual = resolucion.get('fechaVigenciaFin', 'N/A')
        
        print(f"\n📋 {numero_resolucion}")
        print(f"   Fecha Inicio: {fecha_inicio_dt.strftime('%d/%m/%Y')}")
        print(f"   Años Actual: {anios_actual} → Nuevo: {nuevos_anios}")
        print(f"   Fecha Fin Actual: {fecha_fin_actual}")
        print(f"   Fecha Fin Nueva: {fecha_fin_str} ({fecha_fin_dt.strftime('%d/%m/%Y')})")
        
        # Actualizar
        resultado = await resoluciones_collection.update_one(
            {"_id": resolucion['_id']},
            {"$set": {
                "aniosVigencia": nuevos_anios,
                "fechaVigenciaFin": fecha_fin_str,
                "fechaActualizacion": datetime.utcnow().isoformat()
            }}
        )
        
        if resultado.modified_count > 0:
            print(f"   ✅ Actualizado correctamente")
            return True
        else:
            print(f"   ⚠️  No se modificó (quizás ya tenía esos valores)")
            return False
            
    except Exception as e:
        print(f"❌ ERROR al actualizar {numero_resolucion}: {e}")
        return False

async def actualizar_masivo_por_fecha_fin():
    """Actualizar masivamente resoluciones que tienen fecha fin después de 2030 pero solo 4 años"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("ACTUALIZACIÓN MASIVA POR FECHA FIN")
    print("=" * 70)
    
    try:
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Buscar resoluciones con fecha fin después de 2030 pero solo 4 años
        print("\n⏳ Buscando resoluciones con fecha fin > 2030 y 4 años...")
        
        resoluciones = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "aniosVigencia": 4,
            "fechaVigenciaFin": {"$gte": "2030-01-01"},
            "estaActivo": True
        }).to_list(length=100)
        
        if not resoluciones:
            print("\n✅ No se encontraron resoluciones para actualizar")
            return
        
        print(f"\n📋 Se encontraron {len(resoluciones)} resoluciones")
        print("\nResoluciones a actualizar:")
        for res in resoluciones:
            print(f"   - {res['nroResolucion']}: {res.get('fechaVigenciaInicio')} → {res.get('fechaVigenciaFin')}")
        
        # Confirmar
        respuesta = input("\n¿Desea actualizar estas resoluciones a 10 años? (s/n): ")
        if respuesta.lower() != 's':
            print("❌ Operación cancelada")
            return
        
        # Actualizar cada una
        print("\n⏳ Actualizando...")
        actualizadas = 0
        
        for res in resoluciones:
            exito = await actualizar_resolucion(res['nroResolucion'], 10)
            if exito:
                actualizadas += 1
        
        print(f"\n✅ Actualizadas {actualizadas} de {len(resoluciones)} resoluciones")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

async def actualizar_lista_especifica(resoluciones_dict):
    """Actualizar una lista específica de resoluciones"""
    print("=" * 70)
    print("ACTUALIZACIÓN DE LISTA ESPECÍFICA")
    print("=" * 70)
    
    print(f"\n📋 Resoluciones a actualizar: {len(resoluciones_dict)}")
    
    for numero, anios in resoluciones_dict.items():
        await actualizar_resolucion(numero, anios)
    
    print("\n✅ Proceso completado")

def main():
    """Función principal"""
    print("\n🔧 ACTUALIZACIÓN DE AÑOS DE VIGENCIA")
    print("=" * 70)
    
    if len(sys.argv) == 1:
        # Modo interactivo
        print("\nModos de uso:")
        print("  1. Actualizar una resolución específica")
        print("  2. Actualizar masivamente por fecha fin")
        print("  3. Actualizar lista específica")
        print("\nEjemplos:")
        print("  python actualizar_anios_vigencia_masivo.py R-0685-2021 10")
        print("  python actualizar_anios_vigencia_masivo.py masivo")
        print("  python actualizar_anios_vigencia_masivo.py lista")
        
    elif len(sys.argv) == 2 and sys.argv[1] == "masivo":
        # Actualización masiva
        asyncio.run(actualizar_masivo_por_fecha_fin())
        
    elif len(sys.argv) == 2 and sys.argv[1] == "lista":
        # Lista específica (editar aquí las resoluciones)
        resoluciones = {
            "R-0685-2021": 10,
            "R-0685-2022": 10,
            # Agregar más resoluciones aquí
        }
        asyncio.run(actualizar_lista_especifica(resoluciones))
        
    elif len(sys.argv) == 3:
        # Actualizar una resolución específica
        numero = sys.argv[1]
        anios = int(sys.argv[2])
        asyncio.run(actualizar_resolucion(numero, anios))
        
    else:
        print("❌ Argumentos inválidos")
        print("\nUso:")
        print("  python actualizar_anios_vigencia_masivo.py R-XXXX-YYYY 10")
        print("  python actualizar_anios_vigencia_masivo.py masivo")
        print("  python actualizar_anios_vigencia_masivo.py lista")

if __name__ == "__main__":
    main()
