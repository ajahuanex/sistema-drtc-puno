export interface RazonSocial {
  principal: string;
  sunat?: string;
  minimo?: string;
}

export interface RepresentanteLegal {
  dni: string;
  nombres: string;
}

export interface Empresa {
  id: string;
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  estado: 'HABILITADA' | 'EN_TRAMITE' | 'SUSPENDIDA' | 'CANCELADA';
  estaActivo: boolean;
  fechaRegistro: string;
  representanteLegal: RepresentanteLegal;
  resolucionesPrimigeniasIds: string[];
  vehiculosHabilitadosIds: string[];
  conductoresHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
}

export interface EmpresaCreate {
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  representanteLegal: RepresentanteLegal;
}

export interface EmpresaUpdate {
  ruc?: string;
  razonSocial?: RazonSocial;
  direccionFiscal?: string;
  representanteLegal?: RepresentanteLegal;
  estado?: 'HABILITADA' | 'EN_TRAMITE' | 'SUSPENDIDA' | 'CANCELADA';
}

// Interfaces adicionales para funcionalidades avanzadas
export interface EmpresaDetalle extends Empresa {
  // Información adicional para la vista de detalles
  totalVehiculos?: number;
  totalConductores?: number;
  totalRutas?: number;
  ultimaActualizacion?: string;
}

export interface EmpresaFiltros {
  estado?: string;
  ruc?: string;
  razonSocial?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface EmpresaEstadisticas {
  totalEmpresas: number;
  empresasHabilitadas: number;
  empresasEnTramite: number;
  empresasSuspendidas: number;
  empresasCanceladas: number;
} 