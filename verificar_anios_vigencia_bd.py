#!/usr/bin/env python3
"""
Script para verificar los años de vigencia en la base de datos
"""
import asyncio
import sys
import os

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_resoluciones():
    """Verificar resoluciones en la base de datos"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print("VERIFICANDO AÑOS DE VIGENCIA EN BASE DE DATOS")
    print("=" * 70)
    
    try:
        # Conectar a la base de datos
        print("\n⏳ Conectando a MongoDB...")
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Obtener todas las resoluciones PADRE activas
        print("⏳ Obteniendo resoluciones PADRE...")
        resoluciones = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).sort("nroResolucion", 1).to_list(length=100)
        
        if not resoluciones:
            print("\n⚠️  No se encontraron resoluciones PADRE en la base de datos")
            return
        
        print(f"\n✅ Se encontraron {len(resoluciones)} resoluciones PADRE")
        
        # Analizar cada resolución
        print("\n" + "=" * 70)
        print("DETALLE DE RESOLUCIONES")
        print("=" * 70)
        
        con_4_anios = 0
        con_10_anios = 0
        sin_anios = 0
        otros = 0
        
        for res in resoluciones:
            numero = res.get('nroResolucion', 'N/A')
            anios = res.get('aniosVigencia', None)
            fecha_inicio = res.get('fechaVigenciaInicio', 'N/A')
            fecha_fin = res.get('fechaVigenciaFin', 'N/A')
            empresa_id = res.get('empresaId', 'N/A')
            
            print(f"\n📋 {numero}")
            print(f"   Años Vigencia: {anios}")
            print(f"   Fecha Inicio: {fecha_inicio}")
            print(f"   Fecha Fin: {fecha_fin}")
            print(f"   Empresa ID: {empresa_id}")
            
            # Clasificar
            if anios is None:
                sin_anios += 1
                print(f"   ⚠️  SIN años de vigencia definidos")
            elif anios == 4:
                con_4_anios += 1
                print(f"   ✅ 4 años de vigencia")
            elif anios == 10:
                con_10_anios += 1
                print(f"   ✅ 10 años de vigencia")
            else:
                otros += 1
                print(f"   ℹ️  {anios} años de vigencia (valor inusual)")
        
        # Resumen
        print("\n" + "=" * 70)
        print("RESUMEN")
        print("=" * 70)
        print(f"\nTotal de resoluciones PADRE: {len(resoluciones)}")
        print(f"   Con 4 años: {con_4_anios}")
        print(f"   Con 10 años: {con_10_anios}")
        print(f"   Sin años definidos: {sin_anios}")
        print(f"   Otros valores: {otros}")
        
        # Verificar si todas tienen 4 años
        if con_4_anios == len(resoluciones) and con_10_anios == 0:
            print("\n❌ PROBLEMA CONFIRMADO:")
            print("   Todas las resoluciones tienen 4 años de vigencia")
            print("   Ninguna tiene 10 años")
            print("\n💡 POSIBLES CAUSAS:")
            print("   1. El Excel no tiene la columna 'Años Vigencia'")
            print("   2. Los valores en el Excel están vacíos")
            print("   3. El Excel tiene un formato incorrecto")
            print("\n💡 SOLUCIÓN:")
            print("   1. Descargar nueva plantilla desde el frontend")
            print("   2. Verificar que la columna F sea 'Años Vigencia'")
            print("   3. Llenar con valores 4 o 10 según corresponda")
            print("   4. Volver a procesar el archivo")
        elif con_10_anios > 0:
            print("\n✅ HAY RESOLUCIONES CON 10 AÑOS")
            print("   El sistema está funcionando correctamente")
        
        # Mostrar resoluciones que deberían tener 10 años
        print("\n" + "=" * 70)
        print("RESOLUCIONES QUE PODRÍAN NECESITAR 10 AÑOS")
        print("=" * 70)
        
        for res in resoluciones:
            numero = res.get('nroResolucion', 'N/A')
            anios = res.get('aniosVigencia', 4)
            fecha_fin = res.get('fechaVigenciaFin', '')
            
            # Si la fecha fin es después de 2030, probablemente debería ser 10 años
            if fecha_fin and '203' in str(fecha_fin) and int(str(fecha_fin)[0:4]) > 2030:
                if anios == 4:
                    print(f"\n⚠️  {numero}")
                    print(f"   Tiene 4 años pero fecha fin en {fecha_fin}")
                    print(f"   Probablemente debería tener 10 años")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

async def actualizar_anios_vigencia(numero_resolucion, nuevos_anios):
    """Actualizar años de vigencia de una resolución específica"""
    from app.dependencies.db import get_database
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    
    print(f"\n⏳ Actualizando {numero_resolucion} a {nuevos_anios} años...")
    
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
        
        # Recalcular fecha fin
        fecha_inicio_str = resolucion.get('fechaVigenciaInicio')
        if fecha_inicio_str:
            if 'T' in fecha_inicio_str:
                fecha_inicio_dt = datetime.fromisoformat(fecha_inicio_str.replace('Z', '+00:00'))
            else:
                fecha_inicio_dt = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
            
            fecha_fin_dt = fecha_inicio_dt + relativedelta(years=nuevos_anios) - relativedelta(days=1)
            fecha_fin_str = fecha_fin_dt.strftime('%Y-%m-%d')
            
            # Actualizar
            await resoluciones_collection.update_one(
                {"_id": resolucion['_id']},
                {"$set": {
                    "aniosVigencia": nuevos_anios,
                    "fechaVigenciaFin": fecha_fin_str,
                    "fechaActualizacion": datetime.utcnow().isoformat()
                }}
            )
            
            print(f"✅ Actualizado:")
            print(f"   Años: {nuevos_anios}")
            print(f"   Fecha Fin: {fecha_fin_str}")
            return True
        else:
            print(f"❌ No se pudo actualizar: falta fecha de inicio")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Función principal"""
    print("\n🔍 Verificando años de vigencia en la base de datos...\n")
    
    if len(sys.argv) > 1:
        # Modo actualización
        if sys.argv[1] == "actualizar" and len(sys.argv) == 4:
            numero = sys.argv[2]
            anios = int(sys.argv[3])
            asyncio.run(actualizar_anios_vigencia(numero, anios))
        else:
            print("Uso para actualizar:")
            print("  python verificar_anios_vigencia_bd.py actualizar R-XXXX-YYYY 10")
    else:
        # Modo verificación
        asyncio.run(verificar_resoluciones())
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
