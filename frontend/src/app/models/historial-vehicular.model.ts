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
  
  // Campos adicionales para compatibilidad con HistorialVehiculo
  fechaCambio?: string; // Alias de fechaEvento
  tipoCambio?: TipoEventoHistorial; // Alias de tipoEvento
  empresaOrigenId?: string; // Alias de empresaAnteriorId
  empresaDestinoId?: string; // Alias de empresaNuevaId
  empresaOrigenNombre?: string; // Alias de empresaAnteriorNombre
  empresaDestinoNombre?: string; // Alias de empresaNuevaNombre
  resolucionId?: string; // Para cambios de resolución
  resolucionNumero?: string;
  rutaId?: string;
  rutaNombre?: string;
  motivo?: string; // Alias de descripcion
  oficinaId?: string;
  oficinaNombre?: string;
  documentos?: DocumentoSoporte[]; // Alias de documentosSoporte
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
  
  // Campos adicionales para compatibilidad
  fechaCambio?: string;
  tipoCambio?: TipoEventoHistorial;
  empresaOrigenId?: string;
  empresaDestinoId?: string;
  resolucionId?: string;
  rutaId?: string;
  motivo?: string;
  oficinaId?: string;
  documentos?: DocumentoSoporte[];
}

export interface HistorialVehicularUpdate {
  descripcion?: string;
  observaciones?: string;
  documentosSoporte?: DocumentoSoporte[];
  
  // Campos adicionales para compatibilidad
  fechaCambio?: string;
  motivo?: string;
  documentos?: DocumentoSoporte[];
}

// Alias para compatibilidad con HistorialVehiculo
export type HistorialVehiculoCreate = HistorialVehicularCreate;
export type HistorialVehiculoUpdate = HistorialVehicularUpdate;
export type HistorialVehiculo = HistorialVehicular;

export enum TipoEventoHistorial {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  TRANSFERENCIA_EMPRESA = 'TRANSFERENCIA_EMPRESA',
  CAMBIO_RESOLUCION = 'CAMBIO_RESOLUCION',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  ASIGNACION_RUTA = 'ASIGNACION_RUTA',
  DESASIGNACION_RUTA = 'DESASIGNACION_RUTA',
  REMOCION_RUTA = 'REMOCION_RUTA', // Alias de DESASIGNACION_RUTA
  ACTUALIZACION_TUC = 'ACTUALIZACION_TUC',
  RENOVACION_TUC = 'RENOVACION_TUC',
  SUSPENSION = 'SUSPENSION',
  REACTIVACION = 'REACTIVACION',
  ACTIVACION = 'ACTIVACION', // Alias de REACTIVACION
  DESACTIVACION = 'DESACTIVACION', // Alias de SUSPENSION
  BAJA_DEFINITIVA = 'BAJA_DEFINITIVA',
  MANTENIMIENTO = 'MANTENIMIENTO',
  INSPECCION = 'INSPECCION',
  INSPECCION_TECNICA = 'INSPECCION_TECNICA', // Alias de INSPECCION
  ACCIDENTE = 'ACCIDENTE',
  MULTA = 'MULTA',
  SANCION = 'SANCION', // Alias de MULTA
  REVISION_TECNICA = 'REVISION_TECNICA',
  CAMBIO_PROPIETARIO = 'CAMBIO_PROPIETARIO',
  ACTUALIZACION_DATOS_TECNICOS = 'ACTUALIZACION_DATOS_TECNICOS',
  MODIFICACION_DATOS = 'MODIFICACION_DATOS', // Alias de ACTUALIZACION_DATOS_TECNICOS
  REHABILITACION = 'REHABILITACION',
  OTROS = 'OTROS'
}

// Alias de tipo para compatibilidad con HistorialVehiculo
export type TipoCambioVehiculo = TipoEventoHistorial;

export interface DocumentoSoporte {
  id?: string;
  nombre: string;
  tipo: string;
  url: string;
  tamaño?: number;
  fechaSubida: string;
}

// Alias para compatibilidad - DocumentoHistorial es el mismo que DocumentoSoporte
export type DocumentoHistorial = DocumentoSoporte;

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
  
  // Campos adicionales para compatibilidad
  tipoCambio?: TipoEventoHistorial;
  estado?: string;
  oficinaId?: string;
}

// Alias para compatibilidad con HistorialVehiculo
export type FiltroHistorialVehiculo = FiltrosHistorialVehicular;

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
  
  // Campos adicionales para compatibilidad con HistorialVehiculo
  totalCambios?: number; // Alias de totalEventos
  ultimoCambio?: string;
  empresaActual?: string;
  estadoActual?: string;
  resolucionActual?: string;
  rutaActual?: string;
  tiposCambio?: TipoEventoHistorial[];
  empresasInvolucradas?: string[];
}

// Alias para compatibilidad
export type ResumenHistorialVehiculo = ResumenHistorialVehicular;

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