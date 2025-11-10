import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ResolucionesTableComponent, AccionTabla } from './resoluciones-table.component';
import { ResolucionConEmpresa, ResolucionTableConfig } from '../models/resolucion-table.model';
import { ResolucionService } from '../services/resolucion.service';

describe('ResolucionesTableComponent', () => {
  let component: ResolucionesTableComponent;
  let fixture: ComponentFixture<ResolucionesTableComponent>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockResolucionService: jasmine.SpyObj<ResolucionService>;

  const mockResoluciones: ResolucionConEmpresa[] = [
    {
      id: '1',
      nroResolucion: 'R-001-2025',
      tipoResolucion: 'PADRE',
      tipoTramite: 'PRIMIGENIA',
      fechaEmision: new Date('2025-01-15'),
      fechaVigenciaInicio: new Date('2025-01-20'),
      fechaVigenciaFin: new Date('2025-12-31'),
      estado: 'VIGENTE',
      estaActivo: true,
      empresa: {
        id: 'emp1',
        razonSocial: { principal: 'Empresa Test SA' },
        ruc: '20123456789'
      }
    },
    {
      id: '2',
      nroResolucion: 'R-002-2025',
      tipoResolucion: 'HIJO',
      tipoTramite: 'RENOVACION',
      fechaEmision: new Date('2025-01-10'),
      estado: 'BORRADOR',
      estaActivo: false
    }
  ];

  const mockConfig: ResolucionTableConfig = {
    columnasVisibles: ['nroResolucion', 'empresa', 'tipoTramite', 'estado'],
    ordenColumnas: ['nroResolucion', 'empresa', 'tipoTramite', 'estado'],
    ordenamiento: [],
    paginacion: {
      tamanoPagina: 10,
      paginaActual: 0
    },
    filtros: {}
  };

  beforeEach(async () => {
    const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    breakpointSpy.observe.and.returnValue(of({ matches: false, breakpoints: {} }));
    
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const resolucionServiceSpy = jasmine.createSpyObj('ResolucionService', ['exportarResoluciones']);

    await TestBed.configureTestingModule({
      imports: [
        ResolucionesTableComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BreakpointObserver, useValue: breakpointSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ResolucionService, useValue: resolucionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResolucionesTableComponent);
    component = fixture.componentInstance;
    mockBreakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    mockResolucionService = TestBed.inject(ResolucionService) as jasmine.SpyObj<ResolucionService>;
    
    component.configuracion = mockConfig;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty data', () => {
      fixture.detectChanges();
      expect(component.dataSource.data.length).toBe(0);
    });

    it('should detect mobile breakpoint', () => {
      mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
      component.ngOnInit();
      expect(component.esMobile()).toBeTruthy();
    });

    it('should detect tablet breakpoint', () => {
      mockBreakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));
      component.ngOnInit();
      // Tablet detection logic would be tested here
    });

    it('should initialize with provided configuration', () => {
      component.configuracion = mockConfig;
      fixture.detectChanges();
      
      expect(component.configuracion.columnasVisibles).toEqual(mockConfig.columnasVisibles);
    });
  });

  describe('Data Loading', () => {
    it('should load resoluciones into datasource', () => {
      component.resoluciones = mockResoluciones;
      component.ngOnChanges({
        resoluciones: {
          currentValue: mockResoluciones,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      
      expect(component.dataSource.data.length).toBe(2);
    });

    it('should update total resultados', () => {
      component.resoluciones = mockResoluciones;
      component.ngOnChanges({
        resoluciones: {
          currentValue: mockResoluciones,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      
      expect(component.totalResultados()).toBe(2);
    });

    it('should handle empty resoluciones array', () => {
      component.resoluciones = [];
      component.ngOnChanges({
        resoluciones: {
          currentValue: [],
          previousValue: mockResoluciones,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      
      expect(component.dataSource.data.length).toBe(0);
      expect(component.totalResultados()).toBe(0);
    });
  });

  describe('Column Management', () => {
    beforeEach(() => {
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should emit configuracionChange when columns change', () => {
      spyOn(component.configuracionChange, 'emit');
      
      const newColumns = ['nroResolucion', 'empresa'];
      component.onColumnasVisiblesChange(newColumns);
      
      expect(component.configuracionChange.emit).toHaveBeenCalled();
    });

    it('should update visible columns', () => {
      const newColumns = ['nroResolucion', 'empresa'];
      component.onColumnasVisiblesChange(newColumns);
      
      expect(component.configuracion.columnasVisibles).toEqual(newColumns);
    });

    it('should emit configuracionChange when column order changes', () => {
      spyOn(component.configuracionChange, 'emit');
      
      const newOrder = ['empresa', 'nroResolucion'];
      component.onOrdenColumnasChange(newOrder);
      
      expect(component.configuracionChange.emit).toHaveBeenCalled();
    });

    it('should include selection column when seleccionMultiple is true', () => {
      component.seleccionMultiple = true;
      fixture.detectChanges();
      
      const columnas = component.columnasVisibles();
      expect(columnas[0]).toBe('seleccion');
    });

    it('should include actions column', () => {
      const columnas = component.columnasVisibles();
      expect(columnas[columnas.length - 1]).toBe('acciones');
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should emit configuracionChange when sorting changes', () => {
      spyOn(component.configuracionChange, 'emit');
      
      component.onOrdenamientoChange({
        columna: 'fechaEmision',
        direccion: 'asc',
        esMultiple: false
      });
      
      expect(component.configuracionChange.emit).toHaveBeenCalled();
    });

    it('should add new sort when esMultiple is false', () => {
      component.onOrdenamientoChange({
        columna: 'fechaEmision',
        direccion: 'asc',
        esMultiple: false
      });
      
      expect(component.configuracion.ordenamiento.length).toBe(1);
      expect(component.configuracion.ordenamiento[0].columna).toBe('fechaEmision');
    });

    it('should remove sort when direccion is null', () => {
      component.configuracion.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      
      component.onOrdenamientoChange({
        columna: 'fechaEmision',
        direccion: null,
        esMultiple: false
      });
      
      expect(component.configuracion.ordenamiento.length).toBe(0);
    });

    it('should handle multiple sorting', () => {
      component.onOrdenamientoChange({
        columna: 'fechaEmision',
        direccion: 'asc',
        esMultiple: false
      });
      
      component.onOrdenamientoChange({
        columna: 'nroResolucion',
        direccion: 'desc',
        esMultiple: true
      });
      
      expect(component.configuracion.ordenamiento.length).toBe(2);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should emit configuracionChange when page changes', () => {
      spyOn(component.configuracionChange, 'emit');
      
      component.onPaginaChange({
        pageIndex: 1,
        pageSize: 10,
        length: 20
      });
      
      expect(component.configuracionChange.emit).toHaveBeenCalled();
    });

    it('should update page index', () => {
      component.onPaginaChange({
        pageIndex: 2,
        pageSize: 10,
        length: 30
      });
      
      expect(component.configuracion.paginacion.paginaActual).toBe(2);
    });

    it('should update page size', () => {
      component.onPaginaChange({
        pageIndex: 0,
        pageSize: 25,
        length: 30
      });
      
      expect(component.configuracion.paginacion.tamanoPagina).toBe(25);
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should emit accionEjecutada when executing action', () => {
      spyOn(component.accionEjecutada, 'emit');
      
      component.ejecutarAccion('ver', mockResoluciones[0]);
      
      expect(component.accionEjecutada.emit).toHaveBeenCalled();
    });

    it('should emit correct action type', () => {
      spyOn(component.accionEjecutada, 'emit');
      
      component.ejecutarAccion('editar', mockResoluciones[0]);
      
      const emittedValue: AccionTabla = (component.accionEjecutada.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.accion).toBe('editar');
    });

    it('should include resolucion in action', () => {
      spyOn(component.accionEjecutada, 'emit');
      
      component.ejecutarAccion('ver', mockResoluciones[0]);
      
      const emittedValue: AccionTabla = (component.accionEjecutada.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.resolucion).toEqual(mockResoluciones[0]);
    });

    it('should emit resolucionSeleccionada when row is clicked', () => {
      spyOn(component.resolucionSeleccionada, 'emit');
      
      component.onFilaClick(mockResoluciones[0]);
      
      expect(component.resolucionSeleccionada.emit).toHaveBeenCalledWith(mockResoluciones[0]);
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      component.seleccionMultiple = true;
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should select all when masterToggle is called', () => {
      component.masterToggle();
      
      expect(component.seleccion.selected.length).toBe(mockResoluciones.length);
    });

    it('should deselect all when all are selected', () => {
      component.masterToggle(); // Select all
      component.masterToggle(); // Deselect all
      
      expect(component.seleccion.selected.length).toBe(0);
    });

    it('should detect when all are selected', () => {
      component.masterToggle();
      
      expect(component.isAllSelected()).toBeTruthy();
    });

    it('should clear selection', () => {
      component.seleccion.select(mockResoluciones[0]);
      component.limpiarSeleccion();
      
      expect(component.seleccion.selected.length).toBe(0);
    });

    it('should execute bulk action', () => {
      spyOn(component.accionEjecutada, 'emit');
      component.seleccion.select(...mockResoluciones);
      
      component.ejecutarAccionLote('exportar');
      
      expect(component.accionEjecutada.emit).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should call resolucionService.exportarResoluciones', () => {
      mockResolucionService.exportarResoluciones.and.returnValue(of(new Blob()));
      
      component.exportarResoluciones('excel');
      
      expect(mockResolucionService.exportarResoluciones).toHaveBeenCalled();
    });

    it('should set exportando flag during export', () => {
      mockResolucionService.exportarResoluciones.and.returnValue(of(new Blob()));
      
      component.exportarResoluciones('excel');
      
      // Flag should be set during export
      expect(component.exportando()).toBeTruthy();
    });

    it('should show success message after export', (done) => {
      mockResolucionService.exportarResoluciones.and.returnValue(of(new Blob()));
      
      component.exportarResoluciones('excel');
      
      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle export error', (done) => {
      mockResolucionService.exportarResoluciones.and.returnValue(
        new (require('rxjs').throwError)(() => new Error('Export failed'))
      );
      
      component.exportarResoluciones('excel');
      
      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Utility Methods', () => {
    it('should format relative date', () => {
      const today = new Date();
      const result = component.getFechaRelativa(today);
      
      expect(result).toContain('Hoy');
    });

    it('should get estado vigencia', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      
      const result = component.getEstadoVigencia(futureDate);
      expect(result).toBe('vigente');
    });

    it('should get texto vigencia', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      
      const result = component.getTextoVigencia(futureDate);
      expect(result).toContain('días');
    });

    it('should get estado texto', () => {
      expect(component.getEstadoTexto('VIGENTE')).toBe('Vigente');
      expect(component.getEstadoTexto('BORRADOR')).toBe('Borrador');
    });

    it('should track by resolucion id', () => {
      const result = component.trackByResolucion(0, mockResoluciones[0]);
      expect(result).toBe(mockResoluciones[0].id);
    });
  });

  describe('Loading State', () => {
    it('should show loading overlay when cargando is true', () => {
      component.cargando = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const loadingOverlay = compiled.querySelector('.loading-overlay');
      expect(loadingOverlay).toBeTruthy();
    });

    it('should hide loading overlay when cargando is false', () => {
      component.cargando = false;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const loadingOverlay = compiled.querySelector('.loading-overlay');
      expect(loadingOverlay).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should show no results message when data is empty', () => {
      component.resoluciones = [];
      component.cargando = false;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const noResults = compiled.querySelector('.no-results');
      expect(noResults).toBeTruthy();
    });

    it('should not show no results when loading', () => {
      component.resoluciones = [];
      component.cargando = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const noResults = compiled.querySelector('.no-results');
      expect(noResults).toBeFalsy();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
      component.ngOnInit();
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
    });

    it('should show mobile view on mobile breakpoint', () => {
      expect(component.esMobile()).toBeTruthy();
    });

    it('should handle card action', () => {
      spyOn(component.accionEjecutada, 'emit');
      
      component.onAccionCard({
        accion: 'ver',
        resolucion: mockResoluciones[0]
      });
      
      expect(component.accionEjecutada.emit).toHaveBeenCalled();
    });

    it('should handle card selection change', () => {
      component.seleccionMultiple = true;
      
      component.onCardSeleccionChange(mockResoluciones[0], true);
      
      expect(component.seleccion.isSelected(mockResoluciones[0])).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null configuration', () => {
      component.configuracion = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined resoluciones', () => {
      component.resoluciones = undefined as any;
      expect(() => component.ngOnChanges({
        resoluciones: {
          currentValue: undefined,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      })).not.toThrow();
    });

    it('should handle resolucion without empresa', () => {
      const resolucionSinEmpresa = { ...mockResoluciones[1] };
      delete resolucionSinEmpresa.empresa;
      
      component.resoluciones = [resolucionSinEmpresa];
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      component.ngOnInit();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
