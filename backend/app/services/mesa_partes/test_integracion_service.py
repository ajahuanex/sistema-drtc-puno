"""
Unit tests for IntegracionService
Tests business logic for external integrations
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.services.mesa_partes.integracion_service import IntegracionService
from app.schemas.mesa_partes.integracion import IntegracionCreate, IntegracionUpdate
from app.models.mesa_partes.integracion import (
    Integracion, TipoIntegracionEnum, TipoAutenticacionEnum, 
    EstadoConexionEnum, EstadoSincronizacionEnum
)
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError


@pytest.fixture
def mock_db():
    return Mock(spec=Session)


@pytest.fixture
def mock_repository():
    return Mock()


@pytest.fixture
def integracion_service(mock_db, mock_repository):
    service = IntegracionService(mock_db)
    service.repository = mock_repository
    return service


@pytest.fixture
def mock_integracion():
    return Integracion(
        id=uuid.uuid4(),
        nombre="Mesa Externa",
        descripcion="Integración con entidad externa",
        tipo=TipoIntegracionEnum.API_REST,
        url_base="https://api.externa.com",
        tipo_autenticacion=TipoAutenticacionEnum.API_KEY,
        credenciales_encriptadas="encrypted_key",
        mapeos_campos=[],
        activa=True,
        estado_conexion=EstadoConexionEnum.DESCONECTADO,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestIntegracionServiceCrear:
    """Tests for crear_integracion method"""
    
    @pytest.mark.asyncio
    async def test_crear_integracion_exitoso(
        self, integracion_service, mock_repository, mock_db, mock_integracion
    ):
        """Test successful integration creation"""
        # Arrange
        integracion_data = IntegracionCreate(
            nombre="Mesa Externa",
            descripcion="Integración con entidad externa",
            tipo=TipoIntegracionEnum.API_REST,
            url_base="https://api.externa.com",
            tipo_autenticacion=TipoAutenticacionEnum.API_KEY,
            credenciales="api-key-123",
            mapeos_campos=[],
            activa=True
        )
        
        mock_repository.create.return_value = mock_integracion
        integracion_service._encriptar_credenciales = Mock(return_value="encrypted_key")
        
        # Act
        resultado = await integracion_service.crear_integracion(integracion_data)
        
        # Assert
        assert resultado is not None
        assert resultado.nombre == "Mesa Externa"
        mock_repository.create.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_crear_integracion_encripta_credenciales(
        self, integracion_service, mock_repository, mock_db, mock_integracion
    ):
        """Test that credentials are encrypted"""
        # Arrange
        integracion_data = IntegracionCreate(
            nombre="Mesa Externa",
            descripcion="Test",
            tipo=TipoIntegracionEnum.API_REST,
            url_base="https://api.externa.com",
            tipo_autenticacion=TipoAutenticacionEnum.API_KEY,
            credenciales="plain-text-key",
            mapeos_campos=[],
            activa=True
        )
        
        mock_repository.create.return_value = mock_integracion
        integracion_service._encriptar_credenciales = Mock(return_value="encrypted_key")
        
        # Act
        await integracion_service.crear_integracion(integracion_data)
        
        # Assert
        integracion_service._encriptar_credenciales.assert_called_once_with("plain-text-key")


class TestIntegracionServiceProbarConexion:
    """Tests for probar_conexion method"""
    
    @pytest.mark.asyncio
    async def test_probar_conexion_exitoso(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test successful connection test"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        mock_repository.get_by_id.return_value = mock_integracion
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"status": "ok"}
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            # Act
            resultado = await integracion_service.probar_conexion(integracion_id)
            
            # Assert
            assert resultado["exitoso"] is True
            assert resultado["mensaje"] == "Conexión exitosa"
    
    @pytest.mark.asyncio
    async def test_probar_conexion_error(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test connection test with error"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        mock_repository.get_by_id.return_value = mock_integracion
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=Exception("Connection timeout")
            )
            
            # Act
            resultado = await integracion_service.probar_conexion(integracion_id)
            
            # Assert
            assert resultado["exitoso"] is False
            assert "error" in resultado
    
    @pytest.mark.asyncio
    async def test_probar_conexion_integracion_no_encontrada(
        self, integracion_service, mock_repository
    ):
        """Test connection test with non-existent integration"""
        # Arrange
        integracion_id = str(uuid.uuid4())
        mock_repository.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(NotFoundError):
            await integracion_service.probar_conexion(integracion_id)


class TestIntegracionServiceEnviarDocumento:
    """Tests for enviar_documento method"""
    
    @pytest.mark.asyncio
    async def test_enviar_documento_exitoso(
        self, integracion_service, mock_repository, mock_integracion, mock_db
    ):
        """Test successful document sending"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_id = str(uuid.uuid4())
        
        mock_repository.get_by_id.return_value = mock_integracion
        integracion_service._obtener_documento = AsyncMock(return_value=Mock())
        integracion_service._mapear_documento_salida = AsyncMock(return_value={})
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"id": "ext-123", "status": "received"}
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            
            # Act
            resultado = await integracion_service.enviar_documento(
                integracion_id, documento_id
            )
            
            # Assert
            assert resultado["exitoso"] is True
            assert "id_externo" in resultado
    
    @pytest.mark.asyncio
    async def test_enviar_documento_integracion_inactiva(
        self, integracion_service, mock_repository
    ):
        """Test sending document with inactive integration"""
        # Arrange
        integracion_inactiva = Integracion(
            id=uuid.uuid4(),
            nombre="Mesa Externa",
            descripcion="Test",
            tipo=TipoIntegracionEnum.API_REST,
            url_base="https://api.externa.com",
            tipo_autenticacion=TipoAutenticacionEnum.API_KEY,
            credenciales_encriptadas="encrypted",
            mapeos_campos=[],
            activa=False,
            estado_conexion=EstadoConexionEnum.DESCONECTADO,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        integracion_id = str(integracion_inactiva.id)
        documento_id = str(uuid.uuid4())
        
        mock_repository.get_by_id.return_value = integracion_inactiva
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await integracion_service.enviar_documento(integracion_id, documento_id)


class TestIntegracionServiceRecibirDocumento:
    """Tests for recibir_documento_externo method"""
    
    @pytest.mark.asyncio
    async def test_recibir_documento_exitoso(
        self, integracion_service, mock_repository, mock_integracion, mock_db
    ):
        """Test successful document reception"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_externo = {
            "numero_expediente_externo": "EXT-2025-001",
            "remitente": "Entidad Externa",
            "asunto": "Documento externo",
            "contenido": "Contenido del documento"
        }
        
        mock_repository.get_by_id.return_value = mock_integracion
        integracion_service._mapear_documento_entrada = AsyncMock(return_value={})
        integracion_service._crear_documento_local = AsyncMock(
            return_value=Mock(id=uuid.uuid4())
        )
        
        # Act
        resultado = await integracion_service.recibir_documento_externo(
            integracion_id, documento_externo
        )
        
        # Assert
        assert resultado["exitoso"] is True
        assert "documento_id" in resultado
    
    @pytest.mark.asyncio
    async def test_recibir_documento_mapeo_invalido(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test document reception with invalid mapping"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_externo = {"invalid": "data"}
        
        mock_repository.get_by_id.return_value = mock_integracion
        integracion_service._mapear_documento_entrada = AsyncMock(
            side_effect=ValidationError("Invalid mapping")
        )
        
        # Act & Assert
        with pytest.raises(ValidationError):
            await integracion_service.recibir_documento_externo(
                integracion_id, documento_externo
            )


class TestIntegracionServiceSincronizarEstado:
    """Tests for sincronizar_estado method"""
    
    @pytest.mark.asyncio
    async def test_sincronizar_estado_exitoso(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test successful state synchronization"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_id = str(uuid.uuid4())
        
        mock_repository.get_by_id.return_value = mock_integracion
        integracion_service._obtener_documento = AsyncMock(return_value=Mock())
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"estado": "ATENDIDO"}
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )
            
            # Act
            resultado = await integracion_service.sincronizar_estado(
                integracion_id, documento_id
            )
            
            # Assert
            assert resultado["exitoso"] is True
            assert "estado_externo" in resultado


class TestIntegracionServiceObtenerLog:
    """Tests for obtener_log_sincronizacion method"""
    
    @pytest.mark.asyncio
    async def test_obtener_log_exitoso(
        self, integracion_service, mock_repository
    ):
        """Test successful log retrieval"""
        # Arrange
        integracion_id = str(uuid.uuid4())
        mock_logs = [Mock(), Mock()]
        mock_repository.get_logs.return_value = (mock_logs, 2)
        
        # Act
        resultado = await integracion_service.obtener_log_sincronizacion(integracion_id)
        
        # Assert
        assert resultado["total"] == 2
        assert len(resultado["logs"]) == 2
    
    @pytest.mark.asyncio
    async def test_obtener_log_con_filtros(
        self, integracion_service, mock_repository
    ):
        """Test log retrieval with filters"""
        # Arrange
        integracion_id = str(uuid.uuid4())
        estado = EstadoSincronizacionEnum.EXITOSO
        fecha_desde = datetime.utcnow()
        
        mock_repository.get_logs.return_value = ([], 0)
        
        # Act
        resultado = await integracion_service.obtener_log_sincronizacion(
            integracion_id, estado=estado, fecha_desde=fecha_desde
        )
        
        # Assert
        assert resultado["total"] == 0
        mock_repository.get_logs.assert_called_once()


class TestIntegracionServiceValidarMapeo:
    """Tests for validar_mapeo method"""
    
    @pytest.mark.asyncio
    async def test_validar_mapeo_exitoso(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test successful mapping validation"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_ejemplo = {
            "remitente": "Juan Pérez",
            "asunto": "Test",
            "numero_folios": 5
        }
        
        mock_integracion.mapeos_campos = [
            {"campo_local": "remitente", "campo_remoto": "sender"},
            {"campo_local": "asunto", "campo_remoto": "subject"}
        ]
        
        mock_repository.get_by_id.return_value = mock_integracion
        
        # Act
        resultado = await integracion_service.validar_mapeo(
            integracion_id, documento_ejemplo
        )
        
        # Assert
        assert resultado["valido"] is True
        assert len(resultado["errores"]) == 0
    
    @pytest.mark.asyncio
    async def test_validar_mapeo_con_errores(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test mapping validation with errors"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        documento_ejemplo = {"campo_invalido": "valor"}
        
        mock_integracion.mapeos_campos = [
            {"campo_local": "remitente", "campo_remoto": "sender", "requerido": True}
        ]
        
        mock_repository.get_by_id.return_value = mock_integracion
        
        # Act
        resultado = await integracion_service.validar_mapeo(
            integracion_id, documento_ejemplo
        )
        
        # Assert
        assert resultado["valido"] is False
        assert len(resultado["errores"]) > 0


class TestIntegracionServiceWebhook:
    """Tests for webhook-related methods"""
    
    @pytest.mark.asyncio
    async def test_configurar_webhook_exitoso(
        self, integracion_service, mock_repository, mock_db, mock_integracion
    ):
        """Test successful webhook configuration"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        configuracion = {
            "url": "https://webhook.example.com",
            "eventos": ["documento.creado", "documento.derivado"],
            "secreto": "secret-123",
            "activo": True
        }
        
        mock_repository.get_by_id.return_value = mock_integracion
        mock_repository.update.return_value = mock_integracion
        
        # Act
        resultado = await integracion_service.configurar_webhook(
            integracion_id, configuracion
        )
        
        # Assert
        assert resultado is not None
        mock_repository.update.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_probar_webhook_exitoso(
        self, integracion_service, mock_repository, mock_integracion
    ):
        """Test successful webhook test"""
        # Arrange
        integracion_id = str(mock_integracion.id)
        configuracion = {
            "url": "https://webhook.example.com",
            "eventos": ["test"],
            "secreto": "secret-123"
        }
        
        mock_repository.get_by_id.return_value = mock_integracion
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            
            # Act
            resultado = await integracion_service.probar_webhook(
                integracion_id, configuracion
            )
            
            # Assert
            assert resultado["exitoso"] is True
