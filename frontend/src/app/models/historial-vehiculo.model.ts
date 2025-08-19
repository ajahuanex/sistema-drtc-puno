export interface HistorialVehiculo {
  id: string;
  vehiculoId: string;
  placa: string;
  fechaCambio: string;
  tipoCambio: TipoCambioVehiculo;
  empresaOrigenId?: string;
  empresaDestinoId?: string;
  empresaOrigenNombre?: string;
  empresaDestinoNombre?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  resolucionId?: string;
  resolucionNumero?: string;
  rutaId?: string;
  rutaNombre?: string;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  usuarioNombre: string;
  oficinaId?: string;
  oficinaNombre?: string;
  documentos?: DocumentoHistorial[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export enum TipoCambioVehiculo {
  TRANSFERENCIA_EMPRESA = 'TRANSFERENCIA_EMPRESA',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  ASIGNACION_RUTA = 'ASIGNACION_RUTA',
  REMOCION_RUTA = 'REMOCION_RUTA',
  CAMBIO_RESOLUCION = 'CAMBIO_RESOLUCION',
  ACTIVACION = 'ACTIVACION',
  DESACTIVACION = 'DESACTIVACION',
  RENOVACION_TUC = 'RENOVACION_TUC',
  MODIFICACION_DATOS = 'MODIFICACION_DATOS',
  INSPECCION_TECNICA = 'INSPECCION_TECNICA',
  MANTENIMIENTO = 'MANTENIMIENTO',
  SANCION = 'SANCION',
  REHABILITACION = 'REHABILITACION'
}

export interface DocumentoHistorial {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fechaSubida: string;
}

export interface HistorialVehiculoCreate {
  vehiculoId: string;
  placa: string;
  fechaCambio: string;
  tipoCambio: TipoCambioVehiculo;
  empresaOrigenId?: string;
  empresaDestinoId?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  resolucionId?: string;
  rutaId?: string;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  oficinaId?: string;
  documentos?: DocumentoHistorial[];
}

export interface HistorialVehiculoUpdate {
  fechaCambio?: string;
  motivo?: string;
  observaciones?: string;
  documentos?: DocumentoHistorial[];
}

export interface FiltroHistorialVehiculo {
  vehiculoId?: string;
  placa?: string;
  empresaId?: string;
  tipoCambio?: TipoCambioVehiculo;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  oficinaId?: string;
}

export interface ResumenHistorialVehiculo {
  vehiculoId: string;
  placa: string;
  totalCambios: number;
  ultimoCambio: string;
  empresaActual: string;
  estadoActual: string;
  resolucionActual: string;
  rutaActual: string;
  tiposCambio: TipoCambioVehiculo[];
  empresasInvolucradas: string[];
} 