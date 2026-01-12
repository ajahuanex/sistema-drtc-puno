"""
Configuración de base de datos SQLite para desarrollo local
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de SQLite
SQLITE_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./drtc_local.db")

# Crear el motor de base de datos
engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necesario para SQLite
    echo=os.getenv("DEBUG", "false").lower() == "true"  # Log de SQL queries en debug
)

# Crear la sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

def get_db():
    """
    Dependencia para obtener la sesión de base de datos
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Crear todas las tablas en la base de datos
    """
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente en SQLite")

def init_database():
    """
    Inicializar la base de datos con datos de prueba
    """
    create_tables()
    print("🗄️ Base de datos SQLite inicializada")