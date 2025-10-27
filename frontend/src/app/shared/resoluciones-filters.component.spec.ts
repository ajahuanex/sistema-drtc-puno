import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { ResolucionesFiltersComponent } from './resoluciones-filters.component';
import { ResolucionFiltros } from '../models/resolucion-table.model';

describe('ResolucionesFiltersComponent', () => {
  let component: ResolucionesFiltersComponent;
  let fixture: ComponentFixture<ResolucionesFiltersComponent>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
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

  it('should initialize with empty filters', () => {
    expect(component.contadorFiltros()).toBe(0);
    expect(component.filtrosActivos()).toEqual([]);
  });

  it('should update filter count when filters are applied', () => {
    const filtros: ResolucionFiltros = {
      numeroResolucion: 'R-001',
      empresaId: '1'
    };
    
    component.filtros = filtros;
    component.ngOnInit();
    
    expect(component.contadorFiltros()).toBeGreaterThan(0);
  });

  it('should emit filtrosChange when filters are applied', () => {
    spyOn(component.filtrosChange, 'emit');
    
    component.aplicarFiltros();
    
    expect(component.filtrosChange.emit).toHaveBeenCalled();
  });

  it('should clear all filters when limpiarTodosFiltros is called', () => {
    spyOn(component.limpiarFiltros, 'emit');
    
    component.limpiarTodosFiltros();
    
    expect(component.limpiarFiltros.emit).toHaveBeenCalled();
    expect(component.contadorFiltros()).toBe(0);
  });

  it('should remove specific filter when removerFiltro is called', () => {
    // Set up initial filters
    component.filtrosForm.patchValue({
      numeroResolucion: 'R-001',
      empresaId: '1'
    });
    
    spyOn(component.filtrosChange, 'emit');
    
    component.removerFiltro('numeroResolucion');
    
    expect(component.filtrosForm.get('numeroResolucion')?.value).toBe('');
    expect(component.filtrosChange.emit).toHaveBeenCalled();
  });
});