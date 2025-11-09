"""
Tests para el router de consulta pública por QR
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from uuid import uuid4

from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum, PrioridadEnum
from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum


def test_consultar_documento_por_qr_exitoso(client: TestClient, db_session, sample_documento):
    """Test consulta exitosa por código QR"""
    # Crear documento con código QR
    documento = sample_documento
    documento.codigo_qr = "QR-TEST-123"
    db_session.add(documento)
    db_session.commit()
    
    # Consultar por QR
    response = client.get(f"/api/v1/public/qr/consultar/{documento.codigo_qr}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["documento"]["numero_expediente"] == documento.numero_expediente
    assert data["documento"]["estado"] == documento.estado.value
    assert data["documento"]["prioridad"] == documento.prioridad.value


def test_consultar_documento_por_qr_no_encontrado(client: TestClient):
    """Test consulta con código QR inexistente"""
    response = client.get("/api/v1/public/qr/consultar/QR-INVALID")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "no encontrado" in data["mensaje"].lower()


def test_consultar_documento_por_qr_con_historial(
    client: TestClient, 
    db_session, 
    sample_documento,
    sample_area
):
    """Test consulta por QR con historial de derivaciones"""
    # Crear documento
    documento = sample_documento
    documento.codigo_qr = "QR-TEST-456"
    db_session.add(documento)
    db_session.commit()
    
    # Crear derivación
    derivacion = Derivacion(
        id=uuid4(),
        documento_id=documento.id,
        area_origen_id=sample_area.id,
        area_destino_id=sample_area.id,
        instrucciones="Test",
        estado=EstadoDerivacionEnum.RECIBIDO,
        fecha_derivacion=datetime.utcnow()
    )
    db_session.add(derivacion)
    db_session.commit()
    
    # Consultar
    response = client.get(f"/api/v1/public/qr/consultar/{documento.codigo_qr}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["documento"]["historial"]) == 1
    assert data["documento"]["historial"][0]["estado"] == EstadoDerivacionEnum.RECIBIDO.value


def test_consultar_documento_por_expediente_exitoso(
    client: TestClient, 
    db_session, 
    sample_documento
):
    """Test consulta exitosa por número de expediente"""
    documento = sample_documento
    db_session.add(documento)
    db_session.commit()
    
    response = client.get(
        f"/api/v1/public/qr/consultar-expediente/{documento.numero_expediente}"
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["documento"]["numero_expediente"] == documento.numero_expediente


def test_consultar_documento_por_expediente_case_insensitive(
    client: TestClient, 
    db_session, 
    sample_documento
):
    """Test consulta por expediente es case-insensitive"""
    documento = sample_documento
    documento.numero_expediente = "EXP-2025-0001"
    db_session.add(documento)
    db_session.commit()
    
    # Consultar con minúsculas
    response = client.get("/api/v1/public/qr/consultar-expediente/exp-2025-0001")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


def test_consultar_documento_por_expediente_no_encontrado(client: TestClient):
    """Test consulta con expediente inexistente"""
    response = client.get("/api/v1/public/qr/consultar-expediente/EXP-INVALID")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "no encontrado" in data["mensaje"].lower()


def test_consulta_publica_no_expone_informacion_sensible(
    client: TestClient, 
    db_session, 
    sample_documento
):
    """Test que la consulta pública no expone información sensible"""
    documento = sample_documento
    documento.codigo_qr = "QR-TEST-789"
    db_session.add(documento)
    db_session.commit()
    
    response = client.get(f"/api/v1/public/qr/consultar/{documento.codigo_qr}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verificar que solo se expone información pública
    documento_data = data["documento"]
    assert "numero_expediente" in documento_data
    assert "tipo_documento" in documento_data
    assert "asunto" in documento_data
    assert "estado" in documento_data
    
    # Verificar que NO se expone información sensible
    assert "usuario_registro_id" not in documento_data
    assert "archivos_adjuntos" not in documento_data
    assert "etiquetas" not in documento_data


def test_consulta_publica_sin_autenticacion(client: TestClient, db_session, sample_documento):
    """Test que la consulta pública no requiere autenticación"""
    documento = sample_documento
    documento.codigo_qr = "QR-PUBLIC-TEST"
    db_session.add(documento)
    db_session.commit()
    
    # Hacer request sin headers de autenticación
    response = client.get(
        f"/api/v1/public/qr/consultar/{documento.codigo_qr}",
        headers={}  # Sin token
    )
    
    assert response.status_code == 200
    assert response.json()["success"] is True
