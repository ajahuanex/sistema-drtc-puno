export interface DatosTecnicos {
  motor: string;
  chasis: string;
  cilindros: number;
  ejes: number;
  ruedas: number;
  asientos: number;
  pesoNeto: number;
  pesoBruto: number;
  medidas: {
    largo: number;
    ancho: number;
    alto: number;
  };
}

export interface Tuc {
  nroTuc: string;
  fechaEmision: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  sedeRegistro?: string; // Nuevo campo (opcional para compatibilidad con datos existentes)
  empresaActualId: string;
  resolucionId: string;
  rutasAsignadasIds: string[];
  categoria: string;
  marca: string;
  modelo: string;
  anioFabricacion: number;
  estado: string;
  estaActivo: boolean;
  tuc?: Tuc;
  datosTecnicos: DatosTecnicos;
  // Campos de historial de validaciones
  numeroHistorialValidacion?: number; // Número secuencial basado en orden de resoluciones
  esHistorialActual?: boolean; // Si es el registro actual del vehículo (historial más alto)
  vehiculoHistorialActualId?: string; // ID del vehículo con el historial más actual
}

export interface VehiculoCreate {
  placa: string;
  sedeRegistro?: string; // Nuevo campo (opcional para compatibilidad)
  empresaActualId: string;
  resolucionId: string;
  rutasAsignadasIds: string[];
  categoria: string;
  marca: string;
  modelo: string;
  anioFabricacion: number;
  tuc?: Tuc;
  datosTecnicos: DatosTecnicos;
}

export interface VehiculoUpdate {
  placa?: string;
  sedeRegistro?: string;
  empresaActualId?: string;
  resolucionId?: string;
  rutasAsignadasIds?: string[];
  categoria?: string;
  marca?: string;
  modelo?: string;
  anioFabricacion?: number;
  estado?: string;
  tuc?: Tuc;
  datosTecnicos?: DatosTecnicos;
} 