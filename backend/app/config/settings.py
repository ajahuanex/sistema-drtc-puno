from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Configuración de la aplicación
    PROJECT_NAME: str = "Sistema Regional de Registros de Transporte (SIRRET)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Base de datos MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "drtc_puno_db")
    
    # Seguridad
    SECRET_KEY: str = "tu_clave_secreta_muy_larga_y_segura_aqui_sirret_2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - URLs específicas para SIRRET
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # URLs del sistema SIRRET
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:4200"
    API_BASE_URL: str = "http://localhost:8000/api/v1"
    
    # Información del sistema
    SISTEMA_NOMBRE: str = "SIRRET"
    SISTEMA_NOMBRE_COMPLETO: str = "Sistema Regional de Registros de Transporte (SIRRET)"
    ENTIDAD_NOMBRE: str = "Dirección Regional de Transportes y Comunicaciones Puno"
    DOMINIO_INSTITUCIONAL: str = "transportespuno.gob.pe"
    EMAIL_INSTITUCIONAL: str = "admin@transportespuno.gob.pe"
    
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
        extra = "ignore"

settings = Settings()
