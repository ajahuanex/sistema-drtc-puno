export interface Ruta {
  id: string;
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  origen?: string;           // Nombre de la localidad de origen (opcional)
  destino?: string;          // Nombre de la localidad de destino (opcional)
  distancia?: number;        // Distancia en kilómetros
  tiempoEstimado?: string | number;   // Tiempo estimado (HH:MM o horas)
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
  tipoServicio?: TipoServicio; // Tipo de servicio
  capacidadMaxima?: number; // Capacidad máxima de pasajeros
  tarifaBase?: number;      // Tarifa base del pasaje
  horarios?: any[];
  restricciones?: string[];
  empresasAutorizadasIds?: string[];
  vehiculosAsignadosIds?: string[];
  documentosIds?: string[];
  historialIds?: string[];
}

export interface RutaCreate {
  codigoRuta: string;
  nombre: string;
  origenId: string;
  destinoId: string;
  origen?: string; // Nombre del origen (opcional)
  destino?: string; // Nombre del destino (opcional)
  itinerarioIds: string[];
  frecuencias: string;
  tipoRuta: TipoRuta;
  tipoServicio: TipoServicio; // Campo requerido por el backend
  distancia?: number;
  tiempoEstimado?: string; // Formato HH:MM
  tarifaBase?: number;
  capacidadMaxima?: number;
  horarios?: any[];
  restricciones?: string[];
  descripcion?: string; // Descripción/itinerario de la ruta
  observaciones?: string;
  empresaId: string; // Obligatorio
  resolucionId: string; // Obligatorio
}

export interface RutaUpdate {
  codigoRuta?: string;
  nombre?: string;
  origenId?: string;
  destinoId?: string;
  origen?: string;
  destino?: string;
  distancia?: number;
  tiempoEstimado?: string | number;
  itinerarioIds?: string[];
  frecuencias?: string;
  estado?: EstadoRuta;
  estaActivo?: boolean;
  observaciones?: string;
  descripcion?: string;
  tipoRuta?: TipoRuta;
  tipoServicio?: TipoServicio;
  capacidadMaxima?: number;
  tarifaBase?: number;
  empresaId?: string;
  horarios?: any[];
  restricciones?: string[];
  fechaActualizacion?: Date;
}

// Enums para el estado y tipo de ruta
export type EstadoRuta = 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA' | 'EN_MANTENIMIENTO' | 'ARCHIVADA' | 'DADA_DE_BAJA';

export type TipoRuta = 'URBANA' | 'INTERURBANA' | 'INTERPROVINCIAL' | 'INTERREGIONAL' | 'RURAL';

export type TipoServicio = 'PASAJEROS' | 'CARGA' | 'MIXTO';

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