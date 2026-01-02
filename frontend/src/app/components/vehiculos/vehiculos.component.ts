import { Component, OnInit, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
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
import { SolicitudBajaService } from '../../services/solicitud-baja.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Empresa } from '../../models/empresa.model';
import { Ruta } from '../../models/ruta.model';
import { SolicitudBajaCreate, MotivoBaja } from '../../models/solicitud-baja.model';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { HistorialVehicularComponent } from './historial-vehicular.component';
import { VehiculosEliminadosModalComponent } from './vehiculos-eliminados-modal.component';
import { VehiculoDetalleComponent } from './vehiculo-detalle.component';
import { CambiarEstadoBloqueModalComponent } from './cambiar-estado-bloque-modal.component';
import { CargaMasivaVehiculosComponent } from './carga-masiva-vehiculos.component';
import { GestionarRutasEspecificasModalComponent } from './gestionar-rutas-especificas-modal.component';
import { TransferirEmpresaModalComponent } from './transferir-empresa-modal.component';
import { SolicitarBajaVehiculoUnifiedComponent } from './solicitar-baja-vehiculo-unified.component';
import { VehiculoEstadoSelectorComponent } from './vehiculo-estado-selector.component';

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
    MatCheckboxModule,
    VehiculoEstadoSelectorComponent
  ],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit {
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);
  private solicitudBajaService = inject(SolicitudBajaService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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

  // Configuración de columnas disponibles
  columnasDisponibles = [
    { key: 'select', label: 'Selección', required: true },
    { key: 'placa', label: 'Placa', required: true },
    { key: 'marca', label: 'Marca/Modelo', required: false },
    { key: 'empresa', label: 'Empresa', required: false },
    { key: 'categoria', label: 'Categoría', required: false },
    { key: 'estado', label: 'Estado', required: false },
    { key: 'anio', label: 'Año', required: false },
    { key: 'tuc', label: 'TUC', required: false },
    { key: 'resolucion', label: 'Resolución', required: false },
    { key: 'sede-registro', label: 'Sede Registro', required: false },
    { key: 'color', label: 'Color', required: false },
    { key: 'numero-serie', label: 'N° Serie', required: false },
    { key: 'motor', label: 'Motor', required: false },
    { key: 'chasis', label: 'Chasis', required: false },
    { key: 'ejes', label: 'Ejes', required: false },
    { key: 'asientos', label: 'Asientos', required: false },
    { key: 'peso-neto', label: 'Peso Neto', required: false },
    { key: 'peso-bruto', label: 'Peso Bruto', required: false },
    { key: 'combustible', label: 'Combustible', required: false },
    { key: 'cilindrada', label: 'Cilindrada', required: false },
    { key: 'potencia', label: 'Potencia', required: false },
    { key: 'medidas', label: 'Medidas', required: false },
    { key: 'fecha-registro', label: 'Fecha Registro', required: false },
    { key: 'fecha-actualizacion', label: 'Última Actualización', required: false },
    { key: 'observaciones', label: 'Observaciones', required: false },
    { key: 'rutas-especificas', label: 'Rutas Específicas', required: false },
    { key: 'acciones', label: 'Acciones', required: true }
  ];

  // Estado de columnas visibles con signals
  columnasVisiblesState = signal<string[]>([
    'select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'
  ]);
  
  // Signal para forzar re-renderización
  tablaRenderKey = signal(0);
  
  // Computed para columnas visibles
  columnasVisibles = computed(() => {
    const visibles = this.columnasVisiblesState();
    console.log('[VEHICULOS-COMPUTED] Columnas visibles:', visibles);
    return [...visibles];
  });

  // Computed para availableColumns (para compatibilidad con el template)
  availableColumns = computed(() => {
    const visibles = this.columnasVisiblesState();
    return this.columnasDisponibles.map(col => ({
      ...col,
      visible: visibles.includes(col.key)
    }));
  });

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

  displayedColumns = computed(() => {
    const columnas = this.columnasVisibles();
    console.log('[VEHICULOS-COMPUTED] DisplayedColumns:', columnas);
    return columnas;
  });

  // Getter para usar en el template (Angular no puede usar computed directamente en matHeaderRowDef)
  get displayedColumnsArray(): string[] {
    return this.displayedColumns();
  }

  constructor() {
    // Effect para reaccionar a cambios en columnas
    effect(() => {
      const columnas = this.columnasVisiblesState();
      console.log('[VEHICULOS-EFFECT] Columnas cambiaron:', columnas);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadColumnPreferences();
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
      
      // Log solo si no hay datos para diagnosticar
      if (!vehiculos?.length && !empresas?.length && !rutas?.length) {
        console.warn('⚠️ No se cargaron datos. Verificar backend y base de datos.');
      }
    }).catch((error: any) => {
      console.error('❌ Error cargando datos:', error);
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

  cambiarEstadoEnBloque(): void {
    const vehiculosSeleccionados = Array.from(this.vehiculosSeleccionados())
      .map(id => this.vehiculos().find(v => v.id === id))
      .filter(v => v !== undefined) as Vehiculo[];

    if (vehiculosSeleccionados.length === 0) {
      this.snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CambiarEstadoBloqueModalComponent, {
      data: { vehiculos: vehiculosSeleccionados },
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'cambiar-estado-bloque-modal-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Limpiar selección después del cambio exitoso
        this.limpiarSeleccion();
        
        // Recargar vehículos para mostrar los cambios
        this.recargarVehiculos();
        
        console.log(`Estados cambiados para ${result.vehiculos.length} vehículos a ${result.nuevoEstado}`);
      }
    });
  }

  // Métodos de columnas
  columnaVisible(columna: string): boolean {
    const visible = this.columnasVisiblesState().includes(columna);
    console.log(`[VEHICULOS-CHECK] Columna "${columna}": ${visible ? 'VISIBLE' : 'OCULTA'}`);
    return visible;
  }

  toggleColumn(columnKey: string): void {
    console.log(`[VEHICULOS-TOGGLE] Toggling columna "${columnKey}"`);
    
    const columnasActuales = this.columnasVisiblesState();
    const columnaConfig = this.columnasDisponibles.find(col => col.key === columnKey);
    
    if (!columnaConfig || columnaConfig.required) {
      console.log(`[VEHICULOS-TOGGLE] Columna "${columnKey}" es requerida, no se puede cambiar`);
      return;
    }
    
    let nuevasColumnas: string[];
    
    if (columnasActuales.includes(columnKey)) {
      // Remover columna
      nuevasColumnas = columnasActuales.filter(col => col !== columnKey);
      console.log(`[VEHICULOS-TOGGLE] Columna "${columnKey}" REMOVIDA`);
    } else {
      // Agregar columna manteniendo el orden original
      nuevasColumnas = this.columnasDisponibles
        .map(col => col.key)
        .filter(key => columnasActuales.includes(key) || key === columnKey);
      console.log(`[VEHICULOS-TOGGLE] Columna "${columnKey}" AGREGADA`);
    }
    
    // Actualizar estado
    this.columnasVisiblesState.set(nuevasColumnas);
    
    // Incrementar key para forzar re-renderización
    this.tablaRenderKey.update(key => key + 1);
    
    // Guardar preferencias
    this.saveColumnPreferences();
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    console.log(`[VEHICULOS-TOGGLE] Nuevas columnas:`, nuevasColumnas);
  }

  getVisibleColumnsCount(): number {
    return this.columnasVisiblesState().length;
  }

  getHiddenColumnsCount(): number {
    return this.columnasDisponibles.length - this.columnasVisiblesState().length;
  }

  resetColumns(): void {
    console.log('[VEHICULOS-RESET] Reseteando columnas a configuración por defecto');
    
    const columnasDefault = ['select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'];
    
    // Actualizar estado
    this.columnasVisiblesState.set(columnasDefault);
    
    // Incrementar key para forzar re-renderización
    this.tablaRenderKey.update(key => key + 1);
    
    // Guardar preferencias
    this.saveColumnPreferences();
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    console.log('[VEHICULOS-RESET] Columnas reseteadas:', columnasDefault);
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

  verHistorialCompleto(): void {
    this.router.navigate(['/historial-vehiculos']);
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
    const dialogRef = this.dialog.open(CambiarEstadoBloqueModalComponent, {
      width: '600px',
      data: { 
        vehiculo: vehiculo
      }
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
    console.log('[VEHICULOS-EXPORT] Iniciando exportación de vehículos');
    
    // Verificar si hay vehículos seleccionados
    const vehiculosSeleccionadosIds = Array.from(this.vehiculosSeleccionados());
    const vehiculosSeleccionados = this.vehiculosFiltrados().filter(v => vehiculosSeleccionadosIds.includes(v.id));
    const exportarSoloSeleccionados = vehiculosSeleccionados.length > 0;
    
    if (exportarSoloSeleccionados) {
      console.log(`[VEHICULOS-EXPORT] Exportando ${vehiculosSeleccionados.length} vehículos seleccionados`);
    } else {
      console.log('[VEHICULOS-EXPORT] Exportando todos los vehículos filtrados');
    }
    
    // Construir filtros basados en el estado actual
    const filtros: any = {
      // Filtros de búsqueda
      busqueda: this.filtrosForm.get('busqueda')?.value || '',
      
      // Filtros específicos
      empresa: this.filtrosForm.get('empresa')?.value || '',
      categoria: this.filtrosForm.get('categoria')?.value || '',
      estado: this.filtrosForm.get('estado')?.value || '',
      sedeRegistro: this.filtrosForm.get('sedeRegistro')?.value || '',
      
      // Filtros de fecha si existen
      fechaDesde: this.filtrosForm.get('fechaDesde')?.value || '',
      fechaHasta: this.filtrosForm.get('fechaHasta')?.value || '',
      
      // Columnas visibles para exportar solo las necesarias
      columnas: this.columnasVisibles().join(','),
      
      // Formato de exportación
      formato: 'excel'
    };

    // Si hay vehículos seleccionados, agregar sus IDs
    if (exportarSoloSeleccionados) {
      filtros.vehiculosSeleccionados = vehiculosSeleccionados.map((v: any) => v.id).join(',');
      filtros.soloSeleccionados = 'true';
    }

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (!filtros[key] || filtros[key] === '') {
        delete filtros[key];
      }
    });

    console.log('[VEHICULOS-EXPORT] Filtros aplicados:', filtros);

    // Mostrar mensaje de carga
    const totalVehiculos = exportarSoloSeleccionados ? vehiculosSeleccionados.length : this.vehiculosFiltrados().length;
    this.snackBar.open(`Exportando ${totalVehiculos} vehículos...`, 'Cerrar', { duration: 2000 });

    // Usar endpoint genérico de exportación que debería existir
    this.exportarVehiculosGenerico(filtros, totalVehiculos);
  }

  private exportarVehiculosGenerico(filtros: any, totalVehiculos: number): void {
    // Intentar diferentes endpoints hasta encontrar uno que funcione
    const endpoints = [
      '/vehiculos/exportar',
      '/vehiculos/export',
      '/export/vehiculos',
      '/reportes/vehiculos'
    ];

    this.intentarExportacion(endpoints, 0, filtros, totalVehiculos);
  }

  private intentarExportacion(endpoints: string[], index: number, filtros: any, totalVehiculos: number): void {
    if (index >= endpoints.length) {
      // Si ningún endpoint funciona, generar CSV localmente
      this.exportarCSVLocal(filtros, totalVehiculos);
      return;
    }

    const endpoint = endpoints[index];
    console.log(`[VEHICULOS-EXPORT] Intentando endpoint: ${endpoint}`);

    // Construir URL con parámetros
    const params = new URLSearchParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params.append(key, filtros[key]);
      }
    });

    const url = `${this.vehiculoService['apiUrl']}${endpoint}?${params.toString()}`;
    
    // Hacer petición HTTP directa
    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.vehiculoService['authService'].getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        return response.blob();
      } else if (response.status === 404) {
        // Probar siguiente endpoint
        this.intentarExportacion(endpoints, index + 1, filtros, totalVehiculos);
        return null;
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    })
    .then(blob => {
      if (blob) {
        // Descargar archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const fecha = new Date().toISOString().split('T')[0];
        const tipoExportacion = filtros.soloSeleccionados ? 'seleccionados' : 'filtrados';
        const nombreArchivo = `vehiculos-${tipoExportacion}-${fecha}-${totalVehiculos}registros.xlsx`;
        
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open(
          `Vehículos exportados exitosamente (${totalVehiculos} registros)`, 
          'Cerrar', 
          { duration: 4000 }
        );
      }
    })
    .catch(error => {
      console.error(`[VEHICULOS-EXPORT] Error en endpoint ${endpoint}:`, error);
      // Probar siguiente endpoint
      this.intentarExportacion(endpoints, index + 1, filtros, totalVehiculos);
    });
  }

  private exportarCSVLocal(filtros: any, totalVehiculos: number): void {
    console.log('[VEHICULOS-EXPORT] Generando CSV localmente');
    
    try {
      // Obtener datos a exportar
      let datosExportar = this.vehiculosFiltrados();
      
      // Si hay seleccionados, usar solo esos
      if (filtros.soloSeleccionados === 'true') {
        const vehiculosSeleccionadosIds = Array.from(this.vehiculosSeleccionados());
        datosExportar = this.vehiculosFiltrados().filter(v => vehiculosSeleccionadosIds.includes(v.id));
      }

      // Obtener columnas visibles
      const columnasVisibles = this.columnasVisibles().filter(col => col !== 'select' && col !== 'acciones');
      
      // Crear headers CSV
      const headers = columnasVisibles.map(col => {
        const columnaConfig = this.columnasDisponibles.find(c => c.key === col);
        return columnaConfig?.label || col;
      });

      // Crear filas CSV
      const filas = datosExportar.map(vehiculo => {
        return columnasVisibles.map(col => {
          let valor = '';
          switch (col) {
            case 'placa':
              valor = vehiculo.placa || '';
              break;
            case 'marca':
              valor = `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim();
              break;
            case 'empresa':
              // Necesitamos obtener el nombre de la empresa desde el ID
              valor = vehiculo.empresaActualId || '';
              break;
            case 'categoria':
              valor = vehiculo.categoria || '';
              break;
            case 'estado':
              valor = vehiculo.estado || '';
              break;
            case 'anio':
              valor = vehiculo.anioFabricacion?.toString() || '';
              break;
            case 'rutas-especificas':
              valor = vehiculo.rutasEspecificas?.length?.toString() || '0';
              break;
            default:
              valor = vehiculo[col as keyof typeof vehiculo]?.toString() || '';
          }
          // Escapar comillas y comas para CSV
          return `"${valor.replace(/"/g, '""')}"`;
        });
      });

      // Combinar headers y filas
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...filas.map(fila => fila.join(','))
      ].join('\n');

      // Agregar BOM UTF-8 para correcta codificación en Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Crear y descargar archivo
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fecha = new Date().toISOString().split('T')[0];
      const tipoExportacion = filtros.soloSeleccionados ? 'seleccionados' : 'filtrados';
      const nombreArchivo = `vehiculos-${tipoExportacion}-${fecha}-${totalVehiculos}registros.csv`;
      
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.snackBar.open(
        `Vehículos exportados como CSV (${totalVehiculos} registros)`, 
        'Cerrar', 
        { duration: 4000 }
      );
      
    } catch (error) {
      console.error('[VEHICULOS-EXPORT] Error generando CSV:', error);
      this.snackBar.open('Error al exportar vehículos', 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
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

  solicitarBajaVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = this.dialog.open(SolicitarBajaVehiculoUnifiedComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { vehiculo },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Crear la solicitud de baja
        const solicitudBaja: SolicitudBajaCreate = {
          vehiculoId: vehiculo.id,
          motivo: result.motivo as MotivoBaja,
          descripcion: result.descripcion,
          fechaSolicitud: result.fechaSolicitud.toISOString()
        };

        this.solicitudBajaService.crearSolicitudBaja(solicitudBaja).subscribe({
          next: (solicitudCreada) => {
            this.snackBar.open(
              `Solicitud de baja enviada exitosamente para el vehículo ${vehiculo.placa}`,
              'Cerrar',
              { 
                duration: 5000,
                panelClass: ['snackbar-success']
              }
            );
            
            // Opcional: Recargar datos para reflejar cambios
            this.cargarDatos();
          },
          error: (error) => {
            console.error('Error creando solicitud de baja:', error);
            
            let mensaje = 'Error al enviar la solicitud de baja';
            
            if (error.status === 422) {
              mensaje = 'No se puede solicitar la baja de este vehículo. Verifique que no tenga procesos pendientes.';
            } else if (error.status === 409) {
              mensaje = 'Ya existe una solicitud de baja pendiente para este vehículo.';
            } else if (error.status === 403) {
              mensaje = 'No tienes permisos para solicitar la baja de este vehículo.';
            } else if (error.status === 0) {
              mensaje = 'Error de conexión. Verifica tu conexión a internet.';
            }
            
            this.snackBar.open(mensaje, 'Cerrar', { 
              duration: 5000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }

  // Método para manejar cambios de estado desde la tabla
  onEstadoVehiculoChanged(event: { vehiculo: Vehiculo; nuevoEstado: string }): void {
    // Actualizar el vehículo en la lista local
    const vehiculos = this.vehiculos();
    const index = vehiculos.findIndex(v => v.id === event.vehiculo.id);
    
    if (index !== -1) {
      const vehiculosActualizados = [...vehiculos];
      vehiculosActualizados[index] = { ...vehiculosActualizados[index], estado: event.nuevoEstado };
      this.vehiculos.set(vehiculosActualizados);
    }
  }

  private saveColumnPreferences(): void {
    try {
      const columnas = this.columnasVisiblesState();
      localStorage.setItem('vehiculos-columnas-config', JSON.stringify(columnas));
      console.log('[VEHICULOS-CONFIG] Configuración guardada:', columnas);
    } catch (error) {
      console.warn('Error guardando configuración de columnas:', error);
    }
  }

  private loadColumnPreferences(): void {
    console.log('[VEHICULOS-CONFIG] Cargando preferencias de columnas...');
    try {
      const configuracion = localStorage.getItem('vehiculos-columnas-config');
      if (configuracion) {
        const columnas = JSON.parse(configuracion);
        if (Array.isArray(columnas) && columnas.length > 0) {
          // Validar que las columnas existen
          const columnasValidas = columnas.filter(col => 
            this.columnasDisponibles.some(disponible => disponible.key === col)
          );
          
          // Asegurar que las columnas requeridas estén presentes
          const columnasRequeridas = this.columnasDisponibles
            .filter(col => col.required)
            .map(col => col.key);
          
          const columnasFinales = [...new Set([...columnasValidas, ...columnasRequeridas])];
          this.columnasVisiblesState.set(columnasFinales);
          console.log('[VEHICULOS-CONFIG] Configuración cargada:', columnasFinales);
          return;
        }
      }
      
      // Si no hay configuración válida, usar valores por defecto
      const columnasDefault = ['select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'];
      this.columnasVisiblesState.set(columnasDefault);
      console.log('[VEHICULOS-CONFIG] Usando configuración por defecto:', columnasDefault);
    } catch (error) {
      console.warn('Error cargando configuración de columnas:', error);
      const columnasDefault = ['select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'];
      this.columnasVisiblesState.set(columnasDefault);
    }
  }

  cargaMasivaVehiculos(): void {
    console.log('[VEHICULOS] Abriendo modal de carga masiva');
    
    const dialogRef = this.dialog.open(CargaMasivaVehiculosComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'carga-masiva-dialog'
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado && resultado.exitosos > 0) {
        console.log('[VEHICULOS] Carga masiva completada:', resultado);
        
        // Mostrar mensaje de éxito
        this.snackBar.open(
          `Carga masiva completada: ${resultado.exitosos} vehículos creados exitosamente`,
          'Cerrar',
          { 
            duration: 5000,
            panelClass: ['snackbar-success']
          }
        );
        
        // Recargar la lista de vehículos
        this.cargarDatos();
      } else if (resultado && resultado.errores > 0) {
        console.log('[VEHICULOS] Carga masiva con errores:', resultado);
        
        this.snackBar.open(
          `Carga completada con ${resultado.errores} errores. Revise el detalle.`,
          'Cerrar',
          { 
            duration: 5000,
            panelClass: ['snackbar-warning']
          }
        );
      }
    });
  }
}