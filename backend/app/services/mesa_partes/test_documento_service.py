"""
Unit tests for DocumentoService
Tests business logic for document management
"""
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from app.services.mesa_partes.documento_service import DocumentoService
from app.schemas.mesa_partes.documento import DocumentoCreate, DocumentoUpdate, FiltrosDocumento
from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum, PrioridadEnum
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)


@pytest.fixture
def mock_repository():
    """Mock documento repository"""
    return Mock()


@pytest.fixture
def documento_service(mock_db, mock_repository):
    """Create DocumentoService instance with mocked dependencies"""
    service = DocumentoService(mock_db)
    service.repository = mock_repository
    return service


@pytest.fixture
def mock_documento():
    """Create mock documento"""
    return Documento(
        id=uuid.uuid4(),
        numero_expediente="EXP-2025-0001",
        tipo_documento_id=uuid.uuid4(),
        remitente="Juan Pérez",
        asunto="Solicitud de información",
        numero_folios=5,
        tiene_anexos=False,
        prioridad=PrioridadEnum.NORMAL,
        estado=EstadoDocumentoEnum.REGISTRADO,
        fecha_recepcion=datetime.utcnow(),
        usuario_registro_id=uuid.uuid4(),
        codigo_qr="QR-123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestDocumentoServiceCrear:
    """Tests for crear_documento method"""
    
    @pytest.mark.asyncio
    async def test_crear_documento_exitoso(self, documento_service, mock_repository, mock_db, mock_documento):
        """Test successful document creation"""
        # Arrange
        documento_data = DocumentoCreate(
            tipo_documento_id=str(uuid.uuid4()),
            remitente="Juan Pérez",
            asunto="Solicitud de información",
            numero_folios=5,
            tiene_anexos=False,
            prioridad=PrioridadEnum.NORMAL
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = mock_documento
        documento_service._validate_tipo_documento = AsyncMock()
        documento_service._generar_qr_code = AsyncMock()
        
        # Act
        resultado = await documento_service.crear_documento(documento_data, usuario_id)
        
        # Assert
        assert resultado is not None
        assert resultado.numero_expediente == "EXP-2025-0001"
        mock_repository.create.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_crear_documento_con_expediente_relacionado(
        self, documento_service, mock_repository, mock_db, mock_documento
    ):
        """Test document creation with related expediente"""
        # Arrange
        expediente_relacionado_id = str(uuid.uuid4())
        documento_data = DocumentoCreate(
            tipo_documento_id=str(uuid.uuid4()),
            remitente="Juan Pérez",
            asunto="Solicitud relacionada",
            numero_folios=3,
            tiene_anexos=False,
            prioridad=PrioridadEnum.NORMAL,
            expediente_relacionado_id=expediente_relacionado_id
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = mock_documento
        documento_service._validate_tipo_documento = AsyncMock()
        documento_service._validate_expediente_relacionado = AsyncMock()
        documento_service._generar_qr_code = AsyncMock()
        
        # Act
        resultado = await documento_service.crear_documento(documento_data, usuario_id)
        
        # Assert
        assert resultado is not None
        documento_service._validate_expediente_relacionado.assert_called_once_with(expediente_relacionado_id)
    
    @pytest.mark.asyncio
    async def test_crear_documento_urgente_envia_notificacion(
        self, documento_service, mock_repository, mock_db
    ):
        """Test that urgent documents trigger notifications"""
        # Arrange
        documento_urgente = Documento(
            id=uuid.uuid4(),
            numero_expediente="EXP-2025-0002",
            tipo_documento_id=uuid.uuid4(),
            remitente="María López",
            asunto="Documento urgente",
            numero_folios=2,
            tiene_anexos=False,
            prioridad=PrioridadEnum.URGENTE,
            estado=EstadoDocumentoEnum.REGISTRADO,
            fecha_recepcion=datetime.utcnow(),
            usuario_registro_id=uuid.uuid4(),
            area_actual_id=uuid.uuid4(),
            codigo_qr="QR-456",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        documento_data = DocumentoCreate(
            tipo_documento_id=str(uuid.uuid4()),
            remitente="María López",
            asunto="Documento urgente",
            numero_folios=2,
            tiene_anexos=False,
            prioridad=PrioridadEnum.URGENTE
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = documento_urgente
        documento_service._validate_tipo_documento = AsyncMock()
        documento_service._generar_qr_code = AsyncMock()
        
        with patch('app.services.mesa_partes.documento_service.websocket_service') as mock_ws:
            mock_ws.notify_documento_urgente = AsyncMock()
            
            # Act
            resultado = await documento_service.crear_documento(documento_data, usuario_id)
            
            # Assert
            assert resultado.prioridad == PrioridadEnum.URGENTE
            mock_ws.notify_documento_urgente.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_crear_documento_tipo_invalido(self, documento_service):
        """Test document creation with invalid tipo_documento"""
        # Arrange
        documento_data = DocumentoCreate(
            tipo_documento_id=str(uuid.uuid4()),
            remitente="Juan Pérez",
            asunto="Test",
            numero_folios=1,
            tiene_anexos=False,
            prioridad=PrioridadEnum.NORMAL
        )
        usuario_id = str(uuid.uuid4())
        
        documento_service._validate_tipo_documento = AsyncMock(
            side_effect=NotFoundError("Tipo documento not found")
        )
        
        # Act & Assert
        with pytest.raises(NotFoundError):
            await documento_service.crear_documento(documento_data, usuario_id)
    
    @pytest.mark.asyncio
    async def test_crear_documento_error_rollback(
        self, documento_service, mock_repository, mock_db
    ):
        """Test that errors trigger database rollback"""
        # Arrange
        documento_data = DocumentoCreate(
            tipo_documento_id=str(uuid.uuid4()),
            remitente="Juan Pérez",
            asunto="Test",
            numero_folios=1,
            tiene_anexos=False,
            prioridad=PrioridadEnum.NORMAL
        )
        usuario_id = str(uuid.uuid4())
        
        documento_service._validate_tipo_documento = AsyncMock()
        mock_repository.create.side_effect = Exception("Database error")
        
        # Act & Assert
        with pytest.raises(BusinessLogicError):
            await documento_service.crear_documento(documento_data, usuario_id)
        
        mock_db.rollback.assert_called_once()


class TestDocumentoServiceObtener:
    """Tests for obtener_documento method"""
    
    @pytest.mark.asyncio
    async def test_obtener_documento_exitoso(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test successful document retrieval"""
        # Arrange
        documento_id = str(mock_documento.id)
        mock_repository.get_by_id.return_value = mock_documento
        
        # Act
        resultado = await documento_service.obtener_documento(documento_id)
        
        # Assert
        assert resultado is not None
        assert resultado.numero_expediente == "EXP-2025-0001"
        mock_repository.get_by_id.assert_called_once_with(documento_id, True)
    
    @pytest.mark.asyncio
    async def test_obtener_documento_no_encontrado(
        self, documento_service, mock_repository
    ):
        """Test document not found error"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_repository.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError):
            await documento_service.obtener_documento(documento_id)
    
    @pytest.mark.asyncio
    async def test_obtener_documento_sin_relaciones(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test document retrieval without relations"""
        # Arrange
        documento_id = str(mock_documento.id)
        mock_repository.get_by_id.return_value = mock_documento
        
        # Act
        resultado = await documento_service.obtener_documento(documento_id, include_relations=False)
        
        # Assert
        assert resultado is not None
        mock_repository.get_by_id.assert_called_once_with(documento_id, False)


class TestDocumentoServiceListar:
    """Tests for listar_documentos method"""
    
    @pytest.mark.asyncio
    async def test_listar_documentos_sin_filtros(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test listing documents without filters"""
        # Arrange
        mock_repository.list.return_value = ([mock_documento], 1)
        filtros = FiltrosDocumento()
        
        # Act
        resultado = await documento_service.listar_documentos(filtros)
        
        # Assert
        assert resultado["total"] == 1
        assert len(resultado["documentos"]) == 1
        assert resultado["documentos"][0].numero_expediente == "EXP-2025-0001"
    
    @pytest.mark.asyncio
    async def test_listar_documentos_con_filtros(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test listing documents with filters"""
        # Arrange
        mock_repository.list.return_value = ([mock_documento], 1)
        filtros = FiltrosDocumento(
            estado=EstadoDocumentoEnum.REGISTRADO,
            prioridad=PrioridadEnum.NORMAL,
            remitente="Juan"
        )
        
        # Act
        resultado = await documento_service.listar_documentos(filtros)
        
        # Assert
        assert resultado["total"] == 1
        mock_repository.list.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_listar_documentos_paginacion(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test document listing with pagination"""
        # Arrange
        mock_repository.list.return_value = ([mock_documento], 50)
        filtros = FiltrosDocumento(page=2, page_size=25)
        
        # Act
        resultado = await documento_service.listar_documentos(filtros)
        
        # Assert
        assert resultado["page"] == 2
        assert resultado["page_size"] == 25
        assert resultado["total"] == 50


class TestDocumentoServiceActualizar:
    """Tests for actualizar_documento method"""
    
    @pytest.mark.asyncio
    async def test_actualizar_documento_exitoso(
        self, documento_service, mock_repository, mock_db, mock_documento
    ):
        """Test successful document update"""
        # Arrange
        documento_id = str(mock_documento.id)
        update_data = DocumentoUpdate(
            asunto="Asunto actualizado",
            prioridad=PrioridadEnum.ALTA
        )
        
        mock_repository.get_by_id.return_value = mock_documento
        mock_repository.update.return_value = mock_documento
        
        # Act
        resultado = await documento_service.actualizar_documento(documento_id, update_data)
        
        # Assert
        assert resultado is not None
        mock_repository.update.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_actualizar_documento_no_encontrado(
        self, documento_service, mock_repository
    ):
        """Test update of non-existent document"""
        # Arrange
        documento_id = str(uuid.uuid4())
        update_data = DocumentoUpdate(asunto="Test")
        
        mock_repository.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError):
            await documento_service.actualizar_documento(documento_id, update_data)


class TestDocumentoServiceArchivar:
    """Tests for archivar_documento method"""
    
    @pytest.mark.asyncio
    async def test_archivar_documento_exitoso(
        self, documento_service, mock_repository, mock_db, mock_documento
    ):
        """Test successful document archiving"""
        # Arrange
        documento_id = str(mock_documento.id)
        clasificacion = "ADMINISTRATIVO"
        
        mock_repository.get_by_id.return_value = mock_documento
        mock_repository.update.return_value = mock_documento
        
        # Act
        resultado = await documento_service.archivar_documento(documento_id, clasificacion)
        
        # Assert
        assert resultado is not None
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_archivar_documento_ya_archivado(
        self, documento_service, mock_repository
    ):
        """Test archiving already archived document"""
        # Arrange
        documento_archivado = Documento(
            id=uuid.uuid4(),
            numero_expediente="EXP-2025-0003",
            tipo_documento_id=uuid.uuid4(),
            remitente="Test",
            asunto="Test",
            numero_folios=1,
            tiene_anexos=False,
            prioridad=PrioridadEnum.NORMAL,
            estado=EstadoDocumentoEnum.ARCHIVADO,
            fecha_recepcion=datetime.utcnow(),
            usuario_registro_id=uuid.uuid4(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        documento_id = str(documento_archivado.id)
        clasificacion = "ADMINISTRATIVO"
        
        mock_repository.get_by_id.return_value = documento_archivado
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await documento_service.archivar_documento(documento_id, clasificacion)


class TestDocumentoServiceAdjuntarArchivo:
    """Tests for adjuntar_archivo method"""
    
    @pytest.mark.asyncio
    async def test_adjuntar_archivo_exitoso(
        self, documento_service, mock_repository, mock_db, mock_documento
    ):
        """Test successful file attachment"""
        # Arrange
        documento_id = str(mock_documento.id)
        mock_file = Mock()
        mock_file.filename = "documento.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.file = Mock()
        mock_file.file.read = Mock(return_value=b"PDF content")
        
        mock_repository.get_by_id.return_value = mock_documento
        documento_service._save_file = AsyncMock(return_value="/path/to/file.pdf")
        
        # Act
        resultado = await documento_service.adjuntar_archivo(documento_id, mock_file)
        
        # Assert
        assert resultado is not None
        assert resultado.nombre_archivo == "documento.pdf"
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_adjuntar_archivo_tipo_invalido(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test file attachment with invalid type"""
        # Arrange
        documento_id = str(mock_documento.id)
        mock_file = Mock()
        mock_file.filename = "malware.exe"
        mock_file.content_type = "application/x-msdownload"
        
        mock_repository.get_by_id.return_value = mock_documento
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await documento_service.adjuntar_archivo(documento_id, mock_file)


class TestDocumentoServiceGenerarComprobante:
    """Tests for generar_comprobante method"""
    
    @pytest.mark.asyncio
    async def test_generar_comprobante_exitoso(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test successful receipt generation"""
        # Arrange
        documento_id = str(mock_documento.id)
        mock_repository.get_by_id.return_value = mock_documento
        documento_service._generar_pdf_comprobante = AsyncMock(return_value=b"PDF content")
        
        # Act
        resultado = await documento_service.generar_comprobante(documento_id)
        
        # Assert
        assert resultado is not None
        assert isinstance(resultado, bytes)
    
    @pytest.mark.asyncio
    async def test_generar_comprobante_documento_no_encontrado(
        self, documento_service, mock_repository
    ):
        """Test receipt generation for non-existent document"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_repository.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError):
            await documento_service.generar_comprobante(documento_id)


class TestDocumentoServiceExportar:
    """Tests for export methods"""
    
    @pytest.mark.asyncio
    async def test_exportar_excel(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test Excel export"""
        # Arrange
        mock_repository.list.return_value = ([mock_documento], 1)
        filtros = FiltrosDocumento()
        documento_service._generar_excel = AsyncMock(return_value=b"Excel content")
        
        # Act
        resultado = await documento_service.exportar_excel(filtros)
        
        # Assert
        assert resultado is not None
        assert isinstance(resultado, bytes)
    
    @pytest.mark.asyncio
    async def test_exportar_pdf(
        self, documento_service, mock_repository, mock_documento
    ):
        """Test PDF export"""
        # Arrange
        mock_repository.list.return_value = ([mock_documento], 1)
        filtros = FiltrosDocumento()
        documento_service._generar_pdf_listado = AsyncMock(return_value=b"PDF content")
        
        # Act
        resultado = await documento_service.exportar_pdf(filtros)
        
        # Assert
        assert resultado is not None
        assert isinstance(resultado, bytes)
