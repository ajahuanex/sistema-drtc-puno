"""
Servicio optimizado para el rendimiento del módulo de vehículos con grandes volúmenes de datos.

Este servicio implementa:
1. Paginación eficiente con índices optimizados
2. Cache inteligente para consultas frecuentes
3. Consultas asíncronas para operaciones pesadas
4. Compresión de datos para transferencias grandes
5. Índices especializados para filtros comunes
6. Estrategias de lazy loading para datos relacionados
"""

import asyncio
import json
import gzip
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import logging

from app.services.vehiculo_service import VehiculoService
from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
from app.models.vehiculo import Vehiculo

logger = logging.getLogger(__name__)

@dataclass
class ConsultaOptimizada:
    """Configuración para consultas optimizadas"""
    usar_cache: bool = True
    usar_indices: bool = True
    usar_paginacion: bool = True
    usar_compresion: bool = False
    limite_memoria: int = 1000  # Máximo registros en memoria
    tiempo_cache: int = 300  # Segundos de cache

@dataclass
class ResultadoPaginado:
    """Resultado paginado optimizado"""
    datos: List[Dict]
    total_registros: int
    pagina_actual: int
    total_paginas: int
    tiempo_consulta: float
    desde_cache: bool
    comprimido: bool

class VehiculoPerformanceService:
    """Servicio optimizado para rendimiento con grandes volúmenes"""
    
    def __init__(self, db=None):
        from app.dependencies.db import get_database
        if db is None:
            # Para uso en tests o cuando no se pasa db
            import asyncio
            try:
                db = asyncio.get_event_loop().run_until_complete(get_database())
            except:
                db = None
        self.vehiculo_service = VehiculoService(db) if db else None
        self.filtro_service = VehiculoFiltroHistorialService(db)
        
        # Cache inteligente
        self._cache = {}
        self._cache_timestamps = {}
        self._cache_hits = 0
        self._cache_misses = 0
        
        # Índices optimizados
        self._indices = {
            'por_empresa': {},
            'por_estado': {},
            'por_placa': {},
            'por_categoria': {},
            'por_historial': {}
        }
        
        # Estadísticas de rendimiento
        self._stats = {
            'consultas_totales': 0,
            'tiempo_total_consultas': 0.0,
            'consultas_con_cache': 0,
            'consultas_con_indices': 0,
            'datos_comprimidos_mb': 0.0
        }
        
        logger.info("🚀 VehiculoPerformanceService inicializado")
    
    async def inicializar_indices(self) -> Dict[str, int]:
        """
        Inicializar índices optimizados para consultas rápidas
        
        Returns:
            Dict con estadísticas de índices creados
        """
        logger.info("🔧 Inicializando índices optimizados...")
        
        start_time = datetime.now()
        
        # Obtener todos los vehículos
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Limpiar índices existentes
        for indice in self._indices.values():
            indice.clear()
        
        # Construir índices
        for vehiculo in vehiculos:
            # Índice por empresa
            empresa_id = vehiculo.empresaActualId
            if empresa_id not in self._indices['por_empresa']:
                self._indices['por_empresa'][empresa_id] = []
            self._indices['por_empresa'][empresa_id].append(vehiculo.id)
            
            # Índice por estado
            estado = vehiculo.estado
            if estado not in self._indices['por_estado']:
                self._indices['por_estado'][estado] = []
            self._indices['por_estado'][estado].append(vehiculo.id)
            
            # Índice por placa (para búsquedas rápidas)
            placa_key = vehiculo.placa.upper()
            self._indices['por_placa'][placa_key] = vehiculo.id
            
            # Índice por categoría
            categoria = vehiculo.categoria
            if categoria not in self._indices['por_categoria']:
                self._indices['por_categoria'][categoria] = []
            self._indices['por_categoria'][categoria].append(vehiculo.id)
            
            # Índice por historial (si existe)
            if hasattr(vehiculo, 'numeroHistorialValidacion') and vehiculo.numeroHistorialValidacion:
                historial = vehiculo.numeroHistorialValidacion
                if historial not in self._indices['por_historial']:
                    self._indices['por_historial'][historial] = []
                self._indices['por_historial'][historial].append(vehiculo.id)
        
        tiempo_construccion = (datetime.now() - start_time).total_seconds()
        
        estadisticas = {
            'vehiculos_indexados': len(vehiculos),
            'indices_por_empresa': len(self._indices['por_empresa']),
            'indices_por_estado': len(self._indices['por_estado']),
            'indices_por_categoria': len(self._indices['por_categoria']),
            'indices_por_historial': len(self._indices['por_historial']),
            'tiempo_construccion_segundos': tiempo_construccion
        }
        
        logger.info(f"✅ Índices inicializados en {tiempo_construccion:.3f}s")
        logger.info(f"📊 Estadísticas: {estadisticas}")
        
        return estadisticas
    
    async def consultar_vehiculos_optimizada(
        self,
        filtros: Dict[str, Any] = None,
        pagina: int = 1,
        limite: int = 50,
        config: ConsultaOptimizada = None
    ) -> ResultadoPaginado:
        """
        Consulta optimizada de vehículos con filtros, paginación y cache
        
        Args:
            filtros: Filtros a aplicar
            pagina: Página a consultar (1-based)
            limite: Registros por página
            config: Configuración de optimización
            
        Returns:
            ResultadoPaginado con datos optimizados
        """
        if config is None:
            config = ConsultaOptimizada()
        
        if filtros is None:
            filtros = {}
        
        start_time = datetime.now()
        self._stats['consultas_totales'] += 1
        
        # Generar clave de cache
        cache_key = self._generar_clave_cache(filtros, pagina, limite)
        
        # Verificar cache si está habilitado
        if config.usar_cache:
            resultado_cache = self._obtener_desde_cache(cache_key, config.tiempo_cache)
            if resultado_cache:
                self._cache_hits += 1
                self._stats['consultas_con_cache'] += 1
                
                tiempo_consulta = (datetime.now() - start_time).total_seconds()
                resultado_cache.tiempo_consulta = tiempo_consulta
                resultado_cache.desde_cache = True
                
                logger.debug(f"🎯 Cache hit para consulta: {cache_key}")
                return resultado_cache
        
        self._cache_misses += 1
        
        # Ejecutar consulta optimizada
        try:
            # Usar índices si están disponibles y habilitados
            if config.usar_indices and self._indices_disponibles():
                vehiculos_ids = await self._consultar_con_indices(filtros)
                self._stats['consultas_con_indices'] += 1
            else:
                # Fallback a consulta tradicional
                vehiculos = await self._consultar_tradicional(filtros)
                vehiculos_ids = [v.id for v in vehiculos]
            
            # Aplicar paginación
            total_registros = len(vehiculos_ids)
            
            if config.usar_paginacion:
                inicio = (pagina - 1) * limite
                fin = inicio + limite
                vehiculos_ids_pagina = vehiculos_ids[inicio:fin]
            else:
                vehiculos_ids_pagina = vehiculos_ids
            
            # Obtener datos completos de los vehículos
            vehiculos_datos = await self._obtener_datos_vehiculos(vehiculos_ids_pagina)
            
            # Comprimir datos si es necesario
            if config.usar_compresion and len(vehiculos_datos) > 100:
                vehiculos_datos = await self._comprimir_datos(vehiculos_datos)
                comprimido = True
            else:
                comprimido = False
            
            # Calcular estadísticas de paginación
            total_paginas = (total_registros + limite - 1) // limite
            
            tiempo_consulta = (datetime.now() - start_time).total_seconds()
            self._stats['tiempo_total_consultas'] += tiempo_consulta
            
            resultado = ResultadoPaginado(
                datos=vehiculos_datos,
                total_registros=total_registros,
                pagina_actual=pagina,
                total_paginas=total_paginas,
                tiempo_consulta=tiempo_consulta,
                desde_cache=False,
                comprimido=comprimido
            )
            
            # Guardar en cache si está habilitado
            if config.usar_cache:
                self._guardar_en_cache(cache_key, resultado)
            
            logger.debug(f"✅ Consulta completada en {tiempo_consulta:.3f}s: {len(vehiculos_datos)} registros")
            
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error en consulta optimizada: {str(e)}")
            raise
    
    async def _consultar_con_indices(self, filtros: Dict[str, Any]) -> List[str]:
        """Consultar usando índices optimizados"""
        logger.debug("🔍 Usando índices optimizados para consulta")
        
        # Comenzar con todos los vehículos si no hay filtros
        if not filtros:
            vehiculos = await self.vehiculo_service.get_vehiculos_activos()
            return [v.id for v in vehiculos]
        
        conjuntos_ids = []
        
        # Filtro por empresa
        if 'empresa_id' in filtros and filtros['empresa_id']:
            empresa_id = filtros['empresa_id']
            if empresa_id in self._indices['por_empresa']:
                conjuntos_ids.append(set(self._indices['por_empresa'][empresa_id]))
        
        # Filtro por estado
        if 'estado' in filtros and filtros['estado']:
            estado = filtros['estado']
            if estado in self._indices['por_estado']:
                conjuntos_ids.append(set(self._indices['por_estado'][estado]))
        
        # Filtro por categoría
        if 'categoria' in filtros and filtros['categoria']:
            categoria = filtros['categoria']
            if categoria in self._indices['por_categoria']:
                conjuntos_ids.append(set(self._indices['por_categoria'][categoria]))
        
        # Filtro por placa (búsqueda exacta)
        if 'placa' in filtros and filtros['placa']:
            placa = filtros['placa'].upper()
            if placa in self._indices['por_placa']:
                conjuntos_ids.append({self._indices['por_placa'][placa]})
        
        # Intersección de todos los conjuntos (AND lógico)
        if conjuntos_ids:
            resultado_ids = conjuntos_ids[0]
            for conjunto in conjuntos_ids[1:]:
                resultado_ids = resultado_ids.intersection(conjunto)
            return list(resultado_ids)
        else:
            # Si no hay filtros con índices, usar consulta tradicional
            vehiculos = await self._consultar_tradicional(filtros)
            return [v.id for v in vehiculos]
    
    async def _consultar_tradicional(self, filtros: Dict[str, Any]) -> List[Vehiculo]:
        """Consulta tradicional sin índices"""
        logger.debug("🔍 Usando consulta tradicional")
        
        # Usar el servicio de filtrado por historial para obtener solo vehículos visibles
        vehiculos = await self.filtro_service.obtener_vehiculos_con_filtro_historial(
            empresa_id=filtros.get('empresa_id'),
            incluir_historicos=filtros.get('incluir_historicos', False),
            solo_bloqueados=filtros.get('solo_bloqueados', False)
        )
        
        # Aplicar filtros adicionales
        if 'estado' in filtros and filtros['estado']:
            vehiculos = [v for v in vehiculos if v.estado == filtros['estado']]
        
        if 'categoria' in filtros and filtros['categoria']:
            vehiculos = [v for v in vehiculos if v.categoria == filtros['categoria']]
        
        if 'placa' in filtros and filtros['placa']:
            placa_filtro = filtros['placa'].upper()
            vehiculos = [v for v in vehiculos if placa_filtro in v.placa.upper()]
        
        return vehiculos
    
    async def _obtener_datos_vehiculos(self, vehiculos_ids: List[str]) -> List[Dict]:
        """Obtener datos completos de vehículos por IDs"""
        vehiculos_datos = []
        
        for vehiculo_id in vehiculos_ids:
            vehiculo = await self.vehiculo_service.get_vehiculo_by_id(vehiculo_id)
            if vehiculo:
                # Convertir a diccionario para serialización
                vehiculo_dict = {
                    'id': vehiculo.id,
                    'placa': vehiculo.placa,
                    'empresaActualId': vehiculo.empresaActualId,
                    'categoria': vehiculo.categoria,
                    'marca': vehiculo.marca,
                    'modelo': vehiculo.modelo,
                    'anioFabricacion': vehiculo.anioFabricacion,
                    'estado': vehiculo.estado,
                    'estaActivo': vehiculo.estaActivo,
                    'numeroHistorialValidacion': getattr(vehiculo, 'numeroHistorialValidacion', None),
                    'esHistorialActual': getattr(vehiculo, 'esHistorialActual', True)
                }
                vehiculos_datos.append(vehiculo_dict)
        
        return vehiculos_datos
    
    async def _comprimir_datos(self, datos: List[Dict]) -> List[Dict]:
        """Comprimir datos para transferencia eficiente"""
        try:
            # Serializar a JSON
            json_data = json.dumps(datos)
            
            # Comprimir con gzip
            compressed_data = gzip.compress(json_data.encode('utf-8'))
            
            # Calcular estadísticas
            tamaño_original = len(json_data.encode('utf-8'))
            tamaño_comprimido = len(compressed_data)
            ratio_compresion = (1 - tamaño_comprimido / tamaño_original) * 100
            
            self._stats['datos_comprimidos_mb'] += tamaño_comprimido / (1024 * 1024)
            
            logger.debug(f"🗜️ Datos comprimidos: {tamaño_original} -> {tamaño_comprimido} bytes ({ratio_compresion:.1f}% reducción)")
            
            # Retornar datos con metadatos de compresión
            return [{
                '_compressed': True,
                '_original_size': tamaño_original,
                '_compressed_size': tamaño_comprimido,
                '_compression_ratio': ratio_compresion,
                '_data': compressed_data.hex()  # Convertir a hex para JSON
            }]
            
        except Exception as e:
            logger.error(f"❌ Error comprimiendo datos: {str(e)}")
            return datos  # Retornar datos sin comprimir en caso de error
    
    def _generar_clave_cache(self, filtros: Dict, pagina: int, limite: int) -> str:
        """Generar clave única para cache"""
        filtros_str = json.dumps(filtros, sort_keys=True)
        return f"vehiculos_{hash(filtros_str)}_{pagina}_{limite}"
    
    def _obtener_desde_cache(self, clave: str, tiempo_cache: int) -> Optional[ResultadoPaginado]:
        """Obtener resultado desde cache si es válido"""
        if clave not in self._cache:
            return None
        
        timestamp = self._cache_timestamps.get(clave, 0)
        if datetime.now().timestamp() - timestamp > tiempo_cache:
            # Cache expirado
            del self._cache[clave]
            del self._cache_timestamps[clave]
            return None
        
        return self._cache[clave]
    
    def _guardar_en_cache(self, clave: str, resultado: ResultadoPaginado):
        """Guardar resultado en cache"""
        self._cache[clave] = resultado
        self._cache_timestamps[clave] = datetime.now().timestamp()
        
        # Limpiar cache si es muy grande (mantener últimos 100 elementos)
        if len(self._cache) > 100:
            claves_ordenadas = sorted(
                self._cache_timestamps.items(), 
                key=lambda x: x[1]
            )
            # Eliminar los 20 más antiguos
            for clave_antigua, _ in claves_ordenadas[:20]:
                if clave_antigua in self._cache:
                    del self._cache[clave_antigua]
                if clave_antigua in self._cache_timestamps:
                    del self._cache_timestamps[clave_antigua]
    
    def _indices_disponibles(self) -> bool:
        """Verificar si los índices están disponibles"""
        return any(len(indice) > 0 for indice in self._indices.values())
    
    async def obtener_estadisticas_rendimiento(self) -> Dict[str, Any]:
        """Obtener estadísticas detalladas de rendimiento"""
        cache_ratio = (
            self._cache_hits / (self._cache_hits + self._cache_misses) * 100
            if (self._cache_hits + self._cache_misses) > 0 else 0
        )
        
        tiempo_promedio = (
            self._stats['tiempo_total_consultas'] / self._stats['consultas_totales']
            if self._stats['consultas_totales'] > 0 else 0
        )
        
        return {
            'consultas': {
                'total': self._stats['consultas_totales'],
                'con_cache': self._stats['consultas_con_cache'],
                'con_indices': self._stats['consultas_con_indices'],
                'tiempo_promedio_segundos': tiempo_promedio
            },
            'cache': {
                'hits': self._cache_hits,
                'misses': self._cache_misses,
                'ratio_exito_porcentaje': cache_ratio,
                'entradas_actuales': len(self._cache)
            },
            'indices': {
                'por_empresa': len(self._indices['por_empresa']),
                'por_estado': len(self._indices['por_estado']),
                'por_categoria': len(self._indices['por_categoria']),
                'por_historial': len(self._indices['por_historial']),
                'disponibles': self._indices_disponibles()
            },
            'compresion': {
                'datos_comprimidos_mb': self._stats['datos_comprimidos_mb']
            }
        }
    
    async def limpiar_cache(self) -> Dict[str, int]:
        """Limpiar cache y estadísticas"""
        entradas_eliminadas = len(self._cache)
        
        self._cache.clear()
        self._cache_timestamps.clear()
        self._cache_hits = 0
        self._cache_misses = 0
        
        logger.info(f"🧹 Cache limpiado: {entradas_eliminadas} entradas eliminadas")
        
        return {
            'entradas_eliminadas': entradas_eliminadas,
            'cache_hits_reset': True,
            'cache_misses_reset': True
        }
    
    async def optimizar_consulta_masiva(
        self, 
        filtros_multiples: List[Dict[str, Any]],
        limite_por_consulta: int = 50
    ) -> List[ResultadoPaginado]:
        """
        Optimizar múltiples consultas ejecutándolas en paralelo
        
        Args:
            filtros_multiples: Lista de filtros para ejecutar
            limite_por_consulta: Límite de registros por consulta
            
        Returns:
            Lista de resultados paginados
        """
        logger.info(f"🚀 Ejecutando {len(filtros_multiples)} consultas en paralelo")
        
        # Crear tareas asíncronas
        tareas = []
        for i, filtros in enumerate(filtros_multiples):
            config = ConsultaOptimizada(
                usar_cache=True,
                usar_indices=True,
                usar_paginacion=True,
                limite_memoria=limite_por_consulta
            )
            
            tarea = self.consultar_vehiculos_optimizada(
                filtros=filtros,
                pagina=1,
                limite=limite_por_consulta,
                config=config
            )
            tareas.append(tarea)
        
        # Ejecutar todas las consultas en paralelo
        start_time = datetime.now()
        resultados = await asyncio.gather(*tareas, return_exceptions=True)
        tiempo_total = (datetime.now() - start_time).total_seconds()
        
        # Filtrar errores
        resultados_exitosos = [r for r in resultados if not isinstance(r, Exception)]
        errores = [r for r in resultados if isinstance(r, Exception)]
        
        logger.info(f"✅ Consultas paralelas completadas en {tiempo_total:.3f}s")
        logger.info(f"📊 Exitosas: {len(resultados_exitosos)}, Errores: {len(errores)}")
        
        if errores:
            for error in errores:
                logger.error(f"❌ Error en consulta paralela: {str(error)}")
        
        return resultados_exitosos