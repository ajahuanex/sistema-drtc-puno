export enum NivelTerritorial {
  PUEBLO = 'PUEBLO',
  CENTRO_POBLADO = 'CENTRO_POBLADO',
  DISTRITO = 'DISTRITO',
  PROVINCIA = 'PROVINCIA',
  DEPARTAMENTO = 'DEPARTAMENTO'
}

export enum TipoLocalidad {
  PUEBLO = "PUEBLO",                 // Tipo por defecto - genérico
  CENTRO_POBLADO = "CENTRO_POBLADO", // Solo cuando necesite jerarquía específica
  LOCALIDAD = "LOCALIDAD",
  DISTRITO = "DISTRITO",
  PROVINCIA = "PROVINCIA",
  DEPARTAMENTO = "DEPARTAMENTO",
  CIUDAD = "CIUDAD"
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
  
  // Metadata de coordenadas (guardada en metadata.coordenadas)
  latitudOriginal?: number;
  longitudOriginal?: number;
  esPersonalizada?: boolean;
  fechaModificacion?: string;
  modificadoPor?: string;
  fuenteOriginal?: string; // 'INEI', 'MANUAL', 'GPS', etc.
}

// Metadata adicional de localidades
export interface LocalidadMetadata {
  nombreOficial?: string; // Nombre oficial completo
  notas?: string; // Notas adicionales
  fuenteDatos?: string; // Fuente de los datos (INEI, MANUAL, etc.)
  
  // Campos para manejo de alias (usados cuando la localidad se embebe en rutas)
  es_alias?: boolean; // Indica si esta instancia representa un alias
  nombre_original?: string; // Nombre original de la localidad cuando es_alias=true
  alias_id?: string; // ID del alias en la colección localidades_alias
  
  [key: string]: any; // Permitir campos adicionales
}

export interface Localidad {
  id: string;
  // ÚNICO CAMPO OBLIGATORIO
  nombre: string;

  // TIPO QUE DEFINE EL NIVEL TERRITORIAL
  tipo: TipoLocalidad;

  // TODOS LOS DEMÁS CAMPOS SON OPCIONALES
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  codigo?: string;
  descripcion?: string;
  coordenadas?: Coordenadas;
  observaciones?: string;
  metadata?: LocalidadMetadata; // Metadata adicional (alias, etc.)

  // NUEVOS CAMPOS PARA CENTROS POBLADOS
  codigo_ccpp?: string;
  tipo_area?: string; // Rural o Urbano
  poblacion?: number;
  altitud?: number;

  // CAMPOS DEL SISTEMA
  estaActiva: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;

  // Campo calculado automáticamente (opcional, para compatibilidad futura)
  nivelTerritorial?: NivelTerritorial;
}

export interface LocalidadCreate {
  // ÚNICO CAMPO OBLIGATORIO
  nombre: string;

  // TIPO POR DEFECTO: LOCALIDAD
  tipo?: TipoLocalidad;

  // TODOS LOS DEMÁS CAMPOS SON OPCIONALES
  // Solo se muestran cuando tipo = CENTRO_POBLADO
  ubigeo?: string;
  departamento?: string; // Por defecto: PUNO
  provincia?: string;
  distrito?: string;
  codigo?: string;
  descripcion?: string;
  coordenadas?: Coordenadas;
  observaciones?: string;
  metadata?: LocalidadMetadata; // Metadata adicional (alias, etc.)

  // Nuevos campos para centros poblados
  codigo_ccpp?: string;
  tipo_area?: string;
  poblacion?: number;
  altitud?: number;

  // Campos de compatibilidad (opcionales)
  ubigeo_identificador_mcp?: string;
  municipalidad_centro_poblado?: string;
  dispositivo_legal_creacion?: string;
  nivel_territorial?: NivelTerritorial;
}

export interface LocalidadUpdate {
  nombre?: string;
  tipo?: TipoLocalidad;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  codigo?: string;
  descripcion?: string;
  coordenadas?: Coordenadas;
  observaciones?: string;
  estaActiva?: boolean;
  metadata?: LocalidadMetadata; // Metadata adicional (alias, etc.)

  // Nuevos campos
  codigo_ccpp?: string;
  tipo_area?: string;
  poblacion?: number;
  altitud?: number;

  // Campos de compatibilidad (opcionales)
  ubigeo_identificador_mcp?: string;
  municipalidad_centro_poblado?: string;
  dispositivo_legal_creacion?: string;
  nivelTerritorial?: NivelTerritorial;
}

export interface FiltroLocalidades {
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  municipalidad_centro_poblado?: string;
  nivelTerritorial?: NivelTerritorial;
  nombre?: string;
  tipo?: TipoLocalidad;
  estaActiva?: boolean;
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