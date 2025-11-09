"""
Unit tests for DerivacionService
Tests business logic for document derivation
"""
import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from app.services.mesa_partes.derivacion_service import DerivacionService
from app.schemas.mesa_partes.derivacion import DerivacionCreate, DerivacionUpdate
from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


@pytest.fixture
def mock_db():
    return Mock(spec=Session)


@pytest.fixture
def mock_repository():
    return Mock()


@pytest.fixture
def derivacion_service(mock_db, mock_repository):
    service = DerivacionService(mock_db)
    service.repository = mock_repository
    return service


@pytest.fixture
def mock_derivacion():
    return Derivacion(
        id=uuid.uuid4(),
        documento_id=uuid.uuid4(),
        area_origen_id=uuid.uuid4(),
        area_destino_id=uuid.uuid4(),
        usuario_deriva_id=uuid.uuid4(),
        instrucciones="Revisar y responder",
        fecha_derivacion=datetime.utcnow(),
        estado=EstadoDerivacionEnum.PENDIENTE,
        es_urgente=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestDerivacionServiceDerivar:
    """Tests for derivar_documento method"""
    
    @pytest.mark.asyncio
    async def test_derivar_documento_exitoso(
        self, derivacion_service, mock_repository, mock_db, mock_derivacion
    ):
        """Test successful document derivation"""
        # Arrange
        derivacion_data = DerivacionCreate(
            documento_id=str(uuid.uuid4()),
            area_destino_id=str(uuid.uuid4()),
            instrucciones="Revisar y responder",
            es_urgente=False
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = mock_derivacion
        derivacion_service._validate_documento = AsyncMock()
        derivacion_service._validate_area = AsyncMock()
        derivacion_service._enviar_notificacion = AsyncMock()
        
        # Act
        resultado = await derivacion_service.derivar_documento(derivacion_data, usuario_id)
        
        # Assert
        assert resultado is not None
        assert resultado.estado == EstadoDerivacionEnum.PENDIENTE
        mock_repository.create.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_derivar_documento_urgente(
        self, derivacion_service, mock_repository, mock_db
    ):
        """Test urgent document derivation"""
        # Arrange
        derivacion_urgente = Derivacion(
            id=uuid.uuid4(),
            documento_id=uuid.uuid4(),
            area_destino_id=uuid.uuid4(),
            usuario_deriva_id=uuid.uuid4(),
            instrucciones="Atender urgentemente",
            fecha_derivacion=datetime.utcnow(),
            estado=EstadoDerivacionEnum.PENDIENTE,
            es_urgente=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        derivacion_data = DerivacionCreate(
            documento_id=str(uuid.uuid4()),
            area_destino_id=str(uuid.uuid4()),
            instrucciones="Atender urgentemente",
            es_urgente=True
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = derivacion_urgente
        derivacion_service._validate_documento = AsyncMock()
        derivacion_service._validate_area = AsyncMock()
        derivacion_service._enviar_notificacion = AsyncMock()
        
        # Act
        resultado = await derivacion_service.derivar_documento(derivacion_data, usuario_id)
        
        # Assert
        assert resultado.es_urgente is True
        derivacion_service._enviar_notificacion.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_derivar_documento_con_fecha_limite(
        self, derivacion_service, mock_repository, mock_db, mock_derivacion
    ):
        """Test derivation with deadline"""
        # Arrange
        fecha_limite = datetime.utcnow() + timedelta(days=7)
        derivacion_data = DerivacionCreate(
            documento_id=str(uuid.uuid4()),
            area_destino_id=str(uuid.uuid4()),
            instrucciones="Revisar",
            es_urgente=False,
            fecha_limite=fecha_limite
        )
        usuario_id = str(uuid.uuid4())
        
        mock_repository.create.return_value = mock_derivacion
        derivacion_service._validate_documento = AsyncMock()
        derivacion_service._validate_area = AsyncMock()
        derivacion_service._enviar_notificacion = AsyncMock()
        
        # Act
        resultado = await derivacion_service.derivar_documento(derivacion_data, usuario_id)
        
        # Assert
        assert resultado is not None
        mock_repository.create.assert_called_once()


class TestDerivacionServiceRecibir:
    """Tests for recibir_documento method"""
    
    @pytest.mark.asyncio
    async def test_recibir_documento_exitoso(
        self, derivacion_service, mock_repository, mock_db, mock_derivacion
    ):
        """Test successful document reception"""
        # Arrange
        derivacion_id = str(mock_derivacion.id)
        usuario_id = str(uuid.uuid4())
        
        mock_repository.get_by_id.return_value = mock_derivacion
        mock_repository.update.return_value = mock_derivacion
        
        # Act
        resultado = await derivacion_service.recibir_documento(derivacion_id, usuario_id)
        
        # Assert
        assert resultado is not None
        mock_repository.update.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_recibir_documento_ya_recibido(
        self, derivacion_service, mock_repository
    ):
        """Test receiving already received document"""
        # Arrange
        derivacion_recibida = Derivacion(
            id=uuid.uuid4(),
            documento_id=uuid.uuid4(),
            area_destino_id=uuid.uuid4(),
            usuario_deriva_id=uuid.uuid4(),
            instrucciones="Test",
            fecha_derivacion=datetime.utcnow(),
            fecha_recepcion=datetime.utcnow(),
            estado=EstadoDerivacionEnum.RECIBIDO,
            es_urgente=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        derivacion_id = str(derivacion_recibida.id)
        usuario_id = str(uuid.uuid4())
        
        mock_repository.get_by_id.return_value = derivacion_recibida
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await derivacion_service.recibir_documento(derivacion_id, usuario_id)


class TestDerivacionServiceHistorial:
    """Tests for obtener_historial method"""
    
    @pytest.mark.asyncio
    async def test_obtener_historial_exitoso(
        self, derivacion_service, mock_repository, mock_derivacion
    ):
        """Test successful history retrieval"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_repository.get_by_documento.return_value = [mock_derivacion]
        
        # Act
        resultado = await derivacion_service.obtener_historial(documento_id)
        
        # Assert
        assert resultado is not None
        assert len(resultado["derivaciones"]) == 1
        mock_repository.get_by_documento.assert_called_once_with(documento_id)
    
    @pytest.mark.asyncio
    async def test_obtener_historial_vacio(
        self, derivacion_service, mock_repository
    ):
        """Test history retrieval with no derivations"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_repository.get_by_documento.return_value = []
        
        # Act
        resultado = await derivacion_service.obtener_historial(documento_id)
        
        # Assert
        assert resultado["total_derivaciones"] == 0
        assert len(resultado["derivaciones"]) == 0


class TestDerivacionServiceRegistrarAtencion:
    """Tests for registrar_atencion method"""
    
    @pytest.mark.asyncio
    async def test_registrar_atencion_exitoso(
        self, derivacion_service, mock_repository, mock_db, mock_derivacion
    ):
        """Test successful attention registration"""
        # Arrange
        derivacion_id = str(mock_derivacion.id)
        observaciones = "Atendido correctamente"
        
        mock_repository.get_by_id.return_value = mock_derivacion
        mock_repository.update.return_value = mock_derivacion
        
        # Act
        resultado = await derivacion_service.registrar_atencion(
            derivacion_id, observaciones
        )
        
        # Assert
        assert resultado is not None
        mock_repository.update.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_registrar_atencion_no_recibido(
        self, derivacion_service, mock_repository
    ):
        """Test attention registration on non-received document"""
        # Arrange
        derivacion_pendiente = Derivacion(
            id=uuid.uuid4(),
            documento_id=uuid.uuid4(),
            area_destino_id=uuid.uuid4(),
            usuario_deriva_id=uuid.uuid4(),
            instrucciones="Test",
            fecha_derivacion=datetime.utcnow(),
            estado=EstadoDerivacionEnum.PENDIENTE,
            es_urgente=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        derivacion_id = str(derivacion_pendiente.id)
        observaciones = "Test"
        
        mock_repository.get_by_id.return_value = derivacion_pendiente
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await derivacion_service.registrar_atencion(derivacion_id, observaciones)


class TestDerivacionServiceObtenerPorArea:
    """Tests for obtener_documentos_area method"""
    
    @pytest.mark.asyncio
    async def test_obtener_documentos_area_exitoso(
        self, derivacion_service, mock_repository, mock_derivacion
    ):
        """Test successful area documents retrieval"""
        # Arrange
        area_id = str(uuid.uuid4())
        mock_repository.get_by_area.return_value = ([mock_derivacion], 1)
        
        # Act
        resultado = await derivacion_service.obtener_documentos_area(area_id)
        
        # Assert
        assert resultado["total"] == 1
        assert len(resultado["documentos"]) == 1
        mock_repository.get_by_area.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_obtener_documentos_area_con_filtro_estado(
        self, derivacion_service, mock_repository, mock_derivacion
    ):
        """Test area documents retrieval with status filter"""
        # Arrange
        area_id = str(uuid.uuid4())
        estado = EstadoDerivacionEnum.PENDIENTE
        mock_repository.get_by_area.return_value = ([mock_derivacion], 1)
        
        # Act
        resultado = await derivacion_service.obtener_documentos_area(
            area_id, estado=estado
        )
        
        # Assert
        assert resultado["total"] == 1
        mock_repository.get_by_area.assert_called_once()


class TestDerivacionServiceVencimientos:
    """Tests for vencimiento-related methods"""
    
    @pytest.mark.asyncio
    async def test_obtener_derivaciones_proximas_vencer(
        self, derivacion_service, mock_repository
    ):
        """Test retrieval of documents about to expire"""
        # Arrange
        area_id = str(uuid.uuid4())
        dias_anticipacion = 3
        
        derivacion_proxima = Derivacion(
            id=uuid.uuid4(),
            documento_id=uuid.uuid4(),
            area_destino_id=uuid.uuid4(),
            usuario_deriva_id=uuid.uuid4(),
            instrucciones="Test",
            fecha_derivacion=datetime.utcnow(),
            fecha_limite=datetime.utcnow() + timedelta(days=2),
            estado=EstadoDerivacionEnum.RECIBIDO,
            es_urgente=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        mock_repository.get_proximas_vencer.return_value = [derivacion_proxima]
        
        # Act
        resultado = await derivacion_service.obtener_derivaciones_proximas_vencer(
            area_id, dias_anticipacion
        )
        
        # Assert
        assert len(resultado) == 1
        mock_repository.get_proximas_vencer.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_obtener_derivaciones_vencidas(
        self, derivacion_service, mock_repository
    ):
        """Test retrieval of expired documents"""
        # Arrange
        area_id = str(uuid.uuid4())
        
        derivacion_vencida = Derivacion(
            id=uuid.uuid4(),
            documento_id=uuid.uuid4(),
            area_destino_id=uuid.uuid4(),
            usuario_deriva_id=uuid.uuid4(),
            instrucciones="Test",
            fecha_derivacion=datetime.utcnow() - timedelta(days=10),
            fecha_limite=datetime.utcnow() - timedelta(days=1),
            estado=EstadoDerivacionEnum.RECIBIDO,
            es_urgente=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        mock_repository.get_vencidas.return_value = [derivacion_vencida]
        
        # Act
        resultado = await derivacion_service.obtener_derivaciones_vencidas(area_id)
        
        # Assert
        assert len(resultado) == 1
        mock_repository.get_vencidas.assert_called_once()
