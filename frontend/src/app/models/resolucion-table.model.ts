/**
 * Modelos e interfaces para la tabla avanzada de resoluciones
 */

import { Resolucion } from './resolucion.model';

/**
 * Interface para filtros de resoluciones
 */
export interface ResolucionFiltros {
  numeroResolucion?: string;
  busquedaGeneral?: string; // Búsqueda inteligente por número, razón social o RUC
  empresaId?: string;
  tiposTramite?: string[];
  estados?: string[];
  fechaInicio?: Date;
  fechaFin?: Date;
  activo?: boolean;
}

/**
 * Interface para configuración de tabla de resoluciones
 */
export interface ResolucionTableConfig {
  columnasVisibles: string[];
  ordenColumnas: string[];
  ordenamiento: OrdenamientoColumna[];
  paginacion: {
    tamanoPagina: number;
    paginaActual: number;
  };
  filtros: ResolucionFiltros;
}

/**
 * Interface para ordenamiento de columnas
 */
export interface OrdenamientoColumna {
  columna: string;
  direccion: 'asc' | 'desc';
  prioridad: number;
}

/**
 * Interface para definición de columnas
 */
export interface ColumnaDefinicion {
  key: string;
  label: string;
  sortable: boolean;
  required: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  tipo: 'text' | 'date' | 'badge' | 'actions' | 'empresa';
}

/**
 * Interface para resolución con datos de empresa incluidos
 */
export interface ResolucionConEmpresa extends Resolucion {
  empresa?: {
    id: string;
    razonSocial: {
      principal: string;
      comercial?: string;
    };
    ruc: string;
  };
  // Información adicional de relaciones
  cantidadRutas?: number;
  cantidadVehiculos?: number;
  rutasRelacionadas?: RutaResumen[];
  vehiculosRelacionados?: VehiculoResumen[];
}

/**
 * Interface para resumen de ruta en resoluciones
 */
export interface RutaResumen {
  id: string;
  codigo: string;
  origen: string;
  destino: string;
  distancia: number;
  estado: string;
  tipoServicio?: string;
}

/**
 * Interface para resumen de vehículo en resoluciones
 */
export interface VehiculoResumen {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  anioFabricacion?: number;
  estado: string;
  rutasEspecificas?: number;
}

/**
 * Interface para filtro activo (para mostrar chips)
 */
export interface FiltroActivo {
  key: string;
  label: string;
  value: any;
  tipo: 'text' | 'select' | 'date' | 'empresa';
}

/**
 * Interface para estadísticas de filtros
 */
export interface EstadisticasResoluciones {
  total: number;
  porTipo: { [tipo: string]: number };
  porEstado: { [estado: string]: number };
  porEmpresa: { [empresaId: string]: { nombre: string; cantidad: number } };
}

/**
 * Configuración por defecto de la tabla
 */
export const RESOLUCION_TABLE_CONFIG_DEFAULT: ResolucionTableConfig = {
  columnasVisibles: [
    'nroResolucion',
    'empresa',
    'tipoTramite',
    'fechaEmision',
    'fechaVigenciaInicio',
    'fechaVigenciaFin',
    'aniosVigencia',
    'eficaciaAnticipada',
    'estado',
    'rutasAutorizadas',
    'vehiculosHabilitados',
    'acciones'
  ],
  ordenColumnas: [
    'nroResolucion',
    'empresa',
    'tipoTramite',
    'fechaEmision',
    'fechaVigenciaInicio',
    'fechaVigenciaFin',
    'aniosVigencia',
    'eficaciaAnticipada',
    'estado',
    'rutasAutorizadas',
    'vehiculosHabilitados',
    'acciones'
  ],
  ordenamiento: [
    {
      columna: 'fechaEmision',
      direccion: 'desc',
      prioridad: 1
    }
  ],
  paginacion: {
    tamanoPagina: 25,
    paginaActual: 0
  },
  filtros: {}
};

/**
 * Definiciones de todas las columnas disponibles
 */
export const COLUMNAS_DEFINICIONES: ColumnaDefinicion[] = [
  {
    key: 'nroResolucion',
    label: 'N° Resolución',
    sortable: true,
    required: true,
    width: '115px',
    align: 'left',
    tipo: 'text'
  },
  {
    key: 'empresa',
    label: 'Empresa',
    sortable: true,
    required: false,
    width: '250px',
    align: 'left',
    tipo: 'empresa'
  },
  {
    key: 'tipoTramite',
    label: 'Tipo de Trámite',
    sortable: true,
    required: false,
    width: '150px',
    align: 'center',
    tipo: 'badge'
  },
  {
    key: 'fechaEmision',
    label: 'Fecha de Emisión',
    sortable: true,
    required: false,
    width: '140px',
    align: 'center',
    tipo: 'date'
  },
  {
    key: 'fechaVigenciaInicio',
    label: 'Vigencia Inicio',
    sortable: true,
    required: false,
    width: '140px',
    align: 'center',
    tipo: 'date'
  },
  {
    key: 'fechaVigenciaFin',
    label: 'Vigencia Fin',
    sortable: true,
    required: false,
    width: '140px',
    align: 'center',
    tipo: 'date'
  },
  {
    key: 'aniosVigencia',
    label: 'Años Vigencia',
    sortable: true,
    required: false,
    width: '100px',
    align: 'center',
    tipo: 'text'
  },
  {
    key: 'eficaciaAnticipada',
    label: 'Eficacia Anticipada',
    sortable: true,
    required: false,
    width: '140px',
    align: 'center',
    tipo: 'badge'
  },
  {
    key: 'estado',
    label: 'Estado',
    sortable: true,
    required: false,
    width: '120px',
    align: 'center',
    tipo: 'badge'
  },
  {
    key: 'rutasAutorizadas',
    label: 'Rutas Autorizadas',
    sortable: false,
    required: false,
    width: '180px',
    align: 'center',
    tipo: 'badge'
  },
  {
    key: 'vehiculosHabilitados',
    label: 'Vehículos Habilitados',
    sortable: false,
    required: false,
    width: '180px',
    align: 'center',
    tipo: 'badge'
  },
  {
    key: 'acciones',
    label: 'Acciones',
    sortable: false,
    required: true,
    width: '120px',
    align: 'center',
    tipo: 'actions'
  }
];

/**
 * Tipos de trámite disponibles para filtros
 */
export const TIPOS_TRAMITE_OPCIONES = [
  'PRIMIGENIA',
  'RENOVACION',
  'INCREMENTO',
  'SUSTITUCION',
  'OTROS'
];

/**
 * Estados disponibles para filtros
 */
export const ESTADOS_RESOLUCION_OPCIONES = [
  'BORRADOR',
  'EN_REVISION',
  'APROBADO',
  'VIGENTE',
  'VENCIDO',
  'ANULADO'
];