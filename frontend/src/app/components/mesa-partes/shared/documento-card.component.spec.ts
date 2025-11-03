import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DocumentoCardComponent } from './documento-card.component';
import { 
  Documento, 
  EstadoDocumento, 
  PrioridadDocumento,
  TipoDocumento 
} from '../../../models/mesa-partes/documento.model';

describe('DocumentoCardComponent', () => {
  let component: DocumentoCardComponent;
  let fixture: ComponentFixture<DocumentoCardComponent>;

  const mockTipoDocumento: TipoDocumento = {
    id: '1',
    nombre: 'Solicitud',
    codigo: 'SOL',
    categorias: []
  };

  const mockDocumento: Documento = {
    id: '1',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumento: mockTipoDocumento,
    numeroDocumentoExterno: 'EXT-001',
    remitente: 'Juan Pérez García',
    asunto: 'Solicitud de información sobre trámites administrativos y procedimientos',
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
    etiquetas: ['urgente', 'importante', 'revision', 'seguimiento'],
    codigoQR: 'QR123456',
    expedienteRelacionado: undefined,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DocumentoCardComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentoCardComponent);
    component = fixture.componentInstance;
    component.documento = mockDocumento;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should display documento information correctly', () => {
      expect(component.documento).toEqual(mockDocumento);
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.numero-expediente').textContent).toContain('EXP-2025-0001');
      expect(compiled.querySelector('.remitente-nombre').textContent).toContain('Juan Pérez García');
    });

    it('should show default configuration', () => {
      expect(component.showActions).toBeTrue();
      expect(component.showQuickActions).toBeTrue();
      expect(component.compact).toBeFalse();
      expect(component.selectable).toBeFalse();
      expect(component.selected).toBeFalse();
      expect(component.maxAsuntoLength).toBe(120);
      expect(component.maxEtiquetas).toBe(3);
    });
  });

  describe('Card Classes', () => {
    it('should return correct classes for normal priority', () => {
      component.documento.prioridad = PrioridadDocumento.NORMAL;
      const classes = component.getCardClass();
      expect(classes).not.toContain('prioridad-urgente');
      expect(classes).not.toContain('prioridad-alta');
    });

    it('should return correct classes for high priority', () => {
      component.documento.prioridad = PrioridadDocumento.ALTA;
      const classes = component.getCardClass();
      expect(classes).toContain('prioridad-alta');
    });

    it('should return correct classes for urgent priority', () => {
      component.documento.prioridad = PrioridadDocumento.URGENTE;
      const classes = component.getCardClass();
      expect(classes).toContain('prioridad-urgente');
    });

    it('should return compact class when compact is true', () => {
      component.compact = true;
      const classes = component.getCardClass();
      expect(classes).toContain('compact');
    });

    it('should return selected class when selected is true', () => {
      component.selected = true;
      const classes = component.getCardClass();
      expect(classes).toContain('selected');
    });

    it('should return vencido class when document is overdue', () => {
      component.documento.fechaLimite = new Date('2024-12-01'); // Past date
      component.documento.estado = EstadoDocumento.EN_PROCESO;
      const classes = component.getCardClass();
      expect(classes).toContain('estado-vencido');
    });
  });

  describe('Document Type Icon', () => {
    it('should return correct icon for solicitud', () => {
      component.documento.tipoDocumento.nombre = 'Solicitud de información';
      expect(component.getTipoIcon()).toBe('request_page');
    });

    it('should return correct icon for oficio', () => {
      component.documento.tipoDocumento.nombre = 'Oficio circular';
      expect(component.getTipoIcon()).toBe('description');
    });

    it('should return correct icon for memorando', () => {
      component.documento.tipoDocumento.nombre = 'Memorando interno';
      expect(component.getTipoIcon()).toBe('note');
    });

    it('should return default icon for unknown type', () => {
      component.documento.tipoDocumento.nombre = 'Tipo desconocido';
      expect(component.getTipoIcon()).toBe('description');
    });
  });

  describe('Document Status Checks', () => {
    it('should identify urgent documents', () => {
      component.documento.prioridad = PrioridadDocumento.URGENTE;
      expect(component.esUrgente()).toBeTrue();

      component.documento.prioridad = PrioridadDocumento.NORMAL;
      expect(component.esUrgente()).toBeFalse();
    });

    it('should identify overdue documents', () => {
      component.documento.fechaLimite = new Date('2024-12-01'); // Past date
      component.documento.estado = EstadoDocumento.EN_PROCESO;
      expect(component.estaVencido()).toBeTrue();

      component.documento.estado = EstadoDocumento.ATENDIDO;
      expect(component.estaVencido()).toBeFalse();
    });

    it('should identify documents with approaching deadline', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      component.documento.fechaLimite = tomorrow;
      expect(component.fechaLimiteProxima()).toBeTrue();

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      component.documento.fechaLimite = nextWeek;
      expect(component.fechaLimiteProxima()).toBeFalse();
    });

    it('should return correct fecha limite class', () => {
      // Vencido
      component.documento.fechaLimite = new Date('2024-12-01');
      component.documento.estado = EstadoDocumento.EN_PROCESO;
      expect(component.getFechaLimiteClass()).toBe('fecha-limite-vencida');

      // Próximo
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      component.documento.fechaLimite = tomorrow;
      expect(component.getFechaLimiteClass()).toBe('fecha-limite-proxima');

      // Normal
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      component.documento.fechaLimite = nextMonth;
      expect(component.getFechaLimiteClass()).toBe('');
    });
  });

  describe('Document Actions', () => {
    it('should allow derivation for registered documents', () => {
      component.documento.estado = EstadoDocumento.REGISTRADO;
      expect(component.puedeDerivarse()).toBeTrue();

      component.documento.estado = EstadoDocumento.EN_PROCESO;
      expect(component.puedeDerivarse()).toBeTrue();

      component.documento.estado = EstadoDocumento.ATENDIDO;
      expect(component.puedeDerivarse()).toBeFalse();
    });

    it('should allow archiving for attended documents', () => {
      component.documento.estado = EstadoDocumento.ATENDIDO;
      expect(component.puedeArchivarse()).toBeTrue();

      component.documento.estado = EstadoDocumento.REGISTRADO;
      expect(component.puedeArchivarse()).toBeFalse();
    });
  });

  describe('Tags Management', () => {
    it('should return remaining tags text', () => {
      component.maxEtiquetas = 2;
      const remaining = component.getEtiquetasRestantes();
      expect(remaining).toBe('revision, seguimiento');
    });

    it('should handle empty remaining tags', () => {
      component.maxEtiquetas = 10;
      const remaining = component.getEtiquetasRestantes();
      expect(remaining).toBe('');
    });
  });

  describe('Event Emissions', () => {
    it('should emit verDetalle event', () => {
      spyOn(component.verDetalle, 'emit');
      component.onVerDetalle();
      expect(component.verDetalle.emit).toHaveBeenCalledWith(mockDocumento);
    });

    it('should emit derivar event', () => {
      spyOn(component.derivar, 'emit');
      component.onDerivar();
      expect(component.derivar.emit).toHaveBeenCalledWith(mockDocumento);
    });

    it('should emit archivar event', () => {
      spyOn(component.archivar, 'emit');
      component.onArchivar();
      expect(component.archivar.emit).toHaveBeenCalledWith(mockDocumento);
    });

    it('should emit descargarComprobante event', () => {
      spyOn(component.descargarComprobante, 'emit');
      component.onDescargarComprobante();
      expect(component.descargarComprobante.emit).toHaveBeenCalledWith(mockDocumento);
    });

    it('should emit verQR event', () => {
      spyOn(component.verQR, 'emit');
      component.onVerQR();
      expect(component.verQR.emit).toHaveBeenCalledWith(mockDocumento);
    });

    it('should emit selectionChange event when selectable', () => {
      component.selectable = true;
      component.selected = false;
      spyOn(component.selectionChange, 'emit');
      
      component.onSelectionChange();
      
      expect(component.selected).toBeTrue();
      expect(component.selectionChange.emit).toHaveBeenCalledWith({
        documento: mockDocumento,
        selected: true
      });
    });

    it('should not emit selectionChange when not selectable', () => {
      component.selectable = false;
      spyOn(component.selectionChange, 'emit');
      
      component.onSelectionChange();
      
      expect(component.selectionChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('UI Elements', () => {
    it('should show quick actions when enabled', () => {
      component.showQuickActions = true;
      fixture.detectChanges();
      
      const actionsElement = fixture.nativeElement.querySelector('.card-actions');
      expect(actionsElement).toBeTruthy();
    });

    it('should hide quick actions when disabled', () => {
      component.showQuickActions = false;
      fixture.detectChanges();
      
      const actionsElement = fixture.nativeElement.querySelector('.card-actions');
      expect(actionsElement).toBeFalsy();
    });

    it('should show urgency indicator for urgent documents', () => {
      component.documento.prioridad = PrioridadDocumento.URGENTE;
      fixture.detectChanges();
      
      const urgencyElement = fixture.nativeElement.querySelector('.urgencia-indicator');
      expect(urgencyElement).toBeTruthy();
    });

    it('should show overdue indicator for overdue documents', () => {
      component.documento.fechaLimite = new Date('2024-12-01');
      component.documento.estado = EstadoDocumento.EN_PROCESO;
      fixture.detectChanges();
      
      const overdueElement = fixture.nativeElement.querySelector('.vencimiento-indicator');
      expect(overdueElement).toBeTruthy();
    });

    it('should truncate long asunto text', () => {
      component.maxAsuntoLength = 20;
      fixture.detectChanges();
      
      const asuntoElement = fixture.nativeElement.querySelector('.asunto-texto');
      expect(asuntoElement.textContent.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    it('should show limited number of tags', () => {
      component.maxEtiquetas = 2;
      fixture.detectChanges();
      
      const chipElements = fixture.nativeElement.querySelectorAll('.etiqueta-chip');
      expect(chipElements.length).toBeLessThanOrEqual(3); // 2 tags + 1 more chip
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle compact mode', () => {
      component.compact = true;
      const classes = component.getCardClass();
      expect(classes).toContain('compact');
    });

    it('should handle selection state', () => {
      component.selected = true;
      const classes = component.getCardClass();
      expect(classes).toContain('selected');
    });
  });
});