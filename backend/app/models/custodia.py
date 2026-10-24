from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .base import CamelModel, MongoCamelModel

class MovimientoPrestamo(CamelModel):
    """Registro histórico de préstamo o salida temporal del expediente en custodia"""
    id: Optional[str] = None
    solicitante: str = Field(..., description="Nombre del funcionario o servidor que recibe el expediente")
    area_solicitante: str = Field(..., description="Oficina o área técnica solicitante (ej. Asesoría Jurídica, DCT, Fiscalización)")
    cargo_solicitante: Optional[str] = Field(None, description="Cargo o puesto del solicitante")
    documento_requerimiento: Optional[str] = Field(None, description="Proveído, memo o papeleta de solicitud de desarchive")
    motivo_prestamo: Optional[str] = Field(None, description="Motivo del préstamo (revisión legal, emisión de informe, etc.)")
    fecha_prestamo: datetime = Field(default_factory=datetime.utcnow)
    fecha_limite_devolucion: Optional[str] = Field(None, description="Fecha pactada de devolución (YYYY-MM-DD)")
    fecha_devolucion_real: Optional[datetime] = None
    devuelto: bool = Field(default=False)
    observaciones_devolucion: Optional[str] = None
    registrado_por: Optional[str] = None

class DocumentoAcumulado(CamelModel):
    """Documento o actuado complementario acumulado al documento principal en custodia"""
    id: Optional[str] = None
    tipo_documento: Optional[str] = Field(default="MEMORANDUM", description="MEMORANDUM, OFICIO, RESOLUCION, INFORME, OTRO")
    nro_documento: Optional[str] = Field(None, description="N° de Documento acumulado (Memo, Oficio, Res, etc.)")
    fecha_documento: Optional[str] = Field(None, description="Fecha del documento acumulado")
    folios_agregados: int = Field(default=0, ge=0, description="Cantidad de folios sumados al acervo")
    asunto: Optional[str] = Field(None, description="Asunto o sumilla del documento acumulado")
    area_remitente: Optional[str] = Field(default="SUB DIRECCION DE TRANSPORTE TERRESTRE")
    remitente_nombre: Optional[str] = Field(default="Lic. Edgar Burneo Gonzales")
    archivo_adjunto: Optional[str] = None
    nombre_archivo: Optional[str] = None
    fecha_acumulacion: datetime = Field(default_factory=datetime.utcnow)
    registrado_por: Optional[str] = None

class DocumentoCustodiaBase(CamelModel):
    # Identificación del Documento de remisión (Memorándum, Oficio u otro - Opcional)
    nro_memorandum: Optional[str] = Field(None, description="Número de Memorándum, Oficio o documento de envío (opcional)")
    fecha_memorandum: Optional[str] = Field(None, description="Fecha del documento de remisión (YYYY-MM-DD)")
    area_remitente: str = Field(default="SUB DIRECCION DE TRANSPORTE TERRESTRE", description="Área o dependencia que remite a custodia")
    remitente_nombre: Optional[str] = Field(default="Lic. Edgar Burneo Gonzales", description="Nombre de quien suscribe o remite")
    asunto_memorandum: Optional[str] = Field(None, description="Asunto o sumilla del documento de envío")

    # Datos del Expediente / Documentación custodiada (Expediente, Oficio, Resolución, Informe, etc. - Opcional)
    nro_expediente: Optional[str] = Field(None, description="N° de Expediente, Oficio, Resolución o Informe custodiado (opcional)")
    fecha_expediente: Optional[str] = Field(None, description="Fecha de origen del documento (YYYY-MM-DD)")
    nro_folios: int = Field(default=1, ge=1, description="Número de folios útiles verificados")
    nro_tomos: int = Field(default=1, ge=1, description="Cantidad de tomos o carpetas físicas")
    asunto_expediente: Optional[str] = Field(default="Documento derivado a custodia", description="Materia o asunto del documento o trámite")
    tipo_tramite: Optional[str] = Field(default="TRAMITE_GENERAL", description="Tipo de trámite en materia de transportes")

    # Vinculación institucional con Administrado / Empresa de Transporte
    ruc: Optional[str] = Field(None, description="RUC de la empresa o DNI del administrado")
    razon_social: Optional[str] = Field(None, description="Razón social de la empresa o nombre del administrado")
    nro_resolucion: Optional[str] = Field(None, description="N° de Resolución Directoral vinculada si concluyó en acto administrativo")

    # Ubicación física en el Archivo / Almacén de Custodia
    ubicacion_estante: Optional[str] = Field(None, description="Estante, cuerpo o módulo (ej. Estante 02)")
    ubicacion_archivador: Optional[str] = Field(None, description="Archivador, caja o gaveta (ej. Archivador A-14 / Caja 05)")
    codigo_ubicacion: Optional[str] = Field(None, description="Código marbete resumen (ej. EST-02/CAJ-05/A-14)")
    estado_conservacion: str = Field(default="BUENO", description="Estado físico: BUENO, REGULAR, DETERIORADO")

    # Estado de Custodia
    estado_custodia: str = Field(default="EN_CUSTODIA", description="EN_CUSTODIA, PRESTADO, DEVUELTO, TRANSFERIDO_ARCHIVO_CENTRAL")
    
    # Archivos Adjuntos (Rutas relativas a /uploads/...)
    archivo_memo: Optional[str] = Field(None, description="Path del archivo escaneado del Memorándum")
    nombre_archivo_memo: Optional[str] = None
    archivo_expediente: Optional[str] = Field(None, description="Path del archivo escaneado del Expediente")
    nombre_archivo_expediente: Optional[str] = None

    # Trazabilidad
    observaciones: Optional[str] = Field(None, description="Observaciones técnicas o particularidades físicas del expediente")
    documentos_acumulados: List[DocumentoAcumulado] = Field(default_factory=list)

class DocumentoCustodiaCreate(DocumentoCustodiaBase):
    pass

class DocumentoCustodiaUpdate(CamelModel):
    nro_memorandum: Optional[str] = None
    fecha_memorandum: Optional[str] = None
    area_remitente: Optional[str] = None
    remitente_nombre: Optional[str] = None
    asunto_memorandum: Optional[str] = None
    nro_expediente: Optional[str] = None
    fecha_expediente: Optional[str] = None
    nro_folios: Optional[int] = None
    nro_tomos: Optional[int] = None
    asunto_expediente: Optional[str] = None
    tipo_tramite: Optional[str] = None
    ruc: Optional[str] = None
    razon_social: Optional[str] = None
    nro_resolucion: Optional[str] = None
    ubicacion_estante: Optional[str] = None
    ubicacion_archivador: Optional[str] = None
    codigo_ubicacion: Optional[str] = None
    estado_conservacion: Optional[str] = None
    estado_custodia: Optional[str] = None
    archivo_memo: Optional[str] = None
    nombre_archivo_memo: Optional[str] = None
    archivo_expediente: Optional[str] = None
    nombre_archivo_expediente: Optional[str] = None
    observaciones: Optional[str] = None
    documentos_acumulados: Optional[List[DocumentoAcumulado]] = None

class DocumentoCustodiaResponse(DocumentoCustodiaBase):
    id: str = Field(..., alias="_id")
    codigo_custodia: Optional[str] = None
    fecha_ingreso_custodia: datetime = Field(default_factory=datetime.utcnow)
    registrado_por: Optional[str] = None
    prestamo_actual: Optional[MovimientoPrestamo] = None
    historial_prestamos: List[MovimientoPrestamo] = Field(default_factory=list)
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
