"""
Modelos Pydantic para el módulo Flota Empresa.
Colección MongoDB: flota_empresa
"""
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class EstadoVehiculoEmpresa(str, Enum):
    HABILITADO = "HABILITADO"
    INHABILITADO = "INHABILITADO"
    OBSERVADO = "OBSERVADO"
    CANCELADO = "CANCELADO"
    SUSPENDIDO = "SUSPENDIDO"


class TipoResolucionHija(str, Enum):
    INCREMENTO = "I"
    SUSTITUCION = "S"
    MODIFICACION = "M"
    OTROS = "O"
    CANCELACION = "C"


class EntradaObservacion(BaseModel):
    texto: str
    fecha: Optional[datetime] = None
    fuente: Optional[str] = None  # "importacion", "manual", etc.

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class VehiculoEmpresaCreate(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de la empresa (11 dígitos)")
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: str = Field(..., description="Número de resolución primigenia (ej: R-0128-2024)")
    fecha_emision_resolucion: Optional[Any] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[Any] = None
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None  # I/S/M/O/C
    
    # 23 Datos Técnicos del Vehículo en el ORDEN EXACTO exigido por el MTC/DRTC:
    # 1. PLACA, 2. MARCA, 3. MODELO, 4. ANIO_FABRICACION, 5. COLOR, 6. CATEGORIA, 7. CARROCERIA,
    # 8. CLASE, 9. COMBUSTIBLE, 10. NUMERO_MOTOR, 11. NUMERO_SERIE_VIN, 12. NUM_PASAJEROS, 13. NUM_ASIENTOS,
    # 14. CILINDROS, 15. EJES, 16. RUEDAS, 17. PESO_BRUTO, 18. PESO_NETO, 19. CARGA_UTIL, 20. LARGO,
    # 21. ANCHO, 22. ALTO, 23. OBSERVACIONES
    placa: str = Field(default="-", description="Placa del vehículo. '-' si es registro cronológico")
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion: Optional[int] = None
    color: Optional[str] = None
    categoria: Optional[str] = None
    carroceria: Optional[str] = None
    clase: Optional[str] = None
    combustible: Optional[str] = None
    numero_motor: Optional[str] = None
    numero_serie: Optional[str] = None  # Serie / VIN
    vin: Optional[str] = None
    pasajeros: Optional[int] = None
    asientos: Optional[int] = None
    cilindros: Optional[int] = None
    ejes: Optional[int] = None
    ruedas: Optional[int] = None
    peso_bruto: Optional[float] = None
    peso_neto: Optional[float] = None
    carga_util: Optional[float] = None
    largo: Optional[float] = None
    ancho: Optional[float] = None
    alto: Optional[float] = None
    observaciones: Optional[str] = None

    # Datos adicionales de control
    es_cronologico: bool = Field(default=False, description="True si la placa es vacía/guion (solo cronología)")
    rutas: List[str] = Field(default_factory=list, description="Lista de códigos de ruta normalizados")
    numero_tuc: Optional[str] = None  # Normalizado: T-012345 o T-A2B-123
    estado: Optional[str] = None  # None si es solo cronológico
    observaciones_historial: List[EntradaObservacion] = Field(default_factory=list)
    fecha_cronologica: Optional[datetime] = None
    fecha_resolucion_hija: Optional[datetime] = None
    id_origen: Optional[str] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None  # ACTIVA/INACTIVA
    fecha_vigencia_hasta: Optional[datetime] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None


class VehiculoEmpresaUpdate(BaseModel):
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: Optional[str] = None
    fecha_emision_resolucion: Optional[Any] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[Any] = None
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    
    # 23 Datos Técnicos del Vehículo:
    placa: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion: Optional[int] = None
    color: Optional[str] = None
    categoria: Optional[str] = None
    carroceria: Optional[str] = None
    clase: Optional[str] = None
    combustible: Optional[str] = None
    numero_motor: Optional[str] = None
    numero_serie: Optional[str] = None
    vin: Optional[str] = None
    pasajeros: Optional[int] = None
    asientos: Optional[int] = None
    cilindros: Optional[int] = None
    ejes: Optional[int] = None
    ruedas: Optional[int] = None
    peso_bruto: Optional[float] = None
    peso_neto: Optional[float] = None
    carga_util: Optional[float] = None
    largo: Optional[float] = None
    ancho: Optional[float] = None
    alto: Optional[float] = None
    observaciones: Optional[str] = None

    rutas: Optional[List[str]] = None
    numero_tuc: Optional[str] = None
    estado: Optional[str] = None
    fecha_cronologica: Optional[Any] = None
    fecha_resolucion_hija: Optional[Any] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None
    esta_activo: Optional[bool] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None


class AgregarObservacionRequest(BaseModel):
    texto: str = Field(..., min_length=1, description="Texto de la nueva observación")
    fuente: Optional[str] = Field(default="manual", description="Fuente de la observación")


class VehiculoEmpresaResponse(BaseModel):
    id: str
    ruc: str
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: str
    fecha_emision_resolucion: Optional[Any] = None
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[Any] = None
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    
    # 23 Especificaciones Técnicas del Vehículo:
    placa: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion: Optional[int] = None
    color: Optional[str] = None
    categoria: Optional[str] = None
    carroceria: Optional[str] = None
    clase: Optional[str] = None
    combustible: Optional[str] = None
    numero_motor: Optional[str] = None
    numero_serie: Optional[str] = None
    vin: Optional[str] = None
    pasajeros: Optional[int] = None
    asientos: Optional[int] = None
    cilindros: Optional[int] = None
    ejes: Optional[int] = None
    ruedas: Optional[int] = None
    peso_bruto: Optional[float] = None
    peso_neto: Optional[float] = None
    carga_util: Optional[float] = None
    largo: Optional[float] = None
    ancho: Optional[float] = None
    alto: Optional[float] = None
    observaciones: Optional[str] = None

    es_cronologico: bool = False
    rutas: List[str] = []
    numero_tuc: Optional[str] = None
    estado: Optional[str] = None
    observaciones_historial: List[EntradaObservacion] = []
    fecha_cronologica: Optional[Any] = None
    fecha_resolucion_hija: Optional[Any] = None
    id_origen: Optional[str] = None
    notificado: Optional[str] = None
    estado_primigenia: Optional[str] = None
    link_tuc: Optional[str] = None
    link_notificacion: Optional[str] = None
    detalles: Optional[str] = None
    fecha_registro: Optional[Any] = None
    fecha_actualizacion: Optional[Any] = None
    esta_activo: bool = True

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}

    @classmethod
    def from_mongo(cls, doc: dict) -> "VehiculoEmpresaResponse":
        """Convertir documento MongoDB a modelo de respuesta."""
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id", ""))
        # Convertir observaciones
        obs_raw = doc.get("observaciones_historial", [])
        doc["observaciones_historial"] = [
            EntradaObservacion(**o) if isinstance(o, dict) else EntradaObservacion(texto=str(o))
            for o in obs_raw
        ]
        return cls(**doc)


