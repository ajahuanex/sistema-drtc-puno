from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SustitucionRequest(BaseModel):
    ruc_empresa: str = Field(..., description="RUC de la empresa donde se realiza la sustitución")
    
    # Datos de la baja
    placa_baja: str = Field(..., description="Placa del vehículo que sale")
    
    # Datos del alta
    placa_alta: str = Field(..., description="Placa del vehículo que ingresa")
    
    # Datos de la resolución
    numero_resolucion: str = Field(..., description="Número de la resolución de sustitución")
    fecha_resolucion: datetime = Field(..., description="Fecha de emisión de la resolución")
    archivo_resolucion: Optional[str] = Field(None, description="URL del archivo subido")
    
    # Rutas y modificaciones
    rutas_heredadas: List[str] = Field(default_factory=list, description="Lista de IDs o códigos de rutas que hereda")
    modifico_rutas: bool = Field(default=False, description="¿Modificó las rutas por defecto?")
    motivo_modificacion_rutas: Optional[str] = Field(None, description="Requerido si modifico_rutas es True")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
