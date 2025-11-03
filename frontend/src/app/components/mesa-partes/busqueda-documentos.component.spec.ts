import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { BusquedaDocumentosComponent } from './busqueda-documentos.component';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { 
  Documento, 
  EstadoDocumento, 
  PrioridadDocumento,
  TipoDocumento 
} from '../../models/mesa-partes/documento.model';

describe('BusquedaDocumentosComponent', () => {
  let component: BusquedaDocumentosComponent;
  let fixture: ComponentFixture<BusquedaDocumentosComponent>;
  let documentoService: jasmine.SpyObj<DocumentoService>;

  const mockTiposDocumento: TipoDocumento[] = [
    {
      id: '1',
      nombre: 'Solicitud',
      codigo: 'SOL',
      categorias: []
    },
    {
      id: '2',
      nombre: 'Oficio',
      codigo: 'OF',
      categorias: []
    }
  ];

  const mockDocumento: Documento = {
    id: '1',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumento: mockTiposDocumento[0],
    numeroDocumentoExterno: 'EXT-001',
    remitente: 'Juan Pérez',
    asunto: 'Solicitud de información',
    numeroFolios: 5,
    tieneAnexos: true,
    prioridad: PrioridadDocumento.NORMAL,
    estado: EstadoDocumento.REGISTRADO,
    fechaRecepcion: new Date('2025-01-15T10:00:00Z'),
    fechaLimite: new Date('2025-01-30T17:00:00Z'),
    usuarioRegistro: {
      id: 'user1',
      nombres: 'María',
      apellidos: 'García'
    },
    areaActual: {
      id: 'area1',
      nombre: 'Mesa de Partes'
    },
    archivosAdjuntos: [],
    etiquetas: ['urgente'],
    codigoQR: 'QR123456',
    expedienteRelacionado: undefined,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z')
  };

  const mockSearchResponse = {
    documentos: [mockDocumento],
    total: 1,
    page: 0,
    pageSize: 25
  };

  beforeEach(async () => {
    const documentoServiceSpy = jasmine.createSpyObj('DocumentoService', [
      'listarDocumentos',
      'buscarPorQR',
      'obtenerTiposDocumento',
      'descargarComprobante',
      'exportarExcel'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        BusquedaDocumentosComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        MatDialogModule
      ],
      providers: [
        { provide: DocumentoService, useValue: documentoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaDocumentosComponent);
    component = fixture.componentInstance;
    documentoService = TestBed.inject(DocumentoService) as jasmine.SpyObj<DocumentoService>;

    // Setup default mocks
    documentoService.obtenerTiposDocumento.and.returnValue(of(mockTiposDocumento));
    documentoService.listarDocumentos.and.returnValue(of(mockSearchResponse));
    documentoService.buscarPorQR.and.returnValue(of(mockDocumento));
    documentoService.exportarExcel.and.returnValue(of(new Blob()));
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.searchForm.get('numeroExpediente')?.value).toBe('');
      expect(component.searchForm.get('codigoQR')?.value).toBe('');
      expect(component.searchForm.get('remitente')?.value).toBe('');
      expect(component.searchForm.get('asunto')?.value).toBe('');
      expect(component.searchForm.get('tipoDocumentoId')?.value).toBe('');
      expect(component.searchForm.get('estado')?.value).toBe('');
      expect(component.searchForm.get('prioridad')?.value).toBe('');
      expect(component.searchForm.get('fechaDesde')?.value).toBeNull();
      expect(component.searchForm.get('fechaHasta')?.value).toBeNull();
    });

    it('should load tipos de documento on init', () => {
      expect(documentoService.obtenerTiposDocumento).toHaveBeenCalled();
      expect(component.tiposDocumento).toEqual(mockTiposDocumento);
    });

    it('should initialize with correct default values', () => {
      expect(component.loading).toBeFalse();
      expect(component.busquedaRealizada).toBeFalse();
      expect(component.hayResultados).toBeFalse();
      expect(component.documentos).toEqual([]);
      expect(component.totalResultados).toBe(0);
      expect(component.currentPage).toBe(0);
      expect(component.pageSize).toBe(25);
    });
  });

  describe('Search Functionality', () => {
    it('should perform basic search', () => {
      component.searchForm.patchValue({
        remitente: 'Juan Pérez'
      });

      component.buscarDocumentos();

      expect(documentoService.listarDocumentos).toHaveBeenCalledWith(
        jasmine.objectContaining({
          remitente: 'Juan Pérez',
          page: 0,
          pageSize: 25
        })
      );
      expect(component.loading).toBeFalse();
      expect(component.busquedaRealizada).toBeTrue();
      expect(component.documentos).toEqual([mockDocumento]);
      expect(component.totalResultados).toBe(1);
      expect(component.hayResultados).toBeTrue();
    });

    it('should search by numero expediente', () => {
      component.searchForm.patchValue({
        numeroExpediente: 'EXP-2025-0001'
      });

      component.buscarDocumentos();

      expect(documentoService.listarDocumentos).toHaveBeenCalledWith(
        jasmine.objectContaining({
          numeroExpediente: 'EXP-2025-0001'
        })
      );
    });

    it('should search by date range', () => {
      const fechaDesde = new Date('2025-01-01');
      const fechaHasta = new Date('2025-01-31');

      component.searchForm.patchValue({
        fechaDesde,
        fechaHasta
      });

      component.buscarDocumentos();

      expect(documentoService.listarDocumentos).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fechaDesde,
          fechaHasta
        })
      );
    });

    it('should search by tipo and estado', () => {
      component.searchForm.patchValue({
        tipoDocumentoId: '1',
        estado: EstadoDocumento.REGISTRADO
      });

      component.buscarDocumentos();

      expect(documentoService.listarDocumentos).toHaveBeenCalledWith(
        jasmine.objectContaining({
          tipoDocumentoId: '1',
          estado: EstadoDocumento.REGISTRADO
        })
      );
    });

    it('should handle search error', () => {
      documentoService.listarDocumentos.and.returnValue(
        throwError(() => new Error('Search error'))
      );

      spyOn(component['snackBar'], 'open');

      component.buscarDocumentos();

      expect(component.loading).toBeFalse();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error al realizar la búsqueda',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should handle empty search results', () => {
      documentoService.listarDocumentos.and.returnValue(of({
        documentos: [],
        total: 0,
        page: 0,
        pageSize: 25
      }));

      spyOn(component['snackBar'], 'open');

      component.buscarDocumentos();

      expect(component.documentos).toEqual([]);
      expect(component.totalResultados).toBe(0);
      expect(component.hayResultados).toBeFalse();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'No se encontraron documentos con los criterios especificados',
        'Cerrar',
        { duration: 3000 }
      );
    });
  });

  describe('QR Code Search', () => {
    it('should search by QR code', () => {
      spyOn(component as any, 'buscarPorQR').and.callThrough();
      spyOn(component['snackBar'], 'open');

      component.searchForm.patchValue({
        codigoQR: 'QR123456'
      });

      // Simulate the debounced search
      component['buscarPorQR']('QR123456');

      expect(documentoService.buscarPorQR).toHaveBeenCalledWith('QR123456');
      expect(component.documentos).toEqual([mockDocumento]);
      expect(component.totalResultados).toBe(1);
      expect(component.hayResultados).toBeTrue();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Documento encontrado por código QR',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should handle QR search error', () => {
      documentoService.buscarPorQR.and.returnValue(
        throwError(() => new Error('QR not found'))
      );

      spyOn(component['snackBar'], 'open');

      component['buscarPorQR']('INVALID_QR');

      expect(component.documentos).toEqual([]);
      expect(component.totalResultados).toBe(0);
      expect(component.hayResultados).toBeFalse();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'No se encontró documento con ese código QR',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should show placeholder message for QR scanner', () => {
      spyOn(component['snackBar'], 'open');

      component.escanearQR();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Funcionalidad de escáner QR próximamente disponible',
        'Cerrar',
        { duration: 3000 }
      );
    });
  });

  describe('Filter Management', () => {
    it('should update active filters', () => {
      component.searchForm.patchValue({
        numeroExpediente: 'EXP-2025-0001',
        remitente: 'Juan Pérez',
        estado: EstadoDocumento.REGISTRADO
      });

      component.buscarDocumentos();

      expect(component.filtrosActivos.length).toBe(3);
      expect(component.filtrosActivos).toContain(
        jasmine.objectContaining({
          key: 'numeroExpediente',
          label: 'Expediente',
          value: 'EXP-2025-0001'
        })
      );
      expect(component.filtrosActivos).toContain(
        jasmine.objectContaining({
          key: 'remitente',
          label: 'Remitente',
          value: 'Juan Pérez'
        })
      );
      expect(component.filtrosActivos).toContain(
        jasmine.objectContaining({
          key: 'estado',
          label: 'Estado',
          value: 'Registrado'
        })
      );
    });

    it('should remove specific filter', () => {
      component.searchForm.patchValue({
        numeroExpediente: 'EXP-2025-0001',
        remitente: 'Juan Pérez'
      });

      spyOn(component, 'buscarDocumentos');

      component.removerFiltro('numeroExpediente');

      expect(component.searchForm.get('numeroExpediente')?.value).toBe('');
      expect(component.buscarDocumentos).toHaveBeenCalled();
    });

    it('should clear all filters', () => {
      component.searchForm.patchValue({
        numeroExpediente: 'EXP-2025-0001',
        remitente: 'Juan Pérez',
        estado: EstadoDocumento.REGISTRADO
      });
      component.busquedaRealizada = true;
      component.hayResultados = true;
      component.documentos = [mockDocumento];
      component.totalResultados = 1;

      component.limpiarFiltros();

      expect(component.searchForm.get('numeroExpediente')?.value).toBeNull();
      expect(component.searchForm.get('remitente')?.value).toBeNull();
      expect(component.searchForm.get('estado')?.value).toBeNull();
      expect(component.filtrosActivos).toEqual([]);
      expect(component.documentos).toEqual([]);
      expect(component.totalResultados).toBe(0);
      expect(component.busquedaRealizada).toBeFalse();
      expect(component.hayResultados).toBeFalse();
    });
  });

  describe('Pagination and Sorting', () => {
    it('should handle page change', () => {
      spyOn(component, 'buscarDocumentos');

      const pageEvent = {
        pageIndex: 1,
        pageSize: 50,
        length: 100
      };

      component.onPageChange(pageEvent);

      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(50);
      expect(component.buscarDocumentos).toHaveBeenCalled();
    });

    it('should handle sort change', () => {
      spyOn(component, 'buscarDocumentos');

      const sortEvent = {
        active: 'remitente',
        direction: 'asc' as const
      };

      component.onSortChange(sortEvent);

      expect(component.currentSort).toEqual(sortEvent);
      expect(component.buscarDocumentos).toHaveBeenCalled();
    });
  });

  describe('Document Actions', () => {
    it('should handle ver detalle', () => {
      spyOn(component['snackBar'], 'open');

      component.verDetalle(mockDocumento);

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        `Ver detalle de ${mockDocumento.numeroExpediente}`,
        'Cerrar',
        { duration: 2000 }
      );
    });

    it('should handle descargar comprobante', () => {
      spyOn(component['snackBar'], 'open');

      component.descargarComprobante(mockDocumento);

      expect(documentoService.descargarComprobante).toHaveBeenCalledWith(
        mockDocumento.id,
        mockDocumento.numeroExpediente
      );
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Descargando comprobante...',
        'Cerrar',
        { duration: 2000 }
      );
    });

    it('should handle ver QR', () => {
      spyOn(component['snackBar'], 'open');

      component.verQR(mockDocumento);

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        `QR de ${mockDocumento.numeroExpediente}`,
        'Cerrar',
        { duration: 2000 }
      );
    });
  });

  describe('Export Functionality', () => {
    it('should export search results', () => {
      component.searchForm.patchValue({
        remitente: 'Juan Pérez'
      });
      component.hayResultados = true;

      spyOn(component['snackBar'], 'open');

      // Mock blob creation and URL methods
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      spyOn(window.URL, 'createObjectURL').and.returnValue('mock-url');
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
        remove: jasmine.createSpy('remove')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      documentoService.exportarExcel.and.returnValue(of(mockBlob));

      component.exportarResultados();

      expect(documentoService.exportarExcel).toHaveBeenCalledWith(
        jasmine.objectContaining({
          remitente: 'Juan Pérez'
        })
      );
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Resultados exportados exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should handle export error', () => {
      component.hayResultados = true;
      documentoService.exportarExcel.and.returnValue(
        throwError(() => new Error('Export error'))
      );

      spyOn(component['snackBar'], 'open');

      component.exportarResultados();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error al exportar resultados',
        'Cerrar',
        { duration: 3000 }
      );
    });
  });

  describe('Helper Methods', () => {
    it('should get correct estado icon', () => {
      expect(component.getEstadoIcon(EstadoDocumento.REGISTRADO)).toBe('fiber_new');
      expect(component.getEstadoIcon(EstadoDocumento.EN_PROCESO)).toBe('hourglass_empty');
      expect(component.getEstadoIcon(EstadoDocumento.ATENDIDO)).toBe('check_circle');
      expect(component.getEstadoIcon(EstadoDocumento.ARCHIVADO)).toBe('archive');
    });

    it('should get correct estado label', () => {
      expect(component.getEstadoLabel(EstadoDocumento.REGISTRADO)).toBe('Registrado');
      expect(component.getEstadoLabel(EstadoDocumento.EN_PROCESO)).toBe('En Proceso');
      expect(component.getEstadoLabel(EstadoDocumento.ATENDIDO)).toBe('Atendido');
      expect(component.getEstadoLabel(EstadoDocumento.ARCHIVADO)).toBe('Archivado');
    });

    it('should get correct prioridad icon', () => {
      expect(component.getPrioridadIcon(PrioridadDocumento.NORMAL)).toBe('remove');
      expect(component.getPrioridadIcon(PrioridadDocumento.ALTA)).toBe('keyboard_arrow_up');
      expect(component.getPrioridadIcon(PrioridadDocumento.URGENTE)).toBe('priority_high');
    });

    it('should get correct prioridad label', () => {
      expect(component.getPrioridadLabel(PrioridadDocumento.NORMAL)).toBe('Normal');
      expect(component.getPrioridadLabel(PrioridadDocumento.ALTA)).toBe('Alta');
      expect(component.getPrioridadLabel(PrioridadDocumento.URGENTE)).toBe('Urgente');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Real-time Search', () => {
    it('should trigger search when numero expediente has 3+ characters', (done) => {
      spyOn(component, 'buscarDocumentos');

      component.searchForm.get('numeroExpediente')?.setValue('EXP');

      setTimeout(() => {
        expect(component.buscarDocumentos).toHaveBeenCalled();
        done();
      }, 600); // Wait for debounce
    });

    it('should not trigger search when numero expediente has less than 3 characters', (done) => {
      spyOn(component, 'buscarDocumentos');

      component.searchForm.get('numeroExpediente')?.setValue('EX');

      setTimeout(() => {
        expect(component.buscarDocumentos).not.toHaveBeenCalled();
        done();
      }, 600); // Wait for debounce
    });
  });
});