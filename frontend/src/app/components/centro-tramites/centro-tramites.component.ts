import { Component, inject, signal, computed, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EmpresaService } from '../../services/empresa.service';
import { FlotaEmpresaService, TramiteMasivoRequest, ResumenEmpresa } from '../../services/flota-empresa.service';
import { ResolucionHijaService } from '../../services/resolucion-hija.service';
import { ResolucionPrimigenia } from '../../models/resolucion-primigenia.model';
import { BusquedaGlobalService } from '../../services/busqueda-global.service';
import { VehiculoDataService } from '../../services/vehiculo-data.service';
import { VehiculoModalComponent } from './vehiculo-modal.component';
import { RutaModalComponent } from './ruta-modal.component';
import { SustitucionModalComponent } from './sustitucion-modal.component';
import { BajaExternaFormComponent } from '../bajas-externas/baja-externa-form/baja-externa-form.component';

@Component({
  selector: 'app-centro-tramites',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './centro-tramites.component.html',
  styleUrls: ['./centro-tramites.component.scss']
})
export class CentroTramites implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  private fb = inject(FormBuilder);
  private flotaService = inject(FlotaEmpresaService);
  private empresaService = inject(EmpresaService);
  private busquedaGlobalService = inject(BusquedaGlobalService);
  private resolucionHijaService = inject(ResolucionHijaService);
  private vehiculoDataService = inject(VehiculoDataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // States for Drawer / Wizard
  isDrawerOpen = signal<boolean>(false);
  empresaBuscada = signal<any>(null);
  tramiteSeleccionado = signal<string | null>(null);
  resoluciones = signal<ResolucionPrimigenia[]>([]);
  vehiculos = signal<any[]>([]);
  vehiculosEnResolucion = signal<any[]>([]);
  resolucionSeleccionada = signal<ResolucionPrimigenia | null>(null);
  empresaSearchText = signal<string>('');

  // States for Compact Inline Sustitución
  placaSalienteTemp = signal<string>('');
  filtroSalienteText = signal<string>('');
  mostrarSugerenciasSaliente = signal<boolean>(false);
  datosTecnicosSaliente = signal<any>(null);
  buscandoPlacaSaliente = signal<boolean>(false);

  placaEntranteTemp = signal<string>('');
  datosTecnicosEntrante = signal<any>(null);
  buscandoPlacaEntrante = signal<boolean>(false);
  habilitacionOtraEmpresa = signal<{ ruc: string; razon_social: string; nro_resolucion_primigenia?: string } | null>(null);
  darDeBajaOtraEmpresa = signal<boolean>(true);

  // Control de Stepper y Navegación Inferior Fija
  @ViewChild('stepper') stepper?: MatStepper;
  pasoActual = signal<number>(0);

  // States for Step 2 Data
  vehiculosNuevos = signal<any[]>([]);
  paresSustitucion = signal<any[]>([]);
  vehiculosBajaSeleccionados = signal<string[]>([]);
  vehiculosTramiteSeleccionados = signal<string[]>([]);
  isProcessing = signal<boolean>(false);
  cargandoHistorial = signal<boolean>(false);

  // States for Renovación Master Flow
  duracionAniosRenovacion = signal<number>(4);
  rutasEmpresaActual = signal<any[]>([]);
  rutasSeleccionadasRenovacion = signal<string[]>([]);
  cargandoRutas = signal<boolean>(false);
  modoCargaVehiculosRenovacion = signal<'PRECARGADA' | 'MULTIFILA'>('PRECARGADA');
  lineasExcelInput = signal<string>('');
  procesandoLineasExcel = signal<boolean>(false);
  vehiculosRenovacionLista = signal<any[]>([]);

  // Estados de Colapso para Secciones del Paso 3 (Renovación)
  grupoVigenciaColapsado = signal<boolean>(false);
  grupoRutasColapsado = signal<boolean>(false);
  grupoFlotaColapsado = signal<boolean>(false);

  // Catálogo completo de empresas y resoluciones
  empresasCatalogo = signal<ResumenEmpresa[]>([]);
  todasResoluciones = signal<any[]>([]);

  // Filtros de tabla
  filtroTexto = signal<string>('');
  filtroTipo = signal<string>('TODOS');
  filtroAnio = signal<string>('TODOS');
  filtroEstado = signal<string>('TODOS');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);

  // States for Dashboard
  estadisticas = signal({
    total: 0,
    renovaciones: 0,
    sustituciones: 0,
    incrementos: 0
  });

  // Column configuration
  todasColumnasDisponibles = [
    { key: 'correlativo', label: 'Correlativo', visible: true, fija: false },
    { key: 'id', label: 'N° Resolución', visible: true, fija: false },
    { key: 'fecha', label: 'Fecha', visible: true, fija: false },
    { key: 'empresa', label: 'Empresa / RUC', visible: true, fija: false },
    { key: 'tipo', label: 'Tipo Trámite', visible: true, fija: false },
    { key: 'doc', label: 'Origen / Exp.', visible: true, fija: false },
    { key: 'vehiculos', label: 'Vehículos', visible: true, fija: false },
    { key: 'estado', label: 'Estado', visible: true, fija: false },
    { key: 'acciones', label: 'Acciones', visible: true, fija: true }
  ];
  columnasVisibles = signal<Record<string, boolean>>(this._cargarColumnasGuardadas());
  mostrarConfigColumnas = signal<boolean>(false);

  // Detail panel
  tramiteDetalle = signal<any>(null);
  mostrarDetalle = signal<boolean>(false);

  columnasTablaVisibles = computed(() => {
    const config = this.columnasVisibles();
    return this.todasColumnasDisponibles
      .filter(c => config[c.key] !== false)
      .map(c => c.key);
  });

  tiposTramite = [
    { id: 'RENOVACION', nombre: 'Renovación', icono: 'autorenew', desc: 'Extensión de vigencia' },
    { id: 'SUSTITUCION', nombre: 'Sustitución', icono: 'sync_alt', desc: 'Reemplazo de unidad' },
    { id: 'INCREMENTO', nombre: 'Incremento', icono: 'trending_up', desc: 'Nuevas unidades' },
    { id: 'DUPLICADO', nombre: 'Duplicado', icono: 'file_copy', desc: 'Emisión de copia de TUC' },
    { id: 'CANJE', nombre: 'Canje', icono: 'change_circle', desc: 'Actualización de TUC' },
    { id: 'BAJAS', nombre: 'Bajas', icono: 'remove_circle', desc: 'Retiro definitivo' },
    { id: 'CANCELACION', nombre: 'Cancelación', icono: 'cancel', desc: 'Cese de autorización' },
    { id: 'MODIFICACION', nombre: 'Modificación', icono: 'tune', desc: 'Cambios de itinerario' }
  ];

  // Forms
  datosOrigenForm = this.fb.group({
    tipo_origen: ['EXPEDIENTE'],
    numero_origen: [''],
    fecha_origen: [''],
    nro_resolucion_hija: [''],
    fecha_emision_resolucion: ['']
  });

  resolucionForm = this.fb.group({
    nro_resolucion_primigenia: ['', Validators.required]
  });

  renovacionForm = this.fb.group({
    nueva_resolucion_primigenia: ['', Validators.required],
    nueva_fecha_emision: [new Date().toISOString().substring(0, 10), Validators.required],
    nueva_fecha_inicio_vigencia: [new Date().toISOString().substring(0, 10)],
    nueva_fecha_fin_vigencia: ['']
  });

  bajaForm = this.fb.group({
    motivo_baja: ['RETIRO VOLUNTARIO Y CESE DE OPERACIONES']
  });

  duplicadoCanjeForm = this.fb.group({
    motivo: ['DETERIORO', Validators.required],
    observaciones: ['']
  });

  cancelacionForm = this.fb.group({
    cancelacion_total: [true],
    motivo: ['CANCELACION DEFINITIVA DE AUTORIZACION']
  });

  // COMPUTED SIGNALS PARA FILTROS Y DATOS
  empresasFiltradas = computed(() => {
    const q = this.empresaSearchText().trim().toLowerCase();
    const list = this.empresasCatalogo();
    if (!q) return list.slice(0, 8);
    return list.filter(e => 
      (e.ruc && e.ruc.toLowerCase().includes(q)) || 
      (e.razon_social && e.razon_social.toLowerCase().includes(q))
    ).slice(0, 12);
  });

  aniosDisponibles = computed(() => {
    const setAnios = new Set<string>();
    for (const r of this.todasResoluciones()) {
      if (r.anio && r.anio !== 'S/A' && /^\d{4}$/.test(r.anio)) {
        setAnios.add(r.anio);
      }
    }
    return Array.from(setAnios).sort((a, b) => b.localeCompare(a));
  });

  hayFiltrosActivos = computed(() => {
    return !!this.filtroTexto().trim() || 
           this.filtroTipo() !== 'TODOS' || 
           this.filtroAnio() !== 'TODOS' || 
           this.filtroEstado() !== 'TODOS';
  });

  vehiculosSalientesFiltrados = computed(() => {
    const yaSustituidos = new Set(this.paresSustitucion().map(p => p.placa_saliente));
    let lista = this.vehiculosEnResolucion().filter(v => !yaSustituidos.has(v.placa));
    const txt = this.filtroSalienteText().trim().toUpperCase();
    if (txt) {
      lista = lista.filter(v => 
        (v.placa && v.placa.toUpperCase().includes(txt)) ||
        (v.marca && v.marca.toUpperCase().includes(txt)) ||
        (v.modelo && v.modelo.toUpperCase().includes(txt))
      );
    }
    return lista.slice(0, 15);
  });

  vehiculosSalientesDisponibles = computed(() => {
    const yaSustituidos = new Set(this.paresSustitucion().map(p => p.placa_saliente));
    return this.vehiculosEnResolucion().filter(v => !yaSustituidos.has(v.placa));
  });

  vehiculoSalienteSeleccionado = computed(() => {
    const p = this.placaSalienteTemp();
    if (!p) return null;
    const base = this.vehiculosEnResolucion().find(v => v.placa === p) || {};
    const dt = this.datosTecnicosSaliente() || {};
    return {
      ...base,
      ...dt,
      placa: p,
      marca: dt.marca || base.marca || '',
      modelo: dt.modelo || base.modelo || '',
      anio_fabricacion: dt.anio_fabricacion || base.anio_fabricacion || base.anio || null,
      categoria: dt.categoria || base.categoria || 'M2',
      asientos: dt.asientos || dt.numero_asientos || dt.numero_pasajeros || base.asientos || null,
      peso_neto: dt.peso_neto || base.peso_neto || null
    };
  });

  tramitesFiltrados = computed(() => {
    let list = this.todasResoluciones();
    const txt = this.filtroTexto().trim().toLowerCase();
    const tipo = this.filtroTipo();
    const anio = this.filtroAnio();
    const est = this.filtroEstado();

    if (txt) {
      list = list.filter(item => 
        (item.correlativo && item.correlativo.toLowerCase().includes(txt)) ||
        (item.id && item.id.toLowerCase().includes(txt)) ||
        (item.empresa && item.empresa.toLowerCase().includes(txt)) ||
        (item.ruc && item.ruc.toLowerCase().includes(txt)) ||
        (item.doc && item.doc.toLowerCase().includes(txt)) ||
        (item.tipo && item.tipo.toLowerCase().includes(txt)) ||
        (item.placasTexto && item.placasTexto.toLowerCase().includes(txt)) ||
        (item.fecha && item.fecha.toLowerCase().includes(txt))
      );
    }

    if (tipo !== 'TODOS') {
      list = list.filter(item => item.tipoRaw.includes(tipo) || item.tipo.toUpperCase().includes(tipo));
    }

    if (anio !== 'TODOS') {
      list = list.filter(item => item.anio === anio);
    }

    if (est !== 'TODOS') {
      list = list.filter(item => item.estado === est);
    }

    return list;
  });

  tramitesPaginados = computed(() => {
    const all = this.tramitesFiltrados();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.cargarHistorialTramites();
    this.cargarCatalogoEmpresas();

    // Vigencia predeterminada de 4 años para renovación
    const hoy = new Date();
    const hoyStr = hoy.toISOString().substring(0, 10);
    this.renovacionForm.patchValue({
      nueva_fecha_emision: hoyStr,
      nueva_fecha_inicio_vigencia: hoyStr
    });
    this.setVigenciaRenovacion(4);

    this.renovacionForm.get('nueva_fecha_inicio_vigencia')?.valueChanges.subscribe(val => {
      if (val) {
        this.setVigenciaRenovacion(this.duracionAniosRenovacion());
      }
    });
  }

  cargarCatalogoEmpresas() {
    this.flotaService.getResumenEmpresas().subscribe({
      next: (res) => {
        this.empresasCatalogo.set(res.data || []);
      },
      error: (err) => console.warn('Error cargando catálogo de empresas:', err)
    });
  }

  cargarHistorialTramites() {
    this.cargandoHistorial.set(true);
    this.resolucionHijaService.getResolucionesHijas().subscribe({
      next: (resoluciones) => {
        this.cargandoHistorial.set(false);
        const lista = resoluciones || [];
        
        // Calcular estadísticas dinámicas
        const total = lista.length;
        const renovaciones = lista.filter(r => (r.tipo_acto || '').toUpperCase().includes('RENOVACION')).length;
        const sustituciones = lista.filter(r => (r.tipo_acto || '').toUpperCase().includes('SUSTITUCION') || (r.vehiculos_salientes && r.vehiculos_salientes.length > 0)).length;
        const incrementos = lista.filter(r => (r.tipo_acto || '').toUpperCase().includes('INCREMENTO')).length;

        this.estadisticas.set({
          total,
          renovaciones,
          sustituciones,
          incrementos
        });

        // Mapear todas las resoluciones
        const mapeadas = lista.map((r: any) => {
          let anio = 'S/A';
          let fechaSort = '1970-01-01';
          if (r.fecha_resolucion) {
            const d = new Date(r.fecha_resolucion);
            if (!isNaN(d.getFullYear())) {
              anio = d.getFullYear().toString();
              fechaSort = d.toISOString();
            }
          }
          if (anio === 'S/A' && r.nro_resolucion) {
            const m = r.nro_resolucion.match(/(19\d\d|20\d\d)/);
            if (m) anio = m[1];
          }

          const placasIng: string[] = Array.isArray(r.vehiculos_ingresantes) ? r.vehiculos_ingresantes : [];
          const placasSal: string[] = Array.isArray(r.vehiculos_salientes) ? r.vehiculos_salientes : [];
          const todasPlacas = [...placasIng, ...placasSal].join(' ');

          const tipoActo = r.tipo_acto || r.tipo_tramite_origen || 'MODIFICACION';
          const doc = r.expediente_numero || r.nro_resolucion_primigenia || 'S/N';
          const razon = r.razon_social || r.ruc_empresa || 'EMPRESA NO ESPECIFICADA';

          return {
            _id: r._id || r.id,
            correlativo: '', // se asigna después del sort
            id: r.nro_resolucion || 'S/N',
            fecha: r.fecha_resolucion ? new Date(r.fecha_resolucion).toLocaleDateString('es-PE') : 'S/F',
            fechaSort,
            anio,
            empresa: razon,
            ruc: r.ruc_empresa || '',
            tipoRaw: tipoActo.toUpperCase(),
            tipo: tipoActo.replace(/_/g, ' '),
            doc,
            nro_resolucion_primigenia: r.nro_resolucion_primigenia,
            placasIng,
            placasSal,
            placasTexto: todasPlacas,
            estado: r.esta_activo !== false ? 'PROCESADO' : 'INACTIVO',
            // datos extra para detalle
            observaciones: r.observaciones || '',
            fecha_resolucion_raw: r.fecha_resolucion || null,
            fecha_inicio_efectos: r.fecha_inicio_efectos || null,
            expediente_numero: r.expediente_numero || '',
            link_documento: r.link_documento || '',
            link_notificacion: r.link_notificacion || '',
            numeros_tuc: r.numeros_tuc || [],
            rutas_modificadas_ids: r.rutas_modificadas_ids || [],
            fecha_registro: r.fecha_registro || null
          };
        });

        // Ordenar descendente:
        // Los trámites registrados en el sistema recientemente (fecha_registro posterior a la importación 2026-09-15)
        // se colocan en la cima absoluta de la tabla para recibir el último correlativo disponible.
        mapeadas.sort((a, b) => {
          const regA = a.fecha_registro ? new Date(a.fecha_registro).getTime() : 0;
          const regB = b.fecha_registro ? new Date(b.fecha_registro).getTime() : 0;
          const cutoff = new Date('2026-09-15T00:00:00Z').getTime();

          const isNewA = regA > cutoff;
          const isNewB = regB > cutoff;

          if (isNewA && !isNewB) return -1;
          if (!isNewA && isNewB) return 1;
          if (isNewA && isNewB) return regB - regA;

          return b.fechaSort.localeCompare(a.fechaSort);
        });

        // Generar correlativo TR-XXXX-YY
        const anioActual = new Date().getFullYear().toString().slice(-2);
        mapeadas.forEach((item, index) => {
          const num = (mapeadas.length - index).toString().padStart(4, '0');
          item.correlativo = `TR-${num}-${anioActual}`;
        });

        this.todasResoluciones.set(mapeadas);
      },
      error: (err) => {
        this.cargandoHistorial.set(false);
        console.warn('Error cargando historial de resoluciones:', err);
      }
    });
  }

  // GESTIÓN DE FILTROS DE TABLA
  actualizarFiltroTexto(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.filtroTexto.set(val);
    this.pageIndex.set(0);
  }

  limpiarFiltroTexto() {
    this.filtroTexto.set('');
    this.pageIndex.set(0);
  }

  cambiarFiltroTipo(tipo: string) {
    this.filtroTipo.set(tipo);
    this.pageIndex.set(0);
  }

  cambiarFiltroAnio(anio: string) {
    this.filtroAnio.set(anio);
    this.pageIndex.set(0);
  }

  cambiarFiltroEstado(estado: string) {
    this.filtroEstado.set(estado);
    this.pageIndex.set(0);
  }

  limpiarTodosFiltros() {
    this.filtroTexto.set('');
    this.filtroTipo.set('TODOS');
    this.filtroAnio.set('TODOS');
    this.filtroEstado.set('TODOS');
    this.pageIndex.set(0);
  }

  // COLUMN CONFIGURATION
  private _cargarColumnasGuardadas(): Record<string, boolean> {
    try {
      const saved = localStorage.getItem('drtc_tramites_columnas');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults: Record<string, boolean> = {};
    this.todasColumnasDisponibles?.forEach(c => defaults[c.key] = c.visible);
    return defaults;
  }

  toggleColumna(key: string) {
    const col = this.todasColumnasDisponibles.find(c => c.key === key);
    if (col?.fija) return; // No se puede ocultar columna fija
    this.columnasVisibles.update(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('drtc_tramites_columnas', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  toggleConfigColumnas() {
    this.mostrarConfigColumnas.update(v => !v);
  }

  cerrarConfigColumnas() {
    this.mostrarConfigColumnas.set(false);
  }

  isColumnaVisible(key: string): boolean {
    return this.columnasVisibles()[key] !== false;
  }

  // DETAIL PANEL
  verDetalleTramite(tramite: any) {
    this.tramiteDetalle.set(tramite);
    this.mostrarDetalle.set(true);
  }

  cerrarDetalle() {
    this.mostrarDetalle.set(false);
    setTimeout(() => this.tramiteDetalle.set(null), 300);
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // ACCIONES DE APERTURA DEL FORMULARIO DE TRÁMITE
  iniciarNuevoTramite() {
    this.isDrawerOpen.set(true);
  }

  iniciarTramiteParaEmpresa(row: any) {
    const empCat = this.empresasCatalogo().find(e => e.ruc === row.ruc);
    if (empCat) {
      this.setEmpresaFromData(empCat);
    } else {
      this.setEmpresaFromData({
        ruc: row.ruc,
        razon_social: row.empresa,
        estado: 'ACTIVO',
        flota: (row.placasIng?.length || 0) + (row.placasSal?.length || 0)
      });
    }

    if (row.nro_resolucion_primigenia) {
      setTimeout(() => {
        this.resolucionForm.patchValue({ nro_resolucion_primigenia: row.nro_resolucion_primigenia });
      }, 300);
    }

    // Si viene de un tipo conocido, preseleccionar
    if (row.tipoRaw) {
      const match = this.tiposTramite.find(t => row.tipoRaw.includes(t.id));
      if (match) {
        this.tramiteSeleccionado.set(match.id);
      }
    }

    this.isDrawerOpen.set(true);
  }

  cerrarDrawer() {
    this.isDrawerOpen.set(false);
  }

  seleccionarEmpresaParaTramite(emp: any) {
    this.setEmpresaFromData(emp);
    this.empresaSearchText.set('');
  }

  cambiarEmpresa() {
    this.empresaBuscada.set(null);
    this.resoluciones.set([]);
    this.vehiculosEnResolucion.set([]);
    this.resolucionForm.reset();
  }

  private setEmpresaFromData(emp: any) {
    const razonSocial = typeof emp.razon_social === 'string' ? emp.razon_social :
                        (typeof emp.razonSocial === 'object' ? emp.razonSocial?.principal : (emp.razonSocial || 'EMPRESA'));

    this.empresaBuscada.set({
      ruc: emp.ruc,
      razon_social: razonSocial,
      estado: emp.estado || 'ACTIVO',
      flota: emp.total_vehiculos || emp.flota || 0,
      vigencia: 'VIGENTE'
    });
    
    // Si ya trae primigenias en el objeto
    if (emp.primigenias && emp.primigenias.length > 0) {
      const resolucionesMock = emp.primigenias.map((p: string) => ({
        id: p, nro_resolucion: p, fecha_resolucion: new Date(), ruc_empresa: emp.ruc, estado: 'VIGENTE'
      }));
      this.resoluciones.set(resolucionesMock as any);
      if (resolucionesMock.length === 1) {
        this.resolucionForm.patchValue({ nro_resolucion_primigenia: resolucionesMock[0].nro_resolucion });
        this.cargarVehiculosResolucion(resolucionesMock[0].nro_resolucion);
      }
    } else {
      // Buscar en el catálogo o servicio
      this.flotaService.getResumenEmpresas().subscribe({
        next: (res) => {
          const empresaResumen = res.data.find(r => r.ruc === emp.ruc);
          if (empresaResumen) {
            this.empresaBuscada.update(e => ({...e, flota: empresaResumen.total_vehiculos}));
            if (empresaResumen.primigenias && empresaResumen.primigenias.length > 0) {
              const resolucionesMock = empresaResumen.primigenias.map(p => ({
                id: p, nro_resolucion: p, fecha_resolucion: new Date(), ruc_empresa: emp.ruc, estado: 'VIGENTE'
              }));
              this.resoluciones.set(resolucionesMock as any);
              if (resolucionesMock.length === 1) {
                this.resolucionForm.patchValue({ nro_resolucion_primigenia: resolucionesMock[0].nro_resolucion });
                this.cargarVehiculosResolucion(resolucionesMock[0].nro_resolucion);
              }
            } else {
              this.resoluciones.set([]);
            }
          }
        }
      });
    }

    // Escuchar cambios en la resolución para cargar vehículos
    this.resolucionForm.get('nro_resolucion_primigenia')?.valueChanges.subscribe(res => {
      if (res) {
        this.cargarVehiculosResolucion(res);
      }
    });
  }

  cargarVehiculosResolucion(nroRes: string) {
    this.flotaService.getFlotaPaginada({ nro_resolucion_primigenia: nroRes, solo_activos: true, limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.vehiculosEnResolucion.set(list);
        this.inicializarFlotaRenovacion(list);
      },
      error: (err) => {
        console.error('Error al cargar vehículos', err);
        this.vehiculosEnResolucion.set([]);
        this.vehiculosRenovacionLista.set([]);
      }
    });

    const emp = this.empresaBuscada();
    if (emp?.ruc) {
      this.cargarRutasEmpresa(emp.ruc, nroRes);
    }
  }

  cancelarTramite() {
    this.isDrawerOpen.set(false);
    this.empresaBuscada.set(null);
    this.tramiteSeleccionado.set(null);
    this.vehiculosNuevos.set([]);
    this.paresSustitucion.set([]);
    this.vehiculosBajaSeleccionados.set([]);
    this.vehiculosTramiteSeleccionados.set([]);
    this.vehiculosRenovacionLista.set([]);
    this.rutasEmpresaActual.set([]);
    this.rutasSeleccionadasRenovacion.set([]);
    this.lineasExcelInput.set('');
    this.modoCargaVehiculosRenovacion.set('PRECARGADA');
    this.duracionAniosRenovacion.set(4);
    this.placaSalienteTemp.set('');
    this.filtroSalienteText.set('');
    this.datosTecnicosSaliente.set(null);
    this.placaEntranteTemp.set('');
    this.datosTecnicosEntrante.set(null);
    this.habilitacionOtraEmpresa.set(null);
    this.darDeBajaOtraEmpresa.set(true);
    this.pasoActual.set(0);
    if (this.stepper) {
      this.stepper.reset();
    }
  }

  // Helper methods para Stepper fijo
  onPasoCambio(event: any) {
    this.pasoActual.set(event.selectedIndex);
  }

  retrocederPaso() {
    if (this.stepper) {
      this.stepper.previous();
    }
  }

  avanzarPaso() {
    if (this.tramiteSeleccionado() === 'RENOVACION' && this.pasoActual() === 1) {
      this.normalizarNuevaResolucion();
    }
    if (this.stepper) {
      this.stepper.next();
    }
  }

  puedeAvanzar(stepIndex: number): boolean {
    if (stepIndex === 0) {
      return !!this.empresaBuscada() && !!this.tramiteSeleccionado();
    }
    if (stepIndex === 1) {
      const tieneResolucion = !!this.resolucionForm.get('nro_resolucion_primigenia')?.value;
      if (this.tramiteSeleccionado() === 'RENOVACION') {
        return tieneResolucion && this.renovacionForm.valid;
      }
      return tieneResolucion;
    }
    if (stepIndex === 2) {
      const t = this.tramiteSeleccionado();
      if (t === 'SUSTITUCION') return this.paresSustitucion().length > 0;
      if (t === 'INCREMENTO') return this.vehiculosNuevos().length > 0;
      if (t === 'BAJAS') return this.vehiculosBajaSeleccionados().length > 0;
      if (t === 'RENOVACION') {
        return this.vehiculosRenovacionLista().some(v => v.seleccionado);
      }
      if (t === 'DUPLICADO' || t === 'CANJE') return this.vehiculosTramiteSeleccionados().length > 0;
      return true;
    }
    return true;
  }

  // Gestión de Búsqueda Saliente (primigenia)
  onSalienteInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = (input.value || '').toUpperCase().trim();
    this.filtroSalienteText.set(val);
    this.mostrarSugerenciasSaliente.set(true);

    if (/^[A-Z0-9]{6}$/.test(val)) {
      val = `${val.substring(0, 3)}-${val.substring(3)}`;
    }

    const exactMatch = this.vehiculosEnResolucion().find(v => v.placa === val || v.placa.replace('-', '') === val.replace('-', ''));
    if (exactMatch) {
      this.seleccionarSaliente(exactMatch);
    } else if (!val) {
      this.placaSalienteTemp.set('');
      this.datosTecnicosSaliente.set(null);
    }
  }

  seleccionarSaliente(vehiculo: any) {
    let placa = typeof vehiculo === 'string' ? vehiculo : (vehiculo.placa || '');
    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
    }
    this.placaSalienteTemp.set(placa);
    this.filtroSalienteText.set(placa);
    this.mostrarSugerenciasSaliente.set(false);
    if (placa) {
      this.buscarDatosVehiculoSaliente(placa, typeof vehiculo === 'object' ? vehiculo : null);
    }
  }

  buscarDatosVehiculoSaliente(placa: string, fallbackObj?: any) {
    if (!placa) return;
    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.placaSalienteTemp.set(placa);
    }
    this.buscandoPlacaSaliente.set(true);

    if (fallbackObj) {
      this.datosTecnicosSaliente.set({
        placa,
        marca: fallbackObj.marca || '',
        modelo: fallbackObj.modelo || '',
        anio_fabricacion: fallbackObj.anio_fabricacion || fallbackObj.anio || null,
        categoria: fallbackObj.categoria || 'M2',
        asientos: fallbackObj.asientos || null
      });
    }

    this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
      next: (res) => {
        this.buscandoPlacaSaliente.set(false);
        if (res && res.success && res.data) {
          const d = res.data;
          this.datosTecnicosSaliente.set({
            placa: d.placa || placa,
            marca: d.marca || fallbackObj?.marca || '',
            modelo: d.modelo || fallbackObj?.modelo || '',
            anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || d.anoFabricacion || fallbackObj?.anio_fabricacion || null,
            categoria: d.categoria || fallbackObj?.categoria || 'M2',
            asientos: d.numero_asientos || d.asientos || d.numero_pasajeros || d.pasajeros || fallbackObj?.asientos || null,
            peso_neto: d.peso_neto || d.peso_seco || fallbackObj?.peso_neto || null,
            color: d.color || '',
            carroceria: d.carroceria || ''
          });
        }
      },
      error: (err) => {
        this.buscandoPlacaSaliente.set(false);
        console.warn('No se pudo obtener datos técnicos para saliente:', err);
      }
    });
  }

  onSalienteBlur() {
    setTimeout(() => {
      this.mostrarSugerenciasSaliente.set(false);
      const txt = this.filtroSalienteText().trim().toUpperCase();
      if (txt && !this.placaSalienteTemp()) {
        const match = this.vehiculosEnResolucion().find(v => v.placa === txt || v.placa.replace('-', '') === txt.replace('-', ''));
        if (match) {
          this.seleccionarSaliente(match);
        }
      }
    }, 250);
  }

  seleccionarTramite(id: string) {
    this.tramiteSeleccionado.set(id);
    if (!this.datosOrigenForm.get('nro_resolucion_hija')?.value) {
      this.cargarSiguienteResolucionHija(id);
    }
    if (id === 'RENOVACION') {
      const vList = this.vehiculosEnResolucion();
      if (vList.length > 0 && this.vehiculosRenovacionLista().length === 0) {
        this.inicializarFlotaRenovacion(vList);
      }
      const emp = this.empresaBuscada();
      const res = this.resolucionForm.get('nro_resolucion_primigenia')?.value;
      if (emp?.ruc) {
        this.cargarRutasEmpresa(emp.ruc, res || undefined);
      }
    }
  }

  cargarSiguienteResolucionHija(tipo?: string) {
    const t = tipo || this.tramiteSeleccionado() || undefined;
    this.resolucionHijaService.getSiguienteNumero(t).subscribe({
      next: (res) => {
        if (res && res.siguiente_numero && !this.datosOrigenForm.get('nro_resolucion_hija')?.value) {
          this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(res.siguiente_numero);
        }
      },
      error: (err) => console.warn('No se pudo precargar siguiente número correlativo:', err)
    });
  }

  abrirModalVehiculo() {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.vehiculosNuevos.update(v => [...v, result]);
      }
    });
  }

  onPlacaEntranteInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = (input.value || '').toUpperCase().trim();
    this.placaEntranteTemp.set(val);
    if (this.habilitacionOtraEmpresa()) {
      this.habilitacionOtraEmpresa.set(null);
    }
  }

  buscarDatosVehiculoEntrante() {
    let placa = this.placaEntranteTemp().toUpperCase().trim();
    if (!placa || placa.length < 5) return;

    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.placaEntranteTemp.set(placa);
    }

    this.buscandoPlacaEntrante.set(true);
    const empresaActualRuc = this.empresaBuscada()?.ruc;

    // 1. Consultar si la unidad ya está habilitada en otra empresa en toda la BD
    this.flotaService.getFlotaPaginada({ placa, solo_activos: true, limit: 10 }).subscribe({
      next: (resFlota) => {
        const registros = resFlota.data || [];
        const otraEmpresa = registros.find(r => r.ruc !== empresaActualRuc && (r.estado === 'HABILITADO' || r.esta_activo !== false));
        if (otraEmpresa) {
          this.habilitacionOtraEmpresa.set({
            ruc: otraEmpresa.ruc,
            razon_social: otraEmpresa.razon_social || 'Otra Empresa Registrada',
            nro_resolucion_primigenia: otraEmpresa.nro_resolucion_primigenia
          });
          this.darDeBajaOtraEmpresa.set(true);
        } else {
          this.habilitacionOtraEmpresa.set(null);
        }

        const matchData = registros.find(r => r.marca || r.modelo);
        if (matchData && (!this.datosTecnicosEntrante() || !this.datosTecnicosEntrante()?.marca)) {
          this.datosTecnicosEntrante.set({
            placa,
            marca: matchData.marca || '',
            modelo: matchData.modelo || '',
            anio_fabricacion: matchData.anio_fabricacion || null,
            categoria: matchData.categoria || 'M2',
            asientos: matchData.asientos || null,
            peso_neto: matchData.peso_neto || null,
            numero_tuc: matchData.numero_tuc || '',
            color: matchData.color || '',
            combustible: matchData.combustible || '',
            numero_motor: matchData.numero_motor || '',
            numero_serie: matchData.numero_serie || '',
            vin: matchData.vin || ''
          });
        }

        // 2. Traer ficha técnica de SUNARP / Padron
        this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
          next: (res) => {
            this.buscandoPlacaEntrante.set(false);
            if (res && res.success && res.data) {
              const d = res.data;
              this.datosTecnicosEntrante.update(prev => ({
                placa: d.placa || placa,
                marca: d.marca || prev?.marca || '',
                modelo: d.modelo || prev?.modelo || '',
                anio_fabricacion: d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || d.anoFabricacion || d.anio || prev?.anio_fabricacion || null,
                categoria: d.categoria || prev?.categoria || 'M2',
                asientos: d.numero_asientos || d.asientos || d.numero_pasajeros || d.pasajeros || prev?.asientos || null,
                peso_neto: d.peso_neto || d.peso_seco || prev?.peso_neto || null,
                numero_tuc: d.numero_tuc || prev?.numero_tuc || '',
                color: d.color || prev?.color || '',
                combustible: d.combustible || prev?.combustible || '',
                numero_motor: d.numero_motor || prev?.numero_motor || '',
                numero_serie: d.numero_serie || prev?.numero_serie || '',
                vin: d.vin || prev?.vin || ''
              }));
              this.snackBar.open(`✓ Especificaciones encontradas para ${placa}`, 'Cerrar', { duration: 2500 });
            } else if (!this.datosTecnicosEntrante() || !this.datosTecnicosEntrante()?.marca) {
              this.datosTecnicosEntrante.set({
                placa,
                marca: '',
                modelo: '',
                anio_fabricacion: null,
                categoria: 'M2'
              });
            }
          },
          error: () => {
            this.buscandoPlacaEntrante.set(false);
            if (!this.datosTecnicosEntrante() || !this.datosTecnicosEntrante()?.marca) {
              this.datosTecnicosEntrante.set({
                placa,
                marca: '',
                modelo: '',
                anio_fabricacion: null,
                categoria: 'M2'
              });
            }
          }
        });
      },
      error: () => {
        this.vehiculoDataService.getVehiculoDataByPlaca(placa).subscribe({
          next: (res) => {
            this.buscandoPlacaEntrante.set(false);
            if (res && res.success && res.data) {
              const d = res.data;
              this.datosTecnicosEntrante.set({
                placa: d.placa || placa,
                marca: d.marca || '',
                modelo: d.modelo || '',
                anio_fabricacion: d.anio_fabricacion || d.anio || null,
                categoria: d.categoria || 'M2',
                asientos: d.asientos || null,
                peso_neto: d.peso_neto || null,
                numero_tuc: d.numero_tuc || '',
                color: d.color || '',
                combustible: d.combustible || '',
                numero_motor: d.numero_motor || '',
                numero_serie: d.numero_serie || '',
                vin: d.vin || ''
              });
            }
          },
          error: () => this.buscandoPlacaEntrante.set(false)
        });
      }
    });
  }

  abrirModalDatosTecnicosEntrante(parIndex?: number) {
    let vehiculoData: any = {};
    let placa = '';

    if (parIndex !== undefined) {
      const par = this.paresSustitucion()[parIndex];
      placa = par.placa_entrante;
      vehiculoData = {
        placa: par.placa_entrante,
        marca: par.marca,
        modelo: par.modelo,
        anio_fabricacion: par.anio_fabricacion,
        categoria: par.categoria,
        asientos: par.asientos,
        peso_neto: par.peso_neto,
        numero_tuc: par.numero_tuc,
        ...par.datos_completos
      };
    } else {
      placa = this.placaEntranteTemp().toUpperCase().trim();
      vehiculoData = this.datosTecnicosEntrante() || { placa };
      if (!vehiculoData.placa) vehiculoData.placa = placa;
    }

    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '650px',
      data: {
        vehiculo: vehiculoData,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (parIndex !== undefined) {
          this.paresSustitucion.update(pares => {
            const copia = [...pares];
            copia[parIndex] = {
              ...copia[parIndex],
              placa_entrante: result.placa || copia[parIndex].placa_entrante,
              marca: result.marca,
              modelo: result.modelo,
              anio_fabricacion: result.anio_fabricacion,
              categoria: result.categoria,
              asientos: result.asientos,
              peso_neto: result.peso_neto,
              numero_tuc: result.numero_tuc,
              datos_completos: result
            };
            return copia;
          });
          this.snackBar.open('Datos técnicos actualizados en el par', 'OK', { duration: 3000 });
        } else {
          this.placaEntranteTemp.set(result.placa || placa);
          this.datosTecnicosEntrante.set(result);
          this.snackBar.open('Datos técnicos listos para ' + (result.placa || placa), 'OK', { duration: 3000 });
        }
      }
    });
  }

  agregarParSustitucion() {
    const saliente = this.placaSalienteTemp();
    const entrante = this.placaEntranteTemp().toUpperCase().trim();

    if (!saliente) {
      this.snackBar.open('Seleccione el vehículo saliente de la flota', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!entrante) {
      this.snackBar.open('Ingrese la placa del vehículo entrante', 'Cerrar', { duration: 3000 });
      return;
    }
    if (saliente === entrante) {
      this.snackBar.open('La placa saliente y entrante no pueden ser la misma', 'Cerrar', { duration: 3000 });
      return;
    }
    const yaExiste = this.paresSustitucion().some(p => p.placa_saliente === saliente || p.placa_entrante === entrante);
    if (yaExiste) {
      this.snackBar.open('Una de las placas ya se encuentra en otro par configurado', 'Cerrar', { duration: 3000 });
      return;
    }

    const salienteObj = this.vehiculoSalienteSeleccionado() || this.vehiculosEnResolucion().find(v => v.placa === saliente) || {};
    const dt = this.datosTecnicosEntrante() || {};
    const otraEmp = this.habilitacionOtraEmpresa();
    const nuevoPar = {
      placa_saliente: saliente,
      saliente_marca: salienteObj?.marca || 'S/M',
      saliente_modelo: salienteObj?.modelo || '',
      saliente_anio: salienteObj?.anio_fabricacion || salienteObj?.anio_modelo || salienteObj?.anio || null,
      saliente_categoria: salienteObj?.categoria || 'M2',
      saliente_asientos: salienteObj?.asientos || salienteObj?.numero_asientos || salienteObj?.numero_pasajeros || null,
      saliente_peso_neto: salienteObj?.peso_neto || null,

      placa_entrante: entrante,
      marca: dt.marca || 'S/M',
      modelo: dt.modelo || '',
      anio_fabricacion: dt.anio_fabricacion || dt.anio_modelo || dt.ano_fabricacion || dt.anio || null,
      categoria: dt.categoria || 'M2',
      asientos: dt.asientos || dt.numero_asientos || dt.numero_pasajeros || null,
      peso_neto: dt.peso_neto || null,
      numero_tuc: dt.numero_tuc || undefined,
      datos_completos: dt,
      dar_de_baja_otra_empresa: otraEmp ? this.darDeBajaOtraEmpresa() : false,
      otra_empresa_info: otraEmp ? `${otraEmp.razon_social} (${otraEmp.ruc})` : null,
      otra_empresa_ruc: otraEmp ? otraEmp.ruc : null,
      otra_empresa_razon: otraEmp ? otraEmp.razon_social : null,
      baja_externa_registrada: false
    };

    this.paresSustitucion.update(pares => [...pares, nuevoPar]);
    this.snackBar.open(`✓ Par configurado: ${saliente} ➔ ${entrante}`, 'Entendido', { duration: 3000 });

    // Limpiar selección temporal
    this.placaSalienteTemp.set('');
    this.filtroSalienteText.set('');
    this.datosTecnicosSaliente.set(null);
    this.placaEntranteTemp.set('');
    this.datosTecnicosEntrante.set(null);
    this.habilitacionOtraEmpresa.set(null);
    this.darDeBajaOtraEmpresa.set(true);
  }

  abrirModalBajaExterna(parIndex?: number) {
    let placa = '';
    let ruc = '';
    let razon = '';
    let motivo = 'Habilitado en otra Empresa (Interprovincial)';

    if (parIndex !== undefined) {
      const par = this.paresSustitucion()[parIndex];
      placa = par.placa_entrante;
      ruc = par.otra_empresa_ruc || '';
      razon = par.otra_empresa_razon || '';
      if (!ruc) {
        placa = par.placa_saliente;
        ruc = this.empresaBuscada()?.ruc || '';
        razon = this.empresaBuscada()?.razon_social || '';
        motivo = 'Retiro Voluntario';
      }
    } else {
      const otra = this.habilitacionOtraEmpresa();
      if (otra) {
        placa = this.placaEntranteTemp() || '';
        ruc = otra.ruc || '';
        razon = otra.razon_social || '';
        motivo = 'Habilitado en otra Empresa (Interprovincial)';
      } else if (this.placaSalienteTemp()) {
        placa = this.placaSalienteTemp();
        ruc = this.empresaBuscada()?.ruc || '';
        razon = this.empresaBuscada()?.razon_social || '';
        motivo = 'Retiro Voluntario';
      } else if (this.placaEntranteTemp()) {
        placa = this.placaEntranteTemp();
        ruc = this.empresaBuscada()?.ruc || '';
        razon = this.empresaBuscada()?.razon_social || '';
      }
    }

    const dialogRef = this.dialog.open(BajaExternaFormComponent, {
      width: '600px',
      data: {
        placa,
        ruc_empresa: ruc,
        razon_social: razon,
        motivo,
        observaciones: `Notificación preventiva MTC registrada durante proceso de Sustitución en DRTC Puno.`
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res && parIndex !== undefined) {
        this.paresSustitucion.update(pares => {
          const copia = [...pares];
          copia[parIndex] = { ...copia[parIndex], baja_externa_registrada: true };
          return copia;
        });
        this.snackBar.open('✓ Notificación MTC registrada exitosamente para ' + placa, 'OK', { duration: 3500 });
      }
    });
  }

  eliminarVehiculoNuevo(index: number) {
    this.vehiculosNuevos.update(v => v.filter((_, i) => i !== index));
  }

  eliminarParSustitucion(index: number) {
    this.paresSustitucion.update(p => p.filter((_, i) => i !== index));
  }

  toggleSeleccionBaja(placa: string) {
    this.vehiculosBajaSeleccionados.update(list => {
      if (list.includes(placa)) {
        return list.filter(p => p !== placa);
      } else {
        return [...list, placa];
      }
    });
  }

  isBajaSeleccionada(placa: string): boolean {
    return this.vehiculosBajaSeleccionados().includes(placa);
  }

  toggleTodosBajas() {
    const todos = this.vehiculosEnResolucion().map(v => v.placa);
    if (this.vehiculosBajaSeleccionados().length === todos.length) {
      this.vehiculosBajaSeleccionados.set([]);
    } else {
      this.vehiculosBajaSeleccionados.set([...todos]);
    }
  }

  toggleSeleccionTramite(placa: string) {
    this.vehiculosTramiteSeleccionados.update(list => {
      if (list.includes(placa)) {
        return list.filter(p => p !== placa);
      } else {
        return [...list, placa];
      }
    });
  }

  isTramiteSeleccionado(placa: string): boolean {
    return this.vehiculosTramiteSeleccionados().includes(placa);
  }

  // MÉTODOS PARA EL FLUJO MAESTRO DE RENOVACIÓN
  normalizarResolucionTexto(raw: string, fechaEmision?: string | null): string {
    if (!raw) return '';
    let str = raw.trim().toUpperCase();

    // Si ya coincide exactamente con R-0123-2026
    if (/^R-\d{4}-\d{4}$/.test(str)) {
      return str;
    }

    // Extraer año si existe (4 dígitos 19XX o 20XX)
    let anio = '';
    const anioMatch = str.match(/\b(19\d{2}|20\d{2})\b/);
    if (anioMatch) {
      anio = anioMatch[1];
      // Remover el año temporalmente para aislar el número correlativo
      str = str.replace(anioMatch[1], '');
    } else if (fechaEmision && fechaEmision.length >= 4) {
      anio = fechaEmision.substring(0, 4);
    } else {
      anio = String(new Date().getFullYear());
    }

    // Extraer el número correlativo
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      const padNum = numMatch[1].padStart(4, '0');
      return `R-${padNum}-${anio}`;
    }

    return raw.trim().toUpperCase();
  }

  normalizarNuevaResolucion() {
    const ctrl = this.renovacionForm.get('nueva_resolucion_primigenia');
    const fecha = this.renovacionForm.get('nueva_fecha_emision')?.value;
    if (ctrl && ctrl.value) {
      const normalizado = this.normalizarResolucionTexto(ctrl.value, fecha);
      if (normalizado && normalizado !== ctrl.value) {
        ctrl.setValue(normalizado);
      }
    }
  }

  toggleColapsoVigencia() {
    this.grupoVigenciaColapsado.update(v => !v);
  }

  toggleColapsoRutas() {
    this.grupoRutasColapsado.update(v => !v);
  }

  toggleColapsoFlota() {
    this.grupoFlotaColapsado.update(v => !v);
  }

  setVigenciaRenovacion(anios: number) {
    this.duracionAniosRenovacion.set(anios);
    const inicio = this.renovacionForm.get('nueva_fecha_inicio_vigencia')?.value;
    if (inicio) {
      const partes = inicio.split('-');
      if (partes.length === 3) {
        const y = parseInt(partes[0], 10) + anios;
        const m = partes[1];
        const d = partes[2];
        this.renovacionForm.patchValue({
          nueva_fecha_fin_vigencia: `${y}-${m}-${d}`
        });
      }
    }
  }

  cargarRutasEmpresa(ruc: string, resolucionId?: string | null) {
    this.cargandoRutas.set(true);
    this.flotaService.getRutasEmpresa(ruc).subscribe({
      next: (res) => {
        this.cargandoRutas.set(false);
        const todas = res.data || [];
        this.rutasEmpresaActual.set(todas);

        let seleccionadas: string[] = [];
        if (resolucionId) {
          const resNorm = resolucionId.replace(/^R-/i, '').trim().toLowerCase();
          const filtradas = todas.filter(r => {
            const rNro = ((r.resolucion?.nroResolucion || r.nro_resolucion || '').replace(/^R-/i, '')).trim().toLowerCase();
            return rNro === resNorm || rNro.includes(resNorm) || resNorm.includes(rNro);
          });
          if (filtradas.length > 0) {
            seleccionadas = filtradas.map(r => r.codigoRuta || r.codigo).filter(Boolean);
          }
        }
        if (seleccionadas.length === 0 && todas.length > 0) {
          seleccionadas = todas.map(r => r.codigoRuta || r.codigo).filter(Boolean);
        }
        this.rutasSeleccionadasRenovacion.set(seleccionadas);
      },
      error: (err) => {
        this.cargandoRutas.set(false);
        console.warn('Error cargando rutas de la empresa:', err);
        this.rutasEmpresaActual.set([]);
        this.rutasSeleccionadasRenovacion.set([]);
      }
    });
  }

  toggleRutaRenovacion(codigo: string) {
    this.rutasSeleccionadasRenovacion.update(list =>
      list.includes(codigo) ? list.filter(c => c !== codigo) : [...list, codigo]
    );
  }

  isRutaRenovacionSeleccionada(codigo: string): boolean {
    return this.rutasSeleccionadasRenovacion().includes(codigo);
  }

  formatearItinerario(itinerario: any): string {
    if (!itinerario) return '';
    if (typeof itinerario === 'string') {
      if (itinerario.includes('[object Object]') || itinerario.includes('[OBJECT OBJECT]')) return '';
      return itinerario;
    }
    if (Array.isArray(itinerario)) {
      return itinerario
        .map((item: any) => {
          if (!item) return '';
          if (typeof item === 'string') {
            if (item.includes('[object Object]') || item.includes('[OBJECT OBJECT]')) return '';
            return item;
          }
          if (typeof item === 'object') {
            return item.punto || item.nombre || item.localidad || item.distrito || item.descripcion || '';
          }
          return String(item);
        })
        .filter(Boolean)
        .join(' - ');
    }
    return String(itinerario);
  }

  seleccionarTodasRutasRenovacion(seleccionar: boolean) {
    if (seleccionar) {
      const cods = this.rutasEmpresaActual().map(r => r.codigoRuta || r.codigo).filter(Boolean);
      this.rutasSeleccionadasRenovacion.set(cods);
    } else {
      this.rutasSeleccionadasRenovacion.set([]);
    }
  }

  abrirModalEditarRuta(ruta: any, index: number) {
    const rutaParaEditar = {
      ...ruta,
      itinerario: this.formatearItinerario(ruta.itinerario)
    };
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '520px',
      data: { ruta: rutaParaEditar, isNew: false }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const codOriginal = ruta.codigoRuta || ruta.codigo;
        const nuevoCod = res.codigoRuta;
        
        // Actualizar en rutasEmpresaActual
        this.rutasEmpresaActual.update(rutas =>
          rutas.map((r, i) => i === index ? { ...r, ...res } : r)
        );

        // Si cambió el código, actualizar en rutasSeleccionadasRenovacion
        this.rutasSeleccionadasRenovacion.update(sel => {
          if (sel.includes(codOriginal)) {
            return sel.map(c => c === codOriginal ? nuevoCod : c);
          } else {
            return [...sel, nuevoCod];
          }
        });

        this.snackBar.open(`✓ Ruta ${nuevoCod} actualizada`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarRutaRenovacion(ruta: any, index: number) {
    const cod = ruta.codigoRuta || ruta.codigo;
    if (confirm(`¿Está seguro de quitar la Ruta ${cod} de esta renovación? No será ratificada ni clonada para la nueva resolución.`)) {
      this.rutasEmpresaActual.update(rutas => rutas.filter((_, i) => i !== index));
      this.rutasSeleccionadasRenovacion.update(sel => sel.filter(c => c !== cod));
      this.snackBar.open(`Ruta ${cod} eliminada de la renovación`, 'Cerrar', { duration: 3000 });
    }
  }

  abrirModalNuevaRuta() {
    const dialogRef = this.dialog.open(RutaModalComponent, {
      width: '520px',
      data: { isNew: true }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const cod = res.codigoRuta;
        this.rutasEmpresaActual.update(rutas => [...rutas, res]);
        this.rutasSeleccionadasRenovacion.update(sel => [...sel, cod]);
        this.snackBar.open(`✓ Nueva Ruta ${cod} agregada`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  inicializarFlotaRenovacion(vehiculos: any[]) {
    const anioActual = new Date().getFullYear();
    const items = vehiculos.map((v, index) => {
      const anioFab = v.anio_fabricacion || v.anio || null;
      const edad = anioFab ? (anioActual - anioFab) : 0;
      return {
        ...v,
        orden: index + 1,
        seleccionado: true,
        placa: v.placa,
        marca: v.marca || '',
        modelo: v.modelo || '',
        anio_fabricacion: anioFab,
        categoria: v.categoria || 'M2',
        asientos: v.asientos || v.numero_asientos || null,
        numero_asientos: v.numero_asientos || v.asientos || null,
        peso_neto: v.peso_neto || v.peso_seco || null,
        peso_seco: v.peso_seco || v.peso_neto || null,
        numero_tuc: v.numero_tuc || '',
        rutas: Array.isArray(v.rutas) ? [...v.rutas] : (v.rutas ? [v.rutas] : []),
        edad: edad,
        alerta_antiguedad: edad >= 15,
        datos_verificados: !!(v.marca && v.modelo && anioFab)
      };
    });
    this.vehiculosRenovacionLista.set(items);
  }

  setModoCargaVehiculos(modo: 'PRECARGADA' | 'MULTIFILA') {
    this.modoCargaVehiculosRenovacion.set(modo);
  }

  onLineasExcelChange(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.lineasExcelInput.set(val);
  }

  procesarLineasExcelRenovacion() {
    const texto = this.lineasExcelInput().trim();
    if (!texto) {
      this.snackBar.open('Pegue las líneas de placas desde Excel', 'Cerrar', { duration: 3000 });
      return;
    }

    this.procesandoLineasExcel.set(true);
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const anioActual = new Date().getFullYear();
    const nuevosVehiculos: any[] = [];
    const anterioresMap = new Map<string, any>();
    for (const v of this.vehiculosEnResolucion()) {
      if (v.placa) anterioresMap.set(v.placa.replace(/[\s-]/g, '').toUpperCase(), v);
    }

    let ordenContador = 1;
    for (const linea of lineas) {
      const tokens = linea.split(/[\t\s]+/).filter(t => t.trim().length > 0);
      if (tokens.length === 0) continue;

      let placaToken = '';
      let rutasTokens: string[] = [];

      let placaIdx = tokens.findIndex(t => /^[A-Z0-9]{3}-?[A-Z0-9]{3}$/i.test(t));
      if (placaIdx !== -1) {
        placaToken = tokens[placaIdx];
        const resto = tokens.filter((_, idx) => idx !== placaIdx);
        rutasTokens = resto.join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
      } else {
        if (/^\d+$/.test(tokens[0]) && tokens.length > 1) {
          placaToken = tokens[1];
          rutasTokens = tokens.slice(2).join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
        } else {
          placaToken = tokens[0];
          rutasTokens = tokens.slice(1).join(',').split(',').map(r => r.trim()).filter(r => r.length > 0);
        }
      }

      let cleanPlaca = placaToken.replace(/[\s-]/g, '').toUpperCase();
      if (cleanPlaca.length === 6) {
        cleanPlaca = `${cleanPlaca.substring(0, 3)}-${cleanPlaca.substring(3)}`;
      }

      const cleanRutas = rutasTokens.map(r => {
        const num = r.replace(/\D/g, '');
        return num.length === 1 ? `0${num}` : r.toUpperCase();
      });

      const rawKey = cleanPlaca.replace(/[\s-]/g, '');
      const anterior = anterioresMap.get(rawKey);

      const anioFab = anterior?.anio_fabricacion || anterior?.anio || null;
      const edad = anioFab ? (anioActual - anioFab) : 0;

      const itemVehiculo: any = {
        orden: ordenContador++,
        seleccionado: true,
        placa: cleanPlaca,
        marca: anterior?.marca || '',
        modelo: anterior?.modelo || '',
        anio_fabricacion: anioFab,
        categoria: anterior?.categoria || 'M2',
        asientos: anterior?.asientos || null,
        peso_neto: anterior?.peso_neto || null,
        numero_tuc: anterior?.numero_tuc || '',
        rutas: cleanRutas.length > 0 ? cleanRutas : (anterior?.rutas || []),
        edad: edad,
        alerta_antiguedad: edad >= 15,
        datos_verificados: !!(anterior?.marca && anterior?.modelo && anioFab)
      };

      nuevosVehiculos.push(itemVehiculo);
    }

    this.vehiculosRenovacionLista.set(nuevosVehiculos);
    this.procesandoLineasExcel.set(false);
    this.snackBar.open(`✓ ${nuevosVehiculos.length} vehículos procesados con éxito`, 'Entendido', { duration: 4000 });

    // Enriquecer en segundo plano los que falten datos técnicos
    for (const v of nuevosVehiculos) {
      if (!v.marca || !v.anio_fabricacion) {
        this.vehiculoDataService.getVehiculoDataByPlaca(v.placa).subscribe({
          next: (res) => {
            if (res && res.success && res.data) {
              const d = res.data;
              this.vehiculosRenovacionLista.update(lista =>
                lista.map(item => {
                  if (item.placa === v.placa) {
                    const aFab = d.anio_fabricacion || d.anio_modelo || d.ano_fabricacion || item.anio_fabricacion;
                    const ed = aFab ? (anioActual - aFab) : 0;
                    return {
                      ...item,
                      marca: d.marca || item.marca,
                      modelo: d.modelo || item.modelo,
                      anio_fabricacion: aFab,
                      categoria: d.categoria || item.categoria,
                      asientos: d.numero_asientos || d.asientos || item.asientos,
                      peso_neto: d.peso_neto || item.peso_neto,
                      edad: ed,
                      alerta_antiguedad: ed >= 15,
                      datos_verificados: true
                    };
                  }
                  return item;
                })
              );
            }
          }
        });
      }
    }
  }

  abrirVerificacionTecnica(v: any, index: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '820px',
      data: {
        vehiculo: v,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        const anioActual = new Date().getFullYear();
        const aFab = res.anio_fabricacion || null;
        const edad = aFab ? (anioActual - aFab) : 0;
        this.vehiculosRenovacionLista.update(lista =>
          lista.map((item, i) => {
            if (i === index) {
              return {
                ...item,
                ...res,
                marca: res.marca || item.marca,
                modelo: res.modelo || item.modelo,
                anio_fabricacion: aFab,
                categoria: res.categoria || item.categoria,
                asientos: res.asientos || res.numero_asientos || item.asientos,
                numero_asientos: res.numero_asientos || res.asientos || item.numero_asientos,
                peso_neto: res.peso_neto || res.peso_seco || item.peso_neto,
                peso_seco: res.peso_seco || res.peso_neto || item.peso_seco,
                numero_tuc: res.numero_tuc || item.numero_tuc,
                edad: edad,
                alerta_antiguedad: edad >= 15,
                datos_verificados: true
              };
            }
            return item;
          })
        );
        this.snackBar.open(`✓ Ficha técnica actualizada para ${v.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  cambiarOrdenVehiculo(index: number, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) {
      this.vehiculosRenovacionLista.update(lista =>
        lista.map((item, i) => i === index ? { ...item, orden: val } : item)
      );
    }
  }

  toggleVehiculoRenovacion(index: number) {
    this.vehiculosRenovacionLista.update(lista =>
      lista.map((item, i) => i === index ? { ...item, seleccionado: !item.seleccionado } : item)
    );
  }

  toggleTodosVehiculosRenovacion(seleccionar?: boolean) {
    this.vehiculosRenovacionLista.update(lista => {
      const target = seleccionar !== undefined ? seleccionar : !lista.every(v => v.seleccionado);
      return lista.map(v => ({ ...v, seleccionado: target }));
    });
  }

  estanTodosVehiculosRenovacionSeleccionados(): boolean {
    const list = this.vehiculosRenovacionLista();
    return list.length > 0 && list.every(v => v.seleccionado);
  }

  vehiculosRenovacionSeleccionadosCount(): number {
    return this.vehiculosRenovacionLista().filter(v => v.seleccionado).length;
  }

  cambiarTipoOrigen() {
    let current = this.datosOrigenForm.get('numero_origen')?.value;
    if (current && current.includes('-')) {
      const parts = current.split('-');
      if (parts.length === 3) {
        const num = parts[1];
        const anio = parts[2];
        const tipo = this.datosOrigenForm.get('tipo_origen')?.value;
        let prefijo = 'E';
        if (tipo === 'OFICIO') prefijo = 'O';
        if (tipo === 'MEMORANDUM') prefijo = 'M';
        this.datosOrigenForm.get('numero_origen')?.setValue(`${prefijo}-${num}-${anio}`);
      }
    }
  }

  normalizarNumero() {
    let num = this.datosOrigenForm.get('numero_origen')?.value;
    if (!num || num.includes('-')) return;

    const numPadded = num.toString().padStart(4, '0');
    const anio = new Date().getFullYear();
    const tipo = this.datosOrigenForm.get('tipo_origen')?.value;
    
    let prefijo = 'E';
    if (tipo === 'OFICIO') prefijo = 'O';
    if (tipo === 'MEMORANDUM') prefijo = 'M';

    this.datosOrigenForm.get('numero_origen')?.setValue(`${prefijo}-${numPadded}-${anio}`);
  }

  normalizarResolucionHija() {
    let num = this.datosOrigenForm.get('nro_resolucion_hija')?.value;
    if (!num) return;

    num = num.trim().toUpperCase();
    if (num.startsWith('R-')) {
      this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(num);
      return;
    }

    const anio = new Date().getFullYear();
    if (/^\d{1,4}$/.test(num)) {
      this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(`R-${num.padStart(4, '0')}-${anio}`);
    } else if (/^\d{1,4}-\d{4}$/.test(num)) {
      const [n, a] = num.split('-');
      this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(`R-${n.padStart(4, '0')}-${a}`);
    }
  }

  confirmar() {
    const emp = this.empresaBuscada();
    const tipo = this.tramiteSeleccionado();
    const resPrimigenia = this.resolucionForm.get('nro_resolucion_primigenia')?.value;

    if (!emp || !tipo || !resPrimigenia) {
      this.snackBar.open('Complete la información de empresa y resolución', 'Cerrar', { duration: 4000 });
      return;
    }

    const origenVal = this.datosOrigenForm.value;
    const esDeOficio = origenVal.tipo_origen === 'OFICIO';
    const docOrigen = origenVal.numero_origen || undefined;
    const nroHija = origenVal.nro_resolucion_hija?.trim() || undefined;
    const fechaRes = origenVal.fecha_emision_resolucion || undefined;

    let vehiculosItems: any[] = [];
    let payloadExtra: any = {};

    if (tipo === 'SUSTITUCION') {
      if (this.paresSustitucion().length === 0) {
        this.snackBar.open('Debe configurar al menos un par de sustitución', 'Cerrar', { duration: 4000 });
        return;
      }
      vehiculosItems = this.paresSustitucion().map(p => ({
        placa: p.placa_entrante,
        placa_saliente: p.placa_saliente,
        tipo_operacion: 'SUSTITUCION',
        numero_tuc: p.numero_tuc || undefined,
        dar_de_baja_otra_empresa: !!p.dar_de_baja_otra_empresa,
        datos_tecnicos: {
          marca: p.marca,
          modelo: p.modelo,
          anio_fabricacion: p.anio_fabricacion,
          categoria: p.categoria || 'M2',
          asientos: p.asientos || undefined,
          peso_neto: p.peso_neto || undefined
        }
      }));
    } else if (tipo === 'INCREMENTO') {
      if (this.vehiculosNuevos().length === 0) {
        this.snackBar.open('Debe agregar al menos un vehículo para incremento', 'Cerrar', { duration: 4000 });
        return;
      }
      vehiculosItems = this.vehiculosNuevos().map(v => ({
        placa: v.placa,
        tipo_operacion: 'INCREMENTO',
        numero_tuc: v.numero_tuc || undefined,
        datos_tecnicos: {
          marca: v.marca,
          modelo: v.modelo,
          anio_fabricacion: v.anio_fabricacion,
          categoria: v.categoria || 'M2',
          asientos: v.asientos || undefined,
          peso_neto: v.peso_neto || undefined
        }
      }));
    } else if (tipo === 'BAJAS') {
      if (this.vehiculosBajaSeleccionados().length === 0) {
        this.snackBar.open('Seleccione al menos un vehículo para dar de baja', 'Cerrar', { duration: 4000 });
        return;
      }
      const motivo = this.bajaForm.value.motivo_baja || 'BAJA SOLICITADA POR EMPRESA';
      vehiculosItems = this.vehiculosBajaSeleccionados().map(placa => ({
        placa: placa,
        tipo_operacion: 'BAJAS',
        observacion_custom: motivo
      }));
    } else if (tipo === 'RENOVACION') {
      if (this.renovacionForm.invalid) {
        this.snackBar.open('Complete los datos de la nueva resolución primigenia', 'Cerrar', { duration: 4000 });
        return;
      }
      const seleccionados = this.vehiculosRenovacionLista().filter(v => v.seleccionado);
      if (seleccionados.length === 0) {
        this.snackBar.open('Debe seleccionar o cargar al menos un vehículo para la renovación', 'Cerrar', { duration: 4000 });
        return;
      }

      vehiculosItems = seleccionados.map(v => ({
        placa: v.placa,
        orden: v.orden,
        rutas: v.rutas || [],
        numero_tuc: v.numero_tuc || undefined,
        tipo_operacion: 'RENOVACION',
        datos_tecnicos: {
          marca: v.marca,
          modelo: v.modelo,
          anio_fabricacion: v.anio_fabricacion,
          categoria: v.categoria || 'M2',
          asientos: v.asientos || v.numero_asientos || undefined,
          numero_asientos: v.numero_asientos || v.asientos || undefined,
          numero_pasajeros: v.numero_pasajeros || undefined,
          numero_ejes: v.numero_ejes || undefined,
          numero_ruedas: v.numero_ruedas || undefined,
          peso_bruto: v.peso_bruto || undefined,
          peso_neto: v.peso_neto || v.peso_seco || undefined,
          peso_seco: v.peso_seco || v.peso_neto || undefined,
          carga_util: v.carga_util || undefined,
          longitud: v.longitud || undefined,
          ancho: v.ancho || undefined,
          altura: v.altura || undefined,
          carroceria: v.carroceria || undefined,
          clase: v.clase || undefined,
          color: v.color || undefined,
          combustible: v.combustible || undefined,
          numero_motor: v.numero_motor || undefined,
          vin: v.vin || v.numero_serie || undefined,
          observaciones: v.observaciones || undefined
        }
      }));

      // Recolectar detalle de rutas ratificadas
      const rutasDetalle = this.rutasEmpresaActual()
        .filter(r => this.rutasSeleccionadasRenovacion().includes(r.codigoRuta || r.codigo))
        .map(r => ({
          codigo: (r.codigoRuta || r.codigo || '').toUpperCase().trim(),
          origen: (typeof r.origen === 'object' ? (r.origen?.nombre || '') : String(r.origen || '')).toUpperCase().trim(),
          destino: (typeof r.destino === 'object' ? (r.destino?.nombre || '') : String(r.destino || '')).toUpperCase().trim(),
          itinerario: (r.itinerario || '').toUpperCase().trim(),
          frecuencia: (typeof r.frecuencia === 'object' ? (r.frecuencia?.descripcion || '') : String(r.frecuencia || '')).toUpperCase().trim()
        }));

      payloadExtra = {
        es_renovacion: true,
        nueva_resolucion_primigenia: this.normalizarResolucionTexto(
          this.renovacionForm.value.nueva_resolucion_primigenia || '',
          this.renovacionForm.value.nueva_fecha_emision
        ),
        nueva_fecha_emision: this.renovacionForm.value.nueva_fecha_emision,
        nueva_fecha_inicio_vigencia: this.renovacionForm.value.nueva_fecha_inicio_vigencia,
        nueva_fecha_fin_vigencia: this.renovacionForm.value.nueva_fecha_fin_vigencia,
        duracion_anios: this.duracionAniosRenovacion(),
        rutas_a_ratificar: this.rutasSeleccionadasRenovacion(),
        nuevas_rutas_detalle: rutasDetalle
      };
    } else if (tipo === 'DUPLICADO' || tipo === 'CANJE') {
      if (this.vehiculosTramiteSeleccionados().length === 0) {
        this.snackBar.open(`Seleccione al menos un vehículo para ${tipo}`, 'Cerrar', { duration: 4000 });
        return;
      }
      const motivo = this.duplicadoCanjeForm.value.motivo || 'DETERIORO';
      vehiculosItems = this.vehiculosTramiteSeleccionados().map(placa => ({
        placa: placa,
        tipo_operacion: tipo,
        observacion_custom: `${tipo}: ${motivo}`
      }));
    } else if (tipo === 'CANCELACION') {
      payloadExtra = {
        cancelacion_total: this.cancelacionForm.value.cancelacion_total ?? true
      };
    }

    const payload: TramiteMasivoRequest = {
      ruc: emp.ruc,
      razon_social: emp.razon_social,
      nro_resolucion_primigenia: resPrimigenia,
      tipo_tramite: tipo,
      es_de_oficio: esDeOficio,
      documento_origen: docOrigen,
      num_expediente: !esDeOficio ? docOrigen : undefined,
      fecha_expediente: origenVal.fecha_origen || undefined,
      nro_resolucion_hija: nroHija,
      tipo_resolucion_hija: nroHija ? (tipo === 'SUSTITUCION' ? 'S' : tipo === 'INCREMENTO' ? 'I' : tipo === 'RENOVACION' ? 'R' : 'M') : undefined,
      fecha_emision_resolucion: fechaRes,
      vehiculos: vehiculosItems,
      ...payloadExtra
    };

    this.isProcessing.set(true);

    this.flotaService.procesarTramiteMasivo(payload).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        const resHija = res?.nro_resolucion_hija ? ` - Resolución: ${res.nro_resolucion_hija}` : '';
        this.snackBar.open(`✓ Trámite de ${tipo} procesado exitosamente${resHija}`, 'Entendido', {
          duration: 6000
        });

        // Limpiar formularios y cerrar drawer
        this.vehiculosNuevos.set([]);
        this.paresSustitucion.set([]);
        this.vehiculosBajaSeleccionados.set([]);
        this.vehiculosTramiteSeleccionados.set([]);
        this.tramiteSeleccionado.set(null);
        this.datosOrigenForm.reset({ tipo_origen: 'EXPEDIENTE' });
        this.isDrawerOpen.set(false);
        this.pageIndex.set(0);

        // Recargar datos actualizados
        this.cargarVehiculosResolucion(resPrimigenia);
        this.cargarHistorialTramites();
        this.cargarCatalogoEmpresas();
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Error al procesar trámite masivo:', err);
        const msg = err.error?.detail || 'Error al procesar el trámite en el servidor';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 6000 });
      }
    });
  }
}
