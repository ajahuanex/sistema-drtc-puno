export type EstadoResolucion = 'VIGENTE' | 'VENCIDA' | 'SUSPENDIDA' | 'REVOCADA' | 'DADA_DE_BAJA';

export type TipoResolucion = 'PADRE' | 'HIJO';

export type TipoTramite = 'AUTORIZACION_NUEVA' | 'PRIMIGENIA' | 'RENOVACION' | 'INCREMENTO' | 'SUSTITUCION' | 'OTROS';

export type TipoResolucionSimple = 'PRIMIGENIA' | 'AMPLIACION' | 'MODIFICACION';

// Nuevos tipos para integración con bajas vehiculares
export type TipoBajaResolucion = 'SUSTITUCION_VEHICULO' | 'RENOVACION_VEHICULO' | 'INCREMENTO_VEHICULO' | 'OTROS';

export interface BajaVehiculoResolucion {
  id: string;
  vehiculoId: string;
  tipoBaja: TipoBajaResolucion;
  fechaBaja: Date;
  motivo: string;
  resolucionAnteriorId?: string; // Para SUSTITUCIÓN
  resolucionNuevaId?: string;    // Para SUSTITUCIÓN
  observaciones?: string;
  archivosSustentatorios?: string[]; // IDs de archivos
  estaActivo: boolean;
}

export interface Resolucion {
  id: string;
  nroResolucion: string; // Formato: R-1234-2025 (según el brief)
  empresaId: string;
  expedienteId: string; // ID del expediente que determina el tipo de trámite
  fechaEmision: Date;
  fechaVigenciaInicio?: Date; // Opcional: solo para PADRE + (PRIMIGENIA o RENOVACION)
  fechaVigenciaFin?: Date; // Opcional: solo para PADRE + (PRIMIGENIA o RENOVACION)
  tipoResolucion: TipoResolucion; // Se determina automáticamente: PADRE para PRIMIGENIA/RENOVACION, HIJO para otros
  resolucionPadreId?: string;
  resolucionesHijasIds: string[];
  vehiculosHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  tipoTramite: TipoTramite; // Se obtiene del expediente
  descripcion: string;
  observaciones?: string; // Agregado para compatibilidad con el frontend
  documentoId?: string;
  estaActivo: boolean;
  // Campos adicionales del brief
  estado?: EstadoResolucion;
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  usuarioEmisionId?: string;
  usuarioAprobacionId?: string;
  fechaAprobacion?: Date;
  motivoSuspension?: string;
  fechaSuspension?: Date;
  fechaVencimiento?: Date; // Para compatibilidad con el frontend
  documentos?: any[]; // Para compatibilidad con el servicio mock
  auditoria?: any[]; // Para compatibilidad con el servicio mock

  // Nuevos campos para integración con bajas vehiculares
  bajasVehiculos?: BajaVehiculoResolucion[];
  vehiculosSustituidos?: string[]; // IDs de vehículos sustituidos
  vehiculosRenovados?: string[];   // IDs de vehículos renovados
  resolucionSustituidaId?: string; // Para SUSTITUCIÓN: ID de la resolución que se sustituye
  resolucionRenovadaId?: string;   // Para RENOVACIÓN: ID de la resolución que se renueva
}

export interface DocumentoResolucion {
  id: string;
  tipo: string;
  nombre: string;
  url: string;
  fechaSubida: Date;
  estaActivo: boolean;
}

export interface AuditoriaResolucion {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: string;
  campoAnterior?: string;
  campoNuevo?: string;
  observaciones?: string;
}

export interface ResolucionCreate {
  nroResolucion: string; // Número completo (R-1234-2025)
  expedienteId: string; // ID del expediente que determina el tipo de trámite
  fechaEmision: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  tipoResolucion: TipoResolucion;
  tipoTramite: TipoTramite;
  empresaId: string;
  descripcion: string;
  observaciones?: string;
  resolucionPadreId?: string;
  usuarioEmisionId: string; // Campo requerido por el backend
  vehiculosHabilitadosIds?: string[];
  rutasAutorizadasIds?: string[];

  // Nuevos campos para integración con bajas vehiculares
  vehiculosSustituidos?: string[];
  vehiculosRenovados?: string[];
  resolucionSustituidaId?: string;
  resolucionRenovadaId?: string;
}

export interface ResolucionUpdate {
  numero?: string; // Solo el número (1234)
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  estado?: EstadoResolucion;
  tipo?: TipoResolucionSimple;
  empresaId?: string;
  vehiculoId?: string;
  rutaId?: string;
  conductorId?: string;
  descripcion?: string;
  observaciones?: string;
  estaActivo?: boolean;
  resolucionPadreId?: string;

  // Nuevos campos para integración con bajas vehiculares
  vehiculosSustituidos?: string[];
  vehiculosRenovados?: string[];
  resolucionSustituidaId?: string;
  resolucionRenovadaId?: string;
}

export interface ResolucionFiltros {
  numero?: string;
  empresaId?: string;
  vehiculoId?: string;
  rutaId?: string;
  conductorId?: string;
  estado?: EstadoResolucion;
  tipo?: TipoResolucionSimple;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estaActivo?: boolean;
}

export interface ResolucionEstadisticas {
  totalResoluciones: number;
  resolucionesVigentes: number;
  resolucionesVencidas: number;
  resolucionesSuspendidas: number;
  resolucionesCanceladas: number;
  resolucionesPrimigenias: number;
  resolucionesAmpliacion: number;
  resolucionesModificacion: number;
  proximasAVencer: number;
}

// Nueva interfaz para estadísticas de bajas vehiculares
export interface ResolucionBajasEstadisticas {
  totalBajas: number;
  bajasSustitucion: number;
  bajasRenovacion: number;
  bajasIncremento: number;
  vehiculosSustituidos: number;
  vehiculosRenovados: number;
  resolucionesConBajas: number;
}

// Nueva interfaz para el flujo de sustitución
export interface FlujoSustitucionVehiculo {
  resolucionAnteriorId: string;
  vehiculoAnteriorId: string;
  motivoSustitucion: string;
  fechaSustitucion: Date;
  vehiculoNuevoId?: string;
  observaciones?: string;
  archivosSustentatorios?: string[];
}

// Nueva interfaz para el flujo de renovación
export interface FlujoRenovacionVehiculo {
  resolucionAnteriorId: string;
  vehiculosRenovados: string[];
  motivoRenovacion: string;
  fechaRenovacion: Date;
  cambiosRealizados?: string;
  observaciones?: string;
  archivosSustentatorios?: string[];
} 