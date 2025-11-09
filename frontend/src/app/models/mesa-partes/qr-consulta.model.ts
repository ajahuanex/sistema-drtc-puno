/**
 * Modelos para consulta pública de documentos por QR
 */

export interface DerivacionPublica {
  area_origen: string;
  area_destino: string;
  fecha_derivacion: Date;
  estado: string;
}

export interface DocumentoPublico {
  numero_expediente: string;
  tipo_documento: string;
  asunto: string;
  estado: string;
  prioridad: string;
  fecha_recepcion: Date;
  area_actual?: string;
  historial: DerivacionPublica[];
}

export interface QRConsultaResponse {
  success: boolean;
  documento?: DocumentoPublico;
  mensaje?: string;
}
