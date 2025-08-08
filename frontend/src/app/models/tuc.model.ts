export type EstadoTuc = 'VIGENTE' | 'DADA_DE_BAJA' | 'DESECHADA';

export interface Tuc {
  id: string;
  vehiculoId: string;
  empresaId: string;
  resolucionPadreId: string;
  nroTuc: string;
  fechaEmision: string;
  estado: EstadoTuc;
  razonDescarte?: string;
  estaActivo: boolean;
  documentoId?: string;
  qrVerificationUrl?: string;
}

export interface TucCreate {
  vehiculoId: string;
  empresaId: string;
  resolucionPadreId: string;
  nroTuc: string;
}

export interface TucUpdate {
  vehiculoId?: string;
  empresaId?: string;
  resolucionPadreId?: string;
  nroTuc?: string;
  estado?: EstadoTuc;
  razonDescarte?: string;
  documentoId?: string;
  qrVerificationUrl?: string;
} 