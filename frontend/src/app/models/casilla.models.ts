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

/** Empresa para la tabla de casilla electrónica */
export interface EmpresaCasillaItem {
  id: string;
  ruc: string;
  razonSocial: string;
  tieneCasillaElectronica: boolean;
  casillaElectronica: string;
  ultimaValidacionCasilla?: string | null;
  emailContacto?: string;
  telefonoContacto?: string;
  estado?: string;
}

/** Estado de ejecución de la verificación masiva */
export interface CasillaMasivaEstado {
  en_ejecucion: boolean;
  ultimo_inicio?: string | null;
  ultimo_fin?: string | null;
  total: number;
  procesadas: number;
  con_casilla: number;
  sin_casilla: number;
  errores: number;
  porcentaje: number;
  empresa_actual?: string | null;
  ruc_actual?: string | null;
  ultimo_error?: string | null;
  origen?: string | null;
}

/** Resumen de cobertura de empresas con persistencia en BD */
export interface ResumenEmpresasCasillaResponse {
  totalEmpresas: number;
  conCasilla: number;
  sinCasilla: number;
  porcentajeConCasilla: number;
  ultimaVerificacion?: string | null;
  estadoProceso: CasillaMasivaEstado;
  empresas: EmpresaCasillaItem[];
}

/** Registro histórico de verificación en base de datos */
export interface HistorialVerificacionRegistro {
  fecha: string;
  fecha_peru?: string;
  origen: string;
  totalEmpresas: number;
  conCasilla: number;
  sinCasilla: number;
  errores: number;
  porcentajeConCasilla: number;
  totalDetalles?: number;
}