class ItemTramiteVehiculo(BaseModel):
    placa: str = Field(..., description="Placa del vehículo entrante/tramitado")
    placa_saliente: Optional[str] = Field(default=None, description="Placa del vehículo que se da de baja (Sustitución)")
    rutas: List[str] = Field(default_factory=list, description="Lista de códigos de rutas")
    tipo_operacion: Optional[str] = Field(default="INCREMENTO", description="INCREMENTO, SUSTITUCION, DUPLICADO, CANJE, RENOVACION")
    datos_tecnicos: Optional[dict] = Field(default_factory=dict, description="Diccionario con los 23 campos de especificaciones técnicas")
    observacion_custom: Optional[str] = None
    numero_tuc: Optional[str] = None
    dar_de_baja_otra_empresa: bool = Field(default=False, description="Dar de baja en la otra empresa si estaba habilitada")
    orden: Optional[int] = Field(default=None, description="Número de orden correlativo en la resolución/flota")


class RutaRenovacionDetalle(BaseModel):
    codigo: str = Field(..., description="Código de la ruta")
    origen: str = Field(..., description="Localidad de origen")
    destino: str = Field(..., description="Localidad de destino")
    itinerario: str = Field(default="", description="Itinerario de la ruta")
    frecuencia: str = Field(default="", description="Frecuencia del servicio")


class TramiteMasivoRequest(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11, description="RUC de la empresa")
    razon_social: Optional[str] = None
    nro_resolucion_primigenia: str = Field(..., description="Resolución primigenia actual o de referencia")
    tipo_tramite: str = Field(..., description="INCREMENTO, SUSTITUCION, RENOVACION, DUPLICADO, CANJE, MODIFICACION, CANCELACION, BAJAS")
    
    # Datos de origen del trámite
    es_de_oficio: bool = Field(default=False, description="Indica si el trámite se inició de oficio")
    documento_origen: Optional[str] = Field(None, description="Documento que dio origen al trámite (si es de oficio)")
    num_expediente: Optional[str] = None
    fecha_expediente: Optional[Any] = None
    
    nro_resolucion_hija: Optional[str] = None
    tipo_resolucion_hija: Optional[str] = None
    fecha_emision_resolucion: Optional[Any] = None
    
    # Específico para RENOVACION:
    es_renovacion: bool = False
    nueva_resolucion_primigenia: Optional[str] = None
    nueva_fecha_emision: Optional[datetime] = None
    nueva_fecha_inicio_vigencia: Optional[datetime] = None
    nueva_fecha_fin_vigencia: Optional[datetime] = None
    duracion_anios: Optional[int] = Field(default=4, description="Años de vigencia de la renovación (4 o 10)")
    rutas_a_ratificar: List[str] = Field(default_factory=list, description="Códigos de rutas de la resolución anterior a ratificar y clonar")
    nuevas_rutas: List[str] = Field(default_factory=list)
    nuevas_rutas_detalle: List[RutaRenovacionDetalle] = Field(default_factory=list)
    
    # Específico para CANCELACION:
    cancelacion_total: bool = Field(default=False, description="Si es True, cancela toda la resolución primigenia")
    rutas_a_cancelar: List[str] = Field(default_factory=list, description="Rutas a cancelar si no es total")

    # Específico para MODIFICACION:
    datos_modificacion: Optional[dict] = Field(default_factory=dict, description="Datos generales de empresa o rutas que cambian")

    # Lista de vehículos a procesar (para Incremento, Sustitución, Duplicado, Canje, Bajas, Renovación):
    vehiculos: List[ItemTramiteVehiculo] = Field(default_factory=list)


