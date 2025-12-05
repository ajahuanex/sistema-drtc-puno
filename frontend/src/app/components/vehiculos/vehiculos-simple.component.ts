import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { TransferirVehiculoModalComponent } from './transferir-vehiculo-modal.component';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private vehiculoModalService = inject(VehiculoModalService);

  // Signals
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(false);
  vehiculosFiltrados = signal<Vehiculo[]>([]);

  // Paginación
  pageSize = 10;
  currentPage = 0;

  // Computed properties
  displayedColumns = ['placa', 'marca', 'empresa', 'categoria', 'estado', 'anio', 'acciones'];
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      placa: [''],
      marca: [''],
      empresaId: [''],
      estado: [''],
      categoria: ['']
    });
  }

  ngOnInit(): void {
    this.cargarVehiculos();
    this.cargarEmpresas();
  }

  cargarVehiculos(): void {
    this.cargando.set(true);
    console.log('CARGANDO VEHÍCULOS...');

    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        console.log('VEHÍCULOS CARGADOS:', vehiculos);
        this.vehiculos.set(vehiculos);
        this.vehiculosFiltrados.set(vehiculos);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('ERROR CARGANDO VEHÍCULOS:', error);
        this.cargando.set(false);
        this.snackBar.open('ERROR AL CARGAR LOS VEHÍCULOS', 'CERRAR', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  cargarEmpresas(): void {
    this.empresaService.getEmpresas(0, 100).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EMPRESAS:', error);
      }
    });
  }

  recargarVehiculos(): void {
    console.log('RECARGANDO VEHÍCULOS MANUALMENTE...');
    this.cargarVehiculos();
  }

  aplicarFiltros(): void {
    const filtros = this.filtrosForm.value;
    console.log('APLICANDO FILTROS:', filtros);

    let vehiculosFiltrados = [...this.vehiculos()];

    if (filtros.placa) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.placa.toLowerCase().includes(filtros.placa.toLowerCase())
      );
    }

    if (filtros.marca) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.marca.toLowerCase().includes(filtros.marca.toLowerCase())
      );
    }

    if (filtros.empresaId) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.empresaActualId === filtros.empresaId
      );
    }

    if (filtros.estado) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.estado === filtros.estado
      );
    }

    if (filtros.categoria) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.categoria === filtros.categoria
      );
    }

    this.vehiculosFiltrados.set(vehiculosFiltrados);
    this.currentPage = 0;
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.vehiculosFiltrados.set(this.vehiculos());
    this.currentPage = 0;
  }

  getPaginatedVehiculos(): Vehiculo[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.vehiculosFiltrados().slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  getVehiculosActivos(): number {
    return this.vehiculos().filter(v => v.estado === 'ACTIVO').length;
  }

  getVehiculosPorEstado(estado: string): number {
    return this.vehiculos().filter(v => v.estado === estado).length;
  }

  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa?.razonSocial?.principal || 'N/A';
  }

  nuevoVehiculo(): void {
    this.vehiculoModalService.openCreateModal().subscribe({
      next: (vehiculo: any) => {
        console.log('✅ Vehículo creado:', vehiculo);
        this.snackBar.open('VEHÍCULO CREADO CORRECTAMENTE', 'CERRAR', { duration: 3000 });
        this.cargarVehiculos();
      },
      error: (error: any) => {
        console.error('❌ Error al crear vehículo:', error);
      }
    });
  }

  cargaMasivaVehiculos(): void {
    this.router.navigate(['/vehiculos/carga-masiva']);
  }

  verDetalle(vehiculo: Vehiculo): void {
    this.router.navigate(['/vehiculos', vehiculo.id]);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    this.vehiculoModalService.openEditModal(vehiculo).subscribe({
      next: (vehiculoActualizado: any) => {
        console.log('✅ Vehículo actualizado:', vehiculoActualizado);
        this.snackBar.open('VEHÍCULO ACTUALIZADO CORRECTAMENTE', 'CERRAR', { duration: 3000 });
        this.cargarVehiculos();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar vehículo:', error);
      }
    });
  }

  verHistorial(vehiculo: Vehiculo): void {
    this.router.navigate(['/vehiculos', vehiculo.id, 'historial']);
  }

  transferirVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(TransferirVehiculoModalComponent, {
      width: '600px',
      data: {
        vehiculo: vehiculo,
        empresas: this.empresas()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('VEHÍCULO TRANSFERIDO:', result);
        this.snackBar.open('VEHÍCULO TRANSFERIDO EXITOSAMENTE', 'CERRAR', { duration: 3000 });
        this.cargarVehiculos();
      }
    });
  }

  duplicarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
  }

  solicitarBajaVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    if (confirm('¿ESTÁ SEGURO DE QUE DESEA ELIMINAR ESTE VEHÍCULO? ESTA ACCIÓN NO SE PUEDE DESHACER.')) {
      this.vehiculoService.deleteVehiculo(vehiculo.id).subscribe({
        next: () => {
          this.snackBar.open('VEHÍCULO ELIMINADO EXITOSAMENTE', 'CERRAR', { duration: 3000 });
          this.cargarVehiculos();
        },
        error: (error) => {
          console.error('ERROR ELIMINANDO VEHÍCULO:', error);
          this.snackBar.open('ERROR AL ELIMINAR EL VEHÍCULO', 'CERRAR', { duration: 3000 });
        }
      });
    }
  }

  exportarVehiculos(): void {
    // TODO: Implementar exportación cuando el servicio esté disponible
    this.snackBar.open('FUNCIÓN DE EXPORTACIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
    
    // Código comentado hasta que el servicio tenga el método exportarVehiculos
    /*
    this.vehiculoService.exportarVehiculos('excel').subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vehiculos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('ARCHIVO EXPORTADO EXITOSAMENTE', 'CERRAR', { duration: 3000 });
      },
      error: (error: any) => {
        console.error('ERROR EXPORTANDO VEHÍCULOS:', error);
        this.snackBar.open('ERROR AL EXPORTAR VEHÍCULOS', 'CERRAR', { duration: 3000 });
      }
    });
    */
  }

  // Métodos de historial
  actualizarHistorialTodos(): void {
    this.snackBar.open('ACTUALIZANDO HISTORIAL...', 'CERRAR', { duration: 2000 });
    // TODO: Implementar actualización de historial
  }

  verEstadisticasHistorial(): void {
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
  }

  marcarVehiculosActuales(): void {
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
  }

  verEstadisticasFiltrado(): void {
    this.snackBar.open('FUNCIÓN EN DESARROLLO', 'CERRAR', { duration: 3000 });
  }
}
