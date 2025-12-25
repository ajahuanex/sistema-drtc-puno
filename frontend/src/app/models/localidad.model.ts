export interface Localidad {
  id: string;
  nombre: string;
  codigo: string;
  tipo: TipoLocalidad;
  departamento: string;
  provincia: string;
  distrito?: string;
  coordenadas?: Coordenadas;
  estaActiva: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
  descripcion?: string;
  observaciones?: string;
}

export interface LocalidadCreate {
  nombre: string;
  codigo: string;
  tipo: TipoLocalidad;
  departamento: string;
  provincia: string;
  distrito?: string;
  coordenadas?: Coordenadas;
  descripcion?: string;
  observaciones?: string;
}

export interface LocalidadUpdate {
  nombre?: string;
  codigo?: string;
  tipo?: TipoLocalidad;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  coordenadas?: Coordenadas;
  estaActiva?: boolean;
  descripcion?: string;
  observaciones?: string;
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export type TipoLocalidad = 'CIUDAD' | 'PUEBLO' | 'DISTRITO' | 'PROVINCIA' | 'DEPARTAMENTO' | 'CENTRO_POBLADO';

// Localidades predefinidas para Puno
export const LOCALIDADES_PUNO: LocalidadCreate[] = [
  // Departamento de Puno - Ciudades principales
  {
    nombre: 'Puno',
    codigo: 'PUN001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Puno',
    distrito: 'Puno',
    descripcion: 'Capital del departamento de Puno'
  },
  {
    nombre: 'Juliaca',
    codigo: 'JUL001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'San Román',
    distrito: 'Juliaca',
    descripcion: 'Ciudad comercial importante de Puno'
  },
  {
    nombre: 'Ilave',
    codigo: 'ILA001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'El Collao',
    distrito: 'Ilave',
    descripcion: 'Capital de la provincia El Collao'
  },
  {
    nombre: 'Yunguyo',
    codigo: 'YUN001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Yunguyo',
    distrito: 'Yunguyo',
    descripcion: 'Ciudad fronteriza con Bolivia'
  },
  {
    nombre: 'Desaguadero',
    codigo: 'DES001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Chucuito',
    distrito: 'Desaguadero',
    descripcion: 'Principal punto fronterizo con Bolivia'
  },
  {
    nombre: 'Azángaro',
    codigo: 'AZA001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Azángaro',
    distrito: 'Azángaro',
    descripcion: 'Capital de la provincia de Azángaro'
  },
  {
    nombre: 'Ayaviri',
    codigo: 'AYA001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Melgar',
    distrito: 'Ayaviri',
    descripcion: 'Capital de la provincia de Melgar'
  },
  {
    nombre: 'Macusani',
    codigo: 'MAC001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Carabaya',
    distrito: 'Macusani',
    descripcion: 'Capital de la provincia de Carabaya'
  },
  {
    nombre: 'Juli',
    codigo: 'JUL002',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Chucuito',
    distrito: 'Juli',
    descripcion: 'Ciudad histórica a orillas del Lago Titicaca'
  },
  {
    nombre: 'Lampa',
    codigo: 'LAM001',
    tipo: 'CIUDAD',
    departamento: 'Puno',
    provincia: 'Lampa',
    distrito: 'Lampa',
    descripcion: 'Capital de la provincia de Lampa'
  },

  // Destinos fuera del departamento - Principales
  {
    nombre: 'Lima',
    codigo: 'LIM001',
    tipo: 'CIUDAD',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Lima',
    descripcion: 'Capital del Perú'
  },
  {
    nombre: 'Arequipa',
    codigo: 'ARE001',
    tipo: 'CIUDAD',
    departamento: 'Arequipa',
    provincia: 'Arequipa',
    distrito: 'Arequipa',
    descripcion: 'Ciudad Blanca del sur del Perú'
  },
  {
    nombre: 'Cusco',
    codigo: 'CUS001',
    tipo: 'CIUDAD',
    departamento: 'Cusco',
    provincia: 'Cusco',
    distrito: 'Cusco',
    descripcion: 'Capital histórica del Perú'
  },
  {
    nombre: 'Tacna',
    codigo: 'TAC001',
    tipo: 'CIUDAD',
    departamento: 'Tacna',
    provincia: 'Tacna',
    distrito: 'Tacna',
    descripcion: 'Ciudad fronteriza con Chile'
  },
  {
    nombre: 'Moquegua',
    codigo: 'MOQ001',
    tipo: 'CIUDAD',
    departamento: 'Moquegua',
    provincia: 'Mariscal Nieto',
    distrito: 'Moquegua',
    descripcion: 'Capital del departamento de Moquegua'
  },

  // Destinos internacionales
  {
    nombre: 'La Paz',
    codigo: 'LAP001',
    tipo: 'CIUDAD',
    departamento: 'Bolivia',
    provincia: 'La Paz',
    descripcion: 'Capital de Bolivia'
  },
  {
    nombre: 'Copacabana',
    codigo: 'COP001',
    tipo: 'CIUDAD',
    departamento: 'Bolivia',
    provincia: 'La Paz',
    descripcion: 'Ciudad turística boliviana en el Lago Titicaca'
  }
];

// Filtros para localidades
export interface FiltroLocalidades {
  nombre?: string;
  tipo?: TipoLocalidad;
  departamento?: string;
  provincia?: string;
  estaActiva?: boolean;
}

// Respuesta paginada
export interface LocalidadesPaginadas {
  localidades: Localidad[];
  total: number;
  pagina: number;
  totalPaginas: number;
}