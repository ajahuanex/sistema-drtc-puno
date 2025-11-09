import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificacionService } from './notificacion.service';
import {
  Notificacion,
  NotificacionCreate,
  PreferenciasNotificacion,
  TipoNotificacion,
  EventoNotificacion,
  PrioridadNotificacion
} from '../../models/mesa-partes/notificacion.model';

describe('NotificacionService', () => {
  let service: NotificacionService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8000/api/v1/notificaciones';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificacionService]
    });
    service = TestBed.inject(NotificacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Limpiar WebSocket si existe
    service.desconectarWebSocket();
  });

  describe('obtenerNotificaciones', () => {
    it('debe obtener notificaciones sin filtros', () => {
      const mockResponse = {
        notificaciones: [],
        total: 0,
        noLeidas: 0,
        page: 1,
        pageSize: 10
      };

      service.obtenerNotificaciones('user-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debe obtener notificaciones con todos los filtros', () => {
      const mockResponse = {
        notificaciones: [],
        total: 15,
        noLeidas: 5,
        page: 2,
        pageSize: 10
      };

      service.obtenerNotificaciones(
        'user-123',
        false,
        'DOCUMENTO_DERIVADO' as TipoNotificacion,
        2,
        10
      ).subscribe(response => {
        expect(response.total).toBe(15);
        expect(response.noLeidas).toBe(5);
      });

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/usuario/user-123` &&
          request.params.get('leida') === 'false' &&
          request.params.get('tipo') === 'DOCUMENTO_DERIVADO' &&
          request.params.get('page') === '2' &&
          request.params.get('page_size') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('marcarComoLeida', () => {
    it('debe marcar una notificación como leída', () => {
      const mockNotificacion: Notificacion = {
        id: 'not-123',
        leida: true,
        fechaLeida: new Date()
      } as Notificacion;

      service.marcarComoLeida('not-123').subscribe(notificacion => {
        expect(notificacion.leida).toBe(true);
        expect(notificacion.fechaLeida).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/not-123/leer`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockNotificacion);
    });
  });

  describe('marcarTodasComoLeidas', () => {
    it('debe marcar todas las notificaciones como leídas', () => {
      const mockResponse = {
        actualizadas: 10
      };

      service.marcarTodasComoLeidas('user-123').subscribe(response => {
        expect(response.actualizadas).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/leer-todas`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('eliminarNotificacion', () => {
    it('debe eliminar una notificación', () => {
      service.eliminarNotificacion('not-123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/not-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('obtenerContadorNoLeidas', () => {
    it('debe obtener el contador de notificaciones no leídas', () => {
      const mockResponse = {
        total: 15,
        porTipo: {
          'DOCUMENTO_DERIVADO': 5,
          'DOCUMENTO_URGENTE': 3,
          'DOCUMENTO_PROXIMO_VENCER': 7
        } as Record<TipoNotificacion, number>
      };

      service.obtenerContadorNoLeidas('user-123').subscribe(response => {
        expect(response.total).toBe(15);
        expect(response.porTipo['DOCUMENTO_DERIVADO']).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/contador`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('suscribirseAEventos', () => {
    it('debe suscribirse a eventos específicos', () => {
      const eventos: TipoNotificacion[] = [
        'DOCUMENTO_DERIVADO' as TipoNotificacion,
        'DOCUMENTO_URGENTE' as TipoNotificacion
      ];

      service.suscribirseAEventos('user-123', eventos).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/suscribir`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ eventos });
      req.flush(null);
    });
  });

  describe('desuscribirseDeEventos', () => {
    it('debe desuscribirse de eventos', () => {
      const eventos: TipoNotificacion[] = [
        'DOCUMENTO_DERIVADO' as TipoNotificacion
      ];

      service.desuscribirseDeEventos('user-123', eventos).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/desuscribir`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ eventos });
      req.flush(null);
    });
  });

  describe('obtenerPreferencias', () => {
    it('debe obtener las preferencias de notificación', () => {
      const mockPreferencias: PreferenciasNotificacion = {
        notificacionesEmail: true,
        notificacionesSistema: true,
        notificacionesNavegador: false,
        sonidoUrgente: true,
        eventosActivos: ['DOCUMENTO_DERIVADO' as TipoNotificacion]
      };

      service.obtenerPreferencias('user-123').subscribe(preferencias => {
        expect(preferencias.notificacionesEmail).toBe(true);
        expect(preferencias.sonidoUrgente).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/preferencias`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferencias);
    });
  });

  describe('actualizarPreferencias', () => {
    it('debe actualizar las preferencias de notificación', () => {
      const mockPreferenciasUpdate: Partial<PreferenciasNotificacion> = {
        notificacionesEmail: false,
        sonidoUrgente: false
      };

      const mockPreferencias: PreferenciasNotificacion = {
        notificacionesEmail: false,
        notificacionesSistema: true,
        notificacionesNavegador: false,
        sonidoUrgente: false,
        eventosActivos: []
      };

      service.actualizarPreferencias('user-123', mockPreferenciasUpdate)
        .subscribe(preferencias => {
          expect(preferencias.notificacionesEmail).toBe(false);
          expect(preferencias.sonidoUrgente).toBe(false);
        });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/preferencias`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPreferenciasUpdate);
      req.flush(mockPreferencias);
    });
  });

  describe('enviarNotificacion', () => {
    it('debe enviar una notificación manual', () => {
      const mockNotificacionCreate: NotificacionCreate = {
        usuarioId: 'user-123',
        tipo: 'DOCUMENTO_DERIVADO' as TipoNotificacion,
        titulo: 'Nuevo documento',
        mensaje: 'Se ha derivado un documento',
        prioridad: 'NORMAL' as PrioridadNotificacion
      };

      const mockNotificacion: Notificacion = {
        id: 'not-123',
        ...mockNotificacionCreate,
        leida: false,
        createdAt: new Date()
      } as Notificacion;

      service.enviarNotificacion(mockNotificacionCreate).subscribe(notificacion => {
        expect(notificacion.titulo).toBe('Nuevo documento');
        expect(notificacion.leida).toBe(false);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockNotificacionCreate);
      req.flush(mockNotificacion);
    });
  });

  describe('obtenerHistorial', () => {
    it('debe obtener el historial sin filtros', () => {
      const mockResponse = {
        notificaciones: [],
        total: 0,
        page: 1,
        pageSize: 10
      };

      service.obtenerHistorial('user-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/usuario/user-123/historial`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debe obtener el historial con filtros de fecha', () => {
      const mockResponse = {
        notificaciones: [],
        total: 50,
        page: 2,
        pageSize: 20
      };

      service.obtenerHistorial(
        'user-123',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        2,
        20
      ).subscribe(response => {
        expect(response.total).toBe(50);
      });

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/usuario/user-123/historial` &&
          request.params.has('fecha_desde') &&
          request.params.has('fecha_hasta') &&
          request.params.get('page') === '2' &&
          request.params.get('page_size') === '20';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('WebSocket', () => {
    it('debe tener observables para notificaciones y eventos', (done) => {
      expect(service.notificaciones$).toBeDefined();
      expect(service.eventos$).toBeDefined();
      expect(service.conexion$).toBeDefined();

      service.conexion$.subscribe(conectado => {
        expect(typeof conectado).toBe('boolean');
        done();
      });
    });

    it('debe desconectar WebSocket correctamente', () => {
      service.desconectarWebSocket();
      
      service.conexion$.subscribe(conectado => {
        expect(conectado).toBe(false);
      });
    });
  });

  describe('solicitarPermisoNotificaciones', () => {
    it('debe retornar false si el navegador no soporta notificaciones', async () => {
      // Simular navegador sin soporte
      const originalNotification = (window as any).Notification;
      delete (window as any).Notification;

      const resultado = await service.solicitarPermisoNotificaciones();
      expect(resultado).toBe(false);

      // Restaurar
      (window as any).Notification = originalNotification;
    });

    it('debe retornar true si ya tiene permiso', async () => {
      // Simular permiso ya otorgado
      if ('Notification' in window) {
        spyOnProperty(Notification, 'permission', 'get').and.returnValue('granted');
        
        const resultado = await service.solicitarPermisoNotificaciones();
        expect(resultado).toBe(true);
      }
    });
  });

  describe('Observables de conexión', () => {
    it('debe emitir estado de conexión inicial como false', (done) => {
      service.conexion$.subscribe(conectado => {
        expect(conectado).toBe(false);
        done();
      });
    });
  });
});
