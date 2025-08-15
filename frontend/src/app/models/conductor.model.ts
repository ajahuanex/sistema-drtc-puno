export interface Conductor {
  id: string;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  nombreCompleto: string;
  fechaNacimiento: Date;
  genero: Genero;
  estadoCivil: EstadoCivil;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  telefono: string;
  celular: string;
  email?: string;
  numeroLicencia: string;
  categoriaLicencia: TipoLicencia[];
  fechaEmisionLicencia: Date;
  fechaVencimientoLicencia: Date;
  estadoLicencia: EstadoLicencia;
  entidadEmisora: string;
  empresaId?: string;
  fechaIngreso?: Date;
  cargo?: string;
  estado: EstadoConductor;
  estaActivo: boolean;
  experienciaAnos?: number;
  tipoSangre?: string;
  restricciones: string[];
  observaciones?: string;
  documentosIds: string[];
  fotoPerfil?: string;
  fechaRegistro: Date;
  fechaActualizacion?: Date;
  fechaUltimaVerificacion?: Date;
  usuarioRegistroId?: string;
  usuarioActualizacionId?: string;
}

export interface ConductorCreate {
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: Date;
  genero: Genero;
  estadoCivil: EstadoCivil;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  telefono: string;
  celular: string;
  email?: string;
  numeroLicencia: string;
  categoriaLicencia: TipoLicencia[];
  fechaEmisionLicencia: Date;
  fechaVencimientoLicencia: Date;
  entidadEmisora: string;
  empresaId?: string;
  fechaIngreso?: Date;
  cargo?: string;
  experienciaAnos?: number;
  tipoSangre?: string;
  restricciones: string[];
  observaciones?: string;
}

export interface ConductorUpdate {
  dni?: string;
  numeroLicencia?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombres?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  categoriaLicencia?: TipoLicencia[];
  fechaVencimientoLicencia?: Date;
  estadoLicencia?: EstadoLicencia;
  entidadEmisora?: string;
  empresaId?: string;
  fechaIngreso?: Date;
  cargo?: string;
  estado?: EstadoConductor;
  experienciaAnos?: number;
  tipoSangre?: string;
  restricciones?: string[];
  observaciones?: string;
  fotoPerfil?: string;
}

export interface ConductorFiltros {
  dni?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  numeroLicencia?: string;
  categoriaLicencia?: TipoLicencia;
  estadoLicencia?: EstadoLicencia;
  estado?: EstadoConductor;
  empresaId?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  fechaVencimientoDesde?: Date;
  fechaVencimientoHasta?: Date;
  experienciaMinima?: number;
  experienciaMaxima?: number;
}

export interface ConductorEstadisticas {
  totalConductores: number;
  conductoresActivos: number;
  conductoresInactivos: number;
  conductoresSuspendidos: number;
  conductoresEnVerificacion: number;
  conductoresDadosDeBaja: number;
  licenciasVigentes: number;
  licenciasVencidas: number;
  licenciasPorVencer: number;
  distribucionPorGenero: Record<string, number>;
  distribucionPorEdad: Record<string, number>;
  distribucionPorCategoria: Record<string, number>;
  promedioExperiencia: number;
}

export interface ConductorResumen {
  id: string;
  dni: string;
  nombreCompleto: string;
  numeroLicencia: string;
  categoriaLicencia: TipoLicencia[];
  estadoLicencia: EstadoLicencia;
  estado: EstadoConductor;
  empresaId?: string;
  fechaUltimaVerificacion?: Date;
}

export interface ConductorHistorial {
  id: string;
  conductorId: string;
  fechaCambio: Date;
  tipoCambio: string;
  usuarioId: string;
  campoAnterior?: string;
  campoNuevo?: string;
  observaciones?: string;
  datosCompletos: Record<string, any>;
}

export interface ConductorDocumento {
  id: string;
  conductorId: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  entidadEmisora: string;
  estado: string;
  archivoUrl?: string;
  observaciones?: string;
  fechaRegistro: Date;
  estaActivo: boolean;
}

export interface ConductorVehiculo {
  id: string;
  conductorId: string;
  vehiculoId: string;
  fechaAsignacion: Date;
  fechaDesasignacion?: Date;
  motivoAsignacion: string;
  motivoDesasignacion?: string;
  estado: string;
  observaciones?: string;
  usuarioAsignacionId: string;
  usuarioDesasignacionId?: string;
  fechaRegistro: Date;
}

export interface ValidacionDni {
  dni: string;
  valido: boolean;
  conductor?: Conductor;
  error?: string;
}

export interface ValidacionLicencia {
  numeroLicencia: string;
  valido: boolean;
  conductor?: Conductor;
  error?: string;
}

// Enums
export enum EstadoConductor {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  DADO_DE_BAJA = 'DADO_DE_BAJA',
  EN_VERIFICACION = 'EN_VERIFICACION'
}

export enum EstadoLicencia {
  VIGENTE = 'VIGENTE',
  VENCIDA = 'VENCIDA',
  EN_TRAMITE = 'EN_TRAMITE',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA'
}

export enum TipoLicencia {
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3',
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  E1 = 'E1',
  E2 = 'E2'
}

export enum Genero {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO'
}

export enum EstadoCivil {
  SOLTERO = 'SOLTERO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUDO = 'VIUDO',
  CONVIVIENTE = 'CONVIVIENTE'
}

