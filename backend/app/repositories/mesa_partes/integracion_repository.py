"""
Repository for Integracion model
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from datetime import datetime, timedelta
import uuid

from app.models.mesa_partes.integracion import (
    Integracion, LogSincronizacion, 
    TipoIntegracionEnum, EstadoConexionEnum, EstadoSincronizacionEnum
)
from app.schemas.mesa_partes.integracion import FiltrosLogSincronizacion
from .base_repository import BaseRepository

class IntegracionRepository(BaseRepository[Integracion]):
    """Repository for Integracion operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Integracion)
    
    def create(self, integracion_data: Dict[str, Any]) -> Integracion:
        """Create a new integracion"""
        # Handle credentials encryption
        if 'credenciales' in integracion_data and integracion_data['credenciales']:
            credenciales = integracion_data.pop('credenciales')
            integracion = Integracion(**integracion_data)
            integracion.encriptar_credenciales(credenciales)
            
            self.db.add(integracion)
            self.db.commit()
            self.db.refresh(integracion)
            return integracion
        else:
            return super().create(integracion_data)
    
    def get_by_id(self, id: str, include_relations: bool = True) -> Optional[Integracion]:
        """Get integracion by ID with optional relations"""
        try:
            uuid_id = uuid.UUID(id) if isinstance(id, str) else id
            query = self.db.query(Integracion).filter(Integracion.id == uuid_id)
            
            if include_relations:
                query = query.options(
                    joinedload(Integracion.logs_sincronizacion)
                )
            
            return query.first()
        except (ValueError, TypeError):
            return None
    
    def get_by_codigo(self, codigo: str) -> Optional[Integracion]:
        """Get integracion by codigo"""
        return self.db.query(Integracion).filter(Integracion.codigo == codigo.upper()).first()
    
    def list(self, skip: int = 0, limit: int = 100, activas_solo: bool = False,
             tipo: Optional[TipoIntegracionEnum] = None) -> List[Integracion]:
        """List integraciones with optional filters"""
        query = self.db.query(Integracion)
        
        if activas_solo:
            query = query.filter(Integracion.activa == True)
        
        if tipo:
            query = query.filter(Integracion.tipo == tipo)
        
        return query.order_by(Integracion.nombre).offset(skip).limit(limit).all()
    
    def update(self, id: str, update_data: Dict[str, Any]) -> Optional[Integracion]:
        """Update integracion"""
        integracion = self.get_by_id(id, include_relations=False)
        if not integracion:
            return None
        
        # Handle credentials encryption if provided
        if 'credenciales' in update_data and update_data['credenciales']:
            credenciales = update_data.pop('credenciales')
            integracion.encriptar_credenciales(credenciales)
        
        # Remove None values to avoid overwriting with null
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        for field, value in update_data.items():
            if hasattr(integracion, field):
                setattr(integracion, field, value)
        
        self.db.commit()
        self.db.refresh(integracion)
        return integracion
    
    def delete(self, id: str) -> bool:
        """Delete integracion (hard delete)"""
        return super().delete(id)
    
    def activar_desactivar(self, id: str, activa: bool) -> Optional[Integracion]:
        """Activate or deactivate integracion"""
        return self.update(id, {"activa": activa})
    
    def actualizar_estado_conexion(self, id: str, estado: EstadoConexionEnum, 
                                  error: Optional[str] = None) -> Optional[Integracion]:
        """Update connection status"""
        update_data = {"estado_conexion": estado}
        
        if error:
            update_data.update({
                "ultimo_error": error,
                "fecha_ultimo_error": datetime.utcnow()
            })
        elif estado == EstadoConexionEnum.CONECTADO:
            # Clear error if connection is successful
            update_data.update({
                "ultimo_error": None,
                "fecha_ultimo_error": None
            })
        
        return self.update(id, update_data)
    
    def actualizar_ultima_sincronizacion(self, id: str) -> Optional[Integracion]:
        """Update last synchronization timestamp"""
        return self.update(id, {"ultima_sincronizacion": datetime.utcnow()})
    
    def get_integraciones_activas(self) -> List[Integracion]:
        """Get all active integraciones"""
        return self.db.query(Integracion).filter(Integracion.activa == True).all()
    
    def get_integraciones_por_tipo(self, tipo: TipoIntegracionEnum) -> List[Integracion]:
        """Get integraciones by type"""
        return self.db.query(Integracion).filter(
            and_(
                Integracion.tipo == tipo,
                Integracion.activa == True
            )
        ).all()
    
    def get_integraciones_con_webhook(self) -> List[Integracion]:
        """Get integraciones that have webhook configured"""
        return self.db.query(Integracion).filter(
            and_(
                Integracion.webhook_url.isnot(None),
                Integracion.activa == True
            )
        ).all()
    
    def get_integraciones_con_errores(self) -> List[Integracion]:
        """Get integraciones with connection errors"""
        return self.db.query(Integracion).filter(
            Integracion.estado_conexion == EstadoConexionEnum.ERROR
        ).all()
    
    def get_estadisticas(self, fecha_desde: Optional[datetime] = None,
                        fecha_hasta: Optional[datetime] = None) -> Dict[str, Any]:
        """Get integracion statistics"""
        # Basic counts
        total_integraciones = self.db.query(Integracion).count()
        integraciones_activas = self.db.query(Integracion).filter(Integracion.activa == True).count()
        integraciones_conectadas = self.db.query(Integracion).filter(
            Integracion.estado_conexion == EstadoConexionEnum.CONECTADO
        ).count()
        integraciones_con_error = self.db.query(Integracion).filter(
            Integracion.estado_conexion == EstadoConexionEnum.ERROR
        ).count()
        
        # Synchronization stats
        sync_query = self.db.query(LogSincronizacion)
        
        if fecha_desde:
            sync_query = sync_query.filter(LogSincronizacion.created_at >= fecha_desde)
        if fecha_hasta:
            sync_query = sync_query.filter(LogSincronizacion.created_at <= fecha_hasta)
        
        total_sincronizaciones = sync_query.count()
        sincronizaciones_exitosas = sync_query.filter(
            LogSincronizacion.estado == EstadoSincronizacionEnum.EXITOSO
        ).count()
        sincronizaciones_fallidas = sync_query.filter(
            LogSincronizacion.estado == EstadoSincronizacionEnum.ERROR
        ).count()
        
        # Documents sent/received
        documentos_enviados = sync_query.filter(
            and_(
                LogSincronizacion.direccion == "SALIDA",
                LogSincronizacion.operacion == "ENVIO"
            )
        ).count()
        
        documentos_recibidos = sync_query.filter(
            and_(
                LogSincronizacion.direccion == "ENTRADA",
                LogSincronizacion.operacion == "RECEPCION"
            )
        ).count()
        
        # Average response time
        tiempo_promedio = sync_query.filter(
            LogSincronizacion.tiempo_respuesta_ms.isnot(None)
        ).with_entities(
            func.avg(LogSincronizacion.tiempo_respuesta_ms)
        ).scalar()
        
        return {
            "total_integraciones": total_integraciones,
            "integraciones_activas": integraciones_activas,
            "integraciones_conectadas": integraciones_conectadas,
            "integraciones_con_error": integraciones_con_error,
            "total_sincronizaciones": total_sincronizaciones,
            "sincronizaciones_exitosas": sincronizaciones_exitosas,
            "sincronizaciones_fallidas": sincronizaciones_fallidas,
            "documentos_enviados": documentos_enviados,
            "documentos_recibidos": documentos_recibidos,
            "tiempo_promedio_respuesta_ms": float(tiempo_promedio) if tiempo_promedio else None
        }
    
    def buscar_por_nombre(self, nombre: str, limit: int = 10) -> List[Integracion]:
        """Search integraciones by name"""
        search_pattern = f"%{nombre}%"
        return self.db.query(Integracion).filter(
            Integracion.nombre.ilike(search_pattern)
        ).limit(limit).all()

