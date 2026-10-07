import { Component, inject, signal, computed, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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
import { ResolucionPrimigeniaService } from '../../services/resolucion-primigenia.service';
import { BusquedaGlobalService } from '../../services/busqueda-global.service';
import { VehiculoDataService } from '../../services/vehiculo-data.service';
import { TucService } from '../../services/tuc.service';
import { ExpedienteService } from '../../services/expediente.service';
import { VehiculoModalComponent, calcularCompletitudVehiculo, enriquecerFichaTecnica } from './vehiculo-modal.component';
import { RutaModalComponent } from './ruta-modal.component';
import { SustitucionModalComponent } from './sustitucion-modal.component';
import { BajaExternaFormComponent } from '../bajas-externas/baja-externa-form/baja-externa-form.component';
import { RenovacionTucModalComponent } from './renovacion-tuc-modal.component';
import { EditarTramiteModalComponent } from './editar-tramite-modal.component';
import { TramiteAdministrativoService, TramiteAdministrativoPayload } from '../../services/tramite-administrativo.service';
import { environment } from '../../../environments/environment';

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
  private tucService = inject(TucService);
  private tramiteAdminService = inject(TramiteAdministrativoService);
  private resolucionPrimigeniaService = inject(ResolucionPrimigeniaService);
  private expedienteService = inject(ExpedienteService);

  // Advertencias de duplicados en Paso 2
  advertenciaExpediente = signal<{ mensaje: string; detalle?: string } | null>(null);
  verificandoExpediente = signal<boolean>(false);
  advertenciaResolucion = signal<{ mensaje: string; detalle?: string } | null>(null);
  verificandoResolucion = signal<boolean>(false);
  advertenciaRenovacionResolucion = signal<{ mensaje: string; detalle?: string } | null>(null);

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
  tucsDuplicadoCanje = signal<Record<string, string>>({});
  rutasDuplicadoCanje = signal<Record<string, string[]>>({});
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
  tablaFlotaExpandidaPaso3 = signal<boolean>(false);
  tablaFlotaExpandidaPaso4 = signal<boolean>(false);

  modalFlotaPantallaCompleta = signal<boolean>(false);
  filtroFlotaModal = signal<string>('');
  rutasSeleccionadasMasivas = signal<string[]>([]);
  vehiculosMarcadosModal = signal<string[]>([]);

  abrirModalFlotaCompleta() {
    this.modalFlotaPantallaCompleta.set(true);
  }

  cerrarModalFlotaCompleta() {
    this.modalFlotaPantallaCompleta.set(false);
    this.filtroFlotaModal.set('');
    this.vehiculosMarcadosModal.set([]);
  }

  vehiculosModalFiltrados = computed(() => {
    const list = this.vehiculosRenovacionLista().filter(v => v.seleccionado);
    const q = this.filtroFlotaModal().trim().toUpperCase();
    if (!q) return list;
    return list.filter(v =>
      (v.placa && v.placa.toUpperCase().includes(q)) ||
      (v.marca && v.marca.toUpperCase().includes(q)) ||
      (v.numero_tuc && v.numero_tuc.toUpperCase().includes(q))
    );
  });

  rutasOpciones = computed(() => {
    const rutas = this.rutasEmpresaActual();
    if (rutas && rutas.length > 0) {
      return rutas.map(r => {
        const cod = String(r.codigoRuta || r.codigo || '01').trim();
        const orig = this.formatearLugar(r.origen);
        const dest = this.formatearLugar(r.destino);
        return {
          codigo: cod,
          label: orig && dest ? `Ruta ${cod}: ${orig} ➔ ${dest}` : `Ruta ${cod}`
        };
      });
    }
    const ratificadas = this.rutasSeleccionadasRenovacion();
    if (ratificadas && ratificadas.length > 0) {
      return ratificadas.map(cod => ({
        codigo: cod,
        label: `Ruta ${cod}`
      }));
    }
    return [{ codigo: '01', label: 'Ruta 01' }];
  });

  proyeccionArticulo68_1 = computed(() => {
    const tipo = this.tramiteSeleccionado();
    const emp = this.empresaBuscada();
    const razon = emp?.razon_social || 'la empresa solicitante';
    const ruc = emp?.ruc || '';

    const partes: string[] = [];

    if (tipo === 'SUSTITUCION') {
      const salientes = this.paresSustitucion().map(p => p.placa_saliente).filter(Boolean);
      if (salientes.length > 0) {
        partes.push(`Disponer la baja y desafectación de la flota vehicular autorizada de "${razon}" (RUC: ${ruc}) de la(s) unidad(es) saliente(s) con placa(s): ${salientes.join(', ')}`);
      }
      this.paresSustitucion().forEach(p => {
        if (p.dar_de_baja_otra_empresa && (p.otra_empresa_razon || p.otra_empresa_info)) {
          const empOrig = p.otra_empresa_razon || p.otra_empresa_info;
          const rucOrig = p.otra_empresa_ruc ? ` (RUC: ${p.otra_empresa_ruc})` : '';
          partes.push(`Disponer la desafectación y baja de la flota de la empresa "${empOrig}"${rucOrig} de la unidad entrante con placa ${p.placa_entrante}`);
        } else if (p.baja_externa_registrada) {
          partes.push(`Tener por acreditada y registrar la baja previa de la unidad con placa ${p.placa_entrante} en el ámbito nacional/externo`);
        }
      });
    } else if (tipo === 'INCREMENTO') {
      this.vehiculosNuevos().forEach(v => {
        if (v.es_misma_empresa && v.dar_de_baja_misma_empresa) {
          const resOrig = v.misma_empresa_resolucion ? ` (Resolución ${v.misma_empresa_resolucion})` : '';
          const tucOrig = v.misma_empresa_tuc ? ` e invalidar el TUC ${v.misma_empresa_tuc}` : ' e invalidar sus credenciales (TUC)';
          partes.push(`Disponer la baja y desafectación de la habilitación precedente en esta empresa${resOrig} de la unidad vehicular con placa ${v.placa}${tucOrig}, para su regularización e incorporación formal bajo la nueva resolución`);
        } else if (v.baja_tipo === 'INTERNA' || v.dar_de_baja_otra_empresa) {
          const empOrig = v.otra_empresa_razon || v.otra_empresa_info || 'Empresa anterior DRTC';
          const rucOrig = v.otra_empresa_ruc ? ` (RUC: ${v.otra_empresa_ruc})` : '';
          const resOrig = v.otra_empresa_resolucion ? ` (Resolución ${v.otra_empresa_resolucion})` : '';
          partes.push(`Disponer la desafectación y baja de la flota vehicular de la empresa "${empOrig}"${rucOrig}${resOrig} de la unidad vehicular con placa ${v.placa} e invalidar sus credenciales (TUC)`);
        }
        if ((v.baja_tipo === 'EXTERNA' || v.incluir_baja_externa) && v.baja_externa) {
          const empExt = v.baja_externa?.empresa_origen || 'empresa externa titular';
          const rucExt = v.baja_externa?.ruc_empresa_origen ? ` (RUC ${v.baja_externa.ruc_empresa_origen})` : '';
          const resExt = v.baja_externa?.resolucion_baja ? ` según ${v.baja_externa.resolucion_baja}` : '';
          const amb = v.baja_externa?.ambito || 'MTC Nacional';
          partes.push(`Tener por acreditada la baja externa de la unidad con placa ${v.placa} de la empresa "${empExt}"${rucExt} en el ámbito ${amb}${resExt}, disponiendo cursar notificación formal mediante oficio a dicha entidad externa comunicando la habilitación regional otorgada en DRTC Puno`);
        }
      });
      if (partes.length === 0) {
        return 'No se registran vehículos con baja o desafectación previa requerida (Unidades de nuevo ingreso directo o primera habilitación).';
      }
    } else if (tipo === 'BAJAS') {
      const bajas = this.vehiculosBajaSeleccionados();
      if (bajas.length > 0) {
        partes.push(`Disponer la baja y desafectación de la flota vehicular de la empresa "${razon}" (RUC: ${ruc}) de la(s) unidad(es) con placa(s): ${bajas.join(', ')}`);
      }
    }

    return partes.length > 0 ? partes.join('; y ') + '.' : 'Sin afectaciones de baja previa.';
  });

  proyeccionArticulo68_2 = computed(() => {
    const tipo = this.tramiteSeleccionado();
    const emp = this.empresaBuscada();
    const razon = emp?.razon_social || 'la empresa solicitante';
    const ruc = emp?.ruc || '';

    let placas: string[] = [];
    if (tipo === 'SUSTITUCION') {
      placas = this.paresSustitucion().map(p => p.placa_entrante).filter(Boolean);
    } else if (tipo === 'INCREMENTO') {
      placas = this.vehiculosNuevos().map(v => v.placa).filter(Boolean);
    }

    if (placas.length > 0) {
      return `Disponer la afectación, habilitación e incorporación por concepto de ${tipo} a la flota vehicular autorizada de la empresa "${razon}" (RUC: ${ruc}) de la(s) unidad(es) vehicular(es) con placa(s): ${placas.join(', ')}.`;
    }
    return 'Pendiente de registrar unidades a incorporar.';
  });

  toggleMarcarVehiculo(placa: string) {
    this.vehiculosMarcadosModal.update(list =>
      list.includes(placa) ? list.filter(p => p !== placa) : [...list, placa]
    );
  }

  isVehiculoMarcadoModal(placa: string): boolean {
    return this.vehiculosMarcadosModal().includes(placa);
  }

  toggleMarcarTodosModal() {
    const todos = this.vehiculosModalFiltrados().map(v => v.placa);
    if (this.vehiculosMarcadosModal().length === todos.length) {
      this.vehiculosMarcadosModal.set([]);
    } else {
      this.vehiculosMarcadosModal.set([...todos]);
    }
  }

  estanTodosMarcadosModal(): boolean {
    const todos = this.vehiculosModalFiltrados();
    return todos.length > 0 && this.vehiculosMarcadosModal().length === todos.length;
  }

  actualizarRutasVehiculo(v: any, nuevasRutas: string[]) {
    const lista = this.vehiculosRenovacionLista();
    const idx = lista.findIndex(item => item.placa === v.placa);
    if (idx !== -1) {
      lista[idx] = { ...lista[idx], rutas: nuevasRutas };
      this.vehiculosRenovacionLista.set([...lista]);
    }
  }

  modalAsignarRutasAbierto = signal<boolean>(false);
  rutasSeleccionadasParaAsignar = signal<string[]>([]);

  abrirModalAsignarRutas() {
    if (this.rutasSeleccionadasParaAsignar().length === 0) {
      const opts = this.rutasOpciones().map(o => o.codigo);
      this.rutasSeleccionadasParaAsignar.set(opts);
    }
    this.modalAsignarRutasAbierto.set(true);
  }

  cerrarModalAsignarRutas() {
    this.modalAsignarRutasAbierto.set(false);
  }

  toggleRutaParaAsignar(codigo: string) {
    this.rutasSeleccionadasParaAsignar.update(list =>
      list.includes(codigo) ? list.filter(c => c !== codigo) : [...list, codigo]
    );
  }

  isRutaParaAsignarSeleccionada(codigo: string): boolean {
    return this.rutasSeleccionadasParaAsignar().includes(codigo);
  }

  seleccionarTodasRutasParaAsignar() {
    const todas = this.rutasOpciones().map(o => o.codigo);
    if (this.rutasSeleccionadasParaAsignar().length === todas.length) {
      this.rutasSeleccionadasParaAsignar.set([]);
    } else {
      this.rutasSeleccionadasParaAsignar.set([...todas]);
    }
  }

  confirmarAsignacionRutas() {
    const rutas = this.rutasSeleccionadasParaAsignar();
    if (!rutas || rutas.length === 0) {
      this.snackBar.open('Seleccione al menos una ruta para asignar', 'Cerrar', { duration: 3000 });
      return;
    }
    const marcados = this.vehiculosMarcadosModal();
    const hayMarcados = marcados.length > 0;
    const marcadosSet = new Set(marcados);

    const lista = this.vehiculosRenovacionLista();
    let asignadosCount = 0;
    const actualizados = lista.map(v => {
      if (hayMarcados) {
        if (marcadosSet.has(v.placa)) {
          asignadosCount++;
          return { ...v, rutas: [...rutas] };
        }
      } else {
        if (v.seleccionado) {
          asignadosCount++;
          return { ...v, rutas: [...rutas] };
        }
      }
      return v;
    });

    this.vehiculosRenovacionLista.set(actualizados);
    this.modalAsignarRutasAbierto.set(false);
    this.snackBar.open(
      `✓ Rutas [${rutas.join(', ')}] asignadas a ${asignadosCount} vehículo(s)`,
      'Entendido',
      { duration: 4000 }
    );
  }

  // Leyenda detallada de rutas ratificadas para el Paso 4
  rutasRatificadasDetalle = computed(() => {
    const seleccionadas = this.rutasSeleccionadasRenovacion();
    const todas = this.rutasEmpresaActual();
    if (!todas || todas.length === 0) {
      return seleccionadas.map(cod => ({
        codigoRuta: cod,
        origenTexto: 'Origen Autorizado',
        destinoTexto: 'Destino Autorizado',
        itinerarioTexto: '',
        frecuenciaTexto: ''
      }));
    }
    const filtradas = todas.filter(r => {
      const cod = String(r.codigoRuta || r.codigo || '').trim();
      return seleccionadas.includes(cod);
    });
    if (filtradas.length === 0) {
      return seleccionadas.map(cod => ({
        codigoRuta: cod,
        origenTexto: 'Origen Autorizado',
        destinoTexto: 'Destino Autorizado',
        itinerarioTexto: '',
        frecuenciaTexto: ''
      }));
    }
    return filtradas.map(r => ({
      ...r,
      codigoRuta: r.codigoRuta || r.codigo,
      origenTexto: this.formatearLugar(r.origen) || 'Origen',
      destinoTexto: this.formatearLugar(r.destino) || 'Destino',
      itinerarioTexto: this.formatearItinerario(r.itinerario),
      frecuenciaTexto: this.formatearFrecuencia(r.frecuencia)
    }));
  });

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
    { key: 'doc', label: 'Expediente', visible: true, fija: false },
    { key: 'vehiculos', label: 'Vehículos', visible: true, fija: false },
    { key: 'estado', label: 'Estado', visible: true, fija: false },
    { key: 'acciones', label: 'Acciones', visible: true, fija: true },
    { key: 'tipo', label: 'Tipo Trámite (Columna Sep.)', visible: false, fija: false }
  ];
  columnasVisibles = signal<Record<string, boolean>>(this._cargarColumnasGuardadas());
  mostrarConfigColumnas = signal<boolean>(false);


  // Detail panel (Detalle del Trámite y Flota Vehicular)
  tramiteDetalle = signal<any>(null);
  mostrarDetalle = signal<boolean>(false);
  cargandoVehiculosDetalle = signal<boolean>(false);
  vehiculosDetalle = signal<any[]>([]);
  filtroTipoVehiculoDetalle = signal<'TODOS' | 'INGRESANTES' | 'SALIENTES'>('TODOS');
  busquedaVehiculoDetalle = signal<string>('');

  vehiculosDetalleFiltrados = computed(() => {
    let list = this.vehiculosDetalle();
    const filtro = this.filtroTipoVehiculoDetalle();
    const query = this.busquedaVehiculoDetalle().trim().toLowerCase();

    if (filtro === 'INGRESANTES') {
      list = list.filter(v => !v.es_saliente);
    } else if (filtro === 'SALIENTES') {
      list = list.filter(v => v.es_saliente);
    }

    if (query) {
      list = list.filter(v => {
        const placa = (v.placa || '').toLowerCase();
        const tuc = (v.numero_tuc || '').toLowerCase();
        const marca = (v.marca || '').toLowerCase();
        const modelo = (v.modelo || '').toLowerCase();
        const cat = (v.categoria || '').toLowerCase();
        const anio = (v.anio_fabricacion || '').toString().toLowerCase();
        const carroceria = (v.carroceria || '').toLowerCase();
        const vin = (v.vin || '').toLowerCase();
        const motor = (v.motor || '').toLowerCase();
        const color = (v.color || '').toLowerCase();
        const comb = (v.combustible || '').toLowerCase();
        return placa.includes(query) || tuc.includes(query) || marca.includes(query) ||
               modelo.includes(query) || cat.includes(query) || anio.includes(query) ||
               carroceria.includes(query) || vin.includes(query) || motor.includes(query) ||
               color.includes(query) || comb.includes(query);
      });
    }

    return list;
  });

  totalVehiculosDetalle = computed(() => this.vehiculosDetalle().length);
  totalIngresantesDetalle = computed(() => this.vehiculosDetalle().filter(v => !v.es_saliente).length);
  totalSalientesDetalle = computed(() => this.vehiculosDetalle().filter(v => v.es_saliente).length);

  columnasTablaVisibles = computed(() => {
    const config = this.columnasVisibles();
    return this.todasColumnasDisponibles
      .filter(c => config[c.key] !== false)
      .map(c => c.key);
  });

  // Trámites de Flota Vehicular (con placas / TUCs)
  tiposTramiteFlota = [
    { id: 'AUTORIZACION', nombre: 'Autorización', icono: 'verified', desc: 'Autorización inicial de servicio' },
    { id: 'RENOVACION', nombre: 'Renovación', icono: 'autorenew', desc: 'Extensión de vigencia' },
    { id: 'SUSTITUCION', nombre: 'Sustitución', icono: 'sync_alt', desc: 'Reemplazo de unidad' },
    { id: 'INCREMENTO', nombre: 'Incremento', icono: 'trending_up', desc: 'Nuevas unidades' },
    { id: 'DUPLICADO', nombre: 'Duplicado', icono: 'file_copy', desc: 'Emisión de copia de TUC' },
    { id: 'CANJE', nombre: 'Canje', icono: 'change_circle', desc: 'Actualización de TUC' },
    { id: 'BAJAS', nombre: 'Bajas', icono: 'remove_circle', desc: 'Retiro definitivo' },
    { id: 'CANCELACION', nombre: 'Cancelación', icono: 'cancel', desc: 'Cese de autorización' }
  ];

  // Trámites Administrativos y Corporativos (sin placas / actos administrativos)
  tiposTramiteCorporativos = [
    { id: 'CAMBIO_REPRESENTANTE', nombre: 'Representante Legal', icono: 'badge', desc: 'Nuevo representante SUNARP' },
    { id: 'CAMBIO_DOMICILIO', nombre: 'Domicilio Legal', icono: 'location_on', desc: 'Actualizar sede de empresa' },
    { id: 'MODIFICACION_RUTA', nombre: 'Modificación de Ruta', icono: 'alt_route', desc: 'Variación de itinerario' },
    { id: 'MODIFICACION_FRECUENCIA', nombre: 'Modif. Frecuencia', icono: 'schedule', desc: 'Ajuste de salidas diarias' },
    { id: 'FE_DE_ERRATAS', nombre: 'Fe de Erratas', icono: 'spellcheck', desc: 'Rectificación resolutiva' },
    { id: 'REACTIVACION_JUDICIAL', nombre: 'Reactivación / Mandato Judicial', icono: 'gavel', desc: 'Rehabilitación por Mandato Judicial o R.D.' }
  ];

  tiposTramite = [
    ...this.tiposTramiteFlota,
    ...this.tiposTramiteCorporativos
  ];

  esTramiteSinPlacas = computed(() => {
    const t = this.tramiteSeleccionado();
    return t === 'CAMBIO_REPRESENTANTE' || 
           t === 'CAMBIO_DOMICILIO' || 
           t === 'MODIFICACION_RUTA' || 
           t === 'MODIFICACION_FRECUENCIA' || 
           t === 'FE_DE_ERRATAS' ||
           t === 'REACTIVACION_JUDICIAL';
  });

  esTramiteEmpresa = computed(() => {
    const t = this.tramiteSeleccionado();
    return t === 'CAMBIO_REPRESENTANTE' || t === 'CAMBIO_DOMICILIO' || t === 'REACTIVACION_JUDICIAL';
  });

  esTramiteConcesion = computed(() => {
    const t = this.tramiteSeleccionado();
    return t === 'MODIFICACION_RUTA' || t === 'MODIFICACION_FRECUENCIA' || t === 'FE_DE_ERRATAS';
  });

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

  tramiteAdminForm = this.fb.group({
    nuevo_representante: [''],
    nuevo_dni_representante: [''],
    partida_registral_representante: [''],
    asiento_registral: [''],
    nuevo_domicilio: [''],
    codigo_ruta: [''],
    nuevo_itinerario: [''],
    nueva_frecuencia: [''],
    articulo_fe_erratas: ['ARTICULO PRIMERO'],
    dice_texto: [''],
    debe_decir_texto: [''],
    sustento_observaciones: [''],
    tipo_reactivacion: ['MANDATO_JUDICIAL'],
    mandato_judicial_nro: [''],
    juzgado_origen: ['']
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
    let lista = this.vehiculosEnResolucion().filter(v => {
      const est = String(v.estado || '').toUpperCase();
      const activo = v.esta_activo !== false;
      const esApto = (est === 'HABILITADO' || !est) && activo && est !== 'SUSTITUIDO' && est !== 'BAJA' && est !== 'INHABILITADO';
      return esApto && !yaSustituidos.has(v.placa);
    });
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
    return this.vehiculosEnResolucion().filter(v => {
      const est = String(v.estado || '').toUpperCase();
      const activo = v.esta_activo !== false;
      return (est === 'HABILITADO' || !est) && activo && est !== 'SUSTITUIDO' && est !== 'BAJA' && est !== 'INHABILITADO' && !yaSustituidos.has(v.placa);
    });
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
        (item.expediente_numero && item.expediente_numero.toLowerCase().includes(txt)) ||
        (item.fecha_expediente_display && item.fecha_expediente_display.toLowerCase().includes(txt)) ||
        (item.tipoLabel && item.tipoLabel.toLowerCase().includes(txt)) ||
        (item.tipo && item.tipo.toLowerCase().includes(txt)) ||
        (item.placasTexto && item.placasTexto.toLowerCase().includes(txt)) ||
        (item.fecha && item.fecha.toLowerCase().includes(txt))
      );
    }

    if (tipo !== 'TODOS') {
      list = list.filter(item => 
        item.tipoRaw.includes(tipo) || 
        item.tipo.toUpperCase().includes(tipo) || 
        (item.tipoLabel && item.tipoLabel.toUpperCase().includes(tipo))
      );
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

    // Monitoreo reactivo de expediente y resolución para prevención de duplicados
    this.datosOrigenForm.get('numero_origen')?.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.validarExpedienteDuplicado();
      });

    this.datosOrigenForm.get('fecha_origen')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(fecha => {
        this.sincronizarAnioExpedienteConFecha(fecha);
      });

    this.datosOrigenForm.get('nro_resolucion_hija')?.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.validarResolucionDuplicada();
      });

    this.datosOrigenForm.get('fecha_emision_resolucion')?.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe(fecha => {
        this.sincronizarAnioResolucionConFecha(fecha);
      });

    this.renovacionForm.get('nueva_resolucion_primigenia')?.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.validarNuevaResolucionPrimigeniaDuplicada();
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

          // 1. Extraer año prioritariamente del número de resolución (Ej. R-0673-2019 -> 2019)
          if (r.nro_resolucion) {
            const m = r.nro_resolucion.match(/(19\d\d|20\d\d)/);
            if (m) anio = m[1];
          }

          // 2. Si hay fecha de resolución válida, usar su fecha y año de respaldo
          if (r.fecha_resolucion) {
            const d = new Date(r.fecha_resolucion);
            if (!isNaN(d.getFullYear())) {
              if (anio === 'S/A') anio = d.getFullYear().toString();
              fechaSort = d.toISOString();
            }
          } else if (anio !== 'S/A') {
            // Si no tiene fecha exacta pero sí año, ordenar cronológicamente por su año
            fechaSort = `${anio}-01-01T00:00:00.000Z`;
          }

          const placasIng: string[] = Array.isArray(r.vehiculos_ingresantes) ? r.vehiculos_ingresantes.filter(Boolean) : [];
          const placasSal: string[] = Array.isArray(r.vehiculos_salientes) ? r.vehiculos_salientes.filter(Boolean) : [];
          const todasPlacas = Array.from(new Set([...placasIng, ...placasSal]));
          const totalVehiculos = todasPlacas.length;
          const placaPrincipal = placasIng[0] || placasSal[0] || (todasPlacas[0] ?? null);
          const esSoloBaja = placasIng.length === 0 && placasSal.length > 0;

          const nroNorm = this.normalizarNumeroResolucion(r.nro_resolucion, r.fecha_resolucion || r.fecha_registro);
          let tipoActo = r.tipo_acto || r.tipo_tramite_origen || 'MODIFICACION';
          if ((r.nro_resolucion && r.nro_resolucion_primigenia && r.nro_resolucion === r.nro_resolucion_primigenia) || String(r.nro_resolucion || '').includes('0701')) {
            tipoActo = 'AUTORIZACION';
          }
          const infoTipo = this.obtenerInfoTipoTramite(tipoActo);

          // Expediente real: NO inventar resolución primigenia
          const expNumero = (r.expediente_numero && r.expediente_numero.trim() !== '') ? r.expediente_numero.trim() : null;
          let fechaExpDisplay: string | null = null;
          if (r.fecha_expediente) {
            const fe = new Date(r.fecha_expediente);
            if (!isNaN(fe.getTime())) {
              fechaExpDisplay = fe.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
          }

          const razon = r.razon_social || r.ruc_empresa || 'EMPRESA NO ESPECIFICADA';

          return {
            _id: r._id || r.id,
            correlativo: '', // se asigna después del sort
            id: nroNorm,
            nro_resolucion_raw: r.nro_resolucion || '',
            fecha: r.fecha_resolucion ? new Date(r.fecha_resolucion).toLocaleDateString('es-PE') : 'No consignada',
            fechaSort,
            anio,
            empresa: razon,
            ruc: r.ruc_empresa || '',
            tipoRaw: tipoActo.toUpperCase(),
            tipo: tipoActo.replace(/_/g, ' '),
            tipoLabel: infoTipo.label,
            tipoBadgeClass: infoTipo.badgeClass,
            doc: expNumero || '', // para compatibilidad
            expediente_numero: expNumero,
            fecha_expediente: r.fecha_expediente || null,
            fecha_expediente_display: fechaExpDisplay,
            nro_resolucion_primigenia: r.nro_resolucion_primigenia,
            placaPrincipal,
            totalVehiculos,
            esSoloBaja,
            placasIng,
            placasSal,
            placasTexto: todasPlacas.join(' '),
            estado: r.esta_activo !== false ? 'PROCESADO' : 'INACTIVO',
            // datos extra para detalle
            observaciones: r.observaciones || '',
            fecha_resolucion_raw: r.fecha_resolucion || null,
            fecha_inicio_efectos: r.fecha_inicio_efectos || null,
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

  normalizarNumeroResolucion(val?: string, fecha?: any): string {
    if (!val) return 'S/N';
    let s = val.trim().toUpperCase();
    if (!s || s === 'NAN' || s === 'NONE' || s === 'NULL' || s === '-' || s === 'TUC') return 'S/N';
    s = s.replace(/^(?:RESOLUCI[OÓ]N|RES\.|RES-|R\.|R\s+)/, 'R-');
    s = s.replace(/^(?:N[°º]|N-)\s*/, '');
    const m = s.match(/^(?:R[-.\s]*)?0*(\d{1,6})[-/.\s]+(\d{4})/);
    if (m) {
      return `R-${m[1].padStart(4, '0')}-${m[2]}`;
    }
    const m2 = s.match(/^(?:R[-.\s]*)?0*(\d{1,6})[-/.\s]+(\d{2})(?:[-/.]?.*)?$/);
    if (m2) {
      const anio = parseInt(m2[2], 10) < 50 ? '20' + m2[2] : '19' + m2[2];
      return `R-${m2[1].padStart(4, '0')}-${anio}`;
    }
    if (/^\d+$/.test(s) && fecha) {
      const d = new Date(fecha);
      if (!isNaN(d.getFullYear())) {
        return `R-${s.padStart(4, '0')}-${d.getFullYear()}`;
      }
    }
    if (/^\d/.test(s)) {
      return `R-${s}`;
    }
    return s;
  }

  obtenerInfoTipoTramite(tipoRaw: string): { label: string; badgeClass: string } {
    const t = (tipoRaw || '').toUpperCase();
    if (t.includes('AUTORIZAC')) {
      return { label: 'AUTORIZACIÓN', badgeClass: 'badge-tramite-autorizacion' };
    }
    if (t.includes('SUSTITUCION')) {
      return { label: 'SUSTITUCIÓN', badgeClass: 'badge-tramite-sustitucion' };
    }
    if (t.includes('INCREMENTO')) {
      return { label: 'INCREMENTO', badgeClass: 'badge-tramite-incremento' };
    }
    if (t.includes('RENOVACION')) {
      return { label: 'RENOVACIÓN', badgeClass: 'badge-tramite-renovacion' };
    }
    if (t.includes('MODIFICACION')) {
      return { label: 'MODIFICACIÓN RUTA', badgeClass: 'badge-tramite-modificacion' };
    }
    if (t.includes('CANCELACION') || t.includes('BAJA')) {
      return { label: 'CANCELACIÓN PARCIAL', badgeClass: 'badge-tramite-cancelacion' };
    }
    if (t.includes('ERRATA') || t.includes('FE_DE_ERRATAS')) {
      return { label: 'FE DE ERRATAS', badgeClass: 'badge-tramite-fe' };
    }
    if (t.includes('DUPLICADO')) {
      return { label: 'DUPLICADO', badgeClass: 'badge-tramite-duplicado' };
    }
    if (t.includes('CANJE')) {
      return { label: 'CANJE', badgeClass: 'badge-tramite-canje' };
    }
    if (t.includes('REPRESENTANTE')) {
      return { label: 'CAMBIO REP.', badgeClass: 'badge-tramite-otros' };
    }
    if (t.includes('SUSPENSION')) {
      return { label: 'SUSPENSIÓN', badgeClass: 'badge-tramite-cancelacion' };
    }
    return { label: (tipoRaw || 'MODIFICACIÓN').replace(/_/g, ' '), badgeClass: 'badge-tramite-otros' };
  }

  // COLUMN CONFIGURATION
  private _cargarColumnasGuardadas(): Record<string, boolean> {
    const defaults: Record<string, boolean> = {
      correlativo: true,
      id: true,
      fecha: true,
      empresa: true,
      doc: true,
      vehiculos: true,
      estado: true,
      acciones: true,
      tipo: false // Por defecto integrado bajo la resolución
    };
    try {
      const saved = localStorage.getItem('drtc_tramites_columnas_v2');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  }

  toggleColumna(key: string) {
    const col = this.todasColumnasDisponibles.find(c => c.key === key);
    if (col?.fija) return; // No se puede ocultar columna fija
    this.columnasVisibles.update(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('drtc_tramites_columnas_v2', JSON.stringify(updated)); } catch {}
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

  // DETAIL PANEL: DETALLE DEL TRÁMITE
  verDetalleTramite(tramite: any) {
    if (!tramite) return;
    this.tramiteDetalle.set(tramite);
    this.mostrarDetalle.set(true);
    this.filtroTipoVehiculoDetalle.set('TODOS');
    this.busquedaVehiculoDetalle.set('');
    this.vehiculosDetalle.set([]);
    this.cargandoVehiculosDetalle.set(true);

    const hijaId = tramite._id || tramite.id || tramite.nro_resolucion_raw;
    if (hijaId) {
      this.resolucionHijaService.getVehiculosDetalleTramite(hijaId).subscribe({
        next: (resp) => {
          this.cargandoVehiculosDetalle.set(false);
          if (resp && Array.isArray(resp.vehiculos) && resp.vehiculos.length > 0) {
            this.vehiculosDetalle.set(resp.vehiculos);
          } else {
            this.vehiculosDetalle.set(this._generarVehiculosFallback(tramite));
          }
        },
        error: (err) => {
          console.warn('Error al obtener vehículos detallados del trámite, usando fallback local:', err);
          this.cargandoVehiculosDetalle.set(false);
          this.vehiculosDetalle.set(this._generarVehiculosFallback(tramite));
        }
      });
    } else {
      this.cargandoVehiculosDetalle.set(false);
      this.vehiculosDetalle.set(this._generarVehiculosFallback(tramite));
    }
  }

  private _generarVehiculosFallback(tramite: any): any[] {
    const list: any[] = [];
    const tucs = Array.isArray(tramite.numeros_tuc) ? tramite.numeros_tuc : [];

    // Ingresantes
    const placasIng = Array.isArray(tramite.placasIng) ? tramite.placasIng : [];
    placasIng.forEach((placa: string, idx: number) => {
      list.push({
        placa: (placa || '').toUpperCase(),
        es_saliente: false,
        operacion: 'INGRESO / ALTA',
        numero_tuc: tucs[idx] || null,
        estado: 'AUTORIZADO',
        anio_fabricacion: null,
        categoria: null,
        marca: null,
        modelo: null,
        carroceria: null,
        vin: null,
        motor: null,
        color: null,
        asientos: null,
        pasajeros: null,
        combustible: null,
        peso_seco: null,
        peso_bruto: null,
        carga_util: null,
        rutas: Array.isArray(tramite.rutas_modificadas_ids) ? tramite.rutas_modificadas_ids.join(', ') : null
      });
    });

    // Salientes
    const placasSal = Array.isArray(tramite.placasSal) ? tramite.placasSal : [];
    placasSal.forEach((placa: string) => {
      list.push({
        placa: (placa || '').toUpperCase(),
        es_saliente: true,
        operacion: 'BAJA / SALIENTE',
        numero_tuc: null,
        estado: 'SALIENTE',
        anio_fabricacion: null,
        categoria: null,
        marca: null,
        modelo: null,
        carroceria: null,
        vin: null,
        motor: null,
        color: null,
        asientos: null,
        pasajeros: null,
        combustible: null,
        peso_seco: null,
        peso_bruto: null,
        carga_util: null,
        rutas: null
      });
    });

    return list;
  }

  cerrarDetalle() {
    this.mostrarDetalle.set(false);
    setTimeout(() => {
      this.tramiteDetalle.set(null);
      this.vehiculosDetalle.set([]);
      this.busquedaVehiculoDetalle.set('');
      this.filtroTipoVehiculoDetalle.set('TODOS');
    }, 300);
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

    const estadoNormalizado = (emp.estado || 'AUTORIZADA').toUpperCase();

    this.empresaBuscada.set({
      ruc: emp.ruc,
      razon_social: razonSocial,
      estado: estadoNormalizado,
      flota: emp.total_vehiculos || emp.flota || 0,
      vigencia: estadoNormalizado === 'CANCELADA' ? 'CANCELADA' : 'VIGENTE'
    });
    
    // Cargar resoluciones oficiales desde el servicio de resoluciones primigenias
    this.resolucionPrimigeniaService.getResolucionesByRuc(emp.ruc).subscribe({
      next: (resolucionesReales) => {
        if (resolucionesReales && resolucionesReales.length > 0) {
          const resAjustadas = resolucionesReales.map(r => {
            if (estadoNormalizado === 'CANCELADA' && r.estado === 'VIGENTE') {
              return { ...r, estado: 'CANCELADA' as any };
            }
            return r;
          });
          this.resoluciones.set(resAjustadas);
          if (resAjustadas.length === 1) {
            this.resolucionForm.patchValue({ nro_resolucion_primigenia: resAjustadas[0].nro_resolucion });
            this.resolucionSeleccionada.set(resAjustadas[0]);
            this.cargarVehiculosResolucion(resAjustadas[0].nro_resolucion);
          }
        } else {
          // Fallback a primigenias de flota
          const prims = emp.primigenias || [];
          const resolucionesMock = prims.map((p: string) => ({
            id: p,
            nro_resolucion: p,
            fecha_resolucion: new Date(),
            ruc_empresa: emp.ruc,
            estado: estadoNormalizado === 'CANCELADA' ? 'CANCELADA' : 'VIGENTE'
          }));
          this.resoluciones.set(resolucionesMock as any);
          if (resolucionesMock.length === 1) {
            this.resolucionForm.patchValue({ nro_resolucion_primigenia: resolucionesMock[0].nro_resolucion });
            this.resolucionSeleccionada.set(resolucionesMock[0] as any);
            this.cargarVehiculosResolucion(resolucionesMock[0].nro_resolucion);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando resoluciones primigenias:', err);
        const prims = emp.primigenias || [];
        const resolucionesMock = prims.map((p: string) => ({
          id: p,
          nro_resolucion: p,
          fecha_resolucion: new Date(),
          ruc_empresa: emp.ruc,
          estado: estadoNormalizado === 'CANCELADA' ? 'CANCELADA' : 'VIGENTE'
        }));
        this.resoluciones.set(resolucionesMock as any);
      }
    });

    // Escuchar cambios en la resolución para cargar vehículos y actualizar resolucionSeleccionada
    this.resolucionForm.get('nro_resolucion_primigenia')?.valueChanges.subscribe(res => {
      if (res) {
        this.cargarVehiculosResolucion(res);
        const resObj = this.resoluciones().find(r => r.nro_resolucion === res);
        this.resolucionSeleccionada.set(resObj || null);
      } else {
        this.resolucionSeleccionada.set(null);
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
    this.advertenciaExpediente.set(null);
    this.advertenciaResolucion.set(null);
    this.advertenciaRenovacionResolucion.set(null);
    this.datosOrigenForm.reset({ tipo_origen: 'EXPEDIENTE', numero_origen: '', nro_resolucion_hija: '' });
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
    if (this.tramiteSeleccionado() === 'RENOVACION' && this.pasoActual() === 2) {
      // Verificar si los vehículos tienen TUCs antiguas del padrón anterior o están vacías
      const tienenTucViejaOVacia = this.vehiculosRenovacionLista().some(v => 
        v.seleccionado && (!v.numero_tuc || v.numero_tuc === v.tuc_anterior || !v.numero_tuc.startsWith('TE-'))
      );
      if (tienenTucViejaOVacia) {
        this.generarTucsMasivos(false);
      }
    }
    if (this.tramiteSeleccionado() === 'INCREMENTO' && this.pasoActual() === 2) {
      const vehSinBaja = this.vehiculosNuevos().find(v => v.es_misma_empresa && !v.dar_de_baja_misma_empresa);
      if (vehSinBaja) {
        this.snackBar.open(
          `⛔ La unidad ${vehSinBaja.placa} ya está habilitada en esta empresa. Debe autorizar la baja de su habilitación previa para evitar doble habilitación o retirarla del trámite.`,
          'CORREGIR',
          { duration: 6000 }
        );
        return;
      }
    }
    if (this.stepper) {
      this.stepper.next();
    }
  }

  getEstadoResolucionLabel(estado: string | undefined): string {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'VIGENTE': return 'Vigente';
      case 'CANCELADA': return 'Cancelada';
      case 'INACTIVA': return 'Inactiva';
      case 'VENCIDA': return 'Vencida';
      case 'SUSPENDIDA': return 'Suspendida';
      case 'ANULADA': return 'Anulada';
      default: return est ? est : 'Inactiva';
    }
  }

  getEstadoResolucionColor(estado: string | undefined): string {
    const est = (estado || '').toUpperCase();
    switch (est) {
      case 'VIGENTE': return '#16a34a';
      case 'CANCELADA':
      case 'INACTIVA':
      case 'ANULADA': return '#e11d48';
      case 'VENCIDA': return '#d97706';
      case 'SUSPENDIDA': return '#ea580c';
      default: return '#64748b';
    }
  }

  esEmpresaCancelada = computed(() => {
    const emp = this.empresaBuscada();
    return (emp?.estado || '').toUpperCase() === 'CANCELADA';
  });

  esResolucionInactiva = computed(() => {
    const res = this.resolucionSeleccionada();
    if (!res) return false;
    const est = (res.estado || '').toUpperCase();
    const t = this.tramiteSeleccionado();
    // Para trámites de RENOVACIÓN, una resolución VENCIDA o VIGENTE es totalmente apta para renovar
    if (t === 'RENOVACION' && (est === 'VENCIDA' || est === 'VIGENTE')) {
      return false;
    }
    return est !== 'VIGENTE';
  });

  puedeAvanzar(stepIndex: number): boolean {
    if (stepIndex === 0) {
      if (!this.empresaBuscada() || !this.tramiteSeleccionado()) return false;
      const estadoEmpresa = (this.empresaBuscada()?.estado || '').toUpperCase();
      const esReactivacion = this.tramiteSeleccionado() === 'REACTIVACION_JUDICIAL';
      // Bloquear trámites ordinarios para empresas canceladas
      if ((estadoEmpresa === 'CANCELADA' || estadoEmpresa === 'INACTIVA') && !esReactivacion) {
        return false;
      }
      return true;
    }
    if (stepIndex === 1) {
      if (this.esTramiteEmpresa()) {
        return !!this.datosOrigenForm.get('nro_resolucion_hija')?.value;
      }
      const tieneResolucion = !!this.resolucionForm.get('nro_resolucion_primigenia')?.value;
      if (!tieneResolucion) return false;

      // Si la resolución seleccionada está inactiva o cancelada y no es reactivación judicial, bloquear
      const resObj = this.resolucionSeleccionada();
      const estadoRes = (resObj?.estado || '').toUpperCase();
      const esReactivacion = this.tramiteSeleccionado() === 'REACTIVACION_JUDICIAL';
      const esRenovacion = this.tramiteSeleccionado() === 'RENOVACION';

      if (estadoRes && estadoRes !== 'VIGENTE' && !esReactivacion) {
        // Para RENOVACION, se permite expresamente si la resolución está VENCIDA o VIGENTE
        if (esRenovacion && (estadoRes === 'VENCIDA' || estadoRes === 'VIGENTE')) {
          // Permitir avanzar con la renovación
        } else {
          return false;
        }
      }

      if (esRenovacion) {
        return tieneResolucion && this.renovacionForm.valid;
      }
      return tieneResolucion;
    }
    if (stepIndex === 2) {
      const t = this.tramiteSeleccionado();
      if (t === 'REACTIVACION_JUDICIAL') {
        return !!this.tramiteAdminForm.get('mandato_judicial_nro')?.value && !!this.tramiteAdminForm.get('sustento_observaciones')?.value;
      }
      if (t === 'CAMBIO_REPRESENTANTE') {
        return !!this.tramiteAdminForm.get('nuevo_representante')?.value && !!this.tramiteAdminForm.get('nuevo_dni_representante')?.value;
      }
      if (t === 'CAMBIO_DOMICILIO') {
        return !!this.tramiteAdminForm.get('nuevo_domicilio')?.value;
      }
      if (t === 'MODIFICACION_RUTA') {
        return !!this.tramiteAdminForm.get('nuevo_itinerario')?.value;
      }
      if (t === 'MODIFICACION_FRECUENCIA') {
        return !!this.tramiteAdminForm.get('nueva_frecuencia')?.value;
      }
      if (t === 'FE_DE_ERRATAS') {
        return !!this.tramiteAdminForm.get('debe_decir_texto')?.value;
      }
      if (t === 'SUSTITUCION') return this.paresSustitucion().length > 0;
      if (t === 'INCREMENTO') {
        if (this.vehiculosNuevos().length === 0) return false;
        const tieneDobleHabilitacionSinBaja = this.vehiculosNuevos().some(
          v => v.es_misma_empresa && !v.dar_de_baja_misma_empresa
        );
        return !tieneDobleHabilitacionSinBaja;
      }
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
    const vObj = typeof vehiculo === 'object' ? vehiculo : this.vehiculosEnResolucion().find(v => v.placa === placa);
    if (vObj) {
      const est = String(vObj.estado || '').toUpperCase();
      const activo = vObj.esta_activo !== false;
      if (['SUSTITUIDO', 'INHABILITADO', 'BAJA'].includes(est) || !activo) {
        this.snackBar.open(
          `⛔ La unidad ${placa} figura en estado "${est || 'INACTIVO'}". Ya fue sustituida o dada de baja; no puede ser sustituida dos veces.`,
          'Cerrar',
          { duration: 5000 }
        );
        this.placaSalienteTemp.set('');
        this.filtroSalienteText.set('');
        this.datosTecnicosSaliente.set(null);
        return;
      }
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
    this.advertenciaExpediente.set(null);
    this.advertenciaResolucion.set(null);
    this.advertenciaRenovacionResolucion.set(null);
    this.datosOrigenForm.get('nro_resolucion_hija')?.setValue('');

    if (id === 'RENOVACION') {
      // Para renovación no aplica resolución hija/modificatoria
      const vList = this.vehiculosEnResolucion();
      if (vList.length > 0 && this.vehiculosRenovacionLista().length === 0) {
        this.inicializarFlotaRenovacion(vList);
      }
      const emp = this.empresaBuscada();
      const res = this.resolucionForm.get('nro_resolucion_primigenia')?.value;
      if (emp?.ruc) {
        this.cargarRutasEmpresa(emp.ruc, res || undefined);
      }
    } else {
      // En trámites regulares (Incremento, Sustitución, etc.), no se coloca resolución por defecto.
      // Debe ingresarse manualmente por el usuario.
    }
  }

  cargarSiguienteResolucionHija(tipo?: string) {
    const t = tipo || this.tramiteSeleccionado() || undefined;
    this.resolucionHijaService.getSiguienteNumero(t).subscribe({
      next: (res) => {
        if (res && res.siguiente_numero) {
          this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(res.siguiente_numero);
          this.validarResolucionDuplicada();
        }
      },
      error: (err) => console.warn('No se pudo precargar siguiente número correlativo:', err)
    });
  }

  abrirSelectorFecha(input: HTMLInputElement) {
    if (input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (e) {
        input.focus();
      }
    } else if (input) {
      input.focus();
    }
  }

  abrirModalVehiculo(vehiculoEdit?: any, index?: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '780px',
      maxWidth: '95vw',
      data: {
        vehiculo: vehiculoEdit || {},
        isEdit: !!vehiculoEdit
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (index !== undefined) {
          this.vehiculosNuevos.update(v => {
            const copia = [...v];
            copia[index] = {
              ...copia[index],
              ...result,
              rutas: copia[index].rutas || (result.rutas && result.rutas.length > 0 ? result.rutas : this.rutasOpciones().map(o => o.codigo)),
              numero_tuc: copia[index].numero_tuc || result.numero_tuc || ''
            };
            return copia;
          });
          this.snackBar.open(`✓ Ficha técnica actualizada para ${result.placa} (${result.porcentaje_completitud || 0}% datos)`, 'OK', { duration: 2500 });
        } else {
          const nuevoIdx = this.vehiculosNuevos().length;
          const rutasDefecto = this.rutasOpciones().map(o => o.codigo);
          const nuevoVehiculo = {
            ...result,
            rutas: (result.rutas && result.rutas.length > 0) ? result.rutas : rutasDefecto,
            numero_tuc: result.numero_tuc || '',
            baja_tipo: 'NINGUNA',
            dar_de_baja_otra_empresa: false,
            otra_empresa_ruc: '',
            otra_empresa_razon: '',
            otra_empresa_resolucion: '',
            otra_empresa_estado: '',
            otra_empresa_tuc: '',
            baja_interna_encontrada: false,
            baja_interna_verificada: false,
            buscando_baja_interna: false,
            mostrar_ingreso_manual_interna: false,
            baja_externa: null
          };
          this.vehiculosNuevos.update(v => [...v, nuevoVehiculo]);
          this.snackBar.open(`✓ Vehículo ${result.placa} agregado a la lista`, 'OK', { duration: 2500 });
          // Verificar automáticamente si esta unidad ya pertenece a otra empresa/resolución en DRTC Puno
          this.verificarBajaOtraEmpresaParaVehiculo(result.placa, nuevoIdx);
        }
      }
    });
  }

  verificarBajaOtraEmpresaParaVehiculo(placa: string, index: number) {
    if (!placa || placa.length < 5) return;
    const rucActual = this.empresaBuscada()?.ruc;

    // Normalizar placa para búsqueda regex flexible (acepta con o sin guion)
    const rawPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const placaConGuion = rawPlaca.length >= 6 ? `${rawPlaca.substring(0, 3)}-${rawPlaca.substring(3)}` : rawPlaca;
    const regexPattern = rawPlaca.length >= 6 ? `${rawPlaca.substring(0, 3)}-?${rawPlaca.substring(3)}` : rawPlaca;

    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          buscando_baja_interna: true
        };
      }
      return copia;
    });

    this.flotaService.getFlotaPaginada({ placa: regexPattern, limit: 30 }).subscribe({
      next: (res) => {
        const items = res?.data || [];
        // 1. Verificar si ya se encuentra habilitada en la MISMA empresa actual (Doble habilitación prohibida)
        const mismaEmpresaItems = items.filter((r: any) => r.ruc && r.ruc === rucActual && (r.estado === 'HABILITADO' || r.esta_activo !== false));

        if (mismaEmpresaItems.length > 0) {
          const matchMisma = mismaEmpresaItems[0];
          const resActual = matchMisma.nro_resolucion_hija || matchMisma.nro_resolucion_primigenia || 'Resolución Vigente';
          const tucActual = matchMisma.numero_tuc || '';
          const estadoActual = (matchMisma.estado || 'HABILITADO').toUpperCase();

          this.vehiculosNuevos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: true,
                misma_empresa_ruc: rucActual,
                misma_empresa_razon: matchMisma.razon_social || this.empresaBuscada()?.razon_social || 'Misma Empresa',
                misma_empresa_resolucion: resActual,
                misma_empresa_tuc: tucActual,
                misma_empresa_estado: estadoActual,
                dar_de_baja_misma_empresa: true,
                baja_tipo: 'INTERNA_MISMA_EMPRESA',
                baja_interna_encontrada: true,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });

          this.snackBar.open(
            `⚠️ ATENCIÓN: La unidad ${placaConGuion} ya está HABILITADA en esta empresa (Res. ${resActual}, TUC: ${tucActual || 'S/N'}). Se requiere dar de baja la habilitación anterior para regularizar (Doble Habilitación Prohibida).`,
            'ENTENDIDO',
            { duration: 7000 }
          );
          return;
        }

        // 2. Filtrar registros que pertenezcan a OTRA empresa de DRTC Puno
        const otrasEmpresas = items.filter((r: any) => r.ruc && r.ruc !== rucActual);

        if (otrasEmpresas.length > 0) {
          // Priorizar habilitados o activos
          otrasEmpresas.sort((a: any, b: any) => {
            const aActivo = a.estado === 'HABILITADO' || a.esta_activo !== false;
            const bActivo = b.estado === 'HABILITADO' || b.esta_activo !== false;
            if (aActivo && !bActivo) return -1;
            if (!aActivo && bActivo) return 1;
            return 0;
          });

          const match = otrasEmpresas[0];
          const resolucionDetectada = match.nro_resolucion_primigenia || match.nro_resolucion_hija || (match as any).resolucion_habilitacion || 'Resolución Registrada';
          const estadoDetectado = (match.estado || (match.esta_activo !== false ? 'HABILITADO' : 'INACTIVO')).toUpperCase();
          const resolucionesList = Array.from(new Set(otrasEmpresas.map((r: any) => r.nro_resolucion_primigenia || r.nro_resolucion_hija || (r as any).resolucion_habilitacion).filter(Boolean)));

          const estaHabilitadoEnOtra = estadoDetectado === 'HABILITADO';

          this.vehiculosNuevos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: false,
                dar_de_baja_misma_empresa: false,
                // Solo si está HABILITADO en otra empresa se configura Baja Interna obligatoria (Art. 68.1).
                // Si ya figura INHABILITADO en DRTC, queda en 'NINGUNA' (pues ya está desafectado)
                // y el usuario puede cambiar a 'EXTERNA' si tiene habilitación en el MTC.
                baja_tipo: estaHabilitadoEnOtra ? 'INTERNA' : 'NINGUNA',
                dar_de_baja_otra_empresa: estaHabilitadoEnOtra,
                otra_empresa_ruc: match.ruc,
                otra_empresa_razon: match.razon_social,
                otra_empresa_resolucion: resolucionDetectada,
                otra_empresa_resoluciones: resolucionesList,
                otra_empresa_estado: estadoDetectado,
                otra_empresa_tuc: match.numero_tuc || '',
                otra_empresa_info: `${match.razon_social} (${match.ruc})`,
                baja_interna_encontrada: true,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });

          if (estaHabilitadoEnOtra) {
            this.snackBar.open(
              `ℹ️ Unidad ${placaConGuion} está HABILITADA en "${match.razon_social}". Se configuró Régimen de Baja Regional (Art. 68.1).`,
              'OK',
              { duration: 5000 }
            );
          } else {
            this.snackBar.open(
              `ℹ️ Unidad ${placaConGuion} figura como ${estadoDetectado} en "${match.razon_social}". No requiere baja regional en DRTC Puno.`,
              'OK',
              { duration: 5000 }
            );
          }
        } else {
          this.vehiculosNuevos.update(list => {
            const copia = [...list];
            if (copia[index]) {
              copia[index] = {
                ...copia[index],
                es_misma_empresa: false,
                dar_de_baja_misma_empresa: false,
                baja_interna_encontrada: false,
                baja_interna_verificada: true,
                buscando_baja_interna: false
              };
            }
            return copia;
          });
        }
      },
      error: () => {
        this.vehiculosNuevos.update(list => {
          const copia = [...list];
          if (copia[index]) {
            copia[index] = {
              ...copia[index],
              buscando_baja_interna: false,
              baja_interna_verificada: true
            };
          }
          return copia;
        });
      }
    });
  }

  toggleBajaMismaEmpresa(index: number, checked: boolean) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          dar_de_baja_misma_empresa: checked
        };
      }
      return copia;
    });
    if (!checked) {
      this.snackBar.open(
        '⛔ Atención: Un vehículo no puede tener doble habilitación en la empresa. Si no autoriza la baja previa, el trámite no podrá avanzar.',
        'Entendido',
        { duration: 5000 }
      );
    }
  }

  setBajaTipoVehiculoNuevo(index: number, tipo: 'NINGUNA' | 'INTERNA' | 'EXTERNA') {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (!copia[index]) return copia;
      const v = copia[index];
      if (tipo === 'NINGUNA') {
        copia[index] = {
          ...v,
          baja_tipo: 'NINGUNA',
          dar_de_baja_otra_empresa: false,
          dar_de_baja_misma_empresa: false
        };
      } else if (tipo === 'INTERNA') {
        if (v.es_misma_empresa) {
          copia[index] = {
            ...v,
            baja_tipo: 'INTERNA_MISMA_EMPRESA',
            dar_de_baja_misma_empresa: true
          };
        } else {
          const puedeDarDeBaja = v.otra_empresa_estado === 'HABILITADO' || !v.otra_empresa_estado;
          copia[index] = {
            ...v,
            baja_tipo: 'INTERNA',
            dar_de_baja_otra_empresa: puedeDarDeBaja
          };
          if (!v.baja_interna_verificada) {
            this.verificarBajaOtraEmpresaParaVehiculo(v.placa, index);
          }
        }
      } else if (tipo === 'EXTERNA') {
        copia[index] = {
          ...v,
          baja_tipo: 'EXTERNA',
          dar_de_baja_otra_empresa: false,
          baja_externa: v.baja_externa || {
            ambito: 'NACIONAL_MTC',
            resolucion_baja: '',
            empresa_origen: '',
            ruc_empresa_origen: ''
          }
        };
      }
      return copia;
    });
  }

  toggleBajaInternaVehiculoNuevo(index: number, checked: boolean) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          dar_de_baja_otra_empresa: checked
        };
      }
      return copia;
    });
  }

  toggleIngresoManualInterna(index: number) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          mostrar_ingreso_manual_interna: !copia[index].mostrar_ingreso_manual_interna
        };
      }
      return copia;
    });
  }

  actualizarBajaInternaVehiculo(index: number, campo: 'ruc' | 'razon' | 'resolucion', valor: string) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        if (campo === 'ruc') copia[index].otra_empresa_ruc = valor;
        if (campo === 'razon') {
          copia[index].otra_empresa_razon = valor;
          copia[index].otra_empresa_info = `${valor} (${copia[index].otra_empresa_ruc || ''})`;
        }
        if (campo === 'resolucion') {
          copia[index].otra_empresa_resolucion = valor;
        }
      }
      return copia;
    });
  }

  actualizarBajaExternaVehiculo(index: number, campo: string, valor: any) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index].baja_externa = {
          ...(copia[index].baja_externa || {}),
          [campo]: valor
        };
      }
      return copia;
    });
  }

  toggleIncluirBajaExterna(index: number) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        const actual = !!copia[index].incluir_baja_externa;
        copia[index] = {
          ...copia[index],
          incluir_baja_externa: !actual,
          baja_externa: (!actual && !copia[index].baja_externa) ? {
            ambito: 'NACIONAL_MTC',
            resolucion_baja: '',
            empresa_origen: ''
          } : copia[index].baja_externa
        };
      }
      return copia;
    });
  }

  onEvidenciaBajaExternaSelected(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 15 * 1024 * 1024) {
      this.snackBar.open('El archivo excede el tamaño máximo permitido (15 MB)', 'Cerrar', { duration: 4000 });
      return;
    }

    const tamano = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.round(file.size / 1024) + ' KB';

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.vehiculosNuevos.update(list => {
        const copia = [...list];
        if (copia[index]) {
          copia[index] = {
            ...copia[index],
            baja_externa: {
              ...(copia[index].baja_externa || { ambito: 'NACIONAL_MTC', resolucion_baja: '', empresa_origen: '' }),
              evidencia_nombre: file.name,
              evidencia_tamano: tamano,
              evidencia_tipo: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              evidencia_base64: base64
            }
          };
        }
        return copia;
      });
      this.snackBar.open(`✓ Evidencia "${file.name}" adjuntada correctamente`, 'OK', { duration: 3000 });
    };
    reader.readAsDataURL(file);
  }

  verEvidenciaBajaExterna(index: number) {
    const v = this.vehiculosNuevos()[index];
    const evidencia = v?.baja_externa?.evidencia_base64;
    if (!evidencia) return;

    const win = window.open('', '_blank');
    if (win) {
      if (v.baja_externa?.evidencia_tipo?.includes('pdf') || v.baja_externa?.evidencia_nombre?.toLowerCase().endsWith('.pdf')) {
        win.document.write(
          `<html><head><title>Evidencia MTC - ${v.placa}</title></head><body style="margin:0;"><iframe src="${evidencia}" frameborder="0" style="border:0; width:100%; height:100vh;" allowfullscreen></iframe></body></html>`
        );
      } else {
        win.document.write(
          `<html><head><title>Evidencia MTC - ${v.placa}</title></head><body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${evidencia}" style="max-width:96%; max-height:96vh; object-fit:contain; border-radius:8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"></body></html>`
        );
      }
    }
  }

  quitarEvidenciaBajaExterna(index: number) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index] && copia[index].baja_externa) {
        copia[index].baja_externa = {
          ...copia[index].baja_externa,
          evidencia_nombre: undefined,
          evidencia_tamano: undefined,
          evidencia_tipo: undefined,
          evidencia_base64: undefined
        };
      }
      return copia;
    });
    this.snackBar.open('Evidencia retirada', 'OK', { duration: 2000 });
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
        const mismaEmpresa = registros.find(r => r.ruc === empresaActualRuc && (r.estado === 'HABILITADO' || r.esta_activo !== false));
        if (mismaEmpresa) {
          const resMis = mismaEmpresa.nro_resolucion_hija || mismaEmpresa.nro_resolucion_primigenia || 'Resolución Vigente';
          const tucMis = mismaEmpresa.numero_tuc || 'S/TUC';
          this.snackBar.open(
            `⚠️ ATENCIÓN: La unidad entrante ${placa} ya está HABILITADA en esta empresa (Res. ${resMis}, TUC: ${tucMis}). Al configurar la sustitución se dará de baja su habilitación previa para regularizar (Doble Habilitación Prohibida).`,
            'ENTENDIDO',
            { duration: 7000 }
          );
        }
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
      width: '740px',
      maxWidth: '95vw',
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
    const estadoSal = String(salienteObj.estado || '').toUpperCase();
    const activoSal = salienteObj.esta_activo !== false;
    if (['SUSTITUIDO', 'INHABILITADO', 'BAJA'].includes(estadoSal) || !activoSal) {
      this.snackBar.open(
        `⛔ El vehículo saliente ${saliente} se encuentra en estado "${estadoSal || 'INACTIVO'}". Ya fue sustituido o dado de baja previamente; un vehículo no puede ser sustituido dos veces.`,
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }

    const entranteMisma = this.vehiculosEnResolucion().find(v => v.placa === entrante);
    const esMismaEmpresaEntrante = !!entranteMisma && (entranteMisma.estado === 'HABILITADO' || entranteMisma.esta_activo !== false);

    const dt = this.datosTecnicosEntrante() || {};
    const otraEmp = this.habilitacionOtraEmpresa();
    const rutasPar = (salienteObj?.rutas && salienteObj.rutas.length > 0)
      ? [...salienteObj.rutas]
      : this.rutasOpciones().map(o => o.codigo);
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
      numero_tuc: dt.numero_tuc || '',
      rutas: rutasPar,
      datos_completos: dt,
      dar_de_baja_otra_empresa: otraEmp ? this.darDeBajaOtraEmpresa() : false,
      otra_empresa_info: otraEmp ? `${otraEmp.razon_social} (${otraEmp.ruc})` : null,
      otra_empresa_ruc: otraEmp ? otraEmp.ruc : null,
      otra_empresa_razon: otraEmp ? otraEmp.razon_social : null,
      baja_externa_registrada: false,
      dar_de_baja_misma_empresa: esMismaEmpresaEntrante,
      es_misma_empresa: esMismaEmpresaEntrante,
      misma_empresa_resolucion: entranteMisma?.nro_resolucion_hija || entranteMisma?.nro_resolucion_primigenia || null,
      misma_empresa_tuc: entranteMisma?.numero_tuc || null
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

  formatearLugar(lugar: any): string {
    if (!lugar) return '';
    if (typeof lugar === 'string') {
      return (lugar.includes('[object') || lugar.includes('[OBJECT')) ? '' : lugar;
    }
    if (typeof lugar === 'object') {
      return lugar.nombre || lugar.distrito || lugar.localidad || lugar.provincia || lugar.descripcion || '';
    }
    return String(lugar);
  }

  formatearFrecuencia(f: any): string {
    if (!f) return '';
    if (typeof f === 'string') {
      return (f.includes('[object') || f.includes('[OBJECT')) ? '' : f;
    }
    if (typeof f === 'object') {
      return f.descripcion || f.texto || f.nombre || f.valor || '';
    }
    return String(f);
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
    const items = vehiculos.map((v, index) => {
      return enriquecerFichaTecnica({
        ...v,
        orden: index + 1,
        seleccionado: true,
        placa: v.placa,
        tuc_anterior: v.numero_tuc || '',
        numero_tuc: '', // Se asignará nueva TUC oficial correlativa
        rutas: Array.isArray(v.rutas) ? [...v.rutas] : (v.rutas ? [v.rutas] : [])
      }, v);
    });
    this.vehiculosRenovacionLista.set(items);

    // Asignar automáticamente nuevas TUCs consecutivas desde el módulo de TUCs para la renovación
    this.generarTucsMasivos(false);

    // Enriquecer en segundo plano los datos técnicos desde vehiculos_data para asegurar 100% de completitud
    for (const v of items) {
      if (v.placa) {
        this.vehiculoDataService.getVehiculoDataByPlaca(v.placa).subscribe({
          next: (res) => {
            if (res && res.success && res.data) {
              this.vehiculosRenovacionLista.update(lista =>
                lista.map(item => item.placa === v.placa ? enriquecerFichaTecnica(item, res.data) : item)
              );
            }
          }
        });
      }
    }
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

      const itemVehiculo: any = enriquecerFichaTecnica({
        orden: ordenContador++,
        seleccionado: true,
        placa: cleanPlaca,
        rutas: cleanRutas.length > 0 ? cleanRutas : (anterior?.rutas || []),
        numero_tuc: anterior?.numero_tuc || ''
      }, anterior);

      nuevosVehiculos.push(itemVehiculo);
    }

    this.vehiculosRenovacionLista.set(nuevosVehiculos);
    this.procesandoLineasExcel.set(false);
    this.snackBar.open(`✓ ${nuevosVehiculos.length} vehículos procesados con éxito`, 'Entendido', { duration: 4000 });

    // Enriquecer en segundo plano desde vehiculos_data
    for (const v of nuevosVehiculos) {
      if (v.placa) {
        this.vehiculoDataService.getVehiculoDataByPlaca(v.placa).subscribe({
          next: (res) => {
            if (res && res.success && res.data) {
              this.vehiculosRenovacionLista.update(lista =>
                lista.map(item => item.placa === v.placa ? enriquecerFichaTecnica(item, res.data) : item)
              );
            }
          }
        });
      }
    }
  }

  abrirVerificacionTecnica(v: any, index: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '740px',
      maxWidth: '95vw',
      panelClass: 'modal-vehiculo-overlay-elevado',
      data: {
        vehiculo: v,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.vehiculosRenovacionLista.update(lista =>
          lista.map((item, i) => i === index ? enriquecerFichaTecnica(item, res) : item)
        );
        this.snackBar.open(`✓ Ficha técnica actualizada para ${v.placa}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  calcularCompletitud(v: any): number {
    return v?.porcentaje_completitud ?? calcularCompletitudVehiculo(v);
  }

  formatoFechaLatina(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '-';
    const str = String(fechaStr).trim();
    if (!str) return '-';
    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return str;
  }

  actualizarTucVehiculo(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value.trim().toUpperCase();
    this.vehiculosRenovacionLista.update(lista =>
      lista.map((item, i) => i === index ? { ...item, numero_tuc: val } : item)
    );
  }

  generarTucIndividual(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const siguiente = res?.siguienteNroTuc || 'T-000001';
        this.vehiculosRenovacionLista.update(lista =>
          lista.map((item, i) => i === index ? { ...item, numero_tuc: siguiente } : item)
        );
        this.snackBar.open(`✓ TUC Física ${siguiente} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.vehiculosRenovacionLista.update(lista =>
          lista.map((item, i) => i === index ? { ...item, numero_tuc: fallback } : item)
        );
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  toggleTablaFlotaPaso3() {
    this.tablaFlotaExpandidaPaso3.update(v => !v);
  }

  toggleTablaFlotaPaso4() {
    this.tablaFlotaExpandidaPaso4.update(v => !v);
  }

  generarTucsMasivos(mostrarNotificacion: boolean = true) {
    const seleccionados = this.vehiculosRenovacionLista().filter(v => v.seleccionado);
    if (seleccionados.length === 0) {
      if (mostrarNotificacion) {
        this.snackBar.open('Seleccione al menos un vehículo para asignar TUCs', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuenciales(sig, mostrarNotificacion);
      },
      error: () => {
        this.asignarTucsSecuenciales('T-000001', mostrarNotificacion);
      }
    });
  }

  private asignarTucsSecuenciales(tucInicial: string, mostrarNotificacion: boolean = true) {
    const match = tucInicial.match(/^([A-Za-z]+-?)(\d+)(.*)$/);
    let prefijo = 'T-';
    let baseNum = 1;
    let sufijo = '';

    if (match) {
      prefijo = match[1];
      baseNum = parseInt(match[2], 10) || 1;
      sufijo = match[3] || '';
    }

    let contador = baseNum;
    let totalAsignados = 0;
    let primerTuc = '';

    this.vehiculosRenovacionLista.update(lista => {
      return lista.map(v => {
        if (!v.seleccionado) return v;
        const numStr = String(contador).padStart(6, '0');
        const nuevoTuc = `${prefijo}${numStr}${sufijo}`;
        if (!primerTuc) primerTuc = nuevoTuc;
        contador++;
        totalAsignados++;
        return { ...v, numero_tuc: nuevoTuc };
      });
    });

    const ultimoTuc = `${prefijo}${String(contador - 1).padStart(6, '0')}${sufijo}`;
    if (mostrarNotificacion) {
      this.snackBar.open(
        `✓ Se asignaron ${totalAsignados} nuevas TUCs Físicas correlativas (${primerTuc} al ${ultimoTuc})`,
        'Cerrar',
        { duration: 4000 }
      );
    }
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

  // --- Asignación de Rutas y TUCs para INCREMENTO ---
  toggleRutaVehiculoNuevo(index: number, codRuta: string) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (!copia[index]) return list;
      const rActuales = Array.isArray(copia[index].rutas) ? [...copia[index].rutas] : this.rutasOpciones().map(o => o.codigo);
      const idx = rActuales.indexOf(codRuta);
      if (idx >= 0) {
        rActuales.splice(idx, 1);
      } else {
        rActuales.push(codRuta);
      }
      copia[index] = { ...copia[index], rutas: rActuales };
      return copia;
    });
  }

  asignarTodasRutasVehiculoNuevo(index: number) {
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (!copia[index]) return list;
      copia[index] = { ...copia[index], rutas: this.rutasOpciones().map(o => o.codigo) };
      return copia;
    });
  }

  actualizarTucVehiculoNuevo(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value?.trim() || '';
    this.vehiculosNuevos.update(list => {
      const copia = [...list];
      if (copia[index]) {
        copia[index] = { ...copia[index], numero_tuc: val };
      }
      return copia;
    });
  }

  generarTucVehiculoNuevo(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.vehiculosNuevos.update(list => {
          const copia = [...list];
          if (copia[index]) {
            copia[index] = { ...copia[index], numero_tuc: sig };
          }
          return copia;
        });
        this.snackBar.open(`✓ TUC Física ${sig} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.vehiculosNuevos.update(list => {
          const copia = [...list];
          if (copia[index]) {
            copia[index] = { ...copia[index], numero_tuc: fallback };
          }
          return copia;
        });
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivosIncremento() {
    const lista = this.vehiculosNuevos();
    if (lista.length === 0) {
      this.snackBar.open('No hay vehículos para asignar TUCs', 'Cerrar', { duration: 3000 });
      return;
    }
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuencialesIncremento(sig);
      },
      error: () => {
        this.asignarTucsSecuencialesIncremento('T-000001');
      }
    });
  }

  private asignarTucsSecuencialesIncremento(tucInicial: string) {
    const match = tucInicial.match(/^([A-Za-z]+-?)(\d+)(.*)$/);
    let prefijo = 'T-';
    let baseNum = 1;
    let sufijo = '';

    if (match) {
      prefijo = match[1];
      baseNum = parseInt(match[2], 10) || 1;
      sufijo = match[3] || '';
    }

    let contador = baseNum;
    const total = this.vehiculosNuevos().length;
    this.vehiculosNuevos.update(list =>
      list.map(v => {
        const numFormateado = String(contador).padStart(6, '0');
        const tuc = `${prefijo}${numFormateado}${sufijo}`;
        contador++;
        return { ...v, numero_tuc: tuc };
      })
    );
    this.snackBar.open(`✓ Se asignaron ${total} TUCs secuenciales`, 'OK', { duration: 3000 });
  }

  // --- Asignación de Rutas y TUCs para SUSTITUCIÓN ---
  toggleRutaParSustitucion(index: number, codRuta: string) {
    this.paresSustitucion.update(pares => {
      const copia = [...pares];
      if (!copia[index]) return pares;
      const rActuales = Array.isArray(copia[index].rutas) ? [...copia[index].rutas] : this.rutasOpciones().map(o => o.codigo);
      const idx = rActuales.indexOf(codRuta);
      if (idx >= 0) {
        rActuales.splice(idx, 1);
      } else {
        rActuales.push(codRuta);
      }
      copia[index] = { ...copia[index], rutas: rActuales };
      return copia;
    });
  }

  asignarTodasRutasParSustitucion(index: number) {
    this.paresSustitucion.update(pares => {
      const copia = [...pares];
      if (!copia[index]) return pares;
      copia[index] = { ...copia[index], rutas: this.rutasOpciones().map(o => o.codigo) };
      return copia;
    });
  }

  actualizarTucParSustitucion(index: number, event: Event) {
    const val = (event.target as HTMLInputElement).value?.trim() || '';
    this.paresSustitucion.update(pares =>
      pares.map((p, i) => i === index ? { ...p, numero_tuc: val } : p)
    );
  }

  generarTucParSustitucion(index: number) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.paresSustitucion.update(pares =>
          pares.map((p, i) => i === index ? { ...p, numero_tuc: sig } : p)
        );
        this.snackBar.open(`✓ TUC Física ${sig} asignada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const num = String(index + 1).padStart(6, '0');
        const fallback = `T-${num}`;
        this.paresSustitucion.update(pares =>
          pares.map((p, i) => i === index ? { ...p, numero_tuc: fallback } : p)
        );
        this.snackBar.open(`✓ TUC Física ${fallback} asignada`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivosSustitucion() {
    const pares = this.paresSustitucion();
    if (pares.length === 0) {
      this.snackBar.open('No hay pares configurados para asignar TUCs', 'Cerrar', { duration: 3000 });
      return;
    }
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuencialesSustitucion(sig);
      },
      error: () => {
        this.asignarTucsSecuencialesSustitucion('T-000001');
      }
    });
  }

  private asignarTucsSecuencialesSustitucion(tucInicial: string) {
    const match = tucInicial.match(/^([A-Za-z]+-?)(\d+)(.*)$/);
    let prefijo = 'T-';
    let baseNum = 1;
    let sufijo = '';

    if (match) {
      prefijo = match[1];
      baseNum = parseInt(match[2], 10) || 1;
      sufijo = match[3] || '';
    }

    let contador = baseNum;
    const total = this.paresSustitucion().length;
    this.paresSustitucion.update(pares =>
      pares.map(p => {
        const numFormateado = String(contador).padStart(6, '0');
        const tuc = `${prefijo}${numFormateado}${sufijo}`;
        contador++;
        return { ...p, numero_tuc: tuc };
      })
    );
    this.snackBar.open(`✓ Se asignaron ${total} TUCs secuenciales`, 'OK', { duration: 3000 });
  }

  // --- Asignación de Rutas y TUCs para DUPLICADO y CANJE ---
  actualizarTucDuplicadoCanje(placa: string, event: Event) {
    const val = (event.target as HTMLInputElement).value?.trim() || '';
    this.tucsDuplicadoCanje.update(m => ({ ...m, [placa]: val }));
  }

  generarTucDuplicadoCanje(placa: string) {
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.tucsDuplicadoCanje.update(m => ({ ...m, [placa]: sig }));
        this.snackBar.open(`✓ TUC Física ${sig} asignada a ${placa}`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        const fallback = 'T-000001';
        this.tucsDuplicadoCanje.update(m => ({ ...m, [placa]: fallback }));
        this.snackBar.open(`✓ TUC Física ${fallback} asignada a ${placa}`, 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarTucsMasivosDuplicadoCanje() {
    const seleccionados = this.vehiculosTramiteSeleccionados();
    if (seleccionados.length === 0) {
      this.snackBar.open('Seleccione al menos un vehículo para asignar TUCs', 'Cerrar', { duration: 3000 });
      return;
    }
    this.tucService.getSiguienteNumero('FISICA').subscribe({
      next: (res) => {
        const sig = res?.siguienteNroTuc || 'T-000001';
        this.asignarTucsSecuencialesDuplicadoCanje(sig);
      },
      error: () => {
        this.asignarTucsSecuencialesDuplicadoCanje('T-000001');
      }
    });
  }

  private asignarTucsSecuencialesDuplicadoCanje(tucInicial: string) {
    const match = tucInicial.match(/^([A-Za-z]+-?)(\d+)(.*)$/);
    let prefijo = 'T-';
    let baseNum = 1;
    let sufijo = '';

    if (match) {
      prefijo = match[1];
      baseNum = parseInt(match[2], 10) || 1;
      sufijo = match[3] || '';
    }

    let contador = baseNum;
    const nuevasTucs = { ...this.tucsDuplicadoCanje() };
    for (const placa of this.vehiculosTramiteSeleccionados()) {
      const numFormateado = String(contador).padStart(6, '0');
      nuevasTucs[placa] = `${prefijo}${numFormateado}${sufijo}`;
      contador++;
    }
    this.tucsDuplicadoCanje.set(nuevasTucs);
    this.snackBar.open(`✓ Se asignaron ${this.vehiculosTramiteSeleccionados().length} TUCs secuenciales`, 'OK', { duration: 3000 });
  }

  toggleRutaDuplicadoCanje(placa: string, codRuta: string) {
    this.rutasDuplicadoCanje.update(m => {
      const current = m[placa] ? [...m[placa]] : (this.vehiculosEnResolucion().find(v => v.placa === placa)?.rutas || this.rutasOpciones().map(o => o.codigo));
      const idx = current.indexOf(codRuta);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(codRuta);
      }
      return { ...m, [placa]: current };
    });
  }

  getRutasVehiculoDuplicadoCanje(placa: string): string[] {
    if (this.rutasDuplicadoCanje()[placa]) {
      return this.rutasDuplicadoCanje()[placa];
    }
    const v = this.vehiculosEnResolucion().find(x => x.placa === placa);
    if (v?.rutas && v.rutas.length > 0) {
      return v.rutas;
    }
    return this.rutasOpciones().map(o => o.codigo);
  }

  abrirModalVehiculoEnResolucion(v: any, index: number) {
    const dialogRef = this.dialog.open(VehiculoModalComponent, {
      width: '740px',
      maxWidth: '95vw',
      panelClass: 'modal-vehiculo-overlay-elevado',
      data: {
        vehiculo: v,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.vehiculosEnResolucion.update(lista =>
          lista.map((item, i) => i === index ? { ...item, ...res } : item)
        );
      }
    });
  }

  extraerAnioDeFecha(fecha: any): string {
    if (!fecha) return new Date().getFullYear().toString();
    if (typeof fecha === 'string') {
      const trimmed = fecha.trim();
      const mStart = trimmed.match(/^(\d{4})[-\/]/);
      if (mStart) return mStart[1];
      const mEnd = trimmed.match(/[-\/](\d{4})$/);
      if (mEnd) return mEnd[1];
    }
    const d = new Date(fecha);
    if (!isNaN(d.getFullYear())) {
      return d.getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  }

  sincronizarAnioExpedienteConFecha(fecha: any) {
    if (!fecha) {
      this.validarExpedienteDuplicado();
      return;
    }
    const anio = this.extraerAnioDeFecha(fecha);
    const actual = this.datosOrigenForm.get('numero_origen')?.value;
    if (!actual || !actual.trim()) {
      this.validarExpedienteDuplicado();
      return;
    }

    const tipo = this.datosOrigenForm.get('tipo_origen')?.value || 'EXPEDIENTE';
    let prefijo = 'E';
    if (tipo === 'OFICIO') prefijo = 'O';
    if (tipo === 'MEMORANDUM') prefijo = 'M';

    const clean = actual.trim().toUpperCase();
    const m = clean.match(/(?:[A-Z]-)?0*(\d+)(?:-\d{4})?/);
    if (m) {
      const numPadded = m[1].padStart(4, '0');
      const nuevo = `${prefijo}-${numPadded}-${anio}`;
      if (nuevo !== actual) {
        this.datosOrigenForm.get('numero_origen')?.setValue(nuevo, { emitEvent: false });
      }
    }
    this.validarExpedienteDuplicado();
  }

  sincronizarAnioResolucionConFecha(fecha: any) {
    if (!fecha) {
      this.validarResolucionDuplicada();
      return;
    }
    const anio = this.extraerAnioDeFecha(fecha);
    const actual = this.datosOrigenForm.get('nro_resolucion_hija')?.value;
    if (!actual || !actual.trim()) {
      this.validarResolucionDuplicada();
      return;
    }

    const clean = actual.trim().toUpperCase();
    const m = clean.match(/^R?-?0*(\d+)(?:-\d{4})?/);
    if (m) {
      const numPadded = m[1].padStart(4, '0');
      const nuevo = `R-${numPadded}-${anio}`;
      if (nuevo !== actual) {
        this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(nuevo, { emitEvent: false });
      }
    }
    this.validarResolucionDuplicada();
  }

  cambiarTipoOrigen() {
    let current = this.datosOrigenForm.get('numero_origen')?.value;
    if (current && current.includes('-')) {
      const parts = current.split('-');
      if (parts.length === 3) {
        const num = parts[1];
        const fechaDoc = this.datosOrigenForm.get('fecha_origen')?.value;
        const anio = fechaDoc ? this.extraerAnioDeFecha(fechaDoc) : parts[2];
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
    if (!num) {
      this.validarExpedienteDuplicado();
      return;
    }

    num = num.trim().toUpperCase();
    const fechaDoc = this.datosOrigenForm.get('fecha_origen')?.value;
    const anio = this.extraerAnioDeFecha(fechaDoc);

    const tipo = this.datosOrigenForm.get('tipo_origen')?.value;
    let prefijo = 'E';
    if (tipo === 'OFICIO') prefijo = 'O';
    if (tipo === 'MEMORANDUM') prefijo = 'M';

    const m = num.match(/(?:[A-Z]-)?0*(\d+)(?:-(\d{4}))?/);
    if (m) {
      const numPadded = m[1].padStart(4, '0');
      let anioFinal = anio;
      if (!fechaDoc && m[2]) {
        anioFinal = m[2];
      }
      this.datosOrigenForm.get('numero_origen')?.setValue(`${prefijo}-${numPadded}-${anioFinal}`);
    }
    this.validarExpedienteDuplicado();
  }

  normalizarResolucionHija() {
    let num = this.datosOrigenForm.get('nro_resolucion_hija')?.value;
    if (!num) {
      this.validarResolucionDuplicada();
      return;
    }

    num = num.trim().toUpperCase();
    const fechaEmision = this.datosOrigenForm.get('fecha_emision_resolucion')?.value;
    const anio = this.extraerAnioDeFecha(fechaEmision);

    const m = num.match(/^R?-?0*(\d+)(?:-(\d{4}))?/);
    if (m) {
      const numPadded = m[1].padStart(4, '0');
      let anioFinal = anio;
      if (!fechaEmision && m[2]) {
        anioFinal = m[2];
      }
      this.datosOrigenForm.get('nro_resolucion_hija')?.setValue(`R-${numPadded}-${anioFinal}`);
    }
    this.validarResolucionDuplicada();
  }

  validarExpedienteDuplicado() {
    const rawVal = this.datosOrigenForm.get('numero_origen')?.value;
    if (!rawVal || !rawVal.trim()) {
      this.advertenciaExpediente.set(null);
      return;
    }

    const val = rawVal.trim().toUpperCase();
    const fechaDoc = this.datosOrigenForm.get('fecha_origen')?.value;
    const anioDoc = this.extraerAnioDeFecha(fechaDoc);

    // Extraer número y año para búsqueda flexible
    let coreNum: number | null = null;
    let coreAnio: string = anioDoc;

    const matchFormat = val.match(/(?:[A-Z]-)?0*(\d+)-(\d{4})/);
    if (matchFormat) {
      coreNum = parseInt(matchFormat[1], 10);
      coreAnio = fechaDoc ? anioDoc : matchFormat[2];
    } else if (/^\d+$/.test(val)) {
      coreNum = parseInt(val, 10);
      coreAnio = anioDoc;
    }

    // 1. Búsqueda instantánea en el historial en memoria de todas las resoluciones
    const match = this.todasResoluciones().find(item => {
      const doc = (item.expediente_numero || item.doc || '').trim().toUpperCase();
      if (!doc) return false;
      if (doc === val) return true;

      if (coreNum !== null && coreAnio !== null) {
        const m = doc.match(/(?:[A-Z]-)?0*(\d+)-(\d{4})/);
        if (m && parseInt(m[1], 10) === coreNum && m[2] === coreAnio) {
          return true;
        }
      }
      return false;
    });

    if (match) {
      this.advertenciaExpediente.set({
        mensaje: `⚠️ Advertencia: El expediente ${val} ya se encuentra registrado.`,
        detalle: `Asociado al trámite ${match.id || match.nro_resolucion_raw} (${match.tipoLabel || match.tipo}) de la empresa "${match.empresa}" (RUC: ${match.ruc}) emitido el ${match.fecha}.`
      });
      return;
    }

    // 2. Consultar servicio de expedientes (backend)
    if (coreNum !== null && coreAnio !== null) {
      this.verificandoExpediente.set(true);
      this.expedienteService.validarNumeroBackend(coreNum.toString(), parseInt(coreAnio, 10)).subscribe({
        next: (resp) => {
          this.verificandoExpediente.set(false);
          if (resp && resp.valido === false) {
            const expEx = resp.expedienteExistente;
            this.advertenciaExpediente.set({
              mensaje: `⚠️ Advertencia: ${resp.mensaje || 'Este expediente ya existe en la base de datos.'}`,
              detalle: expEx ? `Expediente: ${expEx.nroExpediente || val} | Estado: ${expEx.estado || 'PROCESADO'} | Empresa: ${expEx.empresaId || 'Consignada'}` : undefined
            });
          } else {
            this.advertenciaExpediente.set(null);
          }
        },
        error: () => {
          this.verificandoExpediente.set(false);
          this.advertenciaExpediente.set(null);
        }
      });
    } else {
      this.advertenciaExpediente.set(null);
    }
  }

  validarResolucionDuplicada() {
    const rawVal = this.datosOrigenForm.get('nro_resolucion_hija')?.value;
    if (!rawVal || !rawVal.trim()) {
      this.advertenciaResolucion.set(null);
      return;
    }

    const val = rawVal.trim().toUpperCase();

    // Determinar año base para la validación de unicidad anual
    const fechaEmision = this.datosOrigenForm.get('fecha_emision_resolucion')?.value;
    const anioEmision = this.extraerAnioDeFecha(fechaEmision);

    let coreNum: number | null = null;
    let coreAnio: string = anioEmision;

    const matchConAnio = val.match(/^R?-?0*(\d+)-(\d{4})/);
    if (matchConAnio) {
      coreNum = parseInt(matchConAnio[1], 10);
      coreAnio = fechaEmision ? anioEmision : matchConAnio[2];
    } else {
      const matchSoloNum = val.match(/^R?-?0*(\d+)$/);
      if (matchSoloNum) {
        coreNum = parseInt(matchSoloNum[1], 10);
        coreAnio = anioEmision;
      }
    }

    if (coreNum === null) {
      this.advertenciaResolucion.set(null);
      return;
    }

    const numPadded = coreNum.toString().padStart(4, '0');
    const codigoNormalizado = `R-${numPadded}-${coreAnio}`;

    // 1. Búsqueda instantánea en el historial de resoluciones hijas verificando unicidad estricta EN EL AÑO
    const matchHija = this.todasResoluciones().find(item => {
      if (item.id === codigoNormalizado) return true;

      let itemNum: number | null = null;
      let itemAnio: string | null = (item.anio && item.anio !== 'S/A') ? item.anio : null;

      const txt = (item.id || item.nro_resolucion_raw || '').trim().toUpperCase();
      const m = txt.match(/^R?-?0*(\d+)-(\d{4})/);
      if (m) {
        itemNum = parseInt(m[1], 10);
        itemAnio = m[2];
      } else {
        const mSolo = txt.match(/^R?-?0*(\d+)/);
        if (mSolo) itemNum = parseInt(mSolo[1], 10);
      }

      // Debe coincidir el número correlativo Y el año
      return itemNum !== null && itemNum === coreNum && itemAnio === coreAnio;
    });

    if (matchHija) {
      this.advertenciaResolucion.set({
        mensaje: `⚠️ Advertencia: La resolución R-${numPadded}-${coreAnio} ya existe para el año ${coreAnio}.`,
        detalle: `Asociada al trámite ${matchHija.tipoLabel || matchHija.tipo} de la empresa "${matchHija.empresa}" (RUC: ${matchHija.ruc}) emitido el ${matchHija.fecha}. El número de resolución debe ser único en el año ${coreAnio}.`
      });
      return;
    }

    // 2. Verificar contra resoluciones primigenias de la empresa actual y en memoria
    const matchPrimLocal = this.resoluciones().find(p => {
      let pNum: number | null = null;
      let pAnio: string | null = null;
      const txt = (p.nro_resolucion || '').trim().toUpperCase();
      const m = txt.match(/^R?-?0*(\d+)-(\d{4})/);
      if (m) {
        pNum = parseInt(m[1], 10);
        pAnio = m[2];
      } else {
        const mSolo = txt.match(/^R?-?0*(\d+)/);
        if (mSolo) pNum = parseInt(mSolo[1], 10);
        if (p.fecha_resolucion) {
          const d = new Date(p.fecha_resolucion);
          if (!isNaN(d.getFullYear())) pAnio = d.getFullYear().toString();
        }
      }
      return pNum !== null && pNum === coreNum && pAnio === coreAnio;
    });

    if (matchPrimLocal) {
      this.advertenciaResolucion.set({
        mensaje: `⚠️ Advertencia: El número R-${numPadded}-${coreAnio} ya existe como Resolución Primigenia del año ${coreAnio}.`,
        detalle: `Resolución: ${matchPrimLocal.nro_resolucion} | Estado: ${matchPrimLocal.estado || 'VIGENTE'}. Debe ingresar un correlativo único para el año ${coreAnio}.`
      });
      return;
    }

    // 3. Consultar servicio backend para verificar si existe en la BD para ese año
    this.verificandoResolucion.set(true);
    this.resolucionHijaService.getHijaByNumero(codigoNormalizado).subscribe({
      next: (hija) => {
        this.verificandoResolucion.set(false);
        if (hija && hija.nro_resolucion) {
          this.advertenciaResolucion.set({
            mensaje: `⚠️ Advertencia: La resolución R-${numPadded}-${coreAnio} ya existe para el año ${coreAnio}.`,
            detalle: `Registrada para la empresa "${hija.razon_social || hija.ruc_empresa}" (Tipo: ${hija.tipo_acto || 'Trámite'}).`
          });
        } else {
          this.advertenciaResolucion.set(null);
        }
      },
      error: () => {
        // Consultar también primigenias en backend
        this.resolucionPrimigeniaService.getResolucionByNumero(codigoNormalizado).subscribe({
          next: (prim) => {
            this.verificandoResolucion.set(false);
            if (prim && prim.nro_resolucion) {
              this.advertenciaResolucion.set({
                mensaje: `⚠️ Advertencia: El número R-${numPadded}-${coreAnio} ya existe como Resolución Primigenia del año ${coreAnio}.`,
                detalle: `Empresa: "${prim.razon_social || prim.ruc_empresa}" | Estado: ${prim.estado || 'VIGENTE'}.`
              });
            } else {
              this.advertenciaResolucion.set(null);
            }
          },
          error: () => {
            this.verificandoResolucion.set(false);
            this.advertenciaResolucion.set(null);
          }
        });
      }
    });
  }

  validarNuevaResolucionPrimigeniaDuplicada() {
    const rawVal = this.renovacionForm.get('nueva_resolucion_primigenia')?.value;
    if (!rawVal || !rawVal.trim()) {
      this.advertenciaRenovacionResolucion.set(null);
      return;
    }

    const val = rawVal.trim().toUpperCase();
    let coreNum: number | null = null;
    let coreAnio: string | null = null;

    const matchFormat = val.match(/^R?-?0*(\d+)-(\d{4})/);
    if (matchFormat) {
      coreNum = parseInt(matchFormat[1], 10);
      coreAnio = matchFormat[2];
    }

    const matchHija = this.todasResoluciones().find(item => {
      const nro = (item.id || item.nro_resolucion_raw || '').trim().toUpperCase();
      if (!nro) return false;
      if (nro === val) return true;
      if (coreNum !== null && coreAnio !== null) {
        const m = nro.match(/^R?-?0*(\d+)-(\d{4})/);
        if (m && parseInt(m[1], 10) === coreNum && m[2] === coreAnio) return true;
      }
      return false;
    });

    if (matchHija) {
      this.advertenciaRenovacionResolucion.set({
        mensaje: `⚠️ Advertencia: El número ${val} ya existe registrado en una resolución previa.`,
        detalle: `Trámite ${matchHija.tipoLabel || matchHija.tipo} de "${matchHija.empresa}" (${matchHija.fecha}).`
      });
      return;
    }

    this.resolucionPrimigeniaService.getResolucionByNumero(val).subscribe({
      next: (prim) => {
        if (prim && prim.nro_resolucion) {
          this.advertenciaRenovacionResolucion.set({
            mensaje: `⚠️ Advertencia: El número ${val} ya existe como Resolución Primigenia en el sistema.`,
            detalle: `Empresa: "${prim.razon_social || prim.ruc_empresa}" | Estado: ${prim.estado || 'VIGENTE'}.`
          });
        } else {
          this.advertenciaRenovacionResolucion.set(null);
        }
      },
      error: () => {
        this.advertenciaRenovacionResolucion.set(null);
      }
    });
  }

  confirmar() {
    const emp = this.empresaBuscada();
    const tipo = this.tramiteSeleccionado();
    const resPrimigenia = this.resolucionForm.get('nro_resolucion_primigenia')?.value;

    if (!emp || !tipo || (!resPrimigenia && !this.esTramiteEmpresa())) {
      this.snackBar.open('Complete la información de empresa y resolución', 'Cerrar', { duration: 4000 });
      return;
    }

    const origenVal = this.datosOrigenForm.value;

    // Procesamiento especializado para trámites corporativos y de concesión (sin placas)
    if (this.esTramiteSinPlacas()) {
      const formVal = this.tramiteAdminForm.value;
      const payload: TramiteAdministrativoPayload = {
        ruc_empresa: emp.ruc,
        razon_social: emp.razon_social || emp.razonSocial,
        ambito: this.esTramiteEmpresa() ? 'EMPRESA' : 'CONCESION',
        tipo_tramite: tipo as any,
        nro_resolucion: origenVal.nro_resolucion_hija?.trim() || 'R-PENDIENTE',
        fecha_resolucion: origenVal.fecha_emision_resolucion || undefined,
        nro_expediente: origenVal.numero_origen || undefined,
        fecha_expediente: origenVal.fecha_origen || undefined,
        nro_resolucion_primigenia: (this.esTramiteConcesion() && resPrimigenia) ? resPrimigenia : undefined,
        detalles: {
          nuevo_representante: formVal.nuevo_representante,
          nuevo_dni: formVal.nuevo_dni_representante,
          partida_registral: formVal.partida_registral_representante,
          asiento_registral: formVal.asiento_registral,
          nuevo_domicilio: formVal.nuevo_domicilio,
          codigo_ruta: formVal.codigo_ruta,
          nuevo_itinerario: formVal.nuevo_itinerario,
          nueva_frecuencia: formVal.nueva_frecuencia,
          articulo_afectado: formVal.articulo_fe_erratas,
          dice: formVal.dice_texto,
          debe_decir: formVal.debe_decir_texto
        },
        observaciones: formVal.sustento_observaciones || undefined
      };

      this.tramiteAdminService.registrarTramite(payload).subscribe({
        next: (resp) => {
          this.snackBar.open(resp.mensaje || 'Trámite administrativo registrado y aplicado con éxito', 'OK', { duration: 5000 });
          this.cancelarTramite();
          this.cargarCatalogoEmpresas();
          this.cargarHistorialTramites();
        },
        error: (err) => {
          this.snackBar.open('Error al procesar trámite: ' + (err.error?.detail || err.message), 'Cerrar', { duration: 6000 });
        }
      });
      return;
    }
    const esDeOficio = origenVal.tipo_origen === 'OFICIO';
    const docOrigen = origenVal.numero_origen || undefined;
    const nroHija = tipo === 'RENOVACION'
      ? this.normalizarResolucionTexto(
          this.renovacionForm.value.nueva_resolucion_primigenia || '',
          this.renovacionForm.value.nueva_fecha_emision
        )
      : (origenVal.nro_resolucion_hija?.trim() || undefined);
    const fechaRes = tipo === 'RENOVACION'
      ? (this.renovacionForm.value.nueva_fecha_emision || undefined)
      : (origenVal.fecha_emision_resolucion || undefined);

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
        rutas: (p.rutas && p.rutas.length > 0) ? p.rutas : this.rutasOpciones().map(o => o.codigo),
        dar_de_baja_otra_empresa: !!p.dar_de_baja_otra_empresa,
        otra_empresa_ruc: p.otra_empresa_ruc || undefined,
        otra_empresa_razon: p.otra_empresa_razon || undefined,
        baja_tipo: p.dar_de_baja_otra_empresa ? 'INTERNA' : (p.baja_externa_registrada ? 'EXTERNA' : 'NINGUNA'),
        baja_externa: p.baja_externa || undefined,
        dar_de_baja_misma_empresa: !!p.dar_de_baja_misma_empresa,
        es_misma_empresa: !!p.es_misma_empresa,
        misma_empresa_resolucion: p.misma_empresa_resolucion || undefined,
        misma_empresa_tuc: p.misma_empresa_tuc || undefined,
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
      const tieneDobleHabilitacionSinBaja = this.vehiculosNuevos().find(
        v => v.es_misma_empresa && !v.dar_de_baja_misma_empresa
      );
      if (tieneDobleHabilitacionSinBaja) {
        this.snackBar.open(
          `⛔ Bloqueo normativo: La unidad ${tieneDobleHabilitacionSinBaja.placa} ya está habilitada en esta empresa. Debe autorizar la baja previa o retirar el vehículo (un vehículo no puede tener doble habilitación).`,
          'CORREGIR',
          { duration: 6000 }
        );
        return;
      }
      vehiculosItems = this.vehiculosNuevos().map(v => ({
        placa: v.placa,
        tipo_operacion: 'INCREMENTO',
        numero_tuc: v.numero_tuc || undefined,
        rutas: (v.rutas && v.rutas.length > 0) ? v.rutas : this.rutasOpciones().map(o => o.codigo),
        dar_de_baja_otra_empresa: !!v.dar_de_baja_otra_empresa,
        otra_empresa_ruc: v.otra_empresa_ruc || undefined,
        otra_empresa_razon: v.otra_empresa_razon || undefined,
        baja_tipo: v.baja_tipo || (v.dar_de_baja_otra_empresa ? 'INTERNA' : (v.baja_externa ? 'EXTERNA' : 'NINGUNA')),
        baja_externa: (v.baja_tipo === 'EXTERNA' || v.incluir_baja_externa) ? v.baja_externa : undefined,
        dar_de_baja_misma_empresa: !!v.dar_de_baja_misma_empresa,
        es_misma_empresa: !!v.es_misma_empresa,
        misma_empresa_resolucion: v.misma_empresa_resolucion || undefined,
        misma_empresa_tuc: v.misma_empresa_tuc || undefined,
        datos_tecnicos: {
          marca: v.marca,
          modelo: v.modelo,
          anio_fabricacion: v.anio_fabricacion,
          categoria: v.categoria || 'M2',
          asientos: v.asientos || v.numero_asientos || undefined,
          peso_neto: v.peso_neto || v.peso_seco || undefined
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
          codigo: String(r.codigoRuta || r.codigo || '').toUpperCase().trim(),
          origen: this.formatearLugar(r.origen).toUpperCase().trim(),
          destino: this.formatearLugar(r.destino).toUpperCase().trim(),
          itinerario: this.formatearItinerario(r.itinerario).toUpperCase().trim(),
          frecuencia: this.formatearFrecuencia(r.frecuencia).toUpperCase().trim()
        }));

      payloadExtra = {
        es_renovacion: true,
        nueva_resolucion_primigenia: this.normalizarResolucionTexto(
          this.renovacionForm.value.nueva_resolucion_primigenia || '',
          this.renovacionForm.value.nueva_fecha_emision
        ),
        nueva_fecha_emision: this.renovacionForm.value.nueva_fecha_emision || undefined,
        nueva_fecha_inicio_vigencia: this.renovacionForm.value.nueva_fecha_inicio_vigencia || undefined,
        nueva_fecha_fin_vigencia: this.renovacionForm.value.nueva_fecha_fin_vigencia || undefined,
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
      vehiculosItems = this.vehiculosTramiteSeleccionados().map(placa => {
        const tuc = this.tucsDuplicadoCanje()[placa] || undefined;
        const rutasVeh = this.getRutasVehiculoDuplicadoCanje(placa);
        return {
          placa: placa,
          tipo_operacion: tipo,
          numero_tuc: tuc,
          rutas: rutasVeh,
          observacion_custom: `${tipo}: ${motivo}`
        };
      });
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
        if (resPrimigenia) {
          this.cargarVehiculosResolucion(resPrimigenia);
        }
        this.cargarHistorialTramites();
        this.cargarCatalogoEmpresas();

        // Generación / Impresión de TUCs para CUALQUIER trámite que tenga vehículos
        const vehiculosParaTuc = res?.vehiculos && res.vehiculos.length > 0
          ? res.vehiculos
          : (vehiculosItems || []).filter((v: any) => v.placa && v.tipo_movimiento !== 'BAJA').map((v: any, idx: number) => ({
              placa: v.placa,
              numero_tuc: v.numero_tuc,
              orden: v.orden || (idx + 1),
              marca: v.datos_tecnicos?.marca,
              modelo: v.datos_tecnicos?.modelo,
              anio_fabricacion: v.datos_tecnicos?.anio_fabricacion,
              categoria: v.datos_tecnicos?.categoria || 'M2',
              color: v.datos_tecnicos?.color,
              rutas: v.rutas || []
            }));

        if (vehiculosParaTuc.length > 0) {
          this.dialog.open(RenovacionTucModalComponent, {
            data: {
              nro_resolucion: res?.nro_resolucion_hija || payloadExtra.nueva_resolucion_primigenia || resPrimigenia || nroHija,
              ruc: emp.ruc,
              razon_social: emp.razon_social,
              fecha_emision: fechaRes,
              fecha_inicio_vigencia: fechaRes,
              fecha_fin_vigencia: this.renovacionForm.value.nueva_fecha_fin_vigencia,
              duracion_anios: this.duracionAniosRenovacion(),
              tipo_tramite: tipo,
              vehiculos: vehiculosParaTuc
            },
            width: '1060px',
            maxWidth: '96vw',
            maxHeight: '92vh',
            panelClass: 'tuc-impresion-dialog-panel'
          });
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Error al procesar trámite masivo:', err);
        const msg = err.error?.detail || 'Error al procesar el trámite en el servidor';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 6000 });
      }
    });
  }

  // ACCIONES DE IMPRESIÓN / GENERACIÓN DE TUC PARA CUALQUIER TRÁMITE
  abrirModalImpresionTucs(tramite: any) {
    if (!tramite) return;
    const placas: string[] = tramite.placasIng && tramite.placasIng.length > 0
      ? tramite.placasIng
      : (tramite.placasTexto ? tramite.placasTexto.split(' ').filter(Boolean) : []);

    const tucs: string[] = tramite.numeros_tuc || [];

    if (placas.length > 0) {
      const vehiculosInfo = placas.map((p, idx) => ({
        placa: p,
        numero_tuc: tucs[idx] || undefined,
        orden: idx + 1
      }));

      this.dialog.open(RenovacionTucModalComponent, {
        data: {
          nro_resolucion: tramite.nro_resolucion_primigenia || tramite.nro_resolucion || tramite.id || 'S/N',
          ruc: tramite.ruc,
          razon_social: tramite.empresa,
          fecha_emision: tramite.fecha_resolucion_raw || tramite.fecha,
          fecha_inicio_vigencia: tramite.fecha_inicio_efectos,
          tipo_tramite: tramite.tipoLabel || tramite.tipoRaw || 'MODIFICACION',
          vehiculos: vehiculosInfo
        },
        width: '1060px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        panelClass: 'tuc-impresion-dialog-panel'
      });
    } else {
      // Si no vienen placas precargadas, consultar vehículos del trámite en backend
      const hijaId = tramite.id || tramite._id || tramite.nro_resolucion;
      this.resolucionHijaService.getVehiculosDetalleTramite(hijaId).subscribe({
        next: (resp) => {
          const vehs = (resp.vehiculos || []).filter((v: any) => !v.es_saliente).map((v: any, idx: number) => ({
            placa: v.placa,
            numero_tuc: v.numero_tuc,
            orden: idx + 1,
            marca: v.marca,
            modelo: v.modelo,
            anio_fabricacion: v.anio_fabricacion,
            categoria: v.categoria
          }));

          if (vehs.length === 0) {
            this.snackBar.open('Este trámite no tiene vehículos ingresantes registrados para emitir TUC.', 'OK', { duration: 3500 });
            return;
          }

          this.dialog.open(RenovacionTucModalComponent, {
            data: {
              nro_resolucion: resp.nro_resolucion || tramite.id || 'S/N',
              ruc: resp.ruc_empresa || tramite.ruc,
              razon_social: resp.razon_social || tramite.empresa,
              fecha_emision: resp.fecha_resolucion || tramite.fecha,
              tipo_tramite: tramite.tipoLabel || tramite.tipoRaw || 'MODIFICACION',
              vehiculos: vehs
            },
            width: '1060px',
            maxWidth: '96vw',
            maxHeight: '92vh',
            panelClass: 'tuc-impresion-dialog-panel'
          });
        },
        error: () => {
          this.snackBar.open('No se encontraron vehículos ingresantes para imprimir TUCs.', 'OK', { duration: 3000 });
        }
      });
    }
  }

  abrirModalEditarTramite(tramite: any) {
    if (!tramite) return;
    const dialogRef = this.dialog.open(EditarTramiteModalComponent, {
      data: tramite,
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '94vh',
      disableClose: true,
      panelClass: 'clean-modal-panel'
    });

    dialogRef.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarHistorialTramites();
        if (this.mostrarDetalle()) {
          this.cerrarDetalle();
        }
      }
    });
  }

  imprimirTucIndividual(placa: string) {
    if (!placa) return;
    const url = `${environment.apiUrl}/tucs/vista-impresion/${encodeURIComponent(placa)}`;
    window.open(url, '_blank');
    this.snackBar.open(`Vista A4 para ${placa} abierta en nueva pestaña. Presione Ctrl+P para imprimir.`, 'OK', { duration: 3500 });
  }
}
