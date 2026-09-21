from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class BajaExternaBase(BaseModel):
    placa: str = Field(..., description="Placa del vehículo dado de baja")
    ruc_empresa: str = Field(..., description="RUC de la empresa donde estaba el vehículo")
    razon_social: str = Field(..., description="Razón social de la empresa")
    motivo: str = Field(..., description="Motivo de la baja (ej. Habilitado en MTC Lima, Habilitado en otra empresa)")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    archivo_evidencia: Optional[str] = Field(None, description="URL o path del archivo de evidencia (PDF o imagen)")

    @validator('placa')
    def uppercase_placa(cls, v):
        if v:
            return v.upper().strip()
        return v

class BajaExternaCreate(BajaExternaBase):
    pass

class BajaExternaUpdate(BaseModel):
    estado_notificacion: Optional[str] = Field(None, description="PENDIENTE o NOTIFICADO")
    observaciones: Optional[str] = None
    archivo_evidencia: Optional[str] = None

class BajaExternaResponse(BajaExternaBase):
    id: str = Field(..., alias="_id")
    estado_notificacion: str = Field(default="PENDIENTE", description="Estado de la notificación")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    fecha_notificacion: Optional[datetime] = None
    registrado_por: Optional[str] = None # DNI del usuario que registró

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
