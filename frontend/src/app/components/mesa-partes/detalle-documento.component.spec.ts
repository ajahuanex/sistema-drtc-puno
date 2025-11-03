import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DetalleDocumentoComponent } from './detalle-documento.component';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { DerivacionService } from '../../services/mesa-partes/derivacion.service';
import { 
  Documento, 
  EstadoDocumento, 
  PrioridadDocumento 
} from '../../models/mesa-partes/documento.model';
import { 
  HistorialDerivacion, 
  EstadoDerivacion 
} from '../../models/mesa-partes/derivacion.model';

describe('DetalleDocumentoComponent', () => {
  let component: DetalleDocumentoComponent;
  let fixture: ComponentFixture<DetalleDocumentoComponent>;
  let documentoService: jasmine.SpyObj<DocumentoService>;
  let derivacionService: jasmine.SpyObj<DerivacionService>;

  const mockDocumento: Documento = {
    id: '123',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumento: {
      id: 'tipo1',
      nombre: 'Solicitud',
      codigo: 'SOL',
      categorias: []
    },
    numeroDocumentoExterno: 'EXT-001',
    remitente: 'Juan Pérez',
    asunto: 'Solicitud de información',
    numeroFolios: 5,
    tieneAnexos: true,
    prioridad: PrioridadDocumento.ALTA,
    estado: EstadoDocumento.EN_PROCESO,
    fechaRecepcion: new Date('2025-01-15'),
    fechaLimite: new Date('2025-02-15'),
    usuarioRegistro: {
      id: 'user1',
      nombres: 'María',
      apellidos: 'García'
    },
    areaActual: {
      id: 'area1',
      nombre: 'Área Legal'
    },
    archivosAdjuntos: [
      {
        id: 'file1',
        nombreArchivo: 'documento.pdf',
        tipoMime: 'application/pdf',
        tamano: 1024000,
        url: 'http://example.com/file1.pdf',
        fechaSubida: new Date('2025-01-15')
      }
    ],
    etiquetas: ['urgente', 'legal'],
    codigoQR: 'QR123',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  };

  const mockHistorial: HistorialDerivacion = {
    documentoId: '123',
    estadoActual: EstadoDerivacion.RECIBIDO,
    areaActual: {
      id: 'area1',
      nombre: 'Área Legal'
    },
    totalDerivaciones: 2,
    derivaciones: [
      {
        id: 'der1',
        documentoId: '123',
        areaOrigen: { id: 'area0', nombre: 'Mesa de Partes' },
        areaDestino: { id: 'area1', nombre: 'Área Legal' },
        usuarioDeriva: {
          id: 'user1',
          nombres: 'María',
          apellidos: 'García'
        },
        instrucciones: 'Revisar y responder',
        fechaDerivacion: new Date('2025-01-15T10:00:00'),
        fechaRecepcion: new Date('2025-01-15T11:00:00'),
        estado: EstadoDerivacion.RECIBIDO,
        esUrgente: false
      },
      {
        id: 'der2',
        documentoId: '123',
        areaOrigen: { id: 'area1', nombre: 'Área Legal' },
        areaDestino: { id: 'area2', nombre: 'Gerencia' },
        usuarioDeriva: {
          id: 'user2',
          nombres: 'Carlos',
          apellidos: 'López'
        },
        instrucciones: 'Para aprobación',
        fechaDerivacion: new Date('2025-01-16T14:00:00'),
        estado: EstadoDerivacion.PENDIENTE,
        esUrgente: true
      }
    ]
  };

  beforeEach(async () => {
    const documentoServiceSpy = jasmine.createSpyObj('DocumentoService', [
      'obtenerDocumento',
      'descargarComprobante'
    ]);
    const derivacionServiceSpy = jasmine.createSpyObj('DerivacionService', [
      'obtenerHistorial'
    ]);

    await TestBed.configureTestingModule({
      imports: [DetalleDocumentoComponent, HttpClientTestingModule],
      providers: [
        { provide: DocumentoService, useValue: documentoServiceSpy },
        { provide: DerivacionService, useValue: derivacionServiceSpy }
      ]
    }).compileComponents();

    documentoService = TestBed.inject(DocumentoService) as jasmine.SpyObj<DocumentoService>;
    derivacionService = TestBed.inject(DerivacionService) as jasmine.SpyObj<DerivacionService>;

    fixture = TestBed.createComponent(DetalleDocumentoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load document on init when documentoId is provided', () => {
      documentoService.obtenerDocumento.and.returnValue(of(mockDocumento));
      derivacionService.obtenerHistorial.and.returnValue(of(mockHistorial));

      component.documentoId = '123';
      component.ngOnInit();

      expect(documentoService.obtenerDocumento).toHaveBeenCalledWith('123');
      expect(component.documento).toEqual(mockDocumento);
    });

    it('should load historial on init', () => {
      documentoService.obtenerDocumento.and.returnValue(of(mockDocumento));
      derivacionService.obtenerHistorial.and.returnValue(of(mockHistorial));

      component.documentoId = '123';
      component.ngOnInit();

      expect(derivacionService.obtenerHistorial).toHaveBeenCalledWith('123');
      expect(component.historial).toEqual(mockHistorial);
    });

    it('should handle error when loading document', () => {
      const error = new Error('Network error');
      documentoService.obtenerDocumento.and.returnValue(throwError(() => error));
      derivacionService.obtenerHistorial.and.returnValue(of(mockHistorial));

      component.documentoId = '123';
      component.ngOnInit();

      expect(component.error).toBe('No se pudo cargar el documento');
      expect(component.cargando).toBe(false);
    });
  });

  describe('Estado and Prioridad Labels', () => {
    it('should return correct estado label', () => {
      expect(component.getEstadoLabel(EstadoDocumento.REGISTRADO)).toBe('Registrado');
      expect(component.getEstadoLabel(EstadoDocumento.EN_PROCESO)).toBe('En Proceso');
      expect(component.getEstadoLabel(EstadoDocumento.ATENDIDO)).toBe('Atendido');
      expect(component.getEstadoLabel(EstadoDocumento.ARCHIVADO)).toBe('Archivado');
    });

    it('should return correct estado class', () => {
      expect(component.getEstadoClass(EstadoDocumento.REGISTRADO)).toBe('estado-registrado');
      expect(component.getEstadoClass(EstadoDocumento.EN_PROCESO)).toBe('estado-en-proceso');
    });

    it('should return correct prioridad label', () => {
      expect(component.getPrioridadLabel(PrioridadDocumento.NORMAL)).toBe('Normal');
      expect(component.getPrioridadLabel(PrioridadDocumento.ALTA)).toBe('Alta');
      expect(component.getPrioridadLabel(PrioridadDocumento.URGENTE)).toBe('Urgente');
    });

    it('should return correct prioridad class', () => {
      expect(component.getPrioridadClass(PrioridadDocumento.NORMAL)).toBe('prioridad-normal');
      expect(component.getPrioridadClass(PrioridadDocumento.ALTA)).toBe('prioridad-alta');
      expect(component.getPrioridadClass(PrioridadDocumento.URGENTE)).toBe('prioridad-urgente');
    });
  });

  describe('File Handling', () => {
    it('should return correct file icon for PDF', () => {
      expect(component.getArchivoIcon('application/pdf')).toBe('fas fa-file-pdf');
    });

    it('should return correct file icon for images', () => {
      expect(component.getArchivoIcon('image/png')).toBe('fas fa-file-image');
      expect(component.getArchivoIcon('image/jpeg')).toBe('fas fa-file-image');
    });

    it('should return correct file icon for Word documents', () => {
      expect(component.getArchivoIcon('application/msword')).toBe('fas fa-file-word');
    });

    it('should return default icon for unknown types', () => {
      expect(component.getArchivoIcon('application/unknown')).toBe('fas fa-file');
    });

    it('should detect if file is an image', () => {
      expect(component.esImagen('image/png')).toBe(true);
      expect(component.esImagen('image/jpeg')).toBe(true);
      expect(component.esImagen('application/pdf')).toBe(false);
    });

    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('Fecha Limite', () => {
    it('should detect if document is vencido', () => {
      component.documento = {
        ...mockDocumento,
        fechaLimite: new Date('2020-01-01')
      };
      expect(component.estaVencido()).toBe(true);
    });

    it('should detect if document is not vencido', () => {
      component.documento = {
        ...mockDocumento,
        fechaLimite: new Date('2030-01-01')
      };
      expect(component.estaVencido()).toBe(false);
    });

    it('should return false if no fecha limite', () => {
      component.documento = {
        ...mockDocumento,
        fechaLimite: undefined
      };
      expect(component.estaVencido()).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should emit derivar action', () => {
      spyOn(component.accionRealizada, 'emit');
      component.onDerivar();
      expect(component.accionRealizada.emit).toHaveBeenCalledWith('derivar');
    });

    it('should emit archivar action after confirmation', () => {
      spyOn(component.accionRealizada, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.onArchivar();
      
      expect(window.confirm).toHaveBeenCalled();
      expect(component.accionRealizada.emit).toHaveBeenCalledWith('archivar');
    });

    it('should not emit archivar action if not confirmed', () => {
      spyOn(component.accionRealizada, 'emit');
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.onArchivar();
      
      expect(component.accionRealizada.emit).not.toHaveBeenCalled();
    });

    it('should call descargarComprobante service method', () => {
      component.documento = mockDocumento;
      documentoService.descargarComprobante.and.stub();
      
      component.onDescargarComprobante();
      
      expect(documentoService.descargarComprobante).toHaveBeenCalledWith(
        mockDocumento.id,
        mockDocumento.numeroExpediente
      );
    });

    it('should emit cerrar event', () => {
      spyOn(component.cerrar, 'emit');
      component.onCerrar();
      expect(component.cerrar.emit).toHaveBeenCalled();
    });

    it('should open file URL when downloading archivo', () => {
      spyOn(window, 'open');
      const archivo = mockDocumento.archivosAdjuntos[0];
      
      component.onDescargarArchivo(archivo);
      
      expect(window.open).toHaveBeenCalledWith(archivo.url, '_blank');
    });

    it('should open file URL when viewing archivo', () => {
      spyOn(window, 'open');
      const archivo = mockDocumento.archivosAdjuntos[0];
      
      component.onVerArchivo(archivo);
      
      expect(window.open).toHaveBeenCalledWith(archivo.url, '_blank');
    });
  });

  describe('Notas', () => {
    it('should add a new nota', () => {
      component.nuevaNota = 'Esta es una nota de prueba';
      spyOn(component.accionRealizada, 'emit');
      
      component.onAgregarNota();
      
      expect(component.notas.length).toBe(1);
      expect(component.notas[0].contenido).toBe('Esta es una nota de prueba');
      expect(component.nuevaNota).toBe('');
      expect(component.accionRealizada.emit).toHaveBeenCalledWith('nota-agregada');
    });

    it('should not add empty nota', () => {
      component.nuevaNota = '   ';
      
      component.onAgregarNota();
      
      expect(component.notas.length).toBe(0);
    });

    it('should trim nota content', () => {
      component.nuevaNota = '  Nota con espacios  ';
      
      component.onAgregarNota();
      
      expect(component.notas[0].contenido).toBe('Nota con espacios');
    });
  });

  describe('Derivacion Icons and Classes', () => {
    it('should return correct derivacion icon', () => {
      expect(component.getDerivacionIcon('PENDIENTE')).toBe('fas fa-clock');
      expect(component.getDerivacionIcon('RECIBIDO')).toBe('fas fa-inbox');
      expect(component.getDerivacionIcon('ATENDIDO')).toBe('fas fa-check-circle');
      expect(component.getDerivacionIcon('UNKNOWN')).toBe('fas fa-circle');
    });

    it('should return correct derivacion estado class', () => {
      expect(component.getDerivacionEstadoClass('PENDIENTE')).toBe('pendiente');
      expect(component.getDerivacionEstadoClass('RECIBIDO')).toBe('recibido');
      expect(component.getDerivacionEstadoClass('ATENDIDO')).toBe('atendido');
    });
  });

  describe('Component Inputs', () => {
    it('should accept documentoId input', () => {
      component.documentoId = '123';
      expect(component.documentoId).toBe('123');
    });

    it('should accept permission inputs', () => {
      component.puedeDerivار = false;
      component.puedeArchivar = false;
      component.puedeAgregarNota = false;
      
      expect(component.puedeDerivار).toBe(false);
      expect(component.puedeArchivar).toBe(false);
      expect(component.puedeAgregarNota).toBe(false);
    });

    it('should have default permission values', () => {
      expect(component.puedeDerivار).toBe(true);
      expect(component.puedeArchivar).toBe(true);
      expect(component.puedeAgregarNota).toBe(true);
    });
  });
});
