from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class ResolucionBase(BaseModel):
    numero: str = Field(..., description="Número de la resolución")
    fecha_emision: datetime = Field(..., description="Fecha de emisión")
    fecha_vencimiento: datetime = Field(..., description="Fecha de vencimiento")
    tipo: str = Field(..., description="Tipo de resolución (PRIMIGENIA, MODIFICATORIA, etc.)")
    empresa_id: str = Field(..., description="ID de la empresa")
    expediente_id: str = Field(..., description="ID del expediente")
    estado: str = Field(default="VIGENTE", description="Estado de la resolución")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")

class ResolucionCreate(ResolucionBase):
    pass

class ResolucionUpdate(BaseModel):
    numero: Optional[str] = None
    fecha_emision: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    tipo: Optional[str] = None
    empresa_id: Optional[str] = None
    expediente_id: Optional[str] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None

class ResolucionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    numero: str
    fecha_emision: datetime
    fecha_vencimiento: datetime
    tipo: str
    empresa_id: str
    expediente_id: str
    estado: str = Field(default="VIGENTE")
    observaciones: Optional[str] = None
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ResolucionResponse(BaseModel):
    id: str
    numero: str
    fecha_emision: datetime
    fecha_vencimiento: datetime
    tipo: str
    empresa_id: str
    expediente_id: str
    estado: str
    observaciones: Optional[str]
    esta_activo: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True 