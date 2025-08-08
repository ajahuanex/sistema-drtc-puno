from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class EstadoEmpresa(str, Enum):
    HABILITADA = "HABILITADA"
    EN_TRAMITE = "EN_TRAMITE"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

class TipoDocumento(str, Enum):
    RUC = "RUC"
    DNI = "DNI"
    LICENCIA_CONDUCIR = "LICENCIA_CONDUCIR"
    CERTIFICADO_VEHICULAR = "CERTIFICADO_VEHICULAR"
    RESOLUCION = "RESOLUCION"
    TUC = "TUC"
    OTRO = "OTRO"

class RazonSocial(BaseModel):
    principal: str = Field(..., min_length=3, max_length=200, description="Razón social principal")
    sunat: Optional[str] = Field(None, max_length=200, description="Razón social SUNAT")
    minimo: Optional[str] = Field(None, max_length=200, description="Razón social mínima")
    
    @validator('principal')
    def validar_razon_social(cls, v):
        if not v.strip():
            raise ValueError("La razón social no puede estar vacía")
        return v.strip()

class RepresentanteLegal(BaseModel):
    dni: str = Field(..., pattern=r'^\d{8}$', description="DNI del representante legal")
    nombres: str = Field(..., min_length=2, max_length=100, description="Nombres del representante legal")
    apellidos: str = Field(..., min_length=2, max_length=100, description="Apellidos del representante legal")
    email: Optional[EmailStr] = Field(None, description="Email del representante legal")
    telefono: Optional[str] = Field(None, pattern=r'^\d{9}$', description="Teléfono del representante legal")
    direccion: Optional[str] = Field(None, max_length=200, description="Dirección del representante legal")
    
    @validator('dni')
    def validar_dni(cls, v):
        if not v.isdigit() or len(v) != 8:
            raise ValueError("El DNI debe tener 8 dígitos")
        return v

class DocumentoEmpresa(BaseModel):
    tipo: TipoDocumento
    numero: str = Field(..., description="Número del documento")
    fecha_emision: datetime = Field(..., description="Fecha de emisión")
    fecha_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento")
    url_documento: Optional[str] = Field(None, description="URL del documento digitalizado")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones del documento")
    esta_activo: bool = Field(default=True, description="Estado del documento")

class AuditoriaEmpresa(BaseModel):
    fecha_cambio: datetime = Field(default_factory=datetime.utcnow)
    usuario_id: str = Field(..., description="ID del usuario que realizó el cambio")
    tipo_cambio: str = Field(..., description="Tipo de cambio realizado")
    campo_anterior: Optional[str] = Field(None, description="Valor anterior del campo")
    campo_nuevo: Optional[str] = Field(None, description="Valor nuevo del campo")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones del cambio")

