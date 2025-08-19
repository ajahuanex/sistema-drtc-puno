export interface BajaVehiculo {
  id: string;
  vehiculoId: string;
  placa: string;
  empresaId: string;
  fechaBaja: string;
  tipoBaja: TipoBajaVehiculo;
  motivo: string;
  descripcion?: string;
  observaciones?: string;
  resolucionId?: string;
  usuarioId: string;
  estadoBaja: EstadoBajaVehiculo;
  fechaCreacion: string;
  fechaActualizacion?: string;
  
  // Información adicional según el tipo de baja
  vehiculoSustitutoId?: string; // Para sustitución
  fechaAccidente?: string; // Para accidentes
  lugarAccidente?: string; // Para accidentes
  valorVenta?: number; // Para ventas
  comprador?: string; // Para ventas
  documentosSustentatorios?: string[]; // IDs de documentos
  
  // Auditoría
  aprobadoPor?: string;
  fechaAprobacion?: string;
  rechazadoPor?: string;
  fechaRechazo?: string;
  motivoRechazo?: string;
}

export enum TipoBajaVehiculo {
  SUSTITUCION = 'SUSTITUCION',           // Reemplazado por otro vehículo
  VIGENCIA_CADUCADA = 'VIGENCIA_CADUCADA', // Año de vigencia expirado
  ACCIDENTE_GRAVE = 'ACCIDENTE_GRAVE',     // Accidente que inhabilita el vehículo
  VENTA = 'VENTA',                         // Vehículo vendido a terceros
  DESGUACE = 'DESGUACE',                   // Vehículo desarmado para repuestos
  ROBO = 'ROBO',                           // Vehículo robado
  INCENDIO = 'INCENDIO',                   // Vehículo destruido por incendio
  INUNDACION = 'INUNDACION',               // Vehículo dañado por inundación
  OBSOLESCENCIA = 'OBSOLESCENCIA',        // Vehículo obsoleto técnicamente
  FALTA_DOCUMENTACION = 'FALTA_DOCUMENTACION', // Falta documentación requerida
  OTRO = 'OTRO'                            // Otros motivos
}

export enum EstadoBajaVehiculo {
  PENDIENTE = 'PENDIENTE',           // Solicitud enviada, pendiente de aprobación
  APROBADA = 'APROBADA',             // Baja aprobada por autoridad competente
  RECHAZADA = 'RECHAZADA',           // Baja rechazada
  EN_PROCESO = 'EN_PROCESO',         // Baja en proceso de ejecución
  COMPLETADA = 'COMPLETADA',          // Baja completada exitosamente
  CANCELADA = 'CANCELADA',           // Solicitud cancelada
  SUSPENDIDA = 'SUSPENDIDA'          // Baja suspendida temporalmente
}

export interface BajaVehiculoCreate {
  vehiculoId: string;
  empresaId: string;
  fechaBaja: string;
  tipoBaja: TipoBajaVehiculo;
  motivo: string;
  descripcion?: string;
  observaciones?: string;
  resolucionId?: string;
  vehiculoSustitutoId?: string;
  fechaAccidente?: string;
  lugarAccidente?: string;
  valorVenta?: number;
  comprador?: string;
  documentosSustentatorios?: string[];
}

export interface BajaVehiculoUpdate {
  fechaBaja?: string;
  tipoBaja?: TipoBajaVehiculo;
  motivo?: string;
  descripcion?: string;
  observaciones?: string;
  resolucionId?: string;
  vehiculoSustitutoId?: string;
  fechaAccidente?: string;
  lugarAccidente?: string;
  valorVenta?: number;
  comprador?: string;
  documentosSustentatorios?: string[];
  estadoBaja?: EstadoBajaVehiculo;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  rechazadoPor?: string;
  fechaRechazo?: string;
  motivoRechazo?: string;
}

export interface FiltroBajaVehiculo {
  empresaId?: string;
  vehiculoId?: string;
  placa?: string;
  tipoBaja?: TipoBajaVehiculo;
  estadoBaja?: EstadoBajaVehiculo;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ResumenBajasVehiculo {
  totalBajas: number;
  bajasPendientes: number;
  bajasAprobadas: number;
  bajasRechazadas: number;
  bajasCompletadas: number;
  vehiculosBajados: number;
  empresasAfectadas: number;
  ultimaBaja?: string;
  
  // Desglose por tipo
  porTipo: {
    [key in TipoBajaVehiculo]: number;
  };
  
  // Desglose por estado
  porEstado: {
    [key in EstadoBajaVehiculo]: number;
  };
}

// Interfaces para el dashboard de bajas
export interface BajaVehiculoResumen {
  id: string;
  vehiculoId: string;
  placa: string;
  marca: string;
  modelo: string;
  fechaBaja: string;
  tipoBaja: TipoBajaVehiculo;
  estadoBaja: EstadoBajaVehiculo;
  motivo: string;
  empresa: string;
}

export interface DashboardBajasEmpresa {
  empresaId: string;
  nombreEmpresa: string;
  resumen: ResumenBajasVehiculo;
  bajasRecientes: BajaVehiculoResumen[];
  vehiculosBajados: string[];
  vehiculosActivos: string[];
}

// Interfaces para reportes
export interface ReporteBajasVehiculo {
  periodo: string;
  totalBajas: number;
  resumenPorTipo: Array<{
    tipo: TipoBajaVehiculo;
    cantidad: number;
    porcentaje: number;
  }>;
  resumenPorEmpresa: Array<{
    empresa: string;
    cantidad: number;
    porcentaje: number;
  }>;
  resumenPorEstado: Array<{
    estado: EstadoBajaVehiculo;
    cantidad: number;
    porcentaje: number;
  }>;
  bajasDetalladas: BajaVehiculo[];
} 