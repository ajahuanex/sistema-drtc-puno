/**
 * Modelo VehiculoSolo - Datos Vehiculares Puros
 * Separado de la lógica administrativa
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */

// ========================================
// ENUMS Y TIPOS
// ========================================

export enum CategoriaVehiculo {
  M1 = 'M1', // Vehículos de transporte de pasajeros hasta 8 asientos
  M2 = 'M2', // Vehículos de transporte de pasajeros más de 8 asientos, peso <= 5 ton
  M3 = 'M3', // Vehículos de transporte de pasajeros más de 8 asientos, peso > 5 ton
  N1 = 'N1', // Vehículos de transporte de mercancías, peso <= 3.5 ton
  N2 = 'N2', // Vehículos de transporte de mercancías, 3.5 ton < peso <= 12 ton
  N3 = 'N3', // Vehículos de transporte de mercancías, peso > 12 ton
  L = 'L',   // Motocicletas y similares
  O = 'O'    // Remolques y semirremolques
}

export enum TipoCarroceria {
  SEDAN = 'SEDAN',
  HATCHBACK = 'HATCHBACK',
  STATION_WAGON = 'STATION_WAGON',
  SUV = 'SUV',
  PICK_UP = 'PICK_UP',
  VAN = 'VAN',
  MINIVAN = 'MINIVAN',
  MINIBUS = 'MINIBUS',
  BUS = 'BUS',
  CAMION = 'CAMION',
  CAMIONETA = 'CAMIONETA',
  PANEL = 'PANEL',
  FURGON = 'FURGON',
  REMOLQUE = 'REMOLQUE',
  SEMIRREMOLQUE = 'SEMIRREMOLQUE',
  MOTOCICLETA = 'MOTOCICLETA',
  MOTOTAXI = 'MOTOTAXI',
  OTRO = 'OTRO'
}

export enum TipoCombustible {
  GASOLINA = 'GASOLINA',
  DIESEL = 'DIESEL',
  GLP = 'GLP', // Gas Licuado de Petróleo
  GNV = 'GNV', // Gas Natural Vehicular
  ELECTRICO = 'ELECTRICO',
  HIBRIDO = 'HIBRIDO',
  HIBRIDO_ENCHUFABLE = 'HIBRIDO_ENCHUFABLE',
  HIDROGENO = 'HIDROGENO',
  OTRO = 'OTRO'
}


export enum EstadoFisicoVehiculo {
  NUEVO = 'NUEVO',
  EXCELENTE = 'EXCELENTE',
  BUENO = 'BUENO',
  REGULAR = 'REGULAR',
  MALO = 'MALO',
  CHATARRA = 'CHATARRA',
  DESCONOCIDO = 'DESCONOCIDO'
}

export enum FuenteDatos {
  MANUAL = 'MANUAL',
  SUNARP = 'SUNARP',
  SUTRAN = 'SUTRAN',
  SAT = 'SAT',
  MTC = 'MTC',
  IMPORTACION = 'IMPORTACION',
  OTRO = 'OTRO'
}

export enum TipoDocumentoVehicular {
  TARJETA_PROPIEDAD = 'TARJETA_PROPIEDAD',
  CERTIFICADO_SUNARP = 'CERTIFICADO_SUNARP',
  SOAT = 'SOAT',
  REVISION_TECNICA = 'REVISION_TECNICA',
  CERTIFICADO_IMPORTACION = 'CERTIFICADO_IMPORTACION',
  CERTIFICADO_CONFORMIDAD = 'CERTIFICADO_CONFORMIDAD',
  OTRO = 'OTRO'
}

// ========================================
// INTERFACES PRINCIPALES
// ========================================

export interface VehiculoSolo {
  // Identificación
  id: string;
  placaActual: string;
  vin: string; // Vehicle Identification Number
  numeroSerie: string;
  numeroMotor: string;
  
  // Datos Técnicos
  marca: string;
  modelo: string;
  version?: string;
  anioFabricacion: number;
  anioModelo: number;
  categoria: CategoriaVehiculo;
  clase: string;
  carroceria: TipoCarroceria;
  color: string;
  colorSecundario?: string;
  combustible: TipoCombustible;
  
  // Dimensiones y Capacidades
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  numeroRuedas: number;
  pesoSeco: number; // kg
  pesoBruto: number; // kg
  cargaUtil: number; // kg
  longitud?: number; // metros
  ancho?: number; // metros
  altura?: number; // metros
  
  // Motor
  cilindrada: number; // cc
  potencia?: number; // HP
  transmision?: string;
  traccion?: string; // 4x2, 4x4, etc.
  
  // Origen
  paisOrigen: string;
  paisProcedencia: string;
  fechaImportacion?: string;
  aduanaIngreso?: string;
  
  // Estado del Vehículo
  estadoFisico: EstadoFisicoVehiculo;
  kilometraje?: number;
  
  // Observaciones
  observaciones?: string;
  caracteristicasEspeciales?: string;
  
