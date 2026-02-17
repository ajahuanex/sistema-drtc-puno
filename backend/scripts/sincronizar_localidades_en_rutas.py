#!/usr/bin/env python3
"""
Script para sincronizar localidades en rutas
Cuando se actualiza una localidad, actualiza todas las rutas que la usan
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

async def sincronizar_localidades_en_rutas():
    """Sincronizar nombres de localidades en todas las rutas"""
    
    print_header("🔄 SINCRONIZACIÓN DE LOCALIDADES EN RUTAS")
    
    try:
        # Conectar a MongoDB
        print_info("Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        localidades_collection = db.localidades
        rutas_collection = db.rutas
        
        # 1. Obtener todas las localidades
        print_header("1️⃣ Obteniendo Localidades")
        
        localidades = await localidades_collection.find({}).to_list(None)
        print_info(f"Total de localidades: {len(localidades)}")
        
        # Crear mapa de localidades por ID
        localidades_map = {}
        for loc in localidades:
            loc_id = str(loc['_id'])
            localidades_map[loc_id] = loc.get('nombre', 'SIN NOMBRE')
        
        print_success(f"Mapa de localidades creado: {len(localidades_map)} localidades")
        
        # 2. Obtener todas las rutas
        print_header("2️⃣ Obteniendo Rutas")
        
        rutas = await rutas_collection.find({}).to_list(None)
        print_info(f"Total de rutas: {len(rutas)}")
        
        if len(rutas) == 0:
            print_warning("No hay rutas para sincronizar")
            client.close()
            return
        
        # 3. Sincronizar cada ruta
        print_header("3️⃣ Sincronizando Rutas")
        
        actualizadas = 0
        sin_cambios = 0
        errores = 0
        
        for ruta in rutas:
            try:
                ruta_id = ruta['_id']
                codigo_ruta = ruta.get('codigoRuta', 'SIN CÓDIGO')
                cambios = False
                
                # Sincronizar origen
                if 'origen' in ruta and 'id' in ruta['origen']:
                    origen_id = ruta['origen']['id']
                    if origen_id in localidades_map:
                        nombre_actual = ruta['origen'].get('nombre', '')
                        nombre_correcto = localidades_map[origen_id]
                        
                        if nombre_actual != nombre_correcto:
                            print_info(f"  Ruta {codigo_ruta}: Origen '{nombre_actual}' → '{nombre_correcto}'")
                            ruta['origen']['nombre'] = nombre_correcto
                            cambios = True
                
                # Sincronizar destino
                if 'destino' in ruta and 'id' in ruta['destino']:
                    destino_id = ruta['destino']['id']
                    if destino_id in localidades_map:
                        nombre_actual = ruta['destino'].get('nombre', '')
                        nombre_correcto = localidades_map[destino_id]
                        
                        if nombre_actual != nombre_correcto:
                            print_info(f"  Ruta {codigo_ruta}: Destino '{nombre_actual}' → '{nombre_correcto}'")
                            ruta['destino']['nombre'] = nombre_correcto
                            cambios = True
                
                # Sincronizar itinerario
                if 'itinerario' in ruta and isinstance(ruta['itinerario'], list):
                    for i, localidad in enumerate(ruta['itinerario']):
                        if 'id' in localidad:
                            loc_id = localidad['id']
                            if loc_id in localidades_map:
                                nombre_actual = localidad.get('nombre', '')
                                nombre_correcto = localidades_map[loc_id]
                                
                                if nombre_actual != nombre_correcto:
                                    print_info(f"  Ruta {codigo_ruta}: Itinerario[{i}] '{nombre_actual}' → '{nombre_correcto}'")
                                    ruta['itinerario'][i]['nombre'] = nombre_correcto
                                    cambios = True
                
                # Actualizar ruta si hubo cambios
                if cambios:
                    ruta['fechaActualizacion'] = datetime.utcnow()
                    await rutas_collection.replace_one({'_id': ruta_id}, ruta)
                    actualizadas += 1
                    print_success(f"Ruta {codigo_ruta} actualizada")
                else:
                    sin_cambios += 1
                
            except Exception as e:
                print_error(f"Error procesando ruta {codigo_ruta}: {e}")
                errores += 1
        
        # 4. Resumen
        print_header("📊 RESUMEN")
        
        print_info(f"Total de rutas procesadas: {len(rutas)}")
        print_success(f"Rutas actualizadas: {actualizadas}")
        print_info(f"Rutas sin cambios: {sin_cambios}")
        
        if errores > 0:
            print_error(f"Errores: {errores}")
        
        print_header("✅ SINCRONIZACIÓN COMPLETADA")
        
        if actualizadas > 0:
            print_success(f"Se actualizaron {actualizadas} rutas con los nombres correctos de localidades")
        else:
            print_success("Todas las rutas ya estaban sincronizadas")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print_error(f"Error durante la sincronización: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def main():
    """Función principal"""
    await sincronizar_localidades_en_rutas()

if __name__ == "__main__":
    asyncio.run(main())
