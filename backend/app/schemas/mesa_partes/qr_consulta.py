"""
Schemas para consulta pública por QR
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DerivacionPublicaSchema(BaseModel):
    """Schema para derivación en consulta pública"""
    area_origen: str
    area_destino: str
    fecha_derivacion: datetime
    estado: str
    
    class Config:
        from_attributes = True


class DocumentoPublicoSchema(BaseModel):
    """Schema para documento en consulta pública (sin información sensible)"""
    numero_expediente: str
    tipo_documento: str
    asunto: str
    estado: str
    prioridad: str
    fecha_recepcion: datetime
    area_actual: Optional[str] = None
    historial: List[DerivacionPublicaSchema] = []
    
    class Config:
        from_attributes = True


class QRConsultaResponse(BaseModel):
    """Respuesta de consulta por QR"""
    success: bool
    documento: Optional[DocumentoPublicoSchema] = None
    mensaje: Optional[str] = None
