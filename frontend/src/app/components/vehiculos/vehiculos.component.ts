import { Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import {
  VehiculoService,
  Vehiculo360Response,
  EventoTimelineVehiculo,
  TucHistorialItem,
  EmpresaHistorica,
  SugerenciaVehiculo
} from '../../services/vehiculo.service';
import { RecordVehicularDialogComponent } from './record-vehicular-dialog.component';
import { RutasVehiculoModalComponent } from './rutas-vehiculo-modal.component';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTabsModule,
    MatSelectModule,
    MatDialogModule
  ],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit, OnDestroy {
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals de estado
  placaControl = new FormControl('');
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  vehiculoData = signal<Vehiculo360Response | null>(null);
  activeTab = signal<'ficha' | 'timeline' | 'tucs' | 'rutas' | 'directorio'>('ficha');
  
  // Sugerencias predictivas
  sugerencias = signal<SugerenciaVehiculo[]>([]);
  mostrarSugerencias = signal<boolean>(false);
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Historial de placas rápidas
  placasRecientes = signal<string[]>(['F6S-964', 'V2Y-116', 'Z3U-192', 'VAT-959', 'D1A-962']);

  // Directorio General
  directorioItems = signal<any[]>([]);
  directorioTotal = signal<number>(0);
  directorioSkip = signal<number>(0);
  directorioLimit = signal<number>(15);
  directorioFiltroEstado = signal<string>('TODOS');
  directorioSearch = signal<string>('');
  cargandoDirectorio = signal<boolean>(false);

  // Columnas tabla directorio
  columnasDirectorio: string[] = ['placa', 'empresa', 'resolucion', 'tuc', 'datos_tecnicos', 'antiguedad', 'estado', 'acciones'];

  // Columnas tabla TUCs
  columnasTucs: string[] = ['numero_tuc', 'resolucion', 'estado', 'fecha_emision', 'fecha_vencimiento', 'acciones'];

  ngOnInit(): void {
    // Escuchar query params para búsqueda directa (ej: /vehiculos?placa=F6S-964)
    this.route.queryParams.subscribe(params => {
      if (params['placa']) {
        this.placaControl.setValue(params['placa']);
        this.buscarVehiculo(params['placa']);
      } else {
        // Cargar directorio inicial
        this.cargarDirectorio();
      }
    });

    // Configurar búsqueda reactiva de sugerencias
    this.searchSub = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.sugerencias.set([]);
          this.mostrarSugerencias.set(false);
          return [];
        }
        return this.vehiculoService.buscarSugerenciasPlaca(query);
      })
    ).subscribe({
      next: (sugs) => {
        this.sugerencias.set(sugs);
        this.mostrarSugerencias.set(sugs.length > 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onInputChange(event: any): void {
    let valor: string = (event.target.value || '').toUpperCase();
    
    // Auto-formatear placa (ej. si escribe V2Y116 -> V2Y-116)
    const raw = valor.replace(/[^A-Z0-9]/g, '');
    if (raw.length > 3 && !raw.includes('-') && valor.length === 4 && !valor.endsWith('-')) {
      valor = `${raw.slice(0, 3)}-${raw.slice(3, 6)}`;
      this.placaControl.setValue(valor, { emitEvent: false });
    } else {
      this.placaControl.setValue(valor, { emitEvent: false });
    }

    if (raw.length >= 2) {
      this.searchSubject.next(raw);
    } else {
      this.sugerencias.set([]);
      this.mostrarSugerencias.set(false);
    }
  }

  buscarVehiculo(placaParam?: string): void {
    const p = (placaParam || this.placaControl.value || '').trim().toUpperCase();
    if (!p) {
      this.snackBar.open('Ingrese una placa para consultar', 'Aceptar', { duration: 3000 });
      return;
    }

    this.mostrarSugerencias.set(false);
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.vehiculoService.consultarVehiculo360(p).subscribe({
      next: (data) => {
        this.cargando.set(false);
        this.vehiculoData.set(data);
        this.activeTab.set('ficha');
        this.placaControl.setValue(data.placa, { emitEvent: false });

        // Actualizar placas recientes
        const actuales = this.placasRecientes().filter(item => item !== data.placa);
        this.placasRecientes.set([data.placa, ...actuales].slice(0, 6));

        // Actualizar URL sin recargar
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { placa: data.placa },
          queryParamsHandling: 'merge'
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.vehiculoData.set(null);
        const msg = err.error?.detail || `No se encontró información para la placa ${p}`;
        this.errorMensaje.set(msg);
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  seleccionarSugerencia(sug: SugerenciaVehiculo): void {
    this.placaControl.setValue(sug.placa);
    this.mostrarSugerencias.set(false);
    this.buscarVehiculo(sug.placa);
  }

  limpiarBusqueda(): void {
    this.placaControl.setValue('');
    this.vehiculoData.set(null);
    this.errorMensaje.set(null);
    this.mostrarSugerencias.set(false);
    this.activeTab.set('directorio');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { placa: null },
      queryParamsHandling: 'merge'
    });
    this.cargarDirectorio();
  }

  cargarDirectorio(): void {
    this.cargandoDirectorio.set(true);
    this.vehiculoService.listarResumenVehiculos(
      this.directorioSkip(),
      this.directorioLimit(),
      this.directorioSearch() || undefined,
      this.directorioFiltroEstado()
    ).subscribe({
      next: (res) => {
        this.cargandoDirectorio.set(false);
        this.directorioItems.set(res.items);
        this.directorioTotal.set(res.total);
      },
      error: () => {
        this.cargandoDirectorio.set(false);
        this.snackBar.open('Error al cargar directorio de vehículos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onFiltroEstadoChange(nuevoEstado: string): void {
    this.directorioFiltroEstado.set(nuevoEstado);
    this.directorioSkip.set(0);
    this.cargarDirectorio();
  }

  onDirectorioSearch(searchVal: string): void {
    this.directorioSearch.set(searchVal);
    this.directorioSkip.set(0);
    this.cargarDirectorio();
  }

  cambiarPaginaDirectorio(event: PageEvent): void {
    this.directorioSkip.set(event.pageIndex * event.pageSize);
    this.directorioLimit.set(event.pageSize);
    this.cargarDirectorio();
  }

  imprimirRecord(): void {
    const data = this.vehiculoData();
    if (!data) return;

    this.dialog.open(RecordVehicularDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      data: data,
      panelClass: 'record-dialog-panel'
    });
  }

  abrirModalRutas(): void {
    const data = this.vehiculoData();
    if (!data) return;

    const dialogRef = this.dialog.open(RutasVehiculoModalComponent, {
      width: '850px',
      maxWidth: '96vw',
      data: {
        placa: data.placa,
        empresa: data.situacion_actual.empresa_actual,
        resolucion: data.situacion_actual.resolucion_primigenia_info?.nro_resolucion || data.situacion_actual.resolucion_primigenia || 'DRTC Puno',
        rutas: data.situacion_actual.rutas_detalladas || [],
        rutas_codigos: data.situacion_actual.rutas_autorizadas || []
      },
      panelClass: 'rutas-vehiculo-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(action => {
      if (action === 'ir_a_tab') {
        this.irATabRutas();
      }
    });
  }

  irATabRutas(): void {
    this.activeTab.set('rutas');
    setTimeout(() => {
      const el = document.getElementById('seccion-rutas-tab');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }

  cambiarModalidadPlaca(codigo: 'REGULAR' | 'TURISMO'): void {
    const current = this.vehiculoData();
    if (!current) return;

    if (codigo === 'TURISMO') {
      current.modalidad_placa = {
        codigo: 'TURISMO',
        nombre: 'Transporte Turístico',
        color_franja: '#7e22ce',
        color_texto: '#ffffff',
        color_nombre: 'Morada',
        normativa_referencia: 'Reglamento de Placa Única Nacional de Rodaje (D.S. 017-2008-MTC)'
      };
    } else {
      current.modalidad_placa = {
        codigo: 'REGULAR',
        nombre: 'Transporte Regular de Personas',
        color_franja: '#ea580c',
        color_texto: '#ffffff',
        color_nombre: 'Naranja',
        normativa_referencia: 'Reglamento de Placa Única Nacional de Rodaje (D.S. 017-2008-MTC)'
      };
    }
    this.vehiculoData.set({ ...current });
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'estado-neutral';
    const e = estado.toUpperCase();
    if (e.includes('HABILITADO') || e.includes('ACTIVO') || e.includes('VIGENTE')) return 'estado-verde';
    if (e.includes('INHABILITADO') || e.includes('CANCELADO') || e.includes('BAJA')) return 'estado-rojo';
    if (e.includes('OBSERVADO') || e.includes('SUSPENDIDO')) return 'estado-ambar';
    return 'estado-neutral';
  }

  getAntiguedadBadgeClass(estadoAntiguedad?: string): string {
    switch (estadoAntiguedad) {
      case 'VIGENTE': return 'badge-normativo-verde';
      case 'PROXIMO_A_VENCER': return 'badge-normativo-ambar';
      case 'LIMITE_EXCEDIDO': return 'badge-normativo-rojo';
      default: return 'badge-normativo-gris';
    }
  }

  getIconoTipoEvento(tipo: string): string {
    switch (tipo) {
      case 'RESOLUCION': return 'gavel';
      case 'TUC_EMISION': return 'card_membership';
      case 'CAMBIO_EMPRESA': return 'swap_horiz';
      default: return 'history';
    }
  }

  getVigenciaBadgeClass(estado?: string): string {
    if (!estado) return 'vigencia-neutral';
    const e = estado.toUpperCase();
    if (e.includes('POR_VENCER') || e.includes('POR VENCER')) return 'vigencia-ambar';
    if (e.includes('VENCIDA') || e.includes('INACTIVA') || e.includes('CANCELADA')) return 'vigencia-rojo';
    if (e.includes('VIGENTE') || e.includes('ACTIVA') || e.includes('HABILITADA') || e.includes('EMITIDA')) return 'vigencia-verde';
    return 'vigencia-neutral';
  }

  getCompatibilidadClass(tipo?: string): string {
    switch (tipo) {
      case 'COMPATIBLE': return 'compat-verde';
      case 'RETIRO_PREVIO_A_CONCESION': return 'compat-ambar';
      case 'RETIRO_VENCIDO': return 'compat-rojo';
      case 'CONCESION_VENCIDA': return 'compat-ambar';
      default: return 'compat-neutral';
    }
  }
}