from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class TipoEmisionTuc(str, Enum):
    ELECTRONICA = "ELECTRONICA"
    FISICA = "FISICA"

class EstadoTuc(str, Enum):
    VIGENTE = "VIGENTE"
    ANULADA = "ANULADA"
    REEMPLAZADA = "REEMPLAZADA"
    ANULADA_POR_DUPLICADO = "ANULADA_POR_DUPLICADO"
    VENCIDA = "VENCIDA"

class MotivoEmision(str, Enum):
    AUTORIZACION_NUEVA = "AUTORIZACION_NUEVA"
    RENOVACION = "RENOVACION"
    RENOVACION_AUTORIZACION = "RENOVACION"
    DUPLICADO_PERDIDA = "DUPLICADO_PERDIDA"
    DUPLICADO_DETERIORO = "DUPLICADO_DETERIORO"
    DUPLICADO_ROBO = "DUPLICADO_ROBO"
    DUPLICADO_TUC = "DUPLICADO_PERDIDA"
    CANJE_TUC = "CANJE_A_ELECTRONICA"
    CANJE_A_ELECTRONICA = "CANJE_A_ELECTRONICA"
    INCREMENTO_FLOTA = "INCREMENTO_FLOTA"
    SUSTITUCION_VEHICULO = "SUSTITUCION_VEHICULO"
    SUSTITUCION_VEHICULAR = "SUSTITUCION_VEHICULO"
    MODIFICACION = "MODIFICACION"
    FE_DE_ERRATAS = "FE_DE_ERRATAS"
    MIGRACION = "MIGRACION"
    HISTORICO_MIGRADO = "HISTORICO_MIGRADO"
    OTROS = "OTROS"

class Tuc(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    nroTuc: str
    tipoEmision: str
    estado: str
    motivoEmision: str
    placa: str
    vehiculoId: Optional[str] = None
    ruc: str
    razonSocial: str
    empresaId: Optional[str] = None
    nroResolucion: str
    resolucionId: Optional[str] = None
    nroResolucionHija: Optional[str] = None
    resolucionHijaId: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    
    # Trazabilidad con Expediente y Trámite
    nroExpediente: Optional[str] = None
    fechaExpediente: Optional[str] = None
    expedienteId: Optional[str] = None
    tipoTramite: Optional[str] = None
    tramiteId: Optional[str] = None
    origenEmision: Optional[str] = "CENTRO_TRAMITES"
    
    fechaEmision: str
    fechaVencimiento: Optional[str] = None
    hashSeguridad: Optional[str] = None
    qrVerificationUrl: Optional[str] = None
    loteKardexId: Optional[str] = None
    serieFisica: Optional[str] = None
    datosVehiculo: Optional[Dict[str, Any]] = None
    datosEmpresa: Optional[Dict[str, Any]] = None
    datosResolucion: Optional[Dict[str, Any]] = None
    rutasHabilitadas: List[Dict[str, Any]] = []
    observaciones: Optional[str] = None
    tucAnteriorId: Optional[str] = None
    historialCambios: List[Dict[str, Any]] = []
    fechaRegistro: Optional[str] = None
    fechaActualizacion: Optional[str] = None

class TucCreateRequest(BaseModel):
    nroTuc: Optional[str] = None
    tipoEmision: TipoEmisionTuc = TipoEmisionTuc.ELECTRONICA
    motivoEmision: MotivoEmision = MotivoEmision.AUTORIZACION_NUEVA
    placa: str
    ruc: str
    nroResolucion: str
    fechaEmision: str
    fechaVencimiento: Optional[str] = None
    loteKardexId: Optional[str] = None
    serieFisica: Optional[str] = None
    observaciones: Optional[str] = None
    tucAnteriorId: Optional[str] = None

class TucDuplicadoRequest(BaseModel):
    tucAnteriorId: str
    tipoEmision: TipoEmisionTuc = TipoEmisionTuc.ELECTRONICA
    motivo: MotivoEmision = MotivoEmision.DUPLICADO_PERDIDA
    loteKardexId: Optional[str] = None
    serieFisica: Optional[str] = None
    observaciones: Optional[str] = None

class TucKardexStock(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    lote: str
    serieInicial: str
    serieFinal: str
    cantidadTotal: int
    asignados: int = 0
    disponibles: int
    fechaIngreso: str
    observaciones: Optional[str] = None

class TucFiltros(BaseModel):
    q: Optional[str] = None
    nroTuc: Optional[str] = None
    placa: Optional[str] = None
    ruc: Optional[str] = None
    razonSocial: Optional[str] = None
    nroResolucion: Optional[str] = None
    nroExpediente: Optional[str] = None
    tipoTramite: Optional[str] = None
    tipoEmision: Optional[TipoEmisionTuc] = None
    estado: Optional[EstadoTuc] = None
    fechaEmisionDesde: Optional[str] = None
    fechaEmisionHasta: Optional[str] = None

class TucVerificacionPublica(BaseModel):
    nroTuc: str
    tipoEmision: str
    estado: str
    esVigente: bool
    mensajeEstado: str
    fechaEmision: str
    fechaVencimiento: Optional[str] = None
    hashSeguridad: Optional[str] = None
    nroExpediente: Optional[str] = None
    tipoTramite: Optional[str] = None
    empresa: Dict[str, Any]
    vehiculo: Dict[str, Any]
    resolucion: Dict[str, Any]
    rutas: List[Dict[str, Any]] = []
    observaciones: Optional[str] = None

# Aliases para retrocompatibilidad
TucCreate = TucCreateRequest
TucUpdate = Tuc
TucInDB = Tuc
TucResponse = Tuc