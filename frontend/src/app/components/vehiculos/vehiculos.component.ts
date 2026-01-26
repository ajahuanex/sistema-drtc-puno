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
  filtrosForm: FormGroup = (this as any).fb.group({
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
    // { key: 'tipo-servicio', label: 'Tipo de Servicio', required: false }, // REMOVIDO - No existe en template
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
    const visibles = (this as any).columnasVisiblesState();
    return [...visibles];
  });

  // Computed para availableColumns (para compatibilidad con el template)
  availableColumns = computed(() => {
    const visibles = (this as any).columnasVisiblesState();
    return (this as any).columnasDisponibles.map((col: any) => ({
      ...col,
      visible: (visibles as any).includes((col as any).key)
    }));
  });

  // Computed properties
  vehiculosFiltrados = computed(() => {
    const filtros = (this as any).filtrosValues();
    let vehiculosFiltrados = (this as any).vehiculos();

    // FILTRO POR DEFECTO MEJORADO: 
    // - Si mostrarSinResolucion está activado, mostrar SOLO los que NO tienen resolución o empresa
    // - Si está desactivado, mostrar TODOS los vehículos (con y sin resolución)
    // - Esto permite ver los vehículos recién cargados que aún no tienen resolución asignada
    if ((filtros as any).mostrarSinResolucion) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        !(v as any).resolucionId || !(v as any).empresaActualId
      );
    }
    // Si mostrarSinResolucion está desactivado, mostrar todos los vehículos
    // (comentamos el filtro restrictivo anterior)
    // if (!(filtros as any).mostrarSinResolucion) {
    //   vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
    //     (v as any).resolucionId && (v as any).empresaActualId
    //   );
    // }

    if ((filtros as any).placa) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        (v as any).placa.toLowerCase().includes((filtros as any).placa.toLowerCase())
      );
    }

    if ((filtros as any).marca) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        (v as any).marca?.toLowerCase().includes((filtros as any).marca.toLowerCase())
      );
    }

    if ((filtros as any).empresaId) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        (v as any).empresaActualId === (filtros as any).empresaId
      );
    }

    if ((filtros as any).estado) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        (v as any).estado === (filtros as any).estado
      );
    }

    if ((filtros as any).categoria) {
      vehiculosFiltrados = (vehiculosFiltrados as any).filter((v: any) => 
        (v as any).categoria === (filtros as any).categoria
      );
    }

    // ORDENAMIENTO POR FECHA MÁS RECIENTE PRIMERO
    // Prioridad: fechaActualizacion > fechaRegistro > fechaCreacion
    vehiculosFiltrados = (vehiculosFiltrados as any).sort((a: any, b: any) => {
      const fechaA = (this as any).obtenerFechaMasReciente(a);
      const fechaB = (this as any).obtenerFechaMasReciente(b);
      
      // Ordenar de más reciente a más antiguo (descendente)
      return (fechaB as any).getTime() - (fechaA as any).getTime();
    });

    return vehiculosFiltrados;
  });

  displayedColumns = computed(() => {
    const columnas = (this as any).columnasVisibles();
    return columnas;
  });

  // Getter para usar en el template (Angular no puede usar computed directamente en matHeaderRowDef)
  get displayedColumnsArray(): string[] {
    return (this as any).displayedColumns();
  }

  constructor() {
    // Effect para reaccionar a cambios en columnas
    effect(() => {
      const columnas = (this as any).columnasVisiblesState();
      (this as any).cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    (this as any).loadColumnPreferences();
    (this as any).cargarDatos();
    
    // Suscribirse a cambios en el formulario de filtros y actualizar el signal
    this.filtrosForm.valueChanges.subscribe((values: any) => {
      (this as any).filtrosValues.set(values);
      (this as any).paginaActual.set(0);
    });

    // Inicializar el signal con los valores iniciales del formulario
    (this as any).filtrosValues.set((this as any).filtrosForm.value);
  }

  private cargarDatos(): void {
    (this as any).cargando.set(true);
    
    (Promise as any).all([
      (this as any).vehiculoService.getVehiculos().toPromise(),
      (this as any).empresaService.getEmpresas().toPromise(),
      (this as any).rutaService.getRutas().toPromise()
    ]).then(([vehiculos, empresas, rutas]: any[]) => {
      (this as any).vehiculos.set(vehiculos || []);
      (this as any).empresas.set(empresas || []);
      (this as any).rutas.set(rutas || []);
      (this as any).cargando.set(false);
      
      // Log solo si no hay datos para diagnosticar
      if (!vehiculos?.length && !empresas?.length && !rutas?.length) {
        }
    }).catch((error: unknown) => {
      (console as any).error('❌ Error cargando datos:', error);
      (this as any).snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
      (this as any).cargando.set(false);
    });
  }

  recargarVehiculos(): void {
    (this as any).cargarDatos();
  }

  // Métodos de filtros
  aplicarFiltros(): void {
    // Actualizar el signal con los valores actuales del formulario
    (this as any).filtrosValues.set((this as any).filtrosForm.value);
    (this as any).paginaActual.set(0);
  }

  limpiarFiltros(): void {
    (this as any).filtrosForm.reset();
    // Actualizar el signal con los valores reseteados
    (this as any).filtrosValues.set((this as any).filtrosForm.value);
    (this as any).paginaActual.set(0);
  }

  // Métodos de estadísticas
  getVehiculosActivos(): number {
    return (this as any).vehiculos().filter((v: any) => (v as any).estado === 'ACTIVO').length;
  }

  getVehiculosPorEstado(estado: string): number {
    return (this as any).vehiculos().filter((v: any) => (v as any).estado === estado).length;
  }

  // Métodos de paginación
  getPaginatedVehiculos(): Vehiculo[] {
    const vehiculos = (this as any).vehiculosFiltrados();
    const inicio = (this as any).paginaActual() * (this as any).elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    return (vehiculos as any).slice(inicio, fin);
  }

  // Métodos de selección
  isVehiculoSeleccionado(vehiculoId: string): boolean {
    return (this as any).vehiculosSeleccionados().has(vehiculoId);
  }

  toggleVehiculoSeleccion(vehiculoId: string): void {
    const seleccionados = new Set((this as any).vehiculosSeleccionados());
    if ((seleccionados as any).has(vehiculoId)) {
      (seleccionados as any).delete(vehiculoId);
    } else {
      (seleccionados as any).add(vehiculoId);
    }
    (this as any).vehiculosSeleccionados.set(seleccionados);
  }

  seleccionarTodos(): boolean {
    const vehiculosVisibles = (this as any).getPaginatedVehiculos();
    return (vehiculosVisibles as any).length > 0 && 
           (vehiculosVisibles as any).every((v: any) => (this as any).vehiculosSeleccionados().has((v as any).id));
  }

  toggleSeleccionarTodos(): void {
    const vehiculosVisibles = (this as any).getPaginatedVehiculos();
    const seleccionados = new Set((this as any).vehiculosSeleccionados());
    
    if ((this as any).seleccionarTodos()) {
      // Deseleccionar todos los visibles
      (vehiculosVisibles as any).forEach((v: any) => (seleccionados as any).delete((v as any).id));
    } else {
      // Seleccionar todos los visibles
      (vehiculosVisibles as any).forEach((v: any) => (seleccionados as any).add((v as any).id));
    }
    
    (this as any).vehiculosSeleccionados.set(seleccionados);
  }

  getVehiculosSeleccionadosCount(): number {
    return (this as any).vehiculosSeleccionados().size;
  }

  limpiarSeleccion(): void {
    (this as any).vehiculosSeleccionados.set(new Set());
  }

  cambiarEstadoEnBloque(): void {
    const vehiculosSeleccionados = (Array as any).from((this as any).vehiculosSeleccionados())
      .map((id: any) => (this as any).vehiculos().find((v: any) => (v as any).id === id))
      .filter((v: any) => v !== undefined) as Vehiculo[];

    if ((vehiculosSeleccionados as any).length === 0) {
      (this as any).snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = (this as any).dialog.open(CambiarEstadoBloqueModalComponent, {
      data: { vehiculos: vehiculosSeleccionados },
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'cambiar-estado-bloque-modal-panel'
    });

    (dialogRef as any).afterClosed().subscribe((result: any) => {
      if (result) {
        // Limpiar selección después del cambio exitoso
        (this as any).limpiarSeleccion();
        
        // Recargar vehículos para mostrar los cambios
        (this as any).recargarVehiculos();
        
        }
    });
  }

  editarEnBloque(): void {
    const vehiculosSeleccionados = (Array as any).from((this as any).vehiculosSeleccionados())
      .map((id: any) => (this as any).vehiculos().find((v: any) => (v as any).id === id))
      .filter((v: any) => v !== undefined) as Vehiculo[];

    if ((vehiculosSeleccionados as any).length === 0) {
      (this as any).snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = (this as any).dialog.open(CambiarEstadoBloqueModalComponent, {
      data: { 
        vehiculos: vehiculosSeleccionados,
        campo: 'ambos' // Permitir editar tanto estado como tipo de servicio
      },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'edicion-bloque-modal-panel'
    });

    (dialogRef as any).afterClosed().subscribe((result: any) => {
      if (result) {
        // Limpiar selección después del cambio exitoso
        (this as any).limpiarSeleccion();
        
        // Recargar vehículos para mostrar los cambios
        (this as any).recargarVehiculos();
        
        }
    });
  }

  cambiarTipoServicioEnBloque(): void {
    const vehiculosSeleccionados = (Array as any).from((this as any).vehiculosSeleccionados())
      .map((id: any) => (this as any).vehiculos().find((v: any) => (v as any).id === id))
      .filter((v: any) => v !== undefined) as Vehiculo[];

    if ((vehiculosSeleccionados as any).length === 0) {
      (this as any).snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = (this as any).dialog.open(CambiarEstadoBloqueModalComponent, {
      data: { 
        vehiculos: vehiculosSeleccionados,
        campo: 'tipoServicio' // Solo editar tipo de servicio
      },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'edicion-bloque-modal-panel'
    });

    (dialogRef as any).afterClosed().subscribe((result: any) => {
      if (result) {
        // Limpiar selección después del cambio exitoso
        (this as any).limpiarSeleccion();
        
        // Recargar vehículos para mostrar los cambios
        (this as any).recargarVehiculos();
        
        }
    });
  }

  // Métodos de columnas
  columnaVisible(columna: string): boolean {
    const visible = (this as any).columnasVisiblesState().includes(columna);
    return visible;
  }

  toggleColumn(columnKey: string): void {
    const columnasActuales = (this as any).columnasVisiblesState();
    const columnaConfig = (this as any).columnasDisponibles.find((col: any) => (col as any).key === columnKey);
    
    if (!columnaConfig || (columnaConfig as any).required) {
      return;
    }
    
    let nuevasColumnas: string[];
    
    if ((columnasActuales as any).includes(columnKey)) {
      // Remover columna
      nuevasColumnas = (columnasActuales as any).filter((col: any) => col !== columnKey);
      } else {
      // Agregar columna manteniendo el orden original
      nuevasColumnas = (this as any).columnasDisponibles
        .map((col: any) => (col as any).key)
        .filter((key: any) => (columnasActuales as any).includes(key) || key === columnKey);
      }
    
    // Actualizar estado
    (this as any).columnasVisiblesState.set(nuevasColumnas);
    
    // Incrementar key para forzar re-renderización
    (this as any).tablaRenderKey.update((key: any) => key + 1);
    
    // Guardar preferencias
    (this as any).saveColumnPreferences();
    
    // Forzar detección de cambios
    (this as any).cdr.detectChanges();
    
    }

  getVisibleColumnsCount(): number {
    return (this as any).columnasVisiblesState().length;
  }

  getHiddenColumnsCount(): number {
    return (this as any).columnasDisponibles.length - (this as any).columnasVisiblesState().length;
  }

  resetColumns(): void {
    const columnasDefault = ['select', 'placa', 'marca', 'empresa', 'categoria', 'estado', 'rutas-especificas', 'acciones'];
    
    // Actualizar estado
    (this as any).columnasVisiblesState.set(columnasDefault);
    
    // Incrementar key para forzar re-renderización
    (this as any).tablaRenderKey.update((key: any) => key + 1);
    
    // Guardar preferencias
    (this as any).saveColumnPreferences();
    
    // Forzar detección de cambios
    (this as any).cdr.detectChanges();
    
    }

  private saveColumnPreferences(): void {
    try {
      const preferences = {
        columnasVisibles: (this as any).columnasVisiblesState(),
        timestamp: new Date().toISOString()
      };
      (localStorage as any).setItem('vehiculos-columnas-preferences', (JSON as any).stringify(preferences));
      } catch (error) {
      }
  }

  private loadColumnPreferences(): void {
    try {
      const saved = (localStorage as any).getItem('vehiculos-columnas-preferences');
      if (saved) {
        const preferences = (JSON as any).parse(saved);
        if ((preferences as any).columnasVisibles && (Array as any).isArray((preferences as any).columnasVisibles)) {
          // Validar que las columnas guardadas existen en la configuración actual
          const columnasValidas = (preferences as any).columnasVisibles.filter((col: string) => 
            (this as any).columnasDisponibles.some((disponible: any) => (disponible as any).key === col)
          );
          
          // Asegurar que las columnas requeridas estén incluidas
          const columnasRequeridas = (this as any).columnasDisponibles
            .filter((col: any) => (col as any).required)
            .map((col: any) => (col as any).key);
          
          const columnasFinales = [...new Set([...columnasRequeridas, ...columnasValidas])];
          
          (this as any).columnasVisiblesState.set(columnasFinales);
          }
      }
    } catch (error) {
      }
  }

  // Métodos de utilidad para mostrar datos
  getEmpresaNombre(empresaId: string): string {
    const empresa = (this as any).empresas().find((e: any) => (e as any).id === empresaId);
    return empresa?.razonSocial?.principal || 'Sin empresa';
  }

  getVehiculoTuc(vehiculo: Vehiculo): string {
    return (vehiculo as any).tuc?.nroTuc || 'N/A';
  }

  getVehiculoResolucion(vehiculo: Vehiculo): string {
    return (vehiculo as any).resolucionId || 'Sin resolución';
  }

  getMedidas(vehiculo: Vehiculo): string {
    const medidas = (vehiculo as any).datosTecnicos?.medidas;
    if (!medidas) return 'N/A';
    return `${(medidas as any).largo || 0}x${(medidas as any).ancho || 0}x${(medidas as any).alto || 0}m`;
  }

  getFechaRegistro(vehiculo: Vehiculo): string {
    return (vehiculo as any).fechaRegistro ? new Date((vehiculo as any).fechaRegistro).toLocaleDateString() : 'N/A';
  }

  getFechaActualizacion(vehiculo: Vehiculo): string {
    return (vehiculo as any).fechaActualizacion ? new Date((vehiculo as any).fechaActualizacion).toLocaleDateString() : 'N/A';
  }

  getRutasEspecificasCount(vehiculo: Vehiculo): number {
    // Verificar si tiene rutasAsignadasIds (array de IDs de rutas)
    if ((vehiculo as any).rutasAsignadasIds && (Array as any).isArray((vehiculo as any).rutasAsignadasIds)) {
      return (vehiculo as any).rutasAsignadasIds.length;
    }
    
    // Fallback a rutasEspecificas si existe
    if ((vehiculo as any).rutasEspecificas && (Array as any).isArray((vehiculo as any).rutasEspecificas)) {
      return (vehiculo as any).rutasEspecificas.length;
    }
    
    return 0;
  }

  getRutasEspecificasText(vehiculo: Vehiculo): string {
    const count = (this as any).getRutasEspecificasCount(vehiculo);
    if (count === 0) return 'Sin rutas';
    
    // Obtener los códigos de las rutas asignadas
    const codigosRutas = (this as any).getRutasCodigosArray(vehiculo);
    
    if ((codigosRutas as any).length === 0) {
      return count === 1 ? '1 ruta' : `${count} rutas`;
    }
    
    // Mostrar los códigos, truncar a 12 caracteres si es muy largo
    const codigosTexto = (codigosRutas as any).join(',');
    if ((codigosTexto as any).length > 12) {
      return (codigosTexto as any).substring(0, 12) + '...';
    }
    
    return codigosTexto;
  }

  getRutasCodigosArray(vehiculo: Vehiculo): string[] {
    const rutasIds = (vehiculo as any).rutasAsignadasIds || [];
    const rutas = (this as any).rutas();
    
    return rutasIds
      .map((rutaId: any) => {
        const ruta = (rutas as any).find((r: Ruta) => (r as any).id === rutaId);
        return ruta?.codigoRuta || null;
      })
      .filter((codigo: any) => codigo !== null)
      .map((codigo: any) => codigo as string)
      .sort(); // Ordenar los códigos
  }

  getRutasCodigosCompletos(vehiculo: Vehiculo): string {
    const codigosRutas = (this as any).getRutasCodigosArray(vehiculo);
    
    if ((codigosRutas as any).length === 0) {
      return 'Sin rutas asignadas';
    }
    
    return (codigosRutas as any).join(', ');
  }

  getTipoServicioVehiculo(vehiculo: Vehiculo): string {
    // Por defecto, retornar "Transporte de Pasajeros"
    return 'Transporte de Pasajeros';
  }

  getTipoServicioCodigoVehiculo(vehiculo: Vehiculo): string {
    // Por defecto, retornar "PASAJEROS"
    return 'PASAJEROS';
  }

  private getLabelTipoServicio(codigo: string): string {
    const tipos = [
      { codigo: 'PASAJEROS', nombre: 'Transporte de Pasajeros' },
      { codigo: 'CARGA', nombre: 'Transporte de Carga' },
      { codigo: 'MIXTO', nombre: 'Transporte Mixto' }
    ];
    
    const tipo = (tipos as any).find((t: any) => (t as any).codigo === codigo);
    return tipo?.nombre || codigo;
  }

  // Método para obtener la fecha más reciente de un vehículo
  private obtenerFechaMasReciente(vehiculo: Vehiculo): Date {
    const fechas: Date[] = [];
    
    // Agregar fechaActualizacion si existe
    if ((vehiculo as any).fechaActualizacion) {
      (fechas as any).push(new Date((vehiculo as any).fechaActualizacion));
    }
    
    // Agregar fechaRegistro si existe
    if ((vehiculo as any).fechaRegistro) {
      (fechas as any).push(new Date((vehiculo as any).fechaRegistro));
    }
    
    // Si no hay fechas, usar fecha muy antigua para que aparezca al final
    if ((fechas as any).length === 0) {
      return new Date(0);
    }
    
    // Retornar la fecha más reciente
    return new Date((Math as any).max(...(fechas as any).map((fecha: any) => (fecha as any).getTime())));
  }

  // Métodos adicionales requeridos por el template
  gestionarRutasEspecificas(vehiculo: Vehiculo): void {
    (this as any).gestionarRutasVehiculo(vehiculo);
  }

  getRutasAsignadasCompletas(vehiculo: Vehiculo): string {
    return (this as any).getRutasCodigosCompletos(vehiculo);
  }

  getRutasAsignadasCount(vehiculo: Vehiculo): number {
    return (this as any).getRutasEspecificasCount(vehiculo);
  }

  getRutasAsignadas(vehiculo: Vehiculo): string {
    return (this as any).getRutasEspecificasText(vehiculo);
  }

  verDetalle(vehiculo: Vehiculo): void {
    (this as any).verDetalleVehiculo(vehiculo);
  }

  verHistorial(vehiculo: Vehiculo): void {
    (this as any).verHistorialVehiculo(vehiculo);
  }

  transferirVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(TransferirEmpresaModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if ((result as any)?.success) {
        (this as any).snackBar.open(
          `Vehículo ${(vehiculo as any).placa} transferido exitosamente`,
          'Cerrar',
          { duration: 5000 }
        );
        (this as any).recargarVehiculos();
      }
    });
  }

  duplicarVehiculo(vehiculo: Vehiculo): void {
    (this as any).snackBar.open('Función de duplicación en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // Propiedades para el paginador
  get pageSize(): number {
    return (this as any).elementosPorPagina();
  }

  get currentPage(): number {
    return (this as any).paginaActual();
  }

  onPageChange(event: unknown): void {
    (this as any).paginaActual.set((event as any).pageIndex);
    (this as any).elementosPorPagina.set((event as any).pageSize);
  }

  // Métodos de acciones
  nuevoVehiculo(): void {
    const dialogRef = (this as any).dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if (result) {
        (this as any).recargarVehiculos();
      }
    });
  }

  verHistorialCompleto(): void {
    (this as any).router.navigate(['/historial-vehiculos']);
  }

  editarVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(VehiculoModalComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { 
        mode: 'edit',
        vehiculo: vehiculo
      }
    });

    // Suscribirse al evento de actualización del modal
    const modalInstance = (dialogRef as any).componentInstance;
    
    (modalInstance as any).vehiculoUpdated.subscribe((vehiculoActualizado: any) => {
      (this as any).recargarVehiculos();
    });

    (modalInstance as any).modalClosed.subscribe(() => {
      });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if (result) {
        (this as any).recargarVehiculos();
      }
    });
  }

  verDetalleVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(VehiculoDetalleComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if ((result as any)?.action === 'edit') {
        (this as any).editarVehiculo((result as any).vehiculo);
      }
    });
  }

  cambiarEstadoVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(CambiarEstadoBloqueModalComponent, {
      width: '600px',
      data: { 
        vehiculo: vehiculo
      }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if (result) {
        (this as any).recargarVehiculos();
      }
    });
  }

  verHistorialVehiculo(vehiculo: Vehiculo): void {
    // Navegar a la página del historial vehicular con filtros específicos del vehículo
    (this as any).router.navigate(['/historial-vehiculos'], {
      queryParams: {
        vehiculoId: (vehiculo as any).id,
        placa: (vehiculo as any).placa
      }
    });
  }

  gestionarRutasVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(GestionarRutasEspecificasModalComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if (result) {
        (this as any).recargarVehiculos();
      }
    });
  }

  solicitarBajaVehiculo(vehiculo: Vehiculo): void {
    const dialogRef = (this as any).dialog.open(SolicitarBajaVehiculoUnifiedComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { vehiculo: vehiculo }
    });

    (dialogRef as any).afterClosed().subscribe((result: unknown) => {
      if ((result as any)?.success) {
        (this as any).snackBar.open(
          `Solicitud de baja para vehículo ${(vehiculo as any).placa} enviada exitosamente`,
          'Cerrar',
          { duration: 5000 }
        );
        (this as any).recargarVehiculos();
      }
    });
  }

  eliminarVehiculo(vehiculo: Vehiculo): void {
    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar el vehículo ${(vehiculo as any).placa}?\n\n` +
      `El vehículo será marcado como eliminado pero se mantendrá en el sistema para fines de auditoría.`
    );

    if (confirmar) {
      (this as any).vehiculoService.deleteVehiculo((vehiculo as any).id).subscribe({
        next: () => {
          (this as any).snackBar.open(
            `Vehículo ${(vehiculo as any).placa} eliminado exitosamente`,
            'Cerrar',
            { 
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
          (this as any).cargarDatos(); // Recargar la lista
        },
        error: (error: any) => {
          (console as any).error('Error eliminando vehículo:', error);
          
          let mensaje = 'Error al eliminar el vehículo';
          
          if ((error as any).status === 422) {
            // Error de validación - el vehículo tiene dependencias
            mensaje = `No se puede eliminar el vehículo ${(vehiculo as any).placa}. ` +
                     'Es posible que tenga rutas asignadas, resoluciones activas o esté siendo utilizado en otros procesos.';
          } else if ((error as any).status === 404) {
            mensaje = 'El vehículo no fue encontrado';
          } else if ((error as any).status === 403) {
            mensaje = 'No tienes permisos para eliminar este vehículo';
          } else if ((error as any).status === 0) {
            mensaje = 'Error de conexión. Verifica tu conexión a internet';
          }
          
          (this as any).snackBar.open(mensaje, 'Cerrar', { 
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

  gestionarRutasEnBloque(): void {
    const vehiculosSeleccionados = (Array as any).from((this as any).vehiculosSeleccionados())
      .map((id: any) => (this as any).vehiculos().find((v: any) => (v as any).id === id))
      .filter((v: any) => v !== undefined) as Vehiculo[];

    if ((vehiculosSeleccionados as any).length === 0) {
      (this as any).snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    // Aquí implementarías la lógica para gestionar rutas en bloque
    (this as any).snackBar.open(
      `Gestionando rutas para ${(vehiculosSeleccionados as any).length} vehículos`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  verVehiculosEliminados(): void {
    (this as any).vehiculoService.getVehiculosEliminados().subscribe({
      next: (vehiculosEliminados: any) => {
        if ((vehiculosEliminados as any).length === 0) {
          (this as any).snackBar.open('No hay vehículos eliminados', 'Cerrar', { duration: 3000 });
          return;
        }

        // Mostrar modal con vehículos eliminados
        const dialogRef = (this as any).dialog.open(VehiculosEliminadosModalComponent, {
          width: '90%',
          maxWidth: '1200px',
          data: { vehiculosEliminados }
        });

        (dialogRef as any).afterClosed().subscribe((result: any) => {
          if (result?.restaurado) {
            (this as any).cargarDatos(); // Recargar datos si se restauró algún vehículo
          }
        });
      },
      error: (error: any) => {
        (console as any).error('Error obteniendo vehículos eliminados:', error);
        (this as any).snackBar.open('Error al obtener vehículos eliminados', 'Cerrar', { duration: 3000 });
      }
    });
  }

  exportarVehiculos(): void {
    // Verificar si hay vehículos seleccionados
    const vehiculosSeleccionadosIds = (Array as any).from((this as any).vehiculosSeleccionados());
    const vehiculosSeleccionados = (this as any).vehiculosFiltrados().filter((v: any) => (vehiculosSeleccionadosIds as any).includes((v as any).id));
    const exportarSoloSeleccionados = (vehiculosSeleccionados as any).length > 0;
    
    if (exportarSoloSeleccionados) {
      } else {
      }
    
    // Construir filtros basados en el estado actual
    const filtros: any = {
      // Filtros de búsqueda
      busqueda: (this as any).filtrosForm.get('busqueda')?.value || '',
      
      // Filtros específicos
      empresa: (this as any).filtrosForm.get('empresa')?.value || '',
      categoria: (this as any).filtrosForm.get('categoria')?.value || '',
      estado: (this as any).filtrosForm.get('estado')?.value || '',
      sedeRegistro: (this as any).filtrosForm.get('sedeRegistro')?.value || '',
      
      // Filtros de fecha si existen
      fechaDesde: (this as any).filtrosForm.get('fechaDesde')?.value || '',
      fechaHasta: (this as any).filtrosForm.get('fechaHasta')?.value || '',
      
      // Columnas visibles para exportar solo las necesarias
      columnas: (this as any).columnasVisibles().join(','),
      
      // IDs de vehículos seleccionados si aplica
      vehiculosSeleccionados: exportarSoloSeleccionados ? (vehiculosSeleccionadosIds as any).join(',') : ''
    };
    
    // Por ahora mostrar mensaje de desarrollo
    (this as any).snackBar.open(
      exportarSoloSeleccionados 
        ? `Exportando ${(vehiculosSeleccionados as any).length} vehículos seleccionados`
        : 'Exportando todos los vehículos filtrados',
      'Cerrar',
      { duration: 3000 }
    );
  }

  cargaMasivaVehiculos(): void {
    const dialogRef = (this as any).dialog.open(CargaMasivaVehiculosComponent, {
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      panelClass: 'carga-masiva-modal-panel'
    });

    (dialogRef as any).afterClosed().subscribe((result: any) => {
      if (result && (result as any).exitosos > 0) {
        (this as any).recargarVehiculos();
        (this as any).snackBar.open(
          `${(result as any).exitosos} vehículos cargados exitosamente`,
          'Cerrar',
          { duration: 4000, panelClass: ['snackbar-success'] }
        );
      } else if (result && (result as any).total_procesados > 0) {
        // Si se procesaron vehículos pero no hubo exitosos, mostrar mensaje de error
        (this as any).snackBar.open(
          `Se procesaron ${(result as any).total_procesados} vehículos pero hubo ${(result as any).errores} errores`,
          'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] }
        );
      }
    });
  }

  // Métodos adicionales para el historial
  actualizarHistorialTodos(): void {
    (this as any).snackBar.open('Función en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verEstadisticasHistorial(): void {
    (this as any).snackBar.open('Función en desarrollo', 'Cerrar', { duration: 3000 });
  }

  marcarVehiculosActuales(): void {
    (this as any).snackBar.open('Función en desarrollo', 'Cerrar', { duration: 3000 });
  }

  verEstadisticasFiltrado(): void {
    (this as any).snackBar.open('Función en desarrollo', 'Cerrar', { duration: 3000 });
  }

  onEstadoVehiculoChanged(event: unknown): void {
    // Recargar vehículos cuando se cambie el estado
    (this as any).recargarVehiculos();
  }

  onVehiculoActualizado(vehiculoActualizado: Vehiculo): void {
    const vehiculos = (this as any).vehiculos();
    const index = (vehiculos as any).findIndex((v: any) => (v as any).id === (vehiculoActualizado as any).id);
    if (index !== -1) {
      const vehiculosActualizados = [...vehiculos];
      vehiculosActualizados[index] = vehiculoActualizado;
      (this as any).vehiculos.set(vehiculosActualizados);
    }
  }
}