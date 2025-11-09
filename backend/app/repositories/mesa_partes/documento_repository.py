"""
Repository for Documento model with caching support
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from datetime import datetime, date
import uuid
import re
import logging

from app.models.mesa_partes.documento import Documento, TipoDocumento, ArchivoAdjunto, EstadoDocumentoEnum, PrioridadEnum
from app.schemas.mesa_partes.documento import FiltrosDocumento
from app.core.cache import get_cache, cached, invalidate_cache
from .base_repository import BaseRepository

logger = logging.getLogger(__name__)

class DocumentoRepository(BaseRepository[Documento]):
    """Repository for Documento operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Documento)
    
    def create(self, documento_data: Dict[str, Any]) -> Documento:
        """Create a new documento with auto-generated numero_expediente"""
        # Generate numero_expediente if not provided
        if 'numero_expediente' not in documento_data or not documento_data['numero_expediente']:
            documento_data['numero_expediente'] = self.generar_numero_expediente()
        
        # Generate QR code if not provided
        if 'codigo_qr' not in documento_data or not documento_data['codigo_qr']:
            documento_data['codigo_qr'] = self._generar_codigo_qr(documento_data['numero_expediente'])
        
        documento = super().create(documento_data)
        
        # Invalidate list caches
        invalidate_cache("documentos:list:*")
        
        return documento
    
    def get_by_id(self, id: str, include_relations: bool = True, use_cache: bool = True) -> Optional[Documento]:
        """Get documento by ID with optional relations and caching"""
        try:
            uuid_id = uuid.UUID(id) if isinstance(id, str) else id
            
            # Try cache first if enabled
            if use_cache:
                cache = get_cache()
                cache_key = f"documento:{id}:relations:{include_relations}"
                cached_doc = cache.get(cache_key)
                if cached_doc is not None:
                    logger.debug(f"Cache hit for documento: {id}")
                    return cached_doc
            
            # Query database
            query = self.db.query(Documento).filter(Documento.id == uuid_id)
            
            if include_relations:
                query = query.options(
                    joinedload(Documento.tipo_documento),
                    joinedload(Documento.archivos_adjuntos),
                    joinedload(Documento.derivaciones)
                )
            
            documento = query.first()
            
            # Cache result if found
            if documento and use_cache:
                cache = get_cache()
                cache_key = f"documento:{id}:relations:{include_relations}"
                cache.set(cache_key, documento, ttl=300)  # 5 minutes
            
            return documento
        except (ValueError, TypeError):
            return None
    
    def get_by_numero_expediente(self, numero_expediente: str, include_relations: bool = True) -> Optional[Documento]:
        """Get documento by numero_expediente"""
        query = self.db.query(Documento).filter(Documento.numero_expediente == numero_expediente)
        
        if include_relations:
            query = query.options(
                joinedload(Documento.tipo_documento),
                joinedload(Documento.archivos_adjuntos),
                joinedload(Documento.derivaciones)
            )
        
        return query.first()
    
    def get_by_codigo_qr(self, codigo_qr: str) -> Optional[Documento]:
        """Get documento by QR code"""
        return self.db.query(Documento).filter(Documento.codigo_qr == codigo_qr).first()
    
    def list(self, filtros: FiltrosDocumento, include_relations: bool = False) -> Tuple[List[Documento], int]:
        """List documentos with filters, pagination and total count"""
        query = self.db.query(Documento)
        
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
                joinedload(Documento.tipo_documento),
                joinedload(Documento.archivos_adjuntos)
            )
        
        documentos = query.all()
        return documentos, total_count
    
    def update(self, id: str, update_data: Dict[str, Any]) -> Optional[Documento]:
        """Update documento"""
        # Remove None values to avoid overwriting with null
        update_data = {k: v for k, v in update_data.items() if v is not None}
        return super().update(id, update_data)
    
    def delete(self, id: str) -> bool:
        """Soft delete documento (mark as archived)"""
        return self.update(id, {"estado": EstadoDocumentoEnum.ARCHIVADO}) is not None
    
    def generar_numero_expediente(self, prefijo: str = "EXP") -> str:
        """Generate unique numero_expediente"""
        current_year = datetime.now().year
        
        # Get the last expediente number for current year
        last_expediente = self.db.query(Documento).filter(
            Documento.numero_expediente.like(f"{prefijo}-{current_year}-%")
        ).order_by(Documento.numero_expediente.desc()).first()
        
        if last_expediente:
            # Extract number from last expediente
            match = re.search(r'-(\d+)$', last_expediente.numero_expediente)
            if match:
                last_number = int(match.group(1))
                next_number = last_number + 1
            else:
                next_number = 1
        else:
            next_number = 1
        
        # Format with leading zeros (4 digits)
        return f"{prefijo}-{current_year}-{next_number:04d}"
    
    def get_documentos_by_area(self, area_id: str, estado: Optional[EstadoDocumentoEnum] = None) -> List[Documento]:
        """Get documentos by area with optional estado filter"""
        query = self.db.query(Documento).filter(Documento.area_actual_id == area_id)
        
        if estado:
            query = query.filter(Documento.estado == estado)
        
        return query.options(
            joinedload(Documento.tipo_documento),
            joinedload(Documento.archivos_adjuntos)
        ).all()
    
    def get_documentos_by_usuario(self, usuario_id: str, estado: Optional[EstadoDocumentoEnum] = None) -> List[Documento]:
        """Get documentos registered by user"""
        query = self.db.query(Documento).filter(Documento.usuario_registro_id == usuario_id)
        
        if estado:
            query = query.filter(Documento.estado == estado)
        
        return query.options(
            joinedload(Documento.tipo_documento)
        ).all()
    
    def get_documentos_vencidos(self) -> List[Documento]:
        """Get documentos that have passed their fecha_limite"""
        return self.db.query(Documento).filter(
            and_(
                Documento.fecha_limite.isnot(None),
                Documento.fecha_limite < datetime.now(),
                Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
            )
        ).options(
            joinedload(Documento.tipo_documento)
        ).all()
    
    def get_documentos_urgentes_pendientes(self) -> List[Documento]:
        """Get urgent documentos that are still pending"""
        return self.db.query(Documento).filter(
            and_(
                Documento.prioridad == PrioridadEnum.URGENTE,
                Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
            )
        ).options(
            joinedload(Documento.tipo_documento)
        ).all()
    
    def get_estadisticas(self, fecha_desde: Optional[datetime] = None, fecha_hasta: Optional[datetime] = None) -> Dict[str, Any]:
        """Get documento statistics"""
        query = self.db.query(Documento)
        
        # Apply date filters if provided
        if fecha_desde:
            query = query.filter(Documento.fecha_recepcion >= fecha_desde)
        if fecha_hasta:
            query = query.filter(Documento.fecha_recepcion <= fecha_hasta)
        
        # Basic counts
        total_documentos = query.count()
        
        # Count by estado
        estados_count = self.db.query(
            Documento.estado,
            func.count(Documento.id)
        ).group_by(Documento.estado)
        
        if fecha_desde:
            estados_count = estados_count.filter(Documento.fecha_recepcion >= fecha_desde)
        if fecha_hasta:
            estados_count = estados_count.filter(Documento.fecha_recepcion <= fecha_hasta)
        
        estados_dict = {estado.value: count for estado, count in estados_count.all()}
        
        # Count by tipo
        tipos_count = self.db.query(
            TipoDocumento.nombre,
            func.count(Documento.id)
        ).join(Documento.tipo_documento).group_by(TipoDocumento.nombre)
        
        if fecha_desde:
            tipos_count = tipos_count.filter(Documento.fecha_recepcion >= fecha_desde)
        if fecha_hasta:
            tipos_count = tipos_count.filter(Documento.fecha_recepcion <= fecha_hasta)
        
        tipos_dict = {tipo: count for tipo, count in tipos_count.all()}
        
        # Count vencidos
        vencidos_count = query.filter(
            and_(
                Documento.fecha_limite.isnot(None),
                Documento.fecha_limite < datetime.now(),
                Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
            )
        ).count()
        
        # Count urgentes
        urgentes_count = query.filter(
            and_(
                Documento.prioridad == PrioridadEnum.URGENTE,
                Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
            )
        ).count()
        
        return {
            "total_documentos": total_documentos,
            "documentos_registrados": estados_dict.get("REGISTRADO", 0),
            "documentos_en_proceso": estados_dict.get("EN_PROCESO", 0),
            "documentos_atendidos": estados_dict.get("ATENDIDO", 0),
            "documentos_archivados": estados_dict.get("ARCHIVADO", 0),
            "documentos_vencidos": vencidos_count,
            "documentos_urgentes": urgentes_count,
            "documentos_por_tipo": tipos_dict,
            "documentos_por_estado": estados_dict
        }
    
    def search_full_text(self, search_term: str, limit: int = 50) -> List[Documento]:
        """Full text search in remitente and asunto"""
        search_pattern = f"%{search_term}%"
        return self.db.query(Documento).filter(
            or_(
                Documento.remitente.ilike(search_pattern),
                Documento.asunto.ilike(search_pattern),
                Documento.numero_expediente.ilike(search_pattern)
            )
        ).options(
            joinedload(Documento.tipo_documento)
        ).limit(limit).all()
    
    def _apply_filters(self, query, filtros: FiltrosDocumento):
        """Apply filters to documento query"""
        if filtros.numero_expediente:
            query = query.filter(Documento.numero_expediente.ilike(f"%{filtros.numero_expediente}%"))
        
        if filtros.remitente:
            query = query.filter(Documento.remitente.ilike(f"%{filtros.remitente}%"))
        
        if filtros.asunto:
            query = query.filter(Documento.asunto.ilike(f"%{filtros.asunto}%"))
        
        if filtros.tipo_documento_id:
            query = query.filter(Documento.tipo_documento_id == filtros.tipo_documento_id)
        
        if filtros.estado:
            query = query.filter(Documento.estado == filtros.estado)
        
        if filtros.prioridad:
            query = query.filter(Documento.prioridad == filtros.prioridad)
        
        if filtros.area_actual_id:
            query = query.filter(Documento.area_actual_id == filtros.area_actual_id)
        
        if filtros.usuario_registro_id:
            query = query.filter(Documento.usuario_registro_id == filtros.usuario_registro_id)
        
        if filtros.fecha_recepcion_desde:
            query = query.filter(Documento.fecha_recepcion >= filtros.fecha_recepcion_desde)
        
        if filtros.fecha_recepcion_hasta:
            query = query.filter(Documento.fecha_recepcion <= filtros.fecha_recepcion_hasta)
        
        if filtros.fecha_limite_desde:
            query = query.filter(Documento.fecha_limite >= filtros.fecha_limite_desde)
        
        if filtros.fecha_limite_hasta:
            query = query.filter(Documento.fecha_limite <= filtros.fecha_limite_hasta)
        
        if filtros.tiene_anexos is not None:
            query = query.filter(Documento.tiene_anexos == filtros.tiene_anexos)
        
        if filtros.etiquetas:
            # Filter by any of the provided tags
            for etiqueta in filtros.etiquetas:
                query = query.filter(Documento.etiquetas.any(etiqueta))
        
        if filtros.origen_externo:
            query = query.filter(Documento.origen_externo == filtros.origen_externo)
        
        if filtros.solo_vencidos:
            query = query.filter(
                and_(
                    Documento.fecha_limite.isnot(None),
                    Documento.fecha_limite < datetime.now(),
                    Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
                )
            )
        
        if filtros.solo_urgentes:
            query = query.filter(
                and_(
                    Documento.prioridad == PrioridadEnum.URGENTE,
                    Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
                )
            )
        
        return query
    
    def _apply_sorting(self, query, sort_by: str = "fecha_recepcion", sort_order: str = "desc"):
        """Apply sorting to documento query"""
        # Map sort fields to actual model attributes
        sort_mapping = {
            "fecha_recepcion": Documento.fecha_recepcion,
            "fecha_limite": Documento.fecha_limite,
            "numero_expediente": Documento.numero_expediente,
            "remitente": Documento.remitente,
            "asunto": Documento.asunto,
            "estado": Documento.estado,
            "prioridad": Documento.prioridad,
            "created_at": Documento.created_at,
            "updated_at": Documento.updated_at
        }
        
        sort_column = sort_mapping.get(sort_by, Documento.fecha_recepcion)
        
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        return query
    
    def _generar_codigo_qr(self, numero_expediente: str) -> str:
        """Generate QR code for documento"""
        # Simple QR code generation - in production, use proper QR library
        return f"QR-{numero_expediente}-{uuid.uuid4().hex[:8].upper()}"