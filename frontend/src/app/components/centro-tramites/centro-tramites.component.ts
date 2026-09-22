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
    MatTooltipModule,
    BajaExternaFormComponent
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

  columnasTabla = ['id', 'fecha', 'empresa', 'tipo', 'doc', 'vehiculos', 'estado', 'acciones'];

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

    // Auto-calcular 10 años de vigencia para renovación
    const hoy = new Date();
    const enDiezAnios = new Date(hoy.getFullYear() + 10, hoy.getMonth(), hoy.getDate());
    this.renovacionForm.patchValue({
      nueva_fecha_fin_vigencia: enDiezAnios.toISOString().substring(0, 10)
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
          if (r.fecha_resolucion) {
            const d = new Date(r.fecha_resolucion);
            if (!isNaN(d.getFullYear())) anio = d.getFullYear().toString();
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
            id: r.nro_resolucion || 'S/N',
            fecha: r.fecha_resolucion ? new Date(r.fecha_resolucion).toLocaleDateString('es-PE') : 'S/F',
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
            estado: r.esta_activo !== false ? 'PROCESADO' : 'INACTIVO'
          };
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
        this.vehiculosEnResolucion.set(res.data || []);
      },
      error: (err) => {
        console.error('Error al cargar vehículos', err);
        this.vehiculosEnResolucion.set([]);
      }
    });
  }

  cancelarTramite() {
    this.isDrawerOpen.set(false);
    this.empresaBuscada.set(null);
    this.tramiteSeleccionado.set(null);
    this.vehiculosNuevos.set([]);
    this.paresSustitucion.set([]);
    this.vehiculosBajaSeleccionados.set([]);
    this.vehiculosTramiteSeleccionados.set([]);
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
    if (this.stepper) {
      this.stepper.next();
    }
  }

  puedeAvanzar(stepIndex: number): boolean {
    if (stepIndex === 0) {
      return !!this.empresaBuscada() && !!this.tramiteSeleccionado();
    }
    if (stepIndex === 1) {
      return !!this.resolucionForm.get('nro_resolucion_primigenia')?.value;
    }
    if (stepIndex === 2) {
      const t = this.tramiteSeleccionado();
      if (t === 'SUSTITUCION') return this.paresSustitucion().length > 0;
      if (t === 'INCREMENTO') return this.vehiculosNuevos().length > 0;
      if (t === 'BAJAS') return this.vehiculosBajaSeleccionados().length > 0;
      if (t === 'RENOVACION') return this.renovacionForm.valid;
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
      payloadExtra = {
        es_renovacion: true,
        nueva_resolucion_primigenia: this.renovacionForm.value.nueva_resolucion_primigenia?.toUpperCase().trim(),
        nueva_fecha_emision: this.renovacionForm.value.nueva_fecha_emision,
        nueva_fecha_inicio_vigencia: this.renovacionForm.value.nueva_fecha_inicio_vigencia,
        nueva_fecha_fin_vigencia: this.renovacionForm.value.nueva_fecha_fin_vigencia
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
        this.snackBar.open(`✓ Trámite de ${tipo} procesado exitosamente`, 'Entendido', {
          duration: 5000
        });

        // Limpiar formularios y cerrar drawer
        this.vehiculosNuevos.set([]);
        this.paresSustitucion.set([]);
        this.vehiculosBajaSeleccionados.set([]);
        this.vehiculosTramiteSeleccionados.set([]);
        this.tramiteSeleccionado.set(null);
        this.isDrawerOpen.set(false);

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
