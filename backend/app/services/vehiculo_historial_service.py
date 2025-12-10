"""
Servicio para gestionar el historial de validaciones de vehículos.

Este servicio se encarga de:
1. Calcular números secuenciales de historial basados en resoluciones
2. Actualizar el historial cuando se agregan nuevas resoluciones
3. Generar estadísticas del historial de validaciones
4. Mantener la consistencia del historial entre vehículos
"""

from datetime import datetime
from typing import List, Dict, Optional, Tuple
from app.services.vehiculo_service import VehiculoService
from app.services.resolucion_service import ResolucionService
from app.models.vehiculo import Vehiculo, VehiculoUpdate
from app.models.resolucion import Resolucion
import logging

logger = logging.getLogger(__name__)

class VehiculoHistorialService:
    """Servicio para gestionar el historial de validaciones de vehículos"""
    
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
        self.resolucion_service = ResolucionService(db) if db else None
    
    async def calcular_historial_validaciones_todos(self) -> Dict[str, int]:
        """
        Calcula el número de historial de validaciones para todos los vehículos.
        
        Lógica:
        1. Obtiene todos los vehículos activos
        2. Para cada vehículo, busca todas sus resoluciones
        3. Ordena las resoluciones por fecha de emisión (más antigua primero)
        4. Asigna números secuenciales: 1, 2, 3, etc.
        
        Returns:
            Dict[str, int]: Mapeo de vehiculo_id -> numero_historial
        """
        logger.info("🔄 Iniciando cálculo de historial de validaciones para todos los vehículos")
        
        # Obtener todos los vehículos activos
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        logger.info(f"📊 Total de vehículos activos: {len(vehiculos)}")
        
        # Obtener todas las resoluciones
        resoluciones = await self.resolucion_service.get_resoluciones_activas()
        logger.info(f"📊 Total de resoluciones activas: {len(resoluciones)}")
        
        # Crear mapeo de resolución_id -> resolución para acceso rápido
        resoluciones_map = {r.id: r for r in resoluciones}
        
        historial_map = {}
        
        for vehiculo in vehiculos:
            numero_historial = await self._calcular_numero_historial_vehiculo(
                vehiculo, resoluciones_map
            )
            historial_map[vehiculo.id] = numero_historial
            
            logger.debug(f"🚗 Vehículo {vehiculo.placa}: Historial #{numero_historial}")
        
        logger.info(f"✅ Cálculo completado. {len(historial_map)} vehículos procesados")
        return historial_map
    
    async def _calcular_numero_historial_vehiculo(
        self, 
        vehiculo: Vehiculo, 
        resoluciones_map: Dict[str, Resolucion]
    ) -> int:
        """
        Calcula el número de historial para un vehículo específico.
        
        Args:
            vehiculo: El vehículo a procesar
            resoluciones_map: Mapeo de resolución_id -> resolución
            
        Returns:
            int: Número de historial (1, 2, 3, etc.)
        """
        # Buscar todas las resoluciones que incluyen este vehículo
        resoluciones_vehiculo = []
        
        for resolucion in resoluciones_map.values():
            if (resolucion.vehiculosHabilitadosIds and 
                vehiculo.id in resolucion.vehiculosHabilitadosIds):
                resoluciones_vehiculo.append(resolucion)
        
        # Si no hay resoluciones, asignar número 1 por defecto
        if not resoluciones_vehiculo:
            logger.warning(f"⚠️ Vehículo {vehiculo.placa} sin resoluciones asociadas")
            return 1
        
        # Ordenar resoluciones por fecha de emisión (más antigua primero)
        resoluciones_vehiculo.sort(key=lambda r: r.fechaEmision)
        
        # El número de historial es la posición en la lista ordenada + 1
        # La resolución más antigua será #1, la siguiente #2, etc.
        numero_historial = len(resoluciones_vehiculo)
        
        logger.debug(f"🔍 Vehículo {vehiculo.placa}: {len(resoluciones_vehiculo)} resoluciones encontradas")
        logger.debug(f"📅 Resolución más antigua: {resoluciones_vehiculo[0].nroResolucion} ({resoluciones_vehiculo[0].fechaEmision})")
        if len(resoluciones_vehiculo) > 1:
            logger.debug(f"📅 Resolución más reciente: {resoluciones_vehiculo[-1].nroResolucion} ({resoluciones_vehiculo[-1].fechaEmision})")
        
        return numero_historial
    
    async def actualizar_historial_todos_vehiculos(self) -> Dict[str, any]:
        """
        Actualiza el campo numeroHistorialValidacion para todos los vehículos.
        
        Returns:
            Dict con estadísticas de la actualización
        """
        logger.info("🔄 Iniciando actualización masiva de historial de validaciones")
        
        # Calcular historial para todos los vehículos
        historial_map = await self.calcular_historial_validaciones_todos()
        
        actualizados = 0
        errores = 0
        
        for vehiculo_id, numero_historial in historial_map.items():
            try:
                # Actualizar el vehículo con el nuevo número de historial
                update_data = VehiculoUpdate(
                    numeroHistorialValidacion=numero_historial,
                    fechaActualizacion=datetime.utcnow()
                )
                
                await self.vehiculo_service.update_vehiculo(vehiculo_id, update_data)
                actualizados += 1
                
            except Exception as e:
                logger.error(f"❌ Error actualizando vehículo {vehiculo_id}: {str(e)}")
                errores += 1
        
        resultado = {
            "total_procesados": len(historial_map),
            "actualizados": actualizados,
            "errores": errores,
            "historial_map": historial_map
        }
        
        logger.info(f"✅ Actualización completada: {actualizados} actualizados, {errores} errores")
        return resultado
    
    async def obtener_estadisticas_historial(self) -> Dict[str, any]:
        """
        Genera estadísticas del historial de validaciones.
        
        Returns:
            Dict con estadísticas detalladas
        """
        logger.info("📊 Generando estadísticas de historial de validaciones")
        
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Estadísticas básicas
        total_vehiculos = len(vehiculos)
        vehiculos_con_historial = len([v for v in vehiculos if v.numeroHistorialValidacion is not None])
        vehiculos_sin_historial = total_vehiculos - vehiculos_con_historial
        
        # Distribución por número de historial
        distribucion_historial = {}
        numeros_historial = [v.numeroHistorialValidacion for v in vehiculos if v.numeroHistorialValidacion is not None]
        
        for numero in numeros_historial:
            distribucion_historial[numero] = distribucion_historial.get(numero, 0) + 1
        
        # Vehículos con más resoluciones (historial más alto)
        vehiculos_ordenados = sorted(
            [v for v in vehiculos if v.numeroHistorialValidacion is not None],
            key=lambda x: x.numeroHistorialValidacion,
            reverse=True
        )
        
        top_vehiculos = vehiculos_ordenados[:10]  # Top 10
        
        estadisticas = {
            "resumen": {
                "total_vehiculos": total_vehiculos,
                "vehiculos_con_historial": vehiculos_con_historial,
                "vehiculos_sin_historial": vehiculos_sin_historial,
                "porcentaje_con_historial": round((vehiculos_con_historial / total_vehiculos * 100), 2) if total_vehiculos > 0 else 0
            },
            "distribucion_historial": distribucion_historial,
            "top_vehiculos_mas_resoluciones": [
                {
                    "placa": v.placa,
                    "empresa_id": v.empresaActualId,
                    "numero_historial": v.numeroHistorialValidacion,
                    "categoria": v.categoria,
                    "marca": v.marca,
                    "modelo": v.modelo
                }
                for v in top_vehiculos
            ],
            "promedio_resoluciones": round(sum(numeros_historial) / len(numeros_historial), 2) if numeros_historial else 0,
            "maximo_resoluciones": max(numeros_historial) if numeros_historial else 0,
            "minimo_resoluciones": min(numeros_historial) if numeros_historial else 0
        }
        
        logger.info("✅ Estadísticas generadas exitosamente")
        return estadisticas
    
    async def recalcular_historial_por_empresa(self, empresa_id: str) -> Dict[str, any]:
        """
        Recalcula el historial de validaciones para todos los vehículos de una empresa específica.
        
        Args:
            empresa_id: ID de la empresa
            
        Returns:
            Dict con resultados de la actualización
        """
        logger.info(f"🔄 Recalculando historial para empresa {empresa_id}")
        
        # Obtener vehículos de la empresa
        vehiculos_empresa = await self.vehiculo_service.get_vehiculos_por_empresa(empresa_id)
        logger.info(f"📊 Vehículos de la empresa: {len(vehiculos_empresa)}")
        
        # Obtener todas las resoluciones
        resoluciones = await self.resolucion_service.get_resoluciones_activas()
        resoluciones_map = {r.id: r for r in resoluciones}
        
        actualizados = 0
        errores = 0
        historial_empresa = {}
        
        for vehiculo in vehiculos_empresa:
            try:
                numero_historial = await self._calcular_numero_historial_vehiculo(
                    vehiculo, resoluciones_map
                )
                
                # Actualizar el vehículo
                update_data = VehiculoUpdate(
                    numeroHistorialValidacion=numero_historial,
                    fechaActualizacion=datetime.utcnow()
                )
                
                await self.vehiculo_service.update_vehiculo(vehiculo.id, update_data)
                
                historial_empresa[vehiculo.id] = numero_historial
                actualizados += 1
                
                logger.debug(f"✅ Vehículo {vehiculo.placa}: Historial #{numero_historial}")
                
            except Exception as e:
                logger.error(f"❌ Error procesando vehículo {vehiculo.placa}: {str(e)}")
                errores += 1
        
        resultado = {
            "empresa_id": empresa_id,
            "total_vehiculos": len(vehiculos_empresa),
            "actualizados": actualizados,
            "errores": errores,
            "historial_empresa": historial_empresa
        }
        
        logger.info(f"✅ Recálculo completado para empresa {empresa_id}: {actualizados} actualizados, {errores} errores")
        return resultado
    
    async def obtener_historial_vehiculo_detallado(self, vehiculo_id: str) -> Dict[str, any]:
        """
        Obtiene el historial detallado de un vehículo específico.
        
        Args:
            vehiculo_id: ID del vehículo
            
        Returns:
            Dict con historial detallado del vehículo
        """
        logger.info(f"🔍 Obteniendo historial detallado para vehículo {vehiculo_id}")
        
        # Obtener el vehículo
        vehiculo = await self.vehiculo_service.get_vehiculo_by_id(vehiculo_id)
        if not vehiculo:
            raise ValueError(f"Vehículo {vehiculo_id} no encontrado")
        
        # Obtener todas las resoluciones que incluyen este vehículo
        resoluciones = await self.resolucion_service.get_resoluciones_activas()
        resoluciones_vehiculo = [
            r for r in resoluciones 
            if r.vehiculosHabilitadosIds and vehiculo_id in r.vehiculosHabilitadosIds
        ]
        
        # Ordenar por fecha de emisión
        resoluciones_vehiculo.sort(key=lambda r: r.fechaEmision)
        
        # Crear historial detallado
        historial_detallado = []
        for i, resolucion in enumerate(resoluciones_vehiculo, 1):
            historial_detallado.append({
                "numero_secuencial": i,
                "resolucion_id": resolucion.id,
                "numero_resolucion": resolucion.nroResolucion,
                "fecha_emision": resolucion.fechaEmision,
                "tipo_resolucion": resolucion.tipoResolucion,
                "tipo_tramite": resolucion.tipoTramite,
                "descripcion": resolucion.descripcion,
                "estado": resolucion.estado,
                "empresa_id": resolucion.empresaId
            })
        
        resultado = {
            "vehiculo": {
                "id": vehiculo.id,
                "placa": vehiculo.placa,
                "empresa_actual_id": vehiculo.empresaActualId,
                "categoria": vehiculo.categoria,
                "marca": vehiculo.marca,
                "modelo": vehiculo.modelo,
                "numero_historial_actual": vehiculo.numeroHistorialValidacion
            },
            "total_resoluciones": len(resoluciones_vehiculo),
            "historial_resoluciones": historial_detallado,
            "resolucion_mas_antigua": {
                "numero": resoluciones_vehiculo[0].nroResolucion,
                "fecha": resoluciones_vehiculo[0].fechaEmision
            } if resoluciones_vehiculo else None,
            "resolucion_mas_reciente": {
                "numero": resoluciones_vehiculo[-1].nroResolucion,
                "fecha": resoluciones_vehiculo[-1].fechaEmision
            } if resoluciones_vehiculo else None
        }
        
        logger.info(f"✅ Historial detallado generado para vehículo {vehiculo.placa}")
        return resultado