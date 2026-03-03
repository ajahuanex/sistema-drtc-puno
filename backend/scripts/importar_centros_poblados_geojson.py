#!/usr/bin/env python3
"""
Script para importar centros poblados de Puno desde archivo GeoJSON
Lee el archivo puno-centrospoblados.geojson y guarda los datos en MongoDB
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

class ImportadorCentrosPobladosGeoJSON:
    """Importador de centros poblados desde archivo GeoJSON"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        
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
            logger.info(f"📄 Archivo GeoJSON leído: {ruta_archivo}")
            return data
        except Exception as e:
            logger.error(f"❌ Error leyendo archivo GeoJSON: {str(e)}")
            raise
    
    def extraer_coordenadas(self, geometry: Dict) -> Dict[str, float]:
        """Extraer coordenadas del geometry GeoJSON"""
        if geometry and geometry.get('type') == 'Point':
            coords = geometry.get('coordinates', [])
            if len(coords) >= 2:
                return {
                    'longitud': coords[0],
                    'latitud': coords[1]
                }
        return None
    
    def convertir_feature_a_localidad(self, feature: Dict) -> Dict[str, Any]:
        """Convertir un feature GeoJSON a documento de localidad"""
        props = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        
        # Extraer coordenadas
        coordenadas = self.extraer_coordenadas(geometry)
        
        # Crear documento de localidad
        localidad = {
            'nombre': props.get('NOMB_CCPP', 'SIN NOMBRE').strip(),
            'tipo': TipoLocalidad.CENTRO_POBLADO,
            'ubigeo': props.get('UBIGEO', '').strip(),
            'departamento': props.get('NOMB_DEPAR', 'PUNO').strip(),
            'provincia': props.get('NOMB_PROVI', '').strip(),
            'distrito': props.get('NOMB_DISTR', '').strip(),
            'coordenadas': coordenadas,
            'estaActiva': True,
            'fechaCreacion': datetime.utcnow(),
            'fechaActualizacion': datetime.utcnow(),
            'fuente_datos': 'GeoJSON',
            
            # Datos adicionales del GeoJSON
            'metadata': {
                'codigo_ccpp': props.get('COD_CCPP', ''),
                'idccpp': props.get('IDCCPP', ''),
                'llave_idma': props.get('LLAVE_IDMA', ''),
                'poblacion_total': props.get('POBTOTAL', 0),
                'poblacion_hombres': props.get('TOTHOMBRES', 0),
                'poblacion_mujeres': props.get('TOTMUJERES', 0),
                'viviendas_particulares': props.get('VIV_PARTIC', 0),
                'tipo_area': props.get('TIPO', ''),  # Rural/Urbano
                'poblacion_vulnerable': props.get('POBVULNERA', 0),
                'contacto': props.get('contacto', ''),
                'whatsapp': props.get('whatsapp', '')
            }
        }
        
        return localidad
    
    async def verificar_existente(self, ubigeo: str, nombre: str) -> bool:
        """Verificar si ya existe una localidad con ese ubigeo o nombre"""
        if ubigeo:
            existe = await self.collection.find_one({'ubigeo': ubigeo})
            if existe:
                return True
        
        # Verificar por nombre exacto en el mismo departamento
        existe = await self.collection.find_one({
            'nombre': nombre,
            'departamento': 'PUNO',
            'tipo': TipoLocalidad.CENTRO_POBLADO
        })
        return existe is not None
    
    async def importar_desde_geojson(self, ruta_archivo: str, modo: str = 'crear') -> Dict[str, Any]:
        """
        Importar centros poblados desde archivo GeoJSON
        
        Args:
            ruta_archivo: Ruta al archivo GeoJSON
            modo: 'crear' (solo nuevos), 'actualizar' (actualizar existentes), 'ambos'
        """
        logger.info(f"🚀 Iniciando importación desde GeoJSON (modo: {modo})...")
        
        # Leer archivo GeoJSON
        geojson_data = self.leer_geojson(ruta_archivo)
        features = geojson_data.get('features', [])
        
        logger.info(f"📊 Total de features en GeoJSON: {len(features)}")
        
        # Contadores
        procesados = 0
        importados = 0
        actualizados = 0
        omitidos = 0
        errores = []
        
        for feature in features:
            try:
                localidad = self.convertir_feature_a_localidad(feature)
                nombre = localidad['nombre']
                ubigeo = localidad.get('ubigeo', '')
                
                # Verificar si existe
                existe = await self.verificar_existente(ubigeo, nombre)
                
                if existe:
                    if modo in ['actualizar', 'ambos']:
                        # Actualizar existente
                        filtro = {'ubigeo': ubigeo} if ubigeo else {'nombre': nombre, 'departamento': 'PUNO'}
                        localidad['fechaActualizacion'] = datetime.utcnow()
                        await self.collection.update_one(filtro, {'$set': localidad})
                        actualizados += 1
                        logger.debug(f"✏️  Actualizado: {nombre}")
                    else:
                        omitidos += 1
                        logger.debug(f"⏭️  Omitido (ya existe): {nombre}")
                else:
                    if modo in ['crear', 'ambos']:
                        # Crear nuevo
                        await self.collection.insert_one(localidad)
                        importados += 1
                        logger.debug(f"✅ Importado: {nombre}")
                    else:
                        omitidos += 1
                
                procesados += 1
                
                # Mostrar progreso cada 100 registros
                if procesados % 100 == 0:
                    logger.info(f"📈 Progreso: {procesados}/{len(features)} procesados...")
                    
            except Exception as e:
                error_msg = f"Error procesando feature {procesados + 1}: {str(e)}"
                errores.append(error_msg)
                logger.error(error_msg)
        
        # Resultado final
        resultado = {
            'total_features': len(features),
            'procesados': procesados,
            'importados': importados,
            'actualizados': actualizados,
            'omitidos': omitidos,
            'errores': len(errores),
            'detalles_errores': errores[:10]  # Solo primeros 10 errores
        }
        
        logger.info("=" * 60)
        logger.info("📊 RESUMEN DE IMPORTACIÓN")
        logger.info("=" * 60)
        logger.info(f"Total features en archivo: {resultado['total_features']}")
        logger.info(f"Procesados correctamente: {resultado['procesados']}")
        logger.info(f"Nuevos importados: {resultado['importados']}")
        logger.info(f"Actualizados: {resultado['actualizados']}")
        logger.info(f"Omitidos: {resultado['omitidos']}")
        logger.info(f"Errores: {resultado['errores']}")
        logger.info("=" * 60)
        
        return resultado
    
    async def obtener_estadisticas(self) -> Dict[str, Any]:
        """Obtener estadísticas de centros poblados importados"""
        try:
            # Total de centros poblados
            total = await self.collection.count_documents({
                'tipo': TipoLocalidad.CENTRO_POBLADO,
                'departamento': 'PUNO'
            })
            
            # Por provincia
            pipeline_provincia = [
                {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
                {'$group': {'_id': '$provincia', 'cantidad': {'$sum': 1}}},
                {'$sort': {'cantidad': -1}}
            ]
            por_provincia = await self.collection.aggregate(pipeline_provincia).to_list(None)
            
            # Por distrito
            pipeline_distrito = [
                {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
                {'$group': {'_id': '$distrito', 'cantidad': {'$sum': 1}}},
                {'$sort': {'cantidad': -1}},
                {'$limit': 10}
            ]
            por_distrito = await self.collection.aggregate(pipeline_distrito).to_list(None)
            
            # Con/sin coordenadas
            con_coordenadas = await self.collection.count_documents({
                'tipo': TipoLocalidad.CENTRO_POBLADO,
                'departamento': 'PUNO',
                'coordenadas': {'$ne': None}
            })
            
            # Por tipo de área (Rural/Urbano)
            pipeline_area = [
                {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
                {'$group': {'_id': '$metadata.tipo_area', 'cantidad': {'$sum': 1}}}
            ]
            por_area = await self.collection.aggregate(pipeline_area).to_list(None)
            
            return {
                'total_centros_poblados': total,
                'con_coordenadas': con_coordenadas,
                'sin_coordenadas': total - con_coordenadas,
                'por_provincia': por_provincia,
                'top_10_distritos': por_distrito,
                'por_tipo_area': por_area
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {str(e)}")
            return {}

async def main():
    """Función principal"""
    print("=" * 60)
    print("🏘️  IMPORTADOR DE CENTROS POBLADOS DE PUNO (GeoJSON)")
    print("=" * 60)
    print()
    
    # Ruta al archivo GeoJSON
    ruta_geojson = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'frontend', 'src', 'assets', 'geojson', 'puno-centrospoblados.geojson'
    )
    
    if not os.path.exists(ruta_geojson):
        print(f"❌ Error: No se encontró el archivo GeoJSON en: {ruta_geojson}")
        return
    
    print(f"📁 Archivo GeoJSON: {ruta_geojson}")
    print()
    
    importador = ImportadorCentrosPobladosGeoJSON()
    
    try:
        # Conectar a MongoDB
        await importador.conectar()
        
        # Menú de opciones
        print("Selecciona el modo de importación:")
        print("1. Crear solo nuevos (no actualiza existentes)")
        print("2. Actualizar solo existentes (no crea nuevos)")
        print("3. Crear y actualizar (ambos)")
        print("4. Ver estadísticas actuales")
        print("0. Salir")
        print()
        
        opcion = input("Ingresa tu opción: ").strip()
        
        if opcion == "1":
            resultado = await importador.importar_desde_geojson(ruta_geojson, modo='crear')
            
        elif opcion == "2":
            resultado = await importador.importar_desde_geojson(ruta_geojson, modo='actualizar')
            
        elif opcion == "3":
            resultado = await importador.importar_desde_geojson(ruta_geojson, modo='ambos')
            
        elif opcion == "4":
            print("\n📊 Obteniendo estadísticas...")
            stats = await importador.obtener_estadisticas()
            
            print("\n" + "=" * 60)
            print("📊 ESTADÍSTICAS ACTUALES")
            print("=" * 60)
            print(f"Total centros poblados: {stats.get('total_centros_poblados', 0)}")
            print(f"Con coordenadas: {stats.get('con_coordenadas', 0)}")
            print(f"Sin coordenadas: {stats.get('sin_coordenadas', 0)}")
            
            print("\n📍 Por provincia:")
            for item in stats.get('por_provincia', [])[:10]:
                print(f"  - {item['_id']}: {item['cantidad']}")
            
            print("\n🏘️  Top 10 distritos:")
            for item in stats.get('top_10_distritos', []):
                print(f"  - {item['_id']}: {item['cantidad']}")
            
            print("\n🌆 Por tipo de área:")
            for item in stats.get('por_tipo_area', []):
                tipo = item['_id'] or 'No especificado'
                print(f"  - {tipo}: {item['cantidad']}")
            print("=" * 60)
            
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
