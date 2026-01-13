/**
 * Modelo de datos para conductores que vendrán de un sistema externo
 * Este modelo está preparado para recibir datos de otro sistema en el futuro
 */

export interface ConductorExterno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  
  // Información de licencia
  licencia: {
    numero: string;
    categoria: string;
    fechaEmision: string;
    fechaVencimiento: string;
    estado: EstadoLicencia;
    restricciones?: string[];
  };
  
  // Estado del conductor
  estado: EstadoConductor;
  fechaRegistro: string;
  fechaActualizacion: string;
  
  // Información adicional del sistema externo
  sistemaOrigen: {
    id: string;
    nombre: string;
    version: string;
    ultimaSincronizacion: string;
  };
  
  // Datos de la empresa actual (si aplica)
  empresaActual?: {
    id: string;
    razonSocial: string;
    ruc: string;
    fechaAsignacion: string;
  };
  
  // Historial de infracciones (si viene del sistema externo)
  infracciones?: InfraccionConductor[];
  
  // Certificaciones adicionales
  certificaciones?: CertificacionConductor[];
}

export enum EstadoLicencia {
  VIGENTE = 'VIGENTE',
  VENCIDA = 'VENCIDA',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA',
  EN_TRAMITE = 'EN_TRAMITE'
}

export enum EstadoConductor {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  INHABILITADO = 'INHABILITADO'
}

export interface InfraccionConductor {
  id: string;
  codigo: string;
  descripcion: string;
  fecha: string;
  monto: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  puntos?: number;
}

export interface CertificacionConductor {
  id: string;
  tipo: string;
  nombre: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  entidadEmisora: string;
  estado: 'VIGENTE' | 'VENCIDA' | 'SUSPENDIDA';
}

// Interfaces para la integración con el sistema externo
export interface SolicitudConductores {
  filtros?: {
    estado?: EstadoConductor;
    estadoLicencia?: EstadoLicencia;
    empresaId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  };
  paginacion?: {
    skip: number;
    limit: number;
  };
  ordenamiento?: {
    campo: string;
    direccion: 'ASC' | 'DESC';
  };
}

export interface RespuestaConductores {
  conductores: ConductorExterno[];
  total: number;
  pagina: number;
  totalPaginas: number;
  ultimaActualizacion: string;
  sistemaOrigen: {
    nombre: string;
    version: string;
    estado: 'ONLINE' | 'OFFLINE' | 'MANTENIMIENTO';
  };
}

// Configuración para la integración futura
export interface ConfiguracionSistemaConductores {
  url: string;
  apiKey: string;
  timeout: number;
  reintentos: number;
  intervaloSincronizacion: number; // en minutos
  habilitado: boolean;
}

// Eventos de sincronización
export interface EventoSincronizacionConductores {
  id: string;
  tipo: 'SINCRONIZACION_COMPLETA' | 'SINCRONIZACION_INCREMENTAL' | 'ERROR';
  fecha: string;
  resultado: {
    conductoresActualizados: number;
    conductoresNuevos: number;
    errores: string[];
  };
  duracion: number; // en milisegundos
}