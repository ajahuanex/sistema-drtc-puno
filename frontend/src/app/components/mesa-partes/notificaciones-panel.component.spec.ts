import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesPanelComponent } from './notificaciones-panel.component';
import { WebSocketService } from '../../services/mesa-partes/websocket.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('NotificacionesPanelComponent', () => {
  let component: NotificacionesPanelComponent;
  let fixture: ComponentFixture<NotificacionesPanelComponent>;
  let mockWsService: jasmine.SpyObj<WebSocketService>;
  let mockNotificacionService: jasmine.SpyObj<NotificacionService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockWsService = jasmine.createSpyObj('WebSocketService', ['getNotifications']);
    mockNotificacionService = jasmine.createSpyObj('NotificacionService', ['obtenerNotificaciones', 'marcarComoLeida']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    mockWsService.getNotifications.and.returnValue(of());
    mockNotificacionService.obtenerNotificaciones.and.returnValue(of([]));
    mockNotificacionService.marcarComoLeida.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [NotificacionesPanelComponent],
      providers: [
        { provide: WebSocketService, useValue: mockWsService },
        { provide: NotificacionService, useValue: mockNotificacionService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    expect(mockNotificacionService.obtenerNotificaciones).toHaveBeenCalled();
  });

  it('should filter notifications', () => {
    component.notificaciones = [
      { id: '1', leida: false } as any,
      { id: '2', leida: true } as any
    ];
    
    component.cambiarFiltro('no_leidas');
    
    expect(component.notificacionesFiltradas.length).toBe(1);
    expect(component.notificacionesFiltradas[0].id).toBe('1');
  });
});
