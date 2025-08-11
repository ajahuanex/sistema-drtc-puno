export interface Oficina {
  id: string;
  nombre: string;
  codigo: string; // Código interno de la oficina
  ubicacion: string; // Dirección física de la oficina
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsable?: ResponsableOficina;
  tipoOficina: TipoOficina;
  estaActiva: boolean;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  
  // Información de capacidad y carga de trabajo
  capacidadMaxima: number; // Expedientes máximos que puede procesar simultáneamente
  expedientesActivos: number; // Expedientes actualmente en proceso
  tiempoPromedioTramite: number; // Tiempo promedio en días para procesar un expediente
  prioridad: PrioridadOficina; // Prioridad de la oficina en el flujo de trabajo
  
  // Metadatos adicionales
  descripcion?: string;
  observaciones?: string;
  tags?: string[];
}

export interface ResponsableOficina {
  id: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  email: string;
  telefono?: string;
  extension?: string;
  horarioDisponibilidad?: string;
  fechaAsignacion: Date;
  estaActivo: boolean;
}

export enum TipoOficina {
  RECEPCION = 'RECEPCION',
  REVISION_TECNICA = 'REVISION_TECNICA',
  LEGAL = 'LEGAL',
  FINANCIERA = 'FINANCIERA',
  APROBACION = 'APROBACION',
  FISCALIZACION = 'FISCALIZACION',
  ARCHIVO = 'ARCHIVO',
  COORDINACION = 'COORDINACION',
  DIRECCION = 'DIRECCION',
  OTRA = 'OTRA'
}

export enum PrioridadOficina {
  BAJA = 'BAJA',
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

// Interfaces para creación y actualización
export interface OficinaCreate {
  nombre: string;
  codigo: string;
  ubicacion: string;
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsableId?: string;
  tipoOficina: TipoOficina;
  capacidadMaxima: number;
  tiempoPromedioTramite: number;
  prioridad: PrioridadOficina;
  descripcion?: string;
  observaciones?: string;
  tags?: string[];
}

export interface OficinaUpdate {
  nombre?: string;
  codigo?: string;
  ubicacion?: string;
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsableId?: string;
  tipoOficina?: TipoOficina;
  estaActiva?: boolean;
  capacidadMaxima?: number;
  tiempoPromedioTramite?: number;
  prioridad?: PrioridadOficina;
  descripcion?: string;
  observaciones?: string;
  tags?: string[];
}

// Interface para respuesta con estadísticas
export interface OficinaResponse extends Oficina {
  estadisticas: EstadisticasOficina;
  expedientesEnCola: ExpedienteEnCola[];
  proximosVencimientos: ProximoVencimiento[];
}

export interface EstadisticasOficina {
  expedientesProcesadosHoy: number;
  expedientesProcesadosSemana: number;
  expedientesProcesadosMes: number;
  tiempoPromedioUltimaSemana: number;
  expedientesRetrasados: number;
  eficiencia: number; // Porcentaje de expedientes procesados a tiempo
}

export interface ExpedienteEnCola {
  id: string;
  nroExpediente: string;
  empresaNombre: string;
  fechaLlegada: Date;
  tiempoEstimado: number;
  urgencia: string;
  prioridad: number;
}

export interface ProximoVencimiento {
  id: string;
  nroExpediente: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  urgencia: string;
} 