import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RegistroDocumentoComponent } from './registro-documento.component';
import { DocumentoService } from '../../services/mesa-partes/documento.service';
import { Documento, PrioridadDocumento, EstadoDocumento } from '../../models/mesa-partes/documento.model';

describe('RegistroDocumentoComponent', () => {
  let component: RegistroDocumentoComponent;
  let fixture: ComponentFixture<RegistroDocumentoComponent>;
  let documentoService: jasmine.SpyObj<DocumentoService>;

  const mockDocumento: Documento = {
    id: 'doc-123',
    numeroExpediente: 'EXP-2025-0001',
    tipoDocumentoId: 'tipo-1',
    tipoDocumento: { id: 'tipo-1', nombre: 'Solicitud', codigo: 'SOL', categorias: [] },
    remitente: 'Juan Pérez',
    asunto: 'Solicitud de información',
    numeroFolios: 5,
    tieneAnexos: false,
    prioridad: 'NORMAL' as PrioridadDocumento,
    estado: 'REGISTRADO' as EstadoDocumento,
    fechaRecepcion: new Date(),
    archivosAdjuntos: [],
    etiquetas: [],
    codigoQR: 'QR-123',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Documento;

  beforeEach(async () => {
    const documentoServiceSpy = jasmine.createSpyObj('DocumentoService', [
      'crearDocumento',
      'adjuntarArchivo',
      'generarComprobante',
      'obtenerTiposDocumento'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RegistroDocumentoComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DocumentoService, useValue: documentoServiceSpy }
      ]
    }).compileComponents();

    documentoService = TestBed.inject(DocumentoService) as jasmine.SpyObj<DocumentoService>;
    fixture = TestBed.createComponent(RegistroDocumentoComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización del formulario', () => {
    it('debe inicializar el formulario con valores por defecto', () => {
      fixture.detectChanges();
      
      expect(component.documentoForm).toBeDefined();
      expect(component.documentoForm.get('tipoDocumentoId')?.value).toBe('');
      expect(component.documentoForm.get('remitente')?.value).toBe('');
      expect(component.documentoForm.get('asunto')?.value).toBe('');
      expect(component.documentoForm.get('numeroFolios')?.value).toBe(0);
      expect(component.documentoForm.get('tieneAnexos')?.value).toBe(false);
      expect(component.documentoForm.get('prioridad')?.value).toBe(PrioridadDocumento.NORMAL);
    });

    it('debe tener validaciones requeridas en campos obligatorios', () => {
      fixture.detectChanges();
      
      const tipoDocumento = component.documentoForm.get('tipoDocumentoId');
      const remitente = component.documentoForm.get('remitente');
      const asunto = component.documentoForm.get('asunto');
      const numeroFolios = component.documentoForm.get('numeroFolios');

      expect(tipoDocumento?.hasError('required')).toBe(true);
      expect(remitente?.hasError('required')).toBe(true);
      expect(asunto?.hasError('required')).toBe(true);
      expect(numeroFolios?.hasError('required')).toBe(true);
    });

    it('debe validar longitud mínima en remitente', () => {
      fixture.detectChanges();
      
      const remitente = component.documentoForm.get('remitente');
      remitente?.setValue('AB');
      
      expect(remitente?.hasError('minlength')).toBe(true);
      
      remitente?.setValue('ABC');
      expect(remitente?.hasError('minlength')).toBe(false);
    });

    it('debe validar longitud mínima en asunto', () => {
      fixture.detectChanges();
      
      const asunto = component.documentoForm.get('asunto');
      asunto?.setValue('Corto');
      
      expect(asunto?.hasError('minlength')).toBe(true);
      
      asunto?.setValue('Asunto con más de diez caracteres');
      expect(asunto?.hasError('minlength')).toBe(false);
    });
  });

  describe('Validación del formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe ser inválido cuando está vacío', () => {
      expect(component.documentoForm.valid).toBe(false);
    });

    it('debe ser válido cuando todos los campos requeridos están completos', () => {
      component.documentoForm.patchValue({
        tipoDocumentoId: 'tipo-1',
        remitente: 'Juan Pérez',
        asunto: 'Solicitud de información completa',
        numeroFolios: 5,
        prioridad: PrioridadDocumento.NORMAL
      });

      expect(component.documentoForm.valid).toBe(true);
    });

    it('debe validar número de folios mínimo', () => {
      const numeroFolios = component.documentoForm.get('numeroFolios');
      
      numeroFolios?.setValue(-1);
      expect(numeroFolios?.hasError('min')).toBe(true);
      
      numeroFolios?.setValue(0);
      expect(numeroFolios?.hasError('min')).toBe(false);
    });
  });

  describe('Manejo de archivos', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe agregar archivos a la lista', () => {
      const mockFile = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [mockFile]
        }
      } as any;

      component.onFileSelected(event);

      expect(component.archivosAdjuntos.length).toBe(1);
      expect(component.archivosAdjuntos[0].nombre).toBe('documento.pdf');
    });

    it('debe validar el tamaño máximo de archivo', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });
      const event = {
        target: {
          files: [largeFile]
        }
      } as any;

      spyOn(console, 'warn');
      component.onFileSelected(event);

      expect(component.archivosAdjuntos.length).toBe(0);
      expect(console.warn).toHaveBeenCalled();
    });

    it('debe eliminar un archivo de la lista', () => {
      const mockFile = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      component.archivosAdjuntos = [{
        file: mockFile,
        nombre: 'documento.pdf',
        tamano: 1024,
        tipo: 'application/pdf',
        progreso: 100
      }];

      component.eliminarArchivo(0);

      expect(component.archivosAdjuntos.length).toBe(0);
    });

    it('debe eliminar todos los archivos', () => {
      component.archivosAdjuntos = [
        {
          file: new File(['1'], 'doc1.pdf', { type: 'application/pdf' }),
          nombre: 'doc1.pdf',
          tamano: 1024,
          tipo: 'application/pdf',
          progreso: 100
        },
        {
          file: new File(['2'], 'doc2.pdf', { type: 'application/pdf' }),
          nombre: 'doc2.pdf',
          tamano: 2048,
          tipo: 'application/pdf',
          progreso: 100
        }
      ];

      component.eliminarTodosArchivos();

      expect(component.archivosAdjuntos.length).toBe(0);
    });
  });

  describe('Envío del formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.documentoForm.patchValue({
        tipoDocumentoId: 'tipo-1',
        remitente: 'Juan Pérez',
        asunto: 'Solicitud de información completa',
        numeroFolios: 5,
        prioridad: PrioridadDocumento.NORMAL
      });
    });

    it('debe crear un documento exitosamente', (done) => {
      documentoService.crearDocumento.and.returnValue(of(mockDocumento));

      component.documentoCreado.subscribe(documento => {
        expect(documento).toEqual(mockDocumento);
        done();
      });

      component.onSubmit();

      expect(documentoService.crearDocumento).toHaveBeenCalled();
      expect(component.guardando).toBe(false);
      expect(component.mostrarExito).toBe(true);
      expect(component.documentoGuardado).toEqual(mockDocumento);
    });

    it('debe manejar errores al crear documento', () => {
      const error = { error: { message: 'Error al crear documento' } };
      documentoService.crearDocumento.and.returnValue(throwError(() => error));

      spyOn(console, 'error');
      component.onSubmit();

      expect(documentoService.crearDocumento).toHaveBeenCalled();
      expect(component.guardando).toBe(false);
      expect(component.mostrarExito).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('no debe enviar si el formulario es inválido', () => {
      component.documentoForm.patchValue({
        tipoDocumentoId: '',
        remitente: '',
        asunto: ''
      });

      component.onSubmit();

      expect(documentoService.crearDocumento).not.toHaveBeenCalled();
    });

    it('no debe enviar si ya está guardando', () => {
      component.guardando = true;

      component.onSubmit();

      expect(documentoService.crearDocumento).not.toHaveBeenCalled();
    });
  });

  describe('Acciones post-registro', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.documentoGuardado = mockDocumento;
      component.mostrarExito = true;
    });

    it('debe resetear el formulario para registrar nuevo documento', () => {
      component.registrarNuevo();

      expect(component.mostrarExito).toBe(false);
      expect(component.documentoGuardado).toBeNull();
      expect(component.documentoForm.pristine).toBe(true);
    });

    it('debe emitir evento al ver documento', (done) => {
      component.documentoCreado.subscribe(documento => {
        expect(documento).toEqual(mockDocumento);
        done();
      });

      component.verDocumento();
    });

    it('debe emitir evento al derivar documento', (done) => {
      component.documentoCreado.subscribe(documento => {
        expect(documento).toEqual(mockDocumento);
        done();
      });

      component.derivarDocumento();
    });
  });

  describe('Utilidades', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe formatear el tamaño de archivo correctamente', () => {
      expect(component.formatFileSize(1024)).toBe('1.00 KB');
      expect(component.formatFileSize(1048576)).toBe('1.00 MB');
      expect(component.formatFileSize(500)).toBe('500 B');
    });

    it('debe obtener el icono correcto según el tipo de archivo', () => {
      expect(component.getFileIcon('application/pdf')).toBe('picture_as_pdf');
      expect(component.getFileIcon('application/msword')).toBe('description');
      expect(component.getFileIcon('application/vnd.ms-excel')).toBe('table_chart');
      expect(component.getFileIcon('image/jpeg')).toBe('image');
      expect(component.getFileIcon('unknown')).toBe('insert_drive_file');
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe manejar evento dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBe(true);
    });

    it('debe manejar evento dragleave', () => {
      component.isDragging = true;
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragLeave(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBe(false);
    });

    it('debe manejar evento drop con archivos', () => {
      const mockFile = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBe(false);
    });
  });

  describe('Cancelación', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe resetear el formulario al cancelar', () => {
      component.documentoForm.patchValue({
        tipoDocumentoId: 'tipo-1',
        remitente: 'Juan Pérez',
        asunto: 'Test'
      });

      component.onCancel();

      expect(component.documentoForm.get('tipoDocumentoId')?.value).toBe('');
      expect(component.documentoForm.get('remitente')?.value).toBe('');
      expect(component.archivosAdjuntos.length).toBe(0);
    });
  });
});
