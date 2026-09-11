export type EstadoResolucionPrimigenia = 'VIGENTE' | 'CANCELADA' | 'SUSPENDIDA' | 'VENCIDA' | 'ANULADA';

export interface FeErrata {
  numero_resolucion: string;
  fecha_emision: Date | string;
  detalle_correccion: string;
  documento_link?: string;
}

export interface ModificacionHistorial {
  resolucion_hija_id?: string;
  nro_resolucion_hija: string;
  tipo_modificacion: string;
  fecha_acto: Date | string;
  observacion?: string;
}

export interface ResolucionPrimigenia {
  id: string;
  ruc_empresa: string;
  nro_resolucion: string;
  siglas?: string;
  fecha_resolucion: Date | string;
  fecha_inicio_vigencia: Date | string;
  anios_vigencia: number;
  fecha_fin_vigencia: Date | string;
  estado: EstadoResolucionPrimigenia;
  tiene_eficacia_anticipada: boolean;
  tipo_autorizacion: string;
  link_documento?: string;
  expedientes_codigos: string[];
  fe_erratas: FeErrata[];
  historial_modificaciones: ModificacionHistorial[];
  observaciones?: string;
  esta_activo: boolean;
  fecha_registro?: Date | string;
  fecha_actualizacion?: Date | string;
}

export interface ResolucionPrimigeniaCreate {
  ruc_empresa: string;
  nro_resolucion: string;
  siglas?: string;
  fecha_resolucion: Date | string;
  fecha_inicio_vigencia: Date | string;
  anios_vigencia?: number;
  fecha_fin_vigencia?: Date | string;
  estado?: EstadoResolucionPrimigenia;
  tiene_eficacia_anticipada?: boolean;
  tipo_autorizacion: string;
  link_documento?: string;
  expedientes_codigos?: string[];
  observaciones?: string;
}

export interface ResolucionPrimigeniaUpdate {
  nro_resolucion?: string;
  siglas?: string;
  fecha_resolucion?: Date | string;
  fecha_inicio_vigencia?: Date | string;
  anios_vigencia?: number;
  fecha_fin_vigencia?: Date | string;
  estado?: EstadoResolucionPrimigenia;
  tipo_autorizacion?: string;
  link_documento?: string;
  expedientes_codigos?: string[];
  observaciones?: string;
}

export interface ResolucionPrimigeniaFiltros {
  ruc_empresa?: string;
  nro_resolucion?: string;
  estado?: EstadoResolucionPrimigenia;
  tipo_autorizacion?: string;
  fecha_desde?: Date | string;
  fecha_hasta?: Date | string;
}
