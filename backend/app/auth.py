"""
Auth module - Unified authentication access
"""

# Re-export auth functions from dependencies.auth for backward compatibility
from .dependencies.auth import get_current_user, get_current_active_user, create_access_token

__all__ = ['get_current_user', 'get_current_active_user', 'create_access_token']