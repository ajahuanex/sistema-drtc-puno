from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class TipoDocumento(str, Enum):
    RESOLUCION = "RESOLUCION"
    TUC = "TUC"
    CERTIFICADO = "CERTIFICADO"
    ACTA_FISCALIZACION = "ACTA_FISCALIZACION"
    EXPEDIENTE = "EXPEDIENTE"
    LICENCIA_CONDUCIR = "LICENCIA_CONDUCIR"
    CERTIFICADO_VEHICULAR = "CERTIFICADO_VEHICULAR"
    DNI = "DNI"
    RUC = "RUC"
    OTRO = "OTRO"

class EstadoDocumento(str, Enum):
    PENDIENTE = "PENDIENTE"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"
    VENCIDO = "VENCIDO"
    ANULADO = "ANULADO"

class FormatoDocumento(str, Enum):
    PDF = "PDF"
    DOC = "DOC"
    DOCX = "DOCX"
    XLS = "XLS"
    XLSX = "XLSX"
    JPG = "JPG"
    PNG = "PNG"
    TIFF = "TIFF"

class Documento(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    nombreArchivo: str
    nombreOriginal: str
    url: str
    tipoDocumento: TipoDocumento
    entidadAsociadaId: str
    entidadAsociadaTipo: str  # "EMPRESA", "VEHICULO", "CONDUCTOR", "RESOLUCION", "TUC", etc.
    formato: FormatoDocumento
    tamanioBytes: int
    hashArchivo: str  # Para verificar integridad
    estado: EstadoDocumento = EstadoDocumento.PENDIENTE
    fechaSubida: datetime = Field(default_factory=datetime.utcnow)
    fechaVencimiento: Optional[datetime] = None
    usuarioSubidaId: str
    usuarioSubidaNombre: str
    observaciones: Optional[str] = None
    metadatos: Optional[dict] = {}  # Información adicional del documento
    version: int = 1
    documentoAnteriorId: Optional[str] = None  # Para versiones
    estaActivo: bool = True
    fechaActualizacion: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombreArchivo": "resolucion_R-1234-2025.pdf",
                "nombreOriginal": "Resolución de Autorización.pdf",
                "url": "https://storage.drtc.gob.pe/documentos/resoluciones/R-1234-2025.pdf",
                "tipoDocumento": "RESOLUCION",
                "entidadAsociadaId": "507f1f77bcf86cd799439011",
                "entidadAsociadaTipo": "RESOLUCION",
                "formato": "PDF",
                "tamanioBytes": 2048576,
                "hashArchivo": "sha256:abc123...",
                "estado": "APROBADO",
                "usuarioSubidaId": "507f1f77bcf86cd799439012",
                "usuarioSubidaNombre": "Juan Perez"
            }
        }

class DocumentoCreate(BaseModel):
    nombreArchivo: str
    nombreOriginal: str
    url: str
    tipoDocumento: TipoDocumento
    entidadAsociadaId: str
    entidadAsociadaTipo: str
    formato: FormatoDocumento
    tamanioBytes: int
    hashArchivo: str
    fechaVencimiento: Optional[datetime] = None
    observaciones: Optional[str] = None
    metadatos: Optional[dict] = {}

class DocumentoUpdate(BaseModel):
    nombreArchivo: Optional[str] = None
    estado: Optional[EstadoDocumento] = None
    fechaVencimiento: Optional[datetime] = None
    observaciones: Optional[str] = None
    metadatos: Optional[dict] = None

class DocumentoFiltros(BaseModel):
    tipoDocumento: Optional[TipoDocumento] = None
    entidadAsociadaId: Optional[str] = None
    entidadAsociadaTipo: Optional[str] = None
    estado: Optional[EstadoDocumento] = None
    formato: Optional[FormatoDocumento] = None
    fechaSubidaDesde: Optional[datetime] = None
    fechaSubidaHasta: Optional[datetime] = None
    fechaVencimientoDesde: Optional[datetime] = None
    fechaVencimientoHasta: Optional[datetime] = None
    usuarioSubidaId: Optional[str] = None
    estaActivo: Optional[bool] = None

class DocumentoResponse(BaseModel):
    id: str
    nombreArchivo: str
    nombreOriginal: str
    url: str
    tipoDocumento: TipoDocumento
    entidadAsociadaId: str
    entidadAsociadaTipo: str
    formato: FormatoDocumento
    tamanioBytes: int
    hashArchivo: str
    estado: EstadoDocumento
    fechaSubida: datetime
    fechaVencimiento: Optional[datetime]
    usuarioSubidaId: str
    usuarioSubidaNombre: str
    observaciones: Optional[str]
    metadatos: dict
    version: int
    documentoAnteriorId: Optional[str]
    estaActivo: bool
    fechaActualizacion: Optional[datetime]

class DocumentoEstadisticas(BaseModel):
    totalDocumentos: int
    documentosPorTipo: dict
    documentosPorEstado: dict
    documentosPorFormato: dict
    tamanioTotalBytes: int
    documentosVencidos: int
    documentosVencidosProximamente: int
    promedioTamanioBytes: float

class DocumentoVersion(BaseModel):
    version: int
    fechaSubida: datetime
    usuarioSubidaNombre: str
    cambios: str
    estaActivo: bool

class DocumentoHistorial(BaseModel):
    documentoId: str
    versiones: List[DocumentoVersion]
    fechaCreacion: datetime
    ultimaActualizacion: datetime 