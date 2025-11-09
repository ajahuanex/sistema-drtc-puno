"""
Pytest fixtures for integration tests
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from datetime import datetime, timedelta
import uuid

from app.models.mesa_partes.database import Base, get_db
from app.models.mesa_partes.documento import Documento, TipoDocumento, EstadoDocumentoEnum, PrioridadEnum
from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.integracion import Integracion, TipoIntegracionEnum, TipoAutenticacionEnum, EstadoConexionEnum
from app.models.mesa_partes.notificacion import Notificacion, TipoNotificacionEnum
from app.models.mesa_partes.roles import Usuario, Area, Rol
from app.main import app


# Database URL for testing (use in-memory SQLite or test database)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def async_client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing"""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


# ============================================
# User and Area Fixtures
# ============================================

@pytest.fixture
async def test_rol(db_session: AsyncSession):
    """Create test role"""
    rol = Rol(
        id=uuid.uuid4(),
        nombre="Operador Mesa",
        descripcion="Operador de mesa de partes",
        permisos=["crear_documento", "derivar_documento", "ver_documento"]
    )
    db_session.add(rol)
    await db_session.commit()
    await db_session.refresh(rol)
    return rol


@pytest.fixture
async def test_area_origen(db_session: AsyncSession):
    """Create test origin area"""
    area = Area(
        id=uuid.uuid4(),
        nombre="Mesa de Partes",
        codigo="MP",
        descripcion="Área de recepción de documentos"
    )
    db_session.add(area)
    await db_session.commit()
    await db_session.refresh(area)
    return area


@pytest.fixture
async def test_area_destino(db_session: AsyncSession):
    """Create test destination area"""
    area = Area(
        id=uuid.uuid4(),
        nombre="Área Legal",
        codigo="AL",
        descripcion="Área de asesoría legal"
    )
    db_session.add(area)
    await db_session.commit()
    await db_session.refresh(area)
    return area


@pytest.fixture
async def test_area_tercera(db_session: AsyncSession):
    """Create third test area"""
    area = Area(
        id=uuid.uuid4(),
        nombre="Área Técnica",
        codigo="AT",
        descripcion="Área técnica"
    )
    db_session.add(area)
    await db_session.commit()
    await db_session.refresh(area)
    return area


@pytest.fixture
async def test_user(db_session: AsyncSession, test_rol, test_area_origen):
    """Create test user"""
    user = Usuario(
        id=uuid.uuid4(),
        username="test_user",
        email="test@example.com",
        nombre_completo="Usuario de Prueba",
        rol_id=test_rol.id,
        area_id=test_area_origen.id,
        activo=True
    )
    user.token = "test_token_123"  # Mock token
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_destino(db_session: AsyncSession, test_rol, test_area_destino):
    """Create test destination user"""
    user = Usuario(
        id=uuid.uuid4(),
        username="test_user_destino",
        email="destino@example.com",
        nombre_completo="Usuario Destino",
        rol_id=test_rol.id,
        area_id=test_area_destino.id,
        activo=True
    )
    user.token = "test_token_destino_456"
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ============================================
# Document Fixtures
# ============================================

@pytest.fixture
async def test_tipo_documento(db_session: AsyncSession):
    """Create test document type"""
    tipo = TipoDocumento(
        id=uuid.uuid4(),
        nombre="Solicitud",
        codigo="SOL",
        descripcion="Solicitud general"
    )
    db_session.add(tipo)
    await db_session.commit()
    await db_session.refresh(tipo)
    return tipo


@pytest.fixture
async def test_documento(db_session: AsyncSession, test_tipo_documento, test_user, test_area_origen):
    """Create test document"""
    documento = Documento(
        id=uuid.uuid4(),
        numero_expediente="EXP-2025-0001",
        tipo_documento_id=test_tipo_documento.id,
        numero_documento_externo="DOC-001",
        remitente="Juan Pérez",
        asunto="Solicitud de prueba",
        numero_folios=5,
        tiene_anexos=False,
        prioridad=PrioridadEnum.NORMAL,
        estado=EstadoDocumentoEnum.REGISTRADO,
        fecha_recepcion=datetime.utcnow(),
        usuario_registro_id=test_user.id,
        area_actual_id=test_area_origen.id,
        codigo_qr="QR-EXP-2025-0001",
        etiquetas=["prueba"]
    )
    db_session.add(documento)
    await db_session.commit()
    await db_session.refresh(documento)
    return documento


