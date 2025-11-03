// Enums
export enum TipoReporte {
  DOCUMENTOS_RECIBIDOS = 'DOCUMENTOS_RECIBIDOS',
  DOCUMENTOS_POR_ESTADO = 'DOCUMENTOS_POR_ESTADO',
  DOCUMENTOS_POR_TIPO = 'DOCUMENTOS_POR_TIPO',
  DOCUMENTOS_POR_AREA = 'DOCUMENTOS_POR_AREA',
  TIEMPOS_ATENCION = 'TIEMPOS_ATENCION',
  DOCUMENTOS_VENCIDOS = 'DOCUMENTOS_VENCIDOS',
  PRODUCTIVIDAD_AREAS = 'PRODUCTIVIDAD_AREAS',
  INTEGRACIONES = 'INTEGRACIONES',
  PERSONALIZADO = 'PERSONALIZADO'
}

export enum FormatoExportacion {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON'
}

export enum PeriodoReporte {
  HOY = 'HOY',
  AYER = 'AYER',
  ULTIMA_SEMANA = 'ULTIMA_SEMANA',
  ULTIMO_MES = 'ULTIMO_MES',
  ULTIMO_TRIMESTRE = 'ULTIMO_TRIMESTRE',
  ULTIMO_ANIO = 'ULTIMO_ANIO',
  PERSONALIZADO = 'PERSONALIZADO'
}

// Interfaces
export interface Estadisticas {
  totalDocumentos: number;
  documentosRecibidos: number;
  documentosEnProceso: number;
  documentosAtendidos: number;
  documentosArchivados: number;
  documentosVencidos: number;
  documentosUrgentes: number;
  tiempoPromedioAtencion: number; // en horas
  porcentajeAtendidos: number;
  tendencia: {
    periodo: string;
    valor: number;
  }[];
}

export interface EstadisticasPorArea {
  areaId: string;
  areaNombre: string;
  documentosRecibidos: number;
  documentosAtendidos: number;
  documentosPendientes: number;
  tiempoPromedioAtencion: number;
  porcentajeEficiencia: number;
}

export interface EstadisticasPorTipo {
  tipoDocumentoId: string;
  tipoDocumentoNombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface MetricasRendimiento {
  documentosPorDia: {
    fecha: Date;
    recibidos: number;
    atendidos: number;
  }[];
  distribucionPorEstado: {
    estado: string;
    cantidad: number;
    porcentaje: number;
  }[];
  distribucionPorPrioridad: {
    prioridad: string;
    cantidad: number;
    porcentaje: number;
  }[];
  tiemposAtencion: {
    promedio: number;
    minimo: number;
    maximo: number;
    mediana: number;
  };
}

export interface FiltrosReporte {
  fechaDesde?: Date;
  fechaHasta?: Date;
  periodo?: PeriodoReporte;
  areaId?: string;
  tipoDocumentoId?: string;
  estado?: string;
  prioridad?: string;
  usuarioId?: string;
}

export interface ConfiguracionReporte {
  tipo: TipoReporte;
  titulo: string;
  descripcion?: string;
  filtros: FiltrosReporte;
  incluirGraficos: boolean;
  incluirDetalles: boolean;
  agruparPor?: string[];
}

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  titulo: string;
  descripcion?: string;
  filtros: FiltrosReporte;
  estadisticas: Estadisticas;
  metricas?: MetricasRendimiento;
  estadisticasPorArea?: EstadisticasPorArea[];
  estadisticasPorTipo?: EstadisticasPorTipo[];
  fechaGeneracion: Date;
  generadoPor: {
    id: string;
    nombres: string;
    apellidos: string;
  };
}

export interface ResultadoExportacion {
  exitoso: boolean;
  mensaje: string;
  url?: string;
  nombreArchivo?: string;
}
