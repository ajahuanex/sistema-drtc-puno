/**
 * Models for Archivo (Document Archiving)
 * Requirements: 9.1, 9.2, 9.3, 9.6
 */

export enum ClasificacionArchivoEnum {
  TRAMITE_DOCUMENTARIO = 'TRAMITE_DOCUMENTARIO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  LEGAL = 'LEGAL',
  CONTABLE = 'CONTABLE',
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS',
  TECNICO = 'TECNICO',
  OTROS = 'OTROS'
}

export enum PoliticaRetencionEnum {
  PERMANENTE = 'PERMANENTE',
  DIEZ_ANOS = 'DIEZ_ANOS',
  CINCO_ANOS = 'CINCO_ANOS',
  TRES_ANOS = 'TRES_ANOS',
  UN_ANO = 'UN_ANO'
}

export interface Archivo {
  id: string;
  documento_id: string;
  clasificacion: ClasificacionArchivoEnum;
  politica_retencion: PoliticaRetencionEnum;
  codigo_ubicacion: string;
  ubicacion_fisica?: string;
  fecha_archivado: Date;
  fecha_expiracion_retencion?: Date;
  usuario_archivo_id: string;
  observaciones?: string;
  motivo_archivo?: string;
  activo: string;
  fecha_restauracion?: Date;
  usuario_restauracion_id?: string;
  motivo_restauracion?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ArchivoCreate {
  documento_id: string;
  clasificacion: ClasificacionArchivoEnum;
  politica_retencion: PoliticaRetencionEnum;
  ubicacion_fisica?: string;
  observaciones?: string;
  motivo_archivo?: string;
}

export interface ArchivoUpdate {
  clasificacion?: ClasificacionArchivoEnum;
  politica_retencion?: PoliticaRetencionEnum;
  ubicacion_fisica?: string;
  observaciones?: string;
}

export interface ArchivoRestaurar {
  motivo_restauracion: string;
}

export interface FiltrosArchivo {
  clasificacion?: ClasificacionArchivoEnum;
  politica_retencion?: PoliticaRetencionEnum;
  codigo_ubicacion?: string;
  fecha_archivado_desde?: Date;
  fecha_archivado_hasta?: Date;
  usuario_archivo_id?: string;
  activo?: string;
  proximos_a_expirar?: boolean;
  numero_expediente?: string;
  remitente?: string;
  asunto?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ArchivoListResponse {
  items: Archivo[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ArchivoEstadisticas {
  total_archivados: number;
  por_clasificacion: { [key: string]: number };
  por_politica_retencion: { [key: string]: number };
  proximos_a_expirar: number;
  espacio_utilizado_mb?: number;
}

// Helper functions for display
export function getClasificacionLabel(clasificacion: ClasificacionArchivoEnum): string {
  const labels: { [key in ClasificacionArchivoEnum]: string } = {
    [ClasificacionArchivoEnum.TRAMITE_DOCUMENTARIO]: 'Trámite Documentario',
    [ClasificacionArchivoEnum.ADMINISTRATIVO]: 'Administrativo',
    [ClasificacionArchivoEnum.LEGAL]: 'Legal',
    [ClasificacionArchivoEnum.CONTABLE]: 'Contable',
    [ClasificacionArchivoEnum.RECURSOS_HUMANOS]: 'Recursos Humanos',
    [ClasificacionArchivoEnum.TECNICO]: 'Técnico',
    [ClasificacionArchivoEnum.OTROS]: 'Otros'
  };
  return labels[clasificacion];
}

export function getPoliticaRetencionLabel(politica: PoliticaRetencionEnum): string {
  const labels: { [key in PoliticaRetencionEnum]: string } = {
    [PoliticaRetencionEnum.PERMANENTE]: 'Permanente',
    [PoliticaRetencionEnum.DIEZ_ANOS]: '10 Años',
    [PoliticaRetencionEnum.CINCO_ANOS]: '5 Años',
    [PoliticaRetencionEnum.TRES_ANOS]: '3 Años',
    [PoliticaRetencionEnum.UN_ANO]: '1 Año'
  };
  return labels[politica];
}

export function getPoliticaRetencionColor(politica: PoliticaRetencionEnum): string {
  const colors: { [key in PoliticaRetencionEnum]: string } = {
    [PoliticaRetencionEnum.PERMANENTE]: 'purple',
    [PoliticaRetencionEnum.DIEZ_ANOS]: 'blue',
    [PoliticaRetencionEnum.CINCO_ANOS]: 'green',
    [PoliticaRetencionEnum.TRES_ANOS]: 'orange',
    [PoliticaRetencionEnum.UN_ANO]: 'red'
  };
  return colors[politica];
}
