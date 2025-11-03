// Enums
export enum EstadoDocumento {
  REGISTRADO = 'REGISTRADO',
  EN_PROCESO = 'EN_PROCESO',
  ATENDIDO = 'ATENDIDO',
  ARCHIVADO = 'ARCHIVADO'
}

export enum PrioridadDocumento {
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

// Interfaces
export interface TipoDocumento {
  id: string;
  nombre: string;
  codigo: string;
  categorias: Categoria[];
}

export interface Categoria {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export interface ArchivoAdjunto {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  tamano: number;
  url: string;
  fechaSubida: Date;
}

export interface Documento {
  id: string;
  numeroExpediente: string;
  tipoDocumento: TipoDocumento;
  numeroDocumentoExterno?: string;
  remitente: string;
  asunto: string;
  numeroFolios: number;
  tieneAnexos: boolean;
  prioridad: PrioridadDocumento;
  estado: EstadoDocumento;
  fechaRecepcion: Date;
  fechaLimite?: Date;
  usuarioRegistro: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  areaActual?: {
    id: string;
    nombre: string;
  };
  archivosAdjuntos: ArchivoAdjunto[];
  etiquetas: string[];
  codigoQR: string;
  expedienteRelacionado?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentoCreate {
  tipoDocumentoId: string;
  numeroDocumentoExterno?: string;
  remitente: string;
  asunto: string;
  numeroFolios: number;
  tieneAnexos: boolean;
  prioridad?: PrioridadDocumento;
  fechaLimite?: Date;
  etiquetas?: string[];
  expedienteRelacionadoId?: string;
}

export interface DocumentoUpdate {
  tipoDocumentoId?: string;
  numeroDocumentoExterno?: string;
  remitente?: string;
  asunto?: string;
  numeroFolios?: number;
  tieneAnexos?: boolean;
  prioridad?: PrioridadDocumento;
  estado?: EstadoDocumento;
  fechaLimite?: Date;
  etiquetas?: string[];
}

export interface FiltrosDocumento {
  estado?: EstadoDocumento;
  tipoDocumentoId?: string;
  prioridad?: PrioridadDocumento;
  fechaDesde?: Date;
  fechaHasta?: Date;
  remitente?: string;
  asunto?: string;
  numeroExpediente?: string;
  areaActualId?: string;
  page?: number;
  pageSize?: number;
}
