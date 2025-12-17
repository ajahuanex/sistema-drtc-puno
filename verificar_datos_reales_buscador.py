#!/usr/bin/env python3
"""
Script para verificar datos reales en la base de datos para el buscador inteligente
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.services.ruta_service import RutaService

async def verificar_datos_reales():
    """Verificar qué datos reales hay en la base de datos"""
    try:
        print("🔍 VERIFICANDO DATOS REALES EN LA BASE DE DATOS...")
        
        # Conectar a MongoDB
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['mesa_partes']
        
        # Crear servicio
        service = RutaService(db)
        
        # Obtener todas las rutas
        rutas = await service.get_rutas()
        print(f"📊 TOTAL DE RUTAS EN BD: {len(rutas)}")
        
        if len(rutas) == 0:
            print("❌ NO HAY RUTAS EN LA BASE DE DATOS")
            print("💡 SUGERENCIA: Ejecutar scripts de creación de datos de prueba")
            client.close()
            return
        
        # Analizar datos de origen y destino
        rutas_con_origen_destino = []
        rutas_sin_origen_destino = []
        
        for ruta in rutas:
            origen = getattr(ruta, 'origen', None) or getattr(ruta, 'origenId', None)
            destino = getattr(ruta, 'destino', None) or getattr(ruta, 'destinoId', None)
            
            if origen and destino:
                rutas_con_origen_destino.append({
                    'id': ruta.id,
                    'codigo': ruta.codigoRuta,
                    'nombre': ruta.nombre,
                    'origen': origen,
                    'destino': destino,
                    'empresaId': ruta.empresaId,
                    'resolucionId': ruta.resolucionId
                })
            else:
                rutas_sin_origen_destino.append({
                    'id': ruta.id,
                    'codigo': ruta.codigoRuta,
                    'nombre': ruta.nombre,
                    'origen': origen,
                    'destino': destino
                })
        
        print(f"✅ RUTAS CON ORIGEN Y DESTINO: {len(rutas_con_origen_destino)}")
        print(f"❌ RUTAS SIN ORIGEN/DESTINO: {len(rutas_sin_origen_destino)}")
        
        if len(rutas_con_origen_destino) > 0:
            print("\n🎯 RUTAS VÁLIDAS PARA EL BUSCADOR INTELIGENTE:")
            for i, ruta in enumerate(rutas_con_origen_destino[:10]):  # Mostrar primeras 10
                print(f"  {i+1}. [{ruta['codigo']}] {ruta['nombre']}")
                print(f"     {ruta['origen']} → {ruta['destino']}")
                print(f"     Empresa: {ruta['empresaId'][:8]}... | Resolución: {ruta['resolucionId'][:8]}...")
                print()
            
            # Crear combinaciones únicas
            combinaciones = set()
            for ruta in rutas_con_origen_destino:
                combinaciones.add(f"{ruta['origen']} → {ruta['destino']}")
            
            print(f"🔍 COMBINACIONES ÚNICAS DISPONIBLES: {len(combinaciones)}")
            for i, comb in enumerate(sorted(combinaciones)[:10]):
                print(f"  {i+1}. {comb}")
            
            if len(combinaciones) > 10:
                print(f"  ... y {len(combinaciones) - 10} más")
        
        if len(rutas_sin_origen_destino) > 0:
            print(f"\n⚠️ RUTAS QUE NECESITAN ORIGEN/DESTINO ({len(rutas_sin_origen_destino)}):")
            for i, ruta in enumerate(rutas_sin_origen_destino[:5]):
                print(f"  {i+1}. [{ruta['codigo']}] {ruta['nombre']}")
                print(f"     Origen: {ruta['origen'] or 'FALTA'} | Destino: {ruta['destino'] or 'FALTA'}")
        
        # Verificar endpoint de combinaciones
        print(f"\n🌐 PROBANDO ENDPOINT /rutas/combinaciones-rutas...")
        try:
            # Simular llamada al endpoint
            rutas_dict = []
            for ruta in rutas:
                origen = getattr(ruta, 'origen', None) or getattr(ruta, 'origenId', None)
                destino = getattr(ruta, 'destino', None) or getattr(ruta, 'destinoId', None)
                
                if origen and destino:
                    rutas_dict.append({
                        'id': ruta.id,
                        'origen': origen,
                        'destino': destino,
                        'combinacion': f"{origen} → {destino}",
                        'codigoRuta': ruta.codigoRuta,
                        'empresaId': ruta.empresaId,
                        'resolucionId': ruta.resolucionId,
                        'estado': ruta.estado
                    })
            
            # Agrupar por combinación única
            combinaciones_unicas = {}
            for ruta_dict in rutas_dict:
                key = ruta_dict['combinacion']
                if key not in combinaciones_unicas:
                    combinaciones_unicas[key] = {
                        'combinacion': ruta_dict['combinacion'],
                        'origen': ruta_dict['origen'],
                        'destino': ruta_dict['destino'],
                        'rutas': []
                    }
                
                combinaciones_unicas[key]['rutas'].append({
                    'id': ruta_dict['id'],
                    'codigoRuta': ruta_dict['codigoRuta'],
                    'empresaId': ruta_dict['empresaId'],
                    'resolucionId': ruta_dict['resolucionId'],
                    'estado': ruta_dict['estado']
                })
            
            resultado_endpoint = list(combinaciones_unicas.values())
            resultado_endpoint.sort(key=lambda x: x['combinacion'])
            
            print(f"✅ ENDPOINT FUNCIONARÍA CON: {len(resultado_endpoint)} combinaciones")
            
            # Probar búsqueda específica
            busqueda_test = "PUNO"
            combinaciones_filtradas = [
                comb for comb in resultado_endpoint 
                if busqueda_test.lower() in comb['combinacion'].lower()
            ]
            
            print(f"🔍 BÚSQUEDA '{busqueda_test}': {len(combinaciones_filtradas)} resultados")
            for comb in combinaciones_filtradas[:3]:
                print(f"  - {comb['combinacion']} ({len(comb['rutas'])} ruta(s))")
        
        except Exception as e:
            print(f"❌ ERROR AL PROBAR ENDPOINT: {e}")
        
        client.close()
        
        # Conclusiones
        print(f"\n📋 RESUMEN:")
        print(f"  • Total rutas: {len(rutas)}")
        print(f"  • Rutas válidas para buscador: {len(rutas_con_origen_destino)}")
        print(f"  • Combinaciones únicas: {len(combinaciones) if 'combinaciones' in locals() else 0}")
        
        if len(rutas_con_origen_destino) > 0:
            print(f"  ✅ EL BUSCADOR INTELIGENTE DEBERÍA FUNCIONAR CON DATOS REALES")
        else:
            print(f"  ❌ NECESITA AGREGAR CAMPOS ORIGEN/DESTINO A LAS RUTAS")
        
    except Exception as e:
        print(f"❌ ERROR GENERAL: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verificar_datos_reales())