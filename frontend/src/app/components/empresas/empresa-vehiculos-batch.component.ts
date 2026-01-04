import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { VehiculoCreate, Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { ResolucionService } from '../../services/resolucion.service';
import { AgregarVehiculosModalComponent } from './agregar-vehiculos-modal.component';

@Component({
  selector: 'app-empresa-vehiculos-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './empresa-vehiculos-batch.component.html',
  styleUrls: ['./empresa-vehiculos-batch.component.scss']
})
export class EmpresaVehiculosBatchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  batchForm!: FormGroup;
  isLoading = signal(false);
  isSubmitting = signal(false);
  empresa = signal<Empresa | null>(null);
  empresaId = signal<string | null>(null);
  resoluciones = signal<Resolucion[]>([]);
  resolucionesJerarquicas = signal<Resolucion[]>([]);
  vehiculos = signal<Vehiculo[]>([]);

  // Columnas para las tablas
  columnasResoluciones = ['numero', 'tipo', 'resuelve', 'fechaEmision', 'vigencia', 'estado', 'vehiculos', 'acciones'];
  columnasVehiculos = ['placa', 'marcaModelo', 'categoria', 'anio', 'resolucion', 'tuc', 'estado', 'acciones'];

  ngOnInit(): void {
    this.empresaId.set(this.route.snapshot.paramMap.get('id'));
    this.initializeForm();
    this.loadEmpresa();
    this.loadResoluciones();
    this.loadVehiculos();
  }

  private initializeForm(): void {
    this.batchForm = this.fb.group({
      // Configuración global
      resolucionPredeterminada: [''],
      rutasPredeterminadas: [[]],
      categoriaPredeterminada: ['M3']
    });
  }

  private loadEmpresa(): void {
    if (this.empresaId()) {
      this.isLoading.set(true);
      this.empresaService.getEmpresa(this.empresaId()!).subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error cargando empresa:', error);
          this.snackBar.open('Error al cargar la empresa', 'Cerrar', { duration: 5000 });
          this.isLoading.set(false);
          this.volver();
        }
      });
    }
  }

  private loadResoluciones(): void {
    if (this.empresaId()) {
      this.resolucionService.getResolucionesPorEmpresa(this.empresaId()!).subscribe({
        next: (resoluciones) => {
          // El servicio devuelve una lista plana.
          this.resoluciones.set(resoluciones);

          // Filtramos las padres para posible uso jerárquico
          const padres = resoluciones.filter(r => r.tipoResolucion === 'PADRE');
          this.resolucionesJerarquicas.set(padres);
        },
        error: (error) => {
          console.error('Error cargando resoluciones:', error);
          this.snackBar.open('Error al cargar resoluciones', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  private loadVehiculos(): void {
    if (this.empresaId()) {
      this.vehiculoService.getVehiculosPorEmpresa(this.empresaId()!).subscribe({
        next: (vehiculos: Vehiculo[]) => {
          this.vehiculos.set(vehiculos);
        },
        error: (error: any) => {
          console.error('Error cargando vehículos:', error);
          this.snackBar.open('Error al cargar vehículos', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  // Método para obtener todas las resoluciones (lista plana)
  todasLasResoluciones(): Resolucion[] {
    return this.resoluciones();
  }

  // Método para obtener datos para la tabla (lista plana)
  resolucionesParaTabla(): Resolucion[] {
    return this.todasLasResoluciones();
  }

  // Método para obtener cantidad de vehículos por resolución
  getCantidadVehiculos(resolucionId: string): number {
    return this.vehiculos().filter(v => v.resolucionId === resolucionId).length;
  }

  // Método para obtener número de resolución
  getResolucionNumero(resolucionId: string): string {
    const resolucion = this.todasLasResoluciones().find(r => r.id === resolucionId);
    return resolucion ? resolucion.nroResolucion : 'N/A';
  }

  agregarResolucion(): void {
    this.snackBar.open('Funcionalidad de agregar resolución en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verVehiculos(resolucion: Resolucion): void {
    const vehiculosResolucion = this.vehiculos().filter(v => v.resolucionId === resolucion.id);
    this.snackBar.open(`Vehículos de ${resolucion.nroResolucion}: ${vehiculosResolucion.length}`, 'Cerrar', { duration: 3000 });
  }

  agregarVehiculos(resolucion: Resolucion): void {
    const dialogRef = this.dialog.open(AgregarVehiculosModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        resolucion: resolucion,
        empresaId: this.empresaId()
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Actualizar la lista de vehículos con los nuevos
        const nuevosVehiculos = result.vehiculos.map((vehiculo: VehiculoCreate) => ({
          id: Date.now().toString(), // ID temporal
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          categoria: vehiculo.categoria,
          anioFabricacion: vehiculo.anioFabricacion,
          estado: 'ACTIVO',
          estaActivo: true,
          empresaActualId: this.empresaId()!,
          resolucionId: result.resolucionId,
          rutasAsignadasIds: vehiculo.rutasAsignadasIds || [],
          tuc: vehiculo.tuc,
          datosTecnicos: vehiculo.datosTecnicos
        }));

        this.vehiculos.update(current => [...current, ...nuevosVehiculos]);

        this.snackBar.open(`${result.vehiculos.length} vehículos agregados exitosamente`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  verDetallesVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Ver detalles de ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Editar ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open(`Eliminar ${vehiculo.placa}`, 'Cerrar', { duration: 3000 });
  }

  volver(): void {
    this.router.navigate(['/empresas', this.empresaId()]);
  }
}