#!/usr/bin/env python3
"""
Script para probar la carga masiva de rutas simples
"""
import asyncio
import pandas as pd
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

async def conectar_mongodb():
    """Conectar a MongoDB"""
    try:
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        await client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB")
        return db, client
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None, None

async def crear_archivo_excel_prueba(db):
    """Crear archivo Excel de prueba para carga masiva"""
    try:
        print("📝 Creando archivo Excel de prueba...")
        
        # Obtener datos reales para el archivo
        empresas_collection = db.empresas
        localidades_collection = db.localidades
        
        # Obtener empresas
        empresas_cursor = empresas_collection.find({}).limit(3)
        empresas = await empresas_cursor.to_list(length=3)
        
        # Obtener localidades
        localidades_cursor = localidades_collection.find({}).limit(6)
        localidades = await localidades_cursor.to_list(length=6)
        
        if len(empresas) < 2 or len(localidades) < 4:
            print("❌ No hay suficientes datos para crear archivo de prueba")
            return None
        
        # Crear datos de prueba
        datos_prueba = []
        
        # Ruta 1
        datos_prueba.append({
            'codigoRuta': 'CM01',
            'nombre': f"{localidades[0].get('nombre', 'ORIGEN1')} - {localidades[1].get('nombre', 'DESTINO1')}",
            'origenNombre': localidades[0].get('nombre', 'ORIGEN1'),
            'destinoNombre': localidades[1].get('nombre', 'DESTINO1'),
            'empresaRuc': empresas[0].get('ruc', '20123456789'),
            'resolucionNumero': '',  # Vacío para que use cualquier resolución vigente
            'frecuencias': '08 DIARIAS',
            'tipoRuta': 'INTERPROVINCIAL',
            'tipoServicio': 'PASAJEROS',
            'observaciones': 'Ruta creada por carga masiva - Prueba 1'
        })
        
        # Ruta 2
        datos_prueba.append({
            'codigoRuta': 'CM02',
            'nombre': f"{localidades[2].get('nombre', 'ORIGEN2')} - {localidades[3].get('nombre', 'DESTINO2')}",
            'origenNombre': localidades[2].get('nombre', 'ORIGEN2'),
            'destinoNombre': localidades[3].get('nombre', 'DESTINO2'),
            'empresaRuc': empresas[1].get('ruc', '20987654321'),
            'resolucionNumero': '',
            'frecuencias': '10 DIARIAS',
            'tipoRuta': 'INTERURBANA',
            'tipoServicio': 'PASAJEROS',
            'observaciones': 'Ruta creada por carga masiva - Prueba 2'
        })
        
        # Ruta 3 (con error intencional - empresa inexistente)
        datos_prueba.append({
            'codigoRuta': 'CM03',
            'nombre': 'RUTA CON ERROR',
            'origenNombre': localidades[0].get('nombre', 'ORIGEN1'),
            'destinoNombre': localidades[1].get('nombre', 'DESTINO1'),
            'empresaRuc': '99999999999',  # RUC inexistente
            'resolucionNumero': '',
            'frecuencias': '06 DIARIAS',
            'tipoRuta': 'URBANA',
            'tipoServicio': 'PASAJEROS',
            'observaciones': 'Esta ruta debería fallar por empresa inexistente'
        })
        
        # Crear DataFrame y guardar Excel
        df = pd.DataFrame(datos_prueba)
        archivo_excel = 'rutas_carga_masiva_prueba.xlsx'
        df.to_excel(archivo_excel, index=False)
        
        print(f"✅ Archivo Excel creado: {archivo_excel}")
        print(f"   - {len(datos_prueba)} rutas de prueba")
        print(f"   - 2 rutas válidas, 1 con error intencional")
        
        return archivo_excel
        
    except Exception as e:
        print(f"❌ Error creando archivo Excel: {e}")
        return None

