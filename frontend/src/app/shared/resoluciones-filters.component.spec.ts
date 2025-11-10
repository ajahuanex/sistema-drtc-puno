import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ResolucionesFiltersComponent } from './resoluciones-filters.component';
import { ResolucionFiltros } from '../models/resolucion-table.model';

describe('ResolucionesFiltersComponent', () => {
  let component: ResolucionesFiltersComponent;
  let fixture: ComponentFixture<ResolucionesFiltersComponent>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    breakpointSpy.observe.and.returnValue(of({ matches: false, breakpoints: {} }));
    
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ResolucionesFiltersComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BreakpointObserver, useValue: breakpointSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResolucionesFiltersComponent);
    component = fixture.componentInstance;
    mockBreakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty filters', () => {
      fixture.detectChanges();
      expect(component.contadorFiltros()).toBe(0);
      expect(component.filtrosActivos()).toEqual([]);
    });

    it('should initialize form with empty values', () => {
      fixture.detectChanges();
      expect(component.filtrosForm.get('numeroResolucion')?.value).toBe('');
      expect(component.filtrosForm.get('empresaId')?.value).toBe('');
      expect(component.filtrosForm.get('tiposTramite')?.value).toEqual([]);
      expect(component.filtrosForm.get('estados')?.value).toEqual([]);
      expect(component.filtrosForm.get('activo')?.value).toBeNull();
    });

    it('should set panel expanded state from input', () => {
      component.expandidoPorDefecto = true;
      component.ngOnInit();
      expect(component.panelExpandido()).toBeTruthy();
    });

    it('should detect mobile breakpoint', () => {
      mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
      component.ngOnInit();
      expect(component.esMobile()).toBeTruthy();
    });
  });

  describe('Filter Loading', () => {
    it('should load filters from input', () => {
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'R-001',
        empresaId: '123',
        tiposTramite: ['ALTA'],
        estados: ['VIGENTE'],
        activo: true
      };
      
      component.filtros = filtros;
      component.ngOnInit();
      
      expect(component.filtrosForm.get('numeroResolucion')?.value).toBe('R-001');
      expect(component.filtrosForm.get('empresaId')?.value).toBe('123');
      expect(component.filtrosForm.get('tiposTramite')?.value).toEqual(['ALTA']);
      expect(component.filtrosForm.get('estados')?.value).toEqual(['VIGENTE']);
      expect(component.filtrosForm.get('activo')?.value).toBe(true);
    });

    it('should load date range filters', () => {
      const fechaInicio = new Date('2025-01-01');
      const fechaFin = new Date('2025-01-31');
      
      const filtros: ResolucionFiltros = {
        fechaInicio,
        fechaFin
      };
      
      component.filtros = filtros;
      component.ngOnInit();
      
      const rangoValue = component.rangoFechasControl.value;
      expect(rangoValue.inicio).toEqual(fechaInicio);
      expect(rangoValue.fin).toEqual(fechaFin);
    });
  });

  describe('Filter Count and Active Filters', () => {
    it('should update filter count when filters are applied', fakeAsync(() => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001',
        empresaId: '123'
      });
      
      tick(350); // Wait for debounce
      
      expect(component.contadorFiltros()).toBe(2);
    }));

    it('should generate active filter chips', fakeAsync(() => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001',
        tiposTramite: ['ALTA', 'BAJA']
      });
      
      tick(350);
      
      const activos = component.filtrosActivos();
      expect(activos.length).toBe(2);
      expect(activos.some(f => f.key === 'numeroResolucion')).toBeTruthy();
      expect(activos.some(f => f.key === 'tiposTramite')).toBeTruthy();
    }));

    it('should include all filter types in active filters', fakeAsync(() => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001',
        empresaId: '123',
        tiposTramite: ['ALTA'],
        estados: ['VIGENTE'],
        activo: true
      });
      
      component.rangoFechasControl.setValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });
      
      tick(350);
      
      expect(component.contadorFiltros()).toBe(6);
    }));
  });

  describe('Filter Application', () => {
    it('should emit filtrosChange when filters are applied', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001'
      });
      
      component.aplicarFiltros();
      
      expect(component.filtrosChange.emit).toHaveBeenCalled();
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.numeroResolucion).toBe('R-001');
    });

    it('should mark form as pristine after applying filters', () => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001'
      });
      
      expect(component.filtrosForm.dirty).toBeTruthy();
      
      component.aplicarFiltros();
      
      expect(component.filtrosForm.pristine).toBeTruthy();
    });

    it('should trim whitespace from text filters', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: '  R-001  '
      });
      
      component.aplicarFiltros();
      
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.numeroResolucion).toBe('R-001');
    });
  });

  describe('Filter Clearing', () => {
    it('should clear all filters when limpiarTodosFiltros is called', () => {
      spyOn(component.limpiarFiltros, 'emit');
      spyOn(component.filtrosChange, 'emit');
      
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001',
        empresaId: '123'
      });
      
      component.limpiarTodosFiltros();
      
      expect(component.limpiarFiltros.emit).toHaveBeenCalled();
      expect(component.filtrosChange.emit).toHaveBeenCalledWith({});
      expect(component.filtrosForm.get('numeroResolucion')?.value).toBe('');
      expect(component.filtrosForm.get('empresaId')?.value).toBe('');
    });

    it('should clear date range when clearing all filters', () => {
      component.ngOnInit();
      
      component.rangoFechasControl.setValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });
      
      component.limpiarTodosFiltros();
      
      expect(component.rangoFechasControl.value).toBeNull();
    });

    it('should remove specific filter when removerFiltro is called', fakeAsync(() => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001',
        empresaId: '123'
      });
      
      component.removerFiltro('numeroResolucion');
      tick(150);
      
      expect(component.filtrosForm.get('numeroResolucion')?.value).toBe('');
      expect(component.filtrosChange.emit).toHaveBeenCalled();
    }));

    it('should remove date range filter', fakeAsync(() => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.rangoFechasControl.setValue({
        inicio: new Date('2025-01-01'),
        fin: new Date('2025-01-31')
      });
      
      component.removerFiltro('fechas');
      tick(150);
      
      expect(component.rangoFechasControl.value).toBeNull();
      expect(component.filtrosChange.emit).toHaveBeenCalled();
    }));

    it('should remove array filters', fakeAsync(() => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        tiposTramite: ['ALTA', 'BAJA']
      });
      
      component.removerFiltro('tiposTramite');
      tick(150);
      
      expect(component.filtrosForm.get('tiposTramite')?.value).toEqual([]);
    }));
  });

  describe('Quick Filters', () => {
    it('should apply "vigentes" quick filter', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.aplicarFiltroRapido('vigentes');
      
      expect(component.filtrosChange.emit).toHaveBeenCalled();
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.estados).toEqual(['VIGENTE']);
    });

    it('should apply "activos" quick filter', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.aplicarFiltroRapido('activos');
      
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.activo).toBe(true);
    });

    it('should apply "recientes" quick filter with date range', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.aplicarFiltroRapido('recientes');
      
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.fechaInicio).toBeTruthy();
      expect(emittedValue.fechaFin).toBeTruthy();
    });

    it('should apply "proximos-vencer" quick filter', () => {
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.aplicarFiltroRapido('proximos-vencer');
      
      const emittedValue = (component.filtrosChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.estados).toEqual(['VIGENTE']);
      expect(emittedValue.fechaInicio).toBeTruthy();
      expect(emittedValue.fechaFin).toBeTruthy();
    });
  });

  describe('Mobile Functionality', () => {
    it('should open mobile filters dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      
      component.ngOnInit();
      component.abrirFiltrosMobile();
      
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should apply filters from mobile dialog', () => {
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'R-001'
      };
      
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(filtros));
      mockDialog.open.and.returnValue(dialogRefSpy);
      
      spyOn(component.filtrosChange, 'emit');
      component.ngOnInit();
      
      component.abrirFiltrosMobile();
      
      expect(component.filtrosChange.emit).toHaveBeenCalledWith(filtros);
    });
  });

  describe('Event Handlers', () => {
    it('should handle panel toggle', () => {
      component.ngOnInit();
      
      component.onPanelToggle(true);
      expect(component.panelExpandido()).toBeTruthy();
      
      component.onPanelToggle(false);
      expect(component.panelExpandido()).toBeFalsy();
    });

    it('should handle empresa change', () => {
      component.ngOnInit();
      
      component.onEmpresaChange('123');
      
      expect(component.filtrosForm.get('empresaId')?.value).toBe('123');
    });

    it('should handle empresa selection', () => {
      component.ngOnInit();
      
      const empresa = { id: '123', razonSocial: { principal: 'Test SA' } };
      component.onEmpresaSeleccionada(empresa);
      
      // Should not throw error
      expect(component).toBeTruthy();
    });
  });

  describe('Utility Methods', () => {
    it('should return true for tieneFiltrosActivos when filters exist', fakeAsync(() => {
      component.ngOnInit();
      
      component.filtrosForm.patchValue({
        numeroResolucion: 'R-001'
      });
      
      tick(350);
      
      expect(component.tieneFiltrosActivos()).toBeTruthy();
    }));

    it('should return false for tieneFiltrosActivos when no filters', () => {
      component.ngOnInit();
      expect(component.tieneFiltrosActivos()).toBeFalsy();
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