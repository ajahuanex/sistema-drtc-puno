"""
Repository for Archivo operations
Requirements: 9.1, 9.2, 9.3, 9.6
"""
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from datetime import datetime, timedelta

from app.models.mesa_partes.archivo import Archivo, ClasificacionArchivoEnum, PoliticaRetencionEnum
from app.models.mesa_partes.documento import Documento
from app.schemas.mesa_partes.archivo import FiltrosArchivo
from .base_repository import BaseRepository


class ArchivoRepository(BaseRepository[Archivo]):
    """Repository for archivo operations"""
    
    def __init__(self, db: Session):
        super().__init__(Archivo, db)
    
    def get_by_documento_id(self, documento_id: str) -> Optional[Archivo]:
        """Get archivo by documento_id"""
        return self.db.query(Archivo).filter(
            Archivo.documento_id == documento_id
        ).first()
    
    def get_by_codigo_ubicacion(self, codigo_ubicacion: str) -> Optional[Archivo]:
        """Get archivo by codigo_ubicacion"""
        return self.db.query(Archivo).filter(
            Archivo.codigo_ubicacion == codigo_ubicacion
        ).first()
    
    def list(self, filtros: FiltrosArchivo, include_documento: bool = True) -> Tuple[List[Archivo], int]:
        """
        List archivos with filters and pagination
        Requirements: 9.3, 9.4, 9.5
        """
        query = self.db.query(Archivo)
        
        # Include documento relationship if requested
        if include_documento:
            query = query.options(joinedload(Archivo.documento))
        
        # Apply filters
        conditions = []
        
        if filtros.clasificacion:
            conditions.append(Archivo.clasificacion == filtros.clasificacion)
        
        if filtros.politica_retencion:
            conditions.append(Archivo.politica_retencion == filtros.politica_retencion)
        
        if filtros.codigo_ubicacion:
            conditions.append(Archivo.codigo_ubicacion.ilike(f"%{filtros.codigo_ubicacion}%"))
        
        if filtros.fecha_archivado_desde:
            conditions.append(Archivo.fecha_archivado >= filtros.fecha_archivado_desde)
        
        if filtros.fecha_archivado_hasta:
            conditions.append(Archivo.fecha_archivado <= filtros.fecha_archivado_hasta)
        
        if filtros.usuario_archivo_id:
            conditions.append(Archivo.usuario_archivo_id == filtros.usuario_archivo_id)
        
        if filtros.activo:
            conditions.append(Archivo.activo == filtros.activo)
        
        if filtros.proximos_a_expirar:
            # Documentos que expiran en los próximos 30 días
            fecha_limite = datetime.utcnow() + timedelta(days=30)
            conditions.append(
                and_(
                    Archivo.fecha_expiracion_retencion.isnot(None),
                    Archivo.fecha_expiracion_retencion <= fecha_limite,
                    Archivo.fecha_expiracion_retencion >= datetime.utcnow()
                )
            )
        
        # Filters on related documento
        if filtros.numero_expediente or filtros.remitente or filtros.asunto:
            query = query.join(Documento)
            
            if filtros.numero_expediente:
                conditions.append(Documento.numero_expediente.ilike(f"%{filtros.numero_expediente}%"))
            
            if filtros.remitente:
                conditions.append(Documento.remitente.ilike(f"%{filtros.remitente}%"))
            
            if filtros.asunto:
                conditions.append(Documento.asunto.ilike(f"%{filtros.asunto}%"))
        
        # Apply all conditions
        if conditions:
            query = query.filter(and_(*conditions))
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Archivo, filtros.sort_by, Archivo.fecha_archivado)
        if filtros.sort_order == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        # Apply pagination
        offset = (filtros.page - 1) * filtros.size
        query = query.offset(offset).limit(filtros.size)
        
        archivos = query.all()
        
        return archivos, total
    
    def get_estadisticas(self) -> dict:
        """
        Get archivo statistics
        Requirements: 9.3
        """
        # Total archivados
        total_archivados = self.db.query(func.count(Archivo.id)).filter(
            Archivo.activo == "ARCHIVADO"
        ).scalar()
        
        # Por clasificación
        por_clasificacion = {}
        clasificacion_stats = self.db.query(
            Archivo.clasificacion,
            func.count(Archivo.id)
        ).filter(
            Archivo.activo == "ARCHIVADO"
        ).group_by(Archivo.clasificacion).all()
        
        for clasificacion, count in clasificacion_stats:
            por_clasificacion[clasificacion.value] = count
        
        # Por política de retención
        por_politica = {}
        politica_stats = self.db.query(
            Archivo.politica_retencion,
            func.count(Archivo.id)
        ).filter(
            Archivo.activo == "ARCHIVADO"
        ).group_by(Archivo.politica_retencion).all()
        
        for politica, count in politica_stats:
            por_politica[politica.value] = count
        
        # Próximos a expirar (30 días)
        fecha_limite = datetime.utcnow() + timedelta(days=30)
        proximos_a_expirar = self.db.query(func.count(Archivo.id)).filter(
            and_(
                Archivo.activo == "ARCHIVADO",
                Archivo.fecha_expiracion_retencion.isnot(None),
                Archivo.fecha_expiracion_retencion <= fecha_limite,
                Archivo.fecha_expiracion_retencion >= datetime.utcnow()
            )
        ).scalar()
        
        return {
            "total_archivados": total_archivados or 0,
            "por_clasificacion": por_clasificacion,
            "por_politica_retencion": por_politica,
            "proximos_a_expirar": proximos_a_expirar or 0
        }
    
    def generar_codigo_ubicacion(self, clasificacion: ClasificacionArchivoEnum) -> str:
        """
        Generate unique codigo_ubicacion
        Format: EST-{CLASIFICACION_CODE}-{YEAR}-{SEQUENCE}
        Example: EST-TD-2025-0001
        Requirements: 9.7
        """
        # Map clasificacion to code
        clasificacion_codes = {
            ClasificacionArchivoEnum.TRAMITE_DOCUMENTARIO: "TD",
            ClasificacionArchivoEnum.ADMINISTRATIVO: "AD",
            ClasificacionArchivoEnum.LEGAL: "LG",
            ClasificacionArchivoEnum.CONTABLE: "CT",
            ClasificacionArchivoEnum.RECURSOS_HUMANOS: "RH",
            ClasificacionArchivoEnum.TECNICO: "TC",
            ClasificacionArchivoEnum.OTROS: "OT"
        }
        
        clasificacion_code = clasificacion_codes.get(clasificacion, "OT")
        year = datetime.utcnow().year
        
        # Get last sequence number for this year and clasificacion
        prefix = f"EST-{clasificacion_code}-{year}-"
        last_archivo = self.db.query(Archivo).filter(
            Archivo.codigo_ubicacion.like(f"{prefix}%")
        ).order_by(desc(Archivo.codigo_ubicacion)).first()
        
        if last_archivo:
            # Extract sequence number
            try:
                last_sequence = int(last_archivo.codigo_ubicacion.split('-')[-1])
                next_sequence = last_sequence + 1
            except (ValueError, IndexError):
                next_sequence = 1
        else:
            next_sequence = 1
        
        # Generate codigo with zero padding
        codigo_ubicacion = f"{prefix}{next_sequence:04d}"
        
        return codigo_ubicacion
    
    def get_archivos_proximos_a_expirar(self, dias: int = 30) -> List[Archivo]:
        """
        Get archivos that will expire in the next N days
        Requirements: 9.6
        """
        fecha_limite = datetime.utcnow() + timedelta(days=dias)
        
        return self.db.query(Archivo).options(
            joinedload(Archivo.documento)
        ).filter(
            and_(
                Archivo.activo == "ARCHIVADO",
                Archivo.fecha_expiracion_retencion.isnot(None),
                Archivo.fecha_expiracion_retencion <= fecha_limite,
                Archivo.fecha_expiracion_retencion >= datetime.utcnow()
            )
        ).order_by(asc(Archivo.fecha_expiracion_retencion)).all()
    
    def get_archivos_expirados(self) -> List[Archivo]:
        """
        Get archivos with expired retention policy
        Requirements: 9.6
        """
        return self.db.query(Archivo).options(
            joinedload(Archivo.documento)
        ).filter(
            and_(
                Archivo.activo == "ARCHIVADO",
                Archivo.fecha_expiracion_retencion.isnot(None),
                Archivo.fecha_expiracion_retencion < datetime.utcnow()
            )
        ).order_by(asc(Archivo.fecha_expiracion_retencion)).all()
