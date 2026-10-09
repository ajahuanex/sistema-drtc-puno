from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .base import CamelModel

class BajaExternaBase(CamelModel):
    tipo_baja: str = Field(default="EXTERNA", description="Tipo de baja: EXTERNA (MTC/otra región) o LOCAL (Regional Puno)")
    placa: str = Field(..., description="Placa del vehículo dado de baja")
    ruc_empresa: Optional[str] = Field(None, description="RUC de la empresa donde estaba el vehículo (opcional)")
    razon_social: Optional[str] = Field(None, description="Razón social de la empresa (opcional)")
    motivo: Optional[str] = Field(None, description="Motivo de la baja (opcional)")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales (opcional)")
    archivo_evidencia: Optional[str] = Field(None, description="URL o path del archivo de evidencia (opcional)")
    entidad_destino: Optional[str] = Field(None, description="Entidad a la que se notifica (ej. MTC, SUTRAN, Empresa)")
    numero_oficio: Optional[str] = Field(None, description="Número de oficio o documento de notificación")

    @validator('placa')
    def uppercase_placa(cls, v):
        if v:
            return v.upper().strip()
        return v

class BajaExternaCreate(BajaExternaBase):
    pass

class BajaExternaUpdate(CamelModel):
    estado_notificacion: Optional[str] = Field(None, description="PENDIENTE o NOTIFICADO")
    observaciones: Optional[str] = None
    archivo_evidencia: Optional[str] = None
    numero_oficio: Optional[str] = None
    entidad_destino: Optional[str] = None

class BajaExternaResponse(BajaExternaBase):
    id: str = Field(..., alias="_id")
    estado_notificacion: str = Field(default="PENDIENTE", description="Estado de la notificación")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    fecha_notificacion: Optional[datetime] = None
    registrado_por: Optional[str] = None # DNI o usuario que registró

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
