import { TipoServicio } from './empresa.model';

export enum EstadoVehiculo {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  SUSPENDIDO = 'SUSPENDIDO',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
  DADO_DE_BAJA = 'DADO_DE_BAJA'
}

export interface DatosTecnicos {
  motor: string;
  chasis: string;
  cilindros?: number; // Opcional para compatibilidad
  ejes: number;
  ruedas?: number; // Opcional para compatibilidad
  asientos: number;
  numeroPasajeros?: number; // NUEVO: Número total de pasajeros (diferente de asientos)
  pesoNeto: number;
  pesoBruto: number;
  cargaUtil?: number; // Opcional - diferencia entre peso bruto y peso neto
  tipoCombustible: string; // Campo requerido por el backend
  medidas: {
    largo: number;
    ancho: number;
    alto: number;
  };
  cilindrada?: number; // Opcional - cilindrada del motor
  potencia?: number; // Opcional - potencia en HP
}

export interface Tuc {
  nroTuc: string;
  fechaEmision: string;
}

export interface RutaEspecifica {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  distancia?: number;
  tiempoEstimado?: string;
  horarios?: string[];
  tarifaBase?: number;
  observaciones?: string;
  estaActiva: boolean;
  fechaCreacion: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  
  // ========================================
  // REFERENCIA A DATOS TÉCNICOS
  // ========================================
  vehiculoDataId: string; // Referencia a VehiculoData (datos técnicos puros)
  
  // ========================================
  // ASIGNACIÓN ADMINISTRATIVA
  // ========================================
  empresaActualId: string;
  resolucionId?: string;
  tipoServicio: string; // UN solo tipo de servicio por vehículo
  
  // ========================================
  // RUTAS
  // ========================================
  rutasAsignadasIds: string[]; // Rutas generales (de resoluciones padre)
  rutasEspecificas?: RutaEspecifica[]; // Rutas específicas del vehículo
  
  // ========================================
  // ESTADO ADMINISTRATIVO
  // ========================================
  estado: EstadoVehiculo | string;
  estaActivo: boolean;
  
  // ========================================
  // INFORMACIÓN ADICIONAL
  // ========================================
  sedeRegistro?: string;
  observaciones?: string;
  
  // ========================================
  // CAMPOS DE SUSTITUCIÓN
  // ========================================
  placaSustituida?: string;
  placaBaja?: string; // ALIAS de placaSustituida (compatibilidad)
  fechaSustitucion?: Date | string;
  motivoSustitucion?: string;
  resolucionSustitucion?: string;
  
  // ========================================
  // CAMPOS DE BAJA
  // ========================================
  fechaBaja?: Date | string;
  motivoBaja?: string;
  observacionesBaja?: string;
  
  // ========================================
  // TUC
  // ========================================
  numeroTuc?: string;
  tuc?: Tuc;
  
  // ========================================
  // HISTORIAL Y DOCUMENTOS
  // ========================================
  documentosIds?: string[];
  historialIds?: string[];
  numeroHistorialValidacion?: number;
  esHistorialActual?: boolean;
  vehiculoHistorialActualId?: string;
  
  // ========================================
  // METADATOS
  // ========================================
  fechaRegistro?: Date | string;
  fechaActualizacion?: Date | string;
  
  // ========================================
  // DATOS TÉCNICOS (Obtenidos de VehiculoData)
  // ========================================
  // Estos campos se llenan desde VehiculoData para mostrar en UI
  datosTecnicos?: DatosTecnicos;
  marca?: string;
  modelo?: string;
  categoria?: string;
  carroceria?: string;
  anioFabricacion?: number;
  color?: string;
  numeroSerie?: string;
  
  // ========================================
  // COMPATIBILIDAD LEGACY
  // ========================================
  vehiculoSoloId?: string; // DEPRECATED: usar vehiculoDataId
}

export interface VehiculoCreate {
  placa: string;
  vehiculoDataId?: string; // Referencia a VehiculoData (nuevo sistema)
  empresaActualId: string;
  tipoServicio: string; // OBLIGATORIO: UN solo tipo de servicio por vehículo
  resolucionId?: string; // Opcional
  rutasAsignadasIds?: string[]; // Opcional - Rutas generales
  rutasEspecificas?: RutaEspecifica[]; // Opcional - Rutas específicas
  estado?: string;
  sedeRegistro?: string;
  observaciones?: string; // Opcional
  
