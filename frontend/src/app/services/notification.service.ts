import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  destinatarioId: string;
  destinatarioNombre: string;
  remitenteId?: string;
  remitenteNombre?: string;
  fechaCreacion: Date;
  fechaLectura?: Date;
  leida: boolean;
  prioridad: PrioridadNotificacion;
  categoria: CategoriaNotificacion;
  datosAdicionales?: any;
  accionUrl?: string;
  accionTexto?: string;
  expiraEn?: Date;
}

export enum TipoNotificacion {
  SISTEMA = 'SISTEMA',
  EXPEDIENTE = 'EXPEDIENTE',
  FISCALIZACION = 'FISCALIZACION',
  RECORDATORIO = 'RECORDATORIO',
  ALERTA = 'ALERTA',
  APROBACION = 'APROBACION',
  RECHAZO = 'RECHAZO'
}

export enum PrioridadNotificacion {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

export enum CategoriaNotificacion {
  GENERAL = 'GENERAL',
  ADMINISTRATIVA = 'ADMINISTRATIVA',
  OPERATIVA = 'OPERATIVA',
  FINANCIERA = 'FINANCIERA',
  LEGAL = 'LEGAL',
  TECNICA = 'TECNICA'
}

export interface NotificacionCreate {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  destinatarioId: string;
  prioridad: PrioridadNotificacion;
  categoria: CategoriaNotificacion;
  datosAdicionales?: any;
  accionUrl?: string;
  accionTexto?: string;
  expiraEn?: Date;
}

export interface NotificacionFiltros {
  tipo?: TipoNotificacion;
  categoria?: CategoriaNotificacion;
  prioridad?: PrioridadNotificacion;
  leida?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
  destinatarioId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  // Signals para estado reactivo
  private notificacionesSubject = signal<Notificacion[]>([]);
  private notificacionesNoLeidasSubject = signal<Notificacion[]>([]);
  private notificacionesCriticasSubject = signal<Notificacion[]>([]);

  // Signals públicos (no necesitan asObservable)
  notificaciones = this.notificacionesSubject;
  notificacionesNoLeidas = this.notificacionesNoLeidasSubject;
  notificacionesCriticas = this.notificacionesCriticasSubject;

  // Computed properties
  totalNotificaciones = computed(() => this.notificacionesSubject().length);
  totalNoLeidas = computed(() => this.notificacionesNoLeidasSubject().length);
  totalCriticas = computed(() => this.notificacionesCriticasSubject().length);

  // Configuración de polling
  private pollingInterval = 30000; // 30 segundos
  private pollingSubscription: any;

  constructor() {
    this.iniciarPolling();
    this.cargarNotificaciones();
  }

  // Métodos CRUD
  getNotificaciones(filtros?: NotificacionFiltros, skip: number = 0, limit: number = 100): Observable<Notificacion[]> {
    let params = new URLSearchParams();
    params.set('skip', skip.toString());
    params.set('limit', limit.toString());

    if (filtros) {
      if (filtros.tipo) params.set('tipo', filtros.tipo);
      if (filtros.categoria) params.set('categoria', filtros.categoria);
      if (filtros.prioridad) params.set('prioridad', filtros.prioridad);
      if (filtros.leida !== undefined) params.set('leida', filtros.leida.toString());
      if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde.toISOString());
      if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta.toISOString());
      if (filtros.destinatarioId) params.set('destinatarioId', filtros.destinatarioId);
    }

