from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from enum import Enum

class TipoFiscalizacion(str, Enum):
    OPERATIVO_RUTA = "OPERATIVO_RUTA"
    OPERATIVO_TERMINAL = "OPERATIVO_TERMINAL"
    OPERATIVO_EMPRESA = "OPERATIVO_EMPRESA"
    OPERATIVO_VEHICULO = "OPERATIVO_VEHICULO"
    OPERATIVO_CONDUCTOR = "OPERATIVO_CONDUCTOR"
    DENUNCIA_CIUDADANA = "DENUNCIA_CIUDADANA"
    VERIFICACION_DOCUMENTARIA = "VERIFICACION_DOCUMENTARIA"
    OTRO = "OTRO"

class EstadoFiscalizacion(str, Enum):
    PLANIFICADA = "PLANIFICADA"
    EN_CURSO = "EN_CURSO"
    FINALIZADA = "FINALIZADA"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"

class ResultadoFiscalizacion(str, Enum):
    SIN_INCIDENCIAS = "SIN_INCIDENCIAS"
    CON_INCIDENCIAS_LEVES = "CON_INCIDENCIAS_LEVES"
    CON_INCIDENCIAS_GRAVES = "CON_INCIDENCIAS_GRAVES"
    CON_INCIDENCIAS_MUY_GRAVES = "CON_INCIDENCIAS_MUY_GRAVES"

class FiscalizacionBase(BaseModel):
    codigo: str = Field(..., description="Código de la fiscalización")
    tipo: TipoFiscalizacion = Field(..., description="Tipo de fiscalización")
    descripcion: str = Field(..., min_length=10, max_length=1000, description="Descripción del operativo")
    fecha_planificada: datetime = Field(..., description="Fecha planificada para la fiscalización")
    fecha_inicio: Optional[datetime] = Field(None, description="Fecha de inicio real")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de finalización real")
    ubicacion: str = Field(..., min_length=5, max_length=200, description="Ubicación del operativo")
    coordenadas: Optional[dict] = Field(None, description="Coordenadas geográficas del operativo")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales")
    
    @validator('codigo')
    def validar_codigo(cls, v):
        if not v.startswith('FIS-') or not v.count('-') == 2:
            raise ValueError("El código de fiscalización debe seguir el formato FIS-XXX-YYYY")
        return v
    
    @validator('fecha_inicio', 'fecha_fin')
    def validar_fechas(cls, v, values):
        if 'fecha_planificada' in values and v and v < values['fecha_planificada']:
            raise ValueError("Las fechas de inicio y fin no pueden ser anteriores a la fecha planificada")
        return v

class FiscalizacionCreate(FiscalizacionBase):
    pass

class FiscalizacionUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=10, max_length=1000)
    fecha_planificada: Optional[datetime] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    ubicacion: Optional[str] = Field(None, min_length=5, max_length=200)
    coordenadas: Optional[dict] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    estado: Optional[EstadoFiscalizacion] = None
    resultado: Optional[ResultadoFiscalizacion] = None

class FiscalizacionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    codigo: str
    tipo: TipoFiscalizacion
    descripcion: str
    fecha_planificada: datetime
    fecha_inicio: Optional[datetime]
    fecha_fin: Optional[datetime]
    ubicacion: str
    coordenadas: Optional[dict]
    observaciones: Optional[str]
    estado: EstadoFiscalizacion = Field(default=EstadoFiscalizacion.PLANIFICADA)
    resultado: Optional[ResultadoFiscalizacion] = None
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")
    fecha_actualizacion: Optional[datetime] = Field(None, alias="fechaActualizacion")
    usuario_registro_id: str = Field(..., alias="usuarioRegistroId")
    usuario_responsable_id: str = Field(..., alias="usuarioResponsableId")
    equipo_fiscalizacion_ids: List[str] = Field(default_factory=list, alias="equipoFiscalizacionIds")
    infracciones_detectadas_ids: List[str] = Field(default_factory=list, alias="infraccionesDetectadasIds")
    vehiculos_fiscalizados_ids: List[str] = Field(default_factory=list, alias="vehiculosFiscalizadosIds")
    conductores_fiscalizados_ids: List[str] = Field(default_factory=list, alias="conductoresFiscalizadosIds")
    empresas_fiscalizadas_ids: List[str] = Field(default_factory=list, alias="empresasFiscalizadasIds")
    documentos_evidencia_ids: List[str] = Field(default_factory=list, alias="documentosEvidenciaIds")
    costo_operativo: Optional[float] = Field(None, ge=0, alias="costoOperativo")
    personal_involucrado: int = Field(default=1, ge=1, alias="personalInvolucrado")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class FiscalizacionResponse(BaseModel):
    id: str
    codigo: str
    tipo: TipoFiscalizacion
    descripcion: str
    fecha_planificada: datetime
    fecha_inicio: Optional[datetime]
    fecha_fin: Optional[datetime]
    ubicacion: str
    coordenadas: Optional[dict]
    observaciones: Optional[str]
    estado: EstadoFiscalizacion
    resultado: Optional[ResultadoFiscalizacion]
    esta_activo: bool
    fecha_registro: datetime
    fecha_actualizacion: Optional[datetime]
    usuario_registro_id: str
    usuario_responsable_id: str
    equipo_fiscalizacion_ids: List[str]
    infracciones_detectadas_ids: List[str]
    vehiculos_fiscalizados_ids: List[str]
    conductores_fiscalizados_ids: List[str]
    empresas_fiscalizadas_ids: List[str]
    documentos_evidencia_ids: List[str]
    costo_operativo: Optional[float]
    personal_involucrado: int

    class Config:
        from_attributes = True

class FiscalizacionFiltros(BaseModel):
    codigo: Optional[str] = None
    tipo: Optional[TipoFiscalizacion] = None
    estado: Optional[EstadoFiscalizacion] = None
    resultado: Optional[ResultadoFiscalizacion] = None
    usuario_responsable_id: Optional[str] = None
    fecha_planificada_desde: Optional[datetime] = None
    fecha_planificada_hasta: Optional[datetime] = None
    fecha_inicio_desde: Optional[datetime] = None
    fecha_inicio_hasta: Optional[datetime] = None
    ubicacion: Optional[str] = None
    tiene_infracciones: Optional[bool] = None
    costo_operativo_min: Optional[float] = None
    costo_operativo_max: Optional[float] = None 