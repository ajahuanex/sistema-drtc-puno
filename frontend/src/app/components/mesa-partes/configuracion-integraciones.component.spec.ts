import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ConfiguracionIntegracionesComponent } from './configuracion-integraciones.component';
import { IntegracionService } from '../../services/mesa-partes/integracion.service';
import { 
  Integracion, 
  TipoIntegracion, 
  TipoAutenticacion, 
  EstadoConexion,
  ResultadoConexion,
  LogSincronizacion,
  EstadoSincronizacion
} from '../../models/mesa-partes/integracion.model';

describe('ConfiguracionIntegracionesComponent', () => {
  let component: ConfiguracionIntegracionesComponent;
  let fixture: ComponentFixture<ConfiguracionIntegracionesComponent>;
  let integracionService: jasmine.SpyObj<IntegracionService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockIntegraciones: Integracion[] = [
    {
      id: 'int-1',
      nombre: 'Mesa Externa 1',
      descripcion: 'Integración con entidad externa',
      tipo: 'API_REST' as TipoIntegracion,
      urlBase: 'https://api.externa.com',
      autenticacion: {
        tipo: 'API_KEY' as TipoAutenticacion,
        credenciales: 'encrypted-key'
      },
      mapeosCampos: [],
      activa: true,
      estadoConexion: 'CONECTADO' as EstadoConexion,
      ultimaSincronizacion: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as Integracion,
    {
      id: 'int-2',
      nombre: 'Mesa Externa 2',
      descripcion: 'Segunda integración',
      tipo: 'WEBHOOK' as TipoIntegracion,
      urlBase: 'https://api2.externa.com',
      autenticacion: {
        tipo: 'BEARER' as TipoAutenticacion,
        credenciales: 'encrypted-token'
      },
      mapeosCampos: [],
      activa: false,
      estadoConexion: 'DESCONECTADO' as EstadoConexion,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Integracion
  ];

  const mockLogs: LogSincronizacion[] = [
    {
      id: 'log-1',
      integracionId: 'int-1',
      integracionNombre: 'Mesa Externa 1',
      operacion: 'ENVIO',
      estado: 'EXITOSO' as EstadoSincronizacion,
      fecha: new Date(),
      detalles: 'Documento enviado correctamente'
    } as LogSincronizacion
  ];

  beforeEach(async () => {
    const integracionServiceSpy = jasmine.createSpyObj('IntegracionService', [
      'listarIntegraciones',
      'crearIntegracion',
      'actualizarIntegracion',
      'eliminarIntegracion',
      'probarConexion',
      'obtenerLogSincronizacion'
    ]);

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ConfiguracionIntegracionesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: IntegracionService, useValue: integracionServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    integracionService = TestBed.inject(IntegracionService) as jasmine.SpyObj<IntegracionService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture = TestBed.createComponent(ConfiguracionIntegracionesComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carga de integraciones', () => {
    it('debe cargar integraciones al inicializar', () => {
      integracionService.listarIntegraciones.and.returnValue(of(mockIntegraciones));

      fixture.detectChanges();

      expect(integracionService.listarIntegraciones).toHaveBeenCalled();
      expect(component.integraciones.length).toBe(2);
      expect(component.loading).toBe(false);
    });

    it('debe manejar error al cargar integraciones', () => {
      const error = { error: { message: 'Error de red' } };
      integracionService.listarIntegraciones.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      fixture.detectChanges();

      expect(component.loading).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Gestión de integraciones', () => {
    beforeEach(() => {
      integracionService.listarIntegraciones.and.returnValue(of(mockIntegraciones));
      fixture.detectChanges();
    });

    it('debe abrir modal para crear integración', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockIntegraciones[0]));
      dialog.open.and.returnValue(dialogRefSpy);

      component.abrirFormularioIntegracion();

      expect(dialog.open).toHaveBeenCalled();
    });

    it('debe abrir modal para editar integración', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockIntegraciones[0]));
      dialog.open.and.returnValue(dialogRefSpy);

      component.editarIntegracion(mockIntegraciones[0]);

      expect(dialog.open).toHaveBeenCalled();
    });

    it('debe recargar integraciones después de crear', (done) => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockIntegraciones[0]));
      dialog.open.and.returnValue(dialogRefSpy);

      component.abrirFormularioIntegracion();

      dialogRefSpy.afterClosed().subscribe(() => {
        expect(snackBar.open).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Prueba de conexión', () => {
    beforeEach(() => {
      integracionService.listarIntegraciones.and.returnValue(of(mockIntegraciones));
      fixture.detectChanges();
    });

    it('debe probar conexión exitosamente', () => {
      const resultadoExitoso: ResultadoConexion = {
        exitoso: true,
        mensaje: 'Conexión exitosa',
        tiempoRespuesta: 150
      };

      integracionService.probarConexion.and.returnValue(of(resultadoExitoso));

      component.probarConexion(mockIntegraciones[0]);

      expect(integracionService.probarConexion).toHaveBeenCalledWith('int-1');
      expect(component.probandoConexion['int-1']).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('debe manejar error de conexión', () => {
      const resultadoError: ResultadoConexion = {
        exitoso: false,
        mensaje: 'Error de conexión',
        error: 'Timeout'
      };

      integracionService.probarConexion.and.returnValue(of(resultadoError));

      component.probarConexion(mockIntegraciones[0]);

      expect(component.probandoConexion['int-1']).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('debe actualizar estado de conexión', () => {
      const resultadoExitoso: ResultadoConexion = {
        exitoso: true,
        mensaje: 'Conexión exitosa'
      };

      integracionService.probarConexion.and.returnValue(of(resultadoExitoso));

      component.probarConexion(mockIntegraciones[0]);

      expect(mockIntegraciones[0].estadoConexion).toBe('CONECTADO' as EstadoConexion);
    });
  });

  describe('Logs de sincronización', () => {
    beforeEach(() => {
      integracionService.listarIntegraciones.and.returnValue(of(mockIntegraciones));
      fixture.detectChanges();
    });

    it('debe cargar logs de sincronización', () => {
      const mockResponse = {
        logs: mockLogs,
        total: 1,
        page: 0,
        pageSize: 10
      };

      integracionService.obtenerLogSincronizacion.and.returnValue(of(mockResponse));
      component.filtroIntegracion = 'int-1';

      component.cargarLogs();

      expect(integracionService.obtenerLogSincronizacion).toHaveBeenCalledWith(
        'int-1',
        undefined
      );
      expect(component.logs.length).toBe(1);
      expect(component.loadingLogs).toBe(false);
    });

    it('debe filtrar logs por estado', () => {
      const mockResponse = {
        logs: mockLogs,
        total: 1,
        page: 0,
        pageSize: 10
      };

      integracionService.obtenerLogSincronizacion.and.returnValue(of(mockResponse));
      component.filtroIntegracion = 'int-1';
      component.filtroEstadoLog = 'exitoso';

      component.cargarLogs();

      expect(integracionService.obtenerLogSincronizacion).toHaveBeenCalledWith(
        'int-1',
        'exitoso' as EstadoSincronizacion
      );
    });

    it('no debe cargar logs sin filtro de integración', () => {
      component.filtroIntegracion = '';

      component.cargarLogs();

      expect(integracionService.obtenerLogSincronizacion).not.toHaveBeenCalled();
      expect(component.loadingLogs).toBe(false);
    });

    it('debe manejar error al cargar logs', () => {
      const error = { error: { message: 'Error al cargar logs' } };
      integracionService.obtenerLogSincronizacion.and.returnValue(throwError(() => error));
      component.filtroIntegracion = 'int-1';

      spyOn(console, 'error');
      component.cargarLogs();

      expect(component.loadingLogs).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Utilidades de formato', () => {
    it('debe obtener label de tipo correcto', () => {
      expect(component.getTipoLabel('API_REST' as TipoIntegracion)).toBe('API REST');
      expect(component.getTipoLabel('WEBHOOK' as TipoIntegracion)).toBe('Webhook');
      expect(component.getTipoLabel('SOAP' as TipoIntegracion)).toBe('SOAP');
    });

    it('debe obtener icono de tipo correcto', () => {
      expect(component.getTipoIcon('API_REST' as TipoIntegracion)).toBe('api');
      expect(component.getTipoIcon('WEBHOOK' as TipoIntegracion)).toBe('webhook');
      expect(component.getTipoIcon('SOAP' as TipoIntegracion)).toBe('cloud');
    });

    it('debe obtener clase de estado de conexión', () => {
      expect(component.getEstadoConexionClass('CONECTADO' as EstadoConexion)).toBe('conexion-exitosa');
      expect(component.getEstadoConexionClass('ERROR' as EstadoConexion)).toBe('conexion-error');
      expect(component.getEstadoConexionClass('DESCONECTADO' as EstadoConexion)).toBe('conexion-pendiente');
    });

    it('debe obtener icono de estado de conexión', () => {
      expect(component.getEstadoConexionIcon('CONECTADO' as EstadoConexion)).toBe('check_circle');
      expect(component.getEstadoConexionIcon('ERROR' as EstadoConexion)).toBe('error');
      expect(component.getEstadoConexionIcon('DESCONECTADO' as EstadoConexion)).toBe('pending');
    });

    it('debe obtener label de estado de conexión', () => {
      expect(component.getEstadoConexionLabel('CONECTADO' as EstadoConexion)).toBe('Conectado');
      expect(component.getEstadoConexionLabel('ERROR' as EstadoConexion)).toBe('Error');
      expect(component.getEstadoConexionLabel('DESCONECTADO' as EstadoConexion)).toBe('Desconectado');
    });
  });

  describe('Configuración de tabs', () => {
    beforeEach(() => {
      integracionService.listarIntegraciones.and.returnValue(of(mockIntegraciones));
      fixture.detectChanges();
    });

    it('debe inicializar en el primer tab', () => {
      expect(component.selectedTabIndex).toBe(0);
    });

    it('debe tener columnas de tabla configuradas', () => {
      expect(component.displayedColumns).toContain('nombre');
      expect(component.displayedColumns).toContain('estado');
      expect(component.displayedColumns).toContain('conexion');
      expect(component.displayedColumns).toContain('acciones');
    });

    it('debe tener columnas de logs configuradas', () => {
      expect(component.logColumns).toContain('fecha');
      expect(component.logColumns).toContain('integracion');
      expect(component.logColumns).toContain('operacion');
      expect(component.logColumns).toContain('estadoLog');
    });
  });
});
