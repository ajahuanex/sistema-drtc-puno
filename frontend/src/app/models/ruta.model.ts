export interface Ruta {
  id: string;
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  origen: string;           // Nombre de la localidad de origen
  destino: string;          // Nombre de la localidad de destino
  distancia: number;        // Distancia en kilómetros
  tiempoEstimado: number;   // Tiempo estimado en horas
  itinerarioIds: string[];
  frecuencias: string;
  estado: EstadoRuta;
  estaActivo: boolean;
  empresaId?: string;       // Empresa propietaria de la ruta
  resolucionId?: string;    // Resolución primigenia asociada
  fechaRegistro?: Date;
  fechaActualizacion?: Date;
  observaciones?: string;
  descripcion?: string;     // Descripción de la ruta
  tipoRuta: TipoRuta;      // Tipo de ruta (INTERURBANA, URBANA, etc.)
  capacidadMaxima?: number; // Capacidad máxima de pasajeros
  tarifaBase?: number;      // Tarifa base del pasaje
}

export interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  origen: string;
  destino: string;
  distancia: number;
  tiempoEstimado: number;
  itinerarioIds?: string[];
  frecuencias?: string;
  empresaId?: string;
  resolucionId?: string;    // Resolución primigenia asociada
  estado?: EstadoRuta;
  estaActivo?: boolean;
  observaciones?: string;
  descripcion?: string;
  tipoRuta: TipoRuta;
  capacidadMaxima?: number;
  tarifaBase?: number;
}

export interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  origenId?: string;
  destinoId?: string;
  origen?: string;
  destino?: string;
  distancia?: number;
  tiempoEstimado?: number;
  itinerarioIds?: string[];
  frecuencias?: string;
  estado?: EstadoRuta;
  estaActivo?: boolean;
  observaciones?: string;
  descripcion?: string;
  tipoRuta?: TipoRuta;
  capacidadMaxima?: number;
  tarifaBase?: number;
  empresaId?: string;
}

// Enums para el estado y tipo de ruta
export type EstadoRuta = 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA' | 'EN_MANTENIMIENTO' | 'ARCHIVADA';

export type TipoRuta = 'INTERURBANA' | 'URBANA' | 'INTERPROVINCIAL' | 'NACIONAL' | 'INTERNACIONAL';

// Interfaz para localidades (origen y destino)
export interface Localidad {
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