class LogSincronizacionRepository(BaseRepository[LogSincronizacion]):
    """Repository for LogSincronizacion operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, LogSincronizacion)
    
    def create_log(self, log_data: Dict[str, Any]) -> LogSincronizacion:
        """Create a new synchronization log"""
        return super().create(log_data)
    
    def get_by_integracion(self, integracion_id: str, limit: int = 100) -> List[LogSincronizacion]:
        """Get logs by integracion"""
        try:
            uuid_integracion_id = uuid.UUID(integracion_id) if isinstance(integracion_id, str) else integracion_id
            return self.db.query(LogSincronizacion).filter(
                LogSincronizacion.integracion_id == uuid_integracion_id
            ).order_by(LogSincronizacion.created_at.desc()).limit(limit).all()
        except (ValueError, TypeError):
            return []
    
    def get_by_documento(self, documento_id: str) -> List[LogSincronizacion]:
        """Get logs by documento"""
        try:
            uuid_documento_id = uuid.UUID(documento_id) if isinstance(documento_id, str) else documento_id
            return self.db.query(LogSincronizacion).filter(
                LogSincronizacion.documento_id == uuid_documento_id
            ).order_by(LogSincronizacion.created_at.desc()).all()
        except (ValueError, TypeError):
            return []
    
    def list(self, filtros: FiltrosLogSincronizacion) -> Tuple[List[LogSincronizacion], int]:
        """List logs with filters and pagination"""
        query = self.db.query(LogSincronizacion)
        
        # Apply filters
        query = self._apply_filters(query, filtros)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        query = self._apply_sorting(query, filtros.sort_by, filtros.sort_order)
        
        # Apply pagination
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)
        
        logs = query.all()
        return logs, total_count
    
    def get_logs_con_errores(self, integracion_id: Optional[str] = None,
                            dias_atras: int = 7) -> List[LogSincronizacion]:
        """Get logs with errors"""
        fecha_desde = datetime.utcnow() - timedelta(days=dias_atras)
        query = self.db.query(LogSincronizacion).filter(
            and_(
                LogSincronizacion.estado == EstadoSincronizacionEnum.ERROR,
                LogSincronizacion.created_at >= fecha_desde
            )
        )
        
        if integracion_id:
            try:
                uuid_integracion_id = uuid.UUID(integracion_id)
                query = query.filter(LogSincronizacion.integracion_id == uuid_integracion_id)
            except (ValueError, TypeError):
                pass
        
        return query.order_by(LogSincronizacion.created_at.desc()).all()
    
    def get_logs_pendientes_reintento(self) -> List[LogSincronizacion]:
        """Get logs pending retry"""
        return self.db.query(LogSincronizacion).filter(
            and_(
                LogSincronizacion.estado == EstadoSincronizacionEnum.REINTENTANDO,
                LogSincronizacion.fecha_proximo_reintento <= datetime.utcnow()
            )
        ).all()
    
    def marcar_para_reintento(self, log_id: str, fecha_reintento: datetime) -> Optional[LogSincronizacion]:
        """Mark log for retry"""
        log = self.get_by_id(log_id)
        if not log:
            return None
        
        log.estado = EstadoSincronizacionEnum.REINTENTANDO
        log.fecha_proximo_reintento = fecha_reintento
        log.numero_intento += 1
        
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def actualizar_estado_log(self, log_id: str, estado: EstadoSincronizacionEnum,
                             mensaje_error: Optional[str] = None,
                             datos_recibidos: Optional[Dict[str, Any]] = None) -> Optional[LogSincronizacion]:
        """Update log status"""
        update_data = {"estado": estado}
        
        if mensaje_error:
            update_data["mensaje_error"] = mensaje_error
        
        if datos_recibidos:
            update_data["datos_recibidos"] = datos_recibidos
        
        return self.update(log_id, update_data)
    
    def limpiar_logs_antiguos(self, dias_antiguedad: int = 90) -> int:
        """Clean old logs"""
        fecha_limite = datetime.utcnow() - timedelta(days=dias_antiguedad)
        
        # Only delete successful logs, keep error logs for longer
        logs_eliminados = self.db.query(LogSincronizacion).filter(
            and_(
                LogSincronizacion.created_at < fecha_limite,
                LogSincronizacion.estado == EstadoSincronizacionEnum.EXITOSO
            )
        ).delete()
        
        self.db.commit()
        return logs_eliminados
    
    def get_estadisticas_integracion(self, integracion_id: str,
                                   fecha_desde: Optional[datetime] = None,
                                   fecha_hasta: Optional[datetime] = None) -> Dict[str, Any]:
        """Get statistics for specific integracion"""
        try:
            uuid_integracion_id = uuid.UUID(integracion_id)
            query = self.db.query(LogSincronizacion).filter(
                LogSincronizacion.integracion_id == uuid_integracion_id
            )
            
            if fecha_desde:
                query = query.filter(LogSincronizacion.created_at >= fecha_desde)
            if fecha_hasta:
                query = query.filter(LogSincronizacion.created_at <= fecha_hasta)
            
            total_logs = query.count()
            logs_exitosos = query.filter(LogSincronizacion.estado == EstadoSincronizacionEnum.EXITOSO).count()
            logs_error = query.filter(LogSincronizacion.estado == EstadoSincronizacionEnum.ERROR).count()
            
            # Average response time
            tiempo_promedio = query.filter(
                LogSincronizacion.tiempo_respuesta_ms.isnot(None)
            ).with_entities(
                func.avg(LogSincronizacion.tiempo_respuesta_ms)
            ).scalar()
            
            return {
                "total_sincronizaciones": total_logs,
                "sincronizaciones_exitosas": logs_exitosos,
                "sincronizaciones_fallidas": logs_error,
                "tasa_exito": (logs_exitosos / total_logs * 100) if total_logs > 0 else 0,
                "tiempo_promedio_respuesta_ms": float(tiempo_promedio) if tiempo_promedio else None
            }
        except (ValueError, TypeError):
            return {}
    
    def _apply_filters(self, query, filtros: FiltrosLogSincronizacion):
        """Apply filters to log query"""
        if filtros.integracion_id:
            try:
                uuid_integracion_id = uuid.UUID(filtros.integracion_id)
                query = query.filter(LogSincronizacion.integracion_id == uuid_integracion_id)
            except (ValueError, TypeError):
                pass
        
        if filtros.documento_id:
            try:
                uuid_documento_id = uuid.UUID(filtros.documento_id)
                query = query.filter(LogSincronizacion.documento_id == uuid_documento_id)
            except (ValueError, TypeError):
                pass
        
        if filtros.operacion:
            query = query.filter(LogSincronizacion.operacion == filtros.operacion)
        
        if filtros.estado:
            query = query.filter(LogSincronizacion.estado == filtros.estado)
        
        if filtros.fecha_desde:
            query = query.filter(LogSincronizacion.created_at >= filtros.fecha_desde)
        
        if filtros.fecha_hasta:
            query = query.filter(LogSincronizacion.created_at <= filtros.fecha_hasta)
        
        if filtros.solo_errores:
            query = query.filter(LogSincronizacion.estado == EstadoSincronizacionEnum.ERROR)
        
        return query
    
    def _apply_sorting(self, query, sort_by: str = "created_at", sort_order: str = "desc"):
        """Apply sorting to log query"""
        # Map sort fields to actual model attributes
        sort_mapping = {
            "created_at": LogSincronizacion.created_at,
            "operacion": LogSincronizacion.operacion,
            "estado": LogSincronizacion.estado,
            "tiempo_respuesta_ms": LogSincronizacion.tiempo_respuesta_ms,
            "numero_intento": LogSincronizacion.numero_intento
        }
        
        sort_column = sort_mapping.get(sort_by, LogSincronizacion.created_at)
        
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        return query