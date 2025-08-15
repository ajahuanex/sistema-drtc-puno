"""
Utilidades para modo mock que reemplazan funcionalidades de MongoDB
"""
import uuid
from typing import Optional

def generate_mock_id() -> str:
    """Generar ID único para modo mock"""
    return str(uuid.uuid4())

def mock_object_id() -> str:
    """Reemplazo de ObjectId() para modo mock"""
    return generate_mock_id()

# Función para reemplazar str(ObjectId()) en los modelos
def mock_id_factory() -> str:
    """Factory para generar IDs en modelos Pydantic"""
    return generate_mock_id()
