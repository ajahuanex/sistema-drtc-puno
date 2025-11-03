"""
Repository for Derivacion model
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from datetime import datetime, timedelta
import uuid
import re

from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.documento import Documento
from app.schemas.mesa_partes.derivacion import FiltrosDerivacion
from .base_repository import BaseRepository

class DerivacionRepository(BaseRepository[Derivacion]):
    """Repository for Derivacion operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Derivacion)
    
    def create(self, derivacion_data: Dict[str, Any]) -> Derivacion:
        """Create a new derivacion with auto-generated numero_derivacion"""
        # Generate numero_derivacion if not provided
        if 'numero_derivacion' not in derivacion_data or not derivacion_data['numero_derivacion']:
            derivacion_data['numero_derivacion'] = self.generar_numero_derivacion()
        
        return super().create(derivacion_data)
    
    def get_by_id(self, id: str, include_relations: bool = True) -> Optional[Derivacion]:
        """Get derivacion by ID with optional relations"""
        try:
            uuid_id = uuid.UUID(id) if isinstance(id, str) else id
            query = self.db.query(Derivacion).filter(Derivacion.id == uuid_id)
            
            if include_relations:
                query = query.options(
                    joinedload(Derivacion.documento)
                )
            
            return query.first()
        except (ValueError, TypeError):
            return None
    
    def get_by_numero_derivacion(self, numero_derivacion: str) -> Optional[Derivacion]:
        """Get derivacion by numero_derivacion"""
        return self.db.query(Derivacion).filter(
            Derivacion.numero_derivacion == numero_derivacion
        ).first()
    
    def get_by_documento(self, documento_id: str, include_relations: bool = True) -> List[Derivacion]:
        """Get all derivaciones for a specific documento"""
        try:
            uuid_documento_id = uuid.UUID(documento_id) if isinstance(documento_id, str) else documento_id
            query = self.db.query(Derivacion).filter(Derivacion.documento_id == uuid_documento_id)
            
            if include_relations:
                query = query.options(
                    joinedload(Derivacion.documento)
                )
            
            return query.order_by(Derivacion.fecha_derivacion.desc()).all()
        except (ValueError, TypeError):
            return []
    
    def get_by_area(self, area_id: str, estado: Optional[EstadoDerivacionEnum] = None, 
                   es_origen: bool = False) -> List[Derivacion]:
        """Get derivaciones by area (as destino or origen)"""
        if es_origen:
            query = self.db.query(Derivacion).filter(Derivacion.area_origen_id == area_id)
        else:
            query = self.db.query(Derivacion).filter(Derivacion.area_destino_id == area_id)
        
        if estado:
            query = query.filter(Derivacion.estado == estado)
        
        return query.options(
            joinedload(Derivacion.documento)
        ).order_by(Derivacion.fecha_derivacion.desc()).all()
    
    def get_by_usuario(self, usuario_id: str, tipo_usuario: str = "deriva") -> List[Derivacion]:
        """Get derivaciones by user (deriva, recibe, or atiende)"""
        if tipo_usuario == "deriva":
            query = self.db.query(Derivacion).filter(Derivacion.usuario_deriva_id == usuario_id)
        elif tipo_usuario == "recibe":
            query = self.db.query(Derivacion).filter(Derivacion.usuario_recibe_id == usuario_id)
        elif tipo_usuario == "atiende":
            query = self.db.query(Derivacion).filter(Derivacion.usuario_atiende_id == usuario_id)
        else:
            # Get all derivaciones where user is involved
            query = self.db.query(Derivacion).filter(
                or_(
                    Derivacion.usuario_deriva_id == usuario_id,
                    Derivacion.usuario_recibe_id == usuario_id,
                    Derivacion.usuario_atiende_id == usuario_id
                )
            )
        
        return query.options(
            joinedload(Derivacion.documento)
        ).order_by(Derivacion.fecha_derivacion.desc()).all()
    
    def list(self, filtros: FiltrosDerivacion, include_relations: bool = False) -> Tuple[List[Derivacion], int]:
        """List derivaciones with filters, pagination and total count"""
        query = self.db.query(Derivacion)
        
        # Apply filters
        query = self._apply_filters(query, filtros)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        query = self._apply_sorting(query, filtros.sort_by, filtros.sort_order)
        
        # Apply pagination
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)
        
        # Include relations if requested
        if include_relations:
            query = query.options(
                joinedload(Derivacion.documento)
            )
        
        derivaciones = query.all()
        return derivaciones, total_count
    
    def update(self, id: str, update_data: Dict[str, Any]) -> Optional[Derivacion]:
        """Update derivacion"""
        # Remove None values to avoid overwriting with null
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        # Set automatic dates based on estado changes
        if 'estado' in update_data:
            if update_data['estado'] == EstadoDerivacionEnum.RECIBIDO and 'fecha_recepcion' not in update_data:
                update_data['fecha_recepcion'] = datetime.utcnow()
            elif update_data['estado'] == EstadoDerivacionEnum.ATENDIDO and 'fecha_atencion' not in update_data:
                update_data['fecha_atencion'] = datetime.utcnow()
        
        return super().update(id, update_data)
    
    def recibir_derivacion(self, derivacion_id: str, usuario_recibe_id: str, 
                          observaciones: Optional[str] = None, acepta: bool = True,
                          motivo_rechazo: Optional[str] = None) -> Optional[Derivacion]:
        """Mark derivacion as received"""
        update_data = {
            'usuario_recibe_id': usuario_recibe_id,
            'fecha_recepcion': datetime.utcnow(),
            'estado': EstadoDerivacionEnum.RECIBIDO if acepta else EstadoDerivacionEnum.RECHAZADO
        }
        
        if observaciones:
            update_data['observaciones'] = observaciones
        
        if not acepta and motivo_rechazo:
            update_data['motivo_rechazo'] = motivo_rechazo
        
        return self.update(derivacion_id, update_data)
    
    def atender_derivacion(self, derivacion_id: str, usuario_atiende_id: str,
                          observaciones: str) -> Optional[Derivacion]:
        """Mark derivacion as attended"""
        update_data = {
            'usuario_atiende_id': usuario_atiende_id,
            'fecha_atencion': datetime.utcnow(),
            'estado': EstadoDerivacionEnum.ATENDIDO,
            'observaciones': observaciones
        }
        
        return self.update(derivacion_id, update_data)
    
    def get_derivaciones_vencidas(self) -> List[Derivacion]:
        """Get derivaciones that have passed their fecha_limite_atencion"""
        return self.db.query(Derivacion).filter(
            and_(
                Derivacion.fecha_limite_atencion.isnot(None),
                Derivacion.fecha_limite_atencion < datetime.utcnow(),
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
            )
        ).options(
            joinedload(Derivacion.documento)
        ).all()
    
    def get_derivaciones_urgentes_pendientes(self) -> List[Derivacion]:
        """Get urgent derivaciones that are still pending"""
        return self.db.query(Derivacion).filter(
            and_(
                Derivacion.es_urgente == True,
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
            )
        ).options(
            joinedload(Derivacion.documento)
        ).all()
    
    def get_derivaciones_por_atender(self, area_id: str, dias_limite: int = 3) -> List[Derivacion]:
        """Get derivaciones that need attention soon"""
        fecha_limite = datetime.utcnow() + timedelta(days=dias_limite)
        
        return self.db.query(Derivacion).filter(
            and_(
                Derivacion.area_destino_id == area_id,
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO]),
                or_(
                    Derivacion.fecha_limite_atencion <= fecha_limite,
                    Derivacion.es_urgente == True
                )
            )
        ).options(
            joinedload(Derivacion.documento)
        ).order_by(
            Derivacion.es_urgente.desc(),
            Derivacion.fecha_limite_atencion.asc()
        ).all()
    
    def get_historial_documento(self, documento_id: str) -> List[Derivacion]:
        """Get complete derivation history for a documento"""
        return self.get_by_documento(documento_id, include_relations=True)
    
    def get_derivacion_actual(self, documento_id: str) -> Optional[Derivacion]:
        """Get current active derivacion for a documento"""
        try:
            uuid_documento_id = uuid.UUID(documento_id) if isinstance(documento_id, str) else documento_id
            return self.db.query(Derivacion).filter(
                and_(
                    Derivacion.documento_id == uuid_documento_id,
                    Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
                )
            ).order_by(Derivacion.fecha_derivacion.desc()).first()
        except (ValueError, TypeError):
            return None
    
    def get_estadisticas(self, area_id: Optional[str] = None, 
                        fecha_desde: Optional[datetime] = None,
                        fecha_hasta: Optional[datetime] = None) -> Dict[str, Any]:
        """Get derivacion statistics"""
        query = self.db.query(Derivacion)
        
        # Apply filters
        if area_id:
            query = query.filter(
                or_(
                    Derivacion.area_origen_id == area_id,
                    Derivacion.area_destino_id == area_id
                )
            )
        
        if fecha_desde:
            query = query.filter(Derivacion.fecha_derivacion >= fecha_desde)
        if fecha_hasta:
            query = query.filter(Derivacion.fecha_derivacion <= fecha_hasta)
        
        # Basic counts
        total_derivaciones = query.count()
        
        # Count by estado
        estados_count = self.db.query(
            Derivacion.estado,
            func.count(Derivacion.id)
        ).group_by(Derivacion.estado)
        
        if area_id:
            estados_count = estados_count.filter(
                or_(
                    Derivacion.area_origen_id == area_id,
                    Derivacion.area_destino_id == area_id
                )
            )
        if fecha_desde:
            estados_count = estados_count.filter(Derivacion.fecha_derivacion >= fecha_desde)
        if fecha_hasta:
            estados_count = estados_count.filter(Derivacion.fecha_derivacion <= fecha_hasta)
        
        estados_dict = {estado.value: count for estado, count in estados_count.all()}
        
        # Count vencidas
        vencidas_count = query.filter(
            and_(
                Derivacion.fecha_limite_atencion.isnot(None),
                Derivacion.fecha_limite_atencion < datetime.utcnow(),
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
            )
        ).count()
        
        # Count urgentes
        urgentes_count = query.filter(
            and_(
                Derivacion.es_urgente == True,
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
            )
        ).count()
        
        # Average attention time (for completed derivaciones)
        tiempo_promedio = self.db.query(
            func.avg(
                func.extract('epoch', Derivacion.fecha_atencion - Derivacion.fecha_derivacion) / 86400
            )
        ).filter(
            and_(
                Derivacion.estado == EstadoDerivacionEnum.ATENDIDO,
                Derivacion.fecha_atencion.isnot(None)
            )
        )
        
        if area_id:
            tiempo_promedio = tiempo_promedio.filter(Derivacion.area_destino_id == area_id)
        if fecha_desde:
            tiempo_promedio = tiempo_promedio.filter(Derivacion.fecha_derivacion >= fecha_desde)
        if fecha_hasta:
            tiempo_promedio = tiempo_promedio.filter(Derivacion.fecha_derivacion <= fecha_hasta)
        
        tiempo_promedio_dias = tiempo_promedio.scalar()
        
        return {
            "total_derivaciones": total_derivaciones,
            "derivaciones_pendientes": estados_dict.get("PENDIENTE", 0),
            "derivaciones_recibidas": estados_dict.get("RECIBIDO", 0),
            "derivaciones_atendidas": estados_dict.get("ATENDIDO", 0),
            "derivaciones_rechazadas": estados_dict.get("RECHAZADO", 0),
            "derivaciones_vencidas": vencidas_count,
            "derivaciones_urgentes": urgentes_count,
            "derivaciones_por_estado": estados_dict,
            "tiempo_promedio_atencion_dias": float(tiempo_promedio_dias) if tiempo_promedio_dias else None
        }
    
    def generar_numero_derivacion(self, prefijo: str = "DER") -> str:
        """Generate unique numero_derivacion"""
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        # Get the last derivacion number for current year-month
        last_derivacion = self.db.query(Derivacion).filter(
            Derivacion.numero_derivacion.like(f"{prefijo}-{current_year}{current_month:02d}-%")
        ).order_by(Derivacion.numero_derivacion.desc()).first()
        
        if last_derivacion:
            # Extract number from last derivacion
            match = re.search(r'-(\d+)$', last_derivacion.numero_derivacion)
            if match:
                last_number = int(match.group(1))
                next_number = last_number + 1
            else:
                next_number = 1
        else:
            next_number = 1
        
        # Format with leading zeros (4 digits)
        return f"{prefijo}-{current_year}{current_month:02d}-{next_number:04d}"
    
    def _apply_filters(self, query, filtros: FiltrosDerivacion):
        """Apply filters to derivacion query"""
        if filtros.documento_id:
            try:
                uuid_documento_id = uuid.UUID(filtros.documento_id)
                query = query.filter(Derivacion.documento_id == uuid_documento_id)
            except (ValueError, TypeError):
                pass
        
        if filtros.area_origen_id:
            query = query.filter(Derivacion.area_origen_id == filtros.area_origen_id)
        
        if filtros.area_destino_id:
            query = query.filter(Derivacion.area_destino_id == filtros.area_destino_id)
        
        if filtros.usuario_deriva_id:
            query = query.filter(Derivacion.usuario_deriva_id == filtros.usuario_deriva_id)
        
        if filtros.usuario_recibe_id:
            query = query.filter(Derivacion.usuario_recibe_id == filtros.usuario_recibe_id)
        
        if filtros.estado:
            query = query.filter(Derivacion.estado == filtros.estado)
        
        if filtros.es_urgente is not None:
            query = query.filter(Derivacion.es_urgente == filtros.es_urgente)
        
        if filtros.requiere_respuesta is not None:
            query = query.filter(Derivacion.requiere_respuesta == filtros.requiere_respuesta)
        
        if filtros.fecha_derivacion_desde:
            query = query.filter(Derivacion.fecha_derivacion >= filtros.fecha_derivacion_desde)
        
        if filtros.fecha_derivacion_hasta:
            query = query.filter(Derivacion.fecha_derivacion <= filtros.fecha_derivacion_hasta)
        
        if filtros.fecha_limite_desde:
            query = query.filter(Derivacion.fecha_limite_atencion >= filtros.fecha_limite_desde)
        
        if filtros.fecha_limite_hasta:
            query = query.filter(Derivacion.fecha_limite_atencion <= filtros.fecha_limite_hasta)
        
        if filtros.solo_vencidas:
            query = query.filter(
                and_(
                    Derivacion.fecha_limite_atencion.isnot(None),
                    Derivacion.fecha_limite_atencion < datetime.utcnow(),
                    Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
                )
            )
        
        if filtros.solo_pendientes:
            query = query.filter(
                Derivacion.estado.in_([EstadoDerivacionEnum.PENDIENTE, EstadoDerivacionEnum.RECIBIDO])
            )
        
        if filtros.numero_derivacion:
            query = query.filter(Derivacion.numero_derivacion.ilike(f"%{filtros.numero_derivacion}%"))
        
        return query
    
    def _apply_sorting(self, query, sort_by: str = "fecha_derivacion", sort_order: str = "desc"):
        """Apply sorting to derivacion query"""
        # Map sort fields to actual model attributes
        sort_mapping = {
            "fecha_derivacion": Derivacion.fecha_derivacion,
            "fecha_recepcion": Derivacion.fecha_recepcion,
            "fecha_atencion": Derivacion.fecha_atencion,
            "fecha_limite_atencion": Derivacion.fecha_limite_atencion,
            "estado": Derivacion.estado,
            "numero_derivacion": Derivacion.numero_derivacion,
            "es_urgente": Derivacion.es_urgente,
            "created_at": Derivacion.created_at,
            "updated_at": Derivacion.updated_at
        }
        
        sort_column = sort_mapping.get(sort_by, Derivacion.fecha_derivacion)
        
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        return query