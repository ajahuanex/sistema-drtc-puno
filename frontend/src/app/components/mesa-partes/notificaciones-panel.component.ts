import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService, WebSocketMessage } from '../../services/mesa-partes/websocket.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { Notificacion, TipoNotificacion, PrioridadNotificacion } from '../../models/mesa-partes/notificacion.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notificaciones-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-panel" [class.open]="isOpen">
      <div class="panel-header">
        <h5>Notificaciones</h5>
        <div class="header-actions">
          <button class="btn-icon" (click)="markAllAsRead()" *ngIf="notificaciones.length > 0" title="Marcar todas como leídas">
            <i class="bi bi-check-all"></i>
          </button>
          <button class="btn-icon" (click)="close()" title="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="panel-body">
        <div class="notification-filters">
          <button 
            class="filter-btn" 
            [class.active]="filtroActual === 'todas'"
            (click)="cambiarFiltro('todas')">
            Todas
          </button>
          <button 
            class="filter-btn" 
            [class.active]="filtroActual === 'no_leidas'"
            (click)="cambiarFiltro('no_leidas')">
            No leídas ({{ unreadCount }})
          </button>
        </div>
        
        <div class="notifications-list" *ngIf="notificacionesFiltradas.length > 0">
          <div 
            class="notification-item" 
            *ngFor="let notif of notificacionesFiltradas"
            [class.unread]="!notif.leida"
            [class.urgent]="notif.prioridad === 'URGENTE'"
            (click)="handleNotificationClick(notif)">
            
            <div class="notification-icon" [ngClass]="getIconClass(notif.tipo)">
              <i [class]="getIcon(notif.tipo)"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">{{ notif.titulo }}</div>
              <div class="notification-message">{{ notif.mensaje }}</div>
              <div class="notification-time">{{ formatTime(notif.fechaCreacion) }}</div>
            </div>
            
            <div class="notification-actions">
              <button 
                class="btn-icon-small" 
                (click)="markAsRead(notif, $event)"
                *ngIf="!notif.leida"
                title="Marcar como leída">
                <i class="bi bi-check"></i>
              </button>
              <button 
                class="btn-icon-small" 
                (click)="deleteNotification(notif, $event)"
                title="Eliminar">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="notificacionesFiltradas.length === 0">
          <i class="bi bi-bell-slash"></i>
          <p>No hay notificaciones</p>
        </div>
      </div>
      
      <div class="panel-footer" *ngIf="notificaciones.length > 0">
        <button class="btn-link" (click)="verTodasNotificaciones()">
          Ver todas las notificaciones
        </button>
      </div>
    </div>
    
    <div class="panel-overlay" *ngIf="isOpen" (click)="close()"></div>
  `,
  styles: [`
    .notification-panel {
      position: fixed;
      top: 60px;
      right: -400px;
      width: 400px;
      height: calc(100vh - 60px);
      background: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      transition: right 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    
    .notification-panel.open {
      right: 0;
    }
    
    .panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999;
    }
    
    .panel-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-header h5 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      background: none;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      color: #666;
      transition: color 0.2s;
    }
    
    .btn-icon:hover {
      color: #333;
    }
    
    .panel-body {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    
    .notification-filters {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .filter-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    
    .filter-btn:hover {
      background: #f5f5f5;
    }
    
    .filter-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    .notifications-list {
      flex: 1;
    }
    
    .notification-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .notification-item:hover {
      background-color: #f8f9fa;
    }
    
    .notification-item.unread {
      background-color: #e7f3ff;
    }
    
    .notification-item.urgent {
      border-left: 3px solid #dc3545;
    }
    
    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .notification-icon.derivado {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .notification-icon.recibido {
      background-color: #e8f5e9;
      color: #388e3c;
    }
    
    .notification-icon.urgente {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .notification-icon.vencer {
      background-color: #fff3e0;
      color: #f57c00;
    }
    
    .notification-icon.atendido {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
    }
    
    .notification-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: #333;
    }
    
    .notification-message {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .notification-time {
      font-size: 11px;
      color: #999;
    }
    
    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .btn-icon-small {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }
    
    .btn-icon-small:hover {
      color: #333;
    }
    
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      padding: 40px 20px;
    }
    
    .empty-state i {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .panel-footer {
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }
    
    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
    }
    
    .btn-link:hover {
      text-decoration: underline;
    }
  `]
})
export class NotificacionesPanelComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  
  notificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  filtroActual: 'todas' | 'no_leidas' = 'todas';
  unreadCount = 0;
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private wsService: WebSocketService,
    private notificacionService: NotificacionService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Load notifications
    this.loadNotifications();
    
    // Subscribe to new notifications via WebSocket
    this.subscriptions.push(
      this.wsService.getNotifications().subscribe(notification => {
        this.handleNewNotification(notification);
      })
    );
    
    // Listen for toggle event
    window.addEventListener('toggle-notifications', () => {
      this.isOpen = !this.isOpen;
    });
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
  
  cambiarFiltro(filtro: 'todas' | 'no_leidas'): void {
    this.filtroActual = filtro;
    this.aplicarFiltro();
  }
  
  async loadNotifications(): Promise<void> {
    try {
      // Get current user ID - this should come from auth service
      const usuarioId = 'current-user-id'; // TODO: Get from auth service
      const response = await this.notificacionService.obtenerNotificaciones(usuarioId).toPromise();
      this.notificaciones = response?.notificaciones || [];
      this.aplicarFiltro();
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
  
  async markAsRead(notif: Notificacion, event: Event): Promise<void> {
    event.stopPropagation();
    
    try {
      await this.notificacionService.marcarComoLeida(notif.id).toPromise();
      notif.leida = true;
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  async markAllAsRead(): Promise<void> {
    try {
      const promises = this.notificaciones
        .filter(n => !n.leida)
        .map(n => this.notificacionService.marcarComoLeida(n.id).toPromise());
      
      await Promise.all(promises);
      
      this.notificaciones.forEach(n => n.leida = true);
      this.updateUnreadCount();
      this.aplicarFiltro();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
  
  async deleteNotification(notif: Notificacion, event: Event): Promise<void> {
    event.stopPropagation();
    
    try {
      // TODO: Implement delete endpoint
      this.notificaciones = this.notificaciones.filter(n => n.id !== notif.id);
      this.aplicarFiltro();
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
  
  handleNotificationClick(notif: Notificacion): void {
    // Mark as read
    if (!notif.leida) {
      this.markAsRead(notif, new Event('click'));
    }
    
    // Navigate to document if available
    if (notif.documentoId) {
      this.router.navigate(['/mesa-partes/documentos', notif.documentoId]);
      this.close();
    }
  }
  
  verTodasNotificaciones(): void {
    this.router.navigate(['/mesa-partes/notificaciones']);
    this.close();
  }
  
  getIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'documento_derivado': 'bi bi-arrow-right-circle-fill',
      'documento_recibido': 'bi bi-inbox-fill',
      'documento_urgente': 'bi bi-exclamation-triangle-fill',
      'documento_proximo_vencer': 'bi bi-clock-fill',
      'documento_atendido': 'bi bi-check-circle-fill'
    };
    return icons[tipo] || 'bi bi-bell-fill';
  }
  
  getIconClass(tipo: string): string {
    const classes: { [key: string]: string } = {
      'documento_derivado': 'derivado',
      'documento_recibido': 'recibido',
      'documento_urgente': 'urgente',
      'documento_proximo_vencer': 'vencer',
      'documento_atendido': 'atendido'
    };
    return classes[tipo] || '';
  }
  
  formatTime(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    
    return date.toLocaleDateString();
  }
  
  private handleNewNotification(notification: WebSocketMessage): void {
    // Convert WebSocket message to Notificacion
    const newNotif: Notificacion = {
      id: Date.now().toString(),
      usuarioId: '',
      tipo: this.mapNotificationType(notification.notification_type || 'SISTEMA'),
      titulo: notification.title || '',
      mensaje: notification.message || '',
      leida: false,
      prioridad: this.mapPriority(notification.priority || 'NORMAL'),
      documentoId: notification.data?.documento_id,
      fechaCreacion: new Date(notification.timestamp || Date.now())
    };
    
    this.notificaciones.unshift(newNotif);
    this.aplicarFiltro();
    this.updateUnreadCount();
  }
  
  private mapNotificationType(type: string): TipoNotificacion {
    const typeMap: { [key: string]: TipoNotificacion } = {
      'documento_derivado': TipoNotificacion.DOCUMENTO_DERIVADO,
      'documento_recibido': TipoNotificacion.DOCUMENTO_RECIBIDO,
      'documento_urgente': TipoNotificacion.DOCUMENTO_URGENTE,
      'documento_proximo_vencer': TipoNotificacion.DOCUMENTO_PROXIMO_VENCER,
      'documento_atendido': TipoNotificacion.DOCUMENTO_ATENDIDO
    };
    return typeMap[type] || TipoNotificacion.SISTEMA;
  }
  
  private mapPriority(priority: string): PrioridadNotificacion {
    const priorityMap: { [key: string]: PrioridadNotificacion } = {
      'NORMAL': PrioridadNotificacion.MEDIA,
      'ALTA': PrioridadNotificacion.ALTA,
      'URGENTE': PrioridadNotificacion.URGENTE
    };
    return priorityMap[priority] || PrioridadNotificacion.MEDIA;
  }
  
  private aplicarFiltro(): void {
    if (this.filtroActual === 'no_leidas') {
      this.notificacionesFiltradas = this.notificaciones.filter(n => !n.leida);
    } else {
      this.notificacionesFiltradas = [...this.notificaciones];
    }
  }
  
  private updateUnreadCount(): void {
    this.unreadCount = this.notificaciones.filter(n => !n.leida).length;
  }
}
