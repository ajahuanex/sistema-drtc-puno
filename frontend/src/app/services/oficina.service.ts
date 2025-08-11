import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Oficina, OficinaCreate as OficinaCreateModel, OficinaUpdate as OficinaUpdateModel, TipoOficina, PrioridadOficina } from '../models/oficina.model';

export interface OficinaCreate {
  nombre: string;
  codigo: string;
  ubicacion: string;
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsableId?: string;
  tipoOficina: TipoOficina;
  capacidadMaxima: number;
  tiempoPromedioTramite: number;
  prioridad: PrioridadOficina;
  descripcion?: string;
  observaciones?: string;
  tags?: string[];
}

export interface OficinaUpdate {
  nombre?: string;
  codigo?: string;
  ubicacion?: string;
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  responsableId?: string;
  tipoOficina?: TipoOficina;
  estaActiva?: boolean;
  capacidadMaxima?: number;
  tiempoPromedioTramite?: number;
  prioridad?: PrioridadOficina;
  descripcion?: string;
  observaciones?: string;
  tags?: string[];
}

export interface OficinaFiltros {
  nombre?: string;
  tipoOficina?: TipoOficina;
  responsableId?: string;
  ubicacion?: string;
  estado?: string;
  prioridad?: PrioridadOficina;
  estaActiva?: boolean;
}

export interface OficinaResumen {
  id: string;
  nombre: string;
  tipoOficina: TipoOficina;
  responsable: string;
  estado: string;
  expedientesPendientes: number;
  tiempoPromedio: number;
}

export interface OficinaEstadisticas {
  totalExpedientes: number;
  expedientesPendientes: number;
  expedientesEnProceso: number;
  expedientesCompletados: number;
  tiempoPromedioProcesamiento: number;
  expedientesPorDia: number;
  expedientesPorMes: number;
  expedientesPorTipo: Array<{
    tipoOficina: TipoOficina;
    cantidad: number;
  }>;
}

export interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  tipoMovimiento: string;
  oficina: string;
  fecha: string;
  observacion: string;
  esActual: boolean;
  oficinaOrigenId?: string;
  oficinaDestinoId?: string;
  motivo?: string;
  observaciones?: string;
  documentosRequeridos?: string[];
  documentosEntregados?: string[];
  fechaMovimiento?: string;
  usuarioId?: string;
  usuarioNombre?: string;
}

