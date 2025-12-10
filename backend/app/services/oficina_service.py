from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from app.models.oficina import (
    Oficina, OficinaCreate, OficinaUpdate, OficinaResponse, 
    OficinaFiltros, OficinaResumen, OficinaEstadisticas,
    TipoOficina, EstadoOficina
)
from app.models.expediente import (
    Expediente, ExpedienteResponse, EstadoExpediente,
    NivelUrgencia, HistorialOficina, EstadoHistorialOficina
)
from app.utils.exceptions import (
    OficinaNotFoundException, OficinaAlreadyExistsException,
    ValidationErrorException, DatabaseErrorException
)
class OficinaService:
    """Servicio para gestión de oficinas y seguimiento de expedientes"""
    
    def __init__(self, db=None):
        self.db = db
        self.collection = db.oficinas if db is not None else None
        self.expedientes_collection = db.expedientes if db is not None else None
    
    async def create_oficina(self, oficina_data: OficinaCreate) -> OficinaResponse:
        """Crear una nueva oficina"""
        try:
            # TODO: Implementar creación en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
        except Exception as e:
            if isinstance(e, (OficinaAlreadyExistsException, ValidationErrorException)):
                raise e
            raise DatabaseErrorException(f"Error al crear oficina: {str(e)}")
    
    async def get_oficina(self, oficina_id: str) -> OficinaResponse:
        """Obtener una oficina por ID"""
        try:
            # TODO: Implementar búsqueda en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
            if not oficina:
                raise OficinaNotFoundException(f"Oficina no encontrada con ID: {oficina_id}")
            return oficina
        except Exception as e:
            if isinstance(e, OficinaNotFoundException):
                raise e
            raise DatabaseErrorException(f"Error al obtener oficina: {str(e)}")
    
    async def get_oficinas(self, skip: int = 0, limit: int = 100, filtros: Optional[OficinaFiltros] = None) -> List[OficinaResponse]:
        """Obtener lista de oficinas con filtros opcionales"""
        try:
            # TODO: Implementar búsqueda en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
        except Exception as e:
            raise DatabaseErrorException(f"Error al obtener oficinas: {str(e)}")
    
    async def update_oficina(self, oficina_id: str, oficina_data: OficinaUpdate) -> OficinaResponse:
        """Actualizar una oficina existente"""
        try:
            # TODO: Implementar actualización en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
            if not oficina:
                raise OficinaNotFoundException(f"Oficina no encontrada con ID: {oficina_id}")
            return oficina
        except Exception as e:
            if isinstance(e, OficinaNotFoundException):
                raise e
            raise DatabaseErrorException(f"Error al actualizar oficina: {str(e)}")
    
    async def delete_oficina(self, oficina_id: str) -> bool:
        """Eliminar una oficina (desactivar)"""
        try:
            # TODO: Implementar eliminación en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
        except Exception as e:
            if isinstance(e, (OficinaNotFoundException, ValidationErrorException)):
                raise e
            raise DatabaseErrorException(f"Error al eliminar oficina: {str(e)}")
    
    async def get_expedientes_por_oficina(self, oficina_id: str, skip: int = 0, limit: int = 100) -> List[ExpedienteResponse]:
        """Obtener expedientes que están en una oficina específica"""
        try:
            # TODO: Implementar búsqueda en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
            # Convertir a ExpedienteResponse
            expedientes = []
            for exp in expedientes_mock:
                expediente_response = ExpedienteResponse(
                    id=exp["id"],
                    numero=exp["numero"],
                    tipo=exp["tipo"],
                    empresa=exp["empresa"],
                    estado=exp["estado"],
                    fechaLlegada=exp["fechaLlegada"],
                    tiempoEstimado=exp["tiempoEstimado"],
                    urgencia=exp["urgencia"]
                )
                expedientes.append(expediente_response)
            return expedientes
        except Exception as e:
            raise DatabaseErrorException(f"Error al obtener expedientes por oficina: {str(e)}")
    
    async def mover_expediente(self, expediente_id: str, nueva_oficina_id: str, usuario_id: str, 
                              motivo: str, observaciones: Optional[str] = None,
                              documentos_requeridos: List[str] = None,
                              documentos_entregados: List[str] = None) -> bool:
        """Mover un expediente de una oficina a otra"""
        try:
            # TODO: Implementar movimiento en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
        except Exception as e:
            if isinstance(e, ValidationErrorException):
                raise e
            raise DatabaseErrorException(f"Error al mover expediente: {str(e)}")
    
    async def get_estadisticas_oficina(self, oficina_id: str) -> OficinaEstadisticas:
        """Obtener estadísticas detalladas de una oficina"""
        try:
            # TODO: Implementar estadísticas en base de datos
            raise NotImplementedError("Servicio de oficinas pendiente de implementación")
            
            # Convertir a OficinaEstadisticas
            return OficinaEstadisticas(
                oficinaId=oficina_id,
                nombreOficina=estadisticas_mock["oficina"],
                tipoOficina=estadisticas_mock["tipo"],
                totalExpedientes=estadisticas_mock["totalExpedientes"],
                expedientesEnCola=estadisticas_mock["expedientesEnCola"],
                expedientesEnProceso=estadisticas_mock["expedientesEnProceso"],
                expedientesCompletados=estadisticas_mock["expedientesCompletados"],
                expedientesUrgentes=0,  # Mock no incluye este dato
                tiempoPromedioProcesamiento=estadisticas_mock["tiempoPromedioProcesamiento"],
                expedientesVencidos=0,  # Mock no incluye este dato
                capacidadUtilizada=float(estadisticas_mock["capacidadUtilizada"].replace("%", "")),
                eficiencia=0  # Mock no incluye este dato
            )
            
        except Exception as e:
            if isinstance(e, OficinaNotFoundException):
                raise e
            raise DatabaseErrorException(f"Error al obtener estadísticas de oficina: {str(e)}")
    
    async def get_oficinas_resumen(self) -> List[OficinaResumen]:
        """Obtener resumen de todas las oficinas activas"""
        try:
            oficinas = await self.get_oficinas()
            resumenes = []
            
            for oficina in oficinas:
                # Usar datos mock para expedientes
                expedientes_en_cola = 8  # Mock data
                expedientes_en_proceso = 12  # Mock data
                capacidad_disponible = oficina.capacidadMaxima - (expedientes_en_cola + expedientes_en_proceso)
                
                resumen = OficinaResumen(
                    id=oficina.id,
                    nombre=oficina.nombre,
                    tipo=oficina.tipo,
                    responsable=f"{oficina.responsable['nombres']} {oficina.responsable['apellidos']}",
                    ubicacion=oficina.ubicacion,
                    estado=oficina.estado,
                    expedientesEnCola=expedientes_en_cola,
                    expedientesEnProceso=expedientes_en_proceso,
                    capacidadDisponible=capacidad_disponible,
                    tiempoPromedio=oficina.tiempoEstimadoProcesamiento
                )
                
                resumenes.append(resumen)
            
            return resumenes
            
        except Exception as e:
            raise DatabaseErrorException(f"Error al obtener resumen de oficinas: {str(e)}") 