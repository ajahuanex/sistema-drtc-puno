/**
 * Modelos para la tabla de resoluciones
 */

export interface ResolucionConEmpresa {
  id: string;
  nroResolucion: string;
  fechaEmision: Date;
  tipoTramite: string;
  tipoResolucion?: string;
  estado?: string;
  empresaId: string;
  empresaNombre?: string;
  empresaRuc?: string;
  empresa?: {
    id?: string;
    razonSocial: {
      principal: string;
      comercial?: string;
    };
    ruc: string;
  };
  observaciones?: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  aniosVigencia?: number;
  cantidadRutas?: number;
  cantidadVehiculos?: number;
  rutasAutorizadasIds?: string[];
  tieneEficaciaAnticipada?: boolean | null;
  diasEficaciaAnticipada?: number | null;
  estaActivo?: boolean;
}

export interface ColumnaDefinicion {
  id: string;
  nombre: string;
  visible: boolean;
  ordenable: boolean;
  ancho?: string;
  key?: string;
  label?: string;
  required?: boolean;
  tipo?: string;
  width?: string;
}

export interface OrdenamientoColumna {
  columna: string;
  direccion: 'asc' | 'desc';
  prioridad: number;
}

export interface ResolucionTableConfig {
  columnas?: ColumnaDefinicion[];
  columnasVisibles?: string[];
  ordenColumnas?: string[];
  ordenamiento?: OrdenamientoColumna[];
  paginacion?: {
    tamano: number;
    tamanoPagina: number;
    paginaActual: number;
    opciones: number[];
  };
}

export interface ResolucionFiltros {
  numeroResolucion?: string;
  empresaId?: string;
  tiposTramite?: string[];
  estados?: string[];
  fechaInicio?: Date;
  fechaFin?: Date;
  busquedaGeneral?: string;
  activo?: boolean;
}

export interface FiltroActivo {
  campo?: string;
  valor?: any;
  etiqueta?: string;
  key?: string;
  label?: string;
  value?: any;
  tipo?: string;
}

export interface EstadisticasResoluciones {
  total: number;
  porEstado: { [key: string]: number };
  porTipo: { [key: string]: number };
  porEmpresa: { [key: string]: any };
}

export const COLUMNAS_DEFINICIONES: ColumnaDefinicion[] = [
  { id: 'nroResolucion', nombre: 'N° Resolución', visible: true, ordenable: true, key: 'nroResolucion', label: 'N° Resolución' },
  { id: 'fechaEmision', nombre: 'Fecha Emisión', visible: true, ordenable: true, key: 'fechaEmision', label: 'Fecha Emisión' },
  { id: 'tipoTramite', nombre: 'Tipo Trámite', visible: true, ordenable: true, key: 'tipoTramite', label: 'Tipo Trámite' },
  { id: 'estado', nombre: 'Estado', visible: true, ordenable: true, key: 'estado', label: 'Estado' },
  { id: 'empresaNombre', nombre: 'Empresa', visible: true, ordenable: true, key: 'empresaNombre', label: 'Empresa' },
  { id: 'acciones', nombre: 'Acciones', visible: true, ordenable: false, key: 'acciones', label: 'Acciones', required: true }
];

export const TIPOS_TRAMITE_OPCIONES = [
  { value: 'PRIMIGENIA', label: 'Primigenia' },
  { value: 'RENOVACION', label: 'Renovación' },
  { value: 'MODIFICACION', label: 'Modificación' },
  { value: 'AMPLIACION', label: 'Ampliación' }
];

export const ESTADOS_RESOLUCION_OPCIONES = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'SUSPENDIDA', label: 'Suspendida' },
  { value: 'ANULADA', label: 'Anulada' }
];
