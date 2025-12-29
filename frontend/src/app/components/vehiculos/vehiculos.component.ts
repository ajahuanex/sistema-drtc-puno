import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { VehiculoService } from '../../services/vehiculo.service';
import { EmpresaService } from '../../services/empresa.service';
import { RutaService } from '../../services/ruta.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { HistorialVehicularComponent } from './historial-vehicular.component';
import { VehiculosEliminadosModalComponent } from './vehiculos-eliminados-modal.component';
import { VehiculoDetalleComponent } from './vehiculo-detalle.component';
import { CambiarEstadoModalComponent } from './cambiar-estado-modal.component';
import { CargaMasivaVehiculosComponent } from './carga-masiva-vehiculos.component';
import { GestionarRutasEspecificasModalComponent } from './gestionar-rutas-especificas-modal.component';
import { TransferirEmpresaModalComponent } from './transferir-empresa-modal.component';

@Component({
  selector: 'app-vehiculos',
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
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Signals para el estado del componente
  vehiculos = signal<Vehiculo[]>([]);
  empresas = signal<Empresa[]>([]);
  rutas = signal<Ruta[]>([]);
  cargando = signal(false);
  vehiculosSeleccionados = signal<Set<string>>(new Set());

  // Configuración de paginación
  paginaActual = signal(0);
  elementosPorPagina = signal(25);

  // Signal para los valores de filtros
  filtrosValues = signal<any>({
    placa: '',
    marca: '',
    empresaId: '',
    estado: '',
    categoria: '',
    mostrarSinResolucion: false
  });

  // Formulario de filtros
  filtrosForm: FormGroup = this.fb.group({
    placa: [''],
    marca: [''],
    empresaId: [''],
    estado: [''],
    categoria: [''],
    mostrarSinResolucion: [false]
  });

  // Configuración de columnas
  availableColumns = [
    { key: 'select', label: 'Selección', visible: true, required: true },
    { key: 'placa', label: 'Placa', visible: true, required: true },
    { key: 'marca', label: 'Marca/Modelo', visible: true, required: false },
    { key: 'empresa', label: 'Empresa', visible: true, required: false },
    { key: 'categoria', label: 'Categoría', visible: true, required: false },
    { key: 'estado', label: 'Estado', visible: true, required: false },
    { key: 'anio', label: 'Año', visible: false, required: false },
    { key: 'tuc', label: 'TUC', visible: false, required: false },
    { key: 'resolucion', label: 'Resolución', visible: false, required: false },
    { key: 'sede-registro', label: 'Sede Registro', visible: false, required: false },
    { key: 'color', label: 'Color', visible: false, required: false },
    { key: 'numero-serie', label: 'N° Serie', visible: false, required: false },
    { key: 'motor', label: 'Motor', visible: false, required: false },
    { key: 'chasis', label: 'Chasis', visible: false, required: false },
    { key: 'ejes', label: 'Ejes', visible: false, required: false },
    { key: 'asientos', label: 'Asientos', visible: false, required: false },
    { key: 'peso-neto', label: 'Peso Neto', visible: false, required: false },
    { key: 'peso-bruto', label: 'Peso Bruto', visible: false, required: false },
    { key: 'combustible', label: 'Combustible', visible: false, required: false },
    { key: 'cilindrada', label: 'Cilindrada', visible: false, required: false },
    { key: 'potencia', label: 'Potencia', visible: false, required: false },
    { key: 'medidas', label: 'Medidas', visible: false, required: false },
    { key: 'fecha-registro', label: 'Fecha Registro', visible: false, required: false },
    { key: 'fecha-actualizacion', label: 'Última Actualización', visible: false, required: false },
    { key: 'observaciones', label: 'Observaciones', visible: false, required: false },
    { key: 'rutas-especificas', label: 'Rutas Específicas', visible: true, required: false },
    { key: 'acciones', label: 'Acciones', visible: true, required: true }
  ];

  // Computed properties
  vehiculosFiltrados = computed(() => {
    const filtros = this.filtrosValues();
    let vehiculosFiltrados = this.vehiculos();

    // FILTRO POR DEFECTO: Solo mostrar vehículos con resolución y empresa
    // A menos que se active explícitamente el checkbox para mostrar sin resolución
    if (!filtros.mostrarSinResolucion) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.resolucionId && v.empresaActualId
      );
    }

    if (filtros.placa) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.placa.toLowerCase().includes(filtros.placa.toLowerCase())
      );
    }

    if (filtros.marca) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        v.marca?.toLowerCase().includes(filtros.marca.toLowerCase())
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

    // Si está activado el checkbox, mostrar SOLO los que NO tienen resolución
    if (filtros.mostrarSinResolucion) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => 
        !v.resolucionId || !v.empresaActualId
      );
    }

    // ORDENAMIENTO POR FECHA MÁS RECIENTE PRIMERO
    // Prioridad: fechaActualizacion > fechaRegistro > fechaCreacion
    vehiculosFiltrados = vehiculosFiltrados.sort((a, b) => {
      const fechaA = this.obtenerFechaMasReciente(a);
      const fechaB = this.obtenerFechaMasReciente(b);
      
      // Ordenar de más reciente a más antiguo (descendente)
      return fechaB.getTime() - fechaA.getTime();
    });

    return vehiculosFiltrados;
  });

  displayedColumns = computed(() => 
    this.availableColumns
      .filter(col => col.visible)
      .map(col => col.key)
  );

  // Getter para usar en el template (Angular no puede usar computed directamente en matHeaderRowDef)
  get displayedColumnsArray(): string[] {
    return this.displayedColumns();
  }

  ngOnInit(): void {
    this.cargarDatos();
    
    // Suscribirse a cambios en el formulario de filtros y actualizar el signal
    this.filtrosForm.valueChanges.subscribe((values) => {
      this.filtrosValues.set(values);
      this.paginaActual.set(0);
    });

    // Inicializar el signal con los valores iniciales del formulario
    this.filtrosValues.set(this.filtrosForm.value);
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    
    Promise.all([
      this.vehiculoService.getVehiculos().toPromise(),
      this.empresaService.getEmpresas().toPromise(),
      this.rutaService.getRutas().toPromise()
    ]).then(([vehiculos, empresas, rutas]) => {
      this.vehiculos.set(vehiculos || []);
      this.empresas.set(empresas || []);
      this.rutas.set(rutas || []);
      this.cargando.set(false);
    }).catch((error: any) => {
      console.error('Error cargando datos:', error);
      this.snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
      this.cargando.set(false);
    });
  }

  // Métodos de filtros
  aplicarFiltros(): void {
    // Actualizar el signal con los valores actuales del formulario
    this.filtrosValues.set(this.filtrosForm.value);
    this.paginaActual.set(0);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    // Actualizar el signal con los valores reseteados
    this.filtrosValues.set(this.filtrosForm.value);
    this.paginaActual.set(0);
  }

  // Métodos de estadísticas
  getVehiculosActivos(): number {
    return this.vehiculos().filter(v => v.estado === 'ACTIVO').length;
  }

  getVehiculosPorEstado(estado: string): number {
    return this.vehiculos().filter(v => v.estado === estado).length;
  }

  // Métodos de paginación
  getPaginatedVehiculos(): Vehiculo[] {
    const vehiculos = this.vehiculosFiltrados();
    const inicio = this.paginaActual() * this.elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    return vehiculos.slice(inicio, fin);
  }

  // Métodos de selección
  isVehiculoSeleccionado(vehiculoId: string): boolean {
    return this.vehiculosSeleccionados().has(vehiculoId);
  }

  toggleVehiculoSeleccion(vehiculoId: string): void {
    const seleccionados = new Set(this.vehiculosSeleccionados());
    if (seleccionados.has(vehiculoId)) {
      seleccionados.delete(vehiculoId);
    } else {
      seleccionados.add(vehiculoId);
    }
    this.vehiculosSeleccionados.set(seleccionados);
  }

  seleccionarTodos(): boolean {
    const vehiculosVisibles = this.getPaginatedVehiculos();
    return vehiculosVisibles.length > 0 && 
           vehiculosVisibles.every(v => this.vehiculosSeleccionados().has(v.id));
  }

  toggleSeleccionarTodos(): void {
    const vehiculosVisibles = this.getPaginatedVehiculos();
    const seleccionados = new Set(this.vehiculosSeleccionados());
    
    if (this.seleccionarTodos()) {
      // Deseleccionar todos los visibles
      vehiculosVisibles.forEach(v => seleccionados.delete(v.id));
    } else {
      // Seleccionar todos los visibles
      vehiculosVisibles.forEach(v => seleccionados.add(v.id));
    }
    
    this.vehiculosSeleccionados.set(seleccionados);
  }

  getVehiculosSeleccionadosCount(): number {
    return this.vehiculosSeleccionados().size;
  }

  limpiarSeleccion(): void {
    this.vehiculosSeleccionados.set(new Set());
  }

  // Métodos de columnas
  toggleColumn(columnKey: string): void {
    const column = this.availableColumns.find(col => col.key === columnKey);
    if (column && !column.required) {
      column.visible = !column.visible;
    }
  }

  getVisibleColumnsCount(): number {
    return this.availableColumns.filter(col => col.visible).length;
  }

  getHiddenColumnsCount(): number {
    return this.availableColumns.filter(col => !col.visible).length;
  }

  resetColumns(): void {
    // Restaurar configuración por defecto
    this.availableColumns.forEach(col => {
      if (['select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'].includes(col.key)) {
        col.visible = true;
      } else {
        col.visible = false;
      }
    });
  }

  // Métodos de utilidad para mostrar datos
  getEmpresaNombre(empresaId: string): string {
    const empresa = this.empresas().find(e => e.id === empresaId);
    return empresa?.razonSocial?.principal || 'Sin empresa';
  }

  getVehiculoTuc(vehiculo: Vehiculo): string {
    return vehiculo.tuc?.nroTuc || 'N/A';
  }

  getVehiculoResolucion(vehiculo: Vehiculo): string {
    return vehiculo.resolucionId || 'Sin resolución';
  }

  getMedidas(vehiculo: Vehiculo): string {
    const medidas = vehiculo.datosTecnicos?.medidas;
    if (!medidas) return 'N/A';
    return `${medidas.largo || 0}x${medidas.ancho || 0}x${medidas.alto || 0}m`;
  }

  getFechaRegistro(vehiculo: Vehiculo): string {
    return vehiculo.fechaRegistro ? new Date(vehiculo.fechaRegistro).toLocaleDateString() : 'N/A';
  }

  getFechaActualizacion(vehiculo: Vehiculo): string {
    return vehiculo.fechaActualizacion ? new Date(vehiculo.fechaActualizacion).toLocaleDateString() : 'N/A';
  }

  getRutasEspecificasCount(vehiculo: Vehiculo): number {
    // Verificar si tiene rutasAsignadasIds (array de IDs de rutas)
    if (vehiculo.rutasAsignadasIds && Array.isArray(vehiculo.rutasAsignadasIds)) {
      return vehiculo.rutasAsignadasIds.length;
    }
    
    // Fallback a rutasEspecificas si existe
    if (vehiculo.rutasEspecificas && Array.isArray(vehiculo.rutasEspecificas)) {
      return vehiculo.rutasEspecificas.length;
    }
    
    return 0;
  }

  getRutasEspecificasText(vehiculo: Vehiculo): string {
    const count = this.getRutasEspecificasCount(vehiculo);
    if (count === 0) return 'Sin rutas';
    
    // Obtener los códigos de las rutas asignadas
    const codigosRutas = this.getRutasCodigosArray(vehiculo);
    
    if (codigosRutas.length === 0) {
      return count === 1 ? '1 ruta' : `${count} rutas`;
    }
    
    // Mostrar los códigos, truncar a 12 caracteres si es muy largo
    const codigosTexto = codigosRutas.join(',');
    if (codigosTexto.length > 12) {
      return codigosTexto.substring(0, 12) + '...';
    }
    
    return codigosTexto;
  }

  getRutasCodigosArray(vehiculo: Vehiculo): string[] {
    const rutasIds = vehiculo.rutasAsignadasIds || [];
    const rutas = this.rutas();
    
    return rutasIds
      .map(rutaId => {
        const ruta = rutas.find((r: Ruta) => r.id === rutaId);
        return ruta?.codigoRuta || null;
      })
      .filter(codigo => codigo !== null)
      .map(codigo => codigo as string)
      .sort(); // Ordenar los códigos
  }

  getRutasCodigosCompletos(vehiculo: Vehiculo): string {
    const codigosRutas = this.getRutasCodigosArray(vehiculo);
    
    if (codigosRutas.length === 0) {
      return 'Sin rutas asignadas';
    }
    
    return codigosRutas.join(', ');
  }

  // Método para obtener la fecha más reciente de un vehículo
  private obtenerFechaMasReciente(vehiculo: Vehiculo): Date {
    const fechas: Date[] = [];
    
    // Agregar fechaActualizacion si existe
    if (vehiculo.fechaActualizacion) {
      fechas.push(new Date(vehiculo.fechaActualizacion));
    }
    
    // Agregar fechaRegistro si existe
    if (vehiculo.fechaRegistro) {
      fechas.push(new Date(vehiculo.fechaRegistro));
    }
    
    // Si no hay fechas, usar fecha muy antigua para que aparezca al final
    if (fechas.length === 0) {
      return new Date(0);
    }
    
    // Retornar la fecha más reciente
    return new Date(Math.max(...fechas.map(fecha => fecha.getTime())));
  }

  // Métodos adicionales requeridos por el template
  gestionarRutasEspecificas(vehiculo: Vehiculo): void {
    this.gestionarRutasVehiculo(vehiculo);
  }

  getRutasAsignadasCompletas(vehiculo: Vehiculo): string {
    return this.getRutasCodigosCompletos(vehiculo);
  }

  getRutasAsignadasCount(vehiculo: Vehiculo): number {
    return this.getRutasEspecificasCount(vehiculo);
  }

  getRutasAsignadas(vehiculo: Vehiculo): string {
    return this.getRutasEspecificasText(vehiculo);
  }

  verDetalle(vehiculo: Vehiculo): void {
    this.verDetalleVehiculo(vehiculo);
  }

  verHistorial(vehiculo: Vehiculo): void {
    this.verHistorialVehiculo(vehiculo);
  }

  transferirVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(TransferirEmpresaModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        this.snackBar.open(
          `Vehículo ${vehiculo.placa} transferido exitosamente`,
          'Cerrar',
          { duration: 5000 }
        );
        this.recargarVehiculos();
      }
    });
  }

  duplicarVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open('Función de duplicación en desarrollo', 'Cerrar', { duration: 3000 });
  }

  solicitarBajaVehiculo(vehiculo: Vehiculo): void {
    this.snackBar.open('Función de solicitud de baja en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // Propiedades para el paginador
  get pageSize(): number {
    return this.elementosPorPagina();
  }

  get currentPage(): number {
    return this.paginaActual();
  }

  onPageChange(event: any): void {
    this.paginaActual.set(event.pageIndex);
    this.elementosPorPagina.set(event.pageSize);
  }

  // Métodos de acciones
  nuevoVehiculo(): void {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.recargarVehiculos();
      }
    });
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { 
        mode: 'edit',
        vehiculo: vehiculo
      }
    });

    // Suscribirse al evento de actualización del modal
    const modalInstance = dialogRef.componentInstance;
    
    modalInstance.vehiculoUpdated.subscribe((vehiculoActualizado) => {
      console.log('Vehículo actualizado:', vehiculoActualizado);
      this.recargarVehiculos();
    });

    modalInstance.modalClosed.subscribe(() => {
      console.log('Modal cerrado');
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.recargarVehiculos();
      }
    });
  }

  verDetalleVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(VehiculoDetalleComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'edit') {
        this.editarVehiculo(result.vehiculo);
      }
    });
  }

  cambiarEstadoVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(CambiarEstadoModalComponent, {
      width: '600px',
      data: { vehiculo: vehiculo }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.recargarVehiculos();
      }
    });
  }

  verHistorialVehiculo(vehiculo: Vehiculo): void {
    // Navegar a la página del historial vehicular con filtros específicos del vehículo
    this.router.navigate(['/historial-vehiculos'], {
      queryParams: {
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa
      }
    });
  }

  gestionarRutasVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(GestionarRutasEspecificasModalComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.recargarVehiculos();
      }
    });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar el vehículo ${vehiculo.placa}?\n\n` +
      `El vehículo será marcado como eliminado pero se mantendrá en el sistema para fines de auditoría.`
    );

    if (confirmar) {
      this.vehiculoService.deleteVehiculo(vehiculo.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Vehículo ${vehiculo.placa} eliminado exitosamente`,
            'Cerrar',
            { 
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
          this.cargarDatos(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error eliminando vehículo:', error);
          
          let mensaje = 'Error al eliminar el vehículo';
          
          if (error.status === 422) {
            // Error de validación - el vehículo tiene dependencias
            mensaje = `No se puede eliminar el vehículo ${vehiculo.placa}. ` +
                     'Es posible que tenga rutas asignadas, resoluciones activas o esté siendo utilizado en otros procesos.';
          } else if (error.status === 404) {
            mensaje = 'El vehículo no fue encontrado';
          } else if (error.status === 403) {
            mensaje = 'No tienes permisos para eliminar este vehículo';
          } else if (error.status === 0) {
            mensaje = 'Error de conexión. Verifica tu conexión a internet';
          }
          
          this.snackBar.open(mensaje, 'Cerrar', { 
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

  cargaMasivaVehiculos(): void {
    const dialogRef = this.dialog.open(CargaMasivaVehiculosComponent, {
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.recargarVehiculos();
      }
    });
  }

  gestionarRutasEnBloque(): void {
    const vehiculosSeleccionados = Array.from(this.vehiculosSeleccionados())
      .map(id => this.vehiculos().find(v => v.id === id))
      .filter(v => v !== undefined) as Vehiculo[];

    if (vehiculosSeleccionados.length === 0) {
      this.snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    // Aquí implementarías la lógica para gestionar rutas en bloque
    this.snackBar.open(
      `Gestionando rutas para ${vehiculosSeleccionados.length} vehículos`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  verVehiculosEliminados(): void {
    this.vehiculoService.getVehiculosEliminados().subscribe({
      next: (vehiculosEliminados) => {
        if (vehiculosEliminados.length === 0) {
          this.snackBar.open('No hay vehículos eliminados', 'Cerrar', { duration: 3000 });
          return;
        }

        // Mostrar modal con vehículos eliminados
        const dialogRef = this.dialog.open(VehiculosEliminadosModalComponent, {
          width: '90%',
          maxWidth: '1200px',
          data: { vehiculosEliminados }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.restaurado) {
            this.cargarDatos(); // Recargar datos si se restauró algún vehículo
          }
        });
      },
      error: (error) => {
        console.error('Error obteniendo vehículos eliminados:', error);
        this.snackBar.open('Error al obtener vehículos eliminados', 'Cerrar', { duration: 3000 });
      }
    });
  }

  exportarVehiculos(): void {
    this.snackBar.open('Exportando vehículos...', 'Cerrar', { duration: 3000 });
  }

  recargarVehiculos(): void {
    this.cargarDatos();
  }

  // Métodos de historial (placeholders)
  actualizarHistorialTodos(): void {
    this.snackBar.open('Actualizando historial de todos los vehículos...', 'Cerrar', { duration: 3000 });
  }

  verEstadisticasHistorial(): void {
    this.snackBar.open('Mostrando estadísticas del historial...', 'Cerrar', { duration: 3000 });
  }

  marcarVehiculosActuales(): void {
    this.snackBar.open('Marcando vehículos como actuales...', 'Cerrar', { duration: 3000 });
  }

  verEstadisticasFiltrado(): void {
    this.snackBar.open('Mostrando estadísticas del filtrado actual...', 'Cerrar', { duration: 3000 });
  }
}