export type EstadoTuc = 'VIGENTE' | 'DADA_DE_BAJA' | 'DESECHADA' | 'SUSPENDIDO' | 'VENCIDO';

export interface Tuc {
  id: string;
  vehiculoId: string;
  empresaId: string;
  expedienteId: string; // Cambiado de resolucionPadreId para coincidir con el backend
  nroTuc: string;
  fechaEmision: string;
  fechaVencimiento: string; // Agregado para coincidir con el backend
  estado: EstadoTuc;
  razonDescarte?: string;
  estaActivo: boolean;
  documentoId?: string;
  qrVerificationUrl?: string;
  observaciones?: string; // Agregado para coincidir con el backend
  // Propiedades para información relacionada
  vehiculo?: any;
  empresa?: any;
  resolucion?: any; // Mantenemos este nombre para compatibilidad con el frontend
}

export interface TucCreate {
  vehiculoId: string;
  empresaId: string;
  expedienteId: string; // Cambiado de resolucionPadreId
  nroTuc: string;
}

export interface TucUpdate {
  vehiculoId?: string;
  empresaId?: string;
  expedienteId?: string; // Cambiado de resolucionPadreId
  nroTuc?: string;
  estado?: EstadoTuc;
  razonDescarte?: string;
  documentoId?: string;
  qrVerificationUrl?: string;
  estaActivo?: boolean;
  observaciones?: string; // Agregado
} 