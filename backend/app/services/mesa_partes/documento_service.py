"""
Service layer for Documento operations
Handles business logic for document management in Mesa de Partes
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import qrcode
import io
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
import hashlib
import os
from pathlib import Path

from app.models.mesa_partes.documento import Documento, ArchivoAdjunto, EstadoDocumentoEnum, PrioridadEnum
from app.schemas.mesa_partes.documento import (
    DocumentoCreate, DocumentoUpdate, DocumentoResponse, DocumentoResumen,
    FiltrosDocumento, DocumentoEstadisticas, DocumentoComprobante, DocumentoArchivar,
    ArchivoAdjuntoCreate, ArchivoAdjuntoResponse
)
from app.repositories.mesa_partes.documento_repository import DocumentoRepository
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


class DocumentoService:
    """Service for documento business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DocumentoRepository(db)
        self.storage_path = os.getenv("STORAGE_PATH", "storage/documentos")
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000")
    
    async def crear_documento(self, documento_data: DocumentoCreate, usuario_id: str) -> DocumentoResponse:
        """
        Create a new documento
        Requirements: 1.1, 1.2, 1.4, 1.5, 1.6
        """
        try:
            # Validate tipo_documento exists
            await self._validate_tipo_documento(documento_data.tipo_documento_id)
            
            # Validate expediente_relacionado if provided
            if documento_data.expediente_relacionado_id:
                await self._validate_expediente_relacionado(documento_data.expediente_relacionado_id)
            
            # Prepare documento data
            documento_dict = documento_data.dict(exclude_unset=True)
            documento_dict["usuario_registro_id"] = usuario_id
            documento_dict["fecha_recepcion"] = datetime.utcnow()
            
            # Create documento
            documento = self.repository.create(documento_dict)
            
            # Generate QR code
            await self._generar_qr_code(documento)
            
            # Commit transaction
            self.db.commit()
            self.db.refresh(documento)
            
            return DocumentoResponse.from_orm(documento)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error creating documento: {str(e)}")
    
    async def obtener_documento(self, documento_id: str, include_relations: bool = True) -> DocumentoResponse:
        """
        Get documento by ID
        Requirements: 1.1, 5.4, 5.5
        """
        documento = self.repository.get_by_id(documento_id, include_relations)
        if not documento:
            raise NotFoundError(f"Documento with ID {documento_id} not found")
        
        return DocumentoResponse.from_orm(documento)
    
    async def obtener_documento_por_expediente(self, numero_expediente: str) -> DocumentoResponse:
        """
        Get documento by numero_expediente
        Requirements: 5.1, 5.7
        """
        documento = self.repository.get_by_numero_expediente(numero_expediente)
        if not documento:
            raise NotFoundError(f"Documento with expediente {numero_expediente} not found")
        
        return DocumentoResponse.from_orm(documento)
    
    async def obtener_documento_por_qr(self, codigo_qr: str) -> DocumentoResponse:
        """
        Get documento by QR code (public access)
        Requirements: 1.6, 5.7
        """
        documento = self.repository.get_by_codigo_qr(codigo_qr)
        if not documento:
            raise NotFoundError(f"Documento with QR code {codigo_qr} not found")
        
        return DocumentoResponse.from_orm(documento)
    
    async def listar_documentos(self, filtros: FiltrosDocumento, usuario_id: Optional[str] = None) -> Tuple[List[DocumentoResumen], int]:
        """
        List documentos with filters and pagination
        Requirements: 5.1, 5.2, 5.3
        """
        # If user is not admin, filter by their area or documents they registered
        if usuario_id and not await self._is_admin_user(usuario_id):
            user_area = await self._get_user_area(usuario_id)
            if not filtros.area_actual_id and not filtros.usuario_registro_id:
                # Show documents in user's area or registered by user
                filtros.area_actual_id = user_area
        
        documentos, total = self.repository.list(filtros, include_relations=True)
        
        documentos_resumen = [DocumentoResumen.from_orm(doc) for doc in documentos]
        return documentos_resumen, total
    
    async def actualizar_documento(self, documento_id: str, documento_data: DocumentoUpdate, usuario_id: str) -> DocumentoResponse:
        """
        Update documento
        Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
        """
        try:
            # Check if documento exists
            documento = self.repository.get_by_id(documento_id)
            if not documento:
                raise NotFoundError(f"Documento with ID {documento_id} not found")
            
            # Validate permissions
            await self._validate_update_permissions(documento, usuario_id)
            
            # Validate tipo_documento if being updated
            if documento_data.tipo_documento_id:
                await self._validate_tipo_documento(documento_data.tipo_documento_id)
            
            # Validate expediente_relacionado if being updated
            if documento_data.expediente_relacionado_id:
                await self._validate_expediente_relacionado(documento_data.expediente_relacionado_id)
            
            # Update documento
            update_dict = documento_data.dict(exclude_unset=True, exclude_none=True)
            documento_updated = self.repository.update(documento_id, update_dict)
            
            self.db.commit()
            self.db.refresh(documento_updated)
            
            return DocumentoResponse.from_orm(documento_updated)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error updating documento: {str(e)}")
    
    async def archivar_documento(self, documento_id: str, archivo_data: DocumentoArchivar, usuario_id: str) -> DocumentoResponse:
        """
        Archive documento
        Requirements: 9.1, 9.2, 9.3
        """
        try:
            # Check if documento exists
            documento = self.repository.get_by_id(documento_id)
            if not documento:
                raise NotFoundError(f"Documento with ID {documento_id} not found")
            
            # Validate permissions
            await self._validate_archive_permissions(documento, usuario_id)
            
            # Validate documento can be archived
            if documento.estado == EstadoDocumentoEnum.ARCHIVADO:
                raise ValidationError("Documento is already archived")
            
            # Update documento to archived state
            update_data = {
                "estado": EstadoDocumentoEnum.ARCHIVADO,
                "observaciones": f"ARCHIVADO - {archivo_data.clasificacion_archivo}. {archivo_data.observaciones_archivo or ''}"
            }
            
            documento_updated = self.repository.update(documento_id, update_data)
            
            # TODO: Create archivo record in separate table for better tracking
            
            self.db.commit()
            self.db.refresh(documento_updated)
            
            return DocumentoResponse.from_orm(documento_updated)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error archiving documento: {str(e)}")
    
    async def adjuntar_archivo(self, documento_id: str, archivo_data: ArchivoAdjuntoCreate, file_content: bytes, usuario_id: str) -> ArchivoAdjuntoResponse:
        """
        Attach file to documento
        Requirements: 1.3
        """
        try:
            # Check if documento exists
            documento = self.repository.get_by_id(documento_id)
            if not documento:
                raise NotFoundError(f"Documento with ID {documento_id} not found")
            
            # Validate permissions
            await self._validate_file_permissions(documento, usuario_id)
            
            # Validate file
            await self._validate_file(file_content, archivo_data.tipo_mime)
            
            # Generate file hash
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            # Generate unique filename
            file_extension = self._get_file_extension(archivo_data.tipo_mime)
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Save file to storage
            file_url = await self._save_file_to_storage(unique_filename, file_content)
            
            # Create archivo_adjunto record
            archivo_dict = archivo_data.dict()
            archivo_dict.update({
                "documento_id": documento_id,
                "nombre_archivo": unique_filename,
                "tamano": len(file_content),
                "url": file_url,
                "hash_archivo": file_hash
            })
            
            archivo_adjunto = ArchivoAdjunto(**archivo_dict)
            self.db.add(archivo_adjunto)
            
            # Update documento to indicate it has attachments
            if not documento.tiene_anexos:
                self.repository.update(documento_id, {"tiene_anexos": True})
            
            self.db.commit()
            self.db.refresh(archivo_adjunto)
            
            return ArchivoAdjuntoResponse.from_orm(archivo_adjunto)
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (NotFoundError, ValidationError, BusinessLogicError)):
                raise
            raise BusinessLogicError(f"Error attaching file: {str(e)}")
    
    async def generar_comprobante_pdf(self, documento_id: str) -> bytes:
        """
        Generate PDF receipt for documento
        Requirements: 1.6, 9.1
        """
        documento = self.repository.get_by_id(documento_id)
        if not documento:
            raise NotFoundError(f"Documento with ID {documento_id} not found")
        
        # Create PDF in memory
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "COMPROBANTE DE RECEPCIÓN")
        
        # Document info
        p.setFont("Helvetica", 12)
        y_position = height - 100
        
        p.drawString(50, y_position, f"Número de Expediente: {documento.numero_expediente}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Fecha de Recepción: {documento.fecha_recepcion.strftime('%d/%m/%Y %H:%M')}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Remitente: {documento.remitente}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Asunto: {documento.asunto[:80]}{'...' if len(documento.asunto) > 80 else ''}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Tipo: {documento.tipo_documento.nombre if documento.tipo_documento else 'N/A'}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Prioridad: {documento.prioridad.value}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Estado: {documento.estado.value}")
        y_position -= 40
        
        # QR Code section
        p.drawString(50, y_position, f"Código QR: {documento.codigo_qr}")
        y_position -= 20
        
        p.drawString(50, y_position, f"Consulta en línea: {self.base_url}/consulta/{documento.codigo_qr}")
        y_position -= 40
        
        # Footer
        p.setFont("Helvetica", 10)
        p.drawString(50, 50, f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer.getvalue()
    
    async def generar_qr(self, documento_id: str) -> str:
        """
        Generate QR code for documento
        Requirements: 1.6, 5.7
        """
        documento = self.repository.get_by_id(documento_id)
        if not documento:
            raise NotFoundError(f"Documento with ID {documento_id} not found")
        
        return await self._generar_qr_code(documento)
    
    async def obtener_estadisticas(self, fecha_desde: Optional[datetime] = None, fecha_hasta: Optional[datetime] = None) -> DocumentoEstadisticas:
        """
        Get documento statistics
        Requirements: 6.1, 6.2, 6.3
        """
        stats = self.repository.get_estadisticas(fecha_desde, fecha_hasta)
        
        # Calculate average attention time
        promedio_tiempo = await self._calcular_tiempo_promedio_atencion(fecha_desde, fecha_hasta)
        stats["promedio_tiempo_atencion_dias"] = promedio_tiempo
        
        return DocumentoEstadisticas(**stats)
    
    async def buscar_documentos(self, search_term: str, limit: int = 50) -> List[DocumentoResumen]:
        """
        Full text search in documentos
        Requirements: 5.1, 5.2, 5.3
        """
        documentos = self.repository.search_full_text(search_term, limit)
        return [DocumentoResumen.from_orm(doc) for doc in documentos]
    
    async def obtener_documentos_vencidos(self) -> List[DocumentoResumen]:
        """
        Get expired documentos
        Requirements: 6.6, 8.2
        """
        documentos = self.repository.get_documentos_vencidos()
        return [DocumentoResumen.from_orm(doc) for doc in documentos]
    
    async def obtener_documentos_urgentes_pendientes(self) -> List[DocumentoResumen]:
        """
        Get urgent pending documentos
        Requirements: 8.3
        """
        documentos = self.repository.get_documentos_urgentes_pendientes()
        return [DocumentoResumen.from_orm(doc) for doc in documentos]
    
    # Private helper methods
    
    async def _validate_tipo_documento(self, tipo_documento_id: str) -> None:
        """Validate that tipo_documento exists"""
        # TODO: Implement tipo_documento validation
        # For now, assume it exists
        pass
    
    async def _validate_expediente_relacionado(self, expediente_id: str) -> None:
        """Validate that expediente_relacionado exists"""
        expediente = self.repository.get_by_id(expediente_id)
        if not expediente:
            raise ValidationError(f"Expediente relacionado {expediente_id} not found")
    
    async def _validate_update_permissions(self, documento: Documento, usuario_id: str) -> None:
        """Validate user can update documento"""
        # TODO: Implement proper permission validation
        # For now, allow if user is the one who registered it or is admin
        if documento.usuario_registro_id != usuario_id and not await self._is_admin_user(usuario_id):
            raise ValidationError("No permission to update this documento")
    
    async def _validate_archive_permissions(self, documento: Documento, usuario_id: str) -> None:
        """Validate user can archive documento"""
        # TODO: Implement proper permission validation
        # For now, only allow if documento is ATENDIDO
        if documento.estado != EstadoDocumentoEnum.ATENDIDO:
            raise ValidationError("Only ATENDIDO documents can be archived")
    
    async def _validate_file_permissions(self, documento: Documento, usuario_id: str) -> None:
        """Validate user can attach files to documento"""
        # TODO: Implement proper permission validation
        pass
    
    async def _validate_file(self, file_content: bytes, tipo_mime: str) -> None:
        """Validate file content and type"""
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            raise ValidationError("File size exceeds maximum allowed (10MB)")
        
        # Check allowed MIME types
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if tipo_mime not in allowed_types:
            raise ValidationError(f"File type {tipo_mime} not allowed")
    
    async def _save_file_to_storage(self, filename: str, file_content: bytes) -> str:
        """Save file to storage and return URL"""
        # Create storage directory if it doesn't exist
        storage_dir = Path(self.storage_path)
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = storage_dir / filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Return URL
        return f"{self.base_url}/storage/documentos/{filename}"
    
    def _get_file_extension(self, tipo_mime: str) -> str:
        """Get file extension from MIME type"""
        mime_to_ext = {
            'application/pdf': '.pdf',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        }
        return mime_to_ext.get(tipo_mime, '.bin')
    
    async def _generar_qr_code(self, documento: Documento) -> str:
        """Generate QR code for documento"""
        if not documento.codigo_qr:
            # Generate QR code data
            qr_data = f"{self.base_url}/consulta/{documento.numero_expediente}"
            
            # Create QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            # Generate QR code string (for storage)
            qr_code = f"QR-{documento.numero_expediente}-{uuid.uuid4().hex[:8].upper()}"
            
            # Update documento with QR code
            self.repository.update(str(documento.id), {"codigo_qr": qr_code})
            
            return qr_code
        
        return documento.codigo_qr
    
    async def _is_admin_user(self, usuario_id: str) -> bool:
        """Check if user is admin"""
        # TODO: Implement proper user role checking
        return False
    
    async def _get_user_area(self, usuario_id: str) -> Optional[str]:
        """Get user's area ID"""
        # TODO: Implement proper user area lookup
        return None
    
    async def _calcular_tiempo_promedio_atencion(self, fecha_desde: Optional[datetime] = None, fecha_hasta: Optional[datetime] = None) -> Optional[float]:
        """Calculate average attention time in days"""
        # TODO: Implement calculation based on derivaciones and attention dates
        return None