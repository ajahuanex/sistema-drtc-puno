"""
Base repository class for Mesa de Partes module
"""
from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from abc import ABC, abstractmethod
import uuid

from app.models.mesa_partes.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType], ABC):
    """Base repository with common CRUD operations"""
    
    def __init__(self, db: Session, model: Type[ModelType]):
        self.db = db
        self.model = model
    
    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """Create a new record"""
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get record by ID"""
        try:
            uuid_id = uuid.UUID(id) if isinstance(id, str) else id
            return self.db.query(self.model).filter(self.model.id == uuid_id).first()
        except (ValueError, TypeError):
            return None
    
    def get_by_field(self, field_name: str, value: Any) -> Optional[ModelType]:
        """Get record by specific field"""
        return self.db.query(self.model).filter(getattr(self.model, field_name) == value).first()
    
    def list_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """List all records with pagination"""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def update(self, id: str, update_data: Dict[str, Any]) -> Optional[ModelType]:
        """Update record by ID"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        
        for field, value in update_data.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: str) -> bool:
        """Delete record by ID"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        
        self.db.delete(db_obj)
        self.db.commit()
        return True
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters"""
        query = self.db.query(func.count(self.model.id))
        if filters:
            query = self._apply_filters(query, filters)
        return query.scalar()
    
    def exists(self, id: str) -> bool:
        """Check if record exists"""
        return self.get_by_id(id) is not None
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Apply filters to query - to be implemented by subclasses"""
        return query
    
    def _apply_sorting(self, query, sort_by: str = "created_at", sort_order: str = "desc"):
        """Apply sorting to query"""
        if hasattr(self.model, sort_by):
            sort_column = getattr(self.model, sort_by)
            if sort_order.lower() == "asc":
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        return query