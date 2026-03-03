#!/usr/bin/env python3
"""
Script para importar TODAS las localidades de Puno desde archivos GeoJSON
Importa: Provincias, Distritos y Centros Poblados
"""

import asyncio
import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any
import logging

# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.localidad import TipoLocalidad

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

class ImportadorLocalidadesCompleto:
    """Importador completo de localidades desde archivos GeoJSON"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self.stats = {
            'provincias': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'distritos': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'centros_poblados': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0}
        }
        
    async def conectar(self):
        """Conectar a MongoDB"""
        try:
            self.client = AsyncIOMotorClient(MONGODB_URL)
            self.db = self.client[DATABASE_NAME]
            self.collection = self.db["localidades"]
            logger.info(f"✅ Conectado a MongoDB: {DATABASE_NAME}")
        except Exception as e:
            logger.error(f"❌ Error conectando a MongoDB: {str(e)}")
            raise
    
    async def cerrar(self):
        """Cerrar conexión"""
        if self.client:
            self.client.close()
            logger.info("🔌 Conexión cerrada")
    
    def leer_geojson(self, ruta_archivo: str) -> Dict[str, Any]:
        """Leer archivo GeoJSON"""
        try:
            with open(ruta_archivo, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"📄 Archivo leído: {os.path.basename(ruta_archivo)} ({len(data.get('features', []))} features)")
            return data
        except Exception as e:
            logger.error(f"❌ Error leyendo {ruta_archivo}: {str(e)}")
            raise
    
    def extraer_coordenadas(self, geometry: Dict) -> Dict[str, float] | None:
        """Extraer coordenadas del geometry GeoJSON"""
        if not geometry:
            return None
            
        if geometry.get('type') == 'Point':
            coords = geometry.get('coordinates', [])
            if len(coords) >= 2:
                return {
                    'longitud': float(coords[0]),
                    'latitud': float(coords[1])
                }
        elif geometry.get('type') == 'Polygon':
            # Para polígonos, calcular el centroide aproximado
            coords = geometry.get('coordinates', [[]])
            if coords and len(coords[0]) > 0:
                lons = [c[0] for c in coords[0]]
                lats = [c[1] for c in coords[0]]
                return {
                    'longitud': sum(lons) / len(lons),
                    'latitud': sum(lats) / len(lats)
                }
        return None
    
    async def importar_provincias(self, ruta_archivo: str, modo: str = 'ambos'):
        """Importar provincias desde peru-provincias.geojson"""
        logger.info("\n🏛️  IMPORTANDO PROVINCIAS...")
        
        geojson_data = self.leer_geojson(ruta_archivo)
        features = geojson_data.get('features', [])
        
        for feature in features:
            try:
                props = feature.get('properties', {})
                geometry = feature.get('geometry', {})
                
                nombre = props.get('NOMBPROV', '').strip()
                if not nombre:
                    continue
                
                # Crear documento
                localidad = {
                    'nombre': nombre,
                    'tipo': TipoLocalidad.PROVINCIA,
                    'departamento': 'PUNO',
                    'provincia': nombre,
                    'ubigeo': props.get('IDPROV', '')[:4] if props.get('IDPROV') else '',
                    'coordenadas': self.extraer_coordenadas(geometry),
                    'poblacion': props.get('POBTOTAL', 0),
                    'estaActiva': True,
                    'fechaCreacion': datetime.utcnow(),
                    'fechaActualizacion': datetime.utcnow()
                }
                
                # Verificar si existe
                existe = await self.collection.find_one({
                    'nombre': nombre,
                    'tipo': TipoLocalidad.PROVINCIA,
                    'departamento': 'PUNO'
                })
                
                if existe:
                    if modo in ['actualizar', 'ambos']:
                        await self.collection.update_one(
                            {'_id': existe['_id']},
                            {'$set': localidad}
                        )
                        self.stats['provincias']['actualizados'] += 1
                    else:
                        self.stats['provincias']['omitidos'] += 1
                else:
                    if modo in ['crear', 'ambos']:
                        await self.collection.insert_one(localidad)
                        self.stats['provincias']['importados'] += 1
                        logger.info(f"  ✅ Provincia: {nombre}")
                    
            except Exception as e:
                self.stats['provincias']['errores'] += 1
                logger.error(f"  ❌ Error en provincia: {str(e)}")
    
    async def importar_distritos(self, ruta_archivo: str, modo: str = 'ambos'):
        """Importar distritos desde puno-distritos.geojson"""
        logger.info("\n🏘️  IMPORTANDO DISTRITOS...")
        
        geojson_data = self.leer_geojson(ruta_archivo)
        features = geojson_data.get('features', [])
        
        for idx, feature in enumerate(features):
            try:
                props = feature.get('properties', {})
                geometry = feature.get('geometry', {})
                
                nombre = props.get('DISTRITO', '').strip()
                if not nombre:
                    continue
                
                # Crear documento
                localidad = {
                    'nombre': nombre,
                    'tipo': TipoLocalidad.DISTRITO,
                    'departamento': props.get('DEPARTAMEN', 'PUNO').strip(),
                    'provincia': props.get('PROVINCIA', '').strip(),
                    'distrito': nombre,
                    'ubigeo': props.get('UBIGEO', '').strip(),
                    'coordenadas': self.extraer_coordenadas(geometry),
                    'estaActiva': True,
                    'fechaCreacion': datetime.utcnow(),
                    'fechaActualizacion': datetime.utcnow()
                }
                
                # Verificar si existe
                existe = await self.collection.find_one({
                    'ubigeo': localidad['ubigeo']
                }) if localidad['ubigeo'] else None
                
                if not existe:
                    existe = await self.collection.find_one({
                        'nombre': nombre,
                        'tipo': TipoLocalidad.DISTRITO,
                        'provincia': localidad['provincia']
                    })
                
                if existe:
                    if modo in ['actualizar', 'ambos']:
                        await self.collection.update_one(
                            {'_id': existe['_id']},
                            {'$set': localidad}
                        )
                        self.stats['distritos']['actualizados'] += 1
                    else:
                        self.stats['distritos']['omitidos'] += 1
                else:
                    if modo in ['crear', 'ambos']:
                        await self.collection.insert_one(localidad)
                        self.stats['distritos']['importados'] += 1
                        if (idx + 1) % 20 == 0:
                            logger.info(f"  📈 Progreso: {idx + 1}/{len(features)} distritos...")
                    
            except Exception as e:
                self.stats['distritos']['errores'] += 1
                logger.error(f"  ❌ Error en distrito: {str(e)}")
    
    async def importar_centros_poblados(self, ruta_archivo: str, modo: str = 'ambos'):
        """Importar centros poblados desde puno-centrospoblados.geojson"""
        logger.info("\n🏡 IMPORTANDO CENTROS POBLADOS...")
        
        geojson_data = self.leer_geojson(ruta_archivo)
        features = geojson_data.get('features', [])
        
        for idx, feature in enumerate(features):
            try:
                props = feature.get('properties', {})
                geometry = feature.get('geometry', {})
                
                nombre = props.get('NOMB_CCPP', '').strip()
                if not nombre:
                    continue
                
                # Crear documento
                localidad = {
                    'nombre': nombre,
                    'tipo': TipoLocalidad.CENTRO_POBLADO,
                    'departamento': props.get('NOMB_DEPAR', 'PUNO').strip(),
                    'provincia': props.get('NOMB_PROVI', '').strip(),
                    'distrito': props.get('NOMB_DISTR', '').strip(),
                    'ubigeo': props.get('UBIGEO', '').strip(),
                    'codigo_ccpp': props.get('COD_CCPP', '').strip(),
                    'tipo_area': props.get('TIPO', '').strip(),
                    'poblacion': props.get('POBTOTAL', 0),
                    'coordenadas': self.extraer_coordenadas(geometry),
                    'estaActiva': True,
                    'fechaCreacion': datetime.utcnow(),
                    'fechaActualizacion': datetime.utcnow()
                }
                
                # Verificar si existe
                existe = await self.collection.find_one({
                    'nombre': nombre,
                    'tipo': TipoLocalidad.CENTRO_POBLADO,
                    'distrito': localidad['distrito'],
                    'provincia': localidad['provincia']
                })
                
                if existe:
                    if modo in ['actualizar', 'ambos']:
                        await self.collection.update_one(
                            {'_id': existe['_id']},
                            {'$set': localidad}
                        )
                        self.stats['centros_poblados']['actualizados'] += 1
                    else:
                        self.stats['centros_poblados']['omitidos'] += 1
                else:
                    if modo in ['crear', 'ambos']:
                        await self.collection.insert_one(localidad)
                        self.stats['centros_poblados']['importados'] += 1
                
                # Mostrar progreso cada 100
                if (idx + 1) % 100 == 0:
                    logger.info(f"  📈 Progreso: {idx + 1}/{len(features)} centros poblados...")
                    
            except Exception as e:
                self.stats['centros_poblados']['errores'] += 1
                logger.error(f"  ❌ Error en centro poblado: {str(e)}")
    
    async def importar_todo(self, modo: str = 'ambos'):
        """Importar todas las localidades en orden jerárquico"""
        base_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'frontend', 'src', 'assets', 'geojson'
        )
        
        # 1. Importar provincias
        ruta_provincias = os.path.join(base_path, 'peru-provincias.geojson')
        if os.path.exists(ruta_provincias):
            await self.importar_provincias(ruta_provincias, modo)
        else:
            logger.warning(f"⚠️  No se encontró: {ruta_provincias}")
        
        # 2. Importar distritos
        ruta_distritos = os.path.join(base_path, 'puno-distritos.geojson')
        if os.path.exists(ruta_distritos):
            await self.importar_distritos(ruta_distritos, modo)
        else:
            logger.warning(f"⚠️  No se encontró: {ruta_distritos}")
        
        # 3. Importar centros poblados
        ruta_centros = os.path.join(base_path, 'puno-centrospoblados.geojson')
        if os.path.exists(ruta_centros):
            await self.importar_centros_poblados(ruta_centros, modo)
        else:
            logger.warning(f"⚠️  No se encontró: {ruta_centros}")
    
    def mostrar_resumen(self):
        """Mostrar resumen de la importación"""
        print("\n" + "=" * 70)
        print("📊 RESUMEN FINAL DE IMPORTACIÓN")
        print("=" * 70)
        
        for tipo, stats in self.stats.items():
            print(f"\n{tipo.upper().replace('_', ' ')}:")
            print(f"  ✅ Importados: {stats['importados']}")
            print(f"  ✏️  Actualizados: {stats['actualizados']}")
            print(f"  ⏭️  Omitidos: {stats['omitidos']}")
            print(f"  ❌ Errores: {stats['errores']}")
        
        total_importados = sum(s['importados'] for s in self.stats.values())
        total_actualizados = sum(s['actualizados'] for s in self.stats.values())
        
        print("\n" + "=" * 70)
        print(f"TOTAL IMPORTADOS: {total_importados}")
        print(f"TOTAL ACTUALIZADOS: {total_actualizados}")
        print("=" * 70)

async def main():
    """Función principal"""
    print("=" * 70)
    print("🗺️  IMPORTADOR COMPLETO DE LOCALIDADES DE PUNO")
    print("=" * 70)
    print("\nEste script importará:")
    print("  • Provincias (13)")
    print("  • Distritos (~110)")
    print("  • Centros Poblados (~3000)")
    print()
    
    importador = ImportadorLocalidadesCompleto()
    
    try:
        await importador.conectar()
        
        print("Selecciona el modo de importación:")
        print("1. Crear solo nuevos (no actualiza existentes)")
        print("2. Actualizar solo existentes (no crea nuevos)")
        print("3. Crear y actualizar (RECOMENDADO)")
        print("0. Salir")
        print()
        
        opcion = input("Ingresa tu opción [3]: ").strip() or "3"
        
        if opcion == "1":
            await importador.importar_todo(modo='crear')
            importador.mostrar_resumen()
            
        elif opcion == "2":
            await importador.importar_todo(modo='actualizar')
            importador.mostrar_resumen()
            
        elif opcion == "3":
            await importador.importar_todo(modo='ambos')
            importador.mostrar_resumen()
            
        elif opcion == "0":
            print("\n👋 ¡Hasta luego!")
            
        else:
            print("\n❌ Opción no válida")
        
    except Exception as e:
        logger.error(f"❌ Error en ejecución: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        
    finally:
        await importador.cerrar()

if __name__ == "__main__":
    asyncio.run(main())
