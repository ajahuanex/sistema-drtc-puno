#!/usr/bin/env python3
"""
Verificar configuración actual
"""
import os
import sys
sys.path.append('backend')

from app.config.settings import settings

print("🔍 CONFIGURACIÓN ACTUAL")
print("=" * 50)
print(f"MONGODB_URL: {settings.MONGODB_URL}")
print(f"DATABASE_NAME: {settings.DATABASE_NAME}")
print(f"DEBUG: {settings.DEBUG}")
print()

print("🔍 VARIABLES DE ENTORNO")
print("=" * 50)
print(f"MONGODB_URL env: {os.getenv('MONGODB_URL', 'No definida')}")
print(f"SECRET_KEY env: {os.getenv('SECRET_KEY', 'No definida')}")
print(f"ENVIRONMENT env: {os.getenv('ENVIRONMENT', 'No definida')}")
print(f"DEBUG env: {os.getenv('DEBUG', 'No definida')}")