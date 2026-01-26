import { Component, OnInit, inject, signal, computed, ViewEncapsulation, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate, DatosTecnicos } from '../../models/vehiculo.model';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { VehiculosResolucionModalComponent } from './vehiculos-resolucion-modal.component';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  placaPeruanaValidator,
  placaDuplicadaValidator,
  anioFabricacionValidator,
  capacidadPasajerosValidator,
  numeroMotorValidator,
  numeroChasisValidator,
  numeroTucValidator
} from '../../validators/vehiculo.validators';

@Component({
  selector: 'app-vehiculo-form',
  standalone: true,
  encapsulation: (ViewEncapsulation as any).Emulated,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  template: `<div>Componente en mantenimiento - Template simplificado</div>`,
  styleUrls: ['./vehiculo-form.component.css']
})
export class VehiculoFormComponent implements OnInit {
  // Propiedades de entrada para modo modal
  modalMode = input<boolean>(false);
  empresaId = input<string>('');
  resolucionId = input<string>('');

  // Evento de salida para modo modal
  vehiculoCreated = output<VehiculoCreate>();

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  vehiculoForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  vehiculoId = signal<string | null>(null);

  // Datos de referencia
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);

  // Autocompletado para empresas
  empresasFiltradas!: Observable<Empresa[]>;

  // Getters para los controles del formulario
  get empresaControl(): FormControl {
    return this.vehiculoForm.get('empresaActualId') as FormControl;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmpresas();

    if (!this.modalMode()) {
      this.loadVehiculo();
    } else {
      // En modo modal, pre-configurar empresa y resolución
      this.vehiculoForm.patchValue({
        empresaActualId: this.empresaId(),
        resolucionId: this.resolucionId()
      });

      // Cargar resoluciones y rutas si ya hay empresa y resolución
      if (this.empresaId()) {
        this.loadResoluciones(this.empresaId());
        if (this.resolucionId()) {
          this.loadRutasDisponibles(this.resolucionId());
        }
      }
    }
  }

  // Método para limpiar el campo de empresa
  limpiarEmpresa(): void {
    this.empresaControl.setValue('');
    this.vehiculoForm.patchValue({ empresaActualId: '' });

    // Limpiar resoluciones y rutas
    this.resoluciones.set([]);
    this.rutasDisponibles.set([]);

    // Limpiar y deshabilitar campo de resolución
    this.vehiculoForm.patchValue({ resolucionId: '' });
    this.vehiculoForm.get('resolucionId')?.disable();
  }

  private initializeForm(): void {
    this.vehiculoForm = this.fb.group({
      empresaActualId: ['', (Validators as any).required],
      resolucionId: [{ value: '', disabled: true }, (Validators as any).required],
      numeroTuc: ['', [numeroTucValidator()]],
      rutasAsignadasIds: [[], (Validators as any).required],
      placa: [
        '',
        [(Validators as any).required, placaPeruanaValidator()],
        [placaDuplicadaValidator(this.vehiculoService, this.vehiculoId() || undefined)]
      ],
      marca: ['', (Validators as any).required],
      modelo: [''],
      categoria: ['M3'],
      asientos: ['', [capacidadPasajerosValidator()]],
      anioFabricacion: ['', [(Validators as any).required, anioFabricacionValidator()]],
      estado: ['ACTIVO'],
      datosTecnicos: this.fb.group({
        motor: ['', [numeroMotorValidator()]],
        chasis: ['', [numeroChasisValidator()]],
        cilindros: [''],
        ejes: [''],
        ruedas: [''],
        pesoNeto: [''],
        pesoBruto: [''],
        medidas: this.fb.group({
          largo: [''],
          ancho: [''],
          alto: ['']
        })
      })
    });
  }

  private loadVehiculo(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading.set(true);
      this.isEditing.set(true);
      this.vehiculoId.set(id);

      this.vehiculoService.getVehiculoById(id).subscribe({
        next: (vehiculo: Vehiculo | null) => {
          if (!vehiculo) {
            this.snackBar.open('Vehículo no encontrado', 'Cerrar', { duration: 3000 });
            this.isLoading.set(false);
            return;
          }
          this.vehiculoForm.patchValue({
            empresaActualId: (vehiculo as any).empresaActualId,
            resolucionId: (vehiculo as any).resolucionId,
            numeroTuc: (vehiculo as any).tuc?.nroTuc || '',
            rutasAsignadasIds: (vehiculo as any).rutasAsignadasIds || [],
            placa: (vehiculo as any).placa,
            marca: (vehiculo as any).marca,
            modelo: (vehiculo as any).modelo,
            categoria: (vehiculo as any).categoria,
            anioFabricacion: (vehiculo as any).anioFabricacion,
            estado: (vehiculo as any).estado,
            datosTecnicos: {
              motor: (vehiculo as any).datosTecnicos.motor,
              chasis: (vehiculo as any).datosTecnicos.chasis,
              cilindros: (vehiculo as any).datosTecnicos.cilindros,
              ejes: (vehiculo as any).datosTecnicos.ejes,
              ruedas: (vehiculo as any).datosTecnicos.ruedas,
              pesoNeto: (vehiculo as any).datosTecnicos.pesoNeto,
              pesoBruto: (vehiculo as any).datosTecnicos.pesoBruto,
              medidas: (vehiculo as any).datosTecnicos.medidas
            }
          });
          // Update the asientos field separately since it's part of datosTecnicos
          this.vehiculoForm.patchValue({
            asientos: (vehiculo as any).datosTecnicos.asientos
          });

          // Cargar resoluciones y rutas para este vehículo
          this.loadResoluciones((vehiculo as any).empresaActualId);
          this.loadRutasDisponibles((vehiculo as any).resolucionId);

          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          (console as any).error('Error loading vehicle:', error);
          this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  private loadEmpresas(): void {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas: any) => {
        this.empresas.set((empresas as any).filter((e: any) => (e as any).estado === (EstadoEmpresa as any).AUTORIZADA));
        // Configurar autocompletado después de cargar empresas
        setTimeout(() => this.configurarAutocompletado(), 0);
      },
      error: (error: any) => {
        (console as any).error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private configurarAutocompletado(): void {
    // Solo configurar si el formulario está inicializado
    if (this.vehiculoForm && this.empresaControl) {
      // Autocompletado para empresas
      this.empresasFiltradas = this.empresaControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filtrarEmpresas(value))
      );
    }
  }

  private filtrarEmpresas(value: unknown): Empresa[] {
    if (!value) return this.empresas();

    // Si el valor es un objeto Empresa, extraer el texto para filtrar
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = (value as any).toLowerCase();
    } else if (value && typeof value === 'object') {
      filterValue = ((value as any).razonSocial?.principal?.toLowerCase() || (value as any).ruc?.toLowerCase() || '');
    }

    return this.empresas().filter((empresa: any) => {
      const rucMatch = (empresa as any).ruc.toLowerCase().includes(filterValue);
      const razonSocialMatch = (empresa as any).razonSocial?.principal?.toLowerCase().includes(filterValue) || false;
      return rucMatch || razonSocialMatch;
    });
  }

  // Método para mostrar la empresa en el input (arrow function para preservar `this`)
  displayEmpresa = (empresa: Empresa | string | null | undefined): string => {
    if (!empresa) return '';

    // Si es un string (ID), buscar la empresa en la lista
    if (typeof empresa === 'string') {
      const empresaEncontrada = this.empresas().find((e: any) => (e as any).id === empresa);
      if (empresaEncontrada) {
        empresa = empresaEncontrada;
      } else {
        return 'Empresa no encontrada';
      }
    }

    // Verificar que razonSocial existe y tiene la propiedad principal
    if ((empresa as any).razonSocial && (empresa as any).razonSocial.principal) {
      return `${(empresa as any).ruc} - ${(empresa as any).razonSocial.principal}`;
    } else if ((empresa as any).razonSocial) {
      return `${(empresa as any).ruc} - Sin razón social`;
    } else {
      return `${(empresa as any).ruc} - Sin información de razón social`;
    }
  }

  // Método para manejar la selección de empresa
  onEmpresaSelected(event: unknown): void {
    const empresa = (event as any).option.value;
    if (empresa && (empresa as any).id) {
      // Establecer el objeto empresa completo en el control
      this.empresaControl.setValue(empresa);
      // También actualizar el valor del formulario con el ID
      this.vehiculoForm.patchValue({ empresaActualId: (empresa as any).id });

      // Habilitar el campo de resolución
      this.vehiculoForm.get('resolucionId')?.enable();

      this.onEmpresaChange();
    }
  }

  private loadResoluciones(empresaId: string): void {
    if (!empresaId) return;

    // Usar el método específico que filtra por empresa en el backend
    this.resolucionService.getResoluciones(0, 100, undefined, empresaId).subscribe({
      next: (resoluciones: any) => {
        (console as any).log('   Detalle:', (resoluciones as any).map((r: any) => ({ numero: (r as any).nroResolucion, tipo: (r as any).tipoResolucion })));
        
        this.resoluciones.set(resoluciones);

        // Si no hay resolución seleccionada, limpiar el campo
        if (!this.vehiculoForm.get('resolucionId')?.value) {
          this.vehiculoForm.patchValue({ resolucionId: '' });
        }
      },
      error: (error: any) => {
        (console as any).error('Error cargando resoluciones:', error);
        this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadRutasDisponibles(resolucionId: string): void {
    if (!resolucionId) return;

    this.rutaService.getRutas().subscribe({
      next: (rutas: any) => {
        // Filtrar rutas de la resolución seleccionada
        const rutasResolucion = (rutas as any).filter((r: any) => (r as any).resolucionId === resolucionId);
        this.rutasDisponibles.set(rutasResolucion);
      },
      error: (error: any) => {
        (console as any).error('Error cargando rutas:', error);
        this.snackBar.open('Error al cargar rutas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.vehiculoForm.valid) {
      this.isSubmitting.set(true);
      const formValue = this.vehiculoForm.value;

      if (this.modalMode()) {
        // Modo modal: emitir evento
        const vehiculoCreate: VehiculoCreate = {
          placa: (formValue as any).placa,
          marca: (formValue as any).marca,
          modelo: (formValue as any).modelo,
          categoria: (formValue as any).categoria,
          anioFabricacion: (formValue as any).anioFabricacion,
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
          tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
          rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
          tuc: (formValue as any).numeroTuc ? {
            nroTuc: (formValue as any).numeroTuc,
            fechaEmision: new Date().toISOString()
          } : undefined,
          datosTecnicos: {
            ...(formValue as any).datosTecnicos,
            asientos: (formValue as any).asientos
          }
        };

        this.vehiculoCreated.emit(vehiculoCreate);
        this.vehiculoForm.reset({
          categoria: 'M3',
          estado: 'ACTIVO',
          empresaActualId: this.empresaId(),
          resolucionId: this.resolucionId(),
          rutasAsignadasIds: [],
          datosTecnicos: {
            motor: '',
            chasis: '',
            cilindros: '',
            ejes: '',
            ruedas: '',
            pesoNeto: '',
            pesoBruto: '',
            medidas: {
              largo: '',
              ancho: '',
              alto: ''
            }
          }
        });
        this.isSubmitting.set(false);
      } else {
        // Modo normal: guardar en servicio
        if (this.isEditing()) {
          const vehiculoUpdate: VehiculoUpdate = {
            placa: (formValue as any).placa,
            marca: (formValue as any).marca,
            modelo: (formValue as any).modelo,
            categoria: (formValue as any).categoria,
            anioFabricacion: (formValue as any).anioFabricacion,
            estado: (formValue as any).estado,
            empresaActualId: (formValue as any).empresaActualId,
            resolucionId: (formValue as any).resolucionId,
            rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
            tuc: (formValue as any).numeroTuc ? {
              nroTuc: (formValue as any).numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: {
              ...(formValue as any).datosTecnicos,
              asientos: (formValue as any).asientos
            }
          };

          this.vehiculoService.updateVehiculo(this.vehiculoId()!, vehiculoUpdate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo actualizado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error: any) => {
              (console as any).error('Error updating vehicle:', error);
              this.snackBar.open('Error al actualizar el vehículo', 'Cerrar', { duration: 3000 });
              this.isSubmitting.set(false);
            }
          });
        } else {
          const vehiculoCreate: VehiculoCreate = {
            placa: (formValue as any).placa,
            marca: (formValue as any).marca,
            modelo: (formValue as any).modelo,
            categoria: (formValue as any).categoria,
            anioFabricacion: (formValue as any).anioFabricacion,
            empresaActualId: (formValue as any).empresaActualId,
            resolucionId: (formValue as any).resolucionId,
            tipoServicio: 'PERSONAS', // Valor por defecto - debería venir del formulario
            rutasAsignadasIds: (formValue as any).rutasAsignadasIds || [],
            tuc: (formValue as any).numeroTuc ? {
              nroTuc: (formValue as any).numeroTuc,
              fechaEmision: new Date().toISOString()
            } : undefined,
            datosTecnicos: {
              ...(formValue as any).datosTecnicos,
              asientos: (formValue as any).asientos
            }
          };

          this.vehiculoService.createVehiculo(vehiculoCreate).subscribe({
            next: () => {
              this.snackBar.open('Vehículo creado exitosamente', 'Cerrar', { duration: 3000 });
              this.volver();
            },
            error: (error: any) => {
              (console as any).error('Error creating vehicle:', error);
              this.snackBar.open('Error al crear el vehículo', 'Cerrar', { duration: 3000 });
              this.isSubmitting.set(false);
            }
          });
        }
      }
    }
  }

  convertirAMayusculas(event: any, campo: string): void {
    const valor = event.target.value;
    const valorMayusculas = (valor as any).toUpperCase();

    if (valor !== valorMayusculas) {
      this.vehiculoForm.get(campo)?.setValue(valorMayusculas, { emitEvent: false });
    }
  }

  onEmpresaChange(): void {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;

    // Limpiar campos dependientes
    this.vehiculoForm.patchValue({
      resolucionId: '',
      rutasAsignadasIds: []
    });

    // Cargar resoluciones de la empresa seleccionada
    if (empresaId) {
      this.loadResoluciones(empresaId);
    } else {
      this.resoluciones.set([]);
      this.rutasDisponibles.set([]);
    }
  }

  onResolucionChange(): void {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;

    // Limpiar rutas asignadas
    this.vehiculoForm.patchValue({
      rutasAsignadasIds: []
    });

    // Cargar rutas disponibles de la resolución seleccionada
    if (resolucionId) {
      this.loadRutasDisponibles(resolucionId);
    } else {
      this.rutasDisponibles.set([]);
    }
  }

  puedeSeleccionarRutas(): boolean {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    const hayRutasDisponibles = this.rutasDisponibles().length > 0;
    return !!empresaId && !!resolucionId && hayRutasDisponibles;
  }

  getRutasHint(): string {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;

    if (!empresaId) {
      return 'Selecciona una empresa primero';
    }

    if (!resolucionId) {
      return 'Selecciona una resolución primero';
    }

    if (this.rutasDisponibles().length === 0) {
      return 'No hay rutas disponibles en esta resolución';
    }

    return `Selecciona las rutas autorizadas (${this.rutasDisponibles().length} disponibles)`;
  }

  onRutaCheckboxChange(rutaId: string, checked: boolean): void {
    const rutasControl = this.vehiculoForm.get('rutasAsignadasIds');
    const currentValue = rutasControl?.value || [];

    if (checked) {
      // Agregar la ruta si no está ya seleccionada
      if (!(currentValue as any).includes(rutaId)) {
        rutasControl?.setValue([...currentValue, rutaId]);
      }
    } else {
      // Remover la ruta si está seleccionada
      rutasControl?.setValue((currentValue as any).filter((id: string) => id !== rutaId));
    }

    // Marcar el control como touched para activar validaciones
    rutasControl?.markAsTouched();
  }

  calcularCargaUtil(): number {
    const pesoBruto = this.vehiculoForm.get('(datosTecnicos as any).pesoBruto')?.value;
    const pesoNeto = this.vehiculoForm.get('(datosTecnicos as any).pesoNeto')?.value;
    if (pesoBruto && pesoNeto) {
      return Number((pesoBruto - pesoNeto).toFixed(3));
    }
    return 0;
  }

  volver(): void {
    this.router.navigate(['/vehiculos']);
  }

  // Métodos para el modal de gestión de vehículos
  vehiculoSeleccionado = signal<Vehiculo | null>(null);

  getEmpresaNombre(): string {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    if (!empresaId) return 'No seleccionada';

    const empresa = this.empresas().find((e: any) => (e as any).id === empresaId);
    return empresa ? `${(empresa as any).ruc} - ${(empresa as any).razonSocial.principal}` : 'No encontrada';
  }

  getResolucionNumero(): string {
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    if (!resolucionId) return 'No seleccionada';

    const resolucion = this.resoluciones().find((r: any) => (r as any).id === resolucionId);
    return resolucion ? `${(resolucion as any).nroResolucion} - ${(resolucion as any).tipoTramite}` : 'No encontrada';
  }

  puedeGestionarVehiculos(): boolean {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;
    return !!empresaId && !!resolucionId;
  }

  abrirModalVehiculos(): void {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    const resolucionId = this.vehiculoForm.get('resolucionId')?.value;

    if (!empresaId || !resolucionId) {
      this.snackBar.open('Debes seleccionar una empresa y resolución primero', 'Cerrar', { duration: 3000 });
      return;
    }

    const empresa = this.empresas().find((e: any) => (e as any).id === empresaId);
    const resolucion = this.resoluciones().find((r: any) => (r as any).id === resolucionId);

    if (!empresa || !resolucion) {
      this.snackBar.open('Error: Empresa o resolución no encontrada', 'Cerrar', { duration: 3000 });
      return;
    }

    // Abrir el modal de gestión de vehículos
    const dialogRef = this.dialog.open(VehiculosResolucionModalComponent, {
      data: { empresa, resolucion },
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px'
    });

    // Escuchar cuando se cierre el modal
    (dialogRef as any).afterClosed().subscribe((result: any) => {
      if (result) {
        // Si se seleccionó un vehículo, actualizar el formulario
        this.vehiculoSeleccionado.set(result);
        this.snackBar.open(`Vehículo seleccionado: ${result.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
} 