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
  
  // CAMPOS DEL SISTEMA
  estaActiva: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  
  // Campo calculado automáticamente
  nivel_territorial: NivelTerritorial;
  
  // Campos de compatibilidad (opcionales)
  ubigeo_identificador_mcp?: string;
  municipalidad_centro_poblado?: string;
  dispositivo_legal_creacion?: string;
  esta_activa?: boolean; // Alias para estaActiva
  fecha_creacion?: string; // Alias para fechaCreacion
  fecha_actualizacion?: string; // Alias para fechaActualizacion
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
  
  // Campos de compatibilidad (opcionales)
  ubigeo_identificador_mcp?: string;
  municipalidad_centro_poblado?: string;
  dispositivo_legal_creacion?: string;
  nivel_territorial?: NivelTerritorial;
  esta_activa?: boolean; // Alias para estaActiva
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