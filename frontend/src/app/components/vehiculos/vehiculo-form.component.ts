import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { RutaService } from '../../services/ruta.service';
import { Empresa, EstadoEmpresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { Ruta } from '../../models/ruta.model';
import { placaPeruanaValidator } from '../../validators/vehiculo.validators';

@Component({
  selector: 'app-vehiculo-form',
  standalone: true,
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
    MatTooltipModule
  ],
  templateUrl: './vehiculo-form.component.html',
  styleUrls: ['./vehiculo-form.component.css']
})
export class VehiculoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);

  vehiculoForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  vehiculoId = signal<string | null>(null);

  // Datos de referencia
  empresas = signal<Empresa[]>([]);
  resoluciones = signal<Resolucion[]>([]);
  rutasDisponibles = signal<Ruta[]>([]);
  tiposServicioDisponibles = signal<string[]>([]);

  // VehiculoSolo
  vehiculoSoloEncontrado = signal(false);
  vehiculoSoloData = signal<any>(null);
  placaBuscada = signal(false);

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatosIniciales();

    // Si hay ID en la ruta, cargar vehículo para editar
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.vehiculoId.set(id);
      this.cargarVehiculo(id);
    }
  }

  private inicializarFormulario(): void {
    this.vehiculoForm = this.fb.group({
      placa: ['', [Validators.required, placaPeruanaValidator()]],
      empresaActualId: ['', Validators.required],
      tipoServicio: ['', Validators.required],
      resolucionId: [''],
      estado: ['ACTIVO', Validators.required],
      rutasAsignadasIds: [[]],
      observaciones: [''],
      vehiculoDataId: [''] // Campo oculto para vincular con VehiculoData
    });
  }

  private async cargarDatosIniciales(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      // Cargar empresas
      this.empresaService.getEmpresas().subscribe({
        next: (empresas) => {
          this.empresas.set(empresas.filter(e => e.estado === EstadoEmpresa.AUTORIZADO));
        },
        error: (error) => console.error('Error cargando empresas:', error)
      });

      // Cargar resoluciones
      this.resolucionService.getResoluciones().subscribe({
        next: (response: any) => {
          this.resoluciones.set(response || []);
        },
        error: (error) => console.error('Error cargando resoluciones:', error)
      });

      // Cargar rutas
      this.rutaService.getRutas().subscribe({
        next: (response: any) => {
          this.rutasDisponibles.set(response || []);
        },
        error: (error) => console.error('Error cargando rutas:', error)
      });

    } finally {
      this.isLoading.set(false);
    }
  }

  buscarVehiculoSoloPorPlaca(): void {
    const placa = this.vehiculoForm.get('placa')?.value;
    if (!placa || placa.length < 6) {
      return;
    }

    this.placaBuscada.set(true);
    this.isLoading.set(true);

    // Buscar en VehiculoData (vehiculo_solo)
    this.vehiculoService.buscarVehiculoSoloPorPlaca(placa).subscribe({
      next: (vehiculoData) => {
        if (vehiculoData) {
          this.vehiculoSoloEncontrado.set(true);
          this.vehiculoSoloData.set(vehiculoData);
          this.vehiculoForm.patchValue({ vehiculoDataId: vehiculoData.id });
          this.snackBar.open('✅ Datos técnicos encontrados', 'Cerrar', { duration: 3000 });
        } else {
          this.vehiculoSoloEncontrado.set(false);
          this.vehiculoSoloData.set(null);
          this.vehiculoForm.patchValue({ vehiculoDataId: '' });
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error buscando vehículo data:', error);
        this.vehiculoSoloEncontrado.set(false);
        this.vehiculoSoloData.set(null);
        this.isLoading.set(false);
      }
    });
  }

  onEmpresaChange(): void {
    const empresaId = this.vehiculoForm.get('empresaActualId')?.value;
    if (!empresaId) {
      this.tiposServicioDisponibles.set([]);
      return;
    }

    const empresa = this.empresas().find(e => e.id === empresaId);
    if (empresa && empresa.tiposServicio) {
      this.tiposServicioDisponibles.set(empresa.tiposServicio);
    }
  }

  verDetallesVehiculoSolo(): void {
    const vehiculoSoloId = this.vehiculoSoloData()?.id;
    if (vehiculoSoloId) {
      window.open(`/vehiculos-solo/${vehiculoSoloId}`, '_blank');
    }
  }

  crearVehiculoSolo(): void {
    const placa = this.vehiculoForm.get('placa')?.value;
    this.router.navigate(['/vehiculos-solo/nuevo'], { 
      queryParams: { placa } 
    });
  }

  private cargarVehiculo(id: string): void {
    this.isLoading.set(true);
    this.vehiculoService.getVehiculoById(id).subscribe({
      next: (vehiculo: any) => {
        this.vehiculoForm.patchValue({
          placa: vehiculo.placa,
          empresaActualId: vehiculo.empresaActualId,
          tipoServicio: vehiculo.tipoServicio,
          resolucionId: vehiculo.resolucionId,
          estado: vehiculo.estado,
          rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
          observaciones: vehiculo.observaciones,
          vehiculoDataId: vehiculo.vehiculoDataId || vehiculo.vehiculoSoloId // Compatibilidad
        });

        // Si tiene vehiculoDataId, cargar los datos
        if (vehiculo.vehiculoDataId || vehiculo.vehiculoSoloId) {
          this.buscarVehiculoSoloPorPlaca();
        }

        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error cargando vehículo:', error);
        this.snackBar.open('Error al cargar el vehículo', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  guardar(): void {
    if (!this.vehiculoForm.valid) {
      this.snackBar.open('Complete los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.vehiculoSoloEncontrado()) {
      this.snackBar.open('Debe vincular el vehículo con datos técnicos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    const formData = this.vehiculoForm.value;

    // Crear objeto de vehículo SIMPLIFICADO - Solo campos administrativos
    const vehiculoData: any = {
      placa: formData.placa,
      vehiculoDataId: formData.vehiculoDataId, // Referencia a VehiculoData
      empresaActualId: formData.empresaActualId,
      tipoServicio: formData.tipoServicio,
      resolucionId: formData.resolucionId || null,
      estado: formData.estado,
      rutasAsignadasIds: formData.rutasAsignadasIds || [],
      observaciones: formData.observaciones,
      estaActivo: formData.estado === 'ACTIVO'
    };

    const operacion = this.isEditing()
      ? this.vehiculoService.updateVehiculo(this.vehiculoId()!, vehiculoData)
      : this.vehiculoService.createVehiculo(vehiculoData);

    operacion.subscribe({
      next: () => {
        this.snackBar.open(
          `Vehículo ${this.isEditing() ? 'actualizado' : 'creado'} exitosamente`,
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/vehiculos']);
      },
      error: (error: any) => {
        console.error('Error guardando vehículo:', error);
        this.snackBar.open('Error al guardar el vehículo', 'Cerrar', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/vehiculos']);
  }
}
