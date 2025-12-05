"""
Script para verificar el módulo de rutas
Verifica que las rutas estén correctamente asociadas a empresas y resoluciones
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"


async def verificar_modulo_rutas():
    """Verificar el estado del módulo de rutas"""
    
    print("=" * 80)
    print("VERIFICACIÓN DEL MÓDULO DE RUTAS")
    print("=" * 80)
    print()
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # 1. Verificar colecciones
        print("📊 VERIFICANDO COLECCIONES...")
        collections = await db.list_collection_names()
        
        required_collections = ["rutas", "empresas", "resoluciones"]
        for col in required_collections:
            if col in collections:
                count = await db[col].count_documents({})
                print(f"   ✅ {col}: {count} documentos")
            else:
                print(f"   ❌ {col}: NO EXISTE")
        print()
        
        # 2. Verificar rutas
        print("🛣️  VERIFICANDO RUTAS...")
        rutas = await db.rutas.find({"estaActivo": True}).to_list(length=None)
        print(f"   Total de rutas activas: {len(rutas)}")
        print()
        
        if len(rutas) == 0:
            print("   ⚠️  No hay rutas en el sistema")
            print()
        else:
            # Agrupar por resolución
            rutas_por_resolucion = {}
            rutas_sin_resolucion = []
            rutas_sin_empresa = []
            
            for ruta in rutas:
                resolucion_id = ruta.get("resolucionId")
                empresa_id = ruta.get("empresaId")
                
                if not resolucion_id:
                    rutas_sin_resolucion.append(ruta)
                else:
                    if resolucion_id not in rutas_por_resolucion:
                        rutas_por_resolucion[resolucion_id] = []
                    rutas_por_resolucion[resolucion_id].append(ruta)
                
                if not empresa_id:
                    rutas_sin_empresa.append(ruta)
            
            # Mostrar rutas por resolución
            print("   📋 RUTAS POR RESOLUCIÓN:")
            for resolucion_id, rutas_res in rutas_por_resolucion.items():
                # Obtener información de la resolución
                try:
                    resolucion = await db.resoluciones.find_one({"_id": ObjectId(resolucion_id)})
                    if resolucion:
                        nro_resolucion = resolucion.get("nroResolucion", "N/A")
                        estado = resolucion.get("estado", "N/A")
                        tipo = resolucion.get("tipoResolucion", "N/A")
                        print(f"\n   🏢 Resolución: {nro_resolucion} ({estado}, {tipo})")
                    else:
                        print(f"\n   ⚠️  Resolución {resolucion_id} no encontrada")
                except:
                    print(f"\n   ⚠️  Error al obtener resolución {resolucion_id}")
                
                # Mostrar rutas
                codigos = [r.get("codigoRuta", "N/A") for r in rutas_res]
                codigos.sort()
                print(f"      Total rutas: {len(rutas_res)}")
                print(f"      Códigos: {', '.join(codigos)}")
                
                # Verificar códigos únicos
                if len(codigos) != len(set(codigos)):
                    print(f"      ❌ CÓDIGOS DUPLICADOS DETECTADOS!")
                else:
                    print(f"      ✅ Todos los códigos son únicos")
            
            # Mostrar rutas sin resolución
            if rutas_sin_resolucion:
                print(f"\n   ⚠️  RUTAS SIN RESOLUCIÓN: {len(rutas_sin_resolucion)}")
                for ruta in rutas_sin_resolucion:
                    print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'N/A')}")
            
            # Mostrar rutas sin empresa
            if rutas_sin_empresa:
                print(f"\n   ⚠️  RUTAS SIN EMPRESA: {len(rutas_sin_empresa)}")
                for ruta in rutas_sin_empresa:
                    print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'N/A')}")
            
            print()
        
        # 3. Verificar resoluciones VIGENTES
        print("📋 VERIFICANDO RESOLUCIONES VIGENTES...")
        resoluciones_vigentes = await db.resoluciones.find({
            "estado": "VIGENTE",
            "tipoResolucion": "PADRE",
            "estaActivo": True
        }).to_list(length=None)
        
        print(f"   Total de resoluciones VIGENTES y PADRE: {len(resoluciones_vigentes)}")
        
        if len(resoluciones_vigentes) > 0:
            print("\n   📋 RESOLUCIONES DISPONIBLES PARA RUTAS:")
            for res in resoluciones_vigentes:
                nro = res.get("nroResolucion", "N/A")
                empresa_id = res.get("empresaId", "N/A")
                tipo_tramite = res.get("tipoTramite", "N/A")
                
                # Contar rutas de esta resolución
                rutas_count = await db.rutas.count_documents({
                    "resolucionId": str(res["_id"]),
                    "estaActivo": True
                })
                
                # Obtener empresa
                try:
                    empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
                    if empresa:
                        razon_social = empresa.get("razonSocial", {}).get("principal", "N/A")
                        print(f"      • {nro} - {razon_social} ({tipo_tramite})")
                        print(f"        Rutas: {rutas_count}")
                    else:
                        print(f"      • {nro} - Empresa no encontrada ({tipo_tramite})")
                        print(f"        Rutas: {rutas_count}")
                except:
                    print(f"      • {nro} - Error al obtener empresa ({tipo_tramite})")
                    print(f"        Rutas: {rutas_count}")
        print()
        
        # 4. Verificar integridad de relaciones
        print("🔗 VERIFICANDO INTEGRIDAD DE RELACIONES...")
        
        # Verificar que las rutas estén en las empresas
        rutas_con_empresa = [r for r in rutas if r.get("empresaId")]
        problemas_empresa = []
        
        for ruta in rutas_con_empresa:
            empresa_id = ruta.get("empresaId")
            ruta_id = str(ruta["_id"])
            
            try:
                empresa = await db.empresas.find_one({"_id": ObjectId(empresa_id)})
                if empresa:
                    rutas_ids = empresa.get("rutasAutorizadasIds", [])
                    if ruta_id not in rutas_ids:
                        problemas_empresa.append({
                            "ruta": ruta.get("codigoRuta", "N/A"),
                            "empresa": empresa.get("razonSocial", {}).get("principal", "N/A"),
                            "problema": "Ruta no está en empresa.rutasAutorizadasIds"
                        })
            except:
                pass
        
        if problemas_empresa:
            print(f"   ⚠️  PROBLEMAS DE RELACIÓN CON EMPRESAS: {len(problemas_empresa)}")
            for p in problemas_empresa:
                print(f"      - {p['ruta']}: {p['problema']}")
        else:
            print(f"   ✅ Todas las rutas están correctamente relacionadas con empresas")
        
        # Verificar que las rutas estén en las resoluciones
        rutas_con_resolucion = [r for r in rutas if r.get("resolucionId")]
        problemas_resolucion = []
        
        for ruta in rutas_con_resolucion:
            resolucion_id = ruta.get("resolucionId")
            ruta_id = str(ruta["_id"])
            
            try:
                resolucion = await db.resoluciones.find_one({"_id": ObjectId(resolucion_id)})
                if resolucion:
                    rutas_ids = resolucion.get("rutasAutorizadasIds", [])
                    if ruta_id not in rutas_ids:
                        problemas_resolucion.append({
                            "ruta": ruta.get("codigoRuta", "N/A"),
                            "resolucion": resolucion.get("nroResolucion", "N/A"),
                            "problema": "Ruta no está en resolucion.rutasAutorizadasIds"
                        })
            except:
                pass
        
        if problemas_resolucion:
            print(f"   ⚠️  PROBLEMAS DE RELACIÓN CON RESOLUCIONES: {len(problemas_resolucion)}")
            for p in problemas_resolucion:
                print(f"      - {p['ruta']}: {p['problema']}")
        else:
            print(f"   ✅ Todas las rutas están correctamente relacionadas con resoluciones")
        
        print()
        
        # 5. Resumen final
        print("=" * 80)
        print("RESUMEN")
        print("=" * 80)
        print(f"✅ Total de rutas activas: {len(rutas)}")
        print(f"✅ Resoluciones VIGENTES disponibles: {len(resoluciones_vigentes)}")
        print(f"✅ Rutas con empresa: {len(rutas_con_empresa)}")
        print(f"✅ Rutas con resolución: {len(rutas_con_resolucion)}")
        
        if rutas_sin_empresa:
            print(f"⚠️  Rutas sin empresa: {len(rutas_sin_empresa)}")
        
        if rutas_sin_resolucion:
            print(f"⚠️  Rutas sin resolución: {len(rutas_sin_resolucion)}")
        
        if problemas_empresa:
            print(f"⚠️  Problemas de relación con empresas: {len(problemas_empresa)}")
        
        if problemas_resolucion:
            print(f"⚠️  Problemas de relación con resoluciones: {len(problemas_resolucion)}")
        
        print()
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(verificar_modulo_rutas())
