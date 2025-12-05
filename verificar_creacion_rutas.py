"""
Script para verificar que las rutas se crean correctamente con empresa y resolución válidas
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

async def verificar_creacion_rutas():
    """Verificar el estado de las rutas en la base de datos"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["transporte_db"]
    
    print("=" * 80)
    print("🔍 VERIFICACIÓN DE RUTAS EN BASE DE DATOS")
    print("=" * 80)
    
    # 1. Contar rutas totales
    total_rutas = await db.rutas.count_documents({})
    rutas_activas = await db.rutas.count_documents({"estaActivo": True})
    
    print(f"\n📊 ESTADÍSTICAS GENERALES:")
    print(f"   • Total de rutas: {total_rutas}")
    print(f"   • Rutas activas: {rutas_activas}")
    
    # 2. Verificar rutas con IDs inválidos
    print(f"\n🔍 VERIFICANDO INTEGRIDAD DE IDs:")
    
    rutas_invalidas = []
    async for ruta in db.rutas.find({"estaActivo": True}):
        problemas = []
        
        # Verificar empresaId
        if not ruta.get("empresaId"):
            problemas.append("Sin empresaId")
        elif ruta.get("empresaId") == "general":
            problemas.append("empresaId='general' (inválido)")
        else:
            # Verificar que la empresa existe
            try:
                empresa = await db.empresas.find_one({"_id": ObjectId(ruta["empresaId"])})
                if not empresa:
                    problemas.append(f"Empresa {ruta['empresaId']} no existe")
            except:
                problemas.append(f"empresaId inválido: {ruta['empresaId']}")
        
        # Verificar resolucionId
        if not ruta.get("resolucionId"):
            problemas.append("Sin resolucionId")
        elif ruta.get("resolucionId") == "general":
            problemas.append("resolucionId='general' (inválido)")
        else:
            # Verificar que la resolución existe
            try:
                resolucion = await db.resoluciones.find_one({"_id": ObjectId(ruta["resolucionId"])})
                if not resolucion:
                    problemas.append(f"Resolución {ruta['resolucionId']} no existe")
                elif resolucion.get("estado") != "VIGENTE":
                    problemas.append(f"Resolución no VIGENTE: {resolucion.get('estado')}")
                elif resolucion.get("tipoResolucion") != "PADRE":
                    problemas.append(f"Resolución no PADRE: {resolucion.get('tipoResolucion')}")
            except:
                problemas.append(f"resolucionId inválido: {ruta['resolucionId']}")
        
        if problemas:
            rutas_invalidas.append({
                "id": str(ruta["_id"]),
                "codigoRuta": ruta.get("codigoRuta", "SIN_CODIGO"),
                "nombre": ruta.get("nombre", "SIN_NOMBRE"),
                "problemas": problemas
            })
    
    if rutas_invalidas:
        print(f"\n❌ RUTAS CON PROBLEMAS ({len(rutas_invalidas)}):")
        for ruta in rutas_invalidas:
            print(f"\n   Ruta: {ruta['codigoRuta']} - {ruta['nombre']}")
            print(f"   ID: {ruta['id']}")
            for problema in ruta['problemas']:
                print(f"      • {problema}")
    else:
        print(f"\n✅ TODAS LAS RUTAS TIENEN IDs VÁLIDOS")
    
    # 3. Verificar códigos de ruta por resolución
    print(f"\n📋 CÓDIGOS DE RUTA POR RESOLUCIÓN:")
    
    resoluciones = await db.resoluciones.find({"estaActivo": True}).to_list(length=None)
    
    for resolucion in resoluciones:
        resolucion_id = str(resolucion["_id"])
        nro_resolucion = resolucion.get("nroResolucion", "SIN_NUMERO")
        
        rutas_resolucion = await db.rutas.find({
            "resolucionId": resolucion_id,
            "estaActivo": True
        }).to_list(length=None)
        
        if rutas_resolucion:
            print(f"\n   📄 Resolución: {nro_resolucion}")
            print(f"      Total rutas: {len(rutas_resolucion)}")
            
            # Verificar códigos únicos
            codigos = [r.get("codigoRuta") for r in rutas_resolucion]
            codigos_unicos = set(codigos)
            
            if len(codigos) != len(codigos_unicos):
                print(f"      ⚠️  CÓDIGOS DUPLICADOS DETECTADOS")
                duplicados = [c for c in codigos_unicos if codigos.count(c) > 1]
                for dup in duplicados:
                    print(f"         • Código {dup}: {codigos.count(dup)} veces")
            else:
                print(f"      ✅ Todos los códigos son únicos")
            
            # Mostrar códigos
            codigos_ordenados = sorted(codigos)
            print(f"      Códigos: {', '.join(codigos_ordenados)}")
    
    # 4. Verificar relaciones bidireccionales
    print(f"\n🔗 VERIFICANDO RELACIONES BIDIRECCIONALES:")
    
    problemas_relaciones = []
    
    async for ruta in db.rutas.find({"estaActivo": True}):
        ruta_id = str(ruta["_id"])
        
        # Verificar relación con empresa
        if ruta.get("empresaId"):
            try:
                empresa = await db.empresas.find_one({"_id": ObjectId(ruta["empresaId"])})
                if empresa:
                    rutas_empresa = empresa.get("rutasAutorizadasIds", [])
                    if ruta_id not in rutas_empresa:
                        problemas_relaciones.append(
                            f"Ruta {ruta.get('codigoRuta')} no está en empresa {empresa.get('razonSocial', {}).get('principal')}"
                        )
            except:
                pass
        
        # Verificar relación con resolución
        if ruta.get("resolucionId"):
            try:
                resolucion = await db.resoluciones.find_one({"_id": ObjectId(ruta["resolucionId"])})
                if resolucion:
                    rutas_resolucion = resolucion.get("rutasAutorizadasIds", [])
                    if ruta_id not in rutas_resolucion:
                        problemas_relaciones.append(
                            f"Ruta {ruta.get('codigoRuta')} no está en resolución {resolucion.get('nroResolucion')}"
                        )
            except:
                pass
    
    if problemas_relaciones:
        print(f"\n⚠️  PROBLEMAS DE RELACIONES ({len(problemas_relaciones)}):")
        for problema in problemas_relaciones:
            print(f"   • {problema}")
    else:
        print(f"\n✅ TODAS LAS RELACIONES SON BIDIRECCIONALES")
    
    # 5. Resumen final
    print(f"\n" + "=" * 80)
    print(f"📊 RESUMEN FINAL:")
    print(f"=" * 80)
    print(f"   • Total rutas: {total_rutas}")
    print(f"   • Rutas activas: {rutas_activas}")
    print(f"   • Rutas con problemas: {len(rutas_invalidas)}")
    print(f"   • Problemas de relaciones: {len(problemas_relaciones)}")
    
    if not rutas_invalidas and not problemas_relaciones:
        print(f"\n✅ SISTEMA EN PERFECTO ESTADO")
    else:
        print(f"\n⚠️  SE ENCONTRARON PROBLEMAS QUE REQUIEREN ATENCIÓN")
    
    print(f"=" * 80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar_creacion_rutas())
