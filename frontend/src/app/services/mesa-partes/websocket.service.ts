import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
  type: string;
  notification_type?: string;
  title?: string;
  message?: string;
  priority?: 'NORMAL' | 'ALTA' | 'URGENTE';
  timestamp?: string;
  data?: any;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  
  // Configuración de reconexión
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_INTERVAL = 3000; // 3 segundos
  private readonly PING_INTERVAL = 30000; // 30 segundos
  
  // Estado de conexión
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0
  });
  
  // Stream de mensajes
  private messages$ = new Subject<WebSocketMessage>();
  
  // Stream de notificaciones
  private notifications$ = new Subject<WebSocketMessage>();
  
  constructor() {}
  
  /**
   * Conectar al servidor WebSocket
   */
  connect(token: string, areaId?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // console.log removed for production
      return;
    }
    
    this.disconnect();
    
    // Construir URL con parámetros
    const wsUrl = this.buildWebSocketUrl(token, areaId);
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => this.onOpen();
      this.socket.onmessage = (event) => this.onMessage(event);
      this.socket.onerror = (error) => this.onError(error);
      this.socket.onclose = (event) => this.onClose(event);
      
    } catch (error) {
      console.error('Error creando WebSocket::', error);
      this.scheduleReconnect(token, areaId);
    }
  }
  
  /**
   * Desconectar del servidor WebSocket
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.updateConnectionStatus({
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0
    });
  }
  
  /**
   * Enviar mensaje al servidor
   */
  send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado. No se puede enviar mensaje.');
    }
  }
  
  /**
   * Suscribirse a un área específica
   */
  subscribeToArea(areaId: string): void {
    this.send({
      type: 'subscribe_area',
      area_id: areaId
    });
  }
  
  /**
   * Obtener observable de estado de conexión
   */
  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }
  
  /**
   * Obtener observable de mensajes
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }
  
  /**
   * Obtener observable de notificaciones
   */
  getNotifications(): Observable<WebSocketMessage> {
    return this.notifications$.asObservable();
  }
  
  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  
  // Métodos privados
  
  private buildWebSocketUrl(token: string, areaId?: string): string {
    const baseUrl = environment.apiUrl.replace('http', 'ws');
    let url = `${baseUrl}/api/v1/ws/notificaciones?token=${token}`;
    
    if (areaId) {
      url += `&area_id=${areaId}`;
    }
    
    return url;
  }
  
  private onOpen(): void {
    // console.log removed for production
    
    this.updateConnectionStatus({
      connected: true,
      reconnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0
    });
    
    // Iniciar ping periódico
    this.startPing();
  }
  
  private onMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Emitir mensaje a todos los suscriptores
      this.messages$.next(message);
      
      // Si es una notificación, emitir también al stream de notificaciones
      if (message.type === 'notification') {
        this.notifications$.next(message);
      }
      
      // Manejar tipos especiales de mensajes
      if (message.type === 'pong') {
        // Respuesta a ping - conexión activa
        console.debug('Pong recibido');
      }
      
    } catch (error) {
      console.error('Error parseando mensaje WebSocket::', error);
    }
  }
  
  private onError(error: Event): void {
    console.error('Error en WebSocket::', error);
  }
  
  private onClose(event: CloseEvent): void {
    // console.log removed for production
    
    this.clearTimers();
    
    const status = this.connectionStatus$.value;
    
    // Intentar reconectar si no fue un cierre intencional
    if (event.code !== 1000 && status.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.updateConnectionStatus({
        connected: false,
        reconnecting: true,
        reconnectAttempts: status.reconnectAttempts + 1
      });
      
      // Programar reconexión
      // Nota: necesitamos guardar token y areaId para reconectar
      // Por ahora, el componente debe manejar la reconexión
    } else {
      this.updateConnectionStatus({
        connected: false,
        reconnecting: false,
        reconnectAttempts: status.reconnectAttempts
      });
    }
  }
  
  private scheduleReconnect(token: string, areaId?: string): void {
    const status = this.connectionStatus$.value;
    
    if (status.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Máximo de intentos de reconexión alcanzado');
      this.updateConnectionStatus({
        connected: false,
        reconnecting: false,
        reconnectAttempts: status.reconnectAttempts
      });
      return;
    }
    
    this.updateConnectionStatus({
      connected: false,
      reconnecting: true,
      reconnectAttempts: status.reconnectAttempts + 1
    });
    
    const delay = this.RECONNECT_INTERVAL * Math.pow(1.5, status.reconnectAttempts);
    
    console.log(`Reconectando en ${delay}ms (intento ${status.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(token, areaId);
    }, delay);
  }
  
  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString()
        });
      }
    }, this.PING_INTERVAL);
  }
  
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  
  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatus$.value;
    this.connectionStatus$.next({
      ...currentStatus,
      ...status
    });
  }
}
