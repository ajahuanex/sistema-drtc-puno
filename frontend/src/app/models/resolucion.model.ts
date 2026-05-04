export type EstadoResolucion = 'VIGENTE' | 'VENCIDA' | 'SUSPENDIDA' | 'REVOCADA' | 'DADA_DE_BAJA' | 'RENOVADA' | 'ANULADA';

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
  nroResolucion: string; // Número de resolución actual (HIJA si existe, sino PADRE)
  ruc: string; // RUC de la empresa
  empresaId: string;
  
  // Resoluciones padre e hijas
  resolucionPadreId?: string; // ID de la resolución padre
  nroResolucionPadre?: string; // Número de la resolución padre
  resolucionesHijasIds: string[]; // IDs de resoluciones hijas
  nroResolucionesHijas?: string[]; // Números de resoluciones hijas
  
  // Fechas
  fechaEmision: Date; // Fecha de emisión (de la resolución padre si no hay hija)
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  aniosVigencia?: number; // Años de vigencia (4 o 10)
  
  // Trámite
  tipoTramite: TipoTramite; // PRIMIGENIA, MODIFICACION, INCREMENTO, SUSTITUCION, RENOVACION, OTROS
  tipoAutorizacion?: string; // Tipo de autorización
  
  // Estado
  estado?: EstadoResolucion; // VIGENTE, VENCIDA, SUSPENDIDA, REVOCADA, DADA_DE_BAJA, RENOVADA, ANULADA
  
  // Listas
  observacionesList?: string[]; // Lista de observaciones
  resolucionesRenovadas?: string[]; // Números de resoluciones que renovaron a esta
  
  // Eficacia anticipada
  tieneEficaciaAnticipada?: boolean | null;
  diasEficaciaAnticipada?: number | null;
  
  // Campos adicionales
  tipoResolucion: TipoResolucion; // PADRE o HIJO
  vehiculosHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  documentoId?: string;
  estaActivo: boolean;
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  usuarioEmisionId?: string;
  
  // Compatibilidad
  observaciones?: string;
  documentos?: any[];
  auditoria?: any[];
  bajasVehiculos?: BajaVehiculoResolucion[];
  vehiculosSustituidos?: string[];
  vehiculosRenovados?: string[];
  resolucionSustituidaId?: string;
  resolucionRenovadaId?: string;
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
  fechaEmision: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  aniosVigencia?: number; // Años de vigencia de la resolución (4 o 10)
  tipoResolucion: TipoResolucion;
  tipoTramite: TipoTramite;
  empresaId: string;
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
  aniosVigencia?: number; // Años de vigencia de la resolución (4 o 10)
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