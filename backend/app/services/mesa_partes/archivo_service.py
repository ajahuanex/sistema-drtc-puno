"""
Service layer for Archivo operations
Handles business logic for document archiving in Mesa de Partes
Requirements: 9.1, 9.2, 9.3, 9.6
"""
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.mesa_partes.archivo import Archivo, ClasificacionArchivoEnum, PoliticaRetencionEnum
from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum
from app.schemas.mesa_partes.archivo import (
    ArchivoCreate, ArchivoUpdate, ArchivoResponse, ArchivoResumen,
    ArchivoRestaurar, FiltrosArchivo, ArchivoEstadisticas
)
from app.repositories.mesa_partes.archivo_repository import ArchivoRepository
from app.repositories.mesa_partes.documento_repository import DocumentoRepository
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


class ArchivoService:
    """Service for archivo business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ArchivoRepository(db)
        self.documento_repository = DocumentoRepository(db)
    
    async def archivar_documento(self, archivo_data: ArchivoCreate, usuario_id: str) -> ArchivoResponse:
        """
        Archive a documento
        Requirements: 9.1, 9.2, 9.3
        """
        try:
            # Validate documento exists
            documento = self.documento_repository.get_by_id(archivo_data.documento_id)
            if not documento:
                raise NotFoundError(f"Documento with ID {archivo_data.documento_id} not found")
            
            # Validate documento can be archived
            await self._validate_can_archive(documento)
            
            # Check if documento is already archived
            existing_archivo = self.repository.get_by_documento_id(archivo_data.documento_id)
            if existing_archivo and existing_archivo.activo == "ARCHIVADO":
                raise ValidationError("Documento is already archived")
            
            # Generate codigo_ubicacion
            codigo_ubicacion = self.repository.generar_codigo_ubicacion(archivo_data.clasificacion)
            
            # Calculate fecha_expiracion_retencion based on policy
            fecha_expiracion = self._calcular_fecha_expiracion(archivo_data.politica_retencion)
            
            # Prepare archivo data
            archivo_dict = archivo_data.dict(exclude_unset=True)
            archivo_dict.update({
                "codigo_ubicacion": codigo_ubicacion,
                "fecha_archivado": datetime.utcnow(),
                "fecha_expiracion_retencion": fecha_expiracion,
                "usuario_archivo_id": usuario_id,
                "activo": "ARCHIVADO"
            })
            
            # Create archivo record
            archivo = self.repository.create(archivo_dict)
            
            # Update documento estado to ARCHIVADO
            self.documento_repository.update(
                archivo_data.documento_id,
                {"estado": EstadoDocumentoEnum.ARCHIVADO}
            )
            
            # Commit transaction
            self.db.commit()
            self.db.refresh(archivo)
            
            return ArchivoResponse.from_orm(archivo)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error archiving documento: {str(e)}")
    
    async def obtener_archivo(self, archivo_id: str) -> ArchivoResponse:
        """
        Get archivo by ID
        Requirements: 9.3, 9.4
        """
        archivo = self.repository.get_by_id(archivo_id)
        if not archivo:
            raise NotFoundError(f"Archivo with ID {archivo_id} not found")
        
        return ArchivoResponse.from_orm(archivo)
    
    async def obtener_archivo_por_documento(self, documento_id: str) -> ArchivoResponse:
        """
        Get archivo by documento_id
        Requirements: 9.3, 9.4
        """
        archivo = self.repository.get_by_documento_id(documento_id)
        if not archivo:
            raise NotFoundError(f"Archivo for documento {documento_id} not found")
        
        return ArchivoResponse.from_orm(archivo)
    
    async def obtener_archivo_por_codigo(self, codigo_ubicacion: str) -> ArchivoResponse:
        """
        Get archivo by codigo_ubicacion
        Requirements: 9.7
        """
        archivo = self.repository.get_by_codigo_ubicacion(codigo_ubicacion)
        if not archivo:
            raise NotFoundError(f"Archivo with codigo {codigo_ubicacion} not found")
        
        return ArchivoResponse.from_orm(archivo)
    
    async def listar_archivos(self, filtros: FiltrosArchivo) -> Tuple[List[ArchivoResumen], int]:
        """
        List archivos with filters and pagination
        Requirements: 9.3, 9.4, 9.5
        """
        archivos, total = self.repository.list(filtros, include_documento=True)
        
        archivos_resumen = [ArchivoResumen.from_orm(archivo) for archivo in archivos]
        return archivos_resumen, total
    
    async def actualizar_archivo(self, archivo_id: str, archivo_data: ArchivoUpdate, usuario_id: str) -> ArchivoResponse:
        """
        Update archivo information
        Requirements: 9.3
        """
        try:
            # Check if archivo exists
            archivo = self.repository.get_by_id(archivo_id)
            if not archivo:
                raise NotFoundError(f"Archivo with ID {archivo_id} not found")
            
            # Validate permissions
            await self._validate_update_permissions(archivo, usuario_id)
            
            # Update archivo
            update_dict = archivo_data.dict(exclude_unset=True, exclude_none=True)
            
            # Recalculate fecha_expiracion if politica_retencion changed
            if "politica_retencion" in update_dict:
                update_dict["fecha_expiracion_retencion"] = self._calcular_fecha_expiracion(
                    update_dict["politica_retencion"],
                    archivo.fecha_archivado
                )
            
            archivo_updated = self.repository.update(archivo_id, update_dict)
            
            self.db.commit()
            self.db.refresh(archivo_updated)
            
            return ArchivoResponse.from_orm(archivo_updated)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error updating archivo: {str(e)}")
    
    async def restaurar_documento(self, archivo_id: str, restaurar_data: ArchivoRestaurar, usuario_id: str) -> ArchivoResponse:
        """
        Restore an archived documento
        Requirements: 9.5
        """
        try:
            # Check if archivo exists
            archivo = self.repository.get_by_id(archivo_id)
            if not archivo:
                raise NotFoundError(f"Archivo with ID {archivo_id} not found")
            
            # Validate archivo can be restored
            if archivo.activo != "ARCHIVADO":
                raise ValidationError("Only ARCHIVADO documents can be restored")
            
            # Validate permissions
            await self._validate_restore_permissions(archivo, usuario_id)
            
            # Update archivo status
            update_data = {
                "activo": "RESTAURADO",
                "fecha_restauracion": datetime.utcnow(),
                "usuario_restauracion_id": usuario_id,
                "motivo_restauracion": restaurar_data.motivo_restauracion
            }
            
            archivo_updated = self.repository.update(archivo_id, update_data)
            
            # Update documento estado back to EN_PROCESO
            self.documento_repository.update(
                str(archivo.documento_id),
                {"estado": EstadoDocumentoEnum.EN_PROCESO}
            )
            
            self.db.commit()
            self.db.refresh(archivo_updated)
            
            return ArchivoResponse.from_orm(archivo_updated)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error restoring documento: {str(e)}")
    
    async def obtener_estadisticas(self) -> ArchivoEstadisticas:
        """
        Get archivo statistics
        Requirements: 9.3
        """
        stats = self.repository.get_estadisticas()
        
        # Calculate storage space if needed
        # TODO: Implement storage calculation based on archivos_adjuntos
        stats["espacio_utilizado_mb"] = None
        
        return ArchivoEstadisticas(**stats)
    
    async def obtener_proximos_a_expirar(self, dias: int = 30) -> List[ArchivoResumen]:
        """
        Get archivos that will expire soon
        Requirements: 9.6
        """
        archivos = self.repository.get_archivos_proximos_a_expirar(dias)
        return [ArchivoResumen.from_orm(archivo) for archivo in archivos]
    
    async def obtener_expirados(self) -> List[ArchivoResumen]:
        """
        Get archivos with expired retention policy
        Requirements: 9.6
        """
        archivos = self.repository.get_archivos_expirados()
        return [ArchivoResumen.from_orm(archivo) for archivo in archivos]
    
    # Private helper methods
    
    async def _validate_can_archive(self, documento: Documento) -> None:
        """Validate that documento can be archived"""
        # Only ATENDIDO documents can be archived
        if documento.estado != EstadoDocumentoEnum.ATENDIDO:
            raise ValidationError("Only ATENDIDO documents can be archived")
        
        # Check if documento has pending derivaciones
        # TODO: Implement check for pending derivaciones
        pass
    
    async def _validate_update_permissions(self, archivo: Archivo, usuario_id: str) -> None:
        """Validate user can update archivo"""
        # TODO: Implement proper permission validation
        # For now, allow if user is the one who archived it or is admin
        if archivo.usuario_archivo_id != usuario_id and not await self._is_admin_user(usuario_id):
            raise ValidationError("No permission to update this archivo")
    
    async def _validate_restore_permissions(self, archivo: Archivo, usuario_id: str) -> None:
        """Validate user can restore archivo"""
        # TODO: Implement proper permission validation
        # For now, only allow admins or jefe de mesa de partes
        if not await self._is_admin_user(usuario_id):
            raise ValidationError("Only administrators can restore archived documents")
    
    def _calcular_fecha_expiracion(
        self,
        politica: PoliticaRetencionEnum,
        fecha_base: Optional[datetime] = None
    ) -> Optional[datetime]:
        """
        Calculate expiration date based on retention policy
        Requirements: 9.2, 9.6
        """
        if politica == PoliticaRetencionEnum.PERMANENTE:
            return None
        
        fecha_base = fecha_base or datetime.utcnow()
        
        dias_retencion = {
            PoliticaRetencionEnum.UN_ANO: 365,
            PoliticaRetencionEnum.TRES_ANOS: 365 * 3,
            PoliticaRetencionEnum.CINCO_ANOS: 365 * 5,
            PoliticaRetencionEnum.DIEZ_ANOS: 365 * 10
        }
        
        dias = dias_retencion.get(politica, 365)
        return fecha_base + timedelta(days=dias)
    
    async def _is_admin_user(self, usuario_id: str) -> bool:
        """Check if user is admin"""
        # TODO: Implement proper user role checking
        return False