@pytest.fixture
async def test_documentos_multiples(db_session: AsyncSession, test_tipo_documento, test_user, test_area_origen):
    """Create multiple test documents"""
    documentos = []
    
    for i in range(10):
        doc = Documento(
            id=uuid.uuid4(),
            numero_expediente=f"EXP-2025-{str(i+1).zfill(4)}",
            tipo_documento_id=test_tipo_documento.id,
            remitente=f"Remitente {i+1}",
            asunto=f"Asunto de prueba {i+1}",
            numero_folios=i+1,
            tiene_anexos=i % 2 == 0,
            prioridad=PrioridadEnum.NORMAL if i % 3 != 0 else PrioridadEnum.ALTA,
            estado=EstadoDocumentoEnum.REGISTRADO if i < 5 else EstadoDocumentoEnum.EN_PROCESO,
            fecha_recepcion=datetime.utcnow() - timedelta(days=i),
            usuario_registro_id=test_user.id,
            area_actual_id=test_area_origen.id,
            codigo_qr=f"QR-EXP-2025-{str(i+1).zfill(4)}"
        )
        db_session.add(doc)
        documentos.append(doc)
    
    await db_session.commit()
    
    for doc in documentos:
        await db_session.refresh(doc)
    
    return documentos


@pytest.fixture
async def test_documentos_atendidos(db_session: AsyncSession, test_tipo_documento, test_user, test_area_origen):
    """Create attended test documents"""
    documentos = []
    
    for i in range(5):
        doc = Documento(
            id=uuid.uuid4(),
            numero_expediente=f"EXP-ATD-{str(i+1).zfill(4)}",
            tipo_documento_id=test_tipo_documento.id,
            remitente=f"Remitente {i+1}",
            asunto=f"Documento atendido {i+1}",
            numero_folios=3,
            prioridad=PrioridadEnum.NORMAL,
            estado=EstadoDocumentoEnum.ATENDIDO,
            fecha_recepcion=datetime.utcnow() - timedelta(days=i+5),
            usuario_registro_id=test_user.id,
            area_actual_id=test_area_origen.id,
            codigo_qr=f"QR-EXP-ATD-{str(i+1).zfill(4)}"
        )
        db_session.add(doc)
        documentos.append(doc)
    
    await db_session.commit()
    
    for doc in documentos:
        await db_session.refresh(doc)
    
    return documentos


@pytest.fixture
async def test_documentos_vencidos(db_session: AsyncSession, test_tipo_documento, test_user, test_area_origen):
    """Create overdue test documents"""
    documentos = []
    
    for i in range(3):
        doc = Documento(
            id=uuid.uuid4(),
            numero_expediente=f"EXP-VEN-{str(i+1).zfill(4)}",
            tipo_documento_id=test_tipo_documento.id,
            remitente=f"Remitente {i+1}",
            asunto=f"Documento vencido {i+1}",
            numero_folios=2,
            prioridad=PrioridadEnum.ALTA,
            estado=EstadoDocumentoEnum.EN_PROCESO,
            fecha_recepcion=datetime.utcnow() - timedelta(days=10),
            fecha_limite=datetime.utcnow() - timedelta(days=i+1),
            usuario_registro_id=test_user.id,
            area_actual_id=test_area_origen.id,
            codigo_qr=f"QR-EXP-VEN-{str(i+1).zfill(4)}"
        )
        db_session.add(doc)
        documentos.append(doc)
    
    await db_session.commit()
    
    for doc in documentos:
        await db_session.refresh(doc)
    
    return documentos


# ============================================
# Integration Fixtures
# ============================================

@pytest.fixture
async def test_integracion(db_session: AsyncSession):
    """Create test integration"""
    integracion = Integracion(
        id=uuid.uuid4(),
        nombre="Mesa de Partes Externa",
        descripcion="Integración con mesa de partes de otra institución",
        tipo=TipoIntegracionEnum.API_REST,
        url_base="https://api.externa.gob.pe",
        tipo_autenticacion=TipoAutenticacionEnum.API_KEY,
        credenciales_encriptadas="encrypted_api_key_123",
        activa=True,
        estado_conexion=EstadoConexionEnum.CONECTADO,
        mapeos_campos=[
            {"campo_local": "numero_expediente", "campo_remoto": "nro_tramite"},
            {"campo_local": "remitente", "campo_remoto": "solicitante"}
        ],
        configuracion_webhook={
            "url": "https://webhook.externa.gob.pe/eventos",
            "eventos": ["documento.actualizado", "documento.atendido"],
            "secreto": "webhook_secret_123"
        }
    )
    integracion.api_key = "test_api_key_123"
    integracion.webhook_secret = "webhook_secret_123"
    
    db_session.add(integracion)
    await db_session.commit()
    await db_session.refresh(integracion)
    return integracion


# ============================================
# Notification Fixtures
# ============================================

@pytest.fixture
async def test_notificacion(db_session: AsyncSession, test_user, test_documento):
    """Create test notification"""
    notificacion = Notificacion(
        id=uuid.uuid4(),
        usuario_id=test_user.id,
        tipo=TipoNotificacionEnum.DERIVACION_RECIBIDA,
        titulo="Nuevo documento recibido",
        mensaje=f"Se ha recibido el documento {test_documento.numero_expediente}",
        documento_id=test_documento.id,
        leida=False,
        fecha_creacion=datetime.utcnow()
    )
    db_session.add(notificacion)
    await db_session.commit()
    await db_session.refresh(notificacion)
    return notificacion
