// ✅ NUEVAS INTERFACES OPTIMIZADAS (sin campos legacy)

export interface LocalidadEmbebida {
  id: string;
  nombre: string;
}

export interface LocalidadItinerario extends LocalidadEmbebida {
  orden: number;
}

export interface EmpresaEmbebida {
  id: string;
  ruc: string;
  razonSocial: string | { principal: string };
}

export interface ResolucionEmbebida {
  id: string;
  nroResolucion: string;
  tipoResolucion: string; // PADRE o HIJO
  estado: string;
}

export interface FrecuenciaServicio {
  tipo: string;
  cantidad: number;
  dias: string[];
  descripcion: string;
}

export interface HorarioServicio {
  hora: string;
  tipo?: string;
}

// ✅ MODELO PRINCIPAL OPTIMIZADO
export interface Ruta {
  id: string;
  codigoRuta: string;
  nombre: string;
  
  // ESTRUCTURA OPTIMIZADA - Objetos embebidos
  origen: LocalidadEmbebida;
  destino: LocalidadEmbebida;
  itinerario: LocalidadItinerario[];
  empresa: EmpresaEmbebida;
  resolucion: ResolucionEmbebida;
  
  // Datos operativos
  frecuencia?: FrecuenciaServicio;
  horarios?: HorarioServicio[];
  tipoRuta?: TipoRuta; // Opcional
  tipoServicio: TipoServicio;
  estado: EstadoRuta;
  
  // Datos técnicos opcionales
  distancia?: number;
  tiempoEstimado?: string;
  tarifaBase?: number;
  capacidadMaxima?: number;
  
  // Datos adicionales
  restricciones?: string[];
  observaciones?: string;
  descripcion?: string;
  
  // Control de estado
  estaActivo: boolean;
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
}

export interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  
  // ESTRUCTURA OPTIMIZADA
  origen: LocalidadEmbebida;
  destino: LocalidadEmbebida;
  itinerario: LocalidadItinerario[];
  empresa: EmpresaEmbebida;
  resolucion: ResolucionEmbebida;
  
  // Datos operativos
  frecuencia: {
    tipo: string;
    cantidad: number;
    dias: string[];
    descripcion: string;
  };
  tipoRuta?: TipoRuta; // Opcional
  tipoServicio: TipoServicio;
  
  // Datos técnicos opcionales
  distancia?: number;
  tiempoEstimado?: string;
  tarifaBase?: number;
  capacidadMaxima?: number;
  
  // Datos adicionales
  horarios?: any[];
  restricciones?: string[];
  observaciones?: string;
  descripcion?: string;
}

export interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  
  // ESTRUCTURA OPTIMIZADA (opcional para actualización)
  origen?: LocalidadEmbebida;
  destino?: LocalidadEmbebida;
  itinerario?: LocalidadItinerario[];
  empresa?: EmpresaEmbebida;
  resolucion?: ResolucionEmbebida;
  
  // Datos operativos
  frecuencia?: FrecuenciaServicio;
  tipoRuta?: TipoRuta;
  tipoServicio?: TipoServicio;
  estado?: EstadoRuta;
  
  // Datos técnicos opcionales
  distancia?: number;
  tiempoEstimado?: string;
  tarifaBase?: number;
  capacidadMaxima?: number;
  
  // Datos adicionales
  horarios?: any[];
  restricciones?: string[];
  observaciones?: string;
  descripcion?: string;
  estaActivo?: boolean;
  fechaActualizacion?: Date;
}

// Enums para el estado y tipo de ruta
export type EstadoRuta = 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA' | 'EN_MANTENIMIENTO' | 'ARCHIVADA' | 'DADA_DE_BAJA' | 'CANCELADA';

export type TipoRuta = 'URBANA' | 'INTERURBANA' | 'INTERPROVINCIAL' | 'INTERREGIONAL' | 'RURAL';

export type TipoServicio = 'PASAJEROS' | 'CARGA' | 'MIXTO';

// Interfaz para localidades (origen y destino) - DEPRECATED: usar models/localidad.model.ts
export interface LocalidadRuta {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'CIUDAD' | 'PUEBLO' | 'DISTRITO' | 'PROVINCIA' | 'DEPARTAMENTO';
  departamento: string;
  provincia: string;
  distrito?: string;
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
  estaActiva: boolean;
}

// Interfaz para validación de rutas
export interface ValidacionRuta {
  codigoRuta: string;
  origenId: string;
  destinoId: string;
  empresaId?: string;
  rutaIdExcluir?: string; // Para excluir la ruta actual en edición
}

// Respuesta de validación
export interface RespuestaValidacionRuta {
  valido: boolean;
  mensaje: string;
  rutaExistente?: {
    id: string;
    codigoRuta: string;
    origen: string;
    destino: string;
    empresaId?: string;
    estado: EstadoRuta;
  };
  conflictos?: string[];
} 