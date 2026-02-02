#!/usr/bin/env python3
"""
Script para importar centros poblados de Puno desde fuentes oficiales
"""

import asyncio
import aiohttp
import json
import csv
import sys
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

# Agregar el directorio padre al path para importar módulos del proyecto
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_database
from app.models.localidad import Localidad, TipoLocalidad, NivelTerritorial
from app.services.localidad_service import LocalidadService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImportadorCentrosPoblados:
    """Importador de centros poblados desde fuentes oficiales"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.db = None
        self.localidad_service = None
        
        # URLs de fuentes oficiales
        self.urls = {
            'INEI': 'https://api.inei.gob.pe/centros-poblados/puno',
            'RENIEC': 'https://api.reniec.gob.pe/ubigeos/centros-poblados/21',  # 21 = Puno
            'MUNICIPALIDAD': 'https://datos.munipuno.gob.pe/api/centros-poblados'
        }
        
        # Mapeo de distritos de Puno con sus códigos UBIGEO
        self.distritos_puno = {
            '210101': 'PUNO',
            '210102': 'ACORA',
            '210103': 'AMANTANI',
            '210104': 'ATUNCOLLA',
            '210105': 'CAPACHICA',
            '210106': 'CHUCUITO',
            '210107': 'COATA',
            '210108': 'HUATA',
            '210109': 'MAÑAZO',
            '210110': 'PAUCARCOLLA',
            '210111': 'PICHACANI',
            '210112': 'PLATERIA',
            '210113': 'SAN ANTONIO',
            '210114': 'TIQUILLACA',
            '210115': 'VILQUE',
            # Agregar más distritos según sea necesario
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        self.db = await get_database()
        self.localidad_service = LocalidadService(self.db)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def importar_desde_inei(self) -> Dict[str, Any]:
        """Importar centros poblados desde INEI"""
        logger.info("🏛️ Iniciando importación desde INEI...")
        
        try:
            # Simular datos del INEI (en producción sería una llamada real a la API)
            centros_poblados_inei = await self._obtener_datos_inei_simulados()
            
            procesados = 0
            importados = 0
            actualizados = 0
            errores = []
            
            for centro in centros_poblados_inei:
                try:
                    # Verificar si ya existe
                    existente = await self.localidad_service.obtener_por_ubigeo(centro['ubigeo'])
                    
                    localidad_data = {
                        'ubigeo': centro['ubigeo'],
                        'nombre': centro['nombre'],
                        'tipo': TipoLocalidad.CENTRO_POBLADO,
                        'nivel_territorial': NivelTerritorial.CENTRO_POBLADO,
                        'departamento': 'PUNO',
                        'provincia': centro.get('provincia', ''),
                        'distrito': centro.get('distrito', ''),
                        'coordenadas': {
                            'latitud': centro.get('latitud', 0.0),
                            'longitud': centro.get('longitud', 0.0)
                        } if centro.get('latitud') and centro.get('longitud') else None,
                        'poblacion': centro.get('poblacion', 0),
                        'esta_activa': True,
                        'fuente_datos': 'INEI',
                        'fecha_actualizacion': datetime.utcnow()
                    }
                    
                    if existente:
                        await self.localidad_service.actualizar(existente.id, localidad_data)
                        actualizados += 1
                    else:
                        await self.localidad_service.crear(localidad_data)
                        importados += 1
                    
                    procesados += 1
                    
                    if procesados % 100 == 0:
                        logger.info(f"Procesados {procesados} centros poblados...")
                        
                except Exception as e:
                    error_msg = f"Error procesando {centro.get('nombre', 'N/A')}: {str(e)}"
                    errores.append(error_msg)
                    logger.error(error_msg)
            
            resultado = {
                'procesados': procesados,
                'importados': importados,
                'actualizados': actualizados,
                'errores': errores
            }
            
            logger.info(f"✅ Importación INEI completada: {resultado}")
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error en importación INEI: {str(e)}")
            raise

    async def importar_desde_reniec(self) -> Dict[str, Any]:
        """Importar centros poblados desde RENIEC"""
        logger.info("🆔 Iniciando importación desde RENIEC...")
        
        try:
            # Simular datos de RENIEC
            centros_poblados_reniec = await self._obtener_datos_reniec_simulados()
            
            procesados = 0
            importados = 0
            actualizados = 0
            errores = []
            
            for centro in centros_poblados_reniec:
                try:
                    existente = await self.localidad_service.obtener_por_ubigeo(centro['ubigeo'])
                    
                    localidad_data = {
                        'ubigeo': centro['ubigeo'],
                        'nombre': centro['nombre'],
                        'tipo': TipoLocalidad.CENTRO_POBLADO,
                        'nivel_territorial': NivelTerritorial.CENTRO_POBLADO,
                        'departamento': 'PUNO',
                        'provincia': centro.get('provincia', ''),
                        'distrito': centro.get('distrito', ''),
                        'esta_activa': True,
                        'fuente_datos': 'RENIEC',
                        'fecha_actualizacion': datetime.utcnow()
                    }
                    
                    if existente:
                        await self.localidad_service.actualizar(existente.id, localidad_data)
                        actualizados += 1
                    else:
                        await self.localidad_service.crear(localidad_data)
                        importados += 1
                    
                    procesados += 1
                    
                except Exception as e:
                    error_msg = f"Error procesando {centro.get('nombre', 'N/A')}: {str(e)}"
                    errores.append(error_msg)
                    logger.error(error_msg)
            
            resultado = {
                'procesados': procesados,
                'importados': importados,
                'actualizados': actualizados,
                'errores': errores
            }
            
            logger.info(f"✅ Importación RENIEC completada: {resultado}")
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error en importación RENIEC: {str(e)}")
            raise

    async def importar_desde_municipalidad(self) -> Dict[str, Any]:
        """Importar centros poblados desde Municipalidad Provincial de Puno"""
        logger.info("🏛️ Iniciando importación desde Municipalidad...")
        
        try:
            # Simular datos municipales
            centros_poblados_muni = await self._obtener_datos_municipalidad_simulados()
            
            procesados = 0
            importados = 0
            actualizados = 0
            errores = []
            
            for centro in centros_poblados_muni:
                try:
                    existente = await self.localidad_service.obtener_por_ubigeo(centro['ubigeo'])
                    
                    localidad_data = {
                        'ubigeo': centro['ubigeo'],
                        'nombre': centro['nombre'],
                        'tipo': TipoLocalidad.CENTRO_POBLADO,
                        'nivel_territorial': NivelTerritorial.CENTRO_POBLADO,
                        'departamento': 'PUNO',
                        'provincia': centro.get('provincia', ''),
                        'distrito': centro.get('distrito', ''),
                        'coordenadas': {
                            'latitud': centro.get('latitud', 0.0),
                            'longitud': centro.get('longitud', 0.0)
                        } if centro.get('latitud') and centro.get('longitud') else None,
                        'poblacion': centro.get('poblacion', 0),
                        'altitud': centro.get('altitud', 0),
                        'esta_activa': True,
                        'fuente_datos': 'MUNICIPALIDAD',
                        'fecha_actualizacion': datetime.utcnow()
                    }
                    
                    if existente:
                        await self.localidad_service.actualizar(existente.id, localidad_data)
                        actualizados += 1
                    else:
                        await self.localidad_service.crear(localidad_data)
                        importados += 1
                    
                    procesados += 1
                    
                except Exception as e:
                    error_msg = f"Error procesando {centro.get('nombre', 'N/A')}: {str(e)}"
                    errores.append(error_msg)
                    logger.error(error_msg)
            
            resultado = {
                'procesados': procesados,
                'importados': importados,
                'actualizados': actualizados,
                'errores': errores
            }
            
            logger.info(f"✅ Importación Municipal completada: {resultado}")
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error en importación Municipal: {str(e)}")
            raise

    async def _obtener_datos_inei_simulados(self) -> List[Dict[str, Any]]:
        """Simular datos del INEI (en producción sería una llamada real a la API)"""
        return [
            {
                'ubigeo': '2101010001',
                'nombre': 'SALCEDO',
                'provincia': 'PUNO',
                'distrito': 'PUNO',
                'latitud': -15.8422,
                'longitud': -70.0199,
                'poblacion': 1500
            },
            {
                'ubigeo': '2101010002',
                'nombre': 'YANAMAYO',
                'provincia': 'PUNO',
                'distrito': 'PUNO',
                'latitud': -15.8322,
                'longitud': -70.0299,
                'poblacion': 800
            },
            {
                'ubigeo': '2101020001',
                'nombre': 'PUEBLO LIBRE',
                'provincia': 'PUNO',
                'distrito': 'ACORA',
                'latitud': -15.9422,
                'longitud': -69.9199,
                'poblacion': 1200
            },
            # Agregar más centros poblados simulados...
        ]

    async def _obtener_datos_reniec_simulados(self) -> List[Dict[str, Any]]:
        """Simular datos de RENIEC"""
        return [
            {
                'ubigeo': '2101010003',
                'nombre': 'ALTO PUNO',
                'provincia': 'PUNO',
                'distrito': 'PUNO'
            },
            {
                'ubigeo': '2101010004',
                'nombre': 'JAYLLIHUAYA',
                'provincia': 'PUNO',
                'distrito': 'PUNO'
            },
            # Agregar más...
        ]

    async def _obtener_datos_municipalidad_simulados(self) -> List[Dict[str, Any]]:
        """Simular datos municipales con coordenadas GPS"""
        return [
            {
                'ubigeo': '2101010005',
                'nombre': 'ICHU',
                'provincia': 'PUNO',
                'distrito': 'PUNO',
                'latitud': -15.8522,
                'longitud': -70.0099,
                'poblacion': 600,
                'altitud': 3850
            },
            {
                'ubigeo': '2101010006',
                'nombre': 'UROS CHULLUNI',
                'provincia': 'PUNO',
                'distrito': 'PUNO',
                'latitud': -15.7422,
                'longitud': -69.9599,
                'poblacion': 300,
                'altitud': 3812
            },
            # Agregar más...
        ]

    async def obtener_estadisticas(self) -> Dict[str, Any]:
        """Obtener estadísticas de centros poblados"""
        try:
            # Contar centros poblados por tipo
            total_centros = await self.localidad_service.contar_por_tipo(TipoLocalidad.CENTRO_POBLADO)
            
            # Estadísticas por distrito
            por_distrito = await self.localidad_service.obtener_estadisticas_por_distrito()
            
            # Contar con/sin coordenadas
            con_coordenadas = await self.localidad_service.contar_con_coordenadas()
            sin_coordenadas = total_centros - con_coordenadas
            
            return {
                'totalCentrosPoblados': total_centros,
                'porDistrito': por_distrito,
                'porTipo': [
                    {'tipo': 'CENTRO_POBLADO', 'cantidad': total_centros}
                ],
                'conCoordenadas': con_coordenadas,
                'sinCoordenadas': sin_coordenadas
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {str(e)}")
            return {
                'totalCentrosPoblados': 0,
                'porDistrito': [],
                'porTipo': [],
                'conCoordenadas': 0,
                'sinCoordenadas': 0
            }

async def main():
    """Función principal para ejecutar importaciones"""
    print("🏘️ IMPORTADOR DE CENTROS POBLADOS DE PUNO")
    print("=" * 50)
    
    async with ImportadorCentrosPoblados() as importador:
        try:
            # Mostrar menú
            print("\nSelecciona una opción:")
            print("1. Importar desde INEI")
            print("2. Importar desde RENIEC")
            print("3. Importar desde Municipalidad")
            print("4. Importar desde todas las fuentes")
            print("5. Ver estadísticas")
            print("0. Salir")
            
            opcion = input("\nIngresa tu opción: ").strip()
            
            if opcion == "1":
                resultado = await importador.importar_desde_inei()
                print(f"\n✅ Resultado INEI: {resultado}")
                
            elif opcion == "2":
                resultado = await importador.importar_desde_reniec()
                print(f"\n✅ Resultado RENIEC: {resultado}")
                
            elif opcion == "3":
                resultado = await importador.importar_desde_municipalidad()
                print(f"\n✅ Resultado Municipal: {resultado}")
                
            elif opcion == "4":
                print("\n🔄 Importando desde todas las fuentes...")
                
                resultado_inei = await importador.importar_desde_inei()
                resultado_reniec = await importador.importar_desde_reniec()
                resultado_muni = await importador.importar_desde_municipalidad()
                
                total_procesados = resultado_inei['procesados'] + resultado_reniec['procesados'] + resultado_muni['procesados']
                total_importados = resultado_inei['importados'] + resultado_reniec['importados'] + resultado_muni['importados']
                
                print(f"\n✅ RESUMEN TOTAL:")
                print(f"   Procesados: {total_procesados}")
                print(f"   Importados: {total_importados}")
                
            elif opcion == "5":
                estadisticas = await importador.obtener_estadisticas()
                print(f"\n📊 ESTADÍSTICAS ACTUALES:")
                print(f"   Total centros poblados: {estadisticas['totalCentrosPoblados']}")
                print(f"   Con coordenadas: {estadisticas['conCoordenadas']}")
                print(f"   Sin coordenadas: {estadisticas['sinCoordenadas']}")
                
            elif opcion == "0":
                print("\n👋 ¡Hasta luego!")
                
            else:
                print("\n❌ Opción no válida")
                
        except Exception as e:
            logger.error(f"❌ Error en ejecución: {str(e)}")
            print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())