export type TipoActoModificatorio = 
  | 'RENOVACION' 
  | 'INCREMENTO_FLOTA' 
  | 'SUSTITUCION_VEHICULAR' 
  | 'BAJA_VEHICULAR' 
  | 'MODIFICACION_RUTA' 
  | 'CAMBIO_REPRESENTANTE' 
  | 'SUSPENSION_TEMPORAL' 
  | 'CANCELACION_PARCIAL' 
  | 'FE_DE_ERRATAS'
  | 'OTROS';

export interface ResolucionHija {
  id: string;
  nro_resolucion: string;
  nro_resolucion_primigenia: string;
  resolucion_primigenia_id?: string;
  ruc_empresa: string;
  razon_social?: string;
  tipo_acto: TipoActoModificatorio;
  fecha_resolucion: Date | string;
  fecha_inicio_efectos: Date | string;
  expediente_numero?: string;
  fecha_expediente?: Date | string;
  link_documento?: string;
  link_notificacion?: string;
  vehiculos_ingresantes: string[];
  vehiculos_salientes: string[];
  rutas_modificadas_ids: string[];
  numeros_tuc?: string[];
  tucs_baja?: string[];
  tipo_tramite_origen?: string;
  id_origen?: string;
  observaciones?: string;
  esta_activo: boolean;
  fecha_registro?: Date | string;
  fecha_actualizacion?: Date | string;
}

export interface ResolucionHijaCreate {
  nro_resolucion: string;
  nro_resolucion_primigenia: string;
  ruc_empresa: string;
  tipo_acto: TipoActoModificatorio;
  fecha_resolucion: Date | string;
  fecha_inicio_efectos?: Date | string;
  expediente_numero?: string;
  link_documento?: string;
  vehiculos_ingresantes?: string[];
  vehiculos_salientes?: string[];
  rutas_modificadas_ids?: string[];
  observaciones?: string;
}

export interface ResolucionHijaUpdate {
  nro_resolucion?: string;
  nro_resolucion_primigenia?: string;
  ruc_empresa?: string;
  tipo_acto?: TipoActoModificatorio;
  fecha_resolucion?: Date | string;
  fecha_inicio_efectos?: Date | string;
  expediente_numero?: string;
  link_documento?: string;
  vehiculos_ingresantes?: string[];
  vehiculos_salientes?: string[];
  rutas_modificadas_ids?: string[];
  observaciones?: string;
}

export interface ResolucionHijaFiltros {
  nro_resolucion?: string;
  nro_resolucion_primigenia?: string;
  ruc_empresa?: string;
  tipo_acto?: TipoActoModificatorio;
  fecha_desde?: Date | string;
  fecha_hasta?: Date | string;
}
