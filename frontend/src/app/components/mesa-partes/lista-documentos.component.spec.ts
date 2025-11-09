import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ListaDocumentosComponent } from './lista-documentos.component';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { Documento, EstadoDocumento, PrioridadDocumento, FiltrosDocumento } from '../../models/mesa-partes/documento.model';

describe('ListaDocumentosComponent', () => {
  let component: ListaDocumentosComponent;
  let fixture: ComponentFixture<ListaDocumentosComponent>;
  let documentoService: jasmine.SpyObj<DocumentoService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockDocumentos: Documento[] = [
    {
      id: 'doc-1',
      numeroExpediente: 'EXP-2025-0001',
      tipoDocumento: { id: 'tipo-1', nombre: 'Solicitud', codigo: 'SOL', categorias: [] },
      remitente: 'Juan Pérez',
      asunto: 'Solicitud de información',
      estado: 'REGISTRADO' as EstadoDocumento,
      prioridad: 'NORMAL' as PrioridadDocumento,
      fechaRecepcion: new Date('2025-01-15'),
      numeroFolios: 5,
      tieneAnexos: false,
      archivosAdjuntos: [],
      etiquetas: [],
      codigoQR: 'QR-1',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Documento,
    {
      id: 'doc-2',
      numeroExpediente: 'EXP-2025-0002',
      tipoDocumento: { id: 'tipo-2', nombre: 'Oficio', codigo: 'OF', categorias: [] },
      remitente: 'María López',
      asunto: 'Oficio urgente',
      estado: 'EN_PROCESO' as EstadoDocumento,
      prioridad: 'URGENTE' as PrioridadDocumento,
      fechaRecepcion: new Date('2025-01-16'),
      fechaLimite: new Date('2025-01-20'),
      numeroFolios: 3,
      tieneAnexos: true,
      archivosAdjuntos: [],
      etiquetas: [],
      codigoQR: 'QR-2',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Documento
  ];

  beforeEach(async () => {
    const documentoServiceSpy = jasmine.createSpyObj('DocumentoService', [
      'listarDocumentos',
      'exportarExcel',
      'exportarPDF'
    ]);

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ListaDocumentosComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DocumentoService, useValue: documentoServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    documentoService = TestBed.inject(DocumentoService) as jasmine.SpyObj<DocumentoService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture = TestBed.createComponent(ListaDocumentosComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carga de documentos', () => {
    it('debe cargar documentos al inicializar', () => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 2,
        page: 0,
        pageSize: 25
      };

      documentoService.listarDocumentos.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(documentoService.listarDocumentos).toHaveBeenCalled();
      expect(component.documentos().length).toBe(2);
      expect(component.totalDocumentos()).toBe(2);
      expect(component.cargando()).toBe(false);
    });

    it('debe manejar error al cargar documentos', () => {
      const error = { error: { message: 'Error de red' } };
      documentoService.listarDocumentos.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      fixture.detectChanges();

      expect(component.cargando()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    });

    it('debe aplicar filtros al cargar documentos', () => {
      const filtros: FiltrosDocumento = {
        estado: 'REGISTRADO' as EstadoDocumento,
        prioridad: 'ALTA' as PrioridadDocumento
      };

      const mockResponse = {
        documentos: [mockDocumentos[0]],
        total: 1,
        page: 0,
        pageSize: 25
      };

      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      component.filtros = filtros;

      fixture.detectChanges();

      expect(documentoService.listarDocumentos).toHaveBeenCalledWith(
        jasmine.objectContaining({
          estado: 'REGISTRADO',
          prioridad: 'ALTA'
        })
      );
    });
  });

  describe('Paginación', () => {
    beforeEach(() => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 50,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('debe cambiar de página correctamente', () => {
      const pageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50
      };

      component.onPageChange(pageEvent);

      expect(component.pageIndex()).toBe(1);
      expect(component.pageSize()).toBe(25);
      expect(documentoService.listarDocumentos).toHaveBeenCalled();
    });

    it('debe cambiar el tamaño de página', () => {
      const pageEvent = {
        pageIndex: 0,
        pageSize: 50,
        length: 50
      };

      component.onPageChange(pageEvent);

      expect(component.pageSize()).toBe(50);
      expect(documentoService.listarDocumentos).toHaveBeenCalled();
    });
  });

  describe('Ordenamiento', () => {
    beforeEach(() => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 2,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('debe ordenar por columna ascendente', () => {
      const evento = {
        columna: 'numeroExpediente',
        direccion: 'asc' as const,
        esMultiple: false
      };

      component.onOrdenamientoChange(evento);

      const ordenamiento = component.ordenamiento();
      expect(ordenamiento.length).toBe(1);
      expect(ordenamiento[0].columna).toBe('numeroExpediente');
      expect(ordenamiento[0].direccion).toBe('asc');
    });

    it('debe ordenar por columna descendente', () => {
      const evento = {
        columna: 'fechaRecepcion',
        direccion: 'desc' as const,
        esMultiple: false
      };

      component.onOrdenamientoChange(evento);

      const ordenamiento = component.ordenamiento();
      expect(ordenamiento[0].direccion).toBe('desc');
    });

    it('debe limpiar ordenamiento cuando direccion es null', () => {
      component.ordenamiento.set([
        { columna: 'numeroExpediente', direccion: 'asc', prioridad: 1 }
      ]);

      const evento = {
        columna: 'numeroExpediente',
        direccion: null,
        esMultiple: false
      };

      component.onOrdenamientoChange(evento);

      expect(component.ordenamiento().length).toBe(0);
    });

    it('debe soportar ordenamiento múltiple', () => {
      const evento1 = {
        columna: 'prioridad',
        direccion: 'desc' as const,
        esMultiple: true
      };

      const evento2 = {
        columna: 'fechaRecepcion',
        direccion: 'asc' as const,
        esMultiple: true
      };

      component.onOrdenamientoChange(evento1);
      component.onOrdenamientoChange(evento2);

      const ordenamiento = component.ordenamiento();
      expect(ordenamiento.length).toBe(2);
      expect(ordenamiento[0].columna).toBe('prioridad');
      expect(ordenamiento[1].columna).toBe('fechaRecepcion');
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 2,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('debe aplicar filtros y resetear página', () => {
      component.pageIndex.set(2);

      const filtros: FiltrosDocumento = {
        estado: 'REGISTRADO' as EstadoDocumento
      };

      component.onFiltrosChange(filtros);

      expect(component.pageIndex()).toBe(0);
      expect(component.filtrosActuales).toEqual(filtros);
      expect(documentoService.listarDocumentos).toHaveBeenCalled();
    });
  });

  describe('Acciones de documento', () => {
    beforeEach(() => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 2,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('debe abrir modal de detalle al ver documento', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialog.open.and.returnValue(dialogRefSpy);

      component.onVerDetalle(mockDocumentos[0]);

      expect(dialog.open).toHaveBeenCalled();
    });

    it('debe emitir evento al derivar documento', (done) => {
      component.derivarDocumento.subscribe(documento => {
        expect(documento).toEqual(mockDocumentos[0]);
        done();
      });

      component.onDerivar(mockDocumentos[0]);
    });

    it('debe emitir evento al archivar documento', (done) => {
      component.archivarDocumento.subscribe(documento => {
        expect(documento).toEqual(mockDocumentos[0]);
        done();
      });

      component.onArchivar(mockDocumentos[0]);
    });
  });

  describe('Exportación', () => {
    beforeEach(() => {
      const mockResponse = {
        documentos: mockDocumentos,
        total: 2,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('debe exportar a Excel', () => {
      const mockBlob = new Blob(['Excel content'], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      documentoService.exportarExcel.and.returnValue(of(mockBlob));

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');

      component.exportarExcel();

      expect(documentoService.exportarExcel).toHaveBeenCalled();
      expect(component.exportando()).toBe(false);
    });

    it('debe exportar a PDF', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      documentoService.exportarPDF.and.returnValue(of(mockBlob));

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');

      component.exportarPDF();

      expect(documentoService.exportarPDF).toHaveBeenCalled();
      expect(component.exportando()).toBe(false);
    });

    it('debe manejar error al exportar', () => {
      const error = { error: { message: 'Error al exportar' } };
      documentoService.exportarExcel.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.exportarExcel();

      expect(component.exportando()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    });

    it('no debe exportar si ya está exportando', () => {
      component.exportando.set(true);

      component.exportarExcel();

      expect(documentoService.exportarExcel).not.toHaveBeenCalled();
    });
  });

  describe('Utilidades de formato', () => {
    it('debe formatear texto de estado correctamente', () => {
      expect(component.getEstadoTexto('REGISTRADO' as EstadoDocumento)).toBe('Registrado');
      expect(component.getEstadoTexto('EN_PROCESO' as EstadoDocumento)).toBe('En Proceso');
      expect(component.getEstadoTexto('ATENDIDO' as EstadoDocumento)).toBe('Atendido');
      expect(component.getEstadoTexto('ARCHIVADO' as EstadoDocumento)).toBe('Archivado');
    });

    it('debe formatear texto de prioridad correctamente', () => {
      expect(component.getPrioridadTexto('NORMAL' as PrioridadDocumento)).toBe('Normal');
      expect(component.getPrioridadTexto('ALTA' as PrioridadDocumento)).toBe('Alta');
      expect(component.getPrioridadTexto('URGENTE' as PrioridadDocumento)).toBe('Urgente');
    });

    it('debe obtener icono de prioridad correcto', () => {
      expect(component.getPrioridadIcono('NORMAL' as PrioridadDocumento)).toBe('remove');
      expect(component.getPrioridadIcono('ALTA' as PrioridadDocumento)).toBe('arrow_upward');
      expect(component.getPrioridadIcono('URGENTE' as PrioridadDocumento)).toBe('priority_high');
    });

    it('debe formatear fechas correctamente', () => {
      const fecha = new Date('2025-01-15');
      const resultado = component.formatearFecha(fecha);
      
      expect(resultado).toContain('15');
      expect(resultado).toContain('01');
      expect(resultado).toContain('2025');
    });

    it('debe detectar documentos vencidos', () => {
      const fechaPasada = new Date('2024-01-01');
      const fechaFutura = new Date('2026-01-01');

      expect(component.estaVencido(fechaPasada)).toBe(true);
      expect(component.estaVencido(fechaFutura)).toBe(false);
    });
  });

  describe('Estados de carga', () => {
    it('debe mostrar indicador de carga', () => {
      component.cargando.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const loadingElement = compiled.querySelector('.loading-container');
      
      expect(loadingElement).toBeTruthy();
    });

    it('debe mostrar mensaje de error', () => {
      component.error.set('Error al cargar documentos');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorElement = compiled.querySelector('.error-container');
      
      expect(errorElement).toBeTruthy();
    });

    it('debe mostrar mensaje cuando no hay documentos', () => {
      const mockResponse = {
        documentos: [],
        total: 0,
        page: 0,
        pageSize: 25
      };
      documentoService.listarDocumentos.and.returnValue(of(mockResponse));
      
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const emptyElement = compiled.querySelector('.empty-container');
      
      expect(emptyElement).toBeTruthy();
    });
  });
});
