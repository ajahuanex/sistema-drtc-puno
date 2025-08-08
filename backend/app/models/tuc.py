from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class TucBase(BaseModel):
    nro_tuc: str = Field(..., description="Número de TUC")
    vehiculo_id: str = Field(..., description="ID del vehículo")
    empresa_id: str = Field(..., description="ID de la empresa")
    expediente_id: str = Field(..., description="ID del expediente")
    fecha_emision: datetime = Field(..., description="Fecha de emisión")
    fecha_vencimiento: datetime = Field(..., description="Fecha de vencimiento")
    estado: str = Field(default="VIGENTE", description="Estado del TUC")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")

class TucCreate(TucBase):
    pass

class TucUpdate(BaseModel):
    nro_tuc: Optional[str] = None
    vehiculo_id: Optional[str] = None
    empresa_id: Optional[str] = None
    expediente_id: Optional[str] = None
    fecha_emision: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None

class TucInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    nro_tuc: str
    vehiculo_id: str
    empresa_id: str
    expediente_id: str
    fecha_emision: datetime
    fecha_vencimiento: datetime
    estado: str = Field(default="VIGENTE")
    observaciones: Optional[str] = None
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class TucResponse(BaseModel):
    id: str
    nro_tuc: str
    vehiculo_id: str
    empresa_id: str
    expediente_id: str
    fecha_emision: datetime
    fecha_vencimiento: datetime
    estado: str
    observaciones: Optional[str]
    esta_activo: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True 