  // Metadatos
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: string;
  actualizadoPor: string;
  fuenteDatos: FuenteDatos;
  ultimaActualizacionExterna?: string;
  
  // Relaciones (IDs)
  historialPlacasIds?: string[];
  propietariosIds?: string[];
  inspeccionesIds?: string[];
  segurosIds?: string[];
  documentosIds?: string[];
}


// ========================================
// HISTORIAL DE PLACAS
// ========================================

export interface HistorialPlaca {
  id: string;
  vehiculoSoloId: string;
  placaAnterior: string;
  placaNueva: string;
  fechaCambio: string;
  motivoCambio: string;
  documentoSustento?: string;
  observaciones?: string;
  registradoPor: string;
  fechaRegistro: string;
}

export interface HistorialPlacaCreate {
  vehiculoSoloId: string;
  placaAnterior: string;
  placaNueva: string;
  fechaCambio: string;
  motivoCambio: string;
  documentoSustento?: string;
  observaciones?: string;
}

// ========================================
// PROPIETARIOS REGISTRALES (SUNARP)
// ========================================

export interface PropietarioRegistral {
  id: string;
  vehiculoSoloId: string;
  tipoDocumento: string; // DNI, RUC, CE, etc.
  numeroDocumento: string;
  nombreCompleto: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  
  // Datos de propiedad
  fechaAdquisicion: string;
  fechaInscripcion?: string;
  partidaRegistral?: string;
  asientoRegistral?: string;
  oficinaSunarp?: string;
  
  // Estado
  esPropietarioActual: boolean;
  fechaTransferencia?: string;
  
  // Gravámenes
  tieneGravamen: boolean;
  detalleGravamen?: string;
  
  // Metadatos
  fuenteDatos: FuenteDatos;
  fechaConsulta: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface PropietarioRegistralCreate {
  vehiculoSoloId: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  direccion?: string;
  fechaAdquisicion: string;
  esPropietarioActual: boolean;
}


// ========================================
// INSPECCIONES TÉCNICAS
// ========================================

export interface InspeccionTecnica {
  id: string;
  vehiculoSoloId: string;
  
  // Datos de la inspección
  numeroInspeccion: string;
  fechaInspeccion: string;
  fechaVencimiento: string;
  resultado: ResultadoInspeccion;
  puntajeObtenido?: number;
  
  // Centro de inspección
  centroInspeccion: string;
  direccionCentro?: string;
  inspectorNombre?: string;
  
  // Detalles
  observaciones?: string;
  defectosEncontrados?: string[];
  recomendaciones?: string[];
  
  // Documentos
  certificadoUrl?: string;
  reporteUrl?: string;
  
  // Metadatos
  fechaCreacion: string;
  fechaActualizacion: string;
  registradoPor: string;
}

export enum ResultadoInspeccion {
  APROBADO = 'APROBADO',
  APROBADO_OBSERVACIONES = 'APROBADO_OBSERVACIONES',
  DESAPROBADO = 'DESAPROBADO',
  NO_PRESENTADO = 'NO_PRESENTADO'
}

export interface InspeccionTecnicaCreate {
  vehiculoSoloId: string;
  numeroInspeccion: string;
  fechaInspeccion: string;
  fechaVencimiento: string;
  resultado: ResultadoInspeccion;
  centroInspeccion: string;
  observaciones?: string;
}

// ========================================
// SEGUROS (SOAT, etc.)
// ========================================

export interface SeguroVehicular {
  id: string;
  vehiculoSoloId: string;
  
  // Tipo de seguro
  tipoSeguro: TipoSeguro;
  
  // Datos de la póliza
  numeroPoliza: string;
  aseguradora: string;
  fechaInicio: string;
  fechaVencimiento: string;
  
  // Cobertura
  montoCobertura?: number;
  detalleCobertura?: string;
  
  // Estado
  estado: EstadoSeguro;
  
  // Documentos
  polizaUrl?: string;
  
  // Metadatos
  fechaCreacion: string;
  fechaActualizacion: string;
  registradoPor: string;
}

export enum TipoSeguro {
  SOAT = 'SOAT',
  SEGURO_VEHICULAR = 'SEGURO_VEHICULAR',
  SEGURO_TODO_RIESGO = 'SEGURO_TODO_RIESGO',
  OTRO = 'OTRO'
}

export enum EstadoSeguro {
  VIGENTE = 'VIGENTE',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO',
  SUSPENDIDO = 'SUSPENDIDO'
}

export interface SeguroVehicularCreate {
  vehiculoSoloId: string;
  tipoSeguro: TipoSeguro;
  numeroPoliza: string;
  aseguradora: string;
  fechaInicio: string;
  fechaVencimiento: string;
}


// ========================================
// DOCUMENTOS VEHICULARES
// ========================================

export interface DocumentoVehicular {
  id: string;
  vehiculoSoloId: string;
  
  // Tipo y datos
  tipoDocumento: TipoDocumentoVehicular;
  numeroDocumento: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  
  // Emisor
  entidadEmisora: string;
  
