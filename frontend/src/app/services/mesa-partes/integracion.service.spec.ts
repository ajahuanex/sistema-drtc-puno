import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IntegracionService } from './integracion.service';
import {
  Integracion,
  IntegracionCreate,
  IntegracionUpdate,
  LogSincronizacion,
  ResultadoConexion,
  DocumentoExterno,
  EstadoSincronizacion,
  ConfiguracionWebhook,
  TipoIntegracion,
  TipoAutenticacion,
  EstadoConexion
} from '../../models/mesa-partes/integracion.model';

describe('IntegracionService', () => {
  let service: IntegracionService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8000/api/v1/integraciones';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IntegracionService]
    });
    service = TestBed.inject(IntegracionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('crearIntegracion', () => {
    it('debe crear una integración correctamente', () => {
      const mockIntegracionCreate: IntegracionCreate = {
        nombre: 'Mesa de Partes Externa',
        descripcion: 'Integración con entidad externa',
        tipo: 'API_REST' as TipoIntegracion,
        urlBase: 'https://api.externa.com',
        autenticacion: {
          tipo: 'API_KEY' as TipoAutenticacion,
          credenciales: 'api-key-123'
        },
        mapeosCampos: [],
        activa: true
      };

      const mockResponse: Integracion = {
        id: 'int-123',
        ...mockIntegracionCreate,
        estadoConexion: 'DESCONECTADO' as EstadoConexion,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Integracion;

      service.crearIntegracion(mockIntegracionCreate).subscribe(integracion => {
        expect(integracion).toEqual(mockResponse);
        expect(integracion.nombre).toBe('Mesa de Partes Externa');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockIntegracionCreate);
      req.flush(mockResponse);
    });
  });

  describe('obtenerIntegracion', () => {
    it('debe obtener una integración por ID', () => {
      const mockIntegracion: Integracion = {
        id: 'int-123',
        nombre: 'Mesa Externa',
        tipo: 'API_REST' as TipoIntegracion
      } as Integracion;

      service.obtenerIntegracion('int-123').subscribe(integracion => {
        expect(integracion.id).toBe('int-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockIntegracion);
    });
  });

  describe('listarIntegraciones', () => {
    it('debe listar todas las integraciones sin filtro', () => {
      const mockIntegraciones: Integracion[] = [
        { id: 'int-1', nombre: 'Int 1' } as Integracion,
        { id: 'int-2', nombre: 'Int 2' } as Integracion
      ];

      service.listarIntegraciones().subscribe(integraciones => {
        expect(integraciones.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockIntegraciones);
    });

    it('debe listar solo integraciones activas', () => {
      const mockIntegraciones: Integracion[] = [
        { id: 'int-1', activa: true } as Integracion
      ];

      service.listarIntegraciones(true).subscribe(integraciones => {
        expect(integraciones.length).toBe(1);
        expect(integraciones[0].activa).toBe(true);
      });

      const req = httpMock.expectOne(request => {
        return request.url === apiUrl &&
          request.params.get('activa') === 'true';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockIntegraciones);
    });
  });

  describe('actualizarIntegracion', () => {
    it('debe actualizar una integración', () => {
      const mockUpdate: IntegracionUpdate = {
        nombre: 'Nombre actualizado',
        activa: false
      };

      const mockIntegracion: Integracion = {
        id: 'int-123',
        nombre: 'Nombre actualizado',
        activa: false
      } as Integracion;

      service.actualizarIntegracion('int-123', mockUpdate).subscribe(integracion => {
        expect(integracion.nombre).toBe('Nombre actualizado');
        expect(integracion.activa).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdate);
      req.flush(mockIntegracion);
    });
  });

  describe('eliminarIntegracion', () => {
    it('debe eliminar una integración', () => {
      service.eliminarIntegracion('int-123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/int-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('probarConexion', () => {
    it('debe probar la conexión exitosamente', () => {
      const mockResultado: ResultadoConexion = {
        exitoso: true,
        mensaje: 'Conexión exitosa',
        tiempoRespuesta: 150
      };

      service.probarConexion('int-123').subscribe(resultado => {
        expect(resultado.exitoso).toBe(true);
        expect(resultado.mensaje).toBe('Conexión exitosa');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/probar`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResultado);
    });

    it('debe manejar error de conexión', () => {
      const mockResultado: ResultadoConexion = {
        exitoso: false,
        mensaje: 'Error de conexión',
        error: 'Timeout'
      };

      service.probarConexion('int-123').subscribe(resultado => {
        expect(resultado.exitoso).toBe(false);
        expect(resultado.error).toBe('Timeout');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/probar`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResultado);
    });
  });

  describe('enviarDocumento', () => {
    it('debe enviar un documento exitosamente', () => {
      const mockResponse = {
        exitoso: true,
        mensaje: 'Documento enviado',
        idExterno: 'ext-456'
      };

      service.enviarDocumento('int-123', 'doc-789').subscribe(response => {
        expect(response.exitoso).toBe(true);
        expect(response.idExterno).toBe('ext-456');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/enviar/doc-789`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('recibirDocumentoExterno', () => {
    it('debe recibir un documento externo', () => {
      const mockDocumentoExterno: DocumentoExterno = {
        numeroExpedienteExterno: 'EXT-2025-001',
        remitente: 'Entidad Externa',
        asunto: 'Documento externo',
        contenido: 'Contenido del documento'
      };

      const mockResponse = {
        exitoso: true,
        mensaje: 'Documento recibido',
        documentoId: 'doc-new'
      };

      service.recibirDocumentoExterno('int-123', mockDocumentoExterno).subscribe(response => {
        expect(response.exitoso).toBe(true);
        expect(response.documentoId).toBe('doc-new');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/recibir`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDocumentoExterno);
      req.flush(mockResponse);
    });
  });

  describe('obtenerLogSincronizacion', () => {
    it('debe obtener logs sin filtros', () => {
      const mockResponse = {
        logs: [],
        total: 0,
        page: 1,
        pageSize: 10
      };

      service.obtenerLogSincronizacion('int-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/log`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debe obtener logs con todos los filtros', () => {
      const mockResponse = {
        logs: [],
        total: 25,
        page: 2,
        pageSize: 10
      };

      service.obtenerLogSincronizacion(
        'int-123',
        'EXITOSO' as EstadoSincronizacion,
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        2,
        10
      ).subscribe(response => {
        expect(response.total).toBe(25);
      });

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/int-123/log` &&
          request.params.has('estado') &&
          request.params.has('fecha_desde') &&
          request.params.has('fecha_hasta') &&
          request.params.has('page') &&
          request.params.has('page_size');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('configurarWebhook', () => {
    it('debe configurar un webhook', () => {
      const mockConfig: ConfiguracionWebhook = {
        url: 'https://webhook.example.com',
        eventos: ['documento.creado', 'documento.derivado'],
        secreto: 'secret-123',
        activo: true
      };

      const mockIntegracion: Integracion = {
        id: 'int-123',
        configuracionWebhook: mockConfig
      } as Integracion;

      service.configurarWebhook('int-123', mockConfig).subscribe(integracion => {
        expect(integracion.configuracionWebhook).toEqual(mockConfig);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/webhook`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockConfig);
      req.flush(mockIntegracion);
    });
  });

  describe('probarWebhook', () => {
    it('debe probar un webhook exitosamente', () => {
      const mockConfig: ConfiguracionWebhook = {
        url: 'https://webhook.example.com',
        eventos: ['documento.creado'],
        secreto: 'secret-123',
        activo: true
      };

      const mockResultado: ResultadoConexion = {
        exitoso: true,
        mensaje: 'Webhook funciona correctamente'
      };

      service.probarWebhook('int-123', mockConfig).subscribe(resultado => {
        expect(resultado.exitoso).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/webhook/probar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockConfig);
      req.flush(mockResultado);
    });
  });

  describe('toggleIntegracion', () => {
    it('debe activar una integración', () => {
      const mockIntegracion: Integracion = {
        id: 'int-123',
        activa: true
      } as Integracion;

      service.toggleIntegracion('int-123', true).subscribe(integracion => {
        expect(integracion.activa).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/toggle`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ activa: true });
      req.flush(mockIntegracion);
    });
  });

  describe('sincronizarEstado', () => {
    it('debe sincronizar el estado de un documento', () => {
      const mockResponse = {
        exitoso: true,
        mensaje: 'Estado sincronizado',
        estadoExterno: 'ATENDIDO'
      };

      service.sincronizarEstado('int-123', 'doc-456').subscribe(response => {
        expect(response.exitoso).toBe(true);
        expect(response.estadoExterno).toBe('ATENDIDO');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/sincronizar/doc-456`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe obtener estadísticas de una integración', () => {
      const mockEstadisticas = {
        totalEnviados: 100,
        totalRecibidos: 50,
        exitosos: 140,
        fallidos: 10,
        pendientes: 5,
        ultimaSincronizacion: new Date()
      };

      service.obtenerEstadisticas('int-123').subscribe(estadisticas => {
        expect(estadisticas.totalEnviados).toBe(100);
        expect(estadisticas.totalRecibidos).toBe(50);
        expect(estadisticas.exitosos).toBe(140);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/estadisticas`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEstadisticas);
    });
  });

  describe('reintentarSincronizacion', () => {
    it('debe reintentar una sincronización fallida', () => {
      const mockResponse = {
        exitoso: true,
        mensaje: 'Sincronización exitosa'
      };

      service.reintentarSincronizacion('log-123').subscribe(response => {
        expect(response.exitoso).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/log/log-123/reintentar`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('validarMapeo', () => {
    it('debe validar el mapeo de campos correctamente', () => {
      const mockDocumento = {
        remitente: 'Juan Pérez',
        asunto: 'Test'
      };

      const mockResponse = {
        valido: true,
        errores: [],
        advertencias: []
      };

      service.validarMapeo('int-123', mockDocumento).subscribe(response => {
        expect(response.valido).toBe(true);
        expect(response.errores.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/validar-mapeo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ documento: mockDocumento });
      req.flush(mockResponse);
    });

    it('debe detectar errores en el mapeo', () => {
      const mockDocumento = { campo: 'valor' };

      const mockResponse = {
        valido: false,
        errores: ['Campo remitente es obligatorio'],
        advertencias: ['Campo fecha no mapeado']
      };

      service.validarMapeo('int-123', mockDocumento).subscribe(response => {
        expect(response.valido).toBe(false);
        expect(response.errores.length).toBe(1);
        expect(response.advertencias.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/validar-mapeo`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('obtenerEventosDisponibles', () => {
    it('debe obtener la lista de eventos disponibles para webhooks', () => {
      const mockEventos = [
        { evento: 'documento.creado', descripcion: 'Cuando se crea un documento' },
        { evento: 'documento.derivado', descripcion: 'Cuando se deriva un documento' }
      ];

      service.obtenerEventosDisponibles().subscribe(eventos => {
        expect(eventos.length).toBe(2);
        expect(eventos[0].evento).toBe('documento.creado');
      });

      const req = httpMock.expectOne(`${apiUrl}/eventos-webhook`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEventos);
    });
  });

  describe('regenerarSecretoWebhook', () => {
    it('debe regenerar el secreto de un webhook', () => {
      const mockResponse = {
        secreto: 'new-secret-456'
      };

      service.regenerarSecretoWebhook('int-123').subscribe(response => {
        expect(response.secreto).toBe('new-secret-456');
      });

      const req = httpMock.expectOne(`${apiUrl}/int-123/webhook/regenerar-secreto`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
