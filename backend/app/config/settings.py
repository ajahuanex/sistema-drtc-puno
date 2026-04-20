from pydantic_settings import BaseSettings
from typing import List
import os
from functools import lru_cache

class Settings(BaseSettings):
    # Configuración de la aplicación
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Sistema Regional de Registros de Transporte (SIRRET)")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Base de datos MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "drtc_db")
    
    # Seguridad - IMPORTANTE: Cambiar en producción
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu_clave_secreta_muy_larga_y_segura_aqui_sirret_2024")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # CORS - URLs específicas para SIRRET
    BACKEND_CORS_ORIGINS: List[str] = [
        url.strip() for url in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:4200,http://127.0.0.1:4200"
        ).split(",")
    ]
    
    # URLs del sistema SIRRET
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:4200")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
    
    # Información del sistema
    SISTEMA_NOMBRE: str = os.getenv("SISTEMA_NOMBRE", "SIRRET")
    SISTEMA_NOMBRE_COMPLETO: str = os.getenv("SISTEMA_NOMBRE_COMPLETO", "Sistema Regional de Registros de Transporte (SIRRET)")
    ENTIDAD_NOMBRE: str = os.getenv("ENTIDAD_NOMBRE", "Dirección Regional de Transportes y Comunicaciones Puno")
    DOMINIO_INSTITUCIONAL: str = os.getenv("DOMINIO_INSTITUCIONAL", "transportespuno.gob.pe")
    EMAIL_INSTITUCIONAL: str = os.getenv("EMAIL_INSTITUCIONAL", "admin@transportespuno.gob.pe")
    
    # APIs Externas
    RENIEC_API_URL: str = os.getenv("RENIEC_API_URL", "https://api.reniec.gob.pe")
    SUNARP_API_URL: str = os.getenv("SUNARP_API_URL", "https://api.sunarp.gob.pe")
    
    # Configuración de Documentos
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    
    # Configuración de QR
    QR_SIZE: int = int(os.getenv("QR_SIZE", "10"))
    QR_BORDER: int = int(os.getenv("QR_BORDER", "4"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/sirret.log")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_PERIOD: int = int(os.getenv("RATE_LIMIT_PERIOD", "3600"))
    
    # Session
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", "30"))
    
    # Validaciones
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    """Obtener configuración cacheada"""
    return Settings()

settings = get_settings()

