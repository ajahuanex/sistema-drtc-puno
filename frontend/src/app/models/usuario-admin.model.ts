export enum RolUsuario {
  OTI = 'oti',
  ADMIN = 'admin',
  DIRECTIVO = 'directivo',
  SUPERVISOR = 'supervisor',
  FISCALIZADOR = 'fiscalizador',
  ESPECIALISTA = 'especialista',
  USUARIO = 'usuario',
  OPERADOR = 'operador',
  GERENTE = 'gerente'
}

export interface UsuarioAdmin {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  rolId: RolUsuario | string;
  estaActivo: boolean;
  fechaCreacion: string;
  modulosPermitidos?: string[];
}

export interface UsuarioAdminCreate {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  rolId: string;
  modulosPermitidos?: string[];
}

export interface UsuarioAdminUpdate {
  nombres?: string;
  apellidos?: string;
  email?: string;
  password?: string;
  rolId?: string;
  estaActivo?: boolean;
  modulosPermitidos?: string[] | null;
}
