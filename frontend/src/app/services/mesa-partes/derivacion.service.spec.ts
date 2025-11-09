import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DerivacionService } from './derivacion.service';
import {
  Derivacion,
  DerivacionCreate,
  DerivacionUpdate,
  DerivacionMultiple,
  HistorialDerivacion,
  EstadoDerivacion
} from '../../models/mesa-partes/derivacion.model';
import { Documento } from '../../models/mesa-partes/documento.model';

describe('DerivacionService', () => {
  let service: DerivacionService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8000/api/v1/derivaciones';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DerivacionService]
    });
    service = TestBed.inject(DerivacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('derivarDocumento', () => {
    it('debe derivar un documento correctamente', () => {
      const mockDerivacion: DerivacionCreate = {
        documentoId: 'doc-123',
        areaDestinoId: 'area-456',
        instrucciones: 'Revisar y responder',
        esUrgente: false
      };

      const mockResponse: Derivacion = {
        id: 'der-123',
        ...mockDerivacion,
        estado: 'PENDIENTE' as EstadoDerivacion,
        fechaDerivacion: new Date()
      } as Derivacion;

      service.derivarDocumento(mockDerivacion).subscribe(derivacion => {
        expect(derivacion).toEqual(mockResponse);
        expect(derivacion.estado).toBe('PENDIENTE');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDerivacion);
      req.flush(mockResponse);
    });
  });

  describe('derivarDocumentoMultiple', () => {
    it('debe derivar un documento a múltiples áreas', () => {
      const mockDerivacionMultiple: DerivacionMultiple = {
        documentoId: 'doc-123',
        areasDestinoIds: ['area-1', 'area-2', 'area-3'],
        instrucciones: 'Para conocimiento',
        esUrgente: false
      };

      const mockResponse: Derivacion[] = [
        { id: 'der-1', areaDestinoId: 'area-1' } as Derivacion,
        { id: 'der-2', areaDestinoId: 'area-2' } as Derivacion,
        { id: 'der-3', areaDestinoId: 'area-3' } as Derivacion
      ];

      service.derivarDocumentoMultiple(mockDerivacionMultiple).subscribe(derivaciones => {
        expect(derivaciones.length).toBe(3);
        expect(derivaciones[0].areaDestinoId).toBe('area-1');
      });

      const req = httpMock.expectOne(`${apiUrl}/multiple`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDerivacionMultiple);
      req.flush(mockResponse);
    });
  });

  describe('recibirDocumento', () => {
    it('debe marcar un documento como recibido', () => {
      const mockDerivacion: Derivacion = {
        id: 'der-123',
        estado: 'RECIBIDO' as EstadoDerivacion,
        fechaRecepcion: new Date()
      } as Derivacion;

      service.recibirDocumento('der-123').subscribe(derivacion => {
        expect(derivacion.estado).toBe('RECIBIDO');
        expect(derivacion.fechaRecepcion).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123/recibir`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockDerivacion);
    });
  });

  describe('obtenerHistorial', () => {
    it('debe obtener el historial completo de derivaciones', () => {
      const mockHistorial: HistorialDerivacion = {
        documentoId: 'doc-123',
        derivaciones: [
          { id: 'der-1', estado: 'ATENDIDO' as EstadoDerivacion } as Derivacion,
          { id: 'der-2', estado: 'RECIBIDO' as EstadoDerivacion } as Derivacion
        ],
        totalDerivaciones: 2,
        ubicacionActual: 'Área Legal'
      };

      service.obtenerHistorial('doc-123').subscribe(historial => {
        expect(historial.derivaciones.length).toBe(2);
        expect(historial.totalDerivaciones).toBe(2);
        expect(historial.ubicacionActual).toBe('Área Legal');
      });

      const req = httpMock.expectOne(`${apiUrl}/documento/doc-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHistorial);
    });
  });

  describe('obtenerDocumentosArea', () => {
    it('debe obtener documentos de un área sin filtros', () => {
      const mockResponse = {
        documentos: [],
        total: 0,
        page: 1,
        pageSize: 10
      };

      service.obtenerDocumentosArea('area-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/area/area-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debe obtener documentos de un área con filtros', () => {
      const mockResponse = {
        documentos: [],
        total: 15,
        page: 2,
        pageSize: 5
      };

      service.obtenerDocumentosArea('area-123', 'PENDIENTE' as EstadoDerivacion, 2, 5)
        .subscribe(response => {
          expect(response.total).toBe(15);
          expect(response.page).toBe(2);
        });

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/area/area-123` &&
          request.params.get('estado') === 'PENDIENTE' &&
          request.params.get('page') === '2' &&
          request.params.get('page_size') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('registrarAtencion', () => {
    it('debe registrar atención sin archivos', () => {
      const mockDerivacion: Derivacion = {
        id: 'der-123',
        estado: 'ATENDIDO' as EstadoDerivacion,
        observaciones: 'Atendido correctamente',
        fechaAtencion: new Date()
      } as Derivacion;

      service.registrarAtencion('der-123', 'Atendido correctamente').subscribe(derivacion => {
        expect(derivacion.estado).toBe('ATENDIDO');
        expect(derivacion.observaciones).toBe('Atendido correctamente');
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123/atender`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBeTruthy();
      req.flush(mockDerivacion);
    });

    it('debe registrar atención con archivos de respuesta', () => {
      const mockFiles = [
        new File(['contenido1'], 'respuesta1.pdf'),
        new File(['contenido2'], 'respuesta2.pdf')
      ];

      const mockDerivacion: Derivacion = {
        id: 'der-123',
        estado: 'ATENDIDO' as EstadoDerivacion
      } as Derivacion;

      service.registrarAtencion('der-123', 'Atendido', mockFiles).subscribe(derivacion => {
        expect(derivacion.estado).toBe('ATENDIDO');
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123/atender`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBeTruthy();
      req.flush(mockDerivacion);
    });
  });

  describe('actualizarDerivacion', () => {
    it('debe actualizar una derivación', () => {
      const mockUpdate: DerivacionUpdate = {
        instrucciones: 'Instrucciones actualizadas',
        esUrgente: true
      };

      const mockDerivacion: Derivacion = {
        id: 'der-123',
        instrucciones: 'Instrucciones actualizadas',
        esUrgente: true
      } as Derivacion;

      service.actualizarDerivacion('der-123', mockUpdate).subscribe(derivacion => {
        expect(derivacion.instrucciones).toBe('Instrucciones actualizadas');
        expect(derivacion.esUrgente).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdate);
      req.flush(mockDerivacion);
    });
  });

  describe('obtenerDerivacion', () => {
    it('debe obtener una derivación por ID', () => {
      const mockDerivacion: Derivacion = {
        id: 'der-123',
        documentoId: 'doc-123',
        estado: 'PENDIENTE' as EstadoDerivacion
      } as Derivacion;

      service.obtenerDerivacion('der-123').subscribe(derivacion => {
        expect(derivacion.id).toBe('der-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivacion);
    });
  });

  describe('obtenerDerivacionesPendientes', () => {
    it('debe obtener derivaciones pendientes de un área', () => {
      const mockDerivaciones: Derivacion[] = [
        { id: 'der-1', estado: 'PENDIENTE' as EstadoDerivacion } as Derivacion,
        { id: 'der-2', estado: 'PENDIENTE' as EstadoDerivacion } as Derivacion
      ];

      service.obtenerDerivacionesPendientes('area-123').subscribe(derivaciones => {
        expect(derivaciones.length).toBe(2);
        expect(derivaciones[0].estado).toBe('PENDIENTE');
      });

      const req = httpMock.expectOne(`${apiUrl}/area/area-123/pendientes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivaciones);
    });
  });

  describe('obtenerDerivacionesUrgentes', () => {
    it('debe obtener derivaciones urgentes de un área', () => {
      const mockDerivaciones: Derivacion[] = [
        { id: 'der-1', esUrgente: true } as Derivacion
      ];

      service.obtenerDerivacionesUrgentes('area-123').subscribe(derivaciones => {
        expect(derivaciones.length).toBe(1);
        expect(derivaciones[0].esUrgente).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/area/area-123/urgentes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivaciones);
    });
  });

  describe('obtenerDerivacionesProximasVencer', () => {
    it('debe obtener derivaciones próximas a vencer con días por defecto', () => {
      const mockDerivaciones: Derivacion[] = [];

      service.obtenerDerivacionesProximasVencer('area-123').subscribe(derivaciones => {
        expect(derivaciones).toEqual(mockDerivaciones);
      });

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/area/area-123/proximas-vencer` &&
          request.params.get('dias_anticipacion') === '3';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivaciones);
    });

    it('debe obtener derivaciones próximas a vencer con días personalizados', () => {
      const mockDerivaciones: Derivacion[] = [];

      service.obtenerDerivacionesProximasVencer('area-123', 5).subscribe();

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/area/area-123/proximas-vencer` &&
          request.params.get('dias_anticipacion') === '5';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivaciones);
    });
  });

  describe('obtenerDerivacionesVencidas', () => {
    it('debe obtener derivaciones vencidas de un área', () => {
      const mockDerivaciones: Derivacion[] = [
        { id: 'der-1', fechaLimite: new Date('2024-01-01') } as Derivacion
      ];

      service.obtenerDerivacionesVencidas('area-123').subscribe(derivaciones => {
        expect(derivaciones.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/area/area-123/vencidas`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDerivaciones);
    });
  });

  describe('cancelarDerivacion', () => {
    it('debe cancelar una derivación con motivo', () => {
      const mockDerivacion: Derivacion = {
        id: 'der-123',
        estado: 'CANCELADO' as EstadoDerivacion
      } as Derivacion;

      service.cancelarDerivacion('der-123', 'Error en derivación').subscribe(derivacion => {
        expect(derivacion.estado).toBe('CANCELADO');
      });

      const req = httpMock.expectOne(`${apiUrl}/der-123/cancelar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ motivo: 'Error en derivación' });
      req.flush(mockDerivacion);
    });
  });

  describe('reasignarDerivacion', () => {
    it('debe reasignar una derivación a otra área', () => {
      const mockDerivacion: Derivacion = {
        id: 'der-123',
        areaDestinoId: 'area-nueva'
      } as Derivacion;

      service.reasignarDerivacion('der-123', 'area-nueva', 'Reasignación necesaria')
        .subscribe(derivacion => {
          expect(derivacion.areaDestinoId).toBe('area-nueva');
        });

      const req = httpMock.expectOne(`${apiUrl}/der-123/reasignar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        nueva_area_id: 'area-nueva',
        instrucciones: 'Reasignación necesaria'
      });
      req.flush(mockDerivacion);
    });
  });
});