    return this.http.get<Notificacion[]>(`${this.apiUrl}?${params.toString()}`);
  }

  getNotificacion(id: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/${id}`);
  }

  createNotificacion(notificacion: NotificacionCreate): Observable<Notificacion> {
    return this.http.post<Notificacion>(this.apiUrl, notificacion);
  }

  updateNotificacion(id: string, notificacion: Partial<Notificacion>): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.apiUrl}/${id}`, notificacion);
  }

  deleteNotificacion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos específicos
  marcarComoLeida(id: string): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${this.apiUrl}/${id}/leer`, {});
  }

  marcarTodasComoLeidas(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/leer-todas`, {});
  }

  getNotificacionesNoLeidas(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/no-leidas`);
  }

  getNotificacionesCriticas(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/criticas`);
  }

  // Métodos de utilidad
  private cargarNotificaciones(): void {
    this.getNotificaciones().subscribe({
      next: (notificaciones) => {
        this.notificacionesSubject.set(notificaciones);
        this.actualizarNotificacionesFiltradas();
      },
      error: (error) => {
        console.error('Error cargando notificaciones:', error);
      }
    });
  }

  private actualizarNotificacionesFiltradas(): void {
    const notificaciones = this.notificacionesSubject();
    
    // Filtrar no leídas
    const noLeidas = notificaciones.filter(n => !n.leida);
    this.notificacionesNoLeidasSubject.set(noLeidas);
    
    // Filtrar críticas
    const criticas = notificaciones.filter(n => n.prioridad === PrioridadNotificacion.CRITICA);
    this.notificacionesCriticasSubject.set(criticas);
  }

  private iniciarPolling(): void {
    this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
      this.cargarNotificaciones();
    });
  }

  // Métodos para crear notificaciones automáticas
  crearNotificacionExpediente(
    expedienteId: string,
    expedienteNumero: string,
    empresaNombre: string,
    tipo: TipoNotificacion,
    mensaje: string,
    destinatarioId: string,
    prioridad: PrioridadNotificacion = PrioridadNotificacion.MEDIA
  ): void {
    const notificacion: NotificacionCreate = {
      tipo,
      titulo: `EXPEDIENTE ${expedienteNumero}`,
      mensaje: `${mensaje} - Empresa: ${empresaNombre}`,
      destinatarioId,
      prioridad,
      categoria: CategoriaNotificacion.ADMINISTRATIVA,
      datosAdicionales: { expedienteId, expedienteNumero, empresaNombre },
      accionUrl: `/expedientes/${expedienteId}`,
      accionTexto: 'Ver Expediente'
    };

    this.createNotificacion(notificacion).subscribe({
      next: (notif) => {
        // Agregar a la lista local
        const notificacionesActuales = this.notificacionesSubject();
        this.notificacionesSubject.set([notif, ...notificacionesActuales]);
        this.actualizarNotificacionesFiltradas();
      },
      error: (error) => {
        console.error('Error creando notificación:', error);
      }
    });
  }

  crearNotificacionFiscalizacion(
    fiscalizacionId: string,
    empresaNombre: string,
    tipo: TipoNotificacion,
    mensaje: string,
    destinatarioId: string,
    prioridad: PrioridadNotificacion = PrioridadNotificacion.ALTA
  ): void {
    const notificacion: NotificacionCreate = {
      tipo,
      titulo: `FISCALIZACIÓN - ${empresaNombre}`,
      mensaje,
      destinatarioId,
      prioridad,
      categoria: CategoriaNotificacion.OPERATIVA,
      datosAdicionales: { fiscalizacionId, empresaNombre },
      accionUrl: `/fiscalizaciones/${fiscalizacionId}`,
      accionTexto: 'Ver Fiscalización'
    };

    this.createNotificacion(notificacion).subscribe({
      next: (notif) => {
        const notificacionesActuales = this.notificacionesSubject();
        this.notificacionesSubject.set([notif, ...notificacionesActuales]);
        this.actualizarNotificacionesFiltradas();
      },
      error: (error) => {
        console.error('Error creando notificación:', error);
      }
    });
  }

  crearNotificacionRecordatorio(
    titulo: string,
    mensaje: string,
    destinatarioId: string,
    fechaRecordatorio: Date,
    prioridad: PrioridadNotificacion = PrioridadNotificacion.BAJA
  ): void {
    const notificacion: NotificacionCreate = {
      tipo: TipoNotificacion.RECORDATORIO,
      titulo,
      mensaje,
      destinatarioId,
      prioridad,
      categoria: CategoriaNotificacion.GENERAL,
      expiraEn: fechaRecordatorio
    };

    this.createNotificacion(notificacion).subscribe({
      next: (notif) => {
        const notificacionesActuales = this.notificacionesSubject();
        this.notificacionesSubject.set([notif, ...notificacionesActuales]);
        this.actualizarNotificacionesFiltradas();
      },
      error: (error) => {
        console.error('Error creando notificación:', error);
      }
    });
  }

  // Métodos para gestión local
  agregarNotificacion(notificacion: Notificacion): void {
    const notificacionesActuales = this.notificacionesSubject();
    this.notificacionesSubject.set([notificacion, ...notificacionesActuales]);
    this.actualizarNotificacionesFiltradas();
  }

  actualizarNotificacionLocal(notificacion: Notificacion): void {
    const notificacionesActuales = this.notificacionesSubject();
    const index = notificacionesActuales.findIndex(n => n.id === notificacion.id);
    if (index !== -1) {
      notificacionesActuales[index] = notificacion;
      this.notificacionesSubject.set([...notificacionesActuales]);
      this.actualizarNotificacionesFiltradas();
    }
  }

  eliminarNotificacionLocal(id: string): void {
    const notificacionesActuales = this.notificacionesSubject();
    this.notificacionesSubject.set(notificacionesActuales.filter(n => n.id !== id));
    this.actualizarNotificacionesFiltradas();
  }

  // Limpieza
  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Métodos de utilidad para mostrar notificaciones
  showError(mensaje: string): void {
    console.error('Error:', mensaje);
    // Aquí se podría integrar con un servicio de toast o snackbar
  }

  showInfo(mensaje: string): void {
    console.log('Info:', mensaje);
    // Aquí se podría integrar con un servicio de toast o snackbar
  }

  showSuccess(mensaje: string): void {
    console.log('Success:', mensaje);
    // Aquí se podría integrar con un servicio de toast o snackbar
  }

  showWarning(mensaje: string): void {
    console.warn('Warning:', mensaje);
    // Aquí se podría integrar con un servicio de toast o snackbar
  }
} 