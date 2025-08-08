from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Configuración de la aplicación
    PROJECT_NAME: str = "Sistema de Gestión DRTC Puno"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Base de datos MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "drtc_puno_db"
    
    # Seguridad
    SECRET_KEY: str = "tu_clave_secreta_muy_larga_y_segura_aqui"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:4200"]
    
    # DRTC Específico
    BASE_URL: str = "http://localhost:8000"
    DRTC_NAME: str = "Dirección Regional de Transportes y Comunicaciones Puno"
    
    # APIs Externas
    RENIEC_API_URL: str = "https://api.reniec.gob.pe"
    SUNARP_API_URL: str = "https://api.sunarp.gob.pe"
    
    # Configuración de Documentos
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Configuración de QR
    QR_SIZE: int = 10
    QR_BORDER: int = 4
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 