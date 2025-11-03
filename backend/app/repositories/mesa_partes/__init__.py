"""
Mesa de Partes repositories
"""

from .base_repository import BaseRepository
from .documento_repository import DocumentoRepository
from .derivacion_repository import DerivacionRepository
from .integracion_repository import IntegracionRepository, LogSincronizacionRepository

__all__ = [
    "BaseRepository",
    "DocumentoRepository", 
    "DerivacionRepository",
    "IntegracionRepository",
    "LogSincronizacionRepository"
]