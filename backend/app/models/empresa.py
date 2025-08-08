from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class RazonSocial(BaseModel):
    principal: str = Field(..., description="Razón social principal")
    sunat: Optional[str] = Field(None, description="Razón social SUNAT")
    minimo: Optional[str] = Field(None, description="Razón social mínima")

class RepresentanteLegal(BaseModel):
    dni: str = Field(..., pattern=r'^\d{8}$', description="DNI del representante legal")
    nombres: str = Field(..., min_length=2, description="Nombres del representante legal")

class EmpresaBase(BaseModel):
    ruc: str = Field(..., pattern=r'^\d{11}$', description="RUC de la empresa")
    razon_social: RazonSocial = Field(..., alias="razonSocial")
    direccion_fiscal: str = Field(..., min_length=10, alias="direccionFiscal")
    representante_legal: RepresentanteLegal = Field(..., alias="representanteLegal")

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    ruc: Optional[str] = Field(None, pattern=r'^\d{11}$')
    razon_social: Optional[RazonSocial] = Field(None, alias="razonSocial")
    direccion_fiscal: Optional[str] = Field(None, min_length=10, alias="direccionFiscal")
    representante_legal: Optional[RepresentanteLegal] = Field(None, alias="representanteLegal")
    estado: Optional[str] = None

class EmpresaInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    ruc: str
    razon_social: RazonSocial = Field(..., alias="razonSocial")
    direccion_fiscal: str = Field(..., alias="direccionFiscal")
    estado: str = Field(default="HABILITADA")
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")
    representante_legal: RepresentanteLegal = Field(..., alias="representanteLegal")
    resoluciones_primigenias_ids: List[str] = Field(default_factory=list, alias="resolucionesPrimigeniasIds")
    vehiculos_habilitados_ids: List[str] = Field(default_factory=list, alias="vehiculosHabilitadosIds")
    conductores_habilitados_ids: List[str] = Field(default_factory=list, alias="conductoresHabilitadosIds")
    rutas_autorizadas_ids: List[str] = Field(default_factory=list, alias="rutasAutorizadasIds")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class EmpresaResponse(BaseModel):
    id: str
    ruc: str
    razon_social: RazonSocial
    direccion_fiscal: str
    estado: str
    esta_activo: bool
    fecha_registro: datetime
    representante_legal: RepresentanteLegal
    resoluciones_primigenias_ids: List[str]
    vehiculos_habilitados_ids: List[str]
    conductores_habilitados_ids: List[str]
    rutas_autorizadas_ids: List[str]

    class Config:
        from_attributes = True 