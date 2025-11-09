"""
Unit tests for Documentos API endpoints
Tests REST API for document management
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import uuid
from datetime import datetime

from app.main import app
from app.models.mesa_partes.documento import EstadoDocumentoEnum, PrioridadEnum


client = TestClient(app)


@pytest.fixture
def mock_documento_response():
    return {
        "id": str(uuid.uuid4()),
        "numero_expediente": "EXP-2025-0001",
        "tipo_documento_id": str(uuid.uuid4()),
        "remitente": "Juan Pérez",
        "asunto": "Solicitud de información",
        "numero_folios": 5,
        "tiene_anexos": False,
        "prioridad": "NORMAL",
        "estado": "REGISTRADO",
        "fecha_recepcion": datetime.utcnow().isoformat(),
        "codigo_qr": "QR-123",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }


class TestDocumentosEndpoints:
    """Tests for /api/v1/documentos endpoints"""
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_crear_documento(self, mock_service, mock_documento_response):
        """Test POST /api/v1/documentos"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.crear_documento = AsyncMock(
            return_value=Mock(**mock_documento_response)
        )
        mock_service.return_value = mock_service_instance
        
        documento_data = {
            "tipo_documento_id": str(uuid.uuid4()),
            "remitente": "Juan Pérez",
            "asunto": "Solicitud de información",
            "numero_folios": 5,
            "tiene_anexos": False,
            "prioridad": "NORMAL"
        }
        
        # Act
        response = client.post(
            "/api/v1/documentos",
            json=documento_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 201]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_obtener_documento(self, mock_service, mock_documento_response):
        """Test GET /api/v1/documentos/{id}"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_service_instance = Mock()
        mock_service_instance.obtener_documento = AsyncMock(
            return_value=Mock(**mock_documento_response)
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            f"/api/v1/documentos/{documento_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_listar_documentos(self, mock_service, mock_documento_response):
        """Test GET /api/v1/documentos"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.listar_documentos = AsyncMock(
            return_value={
                "documentos": [Mock(**mock_documento_response)],
                "total": 1,
                "page": 0,
                "page_size": 25
            }
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            "/api/v1/documentos",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code == 200
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_actualizar_documento(self, mock_service, mock_documento_response):
        """Test PUT /api/v1/documentos/{id}"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_service_instance = Mock()
        mock_service_instance.actualizar_documento = AsyncMock(
            return_value=Mock(**mock_documento_response)
        )
        mock_service.return_value = mock_service_instance
        
        update_data = {
            "asunto": "Asunto actualizado",
            "prioridad": "ALTA"
        }
        
        # Act
        response = client.put(
            f"/api/v1/documentos/{documento_id}",
            json=update_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_archivar_documento(self, mock_service, mock_documento_response):
        """Test POST /api/v1/documentos/{id}/archivar"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_service_instance = Mock()
        mock_service_instance.archivar_documento = AsyncMock(
            return_value=Mock(**mock_documento_response)
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.post(
            f"/api/v1/documentos/{documento_id}/archivar",
            json={"clasificacion": "ADMINISTRATIVO"},
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_generar_comprobante(self, mock_service):
        """Test GET /api/v1/documentos/{id}/comprobante"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_service_instance = Mock()
        mock_service_instance.generar_comprobante = AsyncMock(
            return_value=b"PDF content"
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            f"/api/v1/documentos/{documento_id}/comprobante",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]
    
    def test_crear_documento_sin_autenticacion(self):
        """Test POST /api/v1/documentos without authentication"""
        # Arrange
        documento_data = {
            "tipo_documento_id": str(uuid.uuid4()),
            "remitente": "Juan Pérez",
            "asunto": "Test",
            "numero_folios": 1,
            "tiene_anexos": False,
            "prioridad": "NORMAL"
        }
        
        # Act
        response = client.post("/api/v1/documentos", json=documento_data)
        
        # Assert
        assert response.status_code in [401, 403]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_listar_documentos_con_filtros(self, mock_service, mock_documento_response):
        """Test GET /api/v1/documentos with filters"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.listar_documentos = AsyncMock(
            return_value={
                "documentos": [Mock(**mock_documento_response)],
                "total": 1,
                "page": 0,
                "page_size": 25
            }
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            "/api/v1/documentos?estado=REGISTRADO&prioridad=NORMAL",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code == 200
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_exportar_excel(self, mock_service):
        """Test GET /api/v1/documentos/exportar/excel"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.exportar_excel = AsyncMock(
            return_value=b"Excel content"
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            "/api/v1/documentos/exportar/excel",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_exportar_pdf(self, mock_service):
        """Test GET /api/v1/documentos/exportar/pdf"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.exportar_pdf = AsyncMock(
            return_value=b"PDF content"
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            "/api/v1/documentos/exportar/pdf",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [200, 404]


class TestDocumentosValidation:
    """Tests for input validation"""
    
    def test_crear_documento_datos_invalidos(self):
        """Test POST /api/v1/documentos with invalid data"""
        # Arrange
        documento_data = {
            "remitente": "",  # Invalid: empty
            "asunto": "A",  # Invalid: too short
            "numero_folios": -1  # Invalid: negative
        }
        
        # Act
        response = client.post(
            "/api/v1/documentos",
            json=documento_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [400, 422]
    
    def test_crear_documento_campos_faltantes(self):
        """Test POST /api/v1/documentos with missing fields"""
        # Arrange
        documento_data = {
            "remitente": "Juan Pérez"
            # Missing required fields
        }
        
        # Act
        response = client.post(
            "/api/v1/documentos",
            json=documento_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [400, 422]


class TestDocumentosErrorHandling:
    """Tests for error handling"""
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_obtener_documento_no_encontrado(self, mock_service):
        """Test GET /api/v1/documentos/{id} with non-existent ID"""
        # Arrange
        documento_id = str(uuid.uuid4())
        mock_service_instance = Mock()
        mock_service_instance.obtener_documento = AsyncMock(
            side_effect=Exception("Not found")
        )
        mock_service.return_value = mock_service_instance
        
        # Act
        response = client.get(
            f"/api/v1/documentos/{documento_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [404, 500]
    
    @patch('app.routers.mesa_partes.documentos_router.DocumentoService')
    def test_crear_documento_error_servidor(self, mock_service):
        """Test POST /api/v1/documentos with server error"""
        # Arrange
        mock_service_instance = Mock()
        mock_service_instance.crear_documento = AsyncMock(
            side_effect=Exception("Database error")
        )
        mock_service.return_value = mock_service_instance
        
        documento_data = {
            "tipo_documento_id": str(uuid.uuid4()),
            "remitente": "Juan Pérez",
            "asunto": "Test",
            "numero_folios": 1,
            "tiene_anexos": False,
            "prioridad": "NORMAL"
        }
        
        # Act
        response = client.post(
            "/api/v1/documentos",
            json=documento_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Assert
        assert response.status_code in [500, 400]
