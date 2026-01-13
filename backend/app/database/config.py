"""
Configuración de base de datos - Soporte para MongoDB y SQLite
"""
import os
from typing import Optional

# Configuración de base de datos
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/drtc_db")

def get_database_config():
    """
    Retorna la configuración de base de datos según el entorno
    """
    if USE_SQLITE:
        return {
            "type": "sqlite",
            "url": DATABASE_URL or "sqlite:///./drtc_local.db",
            "echo": os.getenv("DEBUG", "false").lower() == "true"
        }
    else:
        return {
            "type": "mongodb",
            "url": MONGODB_URL,
            "database_name": "drtc_db"
        }

def is_sqlite_mode() -> bool:
    """
    Verifica si estamos en modo SQLite
    """
    return USE_SQLITE

def is_mongodb_mode() -> bool:
    """
    Verifica si estamos en modo MongoDB
    """
    return not USE_SQLITE