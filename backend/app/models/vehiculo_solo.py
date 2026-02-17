"""
Modelos de VehiculoSolo - Datos Vehiculares Puros
Separado de la lógica administrativa

@author Sistema DRTC
@version 1.0.0
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


# ========================================
# ENUMS
# ========================================

class CategoriaVehiculo(str, enum.Enum):
    M1 = "M1"  # Vehículos de transporte de pasajeros hasta 8 asientos
    M2 = "M2"  # Vehículos de transporte de pasajeros más de 8 asientos, peso <= 5 ton
    M3 = "M3"  # Vehículos de transporte de pasajeros más de 8 asientos, peso > 5 ton
    N1 = "N1"  # Vehículos de transporte de mercancías, peso <= 3.5 ton
    N2 = "N2"  # Vehículos de transporte de mercancías, 3.5 ton < peso <= 12 ton
    N3 = "N3"  # Vehículos de transporte de mercancías, peso > 12 ton
    L = "L"    # Motocicletas y similares
    O = "O"    # Remolques y semirremolques


class TipoCarroceria(str, enum.Enum):
    SEDAN = "SEDAN"
    HATCHBACK = "HATCHBACK"
    STATION_WAGON = "STATION_WAGON"
    SUV = "SUV"
    PICK_UP = "PICK_UP"
    VAN = "VAN"
    MINIVAN = "MINIVAN"
    MINIBUS = "MINIBUS"
    BUS = "BUS"
    CAMION = "CAMION"
    CAMIONETA = "CAMIONETA"
    PANEL = "PANEL"
    FURGON = "FURGON"
    REMOLQUE = "REMOLQUE"
    SEMIRREMOLQUE = "SEMIRREMOLQUE"
    MOTOCICLETA = "MOTOCICLETA"
    MOTOTAXI = "MOTOTAXI"
    OTRO = "OTRO"


class TipoCombustible(str, enum.Enum):
    GASOLINA = "GASOLINA"
    DIESEL = "DIESEL"
    GLP = "GLP"  # Gas Licuado de Petróleo
    GNV = "GNV"  # Gas Natural Vehicular
    ELECTRICO = "ELECTRICO"
    HIBRIDO = "HIBRIDO"
    HIBRIDO_ENCHUFABLE = "HIBRIDO_ENCHUFABLE"
    HIDROGENO = "HIDROGENO"
    OTRO = "OTRO"


class EstadoFisicoVehiculo(str, enum.Enum):
    NUEVO = "NUEVO"
    EXCELENTE = "EXCELENTE"
    BUENO = "BUENO"
    REGULAR = "REGULAR"
    MALO = "MALO"
    CHATARRA = "CHATARRA"
    DESCONOCIDO = "DESCONOCIDO"


class FuenteDatos(str, enum.Enum):
    MANUAL = "MANUAL"
    SUNARP = "SUNARP"
    SUTRAN = "SUTRAN"
    SAT = "SAT"
    MTC = "MTC"
    IMPORTACION = "IMPORTACION"
    OTRO = "OTRO"


class ResultadoInspeccion(str, enum.Enum):
    APROBADO = "APROBADO"
    APROBADO_OBSERVACIONES = "APROBADO_OBSERVACIONES"
    DESAPROBADO = "DESAPROBADO"
    NO_PRESENTADO = "NO_PRESENTADO"


class TipoSeguro(str, enum.Enum):
    SOAT = "SOAT"
    SEGURO_VEHICULAR = "SEGURO_VEHICULAR"
    SEGURO_TODO_RIESGO = "SEGURO_TODO_RIESGO"
    OTRO = "OTRO"


class EstadoSeguro(str, enum.Enum):
    VIGENTE = "VIGENTE"
    VENCIDO = "VENCIDO"
    CANCELADO = "CANCELADO"
    SUSPENDIDO = "SUSPENDIDO"


class TipoDocumentoVehicular(str, enum.Enum):
    TARJETA_PROPIEDAD = "TARJETA_PROPIEDAD"
    CERTIFICADO_SUNARP = "CERTIFICADO_SUNARP"
    SOAT = "SOAT"
    REVISION_TECNICA = "REVISION_TECNICA"
    CERTIFICADO_IMPORTACION = "CERTIFICADO_IMPORTACION"
    CERTIFICADO_CONFORMIDAD = "CERTIFICADO_CONFORMIDAD"
    OTRO = "OTRO"


class EstadoDocumento(str, enum.Enum):
    VIGENTE = "VIGENTE"
    VENCIDO = "VENCIDO"
    ANULADO = "ANULADO"
    EN_TRAMITE = "EN_TRAMITE"


# ========================================
# MODELOS
# ========================================

class VehiculoSolo(Base):
    """
    Modelo principal de VehiculoSolo
    Contiene datos vehiculares puros, independientes de lógica administrativa
    """
    __tablename__ = "vehiculos_solo"

    # Identificación
    id = Column(String, primary_key=True, index=True)
    placa_actual = Column(String, unique=True, index=True, nullable=False)
    vin = Column(String, unique=True, index=True, nullable=False)
    numero_serie = Column(String, nullable=False)
    numero_motor = Column(String, nullable=False)

    # Datos Técnicos
    marca = Column(String, nullable=False, index=True)
    modelo = Column(String, nullable=False, index=True)
    version = Column(String, nullable=True)
    anio_fabricacion = Column(Integer, nullable=False, index=True)
    anio_modelo = Column(Integer, nullable=False)
    categoria = Column(SQLEnum(CategoriaVehiculo), nullable=False, index=True)
    clase = Column(String, nullable=False)
    carroceria = Column(SQLEnum(TipoCarroceria), nullable=False)
    color = Column(String, nullable=False)
    color_secundario = Column(String, nullable=True)
    combustible = Column(SQLEnum(TipoCombustible), nullable=False)

    # Dimensiones y Capacidades
    numero_asientos = Column(Integer, nullable=False)
    numero_pasajeros = Column(Integer, nullable=False)
    numero_ejes = Column(Integer, nullable=False)
    numero_ruedas = Column(Integer, nullable=False)
    peso_seco = Column(Float, nullable=False)  # kg
    peso_bruto = Column(Float, nullable=False)  # kg
    carga_util = Column(Float, nullable=False)  # kg
    longitud = Column(Float, nullable=True)  # metros
    ancho = Column(Float, nullable=True)  # metros
    altura = Column(Float, nullable=True)  # metros

    # Motor
    cilindrada = Column(Integer, nullable=False)  # cc
    potencia = Column(Float, nullable=True)  # HP
    transmision = Column(String, nullable=True)
    traccion = Column(String, nullable=True)  # 4x2, 4x4, etc.

    # Origen
    pais_origen = Column(String, nullable=False)
    pais_procedencia = Column(String, nullable=False)
    fecha_importacion = Column(DateTime, nullable=True)
    aduana_ingreso = Column(String, nullable=True)

    # Estado del Vehículo
    estado_fisico = Column(SQLEnum(EstadoFisicoVehiculo), nullable=False)
    kilometraje = Column(Integer, nullable=True)

    # Observaciones
    observaciones = Column(Text, nullable=True)
    caracteristicas_especiales = Column(Text, nullable=True)

    # Metadatos
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creado_por = Column(String, nullable=False)
    actualizado_por = Column(String, nullable=False)
    fuente_datos = Column(SQLEnum(FuenteDatos), nullable=False, default=FuenteDatos.MANUAL)
    ultima_actualizacion_externa = Column(DateTime, nullable=True)

    # Relaciones
    historial_placas = relationship("HistorialPlaca", back_populates="vehiculo_solo", cascade="all, delete-orphan")
    propietarios = relationship("PropietarioRegistral", back_populates="vehiculo_solo", cascade="all, delete-orphan")
    inspecciones = relationship("InspeccionTecnica", back_populates="vehiculo_solo", cascade="all, delete-orphan")
    seguros = relationship("SeguroVehicular", back_populates="vehiculo_solo", cascade="all, delete-orphan")
    documentos = relationship("DocumentoVehicular", back_populates="vehiculo_solo", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VehiculoSolo(placa={self.placa_actual}, marca={self.marca}, modelo={self.modelo})>"



class HistorialPlaca(Base):
    """Historial de cambios de placa de un vehículo"""
    __tablename__ = "historial_placas"

    id = Column(String, primary_key=True, index=True)
    vehiculo_solo_id = Column(String, ForeignKey("vehiculos_solo.id"), nullable=False, index=True)
    placa_anterior = Column(String, nullable=False)
    placa_nueva = Column(String, nullable=False)
    fecha_cambio = Column(DateTime, nullable=False)
    motivo_cambio = Column(String, nullable=False)
    documento_sustento = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    registrado_por = Column(String, nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relación
    vehiculo_solo = relationship("VehiculoSolo", back_populates="historial_placas")

    def __repr__(self):
        return f"<HistorialPlaca({self.placa_anterior} → {self.placa_nueva})>"


class PropietarioRegistral(Base):
    """Propietarios registrales del vehículo (datos SUNARP)"""
    __tablename__ = "propietarios_registrales"

    id = Column(String, primary_key=True, index=True)
    vehiculo_solo_id = Column(String, ForeignKey("vehiculos_solo.id"), nullable=False, index=True)
    tipo_documento = Column(String, nullable=False)  # DNI, RUC, CE, etc.
    numero_documento = Column(String, nullable=False, index=True)
    nombre_completo = Column(String, nullable=False)
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # Datos de propiedad
    fecha_adquisicion = Column(DateTime, nullable=False)
    fecha_inscripcion = Column(DateTime, nullable=True)
    partida_registral = Column(String, nullable=True)
    asiento_registral = Column(String, nullable=True)
    oficina_sunarp = Column(String, nullable=True)

    # Estado
    es_propietario_actual = Column(Boolean, default=False, nullable=False)
    fecha_transferencia = Column(DateTime, nullable=True)

    # Gravámenes
    tiene_gravamen = Column(Boolean, default=False, nullable=False)
    detalle_gravamen = Column(Text, nullable=True)

    # Metadatos
    fuente_datos = Column(SQLEnum(FuenteDatos), nullable=False, default=FuenteDatos.MANUAL)
    fecha_consulta = Column(DateTime, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación
    vehiculo_solo = relationship("VehiculoSolo", back_populates="propietarios")

    def __repr__(self):
        return f"<PropietarioRegistral({self.nombre_completo}, {self.numero_documento})>"


class InspeccionTecnica(Base):
    """Inspecciones técnicas vehiculares"""
    __tablename__ = "inspecciones_tecnicas"

    id = Column(String, primary_key=True, index=True)
    vehiculo_solo_id = Column(String, ForeignKey("vehiculos_solo.id"), nullable=False, index=True)

    # Datos de la inspección
    numero_inspeccion = Column(String, nullable=False, unique=True)
    fecha_inspeccion = Column(DateTime, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=False, index=True)
    resultado = Column(SQLEnum(ResultadoInspeccion), nullable=False)
    puntaje_obtenido = Column(Float, nullable=True)

    # Centro de inspección
    centro_inspeccion = Column(String, nullable=False)
    direccion_centro = Column(String, nullable=True)
    inspector_nombre = Column(String, nullable=True)

    # Detalles
    observaciones = Column(Text, nullable=True)
    defectos_encontrados = Column(Text, nullable=True)  # JSON array
    recomendaciones = Column(Text, nullable=True)  # JSON array

    # Documentos
    certificado_url = Column(String, nullable=True)
    reporte_url = Column(String, nullable=True)

    # Metadatos
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    registrado_por = Column(String, nullable=False)

    # Relación
    vehiculo_solo = relationship("VehiculoSolo", back_populates="inspecciones")

    def __repr__(self):
        return f"<InspeccionTecnica({self.numero_inspeccion}, {self.resultado})>"


class SeguroVehicular(Base):
    """Seguros vehiculares (SOAT, etc.)"""
    __tablename__ = "seguros_vehiculares"

    id = Column(String, primary_key=True, index=True)
    vehiculo_solo_id = Column(String, ForeignKey("vehiculos_solo.id"), nullable=False, index=True)

    # Tipo de seguro
    tipo_seguro = Column(SQLEnum(TipoSeguro), nullable=False)

    # Datos de la póliza
    numero_poliza = Column(String, nullable=False, unique=True)
    aseguradora = Column(String, nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=False, index=True)

    # Cobertura
    monto_cobertura = Column(Float, nullable=True)
    detalle_cobertura = Column(Text, nullable=True)

    # Estado
    estado = Column(SQLEnum(EstadoSeguro), nullable=False, default=EstadoSeguro.VIGENTE)

    # Documentos
    poliza_url = Column(String, nullable=True)

    # Metadatos
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    registrado_por = Column(String, nullable=False)

    # Relación
    vehiculo_solo = relationship("VehiculoSolo", back_populates="seguros")

    def __repr__(self):
        return f"<SeguroVehicular({self.tipo_seguro}, {self.numero_poliza})>"


class DocumentoVehicular(Base):
    """Documentos vehiculares (tarjeta de propiedad, certificados, etc.)"""
    __tablename__ = "documentos_vehiculares"

    id = Column(String, primary_key=True, index=True)
    vehiculo_solo_id = Column(String, ForeignKey("vehiculos_solo.id"), nullable=False, index=True)

    # Tipo y datos
    tipo_documento = Column(SQLEnum(TipoDocumentoVehicular), nullable=False)
    numero_documento = Column(String, nullable=False)
    fecha_emision = Column(DateTime, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=True)

    # Emisor
    entidad_emisora = Column(String, nullable=False)

    # Archivo
    archivo_url = Column(String, nullable=True)
    archivo_nombre = Column(String, nullable=True)
    archivo_tipo = Column(String, nullable=True)

    # Estado
    estado = Column(SQLEnum(EstadoDocumento), nullable=False, default=EstadoDocumento.VIGENTE)

    # Observaciones
    observaciones = Column(Text, nullable=True)

    # Metadatos
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    registrado_por = Column(String, nullable=False)

    # Relación
    vehiculo_solo = relationship("VehiculoSolo", back_populates="documentos")

    def __repr__(self):
        return f"<DocumentoVehicular({self.tipo_documento}, {self.numero_documento})>"