  // Archivo
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  
  // Estado
  estado: EstadoDocumento;
  
  // Observaciones
  observaciones?: string;
  
  // Metadatos
  fechaCreacion: string;
  fechaActualizacion: string;
  registradoPor: string;
}

export enum EstadoDocumento {
  VIGENTE = 'VIGENTE',
  VENCIDO = 'VENCIDO',
  ANULADO = 'ANULADO',
  EN_TRAMITE = 'EN_TRAMITE'
}

export interface DocumentoVehicularCreate {
  vehiculoSoloId: string;
  tipoDocumento: TipoDocumentoVehicular;
  numeroDocumento: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  entidadEmisora: string;
}

// ========================================
// DTOs PARA CREACIÓN Y ACTUALIZACIÓN
// ========================================

export interface VehiculoSoloCreate {
  // Identificación (requeridos)
  placaActual: string;
  vin: string;
  numeroSerie: string;
  numeroMotor: string;
  
  // Datos Técnicos (requeridos)
  marca: string;
  modelo: string;
  anioFabricacion: number;
  anioModelo: number;
  categoria: CategoriaVehiculo;
  clase: string;
  carroceria: TipoCarroceria;
  color: string;
  combustible: TipoCombustible;
  
  // Capacidades (requeridos)
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  numeroRuedas: number;
  pesoSeco: number;
  pesoBruto: number;
  cargaUtil: number;
  cilindrada: number;
  
  // Origen (requeridos)
  paisOrigen: string;
  paisProcedencia: string;
  
  // Estado
  estadoFisico: EstadoFisicoVehiculo;
  
  // Opcionales
  version?: string;
  colorSecundario?: string;
  longitud?: number;
  ancho?: number;
  altura?: number;
  potencia?: number;
  transmision?: string;
  traccion?: string;
  fechaImportacion?: string;
  aduanaIngreso?: string;
  kilometraje?: number;
  observaciones?: string;
  caracteristicasEspeciales?: string;
  
  // Fuente
  fuenteDatos: FuenteDatos;
}

export interface VehiculoSoloUpdate {
  placaActual?: string;
  color?: string;
  colorSecundario?: string;
  estadoFisico?: EstadoFisicoVehiculo;
  kilometraje?: number;
  observaciones?: string;
  caracteristicasEspeciales?: string;
  fuenteDatos?: FuenteDatos;
}


// ========================================
// FILTROS Y BÚSQUEDA
// ========================================

export interface FiltrosVehiculoSolo {
  placa?: string;
  vin?: string;
  numeroSerie?: string;
  numeroMotor?: string;
  marca?: string;
  modelo?: string;
  anioFabricacionDesde?: number;
  anioFabricacionHasta?: number;
  categoria?: CategoriaVehiculo;
  carroceria?: TipoCarroceria;
  combustible?: TipoCombustible;
  estadoFisico?: EstadoFisicoVehiculo;
  fuenteDatos?: FuenteDatos;
  propietarioDocumento?: string;
  propietarioNombre?: string;
  
  // Paginación
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// RESPUESTAS DE API
// ========================================

export interface VehiculoSoloResponse {
  vehiculos: VehiculoSolo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VehiculoSoloDetallado extends VehiculoSolo {
  historialPlacas: HistorialPlaca[];
  propietarios: PropietarioRegistral[];
  inspecciones: InspeccionTecnica[];
  seguros: SeguroVehicular[];
  documentos: DocumentoVehicular[];
}

// ========================================
// INTEGRACIÓN CON APIs EXTERNAS
// ========================================

export interface ConsultaSUNARP {
  placa: string;
  vin?: string;
  numeroSerie?: string;
}

export interface RespuestaSUNARP {
  exito: boolean;
  mensaje?: string;
  datos?: {
    vehiculo: Partial<VehiculoSolo>;
    propietario: Partial<PropietarioRegistral>;
    gravamenes?: any[];
  };
  fechaConsulta: string;
}

export interface ConsultaSUTRAN {
  placa: string;
}

export interface RespuestaSUTRAN {
  exito: boolean;
  mensaje?: string;
  datos?: {
    vehiculo: Partial<VehiculoSolo>;
    infracciones?: any[];
    papeletasDetencion?: any[];
  };
  fechaConsulta: string;
}

// ========================================
// ESTADÍSTICAS Y REPORTES
// ========================================

export interface EstadisticasVehiculoSolo {
  totalVehiculos: number;
  vehiculosPorCategoria: { [key in CategoriaVehiculo]?: number };
  vehiculosPorMarca: { marca: string; cantidad: number }[];
  vehiculosPorAnio: { anio: number; cantidad: number }[];
  vehiculosPorEstadoFisico: { [key in EstadoFisicoVehiculo]?: number };
  vehiculosConInspeccionVigente: number;
  vehiculosConSOATVigente: number;
  promedioKilometraje: number;
  promedioEdad: number;
}
