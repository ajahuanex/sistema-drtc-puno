/** ============================================================
 *  MODELOS DE DATOS - Módulo Verificación de Casilla Electrónica
 *  DRTC Puno - Dirección Regional de Transportes y Comunicaciones
 * ============================================================ */

/** Datos del administrado devueltos por el API de casilla */
export interface InfoCasillaData {
  activo: boolean;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nroDocumento?: string;
  tipoDocumento?: string;
  fechaCreacion?: string;
  [key: string]: any;
}

/** Respuesta del endpoint GET /info */
export interface InfoCasillaResponse {
  status: string;
  info: {
    success: boolean;
    message?: string;
    data?: InfoCasillaData;
    errors?: any;
  };
}

/** Estado de verificación de la casilla en la interfaz */
export type EstadoCasilla = 'pendiente' | 'verificando' | 'activo' | 'inactivo' | 'error';

/** Registro en memoria de consultas recientes */
export interface ConsultaCasillaHistorial {
  id: string;
  timestamp: Date;
  codTipoPersona: string;
  tipoPersonaLabel: string;
  codTipoDocumento: string;
  tipoDocumentoLabel: string;
  nroDocumento: string;
  estado: EstadoCasilla;
  nombreCompleto?: string;
  email?: string;
  mensajeRespuesta?: string;
}

/** Toast o mensaje de feedback para el usuario */
export interface Toast {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  mensaje: string;
}
