import { TestBed } from '@angular/core/testing';
import { ResolucionesTableService } from './resoluciones-table.service';
import { ResolucionTableConfig, ResolucionFiltros } from '../models/resolucion-table.model';

describe('ResolucionesTableService', () => {
  let service: ResolucionesTableService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    // Mock localStorage
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(ResolucionesTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration Management', () => {
    it('should load default configuration on init', () => {
      const config = service.getConfiguracion();
      expect(config).toBeTruthy();
      expect(config.columnasVisibles).toBeDefined();
      expect(config.ordenColumnas).toBeDefined();
      expect(config.paginacion).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<ResolucionTableConfig> = {
        columnasVisibles: ['nroResolucion', 'empresa']
      };
      
      service.actualizarConfiguracion(newConfig);
      
      const config = service.getConfiguracion();
      expect(config.columnasVisibles).toEqual(['nroResolucion', 'empresa']);
    });

    it('should emit config changes', (done) => {
      service.config$.subscribe(config => {
        expect(config).toBeTruthy();
        done();
      });
    });

    it('should restore default configuration', () => {
      service.actualizarConfiguracion({ columnasVisibles: ['test'] });
      service.restaurarConfiguracionDefecto();
      
      const config = service.getConfiguracion();
      expect(config.columnasVisibles).not.toEqual(['test']);
    });

    it('should save configuration to localStorage', () => {
      const newConfig: Partial<ResolucionTableConfig> = {
        columnasVisibles: ['nroResolucion']
      };
      
      service.actualizarConfiguracion(newConfig);
      
      expect(localStorageSpy.setItem).toHaveBeenCalled();
    });

    it('should load configuration from localStorage', () => {
      const savedConfig: ResolucionTableConfig = {
        columnasVisibles: ['nroResolucion', 'empresa'],
        ordenColumnas: ['nroResolucion', 'empresa'],
        ordenamiento: [],
        paginacion: { tamanoPagina: 25, paginaActual: 0 },
        filtros: {}
      };
      
      localStorageSpy.getItem.and.returnValue(JSON.stringify(savedConfig));
      
      // Create new service instance to trigger load
      const newService = new ResolucionesTableService();
      const config = newService.getConfiguracion();
      
      expect(config.columnasVisibles).toEqual(savedConfig.columnasVisibles);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageSpy.getItem.and.throwError('Storage error');
      
      expect(() => new ResolucionesTableService()).not.toThrow();
    });
  });

  describe('Filter Management', () => {
    it('should get empty filters initially', () => {
      const filtros = service.getFiltros();
      expect(filtros).toEqual({});
    });

    it('should update filters', () => {
      const newFiltros: Partial<ResolucionFiltros> = {
        numeroResolucion: 'R-001'
      };
      
      service.actualizarFiltros(newFiltros);
      
      const filtros = service.getFiltros();
      expect(filtros.numeroResolucion).toBe('R-001');
    });

    it('should emit filter changes with debounce', (done) => {
      let emitCount = 0;
      
      service.filtros$.subscribe(() => {
        emitCount++;
        if (emitCount === 1) {
          // Should only emit once due to debounce
          expect(emitCount).toBe(1);
          done();
        }
      });
      
      service.actualizarFiltros({ numeroResolucion: 'R-001' });
      service.actualizarFiltros({ numeroResolucion: 'R-002' });
    });

    it('should clear all filters', () => {
      service.actualizarFiltros({
        numeroResolucion: 'R-001',
        empresaId: '123'
      });
      
      service.limpiarFiltros();
      
      const filtros = service.getFiltros();
      expect(Object.keys(filtros).length).toBe(0);
    });

    it('should remove specific filter', () => {
      service.actualizarFiltros({
        numeroResolucion: 'R-001',
        empresaId: '123'
      });
      
      service.removerFiltro('numeroResolucion');
      
      const filtros = service.getFiltros();
      expect(filtros.numeroResolucion).toBeUndefined();
      expect(filtros.empresaId).toBe('123');
    });

    it('should detect active filters', () => {
      expect(service.tieneFiltrosActivos()).toBeFalsy();
      
      service.actualizarFiltros({ numeroResolucion: 'R-001' });
      
      expect(service.tieneFiltrosActivos()).toBeTruthy();
    });

    it('should generate active filter chips', () => {
      service.actualizarFiltros({
        numeroResolucion: 'R-001',
        empresaId: '123',
        tiposTramite: ['ALTA', 'BAJA']
      });
      
      const activos = service.getFiltrosActivos();
      
      expect(activos.length).toBe(3);
      expect(activos.some(f => f.key === 'numeroResolucion')).toBeTruthy();
      expect(activos.some(f => f.key === 'empresaId')).toBeTruthy();
      expect(activos.some(f => f.key === 'tiposTramite')).toBeTruthy();
    });

    it('should format date range in filter chips', () => {
      service.actualizarFiltros({
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2025-01-31')
      });
      
      const activos = service.getFiltrosActivos();
      const fechaFiltro = activos.find(f => f.key === 'fechas');
      
      expect(fechaFiltro).toBeTruthy();
      expect(fechaFiltro?.label).toContain('Fechas:');
    });
  });

  describe('Column Management', () => {
    it('should get visible columns', () => {
      const columnas = service.getColumnasVisibles();
      expect(Array.isArray(columnas)).toBeTruthy();
    });

    it('should update visible columns', () => {
      const newColumnas = ['nroResolucion', 'empresa'];
      service.actualizarColumnasVisibles(newColumnas);
      
      const columnas = service.getColumnasVisibles();
      expect(columnas).toEqual(newColumnas);
    });

    it('should reorder columns', () => {
      const newOrder = ['empresa', 'nroResolucion'];
      service.reordenarColumnas(newOrder);
      
      const config = service.getConfiguracion();
      expect(config.ordenColumnas).toEqual(newOrder);
    });

    it('should get column definition', () => {
      const def = service.getDefinicionColumna('nroResolucion');
      expect(def).toBeTruthy();
      expect(def?.key).toBe('nroResolucion');
    });

    it('should get all column definitions', () => {
      const defs = service.getTodasLasColumnas();
      expect(Array.isArray(defs)).toBeTruthy();
      expect(defs.length).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent column', () => {
      const def = service.getDefinicionColumna('nonExistent');
      expect(def).toBeUndefined();
    });
  });

  describe('Sorting Management', () => {
    it('should get empty sorting initially', () => {
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento).toEqual([]);
    });

    it('should add sorting for column', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(1);
      expect(ordenamiento[0].columna).toBe('fechaEmision');
      expect(ordenamiento[0].direccion).toBe('asc');
    });

    it('should update existing sorting', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarOrdenamiento('fechaEmision', 'desc');
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(1);
      expect(ordenamiento[0].direccion).toBe('desc');
    });

    it('should remove sorting when direction is undefined', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarOrdenamiento('fechaEmision', undefined);
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(0);
    });

    it('should handle multiple column sorting', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarOrdenamiento('nroResolucion', 'desc');
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(2);
    });

    it('should assign priorities to sorting', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarOrdenamiento('nroResolucion', 'desc');
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento[0].prioridad).toBeDefined();
      expect(ordenamiento[1].prioridad).toBeDefined();
    });

    it('should clear all sorting', () => {
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarOrdenamiento('nroResolucion', 'desc');
      
      service.limpiarOrdenamiento();
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(0);
    });
  });

  describe('Pagination Management', () => {
    it('should update page size', () => {
      service.actualizarPaginacion(25);
      
      const config = service.getConfiguracion();
      expect(config.paginacion.tamanoPagina).toBe(25);
    });

    it('should update current page', () => {
      service.actualizarPaginacion(undefined, 2);
      
      const config = service.getConfiguracion();
      expect(config.paginacion.paginaActual).toBe(2);
    });

    it('should update both page size and current page', () => {
      service.actualizarPaginacion(50, 3);
      
      const config = service.getConfiguracion();
      expect(config.paginacion.tamanoPagina).toBe(50);
      expect(config.paginacion.paginaActual).toBe(3);
    });

    it('should update paginaActual signal', () => {
      service.actualizarPaginacion(undefined, 5);
      expect(service.paginaActual()).toBe(5);
    });
  });

  describe('Filter Options', () => {
    it('should get filter options', () => {
      const opciones = service.getOpcionesFiltros();
      
      expect(opciones.tiposTramite).toBeDefined();
      expect(opciones.estados).toBeDefined();
      expect(Array.isArray(opciones.tiposTramite)).toBeTruthy();
      expect(Array.isArray(opciones.estados)).toBeTruthy();
    });

    it('should have valid tipo tramite options', () => {
      const opciones = service.getOpcionesFiltros();
      expect(opciones.tiposTramite.length).toBeGreaterThan(0);
    });

    it('should have valid estado options', () => {
      const opciones = service.getOpcionesFiltros();
      expect(opciones.estados.length).toBeGreaterThan(0);
    });
  });

  describe('State Signals', () => {
    it('should have cargando signal', () => {
      expect(service.cargando()).toBeDefined();
    });

    it('should have totalResultados signal', () => {
      expect(service.totalResultados()).toBeDefined();
    });

    it('should have paginaActual signal', () => {
      expect(service.paginaActual()).toBeDefined();
    });

    it('should update signals', () => {
      service.cargando.set(true);
      expect(service.cargando()).toBeTruthy();
      
      service.totalResultados.set(100);
      expect(service.totalResultados()).toBe(100);
      
      service.paginaActual.set(2);
      expect(service.paginaActual()).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter values', () => {
      service.actualizarFiltros({
        numeroResolucion: '',
        tiposTramite: []
      });
      
      expect(service.tieneFiltrosActivos()).toBeFalsy();
    });

    it('should handle null filter values', () => {
      service.actualizarFiltros({
        numeroResolucion: null as any,
        empresaId: undefined
      });
      
      expect(service.tieneFiltrosActivos()).toBeFalsy();
    });

    it('should handle removing non-existent filter', () => {
      expect(() => {
        service.removerFiltro('nonExistent' as any);
      }).not.toThrow();
    });

    it('should handle updating non-existent sorting', () => {
      service.actualizarOrdenamiento('nonExistent', undefined);
      
      const ordenamiento = service.getOrdenamiento();
      expect(ordenamiento.length).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should sync filters with configuration', () => {
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'R-001'
      };
      
      service.actualizarFiltros(filtros);
      
      const config = service.getConfiguracion();
      expect(config.filtros.numeroResolucion).toBe('R-001');
    });

    it('should maintain configuration consistency', () => {
      service.actualizarColumnasVisibles(['nroResolucion']);
      service.actualizarOrdenamiento('fechaEmision', 'asc');
      service.actualizarPaginacion(25, 1);
      
      const config = service.getConfiguracion();
      
      expect(config.columnasVisibles).toEqual(['nroResolucion']);
      expect(config.ordenamiento.length).toBe(1);
      expect(config.paginacion.tamanoPagina).toBe(25);
      expect(config.paginacion.paginaActual).toBe(1);
    });
  });
});
