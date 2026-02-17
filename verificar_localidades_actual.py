#!/usr/bin/env python3
"""
Script para verificar el estado actual de las localidades en MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
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

async def verificar_localidades():
    """Verificar estado actual de localidades"""
    
    print_header("🔍 VERIFICACIÓN DE LOCALIDADES")
    
    try:
        # Conectar a MongoDB
        print_info("Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        collection = db.localidades
        
        # 1. Estadísticas generales
        print_header("📊 Estadísticas Generales")
        
        total = await collection.count_documents({})
        print_info(f"Total de localidades: {total}")
        
        if total == 0:
            print_error("No hay localidades en la base de datos")
            print_info("Ejecuta el script de importación de localidades reales")
            client.close()
            return
        
        # Activas vs Inactivas
        activas = await collection.count_documents({"estaActiva": True})
        inactivas = await collection.count_documents({"estaActiva": False})
        print_info(f"Activas: {activas}")
        print_info(f"Inactivas: {inactivas}")
        
        # 2. Por tipo
        print_header("📋 Por Tipo de Localidad")
        
        tipos = await collection.distinct("tipo")
        if tipos:
            for tipo in sorted(tipos):
                count = await collection.count_documents({"tipo": tipo})
                porcentaje = (count / total * 100) if total > 0 else 0
                print_info(f"{tipo}: {count} ({porcentaje:.1f}%)")
        else:
            print_warning("No hay tipos definidos")
        
        # 3. Por departamento
        print_header("🗺️  Por Departamento")
        
        departamentos = await collection.distinct("departamento")
        if departamentos:
            for dept in sorted(departamentos):
                if dept:  # Ignorar None o vacíos
                    count = await collection.count_documents({"departamento": dept})
                    porcentaje = (count / total * 100) if total > 0 else 0
                    print_info(f"{dept}: {count} ({porcentaje:.1f}%)")
        else:
            print_warning("No hay departamentos definidos")
        
        # 4. Por provincia (top 10)
        print_header("🏘️  Top 10 Provincias")
        
        provincias = await collection.distinct("provincia")
        if provincias:
            provincia_counts = []
            for prov in provincias:
                if prov:
                    count = await collection.count_documents({"provincia": prov})
                    provincia_counts.append((prov, count))
            
            # Ordenar por cantidad
            provincia_counts.sort(key=lambda x: x[1], reverse=True)
            
            for i, (prov, count) in enumerate(provincia_counts[:10], 1):
                print_info(f"{i}. {prov}: {count}")
        else:
            print_warning("No hay provincias definidas")
        
        # 5. Verificar duplicados
        print_header("🔍 Verificación de Duplicados")
        
        pipeline = [
            {
                "$group": {
                    "_id": "$nombre",
                    "count": {"$sum": 1}
                }
            },
            {
                "$match": {
                    "count": {"$gt": 1}
                }
            }
        ]
        
        duplicados = await collection.aggregate(pipeline).to_list(None)
        
        if duplicados:
            print_warning(f"Duplicados encontrados: {len(duplicados)}")
            print_info("Primeros 10 duplicados:")
            for i, dup in enumerate(duplicados[:10], 1):
                print_info(f"  {i}. {dup['_id']}: {dup['count']} veces")
        else:
            print_success("No hay duplicados")
        
        # 6. Verificar datos mock
        print_header("🧪 Verificación de Datos Mock")
        
        mock_patterns = [
            ("test", await collection.count_documents({"nombre": {"$regex": "test", "$options": "i"}})),
            ("ejemplo", await collection.count_documents({"nombre": {"$regex": "ejemplo", "$options": "i"}})),
            ("mock", await collection.count_documents({"nombre": {"$regex": "mock", "$options": "i"}})),
            ("prueba", await collection.count_documents({"nombre": {"$regex": "prueba", "$options": "i"}})),
            ("demo", await collection.count_documents({"nombre": {"$regex": "demo", "$options": "i"}})),
        ]
        
        total_mock = sum(count for _, count in mock_patterns)
        
        if total_mock > 0:
            print_warning(f"Datos mock encontrados: {total_mock}")
            for pattern, count in mock_patterns:
                if count > 0:
                    print_info(f"  - {pattern}: {count}")
        else:
            print_success("No hay datos mock")
        
        # 7. Verificar integridad de datos
        print_header("🔍 Verificación de Integridad")
        
        # Sin UBIGEO
        sin_ubigeo = await collection.count_documents({
            "$or": [
                {"ubigeo": {"$exists": False}},
                {"ubigeo": None},
                {"ubigeo": ""}
            ]
        })
        
        if sin_ubigeo > 0:
            print_warning(f"Sin UBIGEO: {sin_ubigeo}")
        else:
            print_success("Todas tienen UBIGEO")
        
        # Sin departamento
        sin_departamento = await collection.count_documents({
            "$or": [
                {"departamento": {"$exists": False}},
                {"departamento": None},
                {"departamento": ""}
            ]
        })
        
        if sin_departamento > 0:
            print_warning(f"Sin departamento: {sin_departamento}")
        else:
            print_success("Todas tienen departamento")
        
        # Sin provincia
        sin_provincia = await collection.count_documents({
            "$or": [
                {"provincia": {"$exists": False}},
                {"provincia": None},
                {"provincia": ""}
            ]
        })
        
        if sin_provincia > 0:
            print_warning(f"Sin provincia: {sin_provincia}")
        else:
            print_success("Todas tienen provincia")
        
        # 8. Muestra de datos
        print_header("📄 Muestra de Datos (Primeras 5)")
        
        muestra = await collection.find({}).limit(5).to_list(5)
        
        for i, loc in enumerate(muestra, 1):
            print_info(f"\n{i}. {loc.get('nombre', 'SIN NOMBRE')}")
            print(f"   UBIGEO: {loc.get('ubigeo', 'N/A')}")
            print(f"   Tipo: {loc.get('tipo', 'N/A')}")
            print(f"   Departamento: {loc.get('departamento', 'N/A')}")
            print(f"   Provincia: {loc.get('provincia', 'N/A')}")
            print(f"   Distrito: {loc.get('distrito', 'N/A')}")
            print(f"   Activa: {loc.get('estaActiva', False)}")
        
        # 9. Resumen final
        print_header("✅ RESUMEN")
        
        problemas = []
        
        if duplicados:
            problemas.append(f"{len(duplicados)} grupos de duplicados")
        
        if total_mock > 0:
            problemas.append(f"{total_mock} registros mock")
        
        if sin_ubigeo > 0:
            problemas.append(f"{sin_ubigeo} sin UBIGEO")
        
        if sin_departamento > 0:
            problemas.append(f"{sin_departamento} sin departamento")
        
        if problemas:
            print_warning("Problemas encontrados:")
            for problema in problemas:
                print_warning(f"  - {problema}")
            print_info("\nEjecuta 'limpiar_localidades_completo.py' para corregir")
        else:
            print_success("✅ Base de datos de localidades en buen estado")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print_error(f"Error durante la verificación: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def main():
    """Función principal"""
    await verificar_localidades()

if __name__ == "__main__":
    asyncio.run(main())
