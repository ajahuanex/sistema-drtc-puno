"""
Script para probar la funcionalidad de renovación automática de resoluciones
"""

import asyncio
import pandas as pd
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.services.resolucion_padres_service import ResolucionPadresService

async def test_renovacion_automatica():
    """
    Prueba que cuando se carga una resolución de tipo RENOVACION,
    el sistema actualiza automáticamente el estado de la resolución anterior
    """
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sirret_db"]
    
    print("=" * 80)
    print("TEST: RENOVACIÓN AUTOMÁTICA DE RESOLUCIONES")
    print("=" * 80)
    print()
    
    # Paso 1: Crear una resolución inicial (la que será renovada)
    print("📝 PASO 1: Crear resolución inicial (0551-2021)")
    print("-" * 80)
    
    resoluciones_collection = db["resoluciones"]
    empresas_collection = db["empresas"]
    
    # Buscar una empresa de prueba
    empresa = await empresas_collection.find_one({"ruc": "20448889719"})
    if not empresa:
        print("❌ ERROR: No se encontró la empresa con RUC 20448889719")
        print("   Buscando cualquier empresa disponible...")
        empresa = await empresas_collection.find_one({})
        if not empresa:
            print("❌ ERROR: No hay empresas en la base de datos")
            return
    
    empresa_id = str(empresa["_id"])
    empresa_ruc = empresa.get("ruc", "Sin RUC")
    print(f"✅ Empresa encontrada: {empresa_ruc}")
    
    # Crear resolución inicial
    resolucion_inicial = {
        "nroResolucion": "R-0551-2021",
        "empresaId": empresa_id,
        "tipoResolucion": "PADRE",
        "tipoTramite": "AUTORIZACION_NUEVA",
        "fechaEmision": datetime(2021, 1, 15),
        "fechaVigenciaInicio": datetime(2021, 1, 15),
        "fechaVigenciaFin": datetime(2025, 1, 15),
        "aniosVigencia": 4,
        "estado": "VIGENTE",
        "descripcion": "Resolución inicial - Test renovación",
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesHijasIds": [],
        "estaActivo": True,
        "fechaRegistro": datetime.now(),
        "usuarioEmisionId": "test_user"
    }
    
    # Eliminar si ya existe
    await resoluciones_collection.delete_one({"nroResolucion": "R-0551-2021"})
    await resoluciones_collection.delete_one({"nroResolucion": "R-0692-2025"})
    
    result = await resoluciones_collection.insert_one(resolucion_inicial)
    print(f"✅ Resolución inicial creada: R-0551-2021 (Estado: VIGENTE)")
    print()
    
    # Paso 2: Crear DataFrame con la renovación
    print("📝 PASO 2: Preparar carga masiva con renovación")
    print("-" * 80)
    
    df = pd.DataFrame({
        'RUC_EMPRESA_ASOCIADA': [empresa_ruc],
        'RESOLUCION_NUMERO': ['0692-2025'],
        'RESOLUCION_ASOCIADA': ['0551-2021'],
        'TIPO_RESOLUCION': ['RENOVACION'],
        'FECHA_RESOLUCION': ['20/10/2025'],
        'FECHA_INICIO_VIGENCIA': ['16/09/2025'],
        'ANIOS_VIGENCIA': [4],
        'FECHA_FIN_VIGENCIA': ['16/09/2029'],
        'ESTADO': ['ACTIVA']
    })
    
    print("✅ DataFrame preparado:")
    print(f"   - Resolución nueva: 0692-2025 (RENOVACION)")
    print(f"   - Resolución asociada: 0551-2021")
    print()
    
    # Paso 3: Procesar la carga masiva
    print("📝 PASO 3: Procesar carga masiva")
    print("-" * 80)
    
    servicio = ResolucionPadresService(db)
    resultado = await servicio.procesar_plantilla_padres(df, "test_user")
    
    if resultado['exito']:
        print(f"✅ {resultado['mensaje']}")
        print(f"   - Creadas: {resultado['estadisticas']['creadas']}")
        print(f"   - Actualizadas: {resultado['estadisticas']['actualizadas']}")
        
        if resultado['advertencias']:
            print(f"\n⚠️  Advertencias:")
            for adv in resultado['advertencias']:
                print(f"   - {adv}")
    else:
        print(f"❌ ERROR: {resultado['mensaje']}")
        if resultado['errores']:
            for error in resultado['errores']:
                print(f"   - {error}")
        return
    
    print()
    
    # Paso 4: Verificar que la resolución anterior cambió de estado
    print("📝 PASO 4: Verificar estado de resoluciones")
    print("-" * 80)
    
    resolucion_anterior = await resoluciones_collection.find_one({"nroResolucion": "R-0551-2021"})
    resolucion_nueva = await resoluciones_collection.find_one({"nroResolucion": "R-0692-2025"})
    
    print("\n🔍 Resolución anterior (R-0551-2021):")
    if resolucion_anterior:
        estado_anterior = resolucion_anterior.get('estado', 'Sin estado')
        renovada_por = resolucion_anterior.get('renovadaPor', 'N/A')
        print(f"   ✅ Estado: {estado_anterior}")
        print(f"   ✅ Renovada por: {renovada_por}")
        
        if estado_anterior == 'RENOVADA':
            print(f"   ✅ ¡ÉXITO! El estado se actualizó correctamente a RENOVADA")
        else:
            print(f"   ❌ ERROR: El estado debería ser RENOVADA pero es {estado_anterior}")
    else:
        print("   ❌ ERROR: No se encontró la resolución anterior")
    
    print("\n🔍 Resolución nueva (R-0692-2025):")
    if resolucion_nueva:
        estado_nueva = resolucion_nueva.get('estado', 'Sin estado')
        resolucion_asociada = resolucion_nueva.get('resolucionAsociada', 'N/A')
        tipo_tramite = resolucion_nueva.get('tipoTramite', 'N/A')
        print(f"   ✅ Estado: {estado_nueva}")
        print(f"   ✅ Tipo trámite: {tipo_tramite}")
        print(f"   ✅ Resolución asociada: {resolucion_asociada}")
        
        if estado_nueva == 'VIGENTE' and tipo_tramite == 'RENOVACION':
            print(f"   ✅ ¡ÉXITO! La resolución nueva se creó correctamente")
        else:
            print(f"   ❌ ERROR: Algo no está correcto en la resolución nueva")
    else:
        print("   ❌ ERROR: No se encontró la resolución nueva")
    
    print()
    print("=" * 80)
    print("TEST COMPLETADO")
    print("=" * 80)
    
    # Limpiar
    print("\n🧹 Limpiando datos de prueba...")
    await resoluciones_collection.delete_one({"nroResolucion": "R-0551-2021"})
    await resoluciones_collection.delete_one({"nroResolucion": "R-0692-2025"})
    print("✅ Datos de prueba eliminados")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_renovacion_automatica())
