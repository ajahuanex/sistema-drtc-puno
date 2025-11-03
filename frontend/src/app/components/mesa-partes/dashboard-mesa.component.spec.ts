import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DashboardMesaComponent } from './dashboard-mesa.component';
import { ReporteService } from '../../services/mesa-partes/reporte.service';
import { NotificacionService } from '../../services/mesa-partes/notificacion.service';
import { 
  Estadisticas, 
  PeriodoReporte 
} from '../../models/mesa-partes/reporte.model';

describe('DashboardMesaComponent', () => {
  let component: DashboardMesaComponent;
  let fixture: ComponentFixture<DashboardMesaComponent>;
  let reporteService: jasmine.SpyObj<ReporteService>;
  let notificacionService: jasmine.SpyObj<NotificacionService>;

  const mockEstadisticas: Estadisticas = {
    totalDocumentos: 150,
    documentosRecibidos: 45,
    documentosEnProceso: 25,
    documentosAtendidos: 80,
    documentosArchivados: 20,
    documentosVencidos: 5,
    documentosUrgentes: 8,
    tiempoPromedioAtencion: 24.5,
    porcentajeAtendidos: 85.2,
    tendencia: [
      { periodo: '2025-01-01', valor: 10 },
      { periodo: '2025-01-02', valor: 15 }
    ]
  };

  const mockTendencias = [
    { fecha: new Date('2025-01-01'), recibidos: 10, atendidos: 8, pendientes: 2 },
    { fecha: new Date('2025-01-02'), recibidos: 15, atendidos: 12, pendientes: 3 }
  ];

  const mockTiposData = [
    { tipoDocumentoId: '1', tipoDocumentoNombre: 'Solicitud', cantidad: 25, porcentaje: 50 },
    { tipoDocumentoId: '2', tipoDocumentoNombre: 'Oficio', cantidad: 15, porcentaje: 30 },
    { tipoDocumentoId: '3', tipoDocumentoNombre: 'Memorándum', cantidad: 10, porcentaje: 20 }
  ];

  const mockAreasData = [
    { 
      areaId: '1', 
      areaNombre: 'Área Legal', 
      documentosRecibidos: 20, 
      documentosAtendidos: 15, 
      documentosPendientes: 5,
      tiempoPromedioAtencion: 18.5,
      porcentajeEficiencia: 75
    },
    { 
      areaId: '2', 
      areaNombre: 'Área Administrativa', 
      documentosRecibidos: 15, 
      documentosAtendidos: 12, 
      documentosPendientes: 3,
      tiempoPromedioAtencion: 12.3,
      porcentajeEficiencia: 80
    }
  ];

  const mockTiemposData = [
    { areaId: '1', areaNombre: 'Área Legal', tiempoPromedio: 18.5, tiempoMinimo: 8.0, tiempoMaximo: 48.0 },
    { areaId: '2', areaNombre: 'Área Administrativa', tiempoPromedio: 12.3, tiempoMinimo: 4.0, tiempoMaximo: 24.0 }
  ];

  beforeEach(async () => {
    const reporteServiceSpy = jasmine.createSpyObj('ReporteService', [
      'obtenerEstadisticas',
      'obtenerDocumentosVencidos',
      'obtenerDocumentosProximosVencer',
      'obtenerTendencias',
      'obtenerEstadisticasPorTipo',
      'obtenerEstadisticasPorArea',
      'obtenerTiemposAtencionPorArea'
    ]);

    const notificacionServiceSpy = jasmine.createSpyObj('NotificacionService', [
      'obtenerNotificaciones',
      'conectarWebSocket',
      'desconectarWebSocket'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DashboardMesaComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ReporteService, useValue: reporteServiceSpy },
        { provide: NotificacionService, useValue: notificacionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardMesaComponent);
    component = fixture.componentInstance;
    reporteService = TestBed.inject(ReporteService) as jasmine.SpyObj<ReporteService>;
    notificacionService = TestBed.inject(NotificacionService) as jasmine.SpyObj<NotificacionService>;

    // Setup default mocks
    reporteService.obtenerEstadisticas.and.returnValue(of(mockEstadisticas));
    reporteService.obtenerDocumentosVencidos.and.returnValue(of({ 
      documentos: [], 
      total: 0, 
      page: 1, 
      pageSize: 10 
    }));
    reporteService.obtenerDocumentosProximosVencer.and.returnValue(of({ 
      documentos: [], 
      total: 0, 
      page: 1, 
      pageSize: 10 
    }));
    reporteService.obtenerTendencias.and.returnValue(of(mockTendencias));
    reporteService.obtenerEstadisticasPorTipo.and.returnValue(of(mockTiposData));
    reporteService.obtenerEstadisticasPorArea.and.returnValue(of(mockAreasData));
    reporteService.obtenerTiemposAtencionPorArea.and.returnValue(of(mockTiemposData));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default form values', () => {
    expect(component.filtrosForm.get('periodo')?.value).toBe(PeriodoReporte.ULTIMO_MES);
  });

  it('should load dashboard data on init', () => {
    fixture.detectChanges();

    expect(reporteService.obtenerEstadisticas).toHaveBeenCalled();
    expect(reporteService.obtenerDocumentosVencidos).toHaveBeenCalled();
    expect(reporteService.obtenerDocumentosProximosVencer).toHaveBeenCalled();
    expect(reporteService.obtenerTendencias).toHaveBeenCalled();
    expect(reporteService.obtenerEstadisticasPorTipo).toHaveBeenCalled();
    expect(reporteService.obtenerEstadisticasPorArea).toHaveBeenCalled();
    expect(reporteService.obtenerTiemposAtencionPorArea).toHaveBeenCalled();
  });

  it('should process statistics and create key indicators', () => {
    fixture.detectChanges();

    expect(component.indicadoresClave.length).toBe(5);
    expect(component.indicadoresClave[0].titulo).toBe('Total Recibidos');
    expect(component.indicadoresClave[0].valor).toBe(45);
    expect(component.indicadoresClave[1].titulo).toBe('En Proceso');
    expect(component.indicadoresClave[1].valor).toBe(25);
    expect(component.indicadoresClave[2].titulo).toBe('Atendidos');
    expect(component.indicadoresClave[2].valor).toBe(80);
  });

  it('should load chart data correctly', () => {
    fixture.detectChanges();

    expect(component.tendenciasData.length).toBe(2);
    expect(component.distribucionTipoData.length).toBe(3);
    expect(component.distribucionAreaData.length).toBe(2);
    expect(component.tiemposAtencionData.length).toBe(2);
  });

  it('should calculate maximum values for charts', () => {
    fixture.detectChanges();

    expect(component.maxTendencias).toBe(15); // Max between recibidos and atendidos
    expect(component.maxAreaDocumentos).toBe(20); // Max documentosRecibidos
    expect(component.maxTiempoAtencion).toBe(18.5); // Max tiempoPromedio
  });

  it('should calculate bar height correctly', () => {
    const height = component.getBarHeight(10, 20);
    expect(height).toBe(50);
  });

  it('should calculate bar width correctly', () => {
    const width = component.getBarWidth(15, 30);
    expect(width).toBe(50);
  });

  it('should get correct pie colors', () => {
    const color1 = component.getPieColor(0);
    const color2 = component.getPieColor(1);
    
    expect(color1).toBe('#667eea');
    expect(color2).toBe('#48bb78');
  });

  it('should get correct color values for indicators', () => {
    const primaryColor = component.getColorValue('primary');
    const successColor = component.getColorValue('success');
    
    expect(primaryColor).toBe('#667eea');
    expect(successColor).toBe('#48bb78');
  });

  it('should get correct trend icons', () => {
    const upIcon = component.getTendenciaIcon('up');
    const downIcon = component.getTendenciaIcon('down');
    const stableIcon = component.getTendenciaIcon('stable');
    
    expect(upIcon).toBe('trending_up');
    expect(downIcon).toBe('trending_down');
    expect(stableIcon).toBe('trending_flat');
  });

  it('should reload data when filter changes', () => {
    fixture.detectChanges();
    
    // Reset spy calls
    reporteService.obtenerEstadisticas.calls.reset();
    
    component.filtrosForm.patchValue({ periodo: PeriodoReporte.HOY });
    component.onFiltroChange();
    
    expect(reporteService.obtenerEstadisticas).toHaveBeenCalled();
  });

  it('should handle manual data refresh', () => {
    fixture.detectChanges();
    
    // Reset spy calls
    reporteService.obtenerEstadisticas.calls.reset();
    
    component.actualizarDatos();
    
    expect(reporteService.obtenerEstadisticas).toHaveBeenCalled();
  });

  it('should handle loading state correctly', () => {
    expect(component.cargando).toBeFalse();
    
    // Simulate loading
    component.cargando = true;
    fixture.detectChanges();
    
    const loadingSpinner = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(loadingSpinner).toBeTruthy();
  });

  it('should display empty states when no data', () => {
    component.documentosVencidos = [];
    component.documentosProximosVencer = [];
    component.documentosUrgentes = [];
    
    fixture.detectChanges();
    
    const emptyStates = fixture.nativeElement.querySelectorAll('.empty-state');
    expect(emptyStates.length).toBeGreaterThan(0);
  });

  it('should display document alerts when data exists', () => {
    component.documentosVencidos = [
      {
        id: '1',
        numeroExpediente: 'EXP-2025-0001',
        asunto: 'Test document',
        remitente: 'Test sender',
        fechaLimite: new Date(),
        diasVencimiento: -2,
        prioridad: 'ALTA',
        estado: 'EN_PROCESO'
      }
    ];
    
    fixture.detectChanges();
    
    const documentItems = fixture.nativeElement.querySelectorAll('.documento-item');
    expect(documentItems.length).toBeGreaterThan(0);
  });

  it('should show correct count chips', () => {
    component.documentosVencidos = [{ id: '1' } as any];
    component.documentosProximosVencer = [{ id: '2' } as any, { id: '3' } as any];
    component.documentosUrgentes = [{ id: '4' } as any, { id: '5' } as any, { id: '6' } as any];
    
    fixture.detectChanges();
    
    const chips = fixture.nativeElement.querySelectorAll('.count-chip');
    expect(chips.length).toBe(3);
  });

  it('should update last update timestamp', () => {
    const initialTime = component.ultimaActualizacion;
    
    fixture.detectChanges();
    
    expect(component.ultimaActualizacion.getTime()).toBeGreaterThanOrEqual(initialTime.getTime());
  });

  it('should handle navigation methods', () => {
    spyOn(console, 'log');
    
    component.verTodosVencidos();
    component.verTodosProximos();
    component.verTodosUrgentes();
    
    expect(console.log).toHaveBeenCalledTimes(3);
  });

  it('should cleanup on destroy', () => {
    fixture.detectChanges();
    
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});