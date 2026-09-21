export enum TipoParametro {
  ENTERO = 'entero',
  DECIMAL = 'decimal',
  TEXTO = 'texto',
  BOOLEANO = 'booleano',
  JSON = 'json'
}

export enum CategoriaParametro {
  SISTEMA = 'sistema',
  RESOLUCIONES = 'resoluciones',
  EXPEDIENTES = 'expedientes',
  EMPRESAS = 'empresas',
  NOTIFICACIONES = 'notificaciones',
  INTEROPERABILIDAD = 'interoperabilidad'
}

export interface ParametroSistema {
  id: string;
  clave: string;
  nombre: string;
  descripcion?: string;
  valor: any;
  tipo: TipoParametro;
  categoria: CategoriaParametro;
  editable: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface ParametroSistemaUpdate {
  nombre?: string;
  descripcion?: string;
  valor?: any;
}
