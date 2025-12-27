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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { TransferirVehiculoModalComponent } from './transferir-vehiculo-modal.component';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { GestionarRutasEspecificasModalComponent } from './gestionar-rutas-especificas-modal.component';

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
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    TransferirVehiculoModalComponent,
    VehiculoModalComponent
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

  // Configuración de columnas
  availableColumns = [
    { key: 'placa', label: 'PLACA', visible: true, required: true },
    { key: 'marca', label: 'MARCA / MODELO', visible: true, required: false },
    { key: 'empresa', label: 'EMPRESA', visible: true, required: false },
    { key: 'categoria', label: 'CATEGORÍA', visible: true, required: false },
    { key: 'estado', label: 'ESTADO', visible: true, required: false },
    { key: 'anio', label: 'AÑO', visible: true, required: false },
    { key: 'tuc', label: 'TUC', visible: false, required: false },
    { key: 'resolucion', label: 'RESOLUCIÓN', visible: false, required: false },
    { key: 'rutas-especificas', label: 'RUTAS', visible: true, required: false },
    { key: 'acciones', label: 'ACCIONES', visible: true, required: true }
  ];

  // Computed properties
  get displayedColumns(): string[] {
    return this.availableColumns
      .filter(col => col.visible)
      .map(col => col.key);
  }
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      placa: [''],
      marca: [''],
      empresaId: [''],
      estado: [''],
      categoria: ['']
    });

    // Cargar configuración de columnas desde localStorage
    this.loadColumnConfiguration();
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
    console.log('🔍 ABRIENDO MODAL NUEVO VEHÍCULO...');
    
    try {
      const dialogRef = this.dialog.open(VehiculoModalComponent, {
        width: '900px',
        maxHeight: '90vh',
        data: {
          mode: 'create'
        },
        disableClose: true
      });

      console.log('✅ Modal abierto directamente:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔍 Modal cerrado con resultado:', result);
        
        if (result && result.success && result.vehiculosCreados) {
          // Modo múltiple - vehículos ya fueron guardados en el modal
          console.log('✅ Vehículos creados en modo múltiple:', result.vehiculosCreados);
          this.snackBar.open(`${result.count} VEHÍCULO(S) CREADO(S) CORRECTAMENTE`, 'CERRAR', { duration: 3000 });
          this.cargarVehiculos();
        } else if (result && result.vehiculo) {
          // Modo individual - necesitamos guardar el vehículo
          console.log('✅ Datos del vehículo recibidos:', result.vehiculo);
          
          // Llamar al servicio para guardar en el backend
          this.cargando.set(true);
          this.vehiculoService.createVehiculo(result.vehiculo).subscribe({
            next: (vehiculoCreado) => {
              console.log('✅ Vehículo guardado en backend:', vehiculoCreado);
              this.cargando.set(false);
              this.snackBar.open('VEHÍCULO CREADO CORRECTAMENTE', 'CERRAR', { duration: 3000 });
              this.cargarVehiculos();
            },
            error: (error) => {
              console.error('❌ Error guardando vehículo en backend:', error);
              this.cargando.set(false);
              this.snackBar.open('ERROR AL GUARDAR EL VEHÍCULO', 'CERRAR', { 
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
              });
            }
          });
        } else {
          console.log('ℹ️ Modal cerrado sin crear vehículo');
        }
      });
    } catch (error) {
      console.error('❌ Error abriendo modal:', error);
      this.snackBar.open('ERROR ABRIENDO EL MODAL', 'CERRAR', { duration: 3000 });
    }
  }

  cargaMasivaVehiculos(): void {
    this.router.navigate(['/vehiculos/carga-masiva']);
  }

  verDetalle(vehiculo: Vehiculo): void {
    this.router.navigate(['/vehiculos', vehiculo.id]);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    console.log('🔍 ABRIENDO MODAL EDITAR VEHÍCULO:', vehiculo);
    
    try {
      const dialogRef = this.dialog.open(VehiculoModalComponent, {
        width: '900px',
        maxHeight: '90vh',
        data: {
          mode: 'edit',
          vehiculo: vehiculo
        },
        disableClose: true
      });

      console.log('✅ Modal de edición abierto:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔍 Modal de edición cerrado con resultado:', result);
        if (result && result.vehiculo) {
          console.log('✅ Datos del vehículo actualizados:', result.vehiculo);
          
          // Llamar al servicio para actualizar en el backend
          this.cargando.set(true);
          this.vehiculoService.updateVehiculo(vehiculo.id, result.vehiculo).subscribe({
            next: (vehiculoActualizado) => {
              console.log('✅ Vehículo actualizado en backend:', vehiculoActualizado);
              this.cargando.set(false);
              this.snackBar.open('VEHÍCULO ACTUALIZADO CORRECTAMENTE', 'CERRAR', { duration: 3000 });
              this.cargarVehiculos();
            },
            error: (error) => {
              console.error('❌ Error actualizando vehículo en backend:', error);
              this.cargando.set(false);
              this.snackBar.open('ERROR AL ACTUALIZAR EL VEHÍCULO', 'CERRAR', { 
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
              });
            }
          });
        } else {
          console.log('ℹ️ Modal cerrado sin actualizar vehículo');
        }
      });
    } catch (error) {
      console.error('❌ Error abriendo modal de edición:', error);
      this.snackBar.open('ERROR ABRIENDO EL MODAL DE EDICIÓN', 'CERRAR', { duration: 3000 });
    }
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
  }

  getRutasEspecificasCount(vehiculo: Vehiculo): number {
    // TODO: Implementar conteo real de rutas específicas
    // Por ahora retorna un valor simulado
    return Math.floor(Math.random() * 4); // 0-3 rutas específicas
  }

  gestionarRutasEspecificas(vehiculo: Vehiculo): void {
    console.log('🛣️ Gestionar rutas específicas para vehículo:', vehiculo.placa);
    
    const dialogRef = this.dialog.open(GestionarRutasEspecificasModalComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        vehiculo: vehiculo,
        empresas: this.empresas()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Rutas específicas actualizadas:', result);
        this.snackBar.open('RUTAS ESPECÍFICAS ACTUALIZADAS EXITOSAMENTE', 'CERRAR', { duration: 3000 });
        this.cargarVehiculos();
      }
    });
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

  // Métodos de configuración de columnas
  loadColumnConfiguration(): void {
    const savedConfig = localStorage.getItem('vehiculos-column-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.availableColumns.forEach(col => {
          const savedCol = config.find((c: any) => c.key === col.key);
          if (savedCol && !col.required) {
            col.visible = savedCol.visible;
          }
        });
      } catch (error) {
        console.error('Error cargando configuración de columnas:', error);
      }
    }
  }

  saveColumnConfiguration(): void {
    const config = this.availableColumns.map(col => ({
      key: col.key,
      visible: col.visible
    }));
    localStorage.setItem('vehiculos-column-config', JSON.stringify(config));
  }

  toggleColumn(columnKey: string): void {
    const column = this.availableColumns.find(col => col.key === columnKey);
    if (column && !column.required) {
      column.visible = !column.visible;
      this.saveColumnConfiguration();
    }
  }

  resetColumns(): void {
    this.availableColumns.forEach(col => {
      if (col.key === 'placa' || col.key === 'acciones') {
        col.visible = true; // Columnas requeridas siempre visibles
      } else if (col.key === 'marca' || col.key === 'empresa' || col.key === 'categoria' || 
                 col.key === 'estado' || col.key === 'anio' || col.key === 'rutas-especificas') {
        col.visible = true; // Columnas por defecto visibles
      } else {
        col.visible = false; // Otras columnas ocultas por defecto
      }
    });
    this.saveColumnConfiguration();
    this.snackBar.open('CONFIGURACIÓN DE COLUMNAS RESTABLECIDA', 'CERRAR', { duration: 3000 });
  }

  getVisibleColumnsCount(): number {
    return this.availableColumns.filter(col => col.visible).length;
  }

  getHiddenColumnsCount(): number {
    return this.availableColumns.filter(col => !col.visible && !col.required).length;
  }

  // Métodos para obtener datos adicionales de columnas opcionales
  getVehiculoTuc(vehiculo: Vehiculo): string {
    if (vehiculo.tuc && typeof vehiculo.tuc === 'object' && 'nroTuc' in vehiculo.tuc) {
      return vehiculo.tuc.nroTuc;
    }
    return 'N/A';
  }

  getVehiculoResolucion(vehiculo: Vehiculo): string {
    // TODO: Implementar obtención de número de resolución
    return vehiculo.resolucionId ? 'R-XXXX-2024' : 'N/A';
  }
}
