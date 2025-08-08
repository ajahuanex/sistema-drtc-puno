export interface Licencia {
  numero: string;
  categoria: string;
  fechaEmision: string;
  fechaVencimiento: string;
}

export interface Conductor {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: Licencia;
  estado: string;
  calidadConductor: 'ÓPTIMO' | 'AMONESTADO' | 'EN_SANCION';
  estaActivo: boolean;
  empresasAsociadasIds: string[];
}

export interface ConductorCreate {
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: Licencia;
  empresasAsociadasIds: string[];
}

export interface ConductorUpdate {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  licencia?: Licencia;
  estado?: string;
  calidadConductor?: 'ÓPTIMO' | 'AMONESTADO' | 'EN_SANCION';
  empresasAsociadasIds?: string[];
} 