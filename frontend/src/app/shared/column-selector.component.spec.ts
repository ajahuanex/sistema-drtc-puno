import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ColumnSelectorComponent, ColumnaSeleccionable } from './column-selector.component';
import { ColumnaDefinicion } from '../models/resolucion-table.model';

describe('ColumnSelectorComponent', () => {
  let component: ColumnSelectorComponent;
  let fixture: ComponentFixture<ColumnSelectorComponent>;

  const mockColumnas: ColumnaDefinicion[] = [
    { key: 'nroResolucion', label: 'Número', sortable: true, required: true, tipo: 'text' },
    { key: 'empresa', label: 'Empresa', sortable: true, required: true, tipo: 'empresa' },
    { key: 'tipoTramite', label: 'Tipo', sortable: true, required: false, tipo: 'badge' },
    { key: 'fechaEmision', label: 'Fecha', sortable: true, required: false, tipo: 'date' },
    { key: 'estado', label: 'Estado', sortable: true, required: false, tipo: 'badge' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ColumnSelectorComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with provided columns', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = ['nroResolucion', 'empresa', 'tipoTramite'];
      
      component.ngOnInit();
      
      const columnas = component.columnasOrdenadas();
      expect(columnas.length).toBe(mockColumnas.length);
    });

    it('should mark visible columns correctly', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = [];
      
      component.ngOnInit();
      
      const columnas = component.columnasOrdenadas();
      const visibles = columnas.filter(c => c.visible);
      expect(visibles.length).toBe(2);
      expect(visibles.every(c => ['nroResolucion', 'empresa'].includes(c.key))).toBeTruthy();
    });

    it('should use default order if ordenColumnas is empty', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = [];
      component.ordenColumnas = [];
      
      component.ngOnInit();
      
      const columnas = component.columnasOrdenadas();
      expect(columnas.length).toBe(mockColumnas.length);
      expect(columnas[0].key).toBe(mockColumnas[0].key);
    });

    it('should update visible counter on init', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa', 'tipoTramite'];
      component.ordenColumnas = [];
      
      component.ngOnInit();
      
      expect(component.contadorVisibles()).toBe(3);
    });
  });

  describe('Column Toggle', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should toggle column visibility', () => {
      component.onColumnToggle('tipoTramite', true);
      
      const columnas = component.columnasOrdenadas();
      const columna = columnas.find(c => c.key === 'tipoTramite');
      expect(columna?.visible).toBeTruthy();
    });

    it('should update counter when toggling column', () => {
      const initialCount = component.contadorVisibles();
      
      component.onColumnToggle('tipoTramite', true);
      
      expect(component.contadorVisibles()).toBe(initialCount + 1);
    });

    it('should handle toggling non-existent column gracefully', () => {
      expect(() => {
        component.onColumnToggle('nonExistent', true);
      }).not.toThrow();
    });
  });

  describe('Column Reordering', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa', 'tipoTramite'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should reorder columns on drop', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2
      } as CdkDragDrop<ColumnaSeleccionable[]>;
      
      const initialFirst = component.columnasOrdenadas()[0].key;
      
      component.onColumnDrop(event);
      
      const columnas = component.columnasOrdenadas();
      expect(columnas[2].key).toBe(initialFirst);
    });

    it('should update orden property after reordering', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2
      } as CdkDragDrop<ColumnaSeleccionable[]>;
      
      component.onColumnDrop(event);
      
      const columnas = component.columnasOrdenadas();
      columnas.forEach((columna, index) => {
        expect(columna.orden).toBe(index);
      });
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should show all columns when mostrarTodas is called', () => {
      component.mostrarTodas();
      
      const columnas = component.columnasOrdenadas();
      expect(columnas.every(c => c.visible)).toBeTruthy();
      expect(component.contadorVisibles()).toBe(mockColumnas.length);
    });

    it('should show only required columns when mostrarMinimas is called', () => {
      component.mostrarMinimas();
      
      const columnas = component.columnasOrdenadas();
      const visibles = columnas.filter(c => c.visible);
      expect(visibles.every(c => c.required)).toBeTruthy();
    });

    it('should restore default configuration', () => {
      component.onColumnToggle('tipoTramite', true);
      component.onColumnToggle('fechaEmision', true);
      
      component.restaurarDefecto();
      
      expect(component.contadorVisibles()).toBe(2); // Back to initial state
    });
  });

  describe('State Detection', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should detect when all columns are visible', () => {
      component.mostrarTodas();
      expect(component.todasVisibles()).toBeTruthy();
    });

    it('should detect when only minimal columns are visible', () => {
      component.mostrarMinimas();
      expect(component.soloMinimas()).toBeTruthy();
    });

    it('should detect changes from initial state', () => {
      expect(component.hayCambios()).toBeFalsy();
      
      component.onColumnToggle('tipoTramite', true);
      
      expect(component.hayCambios()).toBeTruthy();
    });

    it('should not detect changes after applying', () => {
      component.onColumnToggle('tipoTramite', true);
      expect(component.hayCambios()).toBeTruthy();
      
      component.aplicarCambios();
      
      expect(component.hayCambios()).toBeFalsy();
    });
  });

  describe('Apply Changes', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'empresa'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should emit columnasChange when applying changes', () => {
      spyOn(component.columnasChange, 'emit');
      
      component.onColumnToggle('tipoTramite', true);
      component.aplicarCambios();
      
      expect(component.columnasChange.emit).toHaveBeenCalled();
    });

    it('should emit ordenChange when applying changes', () => {
      spyOn(component.ordenChange, 'emit');
      
      component.aplicarCambios();
      
      expect(component.ordenChange.emit).toHaveBeenCalled();
    });

    it('should emit correct visible columns', () => {
      spyOn(component.columnasChange, 'emit');
      
      component.onColumnToggle('tipoTramite', true);
      component.aplicarCambios();
      
      const emittedValue = (component.columnasChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue).toContain('tipoTramite');
    });

    it('should emit correct column order', () => {
      spyOn(component.ordenChange, 'emit');
      
      const event = {
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<ColumnaSeleccionable[]>;
      
      component.onColumnDrop(event);
      component.aplicarCambios();
      
      const emittedValue = (component.ordenChange.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(Array.isArray(emittedValue)).toBeTruthy();
      expect(emittedValue.length).toBe(mockColumnas.length);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = [];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should return correct type text', () => {
      expect(component.getTipoTexto('text')).toBe('Texto');
      expect(component.getTipoTexto('date')).toBe('Fecha');
      expect(component.getTipoTexto('badge')).toBe('Estado');
      expect(component.getTipoTexto('actions')).toBe('Acciones');
      expect(component.getTipoTexto('empresa')).toBe('Empresa');
    });

    it('should return original type for unknown types', () => {
      expect(component.getTipoTexto('unknown')).toBe('unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      component.columnas = [];
      component.columnasVisibles = [];
      component.ordenColumnas = [];
      
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.columnasOrdenadas().length).toBe(0);
    });

    it('should handle columns not in order list', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion'];
      component.ordenColumnas = ['nroResolucion', 'empresa']; // Missing some columns
      
      component.ngOnInit();
      
      const columnas = component.columnasOrdenadas();
      expect(columnas.length).toBe(mockColumnas.length);
    });

    it('should handle invalid column keys in visible list', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion', 'invalidKey'];
      component.ordenColumnas = [];
      
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should preserve required columns visibility', () => {
      component.columnas = mockColumnas;
      component.columnasVisibles = mockColumnas.map(c => c.key);
      component.ordenColumnas = [];
      component.ngOnInit();
      
      component.mostrarMinimas();
      
      const columnas = component.columnasOrdenadas();
      const requiredColumns = columnas.filter(c => c.required);
      expect(requiredColumns.every(c => c.visible)).toBeTruthy();
    });
  });

  describe('Counter Updates', () => {
    beforeEach(() => {
      component.columnas = mockColumnas;
      component.columnasVisibles = ['nroResolucion'];
      component.ordenColumnas = [];
      component.ngOnInit();
    });

    it('should update counter when showing all', () => {
      component.mostrarTodas();
      expect(component.contadorVisibles()).toBe(mockColumnas.length);
    });

    it('should update counter when showing minimal', () => {
      component.mostrarMinimas();
      const requiredCount = mockColumnas.filter(c => c.required).length;
      expect(component.contadorVisibles()).toBe(requiredCount);
    });

    it('should maintain accurate counter through multiple operations', () => {
      component.onColumnToggle('empresa', true);
      expect(component.contadorVisibles()).toBe(2);
      
      component.onColumnToggle('tipoTramite', true);
      expect(component.contadorVisibles()).toBe(3);
      
      component.onColumnToggle('empresa', false);
      expect(component.contadorVisibles()).toBe(2);
    });
  });
});
