"""
Tests for Archivo Router
Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.mesa_partes.database import Base, get_db
from app.models.mesa_partes.documento import Documento, TipoDocumento, EstadoDocumentoEnum, PrioridadEnum
from app.models.mesa_partes.archivo import Archivo, ClasificacionArchivoEnum, PoliticaRetencionEnum

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def tipo_documento(db_session):
    """Create a tipo_documento for testing"""
    tipo = TipoDocumento(
        nombre="Solicitud",
        codigo="SOL",
        descripcion="Solicitud general"
    )
    db_session.add(tipo)
    db_session.commit()
    db_session.refresh(tipo)
    return tipo


@pytest.fixture
def documento_atendido(db_session, tipo_documento):
    """Create an ATENDIDO documento for testing"""
    documento = Documento(
        numero_expediente="EXP-2025-0001",
        tipo_documento_id=tipo_documento.id,
        remitente="Juan Pérez",
        asunto="Solicitud de información",
        numero_folios=5,
        prioridad=PrioridadEnum.NORMAL,
        estado=EstadoDocumentoEnum.ATENDIDO,
        fecha_recepcion=datetime.utcnow(),
        usuario_registro_id="user-123",
        codigo_qr="QR-EXP-2025-0001"
    )
    db_session.add(documento)
    db_session.commit()
    db_session.refresh(documento)
    return documento


def test_archivar_documento(db_session, documento_atendido):
    """
    Test archiving a documento
    Requirements: 9.1, 9.2, 9.3
    """
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "TRAMITE_DOCUMENTARIO",
        "politica_retencion": "CINCO_ANOS",
        "ubicacion_fisica": "Estante A, Caja 1",
        "observaciones": "Documento archivado correctamente",
        "motivo_archivo": "Trámite finalizado"
    }
    
    response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["documento_id"] == str(documento_atendido.id)
    assert data["clasificacion"] == "TRAMITE_DOCUMENTARIO"
    assert data["politica_retencion"] == "CINCO_ANOS"
    assert data["codigo_ubicacion"].startswith("EST-TD-")
    assert data["activo"] == "ARCHIVADO"
    assert "fecha_archivado" in data
    assert "fecha_expiracion_retencion" in data


def test_archivar_documento_no_atendido(db_session, tipo_documento):
    """
    Test that only ATENDIDO documents can be archived
    Requirements: 9.1
    """
    # Create a documento that is not ATENDIDO
    documento = Documento(
        numero_expediente="EXP-2025-0002",
        tipo_documento_id=tipo_documento.id,
        remitente="María García",
        asunto="Solicitud pendiente",
        numero_folios=3,
        prioridad=PrioridadEnum.NORMAL,
        estado=EstadoDocumentoEnum.EN_PROCESO,
        fecha_recepcion=datetime.utcnow(),
        usuario_registro_id="user-123",
        codigo_qr="QR-EXP-2025-0002"
    )
    db_session.add(documento)
    db_session.commit()
    
    archivo_data = {
        "documento_id": str(documento.id),
        "clasificacion": "TRAMITE_DOCUMENTARIO",
        "politica_retencion": "CINCO_ANOS"
    }
    
    response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    assert response.status_code == 400
    assert "Only ATENDIDO documents can be archived" in response.json()["detail"]


def test_obtener_archivo(db_session, documento_atendido):
    """
    Test getting archivo by ID
    Requirements: 9.3, 9.4
    """
    # First archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "ADMINISTRATIVO",
        "politica_retencion": "TRES_ANOS"
    }
    
    create_response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    archivo_id = create_response.json()["id"]
    
    # Get the archivo
    response = client.get(f"/api/v1/mesa-partes/archivo/{archivo_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == archivo_id
    assert data["clasificacion"] == "ADMINISTRATIVO"


def test_obtener_archivo_por_documento(db_session, documento_atendido):
    """
    Test getting archivo by documento_id
    Requirements: 9.3, 9.4
    """
    # First archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "LEGAL",
        "politica_retencion": "DIEZ_ANOS"
    }
    
    client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    # Get the archivo by documento_id
    response = client.get(f"/api/v1/mesa-partes/archivo/documento/{documento_atendido.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["documento_id"] == str(documento_atendido.id)
    assert data["clasificacion"] == "LEGAL"


def test_listar_archivos(db_session, documento_atendido):
    """
    Test listing archivos with filters
    Requirements: 9.3, 9.4, 9.5
    """
    # Archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "CONTABLE",
        "politica_retencion": "CINCO_ANOS"
    }
    
    client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    # List archivos
    response = client.get("/api/v1/mesa-partes/archivo/")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_listar_archivos_con_filtros(db_session, documento_atendido):
    """
    Test listing archivos with specific filters
    Requirements: 9.3, 9.4
    """
    # Archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "TECNICO",
        "politica_retencion": "PERMANENTE"
    }
    
    client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    # List with filter
    response = client.get("/api/v1/mesa-partes/archivo/?clasificacion=TECNICO")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["clasificacion"] == "TECNICO"


def test_actualizar_archivo(db_session, documento_atendido):
    """
    Test updating archivo information
    Requirements: 9.3
    """
    # First archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "OTROS",
        "politica_retencion": "UN_ANO"
    }
    
    create_response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    archivo_id = create_response.json()["id"]
    
    # Update the archivo
    update_data = {
        "ubicacion_fisica": "Estante B, Caja 5",
        "observaciones": "Ubicación actualizada"
    }
    
    response = client.put(f"/api/v1/mesa-partes/archivo/{archivo_id}", json=update_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["ubicacion_fisica"] == "Estante B, Caja 5"
    assert data["observaciones"] == "Ubicación actualizada"


def test_restaurar_documento(db_session, documento_atendido):
    """
    Test restoring an archived documento
    Requirements: 9.5
    """
    # First archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "ADMINISTRATIVO",
        "politica_retencion": "TRES_ANOS"
    }
    
    create_response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    archivo_id = create_response.json()["id"]
    
    # Restore the documento
    restaurar_data = {
        "motivo_restauracion": "Se requiere revisar el documento nuevamente por solicitud del área legal"
    }
    
    response = client.post(f"/api/v1/mesa-partes/archivo/{archivo_id}/restaurar", json=restaurar_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["activo"] == "RESTAURADO"
    assert data["motivo_restauracion"] == restaurar_data["motivo_restauracion"]
    assert "fecha_restauracion" in data


def test_obtener_estadisticas(db_session, documento_atendido):
    """
    Test getting archivo statistics
    Requirements: 9.3
    """
    # Archive the documento
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "LEGAL",
        "politica_retencion": "DIEZ_ANOS"
    }
    
    client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    # Get statistics
    response = client.get("/api/v1/mesa-partes/archivo/estadisticas/general")
    
    assert response.status_code == 200
    data = response.json()
    assert "total_archivados" in data
    assert "por_clasificacion" in data
    assert "por_politica_retencion" in data
    assert "proximos_a_expirar" in data
    assert data["total_archivados"] >= 1


def test_codigo_ubicacion_generacion(db_session, documento_atendido):
    """
    Test that codigo_ubicacion is generated correctly
    Requirements: 9.7
    """
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "TRAMITE_DOCUMENTARIO",
        "politica_retencion": "CINCO_ANOS"
    }
    
    response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    assert response.status_code == 201
    data = response.json()
    codigo = data["codigo_ubicacion"]
    
    # Verify format: EST-TD-YYYY-NNNN
    parts = codigo.split('-')
    assert len(parts) == 4
    assert parts[0] == "EST"
    assert parts[1] == "TD"  # TRAMITE_DOCUMENTARIO
    assert parts[2] == str(datetime.utcnow().year)
    assert len(parts[3]) == 4  # 4-digit sequence


def test_politica_retencion_permanente(db_session, documento_atendido):
    """
    Test that PERMANENTE retention policy has no expiration date
    Requirements: 9.2, 9.6
    """
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "LEGAL",
        "politica_retencion": "PERMANENTE"
    }
    
    response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["fecha_expiracion_retencion"] is None


def test_politica_retencion_con_fecha(db_session, documento_atendido):
    """
    Test that retention policies with time limits have expiration dates
    Requirements: 9.2, 9.6
    """
    archivo_data = {
        "documento_id": str(documento_atendido.id),
        "clasificacion": "ADMINISTRATIVO",
        "politica_retencion": "CINCO_ANOS"
    }
    
    response = client.post("/api/v1/mesa-partes/archivo/", json=archivo_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["fecha_expiracion_retencion"] is not None
    
    # Verify expiration is approximately 5 years from now
    fecha_expiracion = datetime.fromisoformat(data["fecha_expiracion_retencion"].replace('Z', '+00:00'))
    fecha_esperada = datetime.utcnow() + timedelta(days=365 * 5)
    diferencia = abs((fecha_expiracion - fecha_esperada).days)
    assert diferencia <= 1  # Allow 1 day difference


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
