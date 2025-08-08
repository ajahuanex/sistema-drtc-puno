from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class DatosTecnicos(BaseModel):
    motor: str = Field(..., description="Tipo de motor")
    chasis: str = Field(..., description="Número de chasis")
    ejes: int = Field(..., ge=1, description="Número de ejes")
    asientos: int = Field(..., ge=1, description="Número de asientos")
    peso_neto: float = Field(..., ge=0, description="Peso neto en kg")
    peso_bruto: float = Field(..., ge=0, description="Peso bruto en kg")
    medidas: dict = Field(..., description="Medidas del vehículo")

class Tuc(BaseModel):
    nro_tuc: str = Field(..., description="Número de TUC")
    fecha_emision: datetime = Field(..., description="Fecha de emisión del TUC")

class VehiculoBase(BaseModel):
    placa: str = Field(..., pattern=r'^[A-Z]{1,2}\d{1,4}-[A-Z]{1,3}$', description="Placa del vehículo")
    empresa_actual_id: str = Field(..., description="ID de la empresa actual")
    resolucion_id: Optional[str] = Field(None, description="ID de la resolución")
    rutas_asignadas_ids: List[str] = Field(default_factory=list, description="IDs de rutas asignadas")
    categoria: str = Field(..., description="Categoría del vehículo (M1, M2, M3, N1, N2, N3)")
    marca: str = Field(..., description="Marca del vehículo")
    anio_fabricacion: int = Field(..., ge=1900, le=2030, description="Año de fabricación")
    estado: str = Field(default="ACTIVO", description="Estado del vehículo")
    datos_tecnicos: DatosTecnicos = Field(..., description="Datos técnicos del vehículo")
    tuc: Optional[Tuc] = Field(None, description="Información del TUC")

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoUpdate(BaseModel):
    placa: Optional[str] = Field(None, pattern=r'^[A-Z]{1,2}\d{1,4}-[A-Z]{1,3}$')
    empresa_actual_id: Optional[str] = None
    resolucion_id: Optional[str] = None
    rutas_asignadas_ids: Optional[List[str]] = None
    categoria: Optional[str] = None
    marca: Optional[str] = None
    anio_fabricacion: Optional[int] = Field(None, ge=1900, le=2030)
    estado: Optional[str] = None
    datos_tecnicos: Optional[DatosTecnicos] = None
    tuc: Optional[Tuc] = None

class VehiculoInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    placa: str
    empresa_actual_id: str
    resolucion_id: Optional[str] = None
    rutas_asignadas_ids: List[str] = Field(default_factory=list)
    categoria: str
    marca: str
    anio_fabricacion: int
    estado: str = Field(default="ACTIVO")
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")
    datos_tecnicos: DatosTecnicos
    tuc: Optional[Tuc] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class VehiculoResponse(BaseModel):
    id: str
    placa: str
    empresa_actual_id: str
    resolucion_id: Optional[str]
    rutas_asignadas_ids: List[str]
    categoria: str
    marca: str
    anio_fabricacion: int
    estado: str
    esta_activo: bool
    fecha_registro: datetime
    datos_tecnicos: DatosTecnicos
    tuc: Optional[Tuc]

    class Config:
        from_attributes = True 