// Enums
export enum TipoIntegracion {
  API_REST = 'API_REST',
  WEBHOOK = 'WEBHOOK',
  SOAP = 'SOAP',
  FTP = 'FTP',
  EMAIL = 'EMAIL'
}

export enum TipoAutenticacion {
  API_KEY = 'API_KEY',
  BEARER = 'BEARER',
  BEARER_TOKEN = 'BEARER_TOKEN',
  BASIC = 'BASIC',
  BASIC_AUTH = 'BASIC_AUTH',
  OAUTH2 = 'OAUTH2',
  NINGUNA = 'NINGUNA'
}

export enum EstadoConexion {
  CONECTADO = 'CONECTADO',
  DESCONECTADO = 'DESCONECTADO',
  ERROR = 'ERROR'
}

export enum EstadoSincronizacion {
  EXITOSO = 'EXITOSO',
  FALLIDO = 'FALLIDO',
  PENDIENTE = 'PENDIENTE'
}

// Interfaces
export interface MapeoCampo {
  campoLocal: string;
  campoRemoto: string;
  transformacion?: string;
  requerido?: boolean;
}

export interface ConfiguracionWebhook {
  url: string;
  metodo: string;
  eventos: string[];
  secreto: string;
  activo: boolean;
  timeout?: number;
  headers?: Record<string, string>;
  reintentos?: number;
  intervaloReintento?: number;
  verificarSSL?: boolean;
}

export interface CredencialesAutenticacion {
  tipo: TipoAutenticacion;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface Integracion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoIntegracion;
  urlBase: string;
  autenticacion: CredencialesAutenticacion;
  mapeosCampos: MapeoCampo[];
  activa: boolean;
  ultimaSincronizacion?: Date;
  estadoConexion: EstadoConexion;
  configuracionWebhook?: ConfiguracionWebhook;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegracionCreate {
  nombre: string;
  descripcion: string;
  tipo: TipoIntegracion;
  urlBase: string;
  autenticacion: CredencialesAutenticacion;
  mapeosCampos?: MapeoCampo[];
  configuracionWebhook?: ConfiguracionWebhook;
}

export interface IntegracionUpdate {
  nombre?: string;
  descripcion?: string;
  urlBase?: string;
  autenticacion?: CredencialesAutenticacion;
  mapeosCampos?: MapeoCampo[];
  activa?: boolean;
  configuracionWebhook?: ConfiguracionWebhook;
}

export interface LogSincronizacion {
  id: string;
  integracionId: string;
  documentoId?: string;
  tipo: 'ENVIO' | 'RECEPCION';
  estado: EstadoSincronizacion;
  mensaje?: string;
  detalleError?: string;
  datosEnviados?: any;
  datosRecibidos?: any;
  fecha: Date;
}

export interface ResultadoConexion {
  exitoso: boolean;
  mensaje: string;
  tiempoRespuesta?: number;
  detalleError?: string;
}

export interface DocumentoExterno {
  id?: string;
  numeroExpediente?: string;
  tipo: string;
  remitente: string;
  asunto: string;
  contenido?: string;
  archivos?: {
    nombre: string;
    url: string;
    tipo: string;
  }[];
  metadatos?: Record<string, any>;
}
