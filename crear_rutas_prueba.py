"""
Script para crear rutas de prueba en el sistema
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# Configuración de MongoDB
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "drtc_db"

def crear_rutas_prueba():
    """Crear rutas de prueba para el sistema"""
    
    print("=" * 80)
    print("CREANDO RUTAS DE PRUEBA")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Obtener colecciones
    empresas_col = db['empresas']
    resoluciones_col = db['resoluciones']
    rutas_col = db['rutas']
    
    # Obtener empresas y resoluciones existentes
    empresas = list(empresas_col.find({"estaActivo": True}).limit(3))
    
    if not empresas:
        print("❌ No hay empresas en el sistema")
        print("   Ejecuta primero: python crear_datos_iniciales.py")
        return
    
    print(f"\n✅ Encontradas {len(empresas)} empresas")
    
    rutas_creadas = 0
    
    for empresa in empresas:
        empresa_id = str(empresa['_id'])
        empresa_nombre = empresa.get('razonSocial', 'Sin nombre')
        
        print(f"\n📋 Empresa: {empresa_nombre}")
        
        # Buscar resoluciones VIGENTES de la empresa
        resoluciones = list(resoluciones_col.find({
            "empresaId": empresa_id,
            "estado": "VIGENTE",
            "estaActivo": True,
            "resolucionPadreId": None  # Solo resoluciones padre
        }).limit(2))
        
        if not resoluciones:
            print(f"   ⚠️  No hay resoluciones VIGENTES para esta empresa")
            continue
        
        print(f"   ✅ Encontradas {len(resoluciones)} resoluciones VIGENTES")
        
        for resolucion in resoluciones:
            resolucion_id = str(resolucion['_id'])
            nro_resolucion = resolucion.get('nroResolucion', 'Sin número')
            
            print(f"\n   📄 Resolución: {nro_resolucion}")
            
            # Verificar cuántas rutas ya existen para esta resolución
            rutas_existentes = list(rutas_col.find({
                "resolucionId": resolucion_id,
                "estaActivo": True
            }))
            
            siguiente_codigo = len(rutas_existentes) + 1
            
            print(f"      Rutas existentes: {len(rutas_existentes)}")
            print(f"      Siguiente código: {str(siguiente_codigo).zfill(2)}")
            
            # Crear 3 rutas de ejemplo para cada resolución
            rutas_ejemplo = [
                {
                    "origen": "PUNO",
                    "destino": "JULIACA",
                    "frecuencias": "Diaria, cada 30 minutos",
                    "tipoRuta": "INTERURBANA",
                    "distancia": 45,
                    "tiempoEstimado": 1.0
                },
                {
                    "origen": "PUNO",
                    "destino": "AREQUIPA",
                    "frecuencias": "Diaria, 3 veces al día",
                    "tipoRuta": "INTERPROVINCIAL",
                    "distancia": 275,
                    "tiempoEstimado": 4.5
                },
                {
                    "origen": "JULIACA",
                    "destino": "CUSCO",
                    "frecuencias": "Diaria, 2 veces al día",
                    "tipoRuta": "INTERPROVINCIAL",
                    "distancia": 340,
                    "tiempoEstimado": 5.5
                }
            ]
            
            for i, ruta_data in enumerate(rutas_ejemplo):
                codigo = str(siguiente_codigo + i).zfill(2)
                
                # Verificar si ya existe una ruta con este código
                ruta_existente = rutas_col.find_one({
                    "resolucionId": resolucion_id,
                    "codigoRuta": codigo,
                    "estaActivo": True
                })
                
                if ruta_existente:
                    print(f"      ⚠️  Ruta {codigo} ya existe, saltando...")
                    continue
                
                nueva_ruta = {
                    "_id": ObjectId(),
                    "codigoRuta": codigo,
                    "nombre": f"{ruta_data['origen']} - {ruta_data['destino']}",
                    "origenId": ruta_data['origen'],
                    "destinoId": ruta_data['destino'],
                    "origen": ruta_data['origen'],
                    "destino": ruta_data['destino'],
                    "distancia": ruta_data['distancia'],
                    "tiempoEstimado": ruta_data['tiempoEstimado'],
                    "itinerarioIds": [],
                    "frecuencias": ruta_data['frecuencias'],
                    "estado": "ACTIVA",
                    "estaActivo": True,
                    "empresaId": empresa_id,
                    "resolucionId": resolucion_id,
                    "tipoRuta": ruta_data['tipoRuta'],
                    "tipoServicio": "PASAJEROS",
                    "observaciones": f"Ruta de prueba creada automáticamente",
                    "capacidadMaxima": 40,
                    "tarifaBase": 15.00,
                    "fechaRegistro": datetime.now(),
                    "fechaActualizacion": datetime.now()
                }
                
                # Insertar la ruta
                result = rutas_col.insert_one(nueva_ruta)
                
                if result.inserted_id:
                    print(f"      ✅ Ruta {codigo} creada: {nueva_ruta['nombre']}")
                    rutas_creadas += 1
                else:
                    print(f"      ❌ Error creando ruta {codigo}")
    
    print("\n" + "=" * 80)
    print(f"✅ PROCESO COMPLETADO")
    print(f"   Total de rutas creadas: {rutas_creadas}")
    print("=" * 80)
    
    # Mostrar resumen
    print("\n📊 RESUMEN DE RUTAS POR EMPRESA:")
    print("-" * 80)
    
    for empresa in empresas:
        empresa_id = str(empresa['_id'])
        empresa_nombre = empresa.get('razonSocial', 'Sin nombre')
        
        total_rutas = rutas_col.count_documents({
            "empresaId": empresa_id,
            "estaActivo": True
        })
        
        rutas_activas = rutas_col.count_documents({
            "empresaId": empresa_id,
            "estado": "ACTIVA",
            "estaActivo": True
        })
        
        print(f"\n🏢 {empresa_nombre}")
        print(f"   Total rutas: {total_rutas}")
        print(f"   Rutas activas: {rutas_activas}")
        
        # Mostrar rutas por resolución
        resoluciones = list(resoluciones_col.find({
            "empresaId": empresa_id,
            "estado": "VIGENTE",
            "estaActivo": True
        }))
        
        for resolucion in resoluciones:
            resolucion_id = str(resolucion['_id'])
            nro_resolucion = resolucion.get('nroResolucion', 'Sin número')
            
            rutas_resolucion = list(rutas_col.find({
                "resolucionId": resolucion_id,
                "estaActivo": True
            }))
            
            if rutas_resolucion:
                print(f"\n   📄 Resolución {nro_resolucion}:")
                for ruta in rutas_resolucion:
                    print(f"      • {ruta['codigoRuta']} - {ruta['nombre']} ({ruta['estado']})")
    
    print("\n" + "=" * 80)
    print("🚀 Ahora puedes usar el módulo de rutas en el frontend")
    print("   http://localhost:4200/rutas")
    print("=" * 80)
    
    client.close()

if __name__ == "__main__":
    try:
        crear_rutas_prueba()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
