export interface VehiculoHistorial {
  id: string;
  vehiculoId: string; // ID del vehículo actual
  numeroHistorial: number; // Número secuencial del historial
  tipoMovimiento: TipoMovimientoHistorial;
  fechaMovimiento: Date | string;
  usuarioId?: string; // Usuario que realizó el cambio
  
  // Datos del vehículo en ese momento
  placa: string;
  empresaAnteriorId?: string;
  empresaActualId: string;
  resolucionAnteriorId?: string;
  resolucionActualId?: string;
  estadoAnterior?: string;
  estadoActual: string;
  
  // Datos técnicos en ese momento (snapshot)
  marca: string;
  modelo: string;
  anioFabricacion: number;
  categoria: string;
  datosTecnicos: any; // Snapshot de los datos técnicos
  
  // Metadatos del cambio
  motivoCambio?: string;
  observaciones?: string;
  documentosRelacionados?: string[]; // IDs de documentos relacionados
  
  // Control de historial
  esRegistroActual: boolean; // Si es el registro más reciente
  fechaCreacion: Date | string;
  fechaActualizacion?: Date | string;
  estaActivo: boolean;
}

export interface VehiculoHistorialCreate {
  vehiculoId: string;
  tipoMovimiento: TipoMovimientoHistorial;
  empresaAnteriorId?: string;
  empresaActualId: string;
  resolucionAnteriorId?: string;
  resolucionActualId?: string;
  estadoAnterior?: string;
  estadoActual: string;
  motivoCambio?: string;
  observaciones?: string;
  usuarioId?: string;
}

export interface VehiculoHistorialUpdate {
  motivoCambio?: string;
  observaciones?: string;
  documentosRelacionados?: string[];
  estaActivo?: boolean;
}

export interface VehiculoHistorialFiltros {
  vehiculoId?: string;
  empresaId?: string;
  resolucionId?: string;
  tipoMovimiento?: TipoMovimientoHistorial;
  fechaDesde?: Date | string;
  fechaHasta?: Date | string;
  usuarioId?: string;
  esRegistroActual?: boolean;
}

export interface EstadisticasHistorial {
  totalRegistros: number;
  vehiculosConHistorial: number;
  movimientosPorTipo: { [key in TipoMovimientoHistorial]: number };
  movimientosPorMes: { mes: string; cantidad: number }[];
  empresasConMasMovimientos: { empresaId: string; cantidad: number }[];
  ultimaActualizacion: Date | string;
}

export type TipoMovimientoHistorial = 
  | 'REGISTRO_INICIAL'      // Primer registro del vehículo
  | 'CAMBIO_EMPRESA'        // Transferencia entre empresas
  | 'CAMBIO_RESOLUCION'     // Cambio de resolución
  | 'CAMBIO_ESTADO'         // Cambio de estado (activo, suspendido, etc.)
  | 'ACTUALIZACION_DATOS'   // Actualización de datos técnicos
  | 'CAMBIO_PLACA'          // Cambio de placa
  | 'BAJA_VEHICULO'         // Baja del vehículo
  | 'REACTIVACION'          // Reactivación del vehículo
  | 'MANTENIMIENTO'         // Entrada/salida de mantenimiento
  | 'INSPECCION'            // Inspección técnica
  | 'OTRO';                 // Otros tipos de movimientos

export interface ResumenHistorialVehiculo {
  vehiculoId: string;
  placa: string;
  totalMovimientos: number;
  primerRegistro: Date | string;
  ultimoMovimiento: Date | string;
  empresasHistoricas: string[];
  resolucionesHistoricas: string[];
  estadosHistoricos: string[];
  esActual: boolean;
}