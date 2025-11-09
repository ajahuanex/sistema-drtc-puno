import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentoService } from './documento.service';
import {
  Documento,
  DocumentoCreate,
  DocumentoUpdate,
  FiltrosDocumento,
  ArchivoAdjunto,
  EstadoDocumento,
  Prioridad
} from '../../models/mesa-partes/documento.model';

describe('DocumentoService', () => {
  let service: DocumentoService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8000/api/v1/documentos';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentoService]
    });
    service = TestBed.inject(DocumentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('crearDocumento', () => {
    it('debe crear un documento correctamente', () => {
      const mockDocumentoCreate: DocumentoCreate = {
        tipoDocumentoId: 'tipo-123',
        remitente: 'Juan Pérez',
        asunto: 'Solicitud de información',
        numeroFolios: 5,
        tieneAnexos: true,
        prioridad: 'NORMAL' as Prioridad
      };

      const mockDocumentoResponse: Documento = {
        id: 'doc-123',
        numeroExpediente: 'EXP-2025-0001',
        ...mockDocumentoCreate,
        estado: 'REGISTRADO' as EstadoDocumento,
        fechaRecepcion: new Date(),
        archivosAdjuntos: [],
        etiquetas: [],
        codigoQR: 'QR-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Documento;

      service.crearDocumento(mockDocumentoCreate).subscribe(documento => {
        expect(documento).toEqual(mockDocumentoResponse);
        expect(documento.numeroExpediente).toBe('EXP-2025-0001');
        expect(documento.estado).toBe('REGISTRADO');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDocumentoCreate);
      req.flush(mockDocumentoResponse);
    });
  });

  describe('obtenerDocumento', () => {
    it('debe obtener un documento por ID', () => {
      const mockDocumento: Documento = {
        id: 'doc-123',
        numeroExpediente: 'EXP-2025-0001',
        tipoDocumentoId: 'tipo-123',
        remitente: 'Juan Pérez',
        asunto: 'Solicitud',
        numeroFolios: 5,
        tieneAnexos: false,
        prioridad: 'NORMAL' as Prioridad,
        estado: 'REGISTRADO' as EstadoDocumento,
        fechaRecepcion: new Date(),
        archivosAdjuntos: [],
        etiquetas: [],
        codigoQR: 'QR-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Documento;

      service.obtenerDocumento('doc-123').subscribe(documento => {
        expect(documento).toEqual(mockDocumento);
        expect(documento.id).toBe('doc-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocumento);
    });
  });

  describe('listarDocumentos', () => {
    it('debe listar documentos sin filtros', () => {
      const mockResponse = {
        documentos: [],
        total: 0,
        page: 1,
        pageSize: 10
      };

      service.listarDocumentos().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debe listar documentos con filtros completos', () => {
      const filtros: FiltrosDocumento = {
        estado: 'REGISTRADO' as EstadoDocumento,
        tipoDocumentoId: 'tipo-123',
        prioridad: 'ALTA' as Prioridad,
        fechaDesde: new Date('2025-01-01'),
        fechaHasta: new Date('2025-12-31'),
        remitente: 'Juan',
        asunto: 'Solicitud',
        numeroExpediente: 'EXP-2025',
        areaActualId: 'area-123',
        page: 2,
        pageSize: 20
      };

      const mockResponse = {
        documentos: [],
        total: 50,
        page: 2,
        pageSize: 20
      };

      service.listarDocumentos(filtros).subscribe(response => {
        expect(response.total).toBe(50);
        expect(response.page).toBe(2);
      });

      const req = httpMock.expectOne(request => {
        return request.url === apiUrl &&
          request.params.has('estado') &&
          request.params.has('tipo_documento_id') &&
          request.params.has('prioridad') &&
          request.params.has('fecha_desde') &&
          request.params.has('fecha_hasta') &&
          request.params.has('remitente') &&
          request.params.has('asunto') &&
          request.params.has('numero_expediente') &&
          request.params.has('area_actual_id') &&
          request.params.has('page') &&
          request.params.has('page_size');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('actualizarDocumento', () => {
    it('debe actualizar un documento', () => {
      const documentoUpdate: DocumentoUpdate = {
        asunto: 'Asunto actualizado',
        prioridad: 'URGENTE' as Prioridad
      };

      const mockDocumento: Documento = {
        id: 'doc-123',
        numeroExpediente: 'EXP-2025-0001',
        asunto: 'Asunto actualizado',
        prioridad: 'URGENTE' as Prioridad
      } as Documento;

      service.actualizarDocumento('doc-123', documentoUpdate).subscribe(documento => {
        expect(documento.asunto).toBe('Asunto actualizado');
        expect(documento.prioridad).toBe('URGENTE');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(documentoUpdate);
      req.flush(mockDocumento);
    });
  });

  describe('archivarDocumento', () => {
    it('debe archivar un documento con clasificación', () => {
      const mockDocumento: Documento = {
        id: 'doc-123',
        estado: 'ARCHIVADO' as EstadoDocumento
      } as Documento;

      service.archivarDocumento('doc-123', 'ADMINISTRATIVO').subscribe(documento => {
        expect(documento.estado).toBe('ARCHIVADO');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123/archivar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ clasificacion: 'ADMINISTRATIVO' });
      req.flush(mockDocumento);
    });
  });

  describe('adjuntarArchivo', () => {
    it('debe adjuntar un archivo a un documento', () => {
      const mockFile = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      const mockArchivo: ArchivoAdjunto = {
        id: 'archivo-123',
        nombreArchivo: 'documento.pdf',
        tipoMime: 'application/pdf',
        tamano: 1024,
        url: 'http://example.com/archivo.pdf',
        fechaSubida: new Date()
      };

      service.adjuntarArchivo('doc-123', mockFile).subscribe(archivo => {
        expect(archivo).toEqual(mockArchivo);
        expect(archivo.nombreArchivo).toBe('documento.pdf');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123/archivos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      req.flush(mockArchivo);
    });
  });

  describe('generarComprobante', () => {
    it('debe generar un comprobante en PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.generarComprobante('doc-123').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123/comprobante`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('buscarPorQR', () => {
    it('debe buscar un documento por código QR', () => {
      const mockDocumento: Documento = {
        id: 'doc-123',
        codigoQR: 'QR-123'
      } as Documento;

      service.buscarPorQR('QR-123').subscribe(documento => {
        expect(documento.codigoQR).toBe('QR-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/qr/QR-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocumento);
    });
  });

  describe('obtenerTiposDocumento', () => {
    it('debe obtener la lista de tipos de documento', () => {
      const mockTipos = [
        { id: 'tipo-1', nombre: 'Solicitud', codigo: 'SOL' },
        { id: 'tipo-2', nombre: 'Oficio', codigo: 'OFI' }
      ];

      service.obtenerTiposDocumento().subscribe(tipos => {
        expect(tipos.length).toBe(2);
        expect(tipos[0].nombre).toBe('Solicitud');
      });

      const req = httpMock.expectOne(`${apiUrl}/tipos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTipos);
    });
  });

  describe('eliminarDocumento', () => {
    it('debe eliminar un documento', () => {
      service.eliminarDocumento('doc-123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/doc-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('restaurarDocumento', () => {
    it('debe restaurar un documento archivado', () => {
      const mockDocumento: Documento = {
        id: 'doc-123',
        estado: 'REGISTRADO' as EstadoDocumento
      } as Documento;

      service.restaurarDocumento('doc-123').subscribe(documento => {
        expect(documento.estado).toBe('REGISTRADO');
      });

      const req = httpMock.expectOne(`${apiUrl}/doc-123/restaurar`);
      expect(req.request.method).toBe('POST');
      req.flush(mockDocumento);
    });
  });

  describe('exportarExcel', () => {
    it('debe exportar documentos a Excel', () => {
      const mockBlob = new Blob(['Excel content'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      service.exportarExcel().subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${apiUrl}/exportar/excel`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('debe exportar documentos a Excel con filtros', () => {
      const filtros: FiltrosDocumento = {
        estado: 'REGISTRADO' as EstadoDocumento,
        fechaDesde: new Date('2025-01-01')
      };

      const mockBlob = new Blob(['Excel content']);

      service.exportarExcel(filtros).subscribe();

      const req = httpMock.expectOne(request => {
        return request.url === `${apiUrl}/exportar/excel` &&
          request.params.has('estado') &&
          request.params.has('fecha_desde');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });
  });

  describe('exportarPDF', () => {
    it('debe exportar documentos a PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.exportarPDF().subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${apiUrl}/exportar/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });
});
