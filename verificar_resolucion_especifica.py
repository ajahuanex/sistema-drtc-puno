#!/usr/bin/env python3
"""
Script para verificar una resolución específica
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_resolucion(numero):
    """Verificar resolución específica"""
    from app.dependencies.db import get_database
    
    print("=" * 70)
    print(f"VERIFICACIÓN: Resolución {numero}")
    print("=" * 70)
    
    try:
        db = await get_database()
        if db is None:
            print("\n❌ No hay conexión a MongoDB")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Buscar con diferentes formatos
        formatos = [
            numero,
            f"R-{numero}",
            f"R-{numero.zfill(4)}" if '-' not in numero else f"R-{numero}"
        ]
        
        print(f"\n🔍 Buscando con formatos:")
        for fmt in formatos:
            print(f"   - {fmt}")
        
        resolucion = None
        for fmt in formatos:
            resolucion = await resoluciones_collection.find_one({
                "nroResolucion": fmt,
                "estaActivo": True
            })
            if resolucion:
                print(f"\n✅ Encontrada con formato: {fmt}")
                break
        
        if not resolucion:
            print(f"\n❌ No se encontró la resolución")
            
            # Buscar similares
            print(f"\n🔍 Buscando resoluciones similares...")
            similares = await resoluciones_collection.find({
                "nroResolucion": {"$regex": numero.replace('R-', ''), "$options": "i"},
                "estaActivo": True
            }).limit(5).to_list(length=5)
            
            if similares:
                print(f"\nResoluciones similares encontradas:")
                for sim in similares:
                    print(f"   - {sim.get('nroResolucion')}")
            
            return
        
        # Mostrar información completa
        print(f"\n📋 INFORMACIÓN COMPLETA:")
        print(f"   Número: {resolucion.get('nroResolucion')}")
        print(f"   Tipo: {resolucion.get('tipoResolucion')}")
        print(f"   Tipo Trámite: {resolucion.get('tipoTramite')}")
        print(f"   Estado: {resolucion.get('estado')}")
        print(f"   Empresa ID: {resolucion.get('empresaId')}")
        
        print(f"\n📅 FECHAS:")
        print(f"   Emisión: {resolucion.get('fechaEmision')}")
        print(f"   Inicio Vigencia: {resolucion.get('fechaVigenciaInicio')}")
        print(f"   Fin Vigencia: {resolucion.get('fechaVigenciaFin')}")
        
        print(f"\n⭐ AÑOS DE VIGENCIA:")
        anios = resolucion.get('aniosVigencia')
        print(f"   Años: {anios}")
        
        if anios == 10:
            print(f"   ✅ CORRECTO: Tiene 10 años")
        elif anios == 4:
            print(f"   ⚠️  INCORRECTO: Tiene 4 años (debería ser 10)")
        elif anios is None:
            print(f"   ❌ ERROR: No tiene años de vigencia definidos")
        else:
            print(f"   ℹ️  Valor inusual: {anios} años")
        
        print(f"\n🔄 HISTORIAL:")
        print(f"   Fecha Registro: {resolucion.get('fechaRegistro')}")
        print(f"   Fecha Actualización: {resolucion.get('fechaActualizacion')}")
        
        # Verificar si tiene resolución asociada
        if resolucion.get('resolucionAsociada'):
            print(f"   Resolución Asociada: {resolucion.get('resolucionAsociada')}")
        
        # Calcular años de vigencia basado en fechas
        if resolucion.get('fechaVigenciaInicio') and resolucion.get('fechaVigenciaFin'):
            from datetime import datetime
            
            inicio = resolucion.get('fechaVigenciaInicio')
            fin = resolucion.get('fechaVigenciaFin')
            
            if isinstance(inicio, str):
                inicio = datetime.fromisoformat(inicio.replace('Z', '+00:00'))
            if isinstance(fin, str):
                fin = datetime.fromisoformat(fin.replace('Z', '+00:00'))
            
            diferencia = fin - inicio
            anios_calculados = diferencia.days / 365.25
            
            print(f"\n🧮 CÁLCULO BASADO EN FECHAS:")
            print(f"   Diferencia en días: {diferencia.days}")
            print(f"   Años calculados: {anios_calculados:.2f}")
            
            if 9.5 <= anios_calculados <= 10.5:
                print(f"   ✅ Las fechas indican ~10 años")
            elif 3.5 <= anios_calculados <= 4.5:
                print(f"   ⚠️  Las fechas indican ~4 años")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    numero = sys.argv[1] if len(sys.argv) > 1 else "0685-2021"
    asyncio.run(verificar_resolucion(numero))
