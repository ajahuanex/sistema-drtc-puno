"""
Servicio para filtrar vehículos basado en el historial de validaciones.

Este servicio implementa la lógica donde:
1. Solo se muestran los vehículos con el historial más actual (número más alto)
2. Los vehículos con historial anterior se marcan como bloqueados
3. Se mantiene la trazabilidad completa pero se evita confusión en las tablas
4. Se pueden consultar historiales anteriores cuando sea necesario
"""

from datetime import datetime
from typing import List, Dict, Optional, Tuple
from app.services.vehiculo_service import VehiculoService
from app.services.vehiculo_historial_service import VehiculoHistorialService
from app.models.vehiculo import Vehiculo, VehiculoUpdate, EstadoVehiculo
import logging

logger = logging.getLogger(__name__)

class VehiculoFiltroHistorialService:
    """Servicio para filtrar vehículos basado en historial de validaciones"""
    
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
        self.historial_service = VehiculoHistorialService(db)
    
    async def marcar_vehiculos_historial_actual(self) -> Dict[str, any]:
        """
        Marca qué vehículos tienen el historial más actual y cuáles son históricos.
        
        Lógica:
        1. Agrupa vehículos por placa
        2. Para cada placa, identifica el vehículo con mayor número de historial
        3. Marca ese vehículo como actual (esHistorialActual = True)
        4. Marca los demás como históricos (esHistorialActual = False)
        5. Opcionalmente cambia el estado de los históricos a BLOQUEADO_HISTORIAL
        
        Returns:
            Dict con estadísticas del procesamiento
        """
        logger.info("🔄 Iniciando marcado de vehículos con historial actual")
        
        # Obtener todos los vehículos
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        logger.info(f"📊 Total de vehículos a procesar: {len(vehiculos)}")
        
        # Agrupar vehículos por placa
        vehiculos_por_placa = {}
        for vehiculo in vehiculos:
            placa = vehiculo.placa
            if placa not in vehiculos_por_placa:
                vehiculos_por_placa[placa] = []
            vehiculos_por_placa[placa].append(vehiculo)
        
        logger.info(f"📊 Placas únicas encontradas: {len(vehiculos_por_placa)}")
        
        actualizados = 0
        bloqueados = 0
        errores = 0
        vehiculos_actuales = []
        vehiculos_historicos = []
        
        for placa, vehiculos_placa in vehiculos_por_placa.items():
            try:
                # Si solo hay un vehículo con esta placa, es el actual
                if len(vehiculos_placa) == 1:
                    vehiculo = vehiculos_placa[0]
                    await self._marcar_como_actual(vehiculo)
                    vehiculos_actuales.append(vehiculo.id)
                    actualizados += 1
                    logger.debug(f"✅ Placa {placa}: Único vehículo marcado como actual")
                    continue
                
                # Si hay múltiples vehículos con la misma placa
                logger.debug(f"🔍 Placa {placa}: {len(vehiculos_placa)} vehículos encontrados")
                
                # Ordenar por número de historial (mayor primero)
                vehiculos_ordenados = sorted(
                    vehiculos_placa,
                    key=lambda v: v.numeroHistorialValidacion or 0,
                    reverse=True
                )
                
                # El primero (mayor historial) es el actual
                vehiculo_actual = vehiculos_ordenados[0]
                await self._marcar_como_actual(vehiculo_actual)
                vehiculos_actuales.append(vehiculo_actual.id)
                actualizados += 1
                
                logger.debug(f"✅ Placa {placa}: Vehículo {vehiculo_actual.id} marcado como actual (historial #{vehiculo_actual.numeroHistorialValidacion})")
                
                # Los demás son históricos
                for vehiculo_historico in vehiculos_ordenados[1:]:
                    await self._marcar_como_historico(vehiculo_historico, vehiculo_actual.id)
                    vehiculos_historicos.append(vehiculo_historico.id)
                    bloqueados += 1
                    
                    logger.debug(f"🔒 Placa {placa}: Vehículo {vehiculo_historico.id} marcado como histórico (historial #{vehiculo_historico.numeroHistorialValidacion})")
                
            except Exception as e:
                logger.error(f"❌ Error procesando placa {placa}: {str(e)}")
                errores += 1
        
        resultado = {
            "total_procesados": len(vehiculos),
            "placas_unicas": len(vehiculos_por_placa),
            "vehiculos_actuales": len(vehiculos_actuales),
            "vehiculos_historicos": len(vehiculos_historicos),
            "actualizados": actualizados,
            "bloqueados": bloqueados,
            "errores": errores,
            "vehiculos_actuales_ids": vehiculos_actuales,
            "vehiculos_historicos_ids": vehiculos_historicos
        }
        
        logger.info(f"✅ Marcado completado: {actualizados} actualizados, {bloqueados} bloqueados, {errores} errores")
        return resultado
    
    async def _marcar_como_actual(self, vehiculo: Vehiculo) -> None:
        """Marca un vehículo como el registro actual"""
        update_data = VehiculoUpdate(
            esHistorialActual=True,
            vehiculoHistorialActualId=None,  # Es el actual, no apunta a otro
            estado=vehiculo.estado if vehiculo.estado != EstadoVehiculo.BLOQUEADO_HISTORIAL else EstadoVehiculo.ACTIVO,
            fechaActualizacion=datetime.utcnow()
        )
        
        await self.vehiculo_service.update_vehiculo(vehiculo.id, update_data)
    
    async def _marcar_como_historico(self, vehiculo: Vehiculo, vehiculo_actual_id: str) -> None:
        """Marca un vehículo como registro histórico"""
        update_data = VehiculoUpdate(
            esHistorialActual=False,
            vehiculoHistorialActualId=vehiculo_actual_id,
            estado=EstadoVehiculo.BLOQUEADO_HISTORIAL,
            fechaActualizacion=datetime.utcnow()
        )
        
        await self.vehiculo_service.update_vehiculo(vehiculo.id, update_data)
    
    async def obtener_vehiculos_visibles(self, empresa_id: Optional[str] = None) -> List[Vehiculo]:
        """
        Obtiene solo los vehículos que deben ser visibles en las tablas.
        
        Args:
            empresa_id: Filtrar por empresa (opcional)
            
        Returns:
            Lista de vehículos visibles (solo los actuales)
        """
        logger.info(f"🔍 Obteniendo vehículos visibles para empresa: {empresa_id or 'todas'}")
        
        # Obtener todos los vehículos activos
        if empresa_id:
            vehiculos = await self.vehiculo_service.get_vehiculos_por_empresa(empresa_id)
        else:
            vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Filtrar solo los que son historial actual y no están bloqueados
        vehiculos_visibles = [
            v for v in vehiculos 
            if (v.esHistorialActual and 
                v.estado != EstadoVehiculo.BLOQUEADO_HISTORIAL and
                v.estaActivo)
        ]
        
        logger.info(f"📊 Vehículos visibles: {len(vehiculos_visibles)} de {len(vehiculos)} totales")
        return vehiculos_visibles
    
    async def obtener_vehiculos_historicos(self, placa: str) -> List[Vehiculo]:
        """
        Obtiene todos los registros históricos de una placa específica.
        
        Args:
            placa: Placa del vehículo
            
        Returns:
            Lista de todos los registros históricos ordenados por historial
        """
        logger.info(f"🔍 Obteniendo historial completo para placa: {placa}")
        
        # Obtener todos los vehículos (incluyendo históricos)
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Filtrar por placa
        vehiculos_placa = [v for v in vehiculos if v.placa == placa]
        
        # Ordenar por número de historial
        vehiculos_ordenados = sorted(
            vehiculos_placa,
            key=lambda v: v.numeroHistorialValidacion or 0
        )
        
        logger.info(f"📊 Registros históricos encontrados: {len(vehiculos_ordenados)}")
        return vehiculos_ordenados
    
    async def obtener_estadisticas_filtrado(self) -> Dict[str, any]:
        """
        Genera estadísticas del filtrado por historial.
        
        Returns:
            Dict con estadísticas detalladas
        """
        logger.info("📊 Generando estadísticas de filtrado por historial")
        
        vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Contar por estado de historial
        vehiculos_actuales = [v for v in vehiculos if v.esHistorialActual]
        vehiculos_historicos = [v for v in vehiculos if not v.esHistorialActual]
        vehiculos_bloqueados = [v for v in vehiculos if v.estado == EstadoVehiculo.BLOQUEADO_HISTORIAL]
        
        # Agrupar por placa para análisis
        placas_con_historial = {}
        for vehiculo in vehiculos:
            placa = vehiculo.placa
            if placa not in placas_con_historial:
                placas_con_historial[placa] = []
            placas_con_historial[placa].append(vehiculo)
        
        # Estadísticas por placa
        placas_con_multiples_registros = {
            placa: vehiculos_placa 
            for placa, vehiculos_placa in placas_con_historial.items() 
            if len(vehiculos_placa) > 1
        }
        
        estadisticas = {
            "resumen": {
                "total_vehiculos": len(vehiculos),
                "vehiculos_actuales": len(vehiculos_actuales),
                "vehiculos_historicos": len(vehiculos_historicos),
                "vehiculos_bloqueados": len(vehiculos_bloqueados),
                "placas_unicas": len(placas_con_historial),
                "placas_con_historial_multiple": len(placas_con_multiples_registros)
            },
            "distribucion_por_estado": {
                estado.value: len([v for v in vehiculos if v.estado == estado])
                for estado in EstadoVehiculo
            },
            "placas_con_multiples_registros": [
                {
                    "placa": placa,
                    "total_registros": len(vehiculos_placa),
                    "registro_actual": next((v.id for v in vehiculos_placa if v.esHistorialActual), None),
                    "registros_historicos": [v.id for v in vehiculos_placa if not v.esHistorialActual]
                }
                for placa, vehiculos_placa in placas_con_multiples_registros.items()
            ],
            "eficiencia_filtrado": {
                "porcentaje_visibles": round((len(vehiculos_actuales) / len(vehiculos) * 100), 2) if vehiculos else 0,
                "porcentaje_ocultos": round((len(vehiculos_historicos) / len(vehiculos) * 100), 2) if vehiculos else 0,
                "reduccion_ruido": len(vehiculos_historicos)
            }
        }
        
        logger.info("✅ Estadísticas de filtrado generadas")
        return estadisticas
    
    async def restaurar_vehiculo_historico(self, vehiculo_id: str) -> Dict[str, any]:
        """
        Restaura un vehículo histórico como el actual (útil para correcciones).
        
        Args:
            vehiculo_id: ID del vehículo histórico a restaurar
            
        Returns:
            Dict con resultado de la operación
        """
        logger.info(f"🔄 Restaurando vehículo histórico: {vehiculo_id}")
        
        # Obtener el vehículo a restaurar
        vehiculo_a_restaurar = await self.vehiculo_service.get_vehiculo_by_id(vehiculo_id)
        if not vehiculo_a_restaurar:
            raise ValueError(f"Vehículo {vehiculo_id} no encontrado")
        
        # Obtener todos los vehículos con la misma placa
        vehiculos_placa = await self.obtener_vehiculos_historicos(vehiculo_a_restaurar.placa)
        
        # Marcar el actual como histórico
        vehiculo_actual_anterior = next((v for v in vehiculos_placa if v.esHistorialActual), None)
        if vehiculo_actual_anterior:
            await self._marcar_como_historico(vehiculo_actual_anterior, vehiculo_id)
        
        # Marcar el seleccionado como actual
        await self._marcar_como_actual(vehiculo_a_restaurar)
        
        resultado = {
            "vehiculo_restaurado": vehiculo_id,
            "placa": vehiculo_a_restaurar.placa,
            "vehiculo_anterior": vehiculo_actual_anterior.id if vehiculo_actual_anterior else None,
            "mensaje": f"Vehículo {vehiculo_a_restaurar.placa} restaurado como actual"
        }
        
        logger.info(f"✅ Vehículo {vehiculo_a_restaurar.placa} restaurado exitosamente")
        return resultado
    
    async def obtener_vehiculos_con_filtro_historial(
        self, 
        empresa_id: Optional[str] = None,
        incluir_historicos: bool = False,
        solo_bloqueados: bool = False
    ) -> List[Vehiculo]:
        """
        Obtiene vehículos con filtros específicos de historial.
        
        Args:
            empresa_id: Filtrar por empresa
            incluir_historicos: Si incluir registros históricos
            solo_bloqueados: Si mostrar solo los bloqueados
            
        Returns:
            Lista de vehículos filtrados
        """
        logger.info(f"🔍 Obteniendo vehículos con filtros: empresa={empresa_id}, históricos={incluir_historicos}, bloqueados={solo_bloqueados}")
        
        # Obtener vehículos base
        if empresa_id:
            vehiculos = await self.vehiculo_service.get_vehiculos_por_empresa(empresa_id)
        else:
            vehiculos = await self.vehiculo_service.get_vehiculos_activos()
        
        # Aplicar filtros
        if solo_bloqueados:
            vehiculos_filtrados = [v for v in vehiculos if v.estado == EstadoVehiculo.BLOQUEADO_HISTORIAL]
        elif incluir_historicos:
            vehiculos_filtrados = vehiculos  # Todos
        else:
            vehiculos_filtrados = [v for v in vehiculos if v.esHistorialActual and v.estado != EstadoVehiculo.BLOQUEADO_HISTORIAL]
        
        logger.info(f"📊 Vehículos filtrados: {len(vehiculos_filtrados)} de {len(vehiculos)} totales")
        return vehiculos_filtrados