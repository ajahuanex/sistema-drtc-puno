// ========================================
// INFRAESTRUCTURA MODEL
// ========================================

export enum TipoInfraestructura {
  TERMINAL_TERRESTRE = 'TERMINAL_TERRESTRE',
  ESTACION_DE_RUTA = 'ESTACION_DE_RUTA',
  OTROS = 'OTROS'
}

export enum EstadoInfraestructura {
  AUTORIZADA = 'AUTORIZADA',
  EN_TRAMITE = 'EN_TRAMITE',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA'
}

export interface RazonSocialInfraestructura {
  principal: string;
  sunat?: string;
  minimo?: string;
}

export interface RepresentanteLegalInfraestructura {
  dni: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface DocumentoInfraestructura {
  id: string;
  tipo: string;
  numero: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  entidadEmisora: string;
  urlArchivo?: string;
  esDocumentoFisico: boolean;
  observaciones?: string;
}

export interface AuditoriaInfraestructura {
  fechaCambio: string;
  usuarioId: string;
  tipoCambio: string;
  campoAnterior?: string;
  campoNuevo: string;
  observaciones?: string;
}

export interface HistorialEstadoInfraestructura {
  fechaCambio: string;
  usuarioId: string;
  estadoAnterior: EstadoInfraestructura;
  estadoNuevo: EstadoInfraestructura;
  motivo: string;
  tipoDocumentoSustentatorio?: string;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: string;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface DatosSunatInfraestructura {
  valido: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  fechaActualizacion?: string;
  error?: string;
}

export interface EspecificacionesInfraestructura {
  capacidadMaxima?: number;
  areaTotal?: number;
  numeroAndenes?: number;
  numeroPlataformas?: number;
  serviciosDisponibles?: string[];
  horarioOperacion?: {
    apertura: string;
    cierre: string;
    diasOperacion: string[];
  };
  coordenadasGPS?: {
    latitud: number;
    longitud: number;
  };
  zonasOperativas?: {
    nombre: string;
    capacidad: number;
    tipo: string;
  }[];
}

export interface Infraestructura {
  id: string;
  ruc: string;
  razonSocial: RazonSocialInfraestructura;
  tipoInfraestructura: TipoInfraestructura;
  direccionFiscal: string;
  estado: EstadoInfraestructura;
  estaActivo: boolean;
  fechaRegistro: string;
  fechaActualizacion: string;
  representanteLegal: RepresentanteLegalInfraestructura;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos: DocumentoInfraestructura[];
  auditoria: AuditoriaInfraestructura[];
  historialEstados: HistorialEstadoInfraestructura[];
  datosSunat: DatosSunatInfraestructura;
  ultimaValidacionSunat: string;
  scoreRiesgo: number;
  observaciones?: string;
  especificaciones: EspecificacionesInfraestructura;
  resolucionesPrimigeniasIds: string[];
  licenciasOperacion: string[];
  certificacionesCalidad: string[];
}

export interface InfraestructuraEstadisticas {
  totalInfraestructuras: number;
  autorizadas: number;
  enTramite: number;
  suspendidas: number;
  canceladas: number;
  terminalesTerrestre: number;
  estacionesRuta: number;
  otros: number;
  capacidadTotalInstalada: number;
  promedioCapacidadPorInfraestructura: number;
  infraestructurasConDocumentosVencidos: number;
  infraestructurasConScoreAltoRiesgo: number;
}

export interface FiltrosInfraestructura {
  tipoInfraestructura?: TipoInfraestructura[];
  estado?: EstadoInfraestructura[];
  departamento?: string;
  provincia?: string;
  distrito?: string;
  capacidadMinima?: number;
  capacidadMaxima?: number;
  fechaRegistroDesde?: string;
  fechaRegistroHasta?: string;
  conDocumentosVencidos?: boolean;
  scoreRiesgoMinimo?: number;
  scoreRiesgoMaximo?: number;
  textoBusqueda?: string;
}

export interface CrearInfraestructuraRequest {
  ruc: string;
  razonSocial: RazonSocialInfraestructura;
  tipoInfraestructura: TipoInfraestructura;
  direccionFiscal: string;
  representanteLegal: RepresentanteLegalInfraestructura;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  especificaciones: EspecificacionesInfraestructura;
  observaciones?: string;
}

export interface ActualizarInfraestructuraRequest {
  razonSocial?: RazonSocialInfraestructura;
  direccionFiscal?: string;
  representanteLegal?: RepresentanteLegalInfraestructura;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  especificaciones?: EspecificacionesInfraestructura;
  observaciones?: string;
}

export interface CambiarEstadoInfraestructuraRequest {
  estadoNuevo: EstadoInfraestructura;
  motivo: string;
  tipoDocumentoSustentatorio?: string;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: string;
  entidadEmisora?: string;
  observaciones?: string;
}

export interface InfraestructuraListResponse {
  infraestructuras: Infraestructura[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface InfraestructuraResponse {
  infraestructura: Infraestructura;
  mensaje?: string;
}

// Utilidades y helpers
export class InfraestructuraUtils {
  static getTipoInfraestructuraLabel(tipo: TipoInfraestructura): string {
    const labels: { [key in TipoInfraestructura]: string } = {
      [TipoInfraestructura.TERMINAL_TERRESTRE]: 'Terminal Terrestre',
      [TipoInfraestructura.ESTACION_DE_RUTA]: 'Estación de Ruta',
      [TipoInfraestructura.OTROS]: 'Otros Servicios'
    };
    return labels[tipo] || tipo;
  }

  static getTipoInfraestructuraIcon(tipo: TipoInfraestructura): string {
    const icons: { [key in TipoInfraestructura]: string } = {
      [TipoInfraestructura.TERMINAL_TERRESTRE]: 'location_city',
      [TipoInfraestructura.ESTACION_DE_RUTA]: 'train',
      [TipoInfraestructura.OTROS]: 'more_horiz'
    };
    return icons[tipo] || 'business';
  }

  static getEstadoInfraestructuraLabel(estado: EstadoInfraestructura): string {
    const labels: { [key in EstadoInfraestructura]: string } = {
      [EstadoInfraestructura.AUTORIZADA]: 'Autorizada',
      [EstadoInfraestructura.EN_TRAMITE]: 'En Trámite',
      [EstadoInfraestructura.SUSPENDIDA]: 'Suspendida',
      [EstadoInfraestructura.CANCELADA]: 'Cancelada'
    };
    return labels[estado] || estado;
  }

  static getEstadoInfraestructuraColor(estado: EstadoInfraestructura): string {
    const colors: { [key in EstadoInfraestructura]: string } = {
      [EstadoInfraestructura.AUTORIZADA]: '#4caf50',
      [EstadoInfraestructura.EN_TRAMITE]: '#2196f3',
      [EstadoInfraestructura.SUSPENDIDA]: '#ff9800',
      [EstadoInfraestructura.CANCELADA]: '#f44336'
    };
    return colors[estado] || '#666';
  }

  static validarRUC(ruc: string): boolean {
    // Validación básica de RUC peruano
    if (!ruc || ruc.length !== 11) return false;
    return /^\d{11}$/.test(ruc);
  }

  static formatearCapacidad(capacidad: number): string {
    if (capacidad >= 1000) {
      return `${(capacidad / 1000).toFixed(1)}K`;
    }
    return capacidad.toString();
  }

  static calcularScoreRiesgo(infraestructura: Infraestructura): number {
    let score = 0;
    
    // Factores de riesgo
    if (infraestructura.estado === EstadoInfraestructura.SUSPENDIDA) score += 30;
    if (infraestructura.estado === EstadoInfraestructura.CANCELADA) score += 50;
    
    // Documentos vencidos
    const documentosVencidos = infraestructura.documentos.filter(doc => {
      if (!doc.fechaVencimiento) return false;
      return new Date(doc.fechaVencimiento) < new Date();
    }).length;
    score += documentosVencidos * 10;
    
    // Datos SUNAT inválidos
    if (!infraestructura.datosSunat.valido) score += 20;
    
    return Math.min(score, 100);
  }
}