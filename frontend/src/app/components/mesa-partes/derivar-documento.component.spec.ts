import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DerivarDocumentoComponent, DerivarDocumentoDialogData } from './derivar-documento.component';
import { DerivacionService } from '../../services/mesa-partes/derivacion.service';
import { Documento, EstadoDocumento, PrioridadDocumento } from '../../models/mesa-partes/documento.model';
import { Area, Derivacion, EstadoDerivacion } from '../../models/mesa-partes/derivacion.model';

describe('DerivarDocumentoComponent', () => {
  let component: DerivarDocumentoComponent;
  let fixture: ComponentFixture<DerivarDocumentoComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DerivarDocumentoComponent>>;
  let mockDerivacionService: jasmine.SpyObj<DerivacionService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockDocumento: Documento = {
    id: '1',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumento: {
      id: 'tipo1',
      nombre: 'Solicitud',
      codigo: 'SOL',
      categorias: []
    },
    remitente: 'Juan Pérez',
    asunto: 'Solicitud de información',
    numeroFolios: 5,
    tieneAnexos: false,
    prioridad: PrioridadDocumento.NORMAL,
    estado: EstadoDocumento.REGISTRADO,
    fechaRecepcion: new Date(),
    usuarioRegistro: {
      id: 'user1',
      nombres: 'Admin',
      apellidos: 'Sistema'
    },
    archivosAdjuntos: [],
    etiquetas: [],
    codigoQR: 'QR123',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAreas: Area[] = [
    { id: 'area1', nombre: 'Área Legal', codigo: 'LEG' },
    { id: 'area2', nombre: 'Área Administrativa', codigo: 'ADM' },
    { id: 'area3', nombre: 'Área Técnica', codigo: 'TEC' }
  ];

  const mockDialogData: DerivarDocumentoDialogData = {
    documento: mockDocumento,
    areasDisponibles: mockAreas
  };

  const mockDerivacion: Derivacion = {
    id: 'deriv1',
    documentoId: '1',
    areaOrigen: mockAreas[0],
    areaDestino: mockAreas[1],
    usuarioDeriva: {
      id: 'user1',
      nombres: 'Admin',
      apellidos: 'Sistema'
    },
    instrucciones: 'Revisar y responder',
    fechaDerivacion: new Date(),
    estado: EstadoDerivacion.PENDIENTE,
    esUrgente: false
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDerivacionService = jasmine.createSpyObj('DerivacionService', ['derivarDocumento']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        DerivarDocumentoComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DerivacionService, useValue: mockDerivacionService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DerivarDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with document and areas data', () => {
    expect(component.documento).toEqual(mockDocumento);
    expect(component.areasDisponibles).toEqual(mockAreas);
  });

  it('should initialize form with default values', () => {
    expect(component.derivacionForm).toBeDefined();
    expect(component.derivacionForm.get('areasDestinoIds')?.value).toEqual([]);
    expect(component.derivacionForm.get('instrucciones')?.value).toBe('');
    expect(component.derivacionForm.get('esUrgente')?.value).toBe(false);
    expect(component.derivacionForm.get('notificarEmail')?.value).toBe(true);
  });

  it('should validate required fields', () => {
    expect(component.derivacionForm.valid).toBeFalsy();
    
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1'],
      instrucciones: 'Instrucciones de prueba'
    });
    
    expect(component.derivacionForm.valid).toBeTruthy();
  });

  it('should validate minimum length for instrucciones', () => {
    const instruccionesControl = component.derivacionForm.get('instrucciones');
    
    instruccionesControl?.setValue('corto');
    expect(instruccionesControl?.hasError('minlength')).toBeTruthy();
    
    instruccionesControl?.setValue('Instrucciones suficientemente largas');
    expect(instruccionesControl?.hasError('minlength')).toBeFalsy();
  });

  it('should update areasSeleccionadas when areas are selected', () => {
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1', 'area2']
    });
    
    fixture.detectChanges();
    
    expect(component.areasSeleccionadas().length).toBe(2);
    expect(component.areasSeleccionadas()[0].id).toBe('area1');
    expect(component.areasSeleccionadas()[1].id).toBe('area2');
  });

  it('should show confirmation when solicitarConfirmacion is called with valid form', () => {
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1'],
      instrucciones: 'Instrucciones de prueba'
    });
    
    component.solicitarConfirmacion();
    
    expect(component.mostrarConfirmacion()).toBeTruthy();
  });

  it('should not show confirmation with invalid form', () => {
    component.solicitarConfirmacion();
    
    expect(component.mostrarConfirmacion()).toBeFalsy();
  });

  it('should cancel confirmation', () => {
    component.mostrarConfirmacion.set(true);
    component.cancelarConfirmacion();
    
    expect(component.mostrarConfirmacion()).toBeFalsy();
  });

  it('should derive document to single area successfully', () => {
    mockDerivacionService.derivarDocumento.and.returnValue(of(mockDerivacion));
    
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1'],
      instrucciones: 'Instrucciones de prueba',
      esUrgente: false
    });
    
    component.confirmarDerivacion();
    
    expect(mockDerivacionService.derivarDocumento).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(mockDerivacion);
  });

  it('should derive document to multiple areas', () => {
    mockDerivacionService.derivarDocumento.and.returnValue(of(mockDerivacion));
    
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1', 'area2'],
      instrucciones: 'Instrucciones de prueba'
    });
    
    component.confirmarDerivacion();
    
    expect(mockDerivacionService.derivarDocumento).toHaveBeenCalledTimes(2);
  });

  it('should handle derivation error', () => {
    const error = { error: { message: 'Error de prueba' } };
    mockDerivacionService.derivarDocumento.and.returnValue(throwError(() => error));
    
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1'],
      instrucciones: 'Instrucciones de prueba'
    });
    
    component.confirmarDerivacion();
    
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Error de prueba'),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('should mark as urgent when checkbox is checked', () => {
    component.derivacionForm.patchValue({
      esUrgente: true
    });
    
    expect(component.derivacionForm.get('esUrgente')?.value).toBeTruthy();
  });

  it('should set fecha limite', () => {
    const fechaLimite = new Date('2025-12-31');
    
    component.derivacionForm.patchValue({
      fechaLimite: fechaLimite
    });
    
    expect(component.derivacionForm.get('fechaLimite')?.value).toEqual(fechaLimite);
  });

  it('should close dialog when cerrar is called', () => {
    component.cerrar();
    
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not close dialog when submitting', () => {
    component.isSubmitting.set(true);
    component.cerrar();
    
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    const compiled = fixture.nativeElement;
    const submitButton = compiled.querySelector('.primary-button');
    
    expect(submitButton.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    component.derivacionForm.patchValue({
      areasDestinoIds: ['area1'],
      instrucciones: 'Instrucciones de prueba'
    });
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const submitButton = compiled.querySelector('.primary-button');
    
    expect(submitButton.disabled).toBeFalsy();
  });
});
