/**
 * Modelos para gestión de alias de localidades
 */

export interface LocalidadAliasBase {
  alias: string;
  localidad_id: string;
  localidad_nombre: string;
  verificado: boolean;
  notas?: string;
}

export interface LocalidadAliasCreate extends LocalidadAliasBase {}

export interface LocalidadAliasUpdate {
  alias?: string;
  localidad_id?: string;
  localidad_nombre?: string;
  verificado?: boolean;
  notas?: string;
}

export interface LocalidadAlias extends LocalidadAliasBase {
  id: string;
  estaActivo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  usos_como_origen: number;
  usos_como_destino: number;
  usos_en_itinerario: number;
}

export interface LocalidadAliasResponse extends LocalidadAlias {
  total_usos: number;
}

export interface BusquedaLocalidadResult {
  localidad_id: string;
  localidad_nombre: string;
  es_alias: boolean;
  alias_usado?: string;
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
}

export interface AliasEstadisticas {
  id: string;
  alias: string;
  localidad_nombre: string;
  total_usos: number;
  usos_como_origen: number;
  usos_como_destino: number;
  usos_en_itinerario: number;
}
