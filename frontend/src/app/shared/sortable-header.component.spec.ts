import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SortableHeaderComponent, EventoOrdenamiento } from './sortable-header.component';
import { OrdenamientoColumna } from '../models/resolucion-table.model';

describe('SortableHeaderComponent', () => {
  let component: SortableHeaderComponent;
  let fixture: ComponentFixture<SortableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SortableHeaderComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SortableHeaderComponent);
    component = fixture.componentInstance;
    component.columna = 'fechaEmision';
    component.label = 'Fecha de Emisión';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with provided column and label', () => {
      expect(component.columna).toBe('fechaEmision');
      expect(component.label).toBe('Fecha de Emisión');
    });

    it('should be sortable by default', () => {
      expect(component.sortable).toBeTruthy();
    });

    it('should allow multiple sorting by default', () => {
      expect(component.permitirMultiple).toBeTruthy();
    });

    it('should start with no sorting', () => {
      expect(component.direccionActual()).toBeNull();
      expect(component.estOrdenado()).toBeFalsy();
    });
  });

  describe('Sorting State', () => {
    it('should detect ascending sort', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      fixture.detectChanges();
      
      expect(component.direccionActual()).toBe('asc');
      expect(component.estOrdenado()).toBeTruthy();
    });

    it('should detect descending sort', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      fixture.detectChanges();
      
      expect(component.direccionActual()).toBe('desc');
      expect(component.estOrdenado()).toBeTruthy();
    });

    it('should detect no sort', () => {
      component.ordenamiento = [];
      fixture.detectChanges();
      
      expect(component.direccionActual()).toBeNull();
      expect(component.estOrdenado()).toBeFalsy();
    });

    it('should get correct priority', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 2 }
      ];
      fixture.detectChanges();
      
      expect(component.prioridadOrdenamiento()).toBe(2);
    });

    it('should detect multiple sorting', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 },
        { columna: 'nroResolucion', direccion: 'desc', prioridad: 2 }
      ];
      fixture.detectChanges();
      
      expect(component.esOrdenamientoMultiple()).toBeTruthy();
    });
  });

  describe('Click Handling', () => {
    it('should emit ordenamientoChange on click', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      expect(component.ordenamientoChange.emit).toHaveBeenCalled();
    });

    it('should cycle from null to asc', () => {
      spyOn(component.ordenamientoChange, 'emit');
      component.ordenamiento = [];
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.direccion).toBe('asc');
    });

    it('should cycle from asc to desc', () => {
      spyOn(component.ordenamientoChange, 'emit');
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.direccion).toBe('desc');
    });

    it('should cycle from desc to null', () => {
      spyOn(component.ordenamientoChange, 'emit');
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.direccion).toBeNull();
    });

    it('should not emit when not sortable', () => {
      spyOn(component.ordenamientoChange, 'emit');
      component.sortable = false;
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      expect(component.ordenamientoChange.emit).not.toHaveBeenCalled();
    });

    it('should detect ctrl key for multiple sort', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new MouseEvent('click', { ctrlKey: true });
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.esMultiple).toBeTruthy();
    });

    it('should emit column key', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new MouseEvent('click');
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.columna).toBe('fechaEmision');
    });
  });

  describe('Keyboard Handling', () => {
    it('should handle Enter key', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onHeaderClick(event);
      
      expect(component.ordenamientoChange.emit).toHaveBeenCalled();
    });

    it('should handle Space key', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new KeyboardEvent('keydown', { key: ' ' });
      component.onHeaderClick(event);
      
      expect(component.ordenamientoChange.emit).toHaveBeenCalled();
    });

    it('should detect ctrl key in keyboard events', () => {
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.esMultiple).toBeTruthy();
    });
  });

  describe('Tooltip Generation', () => {
    it('should generate tooltip for unsorted column', () => {
      component.ordenamiento = [];
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('Ordenar por');
      expect(tooltip).toContain('ascendente');
    });

    it('should generate tooltip for asc sorted column', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('descendente');
    });

    it('should generate tooltip for desc sorted column', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('Quitar ordenamiento');
    });

    it('should include priority in tooltip for multiple sort', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 2 },
        { columna: 'nroResolucion', direccion: 'desc', prioridad: 1 }
      ];
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('prioridad');
    });

    it('should show not sortable message when disabled', () => {
      component.sortable = false;
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('no es ordenable');
    });

    it('should include ctrl+click hint when multiple sort allowed', () => {
      component.permitirMultiple = true;
      const tooltip = component.getTooltip();
      
      expect(tooltip).toContain('Ctrl+click');
    });
  });

  describe('Accessibility', () => {
    it('should generate correct aria-label', () => {
      component.ordenamiento = [];
      const ariaLabel = component.getAriaLabel();
      
      expect(ariaLabel).toContain(component.label);
      expect(ariaLabel).toContain('sin ordenar');
    });

    it('should generate aria-label for sorted column', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      const ariaLabel = component.getAriaLabel();
      
      expect(ariaLabel).toContain('ordenado ascendente');
    });

    it('should include priority in aria-label', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 2 }
      ];
      const ariaLabel = component.getAriaLabel();
      
      expect(ariaLabel).toContain('prioridad 2');
    });

    it('should generate correct aria-sort value', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      expect(component.getAriaSort()).toBe('ascending');
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      expect(component.getAriaSort()).toBe('descending');
      
      component.ordenamiento = [];
      expect(component.getAriaSort()).toBe('none');
    });
  });

  describe('State Methods', () => {
    it('should get correct estado ordenamiento text', () => {
      component.ordenamiento = [];
      expect(component.getEstadoOrdenamiento()).toBe('Sin ordenar');
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      expect(component.getEstadoOrdenamiento()).toBe('Ascendente');
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      expect(component.getEstadoOrdenamiento()).toBe('Descendente');
    });

    it('should include priority in estado text', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 2 }
      ];
      const estado = component.getEstadoOrdenamiento();
      
      expect(estado).toContain('(2)');
    });

    it('should detect maximum priority', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 },
        { columna: 'nroResolucion', direccion: 'desc', prioridad: 2 }
      ];
      
      expect(component.esPrioridadMaxima()).toBeFalsy();
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 2 },
        { columna: 'nroResolucion', direccion: 'desc', prioridad: 1 }
      ];
      
      expect(component.esPrioridadMaxima()).toBeTruthy();
    });

    it('should get next state correctly', () => {
      component.ordenamiento = [];
      expect(component.getSiguienteEstado()).toBe('asc');
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      expect(component.getSiguienteEstado()).toBe('desc');
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'desc', prioridad: 1 }
      ];
      expect(component.getSiguienteEstado()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ordenamiento array', () => {
      component.ordenamiento = [];
      
      expect(component.direccionActual()).toBeNull();
      expect(component.prioridadOrdenamiento()).toBe(0);
      expect(component.estOrdenado()).toBeFalsy();
    });

    it('should handle ordenamiento for different column', () => {
      component.ordenamiento = [
        { columna: 'nroResolucion', direccion: 'asc', prioridad: 1 }
      ];
      
      expect(component.direccionActual()).toBeNull();
      expect(component.estOrdenado()).toBeFalsy();
    });

    it('should handle multiple ordenamiento without current column', () => {
      component.ordenamiento = [
        { columna: 'nroResolucion', direccion: 'asc', prioridad: 1 },
        { columna: 'empresa', direccion: 'desc', prioridad: 2 }
      ];
      
      expect(component.direccionActual()).toBeNull();
      expect(component.esOrdenamientoMultiple()).toBeTruthy();
    });

    it('should prevent event propagation', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onHeaderClick(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Multiple Sorting', () => {
    it('should not allow multiple sort when disabled', () => {
      component.permitirMultiple = false;
      spyOn(component.ordenamientoChange, 'emit');
      
      const event = new MouseEvent('click', { ctrlKey: true });
      component.onHeaderClick(event);
      
      const emittedValue: EventoOrdenamiento = (component.ordenamientoChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.esMultiple).toBeFalsy();
    });

    it('should show single sort tooltip when multiple disabled', () => {
      component.permitirMultiple = false;
      const tooltip = component.getTooltip();
      
      expect(tooltip).not.toContain('Ctrl+click');
    });
  });

  describe('Computed Signals', () => {
    it('should update computed values when ordenamiento changes', () => {
      component.ordenamiento = [];
      expect(component.direccionActual()).toBeNull();
      
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      fixture.detectChanges();
      
      expect(component.direccionActual()).toBe('asc');
    });

    it('should update ordenamientoActual when ordenamiento changes', () => {
      component.ordenamiento = [
        { columna: 'fechaEmision', direccion: 'asc', prioridad: 1 }
      ];
      fixture.detectChanges();
      
      const actual = component.ordenamientoActual();
      expect(actual).toBeTruthy();
      expect(actual?.columna).toBe('fechaEmision');
    });
  });
});
