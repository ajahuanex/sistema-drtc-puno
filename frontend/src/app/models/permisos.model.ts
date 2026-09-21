export interface ModuloSistema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
  orden: number;
}

export interface RolPermisosConfig {
  rolId: string;
  nombre: string;
  descripcion: string;
  esSistema: boolean;
  modulos: string[];
}

export interface RolPermisosUpdate {
  modulos: string[];
}

export interface UsuarioPermisosResponse {
  usuarioId: string;
  dni: string;
  nombres: string;
  apellidos: string;
  rolId: string;
  heredaRol: boolean;
  modulosPersonalizados?: string[] | null;
  modulosCalculados: string[];
}

export interface UsuarioPermisosUpdate {
  modulosPermitidos?: string[] | null;
  heredarRol: boolean;
}

export interface TestInteroperabilidadRequest {
  url: string;
  apiKey?: string;
  timeoutSegundos?: number;
}

export interface TestInteroperabilidadResponse {
  success: boolean;
  url: string;
  statusCode?: number;
  tiempoMs?: number;
  mensaje: string;
  detalles?: Record<string, any>;
}

export interface EndpointInteroperabilidadInfo {
  servicio: 'SUNAT' | 'SUNARP' | 'RENIEC' | 'SUTRAN';
  nombre: string;
  metodo: 'GET' | 'POST';
  pathRelativo: string;
  descripcion: string;
  parametros: string;
}
