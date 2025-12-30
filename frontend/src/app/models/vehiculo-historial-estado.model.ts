export interface VehiculoHistorialEstado {
  id: string;
  vehiculoId: string;
  vehiculoPlaca: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo?: string;
  observaciones?: string;
  fechaCambio: Date | string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail?: string;
}

export interface VehiculoHistorialEstadoCreate {
  vehiculoId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo?: string;
  observaciones?: string;
}

export interface VehiculoHistorialEstadoFilter {
  vehiculoId?: string;
  vehiculoPlaca?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  usuarioId?: string;
}