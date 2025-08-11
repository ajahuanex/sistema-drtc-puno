export interface Ruta {
  id: string;
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  itinerarioIds: string[];
  frecuencias: string;
  estado: string;
  estaActivo: boolean;
  origen?: string;
  destino?: string;
  fechaRegistro?: Date;
}

export interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  itinerarioIds: string[];
  frecuencias: string;
  empresaId?: string;
  estado?: string;
  estaActivo?: boolean;
  fechaRegistro?: Date;
  origen?: string;
  destino?: string;
}

export interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  origenId?: string;
  destinoId?: string;
  itinerarioIds?: string[];
  frecuencias?: string;
  estado?: string;
  origen?: string;
  destino?: string;
  estaActivo?: boolean;
  fechaRegistro?: Date;
  empresaId?: string;
} 