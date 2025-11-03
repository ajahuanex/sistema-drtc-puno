import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  Notificacion,
  NotificacionCreate,
  PreferenciasNotificacion,
  TipoNotificacion,
  EventoNotificacion
} from '../../models/mesa-partes/notificacion.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v1/notificaciones';
  private wsUrl = 'ws://localhost:8000/ws/notificaciones';

  // WebSocket
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Observables para notificaciones en tiempo real
  private notificacionesSubject = new Subject<Notificacion>();
  private eventosSubject = new Subject<EventoNotificacion>();
  private conexionSubject = new BehaviorSubject<boolean>(false);

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public eventos$ = this.eventosSubject.asObservable();
  public conexion$ = this.conexionSubject.asObservable();

  /**
   * Obtener notificaciones del usuario
   * Requirements: 8.1, 8.2
   */
  obtenerNotificaciones(
    usuarioId: string,
    leida?: boolean,
    tipo?: TipoNotificacion,
    page?: number,
    pageSize?: number
  ): Observable<{
    notificaciones: Notificacion[];
    total: number;
    noLeidas: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (leida !== undefined) {
      params = params.set('leida', leida.toString());
    }
    if (tipo) {
      params = params.set('tipo', tipo);
    }
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      notificaciones: Notificacion[];
      total: number;
      noLeidas: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/usuario/${usuarioId}`, { params });
  }

  /**
   * Marcar notificación como leída
   * Requirements: 8.2
   */
  marcarComoLeida(notificacionId: string): Observable<Notificacion> {
    return this.http.put<Notificacion>(
      `${this.apiUrl}/${notificacionId}/leer`,
      {}
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   * Requirements: 8.2
   */
  marcarTodasComoLeidas(usuarioId: string): Observable<{
    actualizadas: number;
  }> {
    return this.http.put<{
      actualizadas: number;
    }>(`${this.apiUrl}/usuario/${usuarioId}/leer-todas`, {});
  }

  /**
   * Eliminar una notificación
   * Requirements: 8.2
   */
  eliminarNotificacion(notificacionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificacionId}`);
  }

  /**
   * Obtener contador de notificaciones no leídas
   * Requirements: 8.1
   */
  obtenerContadorNoLeidas(usuarioId: string): Observable<{
    total: number;
    porTipo: Record<TipoNotificacion, number>;
  }> {
    return this.http.get<{
      total: number;
      porTipo: Record<TipoNotificacion, number>;
    }>(`${this.apiUrl}/usuario/${usuarioId}/contador`);
  }

  /**
   * Conectar WebSocket para notificaciones en tiempo real
   * Requirements: 8.1, 8.3, 8.4
   */
  conectarWebSocket(usuarioId: string, token: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }

    const wsUrlWithParams = `${this.wsUrl}?usuario_id=${usuarioId}&token=${token}`;

    try {
      this.socket = new WebSocket(wsUrlWithParams);

      this.socket.onopen = () => {
        console.log('WebSocket conectado');
        this.conexionSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.tipo === 'notificacion') {
            const notificacion: Notificacion = data.notificacion;
            this.notificacionesSubject.next(notificacion);
            this.reproducirSonido(notificacion);
          } else if (data.tipo === 'evento') {
            const evento: EventoNotificacion = data.evento;
            this.eventosSubject.next(evento);
          }
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        this.conexionSubject.next(false);
      };

      this.socket.onclose = () => {
        console.log('WebSocket desconectado');
        this.conexionSubject.next(false);
        this.intentarReconexion(usuarioId, token);
      };
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.conexionSubject.next(false);
    }
  }

  /**
   * Desconectar WebSocket
   * Requirements: 8.4
   */
  desconectarWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.conexionSubject.next(false);
    }
  }

  /**
   * Suscribirse a eventos específicos
   * Requirements: 8.4, 8.5
   */
  suscribirseAEventos(
    usuarioId: string,
    eventos: TipoNotificacion[]
  ): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/usuario/${usuarioId}/suscribir`, {
      eventos
    });
  }

  /**
   * Desuscribirse de eventos
   * Requirements: 8.4, 8.5
   */
  desuscribirseDeEventos(
    usuarioId: string,
    eventos: TipoNotificacion[]
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/usuario/${usuarioId}/desuscribir`,
      {
        eventos
      }
    );
  }

  /**
   * Obtener preferencias de notificación del usuario
   * Requirements: 8.5, 8.6
   */
  obtenerPreferencias(
    usuarioId: string
  ): Observable<PreferenciasNotificacion> {
    return this.http.get<PreferenciasNotificacion>(
      `${this.apiUrl}/usuario/${usuarioId}/preferencias`
    );
  }

  /**
   * Actualizar preferencias de notificación
   * Requirements: 8.5, 8.6
   */
  actualizarPreferencias(
    usuarioId: string,
    preferencias: Partial<PreferenciasNotificacion>
  ): Observable<PreferenciasNotificacion> {
    return this.http.put<PreferenciasNotificacion>(
      `${this.apiUrl}/usuario/${usuarioId}/preferencias`,
      preferencias
    );
  }

  /**
   * Enviar notificación manual (admin)
   * Requirements: 8.1
   */
  enviarNotificacion(
    notificacion: NotificacionCreate
  ): Observable<Notificacion> {
    return this.http.post<Notificacion>(this.apiUrl, notificacion);
  }

  /**
   * Obtener historial de notificaciones
   * Requirements: 8.7
   */
  obtenerHistorial(
    usuarioId: string,
    fechaDesde?: Date,
    fechaHasta?: Date,
    page?: number,
    pageSize?: number
  ): Observable<{
    notificaciones: Notificacion[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let params = new HttpParams();

    if (fechaDesde) {
      params = params.set('fecha_desde', fechaDesde.toISOString());
    }
    if (fechaHasta) {
      params = params.set('fecha_hasta', fechaHasta.toISOString());
    }
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', pageSize.toString());
    }

    return this.http.get<{
      notificaciones: Notificacion[];
      total: number;
      page: number;
      pageSize: number;
    }>(`${this.apiUrl}/usuario/${usuarioId}/historial`, { params });
  }

  /**
   * Intentar reconexión automática del WebSocket
   * Requirements: 8.4
   */
  private intentarReconexion(usuarioId: string, token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Intentando reconectar WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.conectarWebSocket(usuarioId, token);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Máximo de intentos de reconexión alcanzado');
    }
  }

  /**
   * Reproducir sonido para notificaciones urgentes
   * Requirements: 8.6
   */
  private reproducirSonido(notificacion: Notificacion): void {
    if (
      notificacion.prioridad === 'URGENTE' ||
      notificacion.tipo === 'DOCUMENTO_URGENTE'
    ) {
      // Reproducir sonido de notificación
      const audio = new Audio('/assets/sounds/notification-urgent.mp3');
      audio.play().catch((error) => {
        console.log('No se pudo reproducir el sonido:', error);
      });
    }
  }

  /**
   * Mostrar notificación del navegador
   * Requirements: 8.6
   */
  mostrarNotificacionNavegador(notificacion: Notificacion): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: notificacion.id,
        requireInteraction: notificacion.prioridad === 'URGENTE'
      });
    }
  }

  /**
   * Solicitar permiso para notificaciones del navegador
   * Requirements: 8.6
   */
  async solicitarPermisoNotificaciones(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}
