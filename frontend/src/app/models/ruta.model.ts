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
}

export interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  itinerarioIds: string[];
  frecuencias: string;
}

export interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  origenId?: string;
  destinoId?: string;
  itinerarioIds?: string[];
  frecuencias?: string;
  estado?: string;
} 