import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QRConsultaService } from './qr-consulta.service';
import { environment } from '../../../environments/environment';

describe('QRConsultaService', () => {
  let service: QRConsultaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QRConsultaService]
    });
    service = TestBed.inject(QRConsultaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('consultarPorQR', () => {
    it('should fetch document by QR code', () => {
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: '2025-01-01T10:00:00',
          area_actual: 'Mesa de Partes',
          historial: []
        }
      };

      service.consultarPorQR('QR123').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.documento).toBeDefined();
        expect(response.documento?.numero_expediente).toBe('EXP-2025-0001');
        expect(response.documento?.fecha_recepcion).toBeInstanceOf(Date);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/public/qr/consultar/QR123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle document not found', () => {
      const mockResponse = {
        success: false,
        mensaje: 'Documento no encontrado'
      };

      service.consultarPorQR('INVALID').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.mensaje).toBe('Documento no encontrado');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/public/qr/consultar/INVALID`);
      req.flush(mockResponse);
    });
  });

  describe('consultarPorExpediente', () => {
    it('should fetch document by expediente number', () => {
      const mockResponse = {
        success: true,
        documento: {
          numero_expediente: 'EXP-2025-0001',
          tipo_documento: 'Solicitud',
          asunto: 'Test',
          estado: 'REGISTRADO',
          prioridad: 'NORMAL',
          fecha_recepcion: '2025-01-01T10:00:00',
          area_actual: 'Mesa de Partes',
          historial: [
            {
              area_origen: 'Mesa de Partes',
              area_destino: 'Área Legal',
              fecha_derivacion: '2025-01-02T10:00:00',
              estado: 'PENDIENTE'
            }
          ]
        }
      };

      service.consultarPorExpediente('EXP-2025-0001').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.documento).toBeDefined();
        expect(response.documento?.historial.length).toBe(1);
        expect(response.documento?.historial[0].fecha_derivacion).toBeInstanceOf(Date);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/public/qr/consultar-expediente/EXP-2025-0001`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
