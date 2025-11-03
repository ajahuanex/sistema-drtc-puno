"""
Database configuration and utilities for Mesa de Partes module
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
import logging

logger = logging.getLogger(__name__)

# Base class for all models
Base = declarative_base()

# Database configuration
DATABASE_URL = os.getenv(
    "MESA_PARTES_DATABASE_URL", 
    "postgresql://postgres:password@localhost:5432/mesa_partes_db"
)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv("SQL_DEBUG", "false").lower() == "true"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()

def init_db():
    """
    Initialize database with tables and initial data
    """
    from .migrations import create_tables
    create_tables(DATABASE_URL)

def check_db_connection() -> bool:
    """
    Check if database connection is working
    """
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

# Event listeners for database operations
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Set SQLite pragmas if using SQLite (for testing)
    """
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

@event.listens_for(SessionLocal, "before_commit")
def before_commit(session):
    """
    Log before commit operations
    """
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Committing database transaction")

@event.listens_for(SessionLocal, "after_rollback")
def after_rollback(session):
    """
    Log rollback operations
    """
    logger.warning("Database transaction rolled back")