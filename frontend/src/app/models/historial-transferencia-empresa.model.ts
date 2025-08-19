export interface ArchivoSustentatorio {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  url: string;
  fechaSubida: string;
  descripcion?: string;
  categoria: CategoriaArchivo;
}

export enum CategoriaArchivo {
  RESOLUCION = 'RESOLUCION',
  CONTRATO = 'CONTRATO',
  FACTURA = 'FACTURA',
  RECIBO = 'RECIBO',
  AUTORIZACION = 'AUTORIZACION',
  INSPECCION = 'INSPECCION',
  OTRO = 'OTRO'
}

export interface HistorialTransferenciaEmpresa {
  id: string;
  empresaOrigenId: string;
  empresaDestinoId: string;
  vehiculoId: string;
  placa: string;
  fechaTransferencia: string;
  motivo: string;
  observaciones?: string;
  resolucionId?: string;
  usuarioId: string;
  tipoTransferencia: TipoTransferenciaVehiculo;
  estadoTransferencia: EstadoTransferencia;
  fechaCreacion: string;
  fechaActualizacion?: string;
  archivosSustentatorios: ArchivoSustentatorio[];
}

export enum TipoTransferenciaVehiculo {
  TRANSFERENCIA_VOLUNTARIA = 'TRANSFERENCIA_VOLUNTARIA',
  TRANSFERENCIA_ADMINISTRATIVA = 'TRANSFERENCIA_ADMINISTRATIVA',
  TRANSFERENCIA_FISCALIZACION = 'TRANSFERENCIA_FISCALIZACION',
  TRANSFERENCIA_EMERGENCIA = 'TRANSFERENCIA_EMERGENCIA'
}

export enum EstadoTransferencia {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA'
}

export interface HistorialTransferenciaEmpresaCreate {
  empresaOrigenId: string;
  empresaDestinoId: string;
  vehiculoId: string;
  placa: string;
  fechaTransferencia: string;
  motivo: string;
  observaciones?: string;
  resolucionId?: string;
  usuarioId: string;
  tipoTransferencia: TipoTransferenciaVehiculo;
  archivosSustentatorios?: ArchivoSustentatorio[];
}

export interface HistorialTransferenciaEmpresaUpdate {
  motivo?: string;
  observaciones?: string;
  estadoTransferencia?: EstadoTransferencia;
  resolucionId?: string;
  archivosSustentatorios?: ArchivoSustentatorio[];
}

export interface FiltroHistorialTransferenciaEmpresa {
  empresaId?: string;
  vehiculoId?: string;
  placa?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoTransferencia?: TipoTransferenciaVehiculo;
  estadoTransferencia?: EstadoTransferencia;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ResumenTransferenciasEmpresa {
  totalTransferencias: number;
  transferenciasPendientes: number;
  transferenciasAprobadas: number;
  transferenciasRechazadas: number;
  transferenciasCompletadas: number;
  vehiculosTransferidos: number;
  empresasDestino: number;
  ultimaTransferencia?: string;
}

// Interfaces para el dashboard de transferencias
export interface TransferenciaVehiculo {
  id: string;
  vehiculoId: string;
  placa: string;
  marca: string;
  modelo: string;
  fechaTransferencia: string;
  empresaOrigen: string;
  empresaDestino: string;
  estado: EstadoTransferencia;
  motivo: string;
}

export interface DashboardTransferenciasEmpresa {
  empresaId: string;
  nombreEmpresa: string;
  resumen: ResumenTransferenciasEmpresa;
  transferenciasRecientes: TransferenciaVehiculo[];
  vehiculosTransferidos: string[];
  vehiculosRecibidos: string[];
} 