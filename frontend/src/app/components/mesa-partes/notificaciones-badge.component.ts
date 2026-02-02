import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService, WebSocketMessage } from '../../services/mesa-partes/websocket.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notificaciones-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-badge-container" (click)="togglePanel()">
      <i class="bi bi-bell-fill"></i>
      <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      <span class="connection-indicator" [class.connected]="isConnected" [class.reconnecting]="isReconnecting"></span>
    </div>
  `,
  styles: [`
    .notification-badge-container {
      position: relative;
      cursor: pointer;
      padding: 8px 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    
    .notification-badge-container:hover {
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    
    .notification-badge-container i {
      font-size: 20px;
      color: #333;
    }
    
    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: #dc3545;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    }
    
    .connection-indicator {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #6c757d;
      border: 2px solid white;
    }
    
    .connection-indicator.connected {
      background-color: #28a745;
    }
    
    .connection-indicator.reconnecting {
      background-color: #ffc107;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `]
})
export class NotificacionesBadgeComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  isConnected = false;
  isReconnecting = false;
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private wsService: WebSocketService,
    private notificacionService: NotificacionService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.wsService.getConnectionStatus().subscribe(status => {
        this.isConnected = status.connected;
        this.isReconnecting = status.reconnecting;
      })
    );
    
    // Subscribe to notifications
    this.subscriptions.push(
      this.wsService.getNotifications().subscribe(notification => {
        this.handleNewNotification(notification);
      })
    );
    
    // Load initial unread count
    this.loadUnreadCount();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  togglePanel(): void {
    // Emit event to toggle notification panel
    // This will be handled by parent component
    const event = new CustomEvent('toggle-notifications');
    window.dispatchEvent(event);
  }
  
  private handleNewNotification(notification: WebSocketMessage): void {
    this.unreadCount++;
    
    // Play sound for urgent notifications
    if (notification.priority === 'URGENTE') {
      this.playNotificationSound();
    }
    
    // Show browser notification if permitted
    this.showBrowserNotification(notification);
  }
  
  private async loadUnreadCount(): Promise<void> {
    try {
      // Get current user ID - this should come from auth service
      const usuarioId = 'current-user-id'; // TODO: Get from auth service
      const response = await this.notificacionService.obtenerNotificaciones(usuarioId, false).toPromise();
      this.unreadCount = response?.noLeidas || 0;
    } catch (error) {
      console.error('Error loading unread count::', error);
    }
  }
  
  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play sound:', err));
    } catch (error) {
      // console.log removed for production
    }
  }
  
  private showBrowserNotification(notification: WebSocketMessage): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Nueva notificación', {
        body: notification.message,
        icon: 'assets/icons/notification-icon.png',
        badge: 'assets/icons/badge-icon.png',
        tag: notification.data?.documento_id || 'notification'
      });
    }
  }
}
