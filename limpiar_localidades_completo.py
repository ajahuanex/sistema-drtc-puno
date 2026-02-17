#!/usr/bin/env python3
"""
Script para limpiar localidades duplicadas y datos mock en MongoDB
Mantiene solo datos reales y únicos
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

async def limpiar_localidades():
    """Limpiar localidades duplicadas y datos mock"""
    
    print_header("🧹 LIMPIEZA DE LOCALIDADES")
    
    try:
        # Conectar a MongoDB
        print_info("Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        collection = db.localidades
        
        # 1. Estadísticas iniciales
        print_header("📊 Estadísticas Iniciales")
        total_inicial = await collection.count_documents({})
        print_info(f"Total de localidades: {total_inicial}")
        
        # Contar por tipo
        tipos = await collection.distinct("tipo")
        for tipo in tipos:
            count = await collection.count_documents({"tipo": tipo})
            print_info(f"  - {tipo}: {count}")
        
        # 2. Identificar duplicados por nombre
        print_header("🔍 Identificando Duplicados")
        
        pipeline = [
            {
                "$group": {
                    "_id": "$nombre",
                    "count": {"$sum": 1},
                    "ids": {"$push": "$_id"},
                    "docs": {"$push": "$$ROOT"}
                }
            },
            {
                "$match": {
                    "count": {"$gt": 1}
                }
            }
        ]
        
        duplicados = await collection.aggregate(pipeline).to_list(None)
        print_info(f"Grupos de duplicados encontrados: {len(duplicados)}")
        
        # 3. Eliminar duplicados (mantener el primero)
        if duplicados:
            print_header("🗑️  Eliminando Duplicados")
            eliminados = 0
            
            for grupo in duplicados:
                nombre = grupo['_id']
                ids = grupo['ids']
                docs = grupo['docs']
                
                print_info(f"Procesando: {nombre} ({len(ids)} duplicados)")
                
                # Mantener el primero, eliminar el resto
                ids_a_eliminar = ids[1:]
                
                if ids_a_eliminar:
                    result = await collection.delete_many({
                        "_id": {"$in": ids_a_eliminar}
                    })
                    eliminados += result.deleted_count
                    print_success(f"  Eliminados {result.deleted_count} duplicados de '{nombre}'")
            
            print_success(f"Total de duplicados eliminados: {eliminados}")
        else:
            print_success("No se encontraron duplicados")
        
        # 4. Identificar y eliminar datos mock/ejemplo
        print_header("🧪 Identificando Datos Mock")
        
        # Patrones de datos mock
        mock_patterns = [
            {"nombre": {"$regex": "test", "$options": "i"}},
            {"nombre": {"$regex": "ejemplo", "$options": "i"}},
            {"nombre": {"$regex": "mock", "$options": "i"}},
            {"nombre": {"$regex": "prueba", "$options": "i"}},
            {"nombre": {"$regex": "demo", "$options": "i"}},
            {"nombre": {"$regex": "^xxx", "$options": "i"}},
            {"nombre": {"$regex": "^zzz", "$options": "i"}},
            {"ubigeo": {"$regex": "^000"}},
            {"ubigeo": {"$regex": "^999"}},
        ]
        
        mock_count = 0
        for pattern in mock_patterns:
            count = await collection.count_documents(pattern)
            if count > 0:
                print_warning(f"Encontrados {count} registros con patrón: {pattern}")
                mock_count += count
        
        if mock_count > 0:
            print_info(f"Total de registros mock encontrados: {mock_count}")
            
            # Preguntar antes de eliminar
            respuesta = input(f"\n¿Eliminar {mock_count} registros mock? (s/n): ")
            
            if respuesta.lower() == 's':
                eliminados_mock = 0
                for pattern in mock_patterns:
                    result = await collection.delete_many(pattern)
                    if result.deleted_count > 0:
                        eliminados_mock += result.deleted_count
                        print_success(f"  Eliminados {result.deleted_count} registros")
                
                print_success(f"Total de registros mock eliminados: {eliminados_mock}")
            else:
                print_info("Limpieza de mock cancelada")
        else:
            print_success("No se encontraron datos mock")
        
        # 5. Verificar localidades sin UBIGEO
        print_header("🔍 Verificando Localidades sin UBIGEO")
        
        sin_ubigeo = await collection.count_documents({
            "$or": [
                {"ubigeo": {"$exists": False}},
                {"ubigeo": None},
                {"ubigeo": ""}
            ]
        })
        
        if sin_ubigeo > 0:
            print_warning(f"Localidades sin UBIGEO: {sin_ubigeo}")
            print_info("Estas localidades deberían tener UBIGEO asignado")
        else:
            print_success("Todas las localidades tienen UBIGEO")
        
        # 6. Verificar localidades sin departamento
        print_header("🔍 Verificando Localidades sin Departamento")
        
        sin_departamento = await collection.count_documents({
            "$or": [
                {"departamento": {"$exists": False}},
                {"departamento": None},
                {"departamento": ""}
            ]
        })
        
        if sin_departamento > 0:
            print_warning(f"Localidades sin departamento: {sin_departamento}")
            
            # Asignar PUNO por defecto
            respuesta = input(f"\n¿Asignar 'PUNO' como departamento por defecto? (s/n): ")
            
            if respuesta.lower() == 's':
                result = await collection.update_many(
                    {
                        "$or": [
                            {"departamento": {"$exists": False}},
                            {"departamento": None},
                            {"departamento": ""}
                        ]
                    },
                    {
                        "$set": {
                            "departamento": "PUNO",
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                print_success(f"Actualizadas {result.modified_count} localidades")
        else:
            print_success("Todas las localidades tienen departamento")
        
        # 7. Normalizar nombres (mayúsculas)
        print_header("📝 Normalizando Nombres")
        
        # Obtener localidades con nombres en minúsculas o mixtos
        localidades = await collection.find({}).to_list(None)
        
        actualizados = 0
        for loc in localidades:
            nombre_original = loc.get('nombre', '')
            nombre_normalizado = nombre_original.upper().strip()
            
            if nombre_original != nombre_normalizado:
                await collection.update_one(
                    {"_id": loc['_id']},
                    {
                        "$set": {
                            "nombre": nombre_normalizado,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                actualizados += 1
        
        if actualizados > 0:
            print_success(f"Nombres normalizados: {actualizados}")
        else:
            print_success("Todos los nombres ya están normalizados")
        
        # 8. Estadísticas finales
        print_header("📊 Estadísticas Finales")
        
        total_final = await collection.count_documents({})
        print_info(f"Total de localidades: {total_final}")
        
        # Contar por tipo
        tipos = await collection.distinct("tipo")
        for tipo in tipos:
            count = await collection.count_documents({"tipo": tipo})
            print_info(f"  - {tipo}: {count}")
        
        # Contar por departamento
        print_info("\nPor departamento:")
        departamentos = await collection.distinct("departamento")
        for dept in sorted(departamentos):
            count = await collection.count_documents({"departamento": dept})
            print_info(f"  - {dept}: {count}")
        
        # Resumen
        print_header("✅ RESUMEN")
        print_success(f"Localidades iniciales: {total_inicial}")
        print_success(f"Localidades finales: {total_final}")
        print_success(f"Diferencia: {total_inicial - total_final}")
        
        if total_final > 0:
            print_success("\n✅ Base de datos de localidades limpia y lista")
        else:
            print_error("\n⚠️  No hay localidades en la base de datos")
            print_info("Ejecuta el script de importación de localidades reales")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print_error(f"Error durante la limpieza: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def main():
    """Función principal"""
    await limpiar_localidades()

if __name__ == "__main__":
    asyncio.run(main())
