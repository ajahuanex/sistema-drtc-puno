"""
Database module - Unified database access
"""

# Re-export get_database from dependencies.db for backward compatibility
from .dependencies.db import get_database

__all__ = ['get_database']