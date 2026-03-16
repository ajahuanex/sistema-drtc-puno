"""
Tests básicos para el módulo de localidades
"""
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_crear_localidad():
    """Test crear localidad básica"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/localidades/",
            json={
                "nombre": "TEST LOCALIDAD",
                "tipo": "LOCALIDAD",
                "departamento": "PUNO"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "TEST LOCALIDAD"
        assert data["tipo"] == "LOCALIDAD"

@pytest.mark.asyncio
async def test_listar_localidades():
    """Test listar localidades"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/localidades/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

@pytest.mark.asyncio
async def test_buscar_localidades():
    """Test búsqueda inteligente"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/localidades/buscar?q=puno")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

@pytest.mark.asyncio
async def test_obtener_localidad_inexistente():
    """Test obtener localidad que no existe"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/localidades/000000000000000000000000")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_validar_ubigeo():
    """Test validación de UBIGEO"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/localidades/validar-ubigeo",
            json={"ubigeo": "210101"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "valido" in data
        assert "mensaje" in data

@pytest.mark.asyncio
async def test_estadisticas_centros_poblados():
    """Test estadísticas de centros poblados"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/localidades/centros-poblados/estadisticas")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "activos" in data
        assert "por_distrito" in data

# Configuración de pytest
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
