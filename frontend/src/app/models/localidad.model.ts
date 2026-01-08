export enum NivelTerritorial {
  CENTRO_POBLADO = 'CENTRO_POBLADO',
  DISTRITO = 'DISTRITO',
  PROVINCIA = 'PROVINCIA',
  DEPARTAMENTO = 'DEPARTAMENTO'
}

export enum TipoLocalidad {
  CIUDAD = 'CIUDAD',
  PUEBLO = 'PUEBLO',
  DISTRITO = 'DISTRITO',
  PROVINCIA = 'PROVINCIA',
  DEPARTAMENTO = 'DEPARTAMENTO',
  CENTRO_POBLADO = 'CENTRO_POBLADO'
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Localidad {
  id: string;
  ubigeo?: string;
  ubigeo_identificador_mcp?: string;
  departamento: string;
  provincia: string;
  distrito: string;
  municipalidad_centro_poblado: string;
  nivel_territorial: NivelTerritorial;
  dispositivo_legal_creacion?: string;
  coordenadas?: Coordenadas;
  nombre?: string;
  codigo?: string;
  tipo?: TipoLocalidad;
  descripcion?: string;
  observaciones?: string;
  esta_activa: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface LocalidadCreate {
  ubigeo?: string;
  ubigeo_identificador_mcp?: string;
  departamento: string;
  provincia: string;
  distrito: string;
  municipalidad_centro_poblado: string;
  nivel_territorial: NivelTerritorial;
  dispositivo_legal_creacion?: string;
  coordenadas?: Coordenadas;
  nombre?: string;
  codigo?: string;
  tipo?: TipoLocalidad;
  descripcion?: string;
  observaciones?: string;
}

export interface LocalidadUpdate {
  ubigeo?: string;
  ubigeo_identificador_mcp?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  municipalidad_centro_poblado?: string;
  nivel_territorial?: NivelTerritorial;
  dispositivo_legal_creacion?: string;
  coordenadas?: Coordenadas;
  nombre?: string;
  codigo?: string;
  tipo?: TipoLocalidad;
  descripcion?: string;
  observaciones?: string;
  esta_activa?: boolean;
}

export interface FiltroLocalidades {
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  municipalidad_centro_poblado?: string;
  nivel_territorial?: NivelTerritorial;
  nombre?: string;
  tipo?: TipoLocalidad;
  esta_activa?: boolean;
}

export interface LocalidadesPaginadas {
  localidades: Localidad[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ValidacionUbigeo {
  ubigeo: string;
  idExcluir?: string;
}

export interface RespuestaValidacionUbigeo {
  valido: boolean;
  mensaje: string;
}

// Modelos para análisis territorial
export interface LocalidadEnRuta {
  localidad_id: string;
  ubigeo: string;
  nombre: string;
  nivel_territorial: NivelTerritorial;
  departamento: string;
  provincia: string;
  distrito: string;
  municipalidad_centro_poblado: string;
  coordenadas?: Coordenadas;
  tipo_en_ruta: string; // ORIGEN, ESCALA, DESTINO
  orden?: number;
  distancia_desde_origen?: number;
  tiempo_estimado?: string;
}

export interface AnalisisNivelTerritorial {
  ruta_id: string;
  codigo_ruta: string;
  nombre_ruta: string;
  origen: LocalidadEnRuta;
  destino: LocalidadEnRuta;
  itinerario: LocalidadEnRuta[];
  niveles_involucrados: NivelTerritorial[];
  nivel_maximo: NivelTerritorial;
  nivel_minimo: NivelTerritorial;
  total_localidades: number;
  por_nivel: { [key: string]: number };
  clasificacion_territorial: string;
}

export interface FiltroRutasPorNivel {
  nivel_origen?: NivelTerritorial;
  nivel_destino?: NivelTerritorial;
  nivel_minimo_requerido?: NivelTerritorial;
  nivel_maximo_permitido?: NivelTerritorial;
  incluye_nivel?: NivelTerritorial;
  departamento_origen?: string;
  departamento_destino?: string;
  provincia_origen?: string;
  provincia_destino?: string;
}

export interface EstadisticasNivelTerritorial {
  total_rutas_analizadas: number;
  distribucion_por_nivel_origen: { [key: string]: number };
  distribucion_por_nivel_destino: { [key: string]: number };
  combinaciones_mas_comunes: Array<{ combinacion: string; cantidad: number }>;
  rutas_por_clasificacion: { [key: string]: number };
  departamentos_mas_conectados: Array<{ 
    departamento: string; 
    como_origen: number; 
    como_destino: number 
  }>;
  provincias_mas_conectadas: Array<{ 
    provincia: string; 
    como_origen: number; 
    como_destino: number 
  }>;
}

export interface LocalidadConJerarquia {
  localidad: Localidad;
  jerarquia_territorial: {
    departamento: { nombre: string; ubigeo: string };
    provincia: { nombre: string; ubigeo: string };
    distrito: { nombre: string; ubigeo: string };
  };
  localidades_padre: string[];
  localidades_hijas: string[];
  rutas_como_origen: number;
  rutas_como_destino: number;
  rutas_en_itinerario: number;
}