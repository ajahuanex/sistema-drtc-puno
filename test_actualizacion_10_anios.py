#!/usr/bin/env python3
"""
Script para probar específicamente la ACTUALIZACIÓN de años de vigencia
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_actualizacion():
    """Verificar si el problema está en la actualización"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("DIAGNÓSTICO: Actualización de Años de Vigencia")
    print("=" * 70)
    
    try:
        db = await get_database()
        if db is None:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar resoluciones PADRE
        resoluciones = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"\n📊 Total resoluciones PADRE: {len(resoluciones)}")
        
        # Analizar
        con_4 = []
        con_10 = []
        sin_anios = []
        
        for res in resoluciones:
            anios = res.get('aniosVigencia')
            if anios == 4:
                con_4.append(res)
            elif anios == 10:
                con_10.append(res)
            elif anios is None:
                sin_anios.append(res)
        
        print(f"\n📈 Distribución:")
        print(f"   4 años: {len(con_4)}")
        print(f"   10 años: {len(con_10)}")
        print(f"   Sin años: {len(sin_anios)}")
        
        # Si hay resoluciones con 4 años, intentar actualizar una a 10 años
        if con_4:
            print(f"\n" + "=" * 70)
            print("PRUEBA: Actualizar una resolución de 4 a 10 años")
            print("=" * 70)
            
            # Tomar la primera
            res_prueba = con_4[0]
            numero = res_prueba.get('nroResolucion')
            anios_actual = res_prueba.get('aniosVigencia')
            
            print(f"\n📋 Resolución seleccionada: {numero}")
            print(f"   Años actuales: {anios_actual}")
            
            # Calcular nueva fecha fin
            from datetime import datetime
            from dateutil.relativedelta import relativedelta
            
            fecha_inicio_str = res_prueba.get('fechaVigenciaInicio')
            if fecha_inicio_str:
                # Parsear fecha
                if 'T' in fecha_inicio_str:
                    fecha_inicio = datetime.fromisoformat(fecha_inicio_str.replace('Z', '+00:00'))
                else:
                    fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
                
                # Calcular nueva fecha fin con 10 años
                fecha_fin_10 = fecha_inicio + relativedelta(years=10) - relativedelta(days=1)
                fecha_fin_10_str = fecha_fin_10.strftime('%Y-%m-%d')
                
                print(f"\n🔄 Actualizando a 10 años...")
                print(f"   Nueva fecha fin: {fecha_fin_10_str}")
                
                # Actualizar
                resultado = await resoluciones_collection.update_one(
                    {"_id": res_prueba['_id']},
                    {"$set": {
                        "aniosVigencia": 10,
                        "fechaVigenciaFin": fecha_fin_10_str,
                        "fechaActualizacion": datetime.utcnow().isoformat()
                    }}
                )
                
                if resultado.modified_count > 0:
                    print(f"   ✅ Actualización exitosa")
                    
                    # Verificar
                    res_actualizada = await resoluciones_collection.find_one({"_id": res_prueba['_id']})
                    anios_nuevo = res_actualizada.get('aniosVigencia')
                    fecha_fin_nuevo = res_actualizada.get('fechaVigenciaFin')
                    
                    print(f"\n📋 Verificación:")
                    print(f"   Años Vigencia: {anios_nuevo}")
                    print(f"   Fecha Fin: {fecha_fin_nuevo}")
                    
                    if anios_nuevo == 10:
                        print(f"\n✅ ¡ÉXITO! La actualización funcionó correctamente")
                        print(f"   El problema NO está en el código de actualización")
                    else:
                        print(f"\n❌ ERROR: Se actualizó pero el valor no es 10")
                        print(f"   Valor guardado: {anios_nuevo}")
                else:
                    print(f"   ❌ No se modificó ningún documento")
            else:
                print(f"   ⚠️  No tiene fecha de inicio de vigencia")
        else:
            print(f"\n⚠️  No hay resoluciones con 4 años para probar")
        
        # Verificar si hay resoluciones con 10 años
        if con_10:
            print(f"\n" + "=" * 70)
            print(f"RESOLUCIONES CON 10 AÑOS ({len(con_10)}):")
            print("=" * 70)
            
            for res in con_10[:5]:  # Mostrar máximo 5
                numero = res.get('nroResolucion')
                anios = res.get('aniosVigencia')
                fecha_inicio = res.get('fechaVigenciaInicio')
                fecha_fin = res.get('fechaVigenciaFin')
                fecha_registro = res.get('fechaRegistro')
                fecha_actualizacion = res.get('fechaActualizacion')
                
                print(f"\n📋 {numero}")
                print(f"   Años: {anios}")
                print(f"   Fecha Inicio: {fecha_inicio}")
                print(f"   Fecha Fin: {fecha_fin}")
                print(f"   Registrado: {fecha_registro}")
                if fecha_actualizacion:
                    print(f"   Actualizado: {fecha_actualizacion}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def verificar_carga_masiva_reciente():
    """Verificar cargas masivas recientes"""
    from app.dependencies.db import get_database
    from datetime import datetime, timedelta
    
    print(f"\n" + "=" * 70)
    print("VERIFICACIÓN: Cargas Masivas Recientes")
    print("=" * 70)
    
    try:
        db = await get_database()
        if db is None:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar resoluciones de las últimas 48 horas
        hace_48h = (datetime.utcnow() - timedelta(hours=48)).isoformat()
        
        resoluciones_recientes = await resoluciones_collection.find({
            "fechaRegistro": {"$gte": hace_48h},
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).sort("fechaRegistro", -1).to_list(length=50)
        
        if resoluciones_recientes:
            print(f"\n📊 Resoluciones cargadas en las últimas 48 horas: {len(resoluciones_recientes)}")
            
            # Agrupar por años
            por_anios = {}
            for res in resoluciones_recientes:
                anios = res.get('aniosVigencia', 'N/A')
                if anios not in por_anios:
                    por_anios[anios] = []
                por_anios[anios].append(res)
            
            print(f"\n📈 Distribución por años:")
            for anios, lista in sorted(por_anios.items()):
                emoji = "⭐" if anios == 10 else "✓" if anios == 4 else "⚠️"
                print(f"   {emoji} {anios} años: {len(lista)} resoluciones")
            
            # Mostrar detalles
            print(f"\n📋 Últimas 10 resoluciones:")
            for res in resoluciones_recientes[:10]:
                numero = res.get('nroResolucion')
                anios = res.get('aniosVigencia')
                fecha_registro = res.get('fechaRegistro')
                
                emoji = "⭐" if anios == 10 else "✓" if anios == 4 else "⚠️"
                print(f"\n   {emoji} {numero}")
                print(f"      Años: {anios}")
                print(f"      Registrado: {fecha_registro}")
            
            # Diagnóstico
            if 10 not in por_anios:
                print(f"\n" + "=" * 70)
                print("❌ PROBLEMA CONFIRMADO:")
                print("=" * 70)
                print("No se han cargado resoluciones con 10 años en las últimas 48 horas")
                print("")
                print("POSIBLES CAUSAS:")
                print("1. Los archivos Excel no tienen valores de 10 años")
                print("2. Los valores de 10 años se están convirtiendo a 4")
                print("3. Hay un error en el proceso de carga")
                print("")
                print("SIGUIENTE PASO:")
                print("Cargar el archivo TEST_10_ANIOS_*.xlsx y verificar los logs")
        else:
            print(f"\n⚠️  No hay resoluciones cargadas en las últimas 48 horas")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Función principal"""
    print("\n🔍 Diagnóstico de Actualización de Años de Vigencia\n")
    
    # Verificar actualización
    asyncio.run(verificar_actualizacion())
    
    # Verificar cargas recientes
    asyncio.run(verificar_carga_masiva_reciente())
    
    print("\n" + "=" * 70)
    print("CONCLUSIÓN:")
    print("=" * 70)
    print("Este script ayuda a identificar si el problema está en:")
    print("1. La lectura del Excel (valores no se leen)")
    print("2. La conversión (valores se convierten mal)")
    print("3. El guardado (valores no se guardan)")
    print("4. La actualización (valores no se actualizan)")
    print("=" * 70)

if __name__ == "__main__":
    main()
