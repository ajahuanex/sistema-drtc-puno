"""
Database dependency for Mesa de Partes
Mock implementation for compatibility
"""
from typing import Generator
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class MockSession:
    """Mock SQLAlchemy session for compatibility"""
    
    def __init__(self):
        self.is_active = True
    
    def query(self, *args, **kwargs):
        """Mock query method"""
        return MockQuery()
    
    def add(self, instance):
        """Mock add method"""
        logger.info(f"Mock: Adding instance {instance}")
        
    def commit(self):
        """Mock commit method"""
        logger.info("Mock: Committing transaction")
        
    def rollback(self):
        """Mock rollback method"""
        logger.info("Mock: Rolling back transaction")
        
    def close(self):
        """Mock close method"""
        logger.info("Mock: Closing session")
        self.is_active = False

class MockQuery:
    """Mock SQLAlchemy query for compatibility"""
    
    def filter(self, *args, **kwargs):
        return self
    
    def filter_by(self, **kwargs):
        return self
    
    def order_by(self, *args):
        return self
    
    def limit(self, limit):
        return self
    
    def offset(self, offset):
        return self
    
    def first(self):
        return None
    
    def all(self):
        return []
    
    def count(self):
        return 0

def get_db() -> Generator[Session, None, None]:
    """
    Mock database session dependency
    Returns a mock session for compatibility with Mesa de Partes routers
    """
    db = MockSession()
    try:
        yield db
    finally:
        db.close()