// Constantes para la interfaz
export const ESTADOS_CONDUCTOR = Object.values(EstadoConductor);
export const ESTADOS_LICENCIA = Object.values(EstadoLicencia);
export const TIPOS_LICENCIA = Object.values(TipoLicencia);
export const GENEROS = Object.values(Genero);
export const ESTADOS_CIVIL = Object.values(EstadoCivil);

// Mapeo de etiquetas para la interfaz
export const ESTADOS_CONDUCTOR_LABELS: Record<EstadoConductor, string> = {
  [EstadoConductor.ACTIVO]: 'Activo',
  [EstadoConductor.INACTIVO]: 'Inactivo',
  [EstadoConductor.SUSPENDIDO]: 'Suspendido',
  [EstadoConductor.DADO_DE_BAJA]: 'Dado de Baja',
  [EstadoConductor.EN_VERIFICACION]: 'En Verificación'
};

export const ESTADOS_LICENCIA_LABELS: Record<EstadoLicencia, string> = {
  [EstadoLicencia.VIGENTE]: 'Vigente',
  [EstadoLicencia.VENCIDA]: 'Vencida',
  [EstadoLicencia.EN_TRAMITE]: 'En Trámite',
  [EstadoLicencia.SUSPENDIDA]: 'Suspendida',
  [EstadoLicencia.CANCELADA]: 'Cancelada'
};

export const TIPOS_LICENCIA_LABELS: Record<TipoLicencia, string> = {
  [TipoLicencia.A1]: 'A1 - Motocicletas',
  [TipoLicencia.A2]: 'A2 - Motocicletas hasta 400cc',
  [TipoLicencia.A3]: 'A3 - Motocicletas hasta 200cc',
  [TipoLicencia.B1]: 'B1 - Vehículos particulares',
  [TipoLicencia.B2]: 'B2 - Vehículos particulares y comerciales',
  [TipoLicencia.C1]: 'C1 - Vehículos de carga hasta 3.5 ton',
  [TipoLicencia.C2]: 'C2 - Vehículos de carga hasta 8 ton',
  [TipoLicencia.C3]: 'C3 - Vehículos de carga hasta 12 ton',
  [TipoLicencia.D1]: 'D1 - Vehículos de pasajeros hasta 16 personas',
  [TipoLicencia.D2]: 'D2 - Vehículos de pasajeros hasta 25 personas',
  [TipoLicencia.D3]: 'D3 - Vehículos de pasajeros sin límite',
  [TipoLicencia.E1]: 'E1 - Vehículos especiales',
  [TipoLicencia.E2]: 'E2 - Vehículos especiales pesados'
};

export const GENEROS_LABELS: Record<Genero, string> = {
  [Genero.MASCULINO]: 'Masculino',
  [Genero.FEMENINO]: 'Femenino',
  [Genero.OTRO]: 'Otro'
};

export const ESTADOS_CIVIL_LABELS: Record<EstadoCivil, string> = {
  [EstadoCivil.SOLTERO]: 'Soltero',
  [EstadoCivil.CASADO]: 'Casado',
  [EstadoCivil.DIVORCIADO]: 'Divorciado',
  [EstadoCivil.VIUDO]: 'Viudo',
  [EstadoCivil.CONVIVIENTE]: 'Conviviente'
};

// Colores para los estados
export const ESTADOS_CONDUCTOR_COLORS: Record<EstadoConductor, string> = {
  [EstadoConductor.ACTIVO]: 'success',
  [EstadoConductor.INACTIVO]: 'warning',
  [EstadoConductor.SUSPENDIDO]: 'danger',
  [EstadoConductor.DADO_DE_BAJA]: 'dark',
  [EstadoConductor.EN_VERIFICACION]: 'info'
};

export const ESTADOS_LICENCIA_COLORS: Record<EstadoLicencia, string> = {
  [EstadoLicencia.VIGENTE]: 'success',
  [EstadoLicencia.VENCIDA]: 'danger',
  [EstadoLicencia.EN_TRAMITE]: 'warning',
  [EstadoLicencia.SUSPENDIDA]: 'danger',
  [EstadoLicencia.CANCELADA]: 'dark'
};

// Utilidades
export function getEstadoConductorLabel(estado: EstadoConductor): string {
  return ESTADOS_CONDUCTOR_LABELS[estado] || estado;
}

export function getEstadoLicenciaLabel(estado: EstadoLicencia): string {
  return ESTADOS_LICENCIA_LABELS[estado] || estado;
}

export function getTipoLicenciaLabel(tipo: TipoLicencia): string {
  return TIPOS_LICENCIA_LABELS[tipo] || tipo;
}

export function getGeneroLabel(genero: Genero): string {
  return GENEROS_LABELS[genero] || genero;
}

export function getEstadoCivilLabel(estadoCivil: EstadoCivil): string {
  return ESTADOS_CIVIL_LABELS[estadoCivil] || estadoCivil;
}

export function getEstadoConductorColor(estado: EstadoConductor): string {
  return ESTADOS_CONDUCTOR_COLORS[estado] || 'secondary';
}

export function getEstadoLicenciaColor(estado: EstadoLicencia): string {
  return ESTADOS_LICENCIA_COLORS[estado] || 'secondary';
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    return edad - 1;
  }
  
  return edad;
}

export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatearFechaCompleta(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function formatearTelefono(telefono: string): string {
  // Formatear número de teléfono peruano
  if (telefono.length === 9) {
    return `${telefono.slice(0, 3)}-${telefono.slice(3, 6)}-${telefono.slice(6)}`;
  }
  return telefono;
}

export function validarDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

export function validarTelefono(telefono: string): boolean {
  return /^\d{7,9}$/.test(telefono);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 