export interface FlujoExpediente {
  expedienteId: string;
  numeroExpediente: string;
  empresa: string;
  estadoActual: string;
  oficinaActual: string;
  movimientos: MovimientoExpediente[];
  expedienteNumero?: string;
  expedienteTipo?: string;
  expedienteEmpresa?: string;
  estado?: string;
  fechaCreacion?: string;
  ultimaActualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OficinaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/oficinas`;

  // BehaviorSubjects para estado reactivo
  private oficinasSubject = new BehaviorSubject<Oficina[]>([]);
  private oficinaSeleccionadaSubject = new BehaviorSubject<Oficina | null>(null);
  private flujoExpedienteSubject = new BehaviorSubject<FlujoExpediente | null>(null);

  // Observables públicos
  oficinas$ = this.oficinasSubject.asObservable();
  oficinaSeleccionada$ = this.oficinaSeleccionadaSubject.asObservable();
  flujoExpediente$ = this.flujoExpedienteSubject.asObservable();

  // Métodos CRUD para Oficinas
  getOficinas(filtros?: OficinaFiltros, skip: number = 0, limit: number = 100): Observable<Oficina[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (filtros) {
      if (filtros.nombre) params = params.set('nombre', filtros.nombre);
      if (filtros.tipoOficina) params = params.set('tipoOficina', filtros.tipoOficina);
      if (filtros.responsableId) params = params.set('responsableId', filtros.responsableId);
      if (filtros.ubicacion) params = params.set('ubicacion', filtros.ubicacion);
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.prioridad) params = params.set('prioridad', filtros.prioridad);
      if (filtros.estaActiva !== undefined) params = params.set('estaActiva', filtros.estaActiva.toString());
    }

    return this.http.get<Oficina[]>(this.apiUrl, { params });
  }

  getOficina(id: string): Observable<Oficina> {
    return this.http.get<Oficina>(`${this.apiUrl}/${id}`);
  }

  createOficina(oficina: OficinaCreateModel): Observable<Oficina> {
    return this.http.post<Oficina>(this.apiUrl, oficina);
  }

  updateOficina(id: string, oficina: OficinaUpdateModel): Observable<Oficina> {
    return this.http.put<Oficina>(`${this.apiUrl}/${id}`, oficina);
  }

  deleteOficina(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos para Resumen y Estadísticas
  getOficinasResumen(): Observable<OficinaResumen[]> {
    return this.http.get<OficinaResumen[]>(`${this.apiUrl}/resumen`);
  }

  getEstadisticasOficina(id: string): Observable<OficinaEstadisticas> {
    return this.http.get<OficinaEstadisticas>(`${this.apiUrl}/${id}/estadisticas`);
  }

  // Métodos para Expedientes
  getExpedientesPorOficina(oficinaId: string, skip: number = 0, limit: number = 100): Observable<any[]> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    return this.http.get<any[]>(`${this.apiUrl}/${oficinaId}/expedientes`, { params });
  }

  moverExpediente(
    expedienteId: string, 
    oficinaDestinoId: string, 
    motivo: string, 
    observaciones?: string,
    documentosRequeridos?: string[],
    documentosEntregados?: string[]
  ): Observable<any> {
    const payload = {
      motivo,
      observaciones,
      documentos_requeridos: documentosRequeridos,
      documentos_entregados: documentosEntregados
    };

    return this.http.post<any>(
      `${this.apiUrl}/${oficinaDestinoId}/expedientes/${expedienteId}/mover`,
      payload
    );
  }

  // Métodos para Flujo de Expedientes
  getFlujoExpediente(expedienteId: string): Observable<FlujoExpediente> {
    // Este endpoint necesitaría ser implementado en el backend
    // Por ahora simulamos la respuesta
    return this.http.get<FlujoExpediente>(`${this.apiUrl}/flujo/${expedienteId}`);
  }

  getFlujoExpedientes(): Observable<FlujoExpediente[]> {
    // Este endpoint necesitaría ser implementado en el backend
    // Por ahora simulamos la respuesta
    return this.http.get<FlujoExpediente[]>(`${this.apiUrl}/flujo/expedientes`);
  }

  // Métodos para Listas de Opciones
  getTiposOficina(): Observable<Array<{value: TipoOficina, label: string}>> {
    return this.http.get<Array<{value: TipoOficina, label: string}>>(`${this.apiUrl}/tipos/lista`);
  }

  getEstadosOficina(): Observable<Array<{value: string, label: string}>> {
    return this.http.get<Array<{value: string, label: string}>>(`${this.apiUrl}/estados/lista`);
  }

  getPrioridadesOficina(): Observable<Array<{value: PrioridadOficina, label: string}>> {
    return this.http.get<Array<{value: PrioridadOficina, label: string}>>(`${this.apiUrl}/prioridades/lista`);
  }

  // Métodos para activar/desactivar oficinas
  activarOficina(id: string): Observable<Oficina> {
    return this.http.patch<Oficina>(`${this.apiUrl}/${id}/activar`, { estaActiva: true });
  }

  desactivarOficina(id: string): Observable<Oficina> {
    return this.http.patch<Oficina>(`${this.apiUrl}/${id}/desactivar`, { estaActiva: false });
  }

  // Métodos para actualizar estado local
  setOficinas(oficinas: Oficina[]): void {
    this.oficinasSubject.next(oficinas);
  }

  setOficinaSeleccionada(oficina: Oficina | null): void {
    this.oficinaSeleccionadaSubject.next(oficina);
  }

  setFlujoExpediente(flujo: FlujoExpediente | null): void {
    this.flujoExpedienteSubject.next(flujo);
  }

  // Método para agregar una nueva oficina al estado local
  addOficina(oficina: Oficina): void {
    const oficinasActuales = this.oficinasSubject.value;
    this.oficinasSubject.next([...oficinasActuales, oficina]);
  }

  // Método para actualizar una oficina en el estado local
  updateOficinaLocal(oficina: Oficina): void {
    const oficinasActuales = this.oficinasSubject.value;
    const index = oficinasActuales.findIndex(o => o.id === oficina.id);
    if (index !== -1) {
      oficinasActuales[index] = oficina;
      this.oficinasSubject.next([...oficinasActuales]);
    }
  }

  // Método para eliminar una oficina del estado local
  removeOficina(id: string): void {
    const oficinasActuales = this.oficinasSubject.value;
    this.oficinasSubject.next(oficinasActuales.filter(o => o.id !== id));
  }
} 