class EmpresaBase(BaseModel):
    ruc: str = Field(..., pattern=r'^\d{11}$', description="RUC de la empresa")
    razon_social: RazonSocial = Field(..., alias="razonSocial")
    direccion_fiscal: str = Field(..., min_length=10, max_length=200, alias="direccionFiscal")
    representante_legal: RepresentanteLegal = Field(..., alias="representanteLegal")
    email_contacto: Optional[EmailStr] = Field(None, description="Email de contacto de la empresa")
    telefono_contacto: Optional[str] = Field(None, pattern=r'^\d{9}$', description="Teléfono de contacto")
    sitio_web: Optional[str] = Field(None, description="Sitio web de la empresa")
    
    @validator('ruc')
    def validar_ruc(cls, v):
        if not v.isdigit() or len(v) != 11:
            raise ValueError("El RUC debe tener 11 dígitos")
        return v
    
    @validator('direccion_fiscal')
    def validar_direccion(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("La dirección fiscal debe tener al menos 10 caracteres")
        return v.strip()

class EmpresaCreate(EmpresaBase):
    documentos: Optional[List[DocumentoEmpresa]] = Field(default_factory=list, description="Documentos de la empresa")

class EmpresaUpdate(BaseModel):
    ruc: Optional[str] = Field(None, pattern=r'^\d{11}$')
    razon_social: Optional[RazonSocial] = Field(None, alias="razonSocial")
    direccion_fiscal: Optional[str] = Field(None, min_length=10, max_length=200, alias="direccionFiscal")
    representante_legal: Optional[RepresentanteLegal] = Field(None, alias="representanteLegal")
    estado: Optional[EstadoEmpresa] = None
    email_contacto: Optional[EmailStr] = None
    telefono_contacto: Optional[str] = Field(None, pattern=r'^\d{9}$')
    sitio_web: Optional[str] = None
    documentos: Optional[List[DocumentoEmpresa]] = None

class EmpresaInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    ruc: str
    razon_social: RazonSocial = Field(..., alias="razonSocial")
    direccion_fiscal: str = Field(..., alias="direccionFiscal")
    estado: EstadoEmpresa = Field(default=EstadoEmpresa.EN_TRAMITE)
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")
    fecha_actualizacion: Optional[datetime] = Field(None, alias="fechaActualizacion")
    representante_legal: RepresentanteLegal = Field(..., alias="representanteLegal")
    email_contacto: Optional[str] = Field(None, alias="emailContacto")
    telefono_contacto: Optional[str] = Field(None, alias="telefonoContacto")
    sitio_web: Optional[str] = Field(None, alias="sitioWeb")
    documentos: List[DocumentoEmpresa] = Field(default_factory=list)
    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list, alias="auditoria")
    resoluciones_primigenias_ids: List[str] = Field(default_factory=list, alias="resolucionesPrimigeniasIds")
    vehiculos_habilitados_ids: List[str] = Field(default_factory=list, alias="vehiculosHabilitadosIds")
    conductores_habilitados_ids: List[str] = Field(default_factory=list, alias="conductoresHabilitadosIds")
    rutas_autorizadas_ids: List[str] = Field(default_factory=list, alias="rutasAutorizadasIds")
    datos_sunat: Optional[Dict[str, Any]] = Field(None, alias="datosSunat")
    ultima_validacion_sunat: Optional[datetime] = Field(None, alias="ultimaValidacionSunat")
    score_riesgo: Optional[int] = Field(None, ge=0, le=100, alias="scoreRiesgo")
    observaciones: Optional[str] = Field(None, max_length=1000, alias="observaciones")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class EmpresaResponse(BaseModel):
    id: str
    ruc: str
    razon_social: RazonSocial
    direccion_fiscal: str
    estado: EstadoEmpresa
    esta_activo: bool
    fecha_registro: datetime
    fecha_actualizacion: Optional[datetime]
    representante_legal: RepresentanteLegal
    email_contacto: Optional[str]
    telefono_contacto: Optional[str]
    sitio_web: Optional[str]
    documentos: List[DocumentoEmpresa]
    auditoria: List[AuditoriaEmpresa]
    resoluciones_primigenias_ids: List[str]
    vehiculos_habilitados_ids: List[str]
    conductores_habilitados_ids: List[str]
    rutas_autorizadas_ids: List[str]
    datos_sunat: Optional[Dict[str, Any]]
    ultima_validacion_sunat: Optional[datetime]
    score_riesgo: Optional[int]
    observaciones: Optional[str]

    class Config:
        from_attributes = True

class EmpresaEstadisticas(BaseModel):
    total_empresas: int
    empresas_habilitadas: int
    empresas_en_tramite: int
    empresas_suspendidas: int
    empresas_canceladas: int
    empresas_dadas_de_baja: int
    empresas_con_documentos_vencidos: int
    empresas_con_score_alto_riesgo: int
    promedio_vehiculos_por_empresa: float
    promedio_conductores_por_empresa: float

class EmpresaFiltros(BaseModel):
    ruc: Optional[str] = None
    razon_social: Optional[str] = None
    estado: Optional[EstadoEmpresa] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
    score_riesgo_min: Optional[int] = None
    score_riesgo_max: Optional[int] = None
    tiene_documentos_vencidos: Optional[bool] = None
    tiene_vehiculos: Optional[bool] = None
    tiene_conductores: Optional[bool] = None 