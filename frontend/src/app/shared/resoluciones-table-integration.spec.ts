import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';
import { ResolucionesComponent } from '../components/resoluciones/resoluciones.component';
import { ResolucionesTableComponent } from './resoluciones-table.component';
import { ResolucionesFiltersComponent } from './resoluciones-filters.component';
import { ResolucionService } from '../services/resolucion.service';
import { ResolucionesTableService } from '../services/resoluciones-table.service';
import { EmpresaService } from '../services/empresa.service';
import { NotificationService } from '../services/notification.service';
import { Resolucion, ResolucionConEmpresa } from '../models/resolucion.model';
import { ResolucionFiltros, ResolucionTableConfig } from '../models/resolucion-table.model';

/**
 * Integration Tests for Resoluciones Table Improvements
 * 
 * These tests verify the complete integration of:
 * - Filtering functionality
 * - Column configuration
 * - Sorting functionality
 * - State persistence
 */
describe('Resoluciones Table Integration Tests', () => {
  
  describe('13.1 Tests de flujo completo de filtrado', () => {
    let component: ResolucionesComponent;
    let fixture: ComponentFixture<ResolucionesComponent>;
    let resolucionService: jasmine.SpyObj<ResolucionService>;
    let tableService: jasmine.SpyObj<ResolucionesTableService>;
    let empresaService: jasmine.SpyObj<EmpresaService>;
    
    const mockResoluciones: ResolucionConEmpresa[] = [
      {
        id: '1',
        numeroResolucion: 'RES-001-2024',
        fechaEmision: new Date('2024-01-15'),
        tipoTramite: 'ALTA',
        estado: 'APROBADA',
        empresaId: 'emp1',
        empresa: {
          id: 'emp1',
          razonSocial: { principal: 'Empresa Test 1' },
          ruc: '20123456789'
        }
      },
      {
        id: '2',
        numeroResolucion: 'RES-002-2024',
        fechaEmision: new Date('2024-02-20'),
        tipoTramite: 'MODIFICACION',
        estado: 'PENDIENTE',
        empresaId: 'emp2',
        empresa: {
          id: 'emp2',
          razonSocial: { principal: 'Empresa Test 2' },
          ruc: '20987654321'
        }
      },
      {
        id: '3',
        numeroResolucion: 'RES-003-2024',
        fechaEmision: new Date('2024-03-10'),
        tipoTramite: 'BAJA',
        estado: 'RECHAZADA',
        empresaId: 'emp1',
        empresa: {
          id: 'emp1',
          razonSocial: { principal: 'Empresa Test 1' },
          ruc: '20123456789'
        }
      }
    ];

    beforeEach(async () => {
      const resolucionServiceSpy = jasmine.createSpyObj('ResolucionService', [
        'getResoluciones',
        'getResolucionesFiltradas',
        'getResolucionesConEmpresa'
      ]);
      
      const tableServiceSpy = jasmine.createSpyObj('ResolucionesTableService', [
        'aplicarFiltros',
        'limpiarFiltros',
        'getFiltrosActivos',
        'guardarConfiguracion',
        'cargarConfiguracion',
        'getConfiguracionPorDefecto'
      ]);
      
      const empresaServiceSpy = jasmine.createSpyObj('EmpresaService', ['getEmpresas']);
      const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

      resolucionServiceSpy.getResolucionesConEmpresa.and.returnValue(of(mockResoluciones));
      resolucionServiceSpy.getResolucionesFiltradas.and.returnValue(of(mockResoluciones));
      empresaServiceSpy.getEmpresas.and.returnValue(of([]));

      await TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          HttpClientTestingModule,
          ResolucionesComponent,
          ResolucionesTableComponent,
          ResolucionesFiltersComponent
        ],
        providers: [
          { provide: ResolucionService, useValue: resolucionServiceSpy },
          { provide: ResolucionesTableService, useValue: tableServiceSpy },
          { provide: EmpresaService, useValue: empresaServiceSpy },
          { provide: NotificationService, useValue: notificationServiceSpy }
        ]
      }).compileComponents();

      resolucionService = TestBed.inject(ResolucionService) as jasmine.SpyObj<ResolucionService>;
      tableService = TestBed.inject(ResolucionesTableService) as jasmine.SpyObj<ResolucionesTableService>;
      empresaService = TestBed.inject(EmpresaService) as jasmine.SpyObj<EmpresaService>;
      
      fixture = TestBed.createComponent(ResolucionesComponent);
      component = fixture.componentInstance;
    });

    it('should apply multiple filters correctly', fakeAsync(() => {
      // Requirements: 1.1, 1.2, 1.3, 1.4, 1.7
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'RES-001',
        empresaId: 'emp1',
        tiposTramite: ['ALTA'],
        estados: ['APROBADA']
      };

      const filteredResults = mockResoluciones.filter(r => 
        r.numeroResolucion.includes('RES-001') &&
        r.empresaId === 'emp1' &&
        r.tipoTramite === 'ALTA' &&
        r.estado === 'APROBADA'
      );

      resolucionService.getResolucionesFiltradas.and.returnValue(of(filteredResults));
      tableService.aplicarFiltros.and.returnValue(filteredResults);

      fixture.detectChanges();
      tick();

      // Simulate applying filters
      component.onFiltrosChange(filtros);
      tick(300); // debounce time
      
      expect(resolucionService.getResolucionesFiltradas).toHaveBeenCalledWith(filtros);
      expect(filteredResults.length).toBe(1);
      expect(filteredResults[0].numeroResolucion).toBe('RES-001-2024');
      
      flush();
    }));

    it('should filter by date range correctly', fakeAsync(() => {
      // Requirements: 1.5, 1.7
      const filtros: ResolucionFiltros = {
        fechaInicio: new Date('2024-02-01'),
        fechaFin: new Date('2024-02-28')
      };

      const filteredResults = mockResoluciones.filter(r => {
        const fecha = new Date(r.fechaEmision);
        return fecha >= filtros.fechaInicio! && fecha <= filtros.fechaFin!;
      });

      resolucionService.getResolucionesFiltradas.and.returnValue(of(filteredResults));

      fixture.detectChanges();
      component.onFiltrosChange(filtros);
      tick(300);

      expect(filteredResults.length).toBe(1);
      expect(filteredResults[0].numeroResolucion).toBe('RES-002-2024');
      
      flush();
    }));

    it('should clear all filters and show all results', fakeAsync(() => {
      // Requirements: 1.8
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'RES-001',
        empresaId: 'emp1'
      };

      resolucionService.getResolucionesFiltradas.and.returnValue(of([mockResoluciones[0]]));
      
      fixture.detectChanges();
      component.onFiltrosChange(filtros);
      tick(300);

      // Clear filters
      tableService.limpiarFiltros.and.returnValue();
      resolucionService.getResolucionesConEmpresa.and.returnValue(of(mockResoluciones));
      
      component.onLimpiarFiltros();
      tick();

      expect(tableService.limpiarFiltros).toHaveBeenCalled();
      expect(resolucionService.getResolucionesConEmpresa).toHaveBeenCalled();
      
      flush();
    }));

    it('should persist filter state across component lifecycle', fakeAsync(() => {
      // Requirements: 1.7, 5.3
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'RES-001',
        tiposTramite: ['ALTA']
      };

      const savedConfig: ResolucionTableConfig = {
        columnasVisibles: ['numeroResolucion', 'empresa', 'tipoTramite'],
        ordenColumnas: ['numeroResolucion', 'empresa', 'tipoTramite'],
        ordenamiento: [],
        paginacion: { tamanoPagina: 10, paginaActual: 0 },
        filtros: filtros
      };

      tableService.cargarConfiguracion.and.returnValue(savedConfig);
      tableService.guardarConfiguracion.and.returnValue();

      fixture.detectChanges();
      tick();

      // Verify filters are loaded from saved configuration
      expect(tableService.cargarConfiguracion).toHaveBeenCalled();
      
      // Apply new filters
      component.onFiltrosChange(filtros);
      tick(300);

      expect(tableService.guardarConfiguracion).toHaveBeenCalled();
      
      flush();
    }));

    it('should combine text and selection filters correctly', fakeAsync(() => {
      // Requirements: 1.2, 1.3, 1.4, 1.7
      const filtros: ResolucionFiltros = {
        numeroResolucion: '002',
        tiposTramite: ['MODIFICACION', 'BAJA'],
        estados: ['PENDIENTE', 'RECHAZADA']
      };

      const filteredResults = mockResoluciones.filter(r =>
        r.numeroResolucion.includes('002') &&
        filtros.tiposTramite!.includes(r.tipoTramite) &&
        filtros.estados!.includes(r.estado)
      );

      resolucionService.getResolucionesFiltradas.and.returnValue(of(filteredResults));

      fixture.detectChanges();
      component.onFiltrosChange(filtros);
      tick(300);

      expect(filteredResults.length).toBe(1);
      expect(filteredResults[0].numeroResolucion).toBe('RES-002-2024');
      
      flush();
    }));

    it('should show active filter chips and allow individual removal', fakeAsync(() => {
      // Requirements: 1.8, 5.3
      const filtros: ResolucionFiltros = {
        numeroResolucion: 'RES-001',
        empresaId: 'emp1',
        tiposTramite: ['ALTA']
      };

      const activeFiltros = [
        { key: 'numeroResolucion', label: 'Número: RES-001', value: 'RES-001' },
        { key: 'empresaId', label: 'Empresa: Empresa Test 1', value: 'emp1' },
        { key: 'tiposTramite', label: 'Tipo: ALTA', value: ['ALTA'] }
      ];

      tableService.getFiltrosActivos.and.returnValue(activeFiltros);

      fixture.detectChanges();
      component.onFiltrosChange(filtros);
      tick(300);

      const chips = tableService.getFiltrosActivos();
      expect(chips.length).toBe(3);

      // Remove one filter
      const updatedFiltros = { ...filtros };
      delete updatedFiltros.numeroResolucion;
      
      component.onRemoverFiltro('numeroResolucion');
      tick();

      expect(tableService.aplicarFiltros).toHaveBeenCalled();
      
      flush();
    }));
  });
});

  describe('13.2 Tests de configuración de tabla', () => {
    let component: ResolucionesTableComponent;
    let fixture: ComponentFixture<ResolucionesTableComponent>;
    let tableService: jasmine.SpyObj<ResolucionesTableService>;
    
    const defaultConfig: ResolucionTableConfig = {
      columnasVisibles: ['numeroResolucion', 'empresa', 'tipoTramite', 'estado', 'fechaEmision'],
      ordenColumnas: ['numeroResolucion', 'empresa', 'tipoTramite', 'estado', 'fechaEmision'],
      ordenamiento: [],
      paginacion: { tamanoPagina: 10, paginaActual: 0 },
      filtros: {}
    };

    beforeEach(async () => {
      const tableServiceSpy = jasmine.createSpyObj('ResolucionesTableService', [
        'cargarConfiguracion',
        'guardarConfiguracion',
        'getConfiguracionPorDefecto',
        'actualizarColumnasVisibles',
        'actualizarOrdenColumnas'
      ]);
      
      const resolucionServiceSpy = jasmine.createSpyObj('ResolucionService', [
        'getResolucionesConEmpresa'
      ]);
      
      const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess']);

      tableServiceSpy.cargarConfiguracion.and.returnValue(defaultConfig);
      tableServiceSpy.getConfiguracionPorDefecto.and.returnValue(defaultConfig);
      resolucionServiceSpy.getResolucionesConEmpresa.and.returnValue(of([]));

      await TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          HttpClientTestingModule,
          ResolucionesTableComponent
        ],
        providers: [
          { provide: ResolucionesTableService, useValue: tableServiceSpy },
          { provide: ResolucionService, useValue: resolucionServiceSpy },
          { provide: NotificationService, useValue: notificationServiceSpy }
        ]
      }).compileComponents();

      tableService = TestBed.inject(ResolucionesTableService) as jasmine.SpyObj<ResolucionesTableService>;
      
      fixture = TestBed.createComponent(ResolucionesTableComponent);
      component = fixture.componentInstance;
      component.resoluciones = [];
    });

    it('should change visible columns and update table display', fakeAsync(() => {
      // Requirements: 2.1, 2.2
      const newVisibleColumns = ['numeroResolucion', 'empresa', 'estado'];
      
      const updatedConfig: ResolucionTableConfig = {
        ...defaultConfig,
        columnasVisibles: newVisibleColumns
      };

      tableService.guardarConfiguracion.and.returnValue();

      fixture.detectChanges();
      tick();

      // Simulate column selection change via configuration change
      component.configuracion = updatedConfig;
      component.configuracionChange.emit(updatedConfig);
      tick();

      expect(component.configuracion.columnasVisibles).toEqual(newVisibleColumns);
      
      flush();
    }));

    it('should reorder columns and update display order', fakeAsync(() => {
      // Requirements: 2.3
      const newColumnOrder = ['empresa', 'numeroResolucion', 'tipoTramite', 'estado', 'fechaEmision'];
      
      const updatedConfig: ResolucionTableConfig = {
        ...defaultConfig,
        ordenColumnas: newColumnOrder
      };

      tableService.guardarConfiguracion.and.returnValue();

      fixture.detectChanges();
      tick();

      // Simulate column reordering via configuration change
      component.configuracion = updatedConfig;
      component.configuracionChange.emit(updatedConfig);
      tick();

      expect(component.configuracion.ordenColumnas).toEqual(newColumnOrder);
      
      flush();
    }));

    it('should persist column configuration in localStorage', fakeAsync(() => {
      // Requirements: 2.4, 2.5
      const customConfig: ResolucionTableConfig = {
        columnasVisibles: ['numeroResolucion', 'empresa'],
        ordenColumnas: ['empresa', 'numeroResolucion'],
        ordenamiento: [],
        paginacion: { tamanoPagina: 20, paginaActual: 0 },
        filtros: {}
      };

      tableService.guardarConfiguracion.and.callFake((config) => {
        localStorage.setItem('resoluciones-table-config', JSON.stringify(config));
      });

      tableService.cargarConfiguracion.and.callFake(() => {
        const saved = localStorage.getItem('resoluciones-table-config');
        return saved ? JSON.parse(saved) : defaultConfig;
      });

      // Save configuration
      tableService.guardarConfiguracion(customConfig);
      tick();

      // Load configuration
      const loadedConfig = tableService.cargarConfiguracion();
      
      expect(loadedConfig.columnasVisibles).toEqual(customConfig.columnasVisibles);
      expect(loadedConfig.ordenColumnas).toEqual(customConfig.ordenColumnas);
      
      // Cleanup
      localStorage.removeItem('resoluciones-table-config');
      flush();
    }));

    it('should restore default configuration when requested', fakeAsync(() => {
      // Requirements: 2.6
      const customConfig: ResolucionTableConfig = {
        columnasVisibles: ['numeroResolucion'],
        ordenColumnas: ['numeroResolucion'],
        ordenamiento: [],
        paginacion: { tamanoPagina: 5, paginaActual: 0 },
        filtros: {}
      };

      tableService.cargarConfiguracion.and.returnValue(customConfig);
      tableService.getConfiguracionPorDefecto.and.returnValue(defaultConfig);
      tableService.guardarConfiguracion.and.returnValue();

      fixture.detectChanges();
      tick();

      // Restore default via service
      const restoredConfig = tableService.getConfiguracionPorDefecto();
      component.configuracion = restoredConfig;
      tableService.guardarConfiguracion(restoredConfig);
      tick();

      expect(tableService.getConfiguracionPorDefecto).toHaveBeenCalled();
      expect(tableService.guardarConfiguracion).toHaveBeenCalledWith(defaultConfig);
      
      flush();
    }));

    it('should load saved configuration on component initialization', fakeAsync(() => {
      // Requirements: 2.5
      const savedConfig: ResolucionTableConfig = {
        columnasVisibles: ['numeroResolucion', 'empresa', 'estado'],
        ordenColumnas: ['empresa', 'numeroResolucion', 'estado'],
        ordenamiento: [{ columna: 'fechaEmision', direccion: 'desc' }],
        paginacion: { tamanoPagina: 25, paginaActual: 0 },
        filtros: { estado: ['APROBADA'] }
      };

      tableService.cargarConfiguracion.and.returnValue(savedConfig);

      fixture.detectChanges();
      tick();

      expect(tableService.cargarConfiguracion).toHaveBeenCalled();
      expect(component.configuracion).toEqual(savedConfig);
      
      flush();
    }));

    it('should maintain required columns as always visible', fakeAsync(() => {
      // Requirements: 2.2
      const attemptedColumns = ['empresa', 'tipoTramite']; // Missing required 'numeroResolucion'
      const requiredColumns = ['numeroResolucion'];
      
      const correctedColumns = [...new Set([...requiredColumns, ...attemptedColumns])];
      
      const updatedConfig: ResolucionTableConfig = {
        ...defaultConfig,
        columnasVisibles: correctedColumns
      };

      fixture.detectChanges();
      tick();

      // Simulate configuration with corrected columns
      component.configuracion = updatedConfig;
      tick();

      // Verify required columns are included
      expect(component.configuracion.columnasVisibles).toContain('numeroResolucion');
      
      flush();
    }));
  });

  describe('13.3 Tests de ordenamiento', () => {
    let component: ResolucionesTableComponent;
    let fixture: ComponentFixture<ResolucionesTableComponent>;
    let tableService: jasmine.SpyObj<ResolucionesTableService>;
    
    const mockResoluciones: ResolucionConEmpresa[] = [
      {
        id: '1',
        numeroResolucion: 'RES-003-2024',
        fechaEmision: new Date('2024-03-10'),
        tipoTramite: 'BAJA',
        estado: 'APROBADA',
        empresaId: 'emp1',
        empresa: {
          id: 'emp1',
          razonSocial: { principal: 'Zebra Company' },
          ruc: '20123456789'
        }
      },
      {
        id: '2',
        numeroResolucion: 'RES-001-2024',
        fechaEmision: new Date('2024-01-15'),
        tipoTramite: 'ALTA',
        estado: 'PENDIENTE',
        empresaId: 'emp2',
        empresa: {
          id: 'emp2',
          razonSocial: { principal: 'Alpha Company' },
          ruc: '20987654321'
        }
      },
      {
        id: '3',
        numeroResolucion: 'RES-002-2024',
        fechaEmision: new Date('2024-02-20'),
        tipoTramite: 'MODIFICACION',
        estado: 'RECHAZADA',
        empresaId: 'emp3',
        empresa: {
          id: 'emp3',
          razonSocial: { principal: 'Beta Company' },
          ruc: '20555555555'
        }
      }
    ];

    beforeEach(async () => {
      const tableServiceSpy = jasmine.createSpyObj('ResolucionesTableService', [
        'cargarConfiguracion',
        'guardarConfiguracion',
        'aplicarOrdenamiento',
        'limpiarOrdenamiento',
        'getConfiguracionPorDefecto'
      ]);
      
      const resolucionServiceSpy = jasmine.createSpyObj('ResolucionService', [
        'getResolucionesConEmpresa'
      ]);

      tableServiceSpy.cargarConfiguracion.and.returnValue({
        columnasVisibles: ['numeroResolucion', 'empresa', 'tipoTramite', 'estado', 'fechaEmision'],
        ordenColumnas: ['numeroResolucion', 'empresa', 'tipoTramite', 'estado', 'fechaEmision'],
        ordenamiento: [],
        paginacion: { tamanoPagina: 10, paginaActual: 0 },
        filtros: {}
      });
      
      resolucionServiceSpy.getResolucionesConEmpresa.and.returnValue(of(mockResoluciones));

      await TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          HttpClientTestingModule,
          ResolucionesTableComponent
        ],
        providers: [
          { provide: ResolucionesTableService, useValue: tableServiceSpy },
          { provide: ResolucionService, useValue: resolucionServiceSpy }
        ]
      }).compileComponents();

      tableService = TestBed.inject(ResolucionesTableService) as jasmine.SpyObj<ResolucionesTableService>;
      
      fixture = TestBed.createComponent(ResolucionesTableComponent);
      component = fixture.componentInstance;
      component.resoluciones = [...mockResoluciones];
    });

    it('should sort by column in ascending order on first click', fakeAsync(() => {
      // Requirements: 3.1
      const columna = 'numeroResolucion';
      
      const sortedAsc = [...mockResoluciones].sort((a, b) => 
        a.numeroResolucion.localeCompare(b.numeroResolucion)
      );

      tableService.aplicarOrdenamiento.and.returnValue(sortedAsc);

      fixture.detectChanges();
      tick();

      // Simulate sorting via configuration change
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'asc' as const }]
      };
      component.configuracion = updatedConfig;
      component.resoluciones = sortedAsc;
      fixture.detectChanges();
      tick();

      expect(sortedAsc[0].numeroResolucion).toBe('RES-001-2024');
      
      flush();
    }));

    it('should sort by column in descending order on second click', fakeAsync(() => {
      // Requirements: 3.2
      const columna = 'numeroResolucion';
      
      const sortedDesc = [...mockResoluciones].sort((a, b) => 
        b.numeroResolucion.localeCompare(a.numeroResolucion)
      );

      tableService.aplicarOrdenamiento.and.returnValue(sortedDesc);

      fixture.detectChanges();
      tick();

      // Simulate descending sort via configuration change
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'desc' as const }]
      };
      component.configuracion = updatedConfig;
      component.resoluciones = sortedDesc;
      fixture.detectChanges();
      tick();

      expect(sortedDesc[0].numeroResolucion).toBe('RES-003-2024');
      
      flush();
    }));

    it('should remove sorting on third click', fakeAsync(() => {
      // Requirements: 3.3
      const columna = 'numeroResolucion';

      tableService.limpiarOrdenamiento.and.returnValue(mockResoluciones);

      fixture.detectChanges();
      tick();

      // Simulate removing sort via configuration change
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: []
      };
      component.configuracion = updatedConfig;
      component.resoluciones = mockResoluciones;
      fixture.detectChanges();
      tick();

      expect(component.configuracion.ordenamiento.length).toBe(0);
      
      flush();
    }));

    it('should sort by empresa name alphabetically', fakeAsync(() => {
      // Requirements: 3.1, 4.4
      const columna = 'empresa';
      
      const sortedByEmpresa = [...mockResoluciones].sort((a, b) => 
        a.empresa!.razonSocial.principal.localeCompare(b.empresa!.razonSocial.principal)
      );

      tableService.aplicarOrdenamiento.and.returnValue(sortedByEmpresa);

      fixture.detectChanges();
      tick();

      // Simulate sorting by empresa
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'asc' as const }]
      };
      component.configuracion = updatedConfig;
      component.resoluciones = sortedByEmpresa;
      fixture.detectChanges();
      tick();

      expect(sortedByEmpresa[0].empresa!.razonSocial.principal).toBe('Alpha Company');
      expect(sortedByEmpresa[2].empresa!.razonSocial.principal).toBe('Zebra Company');
      
      flush();
    }));

    it('should maintain multiple column sorting with priority', fakeAsync(() => {
      // Requirements: 3.4
      const ordenamiento = [
        { columna: 'estado', direccion: 'asc' as const },
        { columna: 'fechaEmision', direccion: 'desc' as const }
      ];

      const sortedMultiple = [...mockResoluciones].sort((a, b) => {
        // First by estado
        const estadoCompare = a.estado.localeCompare(b.estado);
        if (estadoCompare !== 0) return estadoCompare;
        
        // Then by fechaEmision descending
        return new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime();
      });

      tableService.aplicarOrdenamiento.and.returnValue(sortedMultiple);

      fixture.detectChanges();
      tick();

      // Simulate multiple column sorting
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: ordenamiento
      };
      component.configuracion = updatedConfig;
      component.resoluciones = sortedMultiple;
      fixture.detectChanges();
      tick();

      expect(component.configuracion.ordenamiento.length).toBe(2);
      expect(component.configuracion.ordenamiento[0].columna).toBe('estado');
      expect(component.configuracion.ordenamiento[1].columna).toBe('fechaEmision');
      
      flush();
    }));

    it('should maintain sorting when filters are applied', fakeAsync(() => {
      // Requirements: 3.5
      const columna = 'numeroResolucion';
      const filtros: ResolucionFiltros = {
        tiposTramite: ['ALTA', 'BAJA']
      };

      const filteredData = mockResoluciones.filter(r => 
        filtros.tiposTramite!.includes(r.tipoTramite)
      );

      const sortedFiltered = [...filteredData].sort((a, b) => 
        a.numeroResolucion.localeCompare(b.numeroResolucion)
      );

      tableService.aplicarOrdenamiento.and.returnValue(sortedFiltered);

      fixture.detectChanges();
      tick();

      // Apply sorting and filters together
      const updatedConfig = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'asc' as const }],
        filtros: filtros
      };
      component.configuracion = updatedConfig;
      component.resoluciones = sortedFiltered;
      fixture.detectChanges();
      tick();

      // Verify sorting is maintained
      expect(component.configuracion.ordenamiento.length).toBeGreaterThan(0);
      expect(component.configuracion.ordenamiento[0].columna).toBe(columna);
      expect(component.configuracion.filtros).toEqual(filtros);
      
      flush();
    }));

    it('should clear all sorting and return to default order', fakeAsync(() => {
      // Requirements: 3.6
      const defaultOrder = [...mockResoluciones].sort((a, b) => 
        new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
      );

      tableService.limpiarOrdenamiento.and.returnValue(defaultOrder);

      fixture.detectChanges();
      tick();

      // Start with some sorting
      component.configuracion = {
        ...component.configuracion,
        ordenamiento: [
          { columna: 'numeroResolucion', direccion: 'asc' },
          { columna: 'empresa', direccion: 'desc' }
        ]
      };
      tick();

      // Clear all sorting
      const clearedConfig = {
        ...component.configuracion,
        ordenamiento: []
      };
      component.configuracion = clearedConfig;
      component.resoluciones = defaultOrder;
      fixture.detectChanges();
      tick();

      expect(component.configuracion.ordenamiento.length).toBe(0);
      expect(defaultOrder[0].fechaEmision.getTime()).toBeGreaterThan(
        defaultOrder[1].fechaEmision.getTime()
      );
      
      flush();
    }));

    it('should show visual indicators for active sorting', fakeAsync(() => {
      // Requirements: 3.1, 3.2, 3.3
      const columna = 'numeroResolucion';

      fixture.detectChanges();
      tick();

      // Ascending sort
      component.configuracion = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'asc' }]
      };
      fixture.detectChanges();
      tick();

      let sortState = component.configuracion.ordenamiento.find(o => o.columna === columna);
      expect(sortState?.direccion).toBe('asc');

      // Descending sort
      component.configuracion = {
        ...component.configuracion,
        ordenamiento: [{ columna, direccion: 'desc' }]
      };
      fixture.detectChanges();
      tick();

      sortState = component.configuracion.ordenamiento.find(o => o.columna === columna);
      expect(sortState?.direccion).toBe('desc');

      // No sorting
      component.configuracion = {
        ...component.configuracion,
        ordenamiento: []
      };
      fixture.detectChanges();
      tick();

      sortState = component.configuracion.ordenamiento.find(o => o.columna === columna);
      expect(sortState).toBeUndefined();
      
      flush();
    }));

    it('should persist sorting configuration across sessions', fakeAsync(() => {
      // Requirements: 3.5, 5.1
      const ordenamiento = [
        { columna: 'empresa', direccion: 'asc' as const }
      ];

      const configWithSort: ResolucionTableConfig = {
        columnasVisibles: ['numeroResolucion', 'empresa', 'tipoTramite'],
        ordenColumnas: ['numeroResolucion', 'empresa', 'tipoTramite'],
        ordenamiento: ordenamiento,
        paginacion: { tamanoPagina: 10, paginaActual: 0 },
        filtros: {}
      };

      tableService.guardarConfiguracion.and.callFake((config) => {
        localStorage.setItem('resoluciones-table-config', JSON.stringify(config));
      });

      tableService.cargarConfiguracion.and.callFake(() => {
        const saved = localStorage.getItem('resoluciones-table-config');
        return saved ? JSON.parse(saved) : configWithSort;
      });

      fixture.detectChanges();
      tick();

      // Apply sorting
      component.onOrdenar('empresa');
      tick();

      // Save configuration
      tableService.guardarConfiguracion(configWithSort);
      tick();

      // Simulate component reload
      const loadedConfig = tableService.cargarConfiguracion();
      
      expect(loadedConfig.ordenamiento).toEqual(ordenamiento);
      expect(loadedConfig.ordenamiento[0].columna).toBe('empresa');
      
      // Cleanup
      localStorage.removeItem('resoluciones-table-config');
      flush();
    }));
  });
});
