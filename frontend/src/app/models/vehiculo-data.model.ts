/**
 * Modelos para VehiculoData (Datos Técnicos Puros)
 * Separado de la lógica administrativa de vehículos
 */

// ========================================
// ENUMS
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
  GLP = 'GLP',
  GNV = 'GNV',
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

// ========================================
// INTERFACES
// ========================================

export interface Dimensiones {
  longitud?: number;  // metros
  ancho?: number;     // metros
  altura?: number;    // metros
}

export interface DatosMotor {
  cilindrada: number;      // cc
  potencia?: number;       // HP
  transmision?: string;
  traccion?: string;       // 4x2, 4x4, etc.
}

export interface VehiculoData {
  // Identificación
  id: string;
  placaActual: string;
  vin: string;
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
  pesoSeco: number;      // kg
  pesoBruto: number;     // kg
  cargaUtil: number;     // kg
  dimensiones?: Dimensiones;

  // Motor
  motor: DatosMotor;

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
  fechaActualizacion?: string;
  creadoPor: string;
  actualizadoPor: string;
  fuenteDatos: FuenteDatos;
  ultimaActualizacionExterna?: string;
}

export interface VehiculoDataCreate {
  // Identificación (requeridos)
  placaActual: string;
  vin: string;
  numeroSerie: string;
  numeroMotor: string;

  // Datos Técnicos (requeridos)
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

  // Dimensiones y Capacidades (requeridos)
  numeroAsientos: number;
  numeroPasajeros: number;
  numeroEjes: number;
  numeroRuedas: number;
  pesoSeco: number;
  pesoBruto: number;
  cargaUtil: number;
  dimensiones?: Dimensiones;

  // Motor (requeridos)
  cilindrada: number;
  potencia?: number;
  transmision?: string;
  traccion?: string;

  // Origen (requeridos)
  paisOrigen: string;
  paisProcedencia: string;
  fechaImportacion?: string;
  aduanaIngreso?: string;

  // Estado
  estadoFisico: EstadoFisicoVehiculo;
  kilometraje?: number;

  // Observaciones
  observaciones?: string;
  caracteristicasEspeciales?: string;

  // Metadatos
  creadoPor: string;
  fuenteDatos: FuenteDatos;
}

export interface VehiculoDataUpdate {
  placaActual?: string;
  marca?: string;
  modelo?: string;
  version?: string;
  anioFabricacion?: number;
  anioModelo?: number;
  categoria?: CategoriaVehiculo;
  clase?: string;
  carroceria?: TipoCarroceria;
  color?: string;
  colorSecundario?: string;
  combustible?: TipoCombustible;
  numeroAsientos?: number;
  numeroPasajeros?: number;
  numeroEjes?: number;
  numeroRuedas?: number;
  pesoSeco?: number;
  pesoBruto?: number;
  cargaUtil?: number;
  dimensiones?: Dimensiones;
  cilindrada?: number;
  potencia?: number;
  transmision?: string;
  traccion?: string;
  paisOrigen?: string;
  paisProcedencia?: string;
  fechaImportacion?: string;
  aduanaIngreso?: string;
  estadoFisico?: EstadoFisicoVehiculo;
  kilometraje?: number;
  observaciones?: string;
  caracteristicasEspeciales?: string;
  actualizadoPor?: string;
}

export interface VehiculoDataResumen {
  id: string;
  placaActual: string;
  vin: string;
  marca: string;
  modelo: string;
  anioFabricacion: number;
  categoria: CategoriaVehiculo;
  color: string;
}

// ========================================
// HELPERS
// ========================================

export const CATEGORIAS_VEHICULO_LABELS: Record<CategoriaVehiculo, string> = {
  [CategoriaVehiculo.M1]: 'M1 - Pasajeros hasta 8 asientos',
  [CategoriaVehiculo.M2]: 'M2 - Pasajeros más de 8 asientos (≤5 ton)',
  [CategoriaVehiculo.M3]: 'M3 - Pasajeros más de 8 asientos (>5 ton)',
  [CategoriaVehiculo.N1]: 'N1 - Mercancías (≤3.5 ton)',
  [CategoriaVehiculo.N2]: 'N2 - Mercancías (3.5-12 ton)',
  [CategoriaVehiculo.N3]: 'N3 - Mercancías (>12 ton)',
  [CategoriaVehiculo.L]: 'L - Motocicletas',
  [CategoriaVehiculo.O]: 'O - Remolques'
};

export const TIPOS_COMBUSTIBLE_LABELS: Record<TipoCombustible, string> = {
  [TipoCombustible.GASOLINA]: 'Gasolina',
  [TipoCombustible.DIESEL]: 'Diésel',
  [TipoCombustible.GLP]: 'GLP (Gas Licuado)',
  [TipoCombustible.GNV]: 'GNV (Gas Natural)',
  [TipoCombustible.ELECTRICO]: 'Eléctrico',
  [TipoCombustible.HIBRIDO]: 'Híbrido',
  [TipoCombustible.HIBRIDO_ENCHUFABLE]: 'Híbrido Enchufable',
  [TipoCombustible.HIDROGENO]: 'Hidrógeno',
  [TipoCombustible.OTRO]: 'Otro'
};

export const ESTADOS_FISICOS_LABELS: Record<EstadoFisicoVehiculo, string> = {
  [EstadoFisicoVehiculo.NUEVO]: 'Nuevo',
  [EstadoFisicoVehiculo.EXCELENTE]: 'Excelente',
  [EstadoFisicoVehiculo.BUENO]: 'Bueno',
  [EstadoFisicoVehiculo.REGULAR]: 'Regular',
  [EstadoFisicoVehiculo.MALO]: 'Malo',
  [EstadoFisicoVehiculo.CHATARRA]: 'Chatarra',
  [EstadoFisicoVehiculo.DESCONOCIDO]: 'Desconocido'
};
