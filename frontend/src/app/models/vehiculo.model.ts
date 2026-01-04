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
  placaBaja?: string; // NUEVO: Placa del vehículo anterior en caso de sustitución
  sedeRegistro?: string; // Nuevo campo (opcional para compatibilidad con datos existentes)
  empresaActualId: string;
  resolucionId: string;
  rutasAsignadasIds: string[]; // Rutas generales (de resoluciones padre)
  rutasEspecificas?: RutaEspecifica[]; // NUEVO: Rutas específicas del vehículo
  categoria: string;
  carroceria?: string; // Nuevo campo para tipo de carrocería
  marca: string;
  modelo: string;
  anioFabricacion: number;
  estado: EstadoVehiculo | string; // Permitir tanto enum como string para compatibilidad
  estaActivo: boolean;
  tuc?: Tuc;
  datosTecnicos: DatosTecnicos;
  // Campos adicionales
  color?: string;
  numeroSerie?: string;
  observaciones?: string;
  fechaRegistro?: Date | string;
  fechaActualizacion?: Date | string;
  // Campos específicos para baja
  fechaBaja?: Date | string;
  motivoBaja?: string;
  observacionesBaja?: string;
  // Campos de historial de validaciones
  numeroHistorialValidacion?: number; // Número secuencial basado en orden de resoluciones
  esHistorialActual?: boolean; // Si es el registro actual del vehículo (historial más alto)
  vehiculoHistorialActualId?: string; // ID del vehículo con el historial más actual
}

export interface VehiculoCreate {
  placa: string;
  placaBaja?: string; // NUEVO: Placa del vehículo anterior en caso de sustitución
  sedeRegistro?: string; // Nuevo campo (opcional para compatibilidad)
  empresaActualId: string;
  resolucionId?: string; // Opcional
  rutasAsignadasIds?: string[]; // Opcional - Rutas generales
  rutasEspecificas?: RutaEspecifica[]; // NUEVO: Rutas específicas
  categoria: string;
  carroceria?: string; // Nuevo campo para tipo de carrocería
  marca: string;
  modelo: string;
  anioFabricacion: number;
  tuc?: Tuc;
  datosTecnicos: DatosTecnicos;
  color?: string; // Opcional
  numeroSerie?: string; // Opcional
  observaciones?: string; // Opcional
}

export interface VehiculoUpdate {
  placa?: string;
  placaBaja?: string; // NUEVO: Placa del vehículo anterior en caso de sustitución
  sedeRegistro?: string;
  empresaActualId?: string;
  resolucionId?: string;
  rutasAsignadasIds?: string[]; // Rutas generales
  rutasEspecificas?: RutaEspecifica[]; // NUEVO: Rutas específicas
  categoria?: string;
  carroceria?: string;
  marca?: string;
  modelo?: string;
  anioFabricacion?: number;
  estado?: string;
  estaActivo?: boolean; // NUEVO: Para activar/desactivar vehículos
  fechaBaja?: Date | string; // NUEVO: Para registrar fecha de baja
  motivoBaja?: string; // NUEVO: Para registrar motivo de baja
  observacionesBaja?: string; // NUEVO: Para registrar observaciones de baja
  tuc?: Tuc;
  datosTecnicos?: DatosTecnicos;
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