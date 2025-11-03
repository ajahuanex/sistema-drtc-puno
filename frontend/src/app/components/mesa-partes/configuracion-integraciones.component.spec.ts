import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ConfiguracionIntegracionesComponent } from './configuracion-integraciones.component';
import { IntegracionService } from '../../services/mesa-partes/integracion.service';
import { 
  Integracion, 
  TipoIntegracion, 
  TipoAutenticacion,
  EstadoConexion,
  EstadoSincronizacion,
  LogSincronizacion 
} from '../../models/mesa-partes/integracion.model';

describe('ConfiguracionIntegracionesComponent', () => {
  let component: ConfiguracionIntegracionesComponent;
  let fixture: ComponentFixture<ConfiguracionIntegracionesComponent>;
  let integracionService: jasmine.SpyObj<IntegracionService>;

  const mockIntegracion: Integracion = {
    id: '1',
    nombre: 'API Externa',
    descripcion: 'Integración con sistema externo',
    tipo: TipoIntegracion.API_REST,
    urlBase: 'https://api.externa.com',
    autenticacion: {
      tipo: TipoAutenticacion.API_KEY,
      apiKey: 'test-key'
    },
    activa: true,
    estadoConexion: EstadoConexion.CONECTADO,
    ultimaSincronizacion: new Date('2025-01-15T10:00:00Z'),
    mapeosCampos: [],
    configuracionWebhook: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z')
  };

  const mockLog: LogSincronizacion = {
    id: '1',
    integracionId: '1',
    documentoId: 'doc-1',
    tipo: 'ENVIO',
    estado: EstadoSincronizacion.EXITOSO,
    mensaje: 'Documento enviado exitosamente',
    fecha: new Date('2025-01-15T10:00:00Z')
  };

  beforeEach(async () => {
    const integracionServiceSpy = jasmine.createSpyObj('IntegracionService', [
      'listarIntegraciones',
      'obtenerLogSincronizacion',
      'probarConexion',
      'eliminarIntegracion',
      'configurarWebhook'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ConfiguracionIntegracionesComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        MatDialogModule
      ],
      providers: [
        { provide: IntegracionService, useValue: integracionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionIntegracionesComponent);
    component = fixture.componentInstance;
    integracionService = TestBed.inject(IntegracionService) as jasmine.SpyObj<IntegracionService>;

    // Setup default mocks
    integracionService.listarIntegraciones.and.returnValue(of([mockIntegracion]));
    integracionService.obtenerLogSincronizacion.and.returnValue(of({
      logs: [mockLog],
      total: 1,
      page: 1,
      pageSize: 10
    }));
    integracionService.probarConexion.and.returnValue(of({ exitoso: true, mensaje: 'Conexión exitosa' }));
    integracionService.eliminarIntegracion.and.returnValue(of(void 0));
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load integraciones on init', () => {
      expect(integracionService.listarIntegraciones).toHaveBeenCalled();
      expect(component.integraciones).toEqual([mockIntegracion]);
      expect(component.loading).toBeFalse();
    });

    it('should load logs on init', () => {
      expect(integracionService.obtenerLogSincronizacion).toHaveBeenCalled();
      expect(component.logs).toEqual([mockLog]);
    });

    it('should initialize with correct default values', () => {
      expect(component.selectedTabIndex).toBe(0);
      expect(component.filtroIntegracion).toBe('');
      expect(component.filtroEstadoLog).toBe('');
      expect(component.probandoConexion).toEqual({});
    });
  });

  describe('Integraciones Management', () => {
    it('should handle load integraciones error', () => {
      integracionService.listarIntegraciones.and.returnValue(
        throwError(() => new Error('Load error'))
      );
      
      spyOn(component['snackBar'], 'open');
      
      component['cargarIntegraciones']();
      
      expect(component.loading).toBeFalse();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error al cargar integraciones',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should test connection successfully', () => {
      spyOn(component['snackBar'], 'open');
      
      component.probarConexion(mockIntegracion);
      
      expect(integracionService.probarConexion).toHaveBeenCalledWith(mockIntegracion.id);
      expect(component.probandoConexion[mockIntegracion.id]).toBeFalse();
      expect(mockIntegracion.estadoConexion).toBe('exitosa');
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Conexión exitosa',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should handle connection test error', () => {
      integracionService.probarConexion.and.returnValue(
        of({ exitoso: false, mensaje: 'Error de conexión' })
      );
      
      spyOn(component['snackBar'], 'open');
      
      component.probarConexion(mockIntegracion);
      
      expect(component.probandoConexion[mockIntegracion.id]).toBeFalse();
      expect(mockIntegracion.estadoConexion).toBe('error');
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error de conexión: Error de conexión',
        'Cerrar',
        { duration: 5000 }
      );
    });

    it('should delete integracion with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component['snackBar'], 'open');
      
      component.eliminarIntegracion(mockIntegracion);
      
      expect(integracionService.eliminarIntegracion).toHaveBeenCalledWith(mockIntegracion.id);
      expect(component.integraciones).toEqual([]);
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Integración eliminada exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should not delete integracion without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.eliminarIntegracion(mockIntegracion);
      
      expect(integracionService.eliminarIntegracion).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component['snackBar'], 'open');
      integracionService.eliminarIntegracion.and.returnValue(
        throwError(() => new Error('Delete error'))
      );
      
      component.eliminarIntegracion(mockIntegracion);
      
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error al eliminar integración',
        'Cerrar',
        { duration: 3000 }
      );
    });
  });

  describe('Logs Management', () => {
    it('should load logs with filters', () => {
      component.filtroIntegracion = '1';
      component.filtroEstadoLog = EstadoSincronizacion.EXITOSO;
      
      component.cargarLogs();
      
      expect(integracionService.obtenerLogSincronizacion).toHaveBeenCalledWith(
        '1',
        EstadoSincronizacion.EXITOSO
      );
    });

    it('should handle load logs error', () => {
      integracionService.obtenerLogSincronizacion.and.returnValue(
        throwError(() => new Error('Logs error'))
      );
      
      spyOn(component['snackBar'], 'open');
      
      component.cargarLogs();
      
      expect(component.loadingLogs).toBeFalse();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Error al cargar logs',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should navigate to logs tab when viewing logs for integracion', () => {
      component.verLogs(mockIntegracion);
      
      expect(component.filtroIntegracion).toBe(mockIntegracion.id);
      expect(component.selectedTabIndex).toBe(1);
    });

    it('should show placeholder for log details', () => {
      spyOn(component['snackBar'], 'open');
      
      component.verDetallesLog(mockLog);
      
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Detalles del log próximamente disponibles',
        'Cerrar',
        { duration: 2000 }
      );
    });
  });

  describe('Helper Methods', () => {
    it('should get correct tipo icon', () => {
      expect(component.getTipoIcon(TipoIntegracion.API_REST)).toBe('api');
      expect(component.getTipoIcon(TipoIntegracion.SOAP)).toBe('soap');
      expect(component.getTipoIcon(TipoIntegracion.FTP)).toBe('folder_shared');
      expect(component.getTipoIcon(TipoIntegracion.EMAIL)).toBe('email');
    });

    it('should get correct tipo label', () => {
      expect(component.getTipoLabel(TipoIntegracion.API_REST)).toBe('API REST');
      expect(component.getTipoLabel(TipoIntegracion.SOAP)).toBe('SOAP');
      expect(component.getTipoLabel(TipoIntegracion.FTP)).toBe('FTP');
      expect(component.getTipoLabel(TipoIntegracion.EMAIL)).toBe('Email');
    });

    it('should get correct estado conexion class', () => {
      expect(component.getEstadoConexionClass('exitosa')).toBe('conexion-exitosa');
      expect(component.getEstadoConexionClass('error')).toBe('conexion-error');
      expect(component.getEstadoConexionClass('pendiente')).toBe('conexion-pendiente');
    });

    it('should get correct estado conexion icon', () => {
      expect(component.getEstadoConexionIcon('exitosa')).toBe('check_circle');
      expect(component.getEstadoConexionIcon('error')).toBe('error');
      expect(component.getEstadoConexionIcon('pendiente')).toBe('schedule');
    });

    it('should get correct estado conexion label', () => {
      expect(component.getEstadoConexionLabel('exitosa')).toBe('Conectado');
      expect(component.getEstadoConexionLabel('error')).toBe('Error');
      expect(component.getEstadoConexionLabel('pendiente')).toBe('Pendiente');
    });

    it('should get correct operacion icon', () => {
      expect(component.getOperacionIcon('enviar')).toBe('send');
      expect(component.getOperacionIcon('recibir')).toBe('get_app');
      expect(component.getOperacionIcon('sincronizar')).toBe('sync');
      expect(component.getOperacionIcon('probar')).toBe('bug_report');
      expect(component.getOperacionIcon('otro')).toBe('settings');
    });

    it('should get correct log estado icon', () => {
      expect(component.getLogEstadoIcon('exitoso')).toBe('check_circle');
      expect(component.getLogEstadoIcon('error')).toBe('error');
      expect(component.getLogEstadoIcon('pendiente')).toBe('schedule');
    });

    it('should get correct log estado label', () => {
      expect(component.getLogEstadoLabel('exitoso')).toBe('Exitoso');
      expect(component.getLogEstadoLabel('error')).toBe('Error');
      expect(component.getLogEstadoLabel('pendiente')).toBe('Pendiente');
    });
  });

  describe('Modal Integration', () => {
    it('should open integracion form modal for new integracion', () => {
      spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of(mockIntegracion)
      } as any);
      
      spyOn(component as any, 'cargarIntegraciones');
      spyOn(component['snackBar'], 'open');
      
      component.abrirFormularioIntegracion();
      
      expect(component['dialog'].open).toHaveBeenCalled();
      expect((component as any).cargarIntegraciones).toHaveBeenCalled();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Integración creada exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should open integracion form modal for edit', () => {
      spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of(mockIntegracion)
      } as any);
      
      spyOn(component as any, 'cargarIntegraciones');
      spyOn(component['snackBar'], 'open');
      
      component.editarIntegracion(mockIntegracion);
      
      expect(component['dialog'].open).toHaveBeenCalled();
      expect((component as any).cargarIntegraciones).toHaveBeenCalled();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Integración actualizada exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
    });

    it('should open webhook config modal', () => {
      spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of({ success: true })
      } as any);
      
      spyOn(component as any, 'cargarIntegraciones');
      spyOn(component['snackBar'], 'open');
      
      component.configurarWebhook(mockIntegracion);
      
      expect(component['dialog'].open).toHaveBeenCalled();
      expect((component as any).cargarIntegraciones).toHaveBeenCalled();
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Configuración de webhook actualizada',
        'Cerrar',
        { duration: 3000 }
      );
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

  describe('UI State', () => {
    it('should show loading state', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const loadingElement = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingElement).toBeTruthy();
    });

    it('should show no integraciones message when empty', () => {
      component.integraciones = [];
      component.loading = false;
      fixture.detectChanges();
      
      const noDataElement = fixture.nativeElement.querySelector('.no-integraciones');
      expect(noDataElement).toBeTruthy();
    });

    it('should show integraciones table when data exists', () => {
      component.integraciones = [mockIntegracion];
      component.loading = false;
      fixture.detectChanges();
      
      const tableElement = fixture.nativeElement.querySelector('.integraciones-table');
      expect(tableElement).toBeTruthy();
    });

    it('should show no logs message when empty', () => {
      component.logs = [];
      component.loadingLogs = false;
      fixture.detectChanges();
      
      const noLogsElement = fixture.nativeElement.querySelector('.no-logs');
      expect(noLogsElement).toBeTruthy();
    });
  });
});