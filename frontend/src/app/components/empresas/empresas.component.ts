import { Component, OnInit, signal, computed, effect, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaCreate, TipoSocio, TipoServicio, SunatData, SunatCronStatus, CasillaSyncStatus } from '../../models/empresa.model';
import { DialogSunatSyncComponent } from './dialog-sunat-sync.component';

const ESTADOS_RUC: Record<string, string> = {
  '00': 'ACTIVO',
  '01': 'SUSPENSIÓN TEMPORAL',
  '02': 'BAJA PROVISIONAL',
  '03': 'BAJA DEFINITIVA',
  '11': 'BAJA PROVISIONAL DE OFICIO',
  '12': 'BAJA DEFINITIVA DE OFICIO'
};


@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.scss'
})
export class EmpresasComponent implements OnInit {
  // Signals
  isLoading = signal(false);
  empresas = signal<Empresa[]>([]);
  pageSize = signal(10);
  currentPage = signal(0);
  searchTerm = signal('');
  estadoFilter = signal('');
  servicioFilter = signal<string>('');
  casillaFilter = signal<string>('');
  showMobileFilters = signal<boolean>(false);
  empresaSeleccionadaMenu = signal<Empresa | null>(null);

  // Computed KPI Metrics (Stitch Official Padrón DRTC Puno) — DINÁMICOS
  totalAutorizadas = computed(() => {
    const list = this.empresas();
    return list.filter(e => 
      (!e.estado || e.estado === 'AUTORIZADA') && 
      (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('PASAJER'))
    ).length;
  });

  totalEmpresasCount = computed(() => this.empresas().length);

  totalCanceladas = computed(() => {
    return this.empresas().filter(e => e.estado === 'CANCELADA').length;
  });

  // SUNAT: contar desde sunatCache las que tienen esActivo=true AND esHabido=true
  sunatActivas = computed(() => {
    const cache = this.sunatCache();
    let count = 0;
    cache.forEach((data) => {
      if (data.esActivo === true && data.esHabido === true) count++;
    });
    return count;
  });

  // SUNAT: empresas con RUC de Baja (esActivo === false)
  sunatBajas = computed(() => {
    const cache = this.sunatCache();
    let count = 0;
    cache.forEach((data) => {
      if (data.esActivo === false) count++;
    });
    return count;
  });

  // SUNAT: empresas con condición NO HABIDO / NO HALLADO (esHabido === false)
  sunatNoHabidos = computed(() => {
    const cache = this.sunatCache();
    let count = 0;
    cache.forEach((data) => {
      if (data.esHabido === false) count++;
    });
    return count;
  });

  // SUNAT: empresas sin datos SUNAT en cache (pendientes de verificación)
  sunatEnVerificacion = computed(() => {
    const total = this.empresas().length;
    const enCache = this.sunatCache().size;
    return Math.max(0, total - enCache);
  });

  // Porcentaje de conformes SUNAT (Activas y Habidas sobre el total verificado)
  pctSunatConformes = computed(() => {
    const cache = this.sunatCache();
    if (cache.size === 0) return '0';
    let conformes = 0;
    cache.forEach((data) => {
      if (data.esActivo === true && data.esHabido === true) conformes++;
    });
    return ((conformes / cache.size) * 100).toFixed(1);
  });

  // Porcentaje de autorizadas pasajeros sobre el total
  pctAutorizadasPasajeros = computed(() => {
    const total = this.empresas().filter(e => !e.estado || e.estado === 'AUTORIZADA').length;
    if (total === 0) return '0';
    return ((this.totalAutorizadas() / total) * 100).toFixed(1);
  });

  pasajerosCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('PASAJER'))).length;
  });

  turismoCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('TURISMO'))).length;
  });

  trabajadoresCount = computed(() => {
    return this.empresas().filter(e => (e.tiposServicio as string[])?.some(s => s?.toUpperCase().includes('TRABAJADOR'))).length;
  });

  isTurismo(servicio: string): boolean {
    if (!servicio) return false;
    return servicio.toUpperCase().includes('TURISMO');
  }

  columnasVisibles = signal<string[]>([
    'seleccionar',
    'ruc',
    'razonSocial',
    'casillaElectronica',
    'representante',
    'contacto',
    'observaciones',
    'estadoSunat',
    'acciones'
  ]);
  empresasSeleccionadas = signal<Set<string>>(new Set());

  // Signals SUNAT
  sunatCache = signal<Map<string, SunatData>>(new Map());
  sunatCargando = signal<Set<string>>(new Set());
  cronSunatStatus = signal<SunatCronStatus | null>(null);
  esAdmin = computed(() => this.authService.isAdmin());

  // Signals Casilla Electrónica MTC (Sincronización Automática con Módulo de Casillas)
  casillaSyncStatus = signal<CasillaSyncStatus | null>(null);

  // Casilla Electrónica Computed Metrics (vinculadas automáticamente a la base de datos)
  casillasHabilitadasCount = computed(() => {
    return this.empresas().filter(e => {
      const ce = e.casillaElectronica;
      if (ce && typeof ce === 'object') return ce.habilitada === true;
      return Boolean(e.tieneCasillaElectronica || ce === 'HABILITADA');
    }).length;
  });

  casillasSinCasillaCount = computed(() => {
    return this.empresas().filter(e => {
      const ce = e.casillaElectronica;
      if (ce && typeof ce === 'object') return ce.habilitada !== true;
      return !e.tieneCasillaElectronica && (!ce || ce === 'NO REGISTRA');
    }).length;
  });

  pctCasillasConformes = computed(() => {
    const st = this.casillaSyncStatus();
    if (st && st.porcentajeConCasilla !== undefined && st.totalEmpresas > 0) {
      return st.porcentajeConCasilla.toFixed(1);
    }
    const total = this.empresas().length;
    if (total === 0) return '0';
    return ((this.casillasHabilitadasCount() / total) * 100).toFixed(1);
  });

  // Expose ESTADOS_RUC for template use
  readonly ESTADOS_RUC = ESTADOS_RUC;

  // Servicios disponibles
  serviciosDisponibles: TipoServicio[] = [
    TipoServicio.PASAJEROS,
    TipoServicio.TURISMO,
    TipoServicio.TRABAJADORES,
    TipoServicio.MERCANCIAS,
    TipoServicio.CARGA,
    TipoServicio.INFRAESTRUCTURA,
    TipoServicio.OTROS,
    TipoServicio.MIXTO
  ];

  // Configuración de columnas
  columnasDisponibles = [
    { id: 'seleccionar', label: 'Seleccionar', visible: true },
    { id: 'ruc', label: 'RUC', visible: true },
    { id: 'razonSocial', label: 'Razón Social', visible: true },
    { id: 'casillaElectronica', label: 'Casilla Electrónica (MTC)', visible: true },
    { id: 'partidaRegistral', label: 'Partida Registral (Columna)', visible: false },
    { id: 'estado', label: 'Estado Legal (Columna separada)', visible: false },
    { id: 'servicios', label: 'Tipos de Servicio (Columna separada)', visible: false },
    { id: 'representante', label: 'Representante / Socios', visible: true },
    { id: 'contacto', label: 'Contacto', visible: true },
    { id: 'observaciones', label: 'Observaciones', visible: true },
    { id: 'estadoSunat', label: 'Estado SUNAT', visible: true },
    { id: 'acciones', label: 'Acciones', visible: true }
  ];

  // Form Controls
  searchControl = new FormBuilder().control('');
  estadoControl = new FormBuilder().control('');

  // Señales para ordenamiento por columna
  sortField = signal<string>('razonSocial');
  sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(column: string): void {
    if (this.sortField() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortField() !== column) {
      return 'unfold_more';
    }
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  columnaVisible(colId: string): boolean {
    return this.columnasVisibles().includes(colId);
  }

  // Computed - empresas filtradas y ordenadas
  empresasFiltradas = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const estado = this.estadoFilter();
    const servicio = this.servicioFilter();
    const casilla = this.casillaFilter();

    const filtered = this.empresas().filter(e => {
      const rep = this.getRepresentanteLegal(e);
      const repNombre = rep ? `${rep.nombres} ${rep.apellidos}`.toLowerCase() : '';
      const repDni = rep ? rep.dni : '';

      const matchSearch = !search ||
        e.ruc.toLowerCase().includes(search) ||
        e.razonSocial.principal.toLowerCase().includes(search) ||
        (e.razonSocial.sunat && e.razonSocial.sunat.toLowerCase().includes(search)) ||
        (e.partidaRegistral && e.partidaRegistral.toLowerCase().includes(search)) ||
        repNombre.includes(search) ||
        repDni.includes(search);

      const matchEstado = !estado || e.estado === estado;
      const matchServicio = !servicio || (e.tiposServicio && e.tiposServicio.includes(servicio as TipoServicio));

      const tieneCasilla = Boolean(e.casillaElectronica?.habilitada || e.tieneCasillaElectronica);
      const matchCasilla = !casilla ||
        (casilla === 'CON_CASILLA' && tieneCasilla) ||
        (casilla === 'SIN_CASILLA' && !tieneCasilla);

      return matchSearch && matchEstado && matchServicio && matchCasilla;
    });

    const field = this.sortField();
    const isAsc = this.sortDirection() === 'asc';

    return [...filtered].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (field) {
        case 'ruc':
          valA = a.ruc || '';
          valB = b.ruc || '';
          break;
        case 'razonSocial':
          valA = a.razonSocial?.principal || '';
          valB = b.razonSocial?.principal || '';
          break;
        case 'partidaRegistral':
          valA = a.partidaRegistral || '';
          valB = b.partidaRegistral || '';
          break;
        case 'estado':
          valA = a.estado || '';
          valB = b.estado || '';
          break;
        case 'servicios':
          valA = (a.tiposServicio || []).join(', ');
          valB = (b.tiposServicio || []).join(', ');
          break;
        case 'representante':
          const repA = this.getRepresentanteLegal(a);
          const repB = this.getRepresentanteLegal(b);
          valA = repA ? `${repA.nombres} ${repA.apellidos}` : '';
          valB = repB ? `${repB.nombres} ${repB.apellidos}` : '';
          break;
        case 'emailContacto':
          valA = a.emailContacto || '';
          valB = b.emailContacto || '';
          break;
        case 'telefonoContacto':
          valA = a.telefonoContacto || '';
          valB = b.telefonoContacto || '';
          break;
        case 'casillaElectronica': {
          const cA = (a.casillaElectronica?.habilitada || a.tieneCasillaElectronica) ? '1' : '0';
          const cB = (b.casillaElectronica?.habilitada || b.tieneCasillaElectronica) ? '1' : '0';
          valA = cA;
          valB = cB;
          break;
        }
        case 'observaciones':
          valA = a.observaciones || '';
          valB = b.observaciones || '';
          break;
        case 'estadoSunat': {
          const sA = this.sunatCache().get(a.ruc);
          const sB = this.sunatCache().get(b.ruc);
          const activoA = sA?.esActivo !== false ? '1_ACTIVO' : '0_BAJA';
          const activoB = sB?.esActivo !== false ? '1_ACTIVO' : '0_BAJA';
          const habidoA = sA?.esHabido !== false ? '1_HABIDO' : '0_NO_HABIDO';
          const habidoB = sB?.esHabido !== false ? '1_HABIDO' : '0_NO_HABIDO';
          valA = `${activoA}_${habidoA}`;
          valB = `${activoB}_${habidoB}`;
          break;
        }
      }

      const res = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return isAsc ? res : -res;
    });
  });

  // Computed - empresas paginadas
  empresasPaginadas = computed(() => {
    const filtradas = this.empresasFiltradas();
    return filtradas.slice(
      this.currentPage() * this.pageSize(),
      (this.currentPage() + 1) * this.pageSize()
    );
  });

  isAllSelected = computed(() => {
    const filtradas = this.empresasFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.empresasSeleccionadas();
    return filtradas.every(e => set.has(e.id));
  });

  isSomeSelected = computed(() => {
    const filtradas = this.empresasFiltradas();
    if (filtradas.length === 0) return false;
    const set = this.empresasSeleccionadas();
    const count = filtradas.filter(e => set.has(e.id)).length;
    return count > 0 && count < filtradas.length;
  });

  constructor(
    private empresaService: EmpresaService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
      this.currentPage.set(0);
    });

    this.estadoControl.valueChanges.subscribe(value => {
      this.estadoFilter.set(value || '');
      this.currentPage.set(0);
    });
  }

  ngOnInit(): void {
    // Restaurar columnas visibles desde localStorage (v4 con Estado SUNAT visible por defecto)
    const savedColumns = localStorage.getItem('drtc_empresas_columnas_v4');
    if (savedColumns) {
      try {
        const cols: string[] = JSON.parse(savedColumns);
        if (Array.isArray(cols) && cols.length > 0) {
          this.columnasVisibles.set(cols);
          // Sincronizar columnasDisponibles con el estado guardado
          this.columnasDisponibles = this.columnasDisponibles.map(c => ({
            ...c,
            visible: cols.includes(c.id)
          }));
        }
      } catch (e) {
        console.warn('No se pudo restaurar configuración de columnas:', e);
      }
    }
    this.cargarEmpresas();
    this.cargarEstadoCronSunat();
    this.cargarEstadoCasillasAutomatico();
  }

  cargarEstadoCasillasAutomatico(): void {
    this.empresaService.getEstadoCasillas().subscribe({
      next: (st) => {
        this.casillaSyncStatus.set(st);
        if (st?.enEjecucion) {
          this.escucharProgresoCasillas();
        }
      },
      error: (err) => console.warn('No se pudo obtener estado de casillas:', err)
    });
  }

  private escucharProgresoCasillas(): void {
    const timer = setInterval(() => {
      this.empresaService.getEstadoCasillas().subscribe({
        next: (st) => {
          this.casillaSyncStatus.set(st);
          if (!st?.enEjecucion) {
            clearInterval(timer);
            // Sincronización finalizada en módulo de casillas: recargar automáticamente
            this.cargarEmpresas();
          }
        },
        error: () => clearInterval(timer)
      });
    }, 3000);
  }

  cargarEstadoCronSunat(): void {
    this.empresaService.obtenerEstadoCronSunat().subscribe({
      next: (st) => this.cronSunatStatus.set(st),
      error: (err) => console.warn('No se pudo obtener estado cron SUNAT:', err)
    });
  }

  abrirModalSunat(): void {
    const dialogRef = this.dialog.open(DialogSunatSyncComponent, {
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'sunat-sync-dialog-panel',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarEstadoCronSunat();
      this.cargarEmpresas();
    });
  }

  cargarEmpresas(): void {
    this.isLoading.set(true);
    this.empresaService.getEmpresas(0, 10000).subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);

        // Pre-cargar caché SUNAT desde la base de datos si existen datos guardados
        const initialCache = new Map(this.sunatCache());
        empresas.forEach(e => {
          if (e.datosSunat) {
            const d = e.datosSunat as any;
            const sunatData: SunatData = {
              ddp_nombre: d.ddp_nombre || d.razonSocial || e.razonSocial?.sunat || '',
              ddp_estado: d.ddp_estado || (d.valido ? '00' : '10'),
              desc_estado: d.desc_estado || (d.valido ? 'ACTIVO' : 'INACTIVO'),
              esActivo: d.esActivo === true || d.valido === true,
              esHabido: d.esHabido === true || d.condicion === 'HABIDO'
            };
            initialCache.set(e.ruc, sunatData);
          }
        });
        this.sunatCache.set(initialCache);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.servicioFilter.set('');
    this.casillaFilter.set('');
    this.currentPage.set(0);
  }

  filtrarPorCasilla(tipo: 'CON_CASILLA' | 'SIN_CASILLA'): void {
    if (this.casillaFilter() === tipo) {
      this.casillaFilter.set('');
    } else {
      this.casillaFilter.set(tipo);
    }
    this.currentPage.set(0);
  }

  getRepresentanteLegal(empresa: Empresa): any {
    if (!empresa) return null;
    if (empresa.socios && empresa.socios.length > 0) {
      const rep = empresa.socios.find(s => s.tipoSocio === 'REPRESENTANTE_LEGAL');
      if (rep) return rep;
    }
    if ((empresa as any).representanteLegal) {
      return (empresa as any).representanteLegal;
    }
    if (empresa.socios && empresa.socios.length > 0) {
      return empresa.socios[0];
    }
    return null;
  }

  getSociosAdicionales(empresa: Empresa): any[] {
    if (!empresa.socios || empresa.socios.length === 0) return [];
    return empresa.socios.filter(s => s.tipoSocio !== 'REPRESENTANTE_LEGAL');
  }

  getLabelCargo(tipoSocio: string): string {
    const labels: Record<string, string> = {
      'REPRESENTANTE_LEGAL': 'Rep. Legal',
      'GERENTE_GENERAL': 'Gerente Gral.',
      'SOCIO': 'Socio',
      'PRESIDENTE': 'Presidente',
      'DIRECTOR': 'Director',
      'APODERADO': 'Apoderado',
      'GERENTE': 'Gerente',
      'SECRETARIO': 'Secretario',
      'TESORERO': 'Tesorero'
    };
    return labels[tipoSocio] || tipoSocio;
  }

  getSociosTooltip(empresa: Empresa): string {
    return this.getSociosAdicionales(empresa)
      .map(s => `${this.getLabelCargo(s.tipoSocio)}: ${s.nombres} ${s.apellidos} (DNI: ${s.dni})`)
      .join('\n');
  }

  getSunatEstadoDesc(codigo: string | undefined): string {
    if (!codigo) return '';
    return ESTADOS_RUC[codigo] || '';
  }

  consultarSunat(empresa: Empresa): void {
    const ruc = empresa?.ruc;
    const empId = empresa?.id || (empresa as any)?._id || ruc;
    if (!ruc || this.sunatCargando().has(ruc)) return;

    // Feedback inmediato al usuario
    this.snackBar.open(`Consultando SUNAT para RUC ${ruc}...`, undefined, { duration: 3000 });

    // Marcar como cargando
    const cargando = new Set(this.sunatCargando());
    cargando.add(ruc);
    this.sunatCargando.set(cargando);

    const removerCargando = () => {
      const cargandoAct = new Set(this.sunatCargando());
      cargandoAct.delete(ruc);
      this.sunatCargando.set(cargandoAct);
    };

    // Usar actualizarSunat para consultar la API de SUNAT y persistir en MongoDB
    this.empresaService.actualizarSunat(empId).pipe(
      finalize(() => removerCargando())
    ).subscribe({
      next: (empresaActualizada) => {
        if (empresaActualizada && empresaActualizada.datosSunat) {
          const d = empresaActualizada.datosSunat as any;
          const sunatData: SunatData = {
            ddp_nombre: d.ddp_nombre || d.razonSocial || (typeof empresaActualizada.razonSocial === 'object' ? empresaActualizada.razonSocial?.sunat : '') || '',
            ddp_estado: d.ddp_estado || (d.valido ? '00' : '10'),
            desc_estado: d.desc_estado || (d.valido ? 'ACTIVO' : 'INACTIVO'),
            esActivo: d.esActivo === true || d.valido === true,
            esHabido: d.esHabido === true || d.condicion === 'HABIDO'
          };

          // Actualizar caché local
          const newCache = new Map(this.sunatCache());
          newCache.set(ruc, sunatData);
          this.sunatCache.set(newCache);

          // Actualizar la empresa en la lista local
          const updatedEmpresas = this.empresas().map(e => {
            if (e.id === empresa.id || e.ruc === empresa.ruc) {
              return { ...e, ...empresaActualizada, datosSunat: d };
            }
            return e;
          });
          this.empresas.set(updatedEmpresas);

          const estado = ESTADOS_RUC[sunatData.ddp_estado || ''] || sunatData.desc_estado || '';
          const habido = sunatData.esHabido ? 'HABIDO' : 'NO HABIDO';
          const activo = sunatData.esActivo ? '✅ ACTIVO' : '❌ BAJA';
          this.snackBar.open(`SUNAT: ${sunatData.ddp_nombre || empresa.razonSocial?.principal || ''} — ${activo} | ${estado} | ${habido}`, 'OK', { duration: 6000 });
        } else {
          this.snackBar.open(`No se obtuvieron datos SUNAT para RUC ${ruc}`, 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        console.warn('Endpoint actualizarSunat falló, intentando fallback proxy:', err);
        // Fallback: intentar consulta proxy directa si falla el endpoint de BD
        this.empresaService.consultarSunat(ruc).pipe(
          finalize(() => removerCargando())
        ).subscribe({
          next: (resp) => {
            const data = resp?.data;
            if (data) {
              const sunatData: SunatData = {
                ddp_nombre: data.ddp_nombre || '',
                ddp_estado: data.ddp_estado || '',
                desc_estado: data.desc_estado || '',
                esActivo: data.esActivo === true,
                esHabido: data.esHabido === true
              };
              const newCache = new Map(this.sunatCache());
              newCache.set(ruc, sunatData);
              this.sunatCache.set(newCache);

              const updatedEmpresas = this.empresas().map(e => {
                if (e.ruc === ruc) {
                  return { ...e, datosSunat: data };
                }
                return e;
              });
              this.empresas.set(updatedEmpresas);

              const estado = ESTADOS_RUC[sunatData.ddp_estado || ''] || sunatData.desc_estado || '';
              const habido = sunatData.esHabido ? 'HABIDO' : 'NO HABIDO';
              const activo = sunatData.esActivo ? '✅ ACTIVO' : '❌ BAJA';
              this.snackBar.open(`${sunatData.ddp_nombre} — ${activo} | ${estado} | ${habido}`, 'OK', { duration: 6000 });
            }
          },
          error: (proxyErr) => {
            console.error('Error en consulta proxy SUNAT:', proxyErr);
            this.snackBar.open(`Error al consultar SUNAT para RUC ${ruc}`, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  toggleSeleccionar(empresaId: string, event: any): void {
    const seleccionadas = new Set(this.empresasSeleccionadas());
    if (event.checked) {
      seleccionadas.add(empresaId);
    } else {
      seleccionadas.delete(empresaId);
    }
    this.empresasSeleccionadas.set(seleccionadas);
  }

  toggleSelectAll(event: any): void {
    if (event.checked) {
      const ids = new Set(this.empresasFiltradas().map(e => e.id));
      this.empresasSeleccionadas.set(ids);
    } else {
      this.empresasSeleccionadas.set(new Set());
    }
  }

  toggleSeleccionarTodas(event: any): void {
    this.toggleSelectAll(event);
  }

  limpiarSeleccion(): void {
    this.empresasSeleccionadas.set(new Set());
  }

  abrirEdicionBloqueEstado(): void {
    const dialogRef = this.dialog.open(EdicionBloqueEstadoDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.empresasSeleccionadas().size }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarEstadoEnBloque(result.nuevoEstado, result.motivo);
      }
    });
  }

  abrirEdicionBloqueServicios(): void {
    const dialogRef = this.dialog.open(EdicionBloqueServiciosDialog, {
      width: '400px',
      data: { cantidadSeleccionadas: this.empresasSeleccionadas().size }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarServiciosEnBloque(result.servicios);
      }
    });
  }

  private actualizarEstadoEnBloque(nuevoEstado: string, motivo: string): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { estado: nuevoEstado as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  private actualizarServiciosEnBloque(servicios: string[]): void {
    const empresasIds = Array.from(this.empresasSeleccionadas());
    if (empresasIds.length === 0) return;

    this.isLoading.set(true);
    let actualizadas = 0;
    let errores = 0;

    const actualizarSiguiente = (index: number) => {
      if (index >= empresasIds.length) {
        this.isLoading.set(false);
        const mensaje = `${actualizadas} empresa(s) actualizada(s)${errores > 0 ? `, ${errores} error(es)` : ''}`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.cargarEmpresas();
        this.limpiarSeleccion();
        return;
      }

      const empresaId = empresasIds[index];
      this.empresaService.updateEmpresa(empresaId, { tiposServicio: servicios as any }).subscribe({
        next: () => {
          actualizadas++;
          actualizarSiguiente(index + 1);
        },
        error: (error) => {
          console.error('Error actualizando empresa:', error);
          errores++;
          actualizarSiguiente(index + 1);
        }
      });
    };

    actualizarSiguiente(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  crearEmpresa(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  verDetalle(empresaOId: string | Empresa | undefined): void {
    const id = typeof empresaOId === 'string' ? empresaOId : (empresaOId?.id || (empresaOId as any)?._id);
    if (!id) {
      this.snackBar.open('ID de empresa no disponible', 'Cerrar', { duration: 3000 });
      return;
    }
    this.router.navigate(['/empresas', id]);
  }

  editarEmpresa(empresaOId: string | Empresa | undefined): void {
    const id = typeof empresaOId === 'string' ? empresaOId : (empresaOId?.id || (empresaOId as any)?._id);
    if (!id) {
      this.snackBar.open('ID de empresa no disponible', 'Cerrar', { duration: 3000 });
      return;
    }
    this.router.navigate(['/empresas', id, 'editar']);
  }

  eliminarEmpresa(empresaOId: string | Empresa | undefined): void {
    const id = typeof empresaOId === 'string' ? empresaOId : (empresaOId?.id || (empresaOId as any)?._id);
    if (!id) return;
    if (confirm('¿Está seguro que desea eliminar esta empresa?')) {
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('Empresa eliminada exitosamente', 'Cerrar', { duration: 3000 });
          this.cargarEmpresas();
        },
        error: (error) => {
          console.error('Error eliminando empresa:', error);
          this.snackBar.open('Error al eliminar empresa', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getEstadoDisplayName(estado: string): string {
    const estados: { [key: string]: string } = {
      'AUTORIZADA': 'Autorizada',
      'EN_TRAMITE': 'En Trámite',
      'SUSPENDIDA': 'Suspendida',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado || 'Autorizada';
  }

  getServicioAbreviado(servicio: string): string {
    if (!servicio) return '';
    const s = servicio.toUpperCase().trim();
    const mapa: { [key: string]: string } = {
      'PASAJEROS': 'PASAJ.',
      'PERSONAS': 'PASAJ.',
      'TURISMO': 'TUR.',
      'TRABAJADORES': 'TRAB.',
      'MERCANCIAS': 'MERC.',
      'MERCANCÍAS': 'MERC.',
      'CARGA': 'CARGA',
      'INFRAESTRUCTURA': 'INFRA.',
      'MIXTO': 'MIXTO',
      'OTROS': 'OTROS'
    };
    if (mapa[s]) return mapa[s];
    return s.length > 6 ? s.substring(0, 5) + '.' : s;
  }

  exportarExcelSeleccionadas(): void {
    const set = this.empresasSeleccionadas();
    const seleccionadas = this.empresas().filter(e => set.has(e.id));
    this.ejecutarExportacionExcel(seleccionadas, 'empresas-seleccionadas');
  }

  exportarExcelTodas(): void {
    this.ejecutarExportacionExcel(this.empresas(), 'empresas-todas');
  }

  exportarExcelCasilla(conCasilla: boolean): void {
    const filtradas = this.empresas().filter(e => {
      const tiene = Boolean(e.casillaElectronica?.habilitada || e.tieneCasillaElectronica);
      return conCasilla ? tiene : !tiene;
    });
    const prefijo = conCasilla ? 'empresas-con-casilla-habilitada' : 'empresas-sin-casilla-electronica';
    this.ejecutarExportacionExcel(filtradas, prefijo);
  }

  async exportarExcel(): Promise<void> {
    let prefijo = 'empresas-filtradas';
    if (this.casillaFilter() === 'CON_CASILLA') prefijo = 'empresas-con-casilla';
    else if (this.casillaFilter() === 'SIN_CASILLA') prefijo = 'empresas-sin-casilla';
    this.ejecutarExportacionExcel(this.empresasFiltradas(), prefijo);
  }

  private async ejecutarExportacionExcel(lista: Empresa[], filenamePrefix: string): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      const datosExportacion = lista.map(empresa => ({
        'RUC': empresa.ruc,
        'Razón Social Principal': empresa.razonSocial.principal,
        'Razón Social SUNAT': empresa.razonSocial.sunat || '',
        'Razón Social Mínimo': empresa.razonSocial.minimo || '',
        'Dirección Fiscal': empresa.direccionFiscal || '',
        'Estado': this.getEstadoDisplayName(empresa.estado),
        'Tipo de Servicio': (empresa.tiposServicio || []).join('; '),
        'Email Contacto': empresa.emailContacto || '',
        'Teléfono Contacto': empresa.telefonoContacto || '',
        'Sitio Web': empresa.sitioWeb || '',
        'Representante Legal': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => `${s.nombres} ${s.apellidos}`)
          .join('; ') || '',
        'DNI Representante': empresa.socios
          ?.filter(s => s.tipoSocio === 'REPRESENTANTE_LEGAL')
          .map(s => s.dni)
          .join('; ') || '',
        'Casilla Electrónica': (empresa.casillaElectronica?.habilitada || empresa.tieneCasillaElectronica)
          ? 'HABILITADA'
          : 'NO REGISTRADA',
        'Fecha Validación Casilla': empresa.casillaElectronica?.fechaValidacion
          ? new Date(empresa.casillaElectronica.fechaValidacion).toLocaleDateString('es-PE')
          : '',
        'Observaciones': empresa.observaciones || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosExportacion);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `${filenamePrefix}-${fecha}.xlsx`);
      this.snackBar.open(`${datosExportacion.length} empresas exportadas a Excel`, 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      this.snackBar.open('Error al exportar a Excel', 'Cerrar', { duration: 3000 });
    }
  }

  abrirConfiguracionColumnas(): void {
    const dialogRef = this.dialog.open(ConfiguracionColumnasDialog, {
      width: '400px',
      data: { columnas: this.columnasDisponibles }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const columnasActualizadas = result
          .filter((col: any) => col.visible)
          .map((col: any) => col.id);
        this.columnasVisibles.set(columnasActualizadas);
        this.columnasDisponibles = result;
        // Persistir en localStorage
        localStorage.setItem('drtc_empresas_columnas_v4', JSON.stringify(columnasActualizadas));
      }
    });
  }

  irAInicializador(): void {
    this.router.navigate(['/inicializador-datos']);
  }

}

// Dialog Component for Column Configuration
@Component({
  selector: 'app-configuracion-columnas-dialog',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatButtonModule, MatIconModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Configurar Columnas Visibles</h2>
    <mat-dialog-content>
      <div class="columnas-list">
        <div *ngFor="let columna of data.columnas" class="columna-item">
          <mat-checkbox 
            [(ngModel)]="columna.visible"
            [disabled]="columna.id === 'acciones'">
            {{ columna.label }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Aplicar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .columnas-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }
    .columna-item { display: flex; align-items: center; }
    mat-dialog-actions { padding: 16px 0 0 0; }

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      .columna-item mat-checkbox { color: #f1f5f9; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
  `]
})
export class ConfiguracionColumnasDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfiguracionColumnasDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void { this.dialogRef.close(this.data.columnas); }
}

// Dialog Component for Bulk Status Edit
@Component({
  selector: 'app-edicion-bloque-estado-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Estado Legal en Bloque</h2>
    <mat-dialog-content>
      <p>Cambiar estado legal de <strong>{{ data.cantidadSeleccionadas }}</strong> empresa(s) seleccionadas</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nuevo Estado Legal</mat-label>
        <mat-select [(ngModel)]="nuevoEstado">
          <mat-option value="AUTORIZADA">Autorizada</mat-option>
          <mat-option value="EN_TRAMITE">En Trámite</mat-option>
          <mat-option value="SUSPENDIDA">Suspendida</mat-option>
          <mat-option value="CANCELADA">Cancelada</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Motivo o Nota Operativa (opcional)</mat-label>
        <textarea matInput [(ngModel)]="motivo" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!nuevoEstado">
        Aplicar Estado
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      p { color: #cbd5e1; }
      strong { color: #ffffff; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
  `]
})
export class EdicionBloqueEstadoDialog {
  nuevoEstado = '';
  motivo = '';

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueEstadoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void {
    this.dialogRef.close({
      nuevoEstado: this.nuevoEstado,
      motivo: this.motivo
    });
  }
}

// Dialog Component for Bulk Services Edit
@Component({
  selector: 'app-edicion-bloque-servicios-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Cambiar Tipos de Servicio en Bloque</h2>
    <mat-dialog-content>
      <p>Actualizar modalidades de <strong>{{ data.cantidadSeleccionadas }}</strong> empresa(s)</p>
      
      <div class="servicios-list">
        <div *ngFor="let servicio of serviciosDisponibles" class="servicio-item">
          <mat-checkbox 
            [checked]="serviciosSeleccionados[servicio]"
            (change)="toggleServicio(servicio, $event)">
            {{ servicio }}
          </mat-checkbox>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="serviciosSeleccionadosArray().length === 0">
        Aplicar Servicios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .servicios-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }
    .servicio-item { display: flex; align-items: center; }

    :host-context([data-theme="dark"]), :host-context(.dark-theme) {
      color: #f8fafc;
      p { color: #cbd5e1; }
      strong { color: #ffffff; }
      .servicio-item mat-checkbox { color: #f1f5f9; }
      button[mat-button] { color: #94a3b8; }
      button[mat-raised-button] { background-color: #2563eb !important; color: #ffffff !important; }
    }
  `]
})
export class EdicionBloqueServiciosDialog {
  serviciosDisponibles = ['PASAJEROS', 'TURISMO', 'TRABAJADORES', 'MERCANCIAS', 'CARGA', 'INFRAESTRUCTURA', 'OTROS', 'MIXTO'];
  serviciosSeleccionados: { [key: string]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<EdicionBloqueServiciosDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.serviciosDisponibles.forEach(s => {
      this.serviciosSeleccionados[s] = false;
    });
  }

  toggleServicio(servicio: string, event: any): void {
    this.serviciosSeleccionados[servicio] = event.checked;
  }

  serviciosSeleccionadosArray(): string[] {
    return Object.keys(this.serviciosSeleccionados).filter(s => this.serviciosSeleccionados[s]);
  }

  onCancel(): void { this.dialogRef.close(); }
  onConfirm(): void {
    this.dialogRef.close({
      servicios: this.serviciosSeleccionadosArray()
    });
  }
}
