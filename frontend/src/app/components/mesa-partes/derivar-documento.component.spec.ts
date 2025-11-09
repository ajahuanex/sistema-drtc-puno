import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { DerivarDocumentoComponent, DerivarDocumentoDialogData } from './derivar-documento.component';
import { DerivacionService } from '../../services/mesa-partes/derivacion.service';
import { Documento, EstadoDocumento, PrioridadDocumento } from '../../models/mesa-partes/documento.model';
import { Derivacion, Area, EstadoDerivacion } from '../../models/mesa-partes/derivacion.model';

describe('DerivarDocumentoComponent', () => {
  let component: DerivarDocumentoComponent;
  let fixture: ComponentFixture<DerivarDocumentoComponent>;
  let derivacionService: jasmine.SpyObj<DerivacionService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DerivarDocumentoComponent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockDocumento: Documento = {
    id: 'doc-123',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumento: { id: 'tipo-1', nombre: 'Solicitud', codigo: 'SOL', categorias: [] },
    remitente: 'Juan Pérez',
    asunto: 'Solicitud de información',
    estado: 'REGISTRADO' as EstadoDocumento,
    prioridad: 'NORMAL' as PrioridadDocumento,
    fechaRecepcion: new Date(),
    numeroFolios: 5,
    tieneAnexos: false,
    archivosAdjuntos: [],
    etiquetas: [],
    codigoQR: 'QR-123',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Documento;

  const mockAreas: Area[] = [
    { id: 'area-1', nombre: 'Área Legal', codigo: 'LEG' },
    { id: 'area-2', nombre: 'Área Administrativa', codigo: 'ADM' },
    { id: 'area-3', nombre: 'Área Técnica', codigo: 'TEC' }
  ];

  const mockDialogData: DerivarDocumentoDialogData = {
    documento: mockDocumento,
    areasDisponibles: mockAreas
  };

  const mockDerivacion: Derivacion = {
    id: 'der-123',
    documentoId: 'doc-123',
    areaDestinoId: 'area-1',
    instrucciones: 'Revisar y responder',
    esUrgente: false,
    estado: 'PENDIENTE' as EstadoDerivacion,
    fechaDerivacion: new Date()
  } as Derivacion;

  beforeEach(async () => {
    const derivacionServiceSpy = jasmine.createSpyObj('DerivacionService', [
      'derivarDocumento',
      'derivarDocumentoMultiple'
    ]);

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        DerivarDocumentoComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DerivacionService, useValue: derivacionServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    derivacionService = TestBed.inject(DerivacionService) as jasmine.SpyObj<DerivacionService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DerivarDocumentoComponent>>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture = TestBed.createComponent(DerivarDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('debe inicializar con datos del documento', () => {
      expect(component.documento).toEqual(mockDocumento);
      expect(component.areasDisponibles).toEqual(mockAreas);
    });

    it('debe inicializar el formulario con valores por defecto', () => {
      expect(component.derivacionForm).toBeDefined();
      expect(component.derivacionForm.get('areasDestinoIds')?.value).toEqual([]);
      expect(component.derivacionForm.get('instrucciones')?.value).toBe('');
      expect(component.derivacionForm.get('esUrgente')?.value).toBe(false);
      expect(component.derivacionForm.get('notificarEmail')?.value).toBe(true);
    });

    it('debe tener validaciones en campos obligatorios', () => {
      const areasDestinoIds = component.derivacionForm.get('areasDestinoIds');
      const instrucciones = component.derivacionForm.get('instrucciones');

      expect(areasDestinoIds?.hasError('required')).toBe(true);
      expect(instrucciones?.hasError('required')).toBe(true);
    });
  });

  describe('Validación del formulario', () => {
    it('debe ser inválido cuando está vacío', () => {
      expect(component.derivacionForm.valid).toBe(false);
    });

    it('debe ser válido con datos completos', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1'],
        instrucciones: 'Revisar y responder urgentemente'
      });

      expect(component.derivacionForm.valid).toBe(true);
    });

    it('debe validar longitud mínima de instrucciones', () => {
      const instrucciones = component.derivacionForm.get('instrucciones');
      
      instrucciones?.setValue('Corto');
      expect(instrucciones?.hasError('minlength')).toBe(true);
      
      instrucciones?.setValue('Instrucciones con más de diez caracteres');
      expect(instrucciones?.hasError('minlength')).toBe(false);
    });

    it('debe permitir seleccionar múltiples áreas', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1', 'area-2', 'area-3']
      });

      const areasIds = component.derivacionForm.get('areasDestinoIds')?.value;
      expect(areasIds.length).toBe(3);
    });
  });

  describe('Áreas seleccionadas', () => {
    it('debe actualizar áreas seleccionadas al cambiar el formulario', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1', 'area-2']
      });

      expect(component.areasSeleccionadas().length).toBe(2);
      expect(component.areasSeleccionadas()[0].id).toBe('area-1');
      expect(component.areasSeleccionadas()[1].id).toBe('area-2');
    });

    it('debe limpiar áreas seleccionadas cuando se deseleccionan', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1']
      });
      expect(component.areasSeleccionadas().length).toBe(1);

      component.derivacionForm.patchValue({
        areasDestinoIds: []
      });
      expect(component.areasSeleccionadas().length).toBe(0);
    });
  });

  describe('Confirmación de derivación', () => {
    beforeEach(() => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1'],
        instrucciones: 'Revisar y responder urgentemente'
      });
    });

    it('debe solicitar confirmación cuando el formulario es válido', () => {
      component.solicitarConfirmacion();

      expect(component.mostrarConfirmacion()).toBe(true);
    });

    it('no debe solicitar confirmación si el formulario es inválido', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: [],
        instrucciones: ''
      });

      component.solicitarConfirmacion();

      expect(component.mostrarConfirmacion()).toBe(false);
    });

    it('debe cancelar la confirmación', () => {
      component.mostrarConfirmacion.set(true);

      component.cancelarConfirmacion();

      expect(component.mostrarConfirmacion()).toBe(false);
    });
  });

  describe('Derivación a una sola área', () => {
    beforeEach(() => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1'],
        instrucciones: 'Revisar y responder urgentemente',
        esUrgente: false
      });
    });

    it('debe derivar documento exitosamente', () => {
      derivacionService.derivarDocumento.and.returnValue(of(mockDerivacion));

      component.confirmarDerivacion();

      expect(derivacionService.derivarDocumento).toHaveBeenCalledWith(
        jasmine.objectContaining({
          documentoId: 'doc-123',
          areaDestinoId: 'area-1',
          instrucciones: 'Revisar y responder urgentemente',
          esUrgente: false
        })
      );
      expect(component.isSubmitting()).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(mockDerivacion);
    });

    it('debe manejar error al derivar', () => {
      const error = { error: { message: 'Error al derivar' } };
      derivacionService.derivarDocumento.and.returnValue(throwError(() => error));

      component.confirmarDerivacion();

      expect(component.isSubmitting()).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('debe incluir fecha límite si está configurada', () => {
      const fechaLimite = new Date('2025-02-01');
      component.derivacionForm.patchValue({
        fechaLimite: fechaLimite
      });

      derivacionService.derivarDocumento.and.returnValue(of(mockDerivacion));

      component.confirmarDerivacion();

      expect(derivacionService.derivarDocumento).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fechaLimite: fechaLimite
        })
      );
    });
  });

  describe('Derivación a múltiples áreas', () => {
    beforeEach(() => {
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1', 'area-2', 'area-3'],
        instrucciones: 'Para conocimiento',
        esUrgente: false
      });
    });

    it('debe derivar a múltiples áreas exitosamente', () => {
      const mockDerivaciones = [
        { ...mockDerivacion, id: 'der-1', areaDestinoId: 'area-1' },
        { ...mockDerivacion, id: 'der-2', areaDestinoId: 'area-2' },
        { ...mockDerivacion, id: 'der-3', areaDestinoId: 'area-3' }
      ];

      derivacionService.derivarDocumento.and.returnValues(
        of(mockDerivaciones[0]),
        of(mockDerivaciones[1]),
        of(mockDerivaciones[2])
      );

      component.confirmarDerivacion();

      expect(derivacionService.derivarDocumento).toHaveBeenCalledTimes(3);
    });

    it('debe manejar errores parciales en derivaciones múltiples', (done) => {
      const error = { error: { message: 'Error' } };
      
      derivacionService.derivarDocumento.and.returnValues(
        of({ ...mockDerivacion, id: 'der-1' }),
        throwError(() => error),
        of({ ...mockDerivacion, id: 'der-3' })
      );

      component.confirmarDerivacion();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Opciones adicionales', () => {
    it('debe marcar como urgente', () => {
      component.derivacionForm.patchValue({
        esUrgente: true
      });

      expect(component.derivacionForm.get('esUrgente')?.value).toBe(true);
    });

    it('debe configurar notificación por email', () => {
      component.derivacionForm.patchValue({
        notificarEmail: false
      });

      expect(component.derivacionForm.get('notificarEmail')?.value).toBe(false);
    });

    it('debe validar fecha límite mínima', () => {
      const fechaPasada = new Date('2024-01-01');
      component.derivacionForm.patchValue({
        fechaLimite: fechaPasada
      });

      const fechaLimite = component.derivacionForm.get('fechaLimite');
      expect(fechaLimite?.hasError('min')).toBe(true);
    });
  });

  describe('Cierre del modal', () => {
    it('debe cerrar el modal sin guardar', () => {
      component.cerrar();

      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('no debe cerrar si está enviando', () => {
      component.isSubmitting.set(true);

      component.cerrar();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Validaciones de estado', () => {
    it('no debe enviar si el formulario es inválido', () => {
      component.derivacionForm.patchValue({
        areasDestinoIds: [],
        instrucciones: ''
      });

      component.confirmarDerivacion();

      expect(derivacionService.derivarDocumento).not.toHaveBeenCalled();
    });

    it('no debe enviar si ya está enviando', () => {
      component.isSubmitting.set(true);
      component.derivacionForm.patchValue({
        areasDestinoIds: ['area-1'],
        instrucciones: 'Test'
      });

      component.confirmarDerivacion();

      expect(derivacionService.derivarDocumento).not.toHaveBeenCalled();
    });
  });
});
