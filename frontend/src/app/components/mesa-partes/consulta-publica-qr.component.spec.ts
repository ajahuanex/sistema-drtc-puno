import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConsultaPublicaQRComponent } from './consulta-publica-qr.component';
import { QRConsultaService } from '../../services/mesa-partes/qr-consulta.service';

describe('ConsultaPublicaQRComponent', () => {
  let component: ConsultaPublicaQRComponent;
  let fixture: ComponentFixture<ConsultaPublicaQRComponent>;
  let mockQRConsultaService: jasmine.SpyObj<QRConsultaService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockQRConsultaService = jasmine.createSpyObj('QRConsultaService', [
      'consultarPorQR',
      'consultarPorExpediente'
    ]);

    mockActivatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [ConsultaPublicaQRComponent],
      providers: [
        { provide: QRConsultaService, useValue: mockQRConsultaService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaPublicaQRComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should search by QR if qr param is present', () => {
      mockActivatedRoute.queryParams = of({ qr: 'QR123' });
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: new Date(),
          historial: []
        }
      };
      mockQRConsultaService.consultarPorQR.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.codigoQR).toBe('QR123');
      expect(component.searchMode).toBe('qr');
      expect(mockQRConsultaService.consultarPorQR).toHaveBeenCalledWith('QR123');
    });

    it('should search by expediente if expediente param is present', () => {
      mockActivatedRoute.queryParams = of({ expediente: 'EXP-2025-0001' });
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: new Date(),
          historial: []
        }
      };
      mockQRConsultaService.consultarPorExpediente.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.numeroExpediente).toBe('EXP-2025-0001');
      expect(component.searchMode).toBe('expediente');
      expect(mockQRConsultaService.consultarPorExpediente).toHaveBeenCalledWith('EXP-2025-0001');
    });
  });

  describe('buscarPorExpediente', () => {
    it('should show error if expediente is empty', () => {
      component.numeroExpediente = '';
      component.buscarPorExpediente();

      expect(component.mensajeError).toBe('Por favor ingrese un número de expediente');
      expect(mockQRConsultaService.consultarPorExpediente).not.toHaveBeenCalled();
    });

    it('should fetch document successfully', () => {
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: new Date(),
          historial: []
        }
      };
      mockQRConsultaService.consultarPorExpediente.and.returnValue(of(mockResponse));
      component.numeroExpediente = 'EXP-2025-0001';

      component.buscarPorExpediente();

      expect(component.cargando).toBe(false);
      expect(component.documento).toEqual(mockResponse.documento);
      expect(component.mensajeError).toBe('');
    });

    it('should handle document not found', () => {
      const mockResponse = {
        success: false,
        mensaje: 'Documento no encontrado'
      };
      mockQRConsultaService.consultarPorExpediente.and.returnValue(of(mockResponse));
      component.numeroExpediente = 'INVALID';

      component.buscarPorExpediente();

      expect(component.documento).toBeNull();
      expect(component.mensajeError).toBe('Documento no encontrado');
    });

    it('should handle error', () => {
      mockQRConsultaService.consultarPorExpediente.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.numeroExpediente = 'EXP-2025-0001';

      component.buscarPorExpediente();

      expect(component.cargando).toBe(false);
      expect(component.mensajeError).toContain('Error al consultar el documento');
    });
  });

  describe('buscarPorQR', () => {
    it('should show error if QR code is empty', () => {
      component.codigoQR = '';
      component.buscarPorQR();

      expect(component.mensajeError).toBe('Por favor ingrese un código QR');
      expect(mockQRConsultaService.consultarPorQR).not.toHaveBeenCalled();
    });

    it('should fetch document successfully', () => {
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: new Date(),
          historial: []
        }
      };
      mockQRConsultaService.consultarPorQR.and.returnValue(of(mockResponse));
      component.codigoQR = 'QR123';

      component.buscarPorQR();

      expect(component.documento).toEqual(mockResponse.documento);
      expect(component.mensajeError).toBe('');
    });
  });

  describe('nuevaBusqueda', () => {
    it('should reset all fields', () => {
      component.documento = {
        numero_expediente: 'EXP-2025-0001',
        tipo_documento: 'Solicitud',
        asunto: 'Test',
        estado: 'REGISTRADO',
        prioridad: 'NORMAL',
        fecha_recepcion: new Date(),
        historial: []
      };
      component.numeroExpediente = 'EXP-2025-0001';
      component.codigoQR = 'QR123';
      component.mensajeError = 'Error';

      component.nuevaBusqueda();

      expect(component.documento).toBeNull();
      expect(component.numeroExpediente).toBe('');
      expect(component.codigoQR).toBe('');
      expect(component.mensajeError).toBe('');
    });
  });

  describe('getEstadoLabel', () => {
    it('should return correct labels', () => {
      expect(component.getEstadoLabel('PENDIENTE')).toBe('Pendiente');
      expect(component.getEstadoLabel('RECIBIDO')).toBe('Recibido');
      expect(component.getEstadoLabel('ATENDIDO')).toBe('Atendido');
      expect(component.getEstadoLabel('EN_PROCESO')).toBe('En Proceso');
      expect(component.getEstadoLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
