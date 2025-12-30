import { EstadoVehiculo } from './vehiculo.model';

export { EstadoVehiculo };

export interface HistorialVehicular {
  id: string;
  vehiculoId: string;
  placa: string;
  tipoEvento: TipoEventoHistorial;
  descripcion: string;
  fechaEvento: string;
  usuarioId?: string;
  usuarioNombre?: string;
  empresaAnteriorId?: string;
  empresaNuevaId?: string;
  empresaAnteriorNombre?: string;
  empresaNuevaNombre?: string;
  resolucionAnteriorId?: string;
  resolucionNuevaId?: string;
  resolucionAnteriorNumero?: string;
  resolucionNuevaNumero?: string;
  estadoAnterior?: EstadoVehiculo;
  estadoNuevo?: EstadoVehiculo;
  datosAnteriores?: any; // JSON con los datos anteriores completos
  datosNuevos?: any; // JSON con los datos nuevos completos
  observaciones?: string;
  documentosSoporte?: DocumentoSoporte[];
  ipAddress?: string;
  userAgent?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface HistorialVehicularCreate {
  vehiculoId: string;
  placa: string;
  tipoEvento: TipoEventoHistorial;
  descripcion: string;
  fechaEvento?: string;
  usuarioId?: string;
  empresaAnteriorId?: string;
  empresaNuevaId?: string;
  resolucionAnteriorId?: string;
  resolucionNuevaId?: string;
  estadoAnterior?: EstadoVehiculo;
  estadoNuevo?: EstadoVehiculo;
  datosAnteriores?: any;
  datosNuevos?: any;
  observaciones?: string;
  documentosSoporte?: DocumentoSoporte[];
}

export interface HistorialVehicularUpdate {
  descripcion?: string;
  observaciones?: string;
  documentosSoporte?: DocumentoSoporte[];
}

export enum TipoEventoHistorial {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  TRANSFERENCIA_EMPRESA = 'TRANSFERENCIA_EMPRESA',
  CAMBIO_RESOLUCION = 'CAMBIO_RESOLUCION',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  ASIGNACION_RUTA = 'ASIGNACION_RUTA',
  DESASIGNACION_RUTA = 'DESASIGNACION_RUTA',
  ACTUALIZACION_TUC = 'ACTUALIZACION_TUC',
  RENOVACION_TUC = 'RENOVACION_TUC',
  SUSPENSION = 'SUSPENSION',
  REACTIVACION = 'REACTIVACION',
  BAJA_DEFINITIVA = 'BAJA_DEFINITIVA',
  MANTENIMIENTO = 'MANTENIMIENTO',
  INSPECCION = 'INSPECCION',
  ACCIDENTE = 'ACCIDENTE',
  MULTA = 'MULTA',
  REVISION_TECNICA = 'REVISION_TECNICA',
  CAMBIO_PROPIETARIO = 'CAMBIO_PROPIETARIO',
  ACTUALIZACION_DATOS_TECNICOS = 'ACTUALIZACION_DATOS_TECNICOS',
  OTROS = 'OTROS'
}

export interface DocumentoSoporte {
  id?: string;
  nombre: string;
  tipo: string;
  url: string;
  tamaño?: number;
  fechaSubida: string;
}

export interface FiltrosHistorialVehicular {
  vehiculoId?: string;
  placa?: string;
  tipoEvento?: TipoEventoHistorial[];
  empresaId?: string;
  resolucionId?: string;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estadoAnterior?: EstadoVehiculo;
  estadoNuevo?: EstadoVehiculo;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HistorialVehicularResponse {
  historial: HistorialVehicular[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResumenHistorialVehicular {
  vehiculoId: string;
  placa: string;
  totalEventos: number;
  ultimoEvento?: HistorialVehicular;
  eventosPorTipo: { [key in TipoEventoHistorial]?: number };
  empresasHistoricas: {
    empresaId: string;
    empresaNombre: string;
    fechaInicio: string;
    fechaFin?: string;
    duracionDias?: number;
  }[];
  resolucionesHistoricas: {
    resolucionId: string;
    resolucionNumero: string;
    fechaInicio: string;
    fechaFin?: string;
    duracionDias?: number;
  }[];
  estadosHistoricos: {
    estado: EstadoVehiculo;
    fechaInicio: string;
    fechaFin?: string;
    duracionDias?: number;
  }[];
}

// Tipos para reportes y estadísticas
export interface EstadisticasHistorialVehicular {
  totalEventos: number;
  eventosPorMes: { mes: string; cantidad: number }[];
  eventosPorTipo: { tipo: TipoEventoHistorial; cantidad: number; porcentaje: number }[];
  transferenciasEmpresa: number;
  cambiosResolucion: number;
  cambiosEstado: number;
  vehiculosConMasEventos: {
    vehiculoId: string;
    placa: string;
    totalEventos: number;
  }[];
  empresasConMasTransferencias: {
    empresaId: string;
    empresaNombre: string;
    transferenciasRecibidas: number;
    transferenciasEnviadas: number;
  }[];
}

export interface ConfiguracionHistorial {
  retencionDias: number; // Días que se mantiene el historial
  compresionAutomatica: boolean; // Si se comprimen registros antiguos
  notificacionesActivas: boolean; // Si se envían notificaciones de eventos críticos
  auditoriaNivel: 'BASICO' | 'COMPLETO' | 'DETALLADO';
  backupAutomatico: boolean;
  frecuenciaBackup: 'DIARIO' | 'SEMANAL' | 'MENSUAL';
}