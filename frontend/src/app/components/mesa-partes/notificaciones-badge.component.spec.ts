import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesBadgeComponent } from './notificaciones-badge.component';
import { WebSocketService } from '../../services/mesa-partes/websocket.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { of } from 'rxjs';

describe('NotificacionesBadgeComponent', () => {
  let component: NotificacionesBadgeComponent;
  let fixture: ComponentFixture<NotificacionesBadgeComponent>;
  let mockWsService: jasmine.SpyObj<WebSocketService>;
  let mockNotificacionService: jasmine.SpyObj<NotificacionService>;

  beforeEach(async () => {
    mockWsService = jasmine.createSpyObj('WebSocketService', ['getConnectionStatus', 'getNotifications']);
    mockNotificacionService = jasmine.createSpyObj('NotificacionService', ['obtenerNotificaciones']);
    
    mockWsService.getConnectionStatus.and.returnValue(of({ connected: false, reconnecting: false, reconnectAttempts: 0 }));
    mockWsService.getNotifications.and.returnValue(of());
    mockNotificacionService.obtenerNotificaciones.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [NotificacionesBadgeComponent],
      providers: [
        { provide: WebSocketService, useValue: mockWsService },
        { provide: NotificacionService, useValue: mockNotificacionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display unread count', () => {
    component.unreadCount = 5;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toContain('5');
  });

  it('should show connection status', () => {
    component.isConnected = true;
    fixture.detectChanges();
    
    const indicator = fixture.nativeElement.querySelector('.connection-indicator');
    expect(indicator.classList.contains('connected')).toBeTruthy();
  });
});