async def simular_carga_masiva(db, archivo_excel):
    """Simular el proceso de carga masiva"""
    try:
        print(f"\n🔄 Simulando carga masiva desde {archivo_excel}")
        print("-" * 50)
        
        # Leer archivo Excel
        df = pd.read_excel(archivo_excel)
        print(f"📊 Archivo leído: {len(df)} filas")
        
        # Obtener colecciones
        rutas_collection = db.rutas
        empresas_collection = db.empresas
        resoluciones_collection = db.resoluciones
        localidades_collection = db.localidades
        
        # Procesar cada fila
        rutas_creadas = []
        errores = []
        
        for index, row in df.iterrows():
            try:
                fila = index + 2  # +2 porque Excel empieza en 1 y hay header
                
                print(f"\n📝 Procesando fila {fila}: {row['codigoRuta']} - {row['nombre']}")
                
                # Validar campos básicos
                codigo_ruta = str(row['codigoRuta']).strip()
                nombre = str(row['nombre']).strip()
                origen_nombre = str(row['origenNombre']).strip()
                destino_nombre = str(row['destinoNombre']).strip()
                empresa_ruc = str(row['empresaRuc']).strip()
                
                if not all([codigo_ruta, nombre, origen_nombre, destino_nombre, empresa_ruc]):
                    error = "Campos requeridos faltantes"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                # Buscar empresa
                empresa = await empresas_collection.find_one({"ruc": empresa_ruc})
                if not empresa:
                    error = f"Empresa con RUC {empresa_ruc} no encontrada"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                print(f"   ✅ Empresa encontrada: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                
                # Buscar resolución vigente de la empresa
                resolucion = await resoluciones_collection.find_one({
                    "empresaId": str(empresa["_id"]),
                    "estado": "VIGENTE"
                })
                
                if not resolucion:
                    error = f"No se encontró resolución vigente para empresa {empresa_ruc}"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                print(f"   ✅ Resolución encontrada: {resolucion.get('nroResolucion', 'N/A')}")
                
                # Buscar localidades
                origen = await localidades_collection.find_one({
                    "nombre": {"$regex": f"^{origen_nombre}$", "$options": "i"}
                })
                
                destino = await localidades_collection.find_one({
                    "nombre": {"$regex": f"^{destino_nombre}$", "$options": "i"}
                })
                
                if not origen:
                    error = f"Localidad origen '{origen_nombre}' no encontrada"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                if not destino:
                    error = f"Localidad destino '{destino_nombre}' no encontrada"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                print(f"   ✅ Localidades encontradas: {origen.get('nombre')} → {destino.get('nombre')}")
                
                # Verificar código único
                ruta_existente = await rutas_collection.find_one({
                    "codigoRuta": codigo_ruta,
                    "resolucion.id": str(resolucion["_id"])
                })
                
                if ruta_existente:
                    error = f"Código '{codigo_ruta}' ya existe en la resolución"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                    continue
                
                # Crear ruta simple
                ruta_nueva = {
                    "codigoRuta": codigo_ruta,
                    "nombre": nombre,
                    
                    "origen": {
                        "id": str(origen["_id"]),
                        "nombre": origen.get("nombre", origen_nombre)
                    },
                    "destino": {
                        "id": str(destino["_id"]),
                        "nombre": destino.get("nombre", destino_nombre)
                    },
                    "itinerario": [],
                    
                    "resolucion": {
                        "id": str(resolucion["_id"]),
                        "nroResolucion": resolucion.get("nroResolucion", ""),
                        "tipoResolucion": resolucion.get("tipoResolucion", "PADRE"),
                        "tipoTramite": resolucion.get("tipoTramite", "PRIMIGENIA"),
                        "estado": resolucion.get("estado", "VIGENTE"),
                        "empresa": {
                            "id": str(empresa["_id"]),
                            "ruc": empresa.get("ruc", empresa_ruc),
                            "razonSocial": empresa.get("razonSocial", {}).get("principal", "")
                        }
                    },
                    
                    "frecuencias": str(row['frecuencias']).strip() if pd.notna(row['frecuencias']) else "08 DIARIAS",
                    "tipoRuta": str(row['tipoRuta']).strip() if pd.notna(row['tipoRuta']) else "INTERPROVINCIAL",
                    "tipoServicio": str(row['tipoServicio']).strip() if pd.notna(row['tipoServicio']) else "PASAJEROS",
                    "estado": "ACTIVA",
                    "estaActivo": True,
                    "fechaRegistro": datetime.utcnow(),
                    "observaciones": str(row['observaciones']).strip() if pd.notna(row['observaciones']) else f"Creada por carga masiva - Fila {fila}"
                }
                
                # Insertar en base de datos
                resultado = await rutas_collection.insert_one(ruta_nueva)
                if resultado.inserted_id:
                    print(f"   ✅ Ruta creada exitosamente: {resultado.inserted_id}")
                    rutas_creadas.append({
                        "fila": fila,
                        "id": str(resultado.inserted_id),
                        "codigoRuta": codigo_ruta,
                        "nombre": nombre
                    })
                else:
                    error = "Error insertando en base de datos"
                    print(f"   ❌ {error}")
                    errores.append({"fila": fila, "error": error})
                
            except Exception as e:
                error = f"Error procesando fila: {str(e)}"
                print(f"   ❌ {error}")
                errores.append({"fila": index + 2, "error": error})
        
        # Mostrar resumen
        print(f"\n📊 RESUMEN DE CARGA MASIVA")
        print("=" * 40)
        print(f"Total procesadas: {len(df)}")
        print(f"Rutas creadas: {len(rutas_creadas)}")
        print(f"Errores: {len(errores)}")
        
        if rutas_creadas:
            print(f"\n✅ RUTAS CREADAS EXITOSAMENTE:")
            for ruta in rutas_creadas:
                print(f"   - Fila {ruta['fila']}: {ruta['codigoRuta']} - {ruta['nombre']}")
        
        if errores:
            print(f"\n❌ ERRORES ENCONTRADOS:")
            for error in errores:
                print(f"   - Fila {error['fila']}: {error['error']}")
        
        return len(rutas_creadas), len(errores)
        
    except Exception as e:
        print(f"❌ Error en simulación de carga masiva: {e}")
        return 0, 1

async def limpiar_rutas_carga_masiva(db):
    """Limpiar rutas creadas por carga masiva"""
    try:
        rutas_collection = db.rutas
        resultado = await rutas_collection.delete_many({
            "codigoRuta": {"$regex": "^CM"}
        })
        print(f"🧹 Eliminadas {resultado.deleted_count} rutas de carga masiva")
        return True
    except Exception as e:
        print(f"❌ Error limpiando rutas: {e}")
        return False

async def main():
    print("🚀 PRUEBA DE CARGA MASIVA - RUTAS SIMPLES")
    print("=" * 60)
    
    # Conectar a MongoDB
    db, client = await conectar_mongodb()
    if db is None:
        return
    
    try:
        # Limpiar rutas anteriores de carga masiva
        await limpiar_rutas_carga_masiva(db)
        
        # Crear archivo Excel de prueba
        archivo_excel = await crear_archivo_excel_prueba(db)
        if not archivo_excel:
            return
        
        # Simular carga masiva
        rutas_creadas, errores = await simular_carga_masiva(db, archivo_excel)
        
        # Mostrar resultado final
        print(f"\n🎯 RESULTADO FINAL DE CARGA MASIVA")
        print("=" * 50)
        print(f"📊 Rutas creadas exitosamente: {rutas_creadas}")
        print(f"❌ Errores encontrados: {errores}")
        
        if rutas_creadas > 0:
            print(f"✅ La carga masiva funcionó correctamente")
            print(f"📁 Archivo de prueba: {archivo_excel}")
            print(f"🔗 Endpoints de carga masiva disponibles:")
            print(f"   - POST /api/v1/rutas/carga-masiva/validar")
            print(f"   - POST /api/v1/rutas/carga-masiva/procesar")
            print(f"   - GET /api/v1/rutas/carga-masiva/plantilla")
        else:
            print(f"❌ La carga masiva no funcionó correctamente")
        
        # Verificar rutas creadas
        rutas_collection = db.rutas
        total_rutas = await rutas_collection.count_documents({})
        rutas_carga_masiva = await rutas_collection.count_documents({"codigoRuta": {"$regex": "^CM"}})
        
        print(f"\n📈 ESTADO ACTUAL DE LA BASE DE DATOS:")
        print(f"   - Total de rutas: {total_rutas}")
        print(f"   - Rutas de carga masiva: {rutas_carga_masiva}")
        
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    asyncio.run(main())