  // Campos de sustitución opcionales
  placaSustituida?: string;
  placaBaja?: string; // ALIAS de placaSustituida
  fechaSustitucion?: Date | string;
  motivoSustitucion?: string;
  resolucionSustitucion?: string;
  numeroTuc?: string;
  tuc?: Tuc;
  
  // ========================================
  // COMPATIBILIDAD LEGACY (Temporal)
  // ========================================
  vehiculoSoloId?: string; // DEPRECATED: usar vehiculoDataId
  categoria?: string; // DEPRECATED: obtener de VehiculoData
  carroceria?: string; // DEPRECATED: obtener de VehiculoData
  marca?: string; // DEPRECATED: obtener de VehiculoData
  modelo?: string; // DEPRECATED: obtener de VehiculoData
  anioFabricacion?: number; // DEPRECATED: obtener de VehiculoData
  datosTecnicos?: DatosTecnicos; // DEPRECATED: obtener de VehiculoData
  color?: string; // DEPRECATED: obtener de VehiculoData
  numeroSerie?: string; // DEPRECATED: obtener de VehiculoData
}

export interface VehiculoUpdate {
  placa?: string;
  vehiculoDataId?: string;
  empresaActualId?: string;
  tipoServicio?: string;
  resolucionId?: string;
  rutasAsignadasIds?: string[]; // Rutas generales
  rutasEspecificas?: RutaEspecifica[]; // Rutas específicas
  estado?: string;
  estaActivo?: boolean;
  sedeRegistro?: string;
  observaciones?: string;
  
  // Campos de sustitución
  placaSustituida?: string;
  placaBaja?: string; // ALIAS de placaSustituida
  fechaSustitucion?: Date | string;
  motivoSustitucion?: string;
  resolucionSustitucion?: string;
  
  // Campos de baja
  fechaBaja?: Date | string;
  motivoBaja?: string;
  observacionesBaja?: string;
  
  // TUC
  numeroTuc?: string;
  tuc?: Tuc;
  
  // ========================================
  // COMPATIBILIDAD LEGACY (Temporal)
  // ========================================
  vehiculoSoloId?: string; // DEPRECATED: usar vehiculoDataId
  categoria?: string; // DEPRECATED: obtener de VehiculoData
  carroceria?: string; // DEPRECATED: obtener de VehiculoData
  marca?: string; // DEPRECATED: obtener de VehiculoData
  modelo?: string; // DEPRECATED: obtener de VehiculoData
  anioFabricacion?: number; // DEPRECATED: obtener de VehiculoData
  datosTecnicos?: DatosTecnicos; // DEPRECATED: obtener de VehiculoData
  color?: string; // DEPRECATED: obtener de VehiculoData
  numeroSerie?: string; // DEPRECATED: obtener de VehiculoData
}

// Labels para mostrar en la UI
export const ESTADOS_VEHICULO_LABELS: Record<EstadoVehiculo, string> = {
  [EstadoVehiculo.ACTIVO]: 'Activo',
  [EstadoVehiculo.INACTIVO]: 'Inactivo',
  [EstadoVehiculo.MANTENIMIENTO]: 'En Mantenimiento',
  [EstadoVehiculo.SUSPENDIDO]: 'Suspendido',
  [EstadoVehiculo.FUERA_DE_SERVICIO]: 'Fuera de Servicio',
  [EstadoVehiculo.DADO_DE_BAJA]: 'Dado de Baja'
};

// Función helper para verificar si un vehículo está habilitado o activo
export function isVehiculoHabilitado(vehiculo: Vehiculo): boolean {
  return vehiculo.estado === EstadoVehiculo.ACTIVO;
}

// Función helper para verificar si un vehículo está dado de baja
export function isVehiculoBaja(vehiculo: Vehiculo): boolean {
  return vehiculo.estado === EstadoVehiculo.DADO_DE_BAJA || 
         vehiculo.estado === EstadoVehiculo.FUERA_DE_SERVICIO ||
         vehiculo.estado === EstadoVehiculo.INACTIVO;
} 