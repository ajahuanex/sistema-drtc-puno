export interface Usuario {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  rolId: string;
  estaActivo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface UsuarioCreate {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  rolId?: string;
}

export interface UsuarioUpdate {
  nombres?: string;
  apellidos?: string;
  email?: string;
  password?: string;
  rolId?: string;
  estaActivo?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    email: string;
    rolId: string;
  };
} 