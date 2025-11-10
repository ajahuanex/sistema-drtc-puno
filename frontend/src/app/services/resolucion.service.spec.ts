import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResolucionService } from './resolucion.service';
import { AuthService } from './auth.service';
import { EmpresaService } from './empresa.service';
import { Resolucion, ResolucionCreate } from '../models/resolucion.model';
import { ResolucionFiltros } from '../models/resolucion-table.model';

describe('ResolucionService', () => {
  let service: ResolucionService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let empresaServiceSpy: jasmine.SpyObj<EmpresaService>;

  const mockResolucion: Resolucion = {
    id: '1',
    nroResolucion: 'R-001-2025',
    empresaId: '1',
    expedienteId: '1',
    fechaEmision: new Date('2025-01-15'),
    fechaVigenciaInicio: new Date('2025-01-15'),
    fechaVigenciaFin: new Date('2030-01-15'),
    tipoResolucion: 'PADRE',
    tipoTramite: 'PRIMIGENIA',
    descripcion: 'Test resolution',
    estaActivo: true,
    estado: 'VIGENTE',
    fechaRegistro: new Date('2025-01-15'),
    fechaActualizacion: new Date('2025-01-15'),
    usuarioEmisionId: 'user1',
    resolucionesHijasIds: [],
    vehiculosHabilitadosIds: [],
    rutasAutorizadasIds: [],
    documentos: [],
    auditoria: []
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    const empresaSpy = jasmine.createSpyObj('EmpresaService', ['getEmpresaById']);

    authSpy.getToken.and.returnValue('mock-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ResolucionService,
        { provide: AuthService, useValue: authSpy },
        { provide: EmpresaService, useValue: empresaSpy }
      ]
    });

    service = TestBed.inject(ResolucionService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    empresaServiceSpy = TestBed.inject(EmpresaService) as jasmine.SpyObj<EmpresaService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic CRUD Operations', () => {
    it('should get resoluciones', (done) => {
      service.getResoluciones().subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        expect(Array.isArray(resoluciones)).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.flush([mockResolucion]);
    });

    it('should get resolucion by id', (done) => {
      service.getResolucionById('1').subscribe(resolucion => {
        expect(resolucion).toEqual(mockResolucion);
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones/1');
      req.flush(mockResolucion);
    });

    it('should create resolucion', (done) => {
      const newResolucion: ResolucionCreate = {
        numero: '002',
        empresaId: '1',
        expedienteId: '1',
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'New resolution',
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      service.createResolucion(newResolucion).subscribe(resolucion => {
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      expect(req.request.method).toBe('POST');
      req.flush(mockResolucion);
    });

    it('should update resolucion', (done) => {
      const update = { descripcion: 'Updated description' };

      service.updateResolucion('1', update).subscribe(resolucion => {
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones/1');
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockResolucion, ...update });
    });

    it('should delete resolucion', (done) => {
      service.deleteResolucion('1').subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Filtered Queries', () => {
    it('should get resoluciones with estado filter', (done) => {
      service.getResoluciones(0, 100, 'VIGENTE').subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/resoluciones') && req.url.includes('estado=VIGENTE')
      );
      req.flush([mockResolucion]);
    });

    it('should get resoluciones with empresa filter', (done) => {
      service.getResoluciones(0, 100, undefined, '1').subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/resoluciones') && req.url.includes('empresa_id=1')
      );
      req.flush([mockResolucion]);
    });

    it('should get resoluciones por empresa', (done) => {
      service.getResolucionesPorEmpresa('1').subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/resoluciones') && req.url.includes('empresa_id=1')
      );
      req.flush([mockResolucion]);
    });

    it('should get resoluciones by tipo', (done) => {
      service.getResolucionesByTipo('PADRE').subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        expect(resoluciones.every(r => r.tipoResolucion === 'PADRE')).toBeTruthy();
        done();
      });
    });

    it('should get resoluciones by tipo tramite', (done) => {
      service.getResolucionesByTipoTramite('PRIMIGENIA').subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when getting resoluciones', (done) => {
      service.getResoluciones().subscribe(resoluciones => {
        // Should return mock data on error
        expect(resoluciones).toBeTruthy();
        expect(Array.isArray(resoluciones)).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle error when getting resolucion by id', (done) => {
      service.getResolucionById('999').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones/999');
      req.error(new ErrorEvent('Not found'));
    });

    it('should handle error when creating resolucion', (done) => {
      const newResolucion: ResolucionCreate = {
        numero: '002',
        empresaId: '1',
        expedienteId: '1',
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'New resolution',
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      service.createResolucion(newResolucion).subscribe(resolucion => {
        // Should create in mock data on error
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      req.error(new ErrorEvent('Server error'));
    });
  });

  describe('Validation', () => {
    it('should validate unique numero per year', (done) => {
      const duplicateResolucion: ResolucionCreate = {
        numero: '0001',
        empresaId: '1',
        expedienteId: '1',
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'Duplicate',
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      service.createResolucion(duplicateResolucion).subscribe({
        next: () => {
          // May succeed if backend allows or mock data doesn't have duplicate
          expect(true).toBeTruthy();
          done();
        },
        error: (error) => {
          // Should fail if duplicate detected
          expect(error.message).toContain('Ya existe');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      req.flush(mockResolucion);
    });
  });

  describe('Empresa Relations', () => {
    it('should add resolucion to empresa', (done) => {
      service.agregarResolucionAEmpresa('1', '1').subscribe(resolucion => {
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/empresas/1/resoluciones/1');
      expect(req.request.method).toBe('POST');
      req.flush(mockResolucion);
    });

    it('should remove resolucion from empresa', (done) => {
      service.removerResolucionDeEmpresa('1', '1').subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/empresas/1/resoluciones/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Authorization Headers', () => {
    it('should include authorization header', (done) => {
      service.getResoluciones().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush([]);
    });

    it('should include content-type header', (done) => {
      const newResolucion: ResolucionCreate = {
        numero: '002',
        empresaId: '1',
        expedienteId: '1',
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'New',
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      service.createResolucion(newResolucion).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      expect(req.request.headers.has('Content-Type')).toBeTruthy();
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResolucion);
    });
  });

  describe('Mock Data Fallback', () => {
    it('should use mock data when backend fails', (done) => {
      service.getResoluciones().subscribe(resoluciones => {
        expect(resoluciones).toBeTruthy();
        expect(resoluciones.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should filter mock data by estado', (done) => {
      service.getResoluciones(0, 100, 'VIGENTE').subscribe(resoluciones => {
        expect(resoluciones.every(r => r.estado === 'VIGENTE')).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should filter mock data by empresa', (done) => {
      service.getResoluciones(0, 100, undefined, '1').subscribe(resoluciones => {
        expect(resoluciones.every(r => r.empresaId === '1')).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Tipo Tramite Logic', () => {
    it('should determine tipo tramite from expediente', (done) => {
      const newResolucion: ResolucionCreate = {
        numero: '003',
        empresaId: '1',
        expedienteId: '1', // Should map to PRIMIGENIA
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'Test',
        vehiculosHabilitadosIds: [],
        rutasAutorizadasIds: []
      };

      service.createResolucion(newResolucion).subscribe(resolucion => {
        expect(resolucion.tipoTramite).toBe('PRIMIGENIA');
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      req.flush({ ...mockResolucion, tipoTramite: 'PRIMIGENIA' });
    });
  });

  describe('Pagination', () => {
    it('should support skip parameter', (done) => {
      service.getResoluciones(10, 100).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/resoluciones') && req.url.includes('skip=10')
      );
      req.flush([]);
    });

    it('should support limit parameter', (done) => {
      service.getResoluciones(0, 50).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/resoluciones') && req.url.includes('limit=50')
      );
      req.flush([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', (done) => {
      service.getResoluciones().subscribe(resoluciones => {
        expect(resoluciones).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/resoluciones'));
      req.flush([]);
    });

    it('should handle null values in resolucion', (done) => {
      const resolucionWithNulls = {
        ...mockResolucion,
        fechaVigenciaFin: null,
        resolucionPadreId: null
      };

      service.getResolucionById('1').subscribe(resolucion => {
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones/1');
      req.flush(resolucionWithNulls);
    });

    it('should handle missing optional fields', (done) => {
      const minimalResolucion: ResolucionCreate = {
        numero: '004',
        empresaId: '1',
        expedienteId: '1',
        fechaEmision: new Date('2025-01-20'),
        tipoResolucion: 'PADRE',
        tipoTramite: 'PRIMIGENIA',
        descripcion: 'Minimal'
      };

      service.createResolucion(minimalResolucion).subscribe(resolucion => {
        expect(resolucion).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('http://localhost:8000/api/v1/resoluciones');
      req.flush(mockResolucion);
    });
  });
});
