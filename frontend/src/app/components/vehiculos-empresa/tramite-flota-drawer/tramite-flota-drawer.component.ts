import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  FlotaEmpresaService,
  ItemTramiteVehiculo,
  TramiteMasivoRequest,
  VehiculoEmpresa
} from '../../../services/flota-empresa.service';
import { ResolucionPrimigeniaService } from '../../../services/resolucion-primigenia.service';
import { RutaService } from '../../../services/ruta.service';

export interface ParSustitucionUI {
  placa_saliente: string;
  vehiculo_saliente_obj?: any;
  placa_entrante: string;
  marca?: string;
  modelo?: string;
  anio_fabricacion?: number;
  categoria?: string;
  asientos?: number;
  peso_neto?: number;
  rutas: string[];
  numero_tuc?: string;
  datos_completos?: any;
  otra_empresa_ruc?: string;
  otra_empresa_razon?: string;
  dar_de_baja_otra_empresa?: boolean;
  es_misma_empresa?: boolean;
  dar_de_baja_misma_empresa?: boolean;
}

@Component({
  selector: 'app-tramite-flota-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './tramite-flota-drawer.component.html',
  styleUrls: ['./tramite-flota-drawer.component.scss']
})
export class TramiteFlotaDrawerComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private flotaService = inject(FlotaEmpresaService);
  private primigeniaService = inject(ResolucionPrimigeniaService);
  private rutaService = inject(RutaService);
  private snackBar = inject(MatSnackBar);

  @Input() isOpen = false;
  @Input() ruc = '';
  @Input() razonSocial = '';
  @Input() primigeniasDisponibles: any[] = [];
  @Input() primigeniaSeleccionada = '';
  @Input() vehiculoPreseleccionado: any = null;
  @Input() tipoTramiteInicial = 'SUSTITUCION';
  @Input() flotaActual: VehiculoEmpresa[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() tramiteProcesado = new EventEmitter<any>();

  // Estados reactivos
  pasoActual = signal<number>(0);
  tramiteSeleccionado = signal<string>('SUSTITUCION');
  primigeniaActiva = signal<string>('');
  isProcessing = signal<boolean>(false);

  // Catálogo de tipos de trámite operativos
  tiposTramite = [
    {
      id: 'SUSTITUCION',
      nombre: 'Sustitución Vehicular',
      icono: 'sync_alt',
      color: '#2563eb',
      desc: 'Reemplazo de una unidad operativa por otra más moderna de igual o mejor categoría'
    },
    {
      id: 'INCREMENTO',
      nombre: 'Incremento de Flota',
      icono: 'trending_up',
      color: '#0e7490',
      desc: 'Incorporación de nuevas unidades autorizadas ampliando la capacidad del servicio'
    },
    {
      id: 'RENOVACION',
      nombre: 'Renovación de Concesión',
      icono: 'autorenew',
      color: '#15803d',
      desc: 'Extensión de vigencia de la autorización y ratificación de la flota vehicular y rutas'
    },
    {
      id: 'BAJAS',
      nombre: 'Baja Vehicular',
      icono: 'remove_circle',
      color: '#dc2626',
      desc: 'Retiro definitivo o cese voluntario de unidades del padrón oficial'
    },
    {
      id: 'DUPLICADO',
      nombre: 'Duplicado de TUC',
      icono: 'file_copy',
      color: '#4f46e5',
      desc: 'Emisión de copia idéntica por pérdida o extravío de la Tarjeta Única de Circulación'
    },
    {
      id: 'CANJE',
      nombre: 'Canje de TUC',
      icono: 'change_circle',
      color: '#0f766e',
      desc: 'Renovación por deterioro físico o actualización técnica de especificaciones vehiculares'
    },
    {
      id: 'TRAMITE_GENERAL',
      nombre: 'Trámite General / Mixto',
      icono: 'hub',
      color: '#475569',
      desc: 'Múltiples actos simultáneos (modificación de rutas, frecuencias, rectificaciones)'
    }
  ];

  // Formularios
  datosOrigenForm: FormGroup = this.fb.group({
    tipo_origen: ['EXPEDIENTE', Validators.required],
    numero_origen: ['', [Validators.required, Validators.minLength(3)]],
    fecha_origen: [new Date().toISOString().substring(0, 10), Validators.required],
    nro_resolucion_hija: ['', Validators.required],
    fecha_emision_resolucion: [new Date().toISOString().substring(0, 10), Validators.required]
  });

  renovacionForm: FormGroup = this.fb.group({
    nueva_resolucion_primigenia: ['', Validators.required],
    nueva_fecha_emision: [new Date().toISOString().substring(0, 10), Validators.required],
    nueva_fecha_inicio_vigencia: [new Date().toISOString().substring(0, 10)],
    nueva_fecha_fin_vigencia: ['']
  });

  bajaForm: FormGroup = this.fb.group({
    motivo_baja: ['RETIRO VOLUNTARIO Y CESE DE OPERACIONES', Validators.required]
  });

  duplicadoCanjeForm: FormGroup = this.fb.group({
    motivo: ['DETERIORO', Validators.required],
    observaciones: ['']
  });

  tramiteGeneralForm: FormGroup = this.fb.group({
    incluye_modificacion_ruta: [false],
    incluye_bajas: [false],
    codigo_ruta: [''],
    nuevo_itinerario: [''],
    nueva_frecuencia: [''],
    motivo_baja: ['BAJA VEHICULAR POR RESOLUCIÓN MIXTA'],
    asunto_resumen: ['Trámite General de Flota y Concesión'],
    disposicion_resolutiva: ['']
  });

  // Estados Sustitución
  placaSalienteTemp = signal<string>('');
  vehiculoSalienteObj = signal<any | null>(null);
  placaEntranteTemp = signal<string>('');
  datosTecnicosEntrante = signal<any | null>(null);
  buscandoPlacaEntrante = signal<boolean>(false);
  habilitacionOtraEmpresa = signal<any | null>(null);
  darDeBajaOtraEmpresa = signal<boolean>(false);
  habilitacionMismaEmpresa = signal<any | null>(null);
  darDeBajaMismaEmpresa = signal<boolean>(false);
  paresSustitucion = signal<ParSustitucionUI[]>([]);

  // Estados Incremento
  placaIncrementoTemp = signal<string>('');
  datosTecnicosIncremento = signal<any | null>(null);
  buscandoPlacaIncremento = signal<boolean>(false);
  rutasSeleccionadasIncremento = signal<string[]>([]);
  vehiculosIncremento = signal<any[]>([]);

  // Estados Renovación
  vehiculosRenovacionLista = signal<Array<any>>([]);
  rutasSeleccionadasRenovacion = signal<string[]>([]);

  // Estados Bajas
  vehiculosBajaSeleccionados = signal<string[]>([]);

  // Estados Canje / Duplicado
  vehiculoTucSeleccionado = signal<any | null>(null);

  // Computados
  flotaHabilitadaPrimigenia = computed(() => {
    const prim = this.primigeniaActiva();
    const flota = this.flotaActual || [];
    if (!prim) return flota.filter(v => v.estado !== 'INHABILITADO' && v.estado !== 'CANCELADO');
    return flota.filter(v => 
      (v.nro_resolucion_primigenia === prim || v.id_origen === prim) &&
      v.estado !== 'INHABILITADO' && v.estado !== 'CANCELADO'
    );
  });

  rutasPrimigeniaActiva = computed(() => {
    const prim = this.primigeniaActiva();
    if (!prim) return [];
    const item = (this.primigeniasDisponibles || []).find(p => (p.primigenia || p.nro_resolucion) === prim);
    return item?.rutasArray || item?.rutas || [];
  });

  esResolucionVencida = computed(() => {
    const prim = this.primigeniaActiva();
    if (!prim) return false;
    const item = (this.primigeniasDisponibles || []).find(p => (p.primigenia || p.nro_resolucion) === prim);
    if (!item) return false;
    const est = (item.estado || item.estado_primigenia || '').toUpperCase();
    if (est === 'VENCIDA' || est === 'CANCELADA' || est === 'INACTIVA') return true;
    if (item.vigenciaHasta || item.fecha_vigencia_hasta) {
      const hasta = new Date(item.vigenciaHasta || item.fecha_vigencia_hasta);
      return !isNaN(hasta.getTime()) && hasta < new Date();
    }
    return false;
  });

  ngOnInit() {
    this.inicializarValores();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.inicializarValores();
    }
    if (changes['primigeniaSeleccionada'] && this.primigeniaSeleccionada) {
      this.primigeniaActiva.set(this.primigeniaSeleccionada);
    }
    if (changes['vehiculoPreseleccionado'] && this.vehiculoPreseleccionado) {
      this.prepararVehiculoPreseleccionado();
    }
    if (changes['tipoTramiteInicial'] && this.tipoTramiteInicial) {
      this.tramiteSeleccionado.set(this.tipoTramiteInicial);
    }
  }

  inicializarValores() {
    this.pasoActual.set(0);
    this.isProcessing.set(false);

    // Definir primigenia activa
    if (this.primigeniaSeleccionada) {
      this.primigeniaActiva.set(this.primigeniaSeleccionada);
    } else if (this.primigeniasDisponibles && this.primigeniasDisponibles.length > 0) {
      const p = this.primigeniasDisponibles[0];
      this.primigeniaActiva.set(p.primigenia || p.nro_resolucion || '');
    }

    if (this.tipoTramiteInicial) {
      this.tramiteSeleccionado.set(this.tipoTramiteInicial);
    }

    // Auto-generar propuesta de resolución
    const anioActual = new Date().getFullYear();
    const corrAleatorio = Math.floor(Math.random() * 800 + 100).toString().padStart(4, '0');
    this.datosOrigenForm.patchValue({
      tipo_origen: 'EXPEDIENTE',
      numero_origen: `E-${corrAleatorio}-${anioActual}`,
      fecha_origen: new Date().toISOString().substring(0, 10),
      nro_resolucion_hija: `R-${corrAleatorio}-${anioActual}`,
      fecha_emision_resolucion: new Date().toISOString().substring(0, 10)
    });

    // Inicializar checklist de renovación
    const listaRenov = this.flotaHabilitadaPrimigenia().map(v => ({
      ...v,
      seleccionado: true
    }));
    this.vehiculosRenovacionLista.set(listaRenov);
    this.rutasSeleccionadasRenovacion.set([...this.rutasPrimigeniaActiva()]);

    if (this.vehiculoPreseleccionado) {
      this.prepararVehiculoPreseleccionado();
    }
  }

  prepararVehiculoPreseleccionado() {
    const v = this.vehiculoPreseleccionado;
    if (!v) return;

    if (v.nro_resolucion_primigenia) {
      this.primigeniaActiva.set(v.nro_resolucion_primigenia);
    }

    if (this.tipoTramiteInicial === 'BAJAS') {
      this.vehiculosBajaSeleccionados.set([v.placa]);
      this.pasoActual.set(2);
    } else if (this.tipoTramiteInicial === 'CANJE' || this.tipoTramiteInicial === 'DUPLICADO') {
      this.vehiculoTucSeleccionado.set(v);
      this.pasoActual.set(2);
    } else {
      // Sustitución por defecto
      this.tramiteSeleccionado.set('SUSTITUCION');
      this.placaSalienteTemp.set(v.placa);
      this.vehiculoSalienteObj.set(v);
      this.pasoActual.set(2);
    }
  }

  seleccionarTramite(id: string) {
    this.tramiteSeleccionado.set(id);
    if (id === 'RENOVACION' && this.renovacionForm.get('nueva_resolucion_primigenia')?.value === '') {
      const prim = this.primigeniaActiva();
      const anio = new Date().getFullYear();
      this.renovacionForm.patchValue({
        nueva_resolucion_primigenia: `R-0${Math.floor(Math.random() * 800 + 100)}-${anio}`
      });
    }
  }

  onPrimigeniaChange(prim: string) {
    this.primigeniaActiva.set(prim);
    const listaRenov = this.flotaHabilitadaPrimigenia().map(v => ({
      ...v,
      seleccionado: true
    }));
    this.vehiculosRenovacionLista.set(listaRenov);
    this.rutasSeleccionadasRenovacion.set([...this.rutasPrimigeniaActiva()]);
  }

  // --- LÓGICA DE SUSTITUCIÓN ---
  onPlacaSalienteChange(placa: string) {
    this.placaSalienteTemp.set(placa);
    const v = this.flotaHabilitadaPrimigenia().find(item => item.placa === placa);
    this.vehiculoSalienteObj.set(v || null);
  }

  buscarDatosVehiculoEntrante() {
    let placa = this.placaEntranteTemp().toUpperCase().trim();
    if (!placa || placa.length < 5) {
      this.snackBar.open('Ingrese una placa válida (ej. ABC-123)', 'Cerrar', { duration: 3000 });
      return;
    }

    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.placaEntranteTemp.set(placa);
    }

    this.buscandoPlacaEntrante.set(true);

    this.flotaService.verificarPlacaTramite(placa, this.ruc).subscribe({
      next: (resVerif) => {
        this.buscandoPlacaEntrante.set(false);

        // Alerta de doble habilitación en otra empresa
        if (resVerif.habilitado_otra_empresa && resVerif.otra_empresa_info) {
          const oInfo = resVerif.otra_empresa_info;
          this.habilitacionOtraEmpresa.set({
            ruc: oInfo.ruc,
            razon_social: oInfo.razon_social || 'Otra Empresa',
            nro_resolucion_primigenia: oInfo.nro_resolucion_primigenia || oInfo.nro_resolucion_hija
          });
          this.darDeBajaOtraEmpresa.set(true);
          this.snackBar.open(
            `⚠️ ALERTA: La placa ${placa} ya está HABILITADA en "${oInfo.razon_social}" (RUC ${oInfo.ruc}). Se requiere autorización de baja previa (Art. 68.1 RNAT) para prevenir la DOBLE HABILITACIÓN.`,
            'ENTENDIDO',
            { duration: 8000 }
          );
        } else {
          this.habilitacionOtraEmpresa.set(null);
        }

        // Alerta si ya está en la misma empresa
        if (resVerif.habilitado_misma_empresa && resVerif.misma_empresa_info) {
          const mInfo = resVerif.misma_empresa_info;
          this.habilitacionMismaEmpresa.set({
            ruc: mInfo.ruc,
            razon_social: mInfo.razon_social || this.razonSocial,
            nro_resolucion_hija: mInfo.nro_resolucion_hija
          });
          this.darDeBajaMismaEmpresa.set(true);
        } else {
          this.habilitacionMismaEmpresa.set(null);
        }

        // Datos técnicos
        if (resVerif.datos_tecnicos) {
          const dt = resVerif.datos_tecnicos;
          this.datosTecnicosEntrante.set({
            placa,
            marca: dt.marca || 'GENÉRICA',
            modelo: dt.modelo || 'ESTÁNDAR',
            anio_fabricacion: dt.anio_fabricacion || new Date().getFullYear() - 3,
            categoria: dt.categoria || 'M2',
            carroceria: dt.carroceria || 'MINIBUS',
            combustible: dt.combustible || 'DIESEL',
            asientos: dt.asientos || 15,
            peso_neto: dt.peso_neto || 2800,
            numero_motor: dt.numero_motor || '',
            vin: dt.vin || ''
          });
          this.snackBar.open(`✓ Datos técnicos obtenidos para placa ${placa}`, 'OK', { duration: 3000 });
        } else {
          // Valores por defecto para ingreso manual rápido
          this.datosTecnicosEntrante.set({
            placa,
            marca: 'TOYOTA',
            modelo: 'HIACE',
            anio_fabricacion: new Date().getFullYear() - 2,
            categoria: 'M2',
            carroceria: 'MICROBUS',
            combustible: 'DIESEL',
            asientos: 16,
            peso_neto: 2750
          });
          this.snackBar.open(`Placa ${placa} lista para especificaciones técnicas`, 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.buscandoPlacaEntrante.set(false);
        this.datosTecnicosEntrante.set({
          placa,
          marca: 'VOLKSWAGEN',
          modelo: 'CRAFTER',
          anio_fabricacion: new Date().getFullYear() - 1,
          categoria: 'M2',
          carroceria: 'MINIBUS',
          asientos: 18
        });
        this.snackBar.open(`Placa ${placa} agregada (modo manual)`, 'OK', { duration: 3000 });
      }
    });
  }

  agregarParSustitucion() {
    const saliente = this.placaSalienteTemp();
    const entrante = this.placaEntranteTemp().toUpperCase().trim();
    const dt = this.datosTecnicosEntrante();

    if (!saliente) {
      this.snackBar.open('Seleccione el vehículo saliente a retirar', 'Cerrar', { duration: 3500 });
      return;
    }

    if (!entrante || entrante.length < 5) {
      this.snackBar.open('Ingrese la placa del vehículo entrante', 'Cerrar', { duration: 3500 });
      return;
    }

    if (saliente === entrante) {
      this.snackBar.open('La placa saliente y entrante no pueden ser idénticas', 'Cerrar', { duration: 4000 });
      return;
    }

    const yaExiste = this.paresSustitucion().some(p => p.placa_saliente === saliente || p.placa_entrante === entrante);
    if (yaExiste) {
      this.snackBar.open('Ese vehículo ya está configurado en un par de sustitución', 'Cerrar', { duration: 4000 });
      return;
    }

    // Rutas heredadas del saliente o de la primigenia
    const rutasHeredadas = this.vehiculoSalienteObj()?.rutas && this.vehiculoSalienteObj()?.rutas.length > 0
      ? [...this.vehiculoSalienteObj()!.rutas]
      : [...this.rutasPrimigeniaActiva()];

    const nuevoPar: ParSustitucionUI = {
      placa_saliente: saliente,
      vehiculo_saliente_obj: this.vehiculoSalienteObj(),
      placa_entrante: entrante,
      marca: dt?.marca || 'TOYOTA',
      modelo: dt?.modelo || 'HIACE',
      anio_fabricacion: dt?.anio_fabricacion || new Date().getFullYear() - 2,
      categoria: dt?.categoria || 'M2',
      asientos: dt?.asientos || 15,
      peso_neto: dt?.peso_neto || 2800,
      rutas: rutasHeredadas,
      datos_completos: dt,
      otra_empresa_ruc: this.habilitacionOtraEmpresa()?.ruc,
      otra_empresa_razon: this.habilitacionOtraEmpresa()?.razon_social,
      dar_de_baja_otra_empresa: this.darDeBajaOtraEmpresa(),
      es_misma_empresa: !!this.habilitacionMismaEmpresa(),
      dar_de_baja_misma_empresa: this.darDeBajaMismaEmpresa()
    };

    this.paresSustitucion.update(pares => [...pares, nuevoPar]);
    this.snackBar.open(`✓ Par configurado: Saliente [${saliente}] ➔ Entrante [${entrante}]`, 'OK', { duration: 3500 });

    // Limpiar temporales
    this.placaSalienteTemp.set('');
    this.vehiculoSalienteObj.set(null);
    this.placaEntranteTemp.set('');
    this.datosTecnicosEntrante.set(null);
    this.habilitacionOtraEmpresa.set(null);
    this.habilitacionMismaEmpresa.set(null);
  }

  eliminarParSustitucion(index: number) {
    this.paresSustitucion.update(pares => pares.filter((_, i) => i !== index));
  }

  // --- LÓGICA DE INCREMENTO ---
  buscarDatosVehiculoIncremento() {
    let placa = this.placaIncrementoTemp().toUpperCase().trim();
    if (!placa || placa.length < 5) return;

    if (/^[A-Z0-9]{6}$/.test(placa)) {
      placa = `${placa.substring(0, 3)}-${placa.substring(3)}`;
      this.placaIncrementoTemp.set(placa);
    }

    this.buscandoPlacaIncremento.set(true);

    this.flotaService.verificarPlacaTramite(placa, this.ruc).subscribe({
      next: (res) => {
        this.buscandoPlacaIncremento.set(false);
        const dt = res.datos_tecnicos || {
          marca: 'MERCEDES-BENZ',
          modelo: 'SPRINTER',
          anio_fabricacion: new Date().getFullYear() - 1,
          categoria: 'M2',
          asientos: 19
        };
        this.datosTecnicosIncremento.set({ placa, ...dt });
        this.snackBar.open(`Placa ${placa} verificada`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.buscandoPlacaIncremento.set(false);
        this.datosTecnicosIncremento.set({
          placa,
          marca: 'HYUNDAI',
          modelo: 'H350',
          anio_fabricacion: new Date().getFullYear() - 1,
          categoria: 'M2',
          asientos: 16
        });
      }
    });
  }

  agregarVehiculoIncremento() {
    const dt = this.datosTecnicosIncremento();
    if (!dt || !dt.placa) return;

    const rutas = this.rutasSeleccionadasIncremento().length > 0 
      ? [...this.rutasSeleccionadasIncremento()] 
      : [...this.rutasPrimigeniaActiva()];

    this.vehiculosIncremento.update(list => [...list, { ...dt, rutas }]);
    this.snackBar.open(`✓ Unidad ${dt.placa} añadida al incremento`, 'OK', { duration: 3000 });
    this.placaIncrementoTemp.set('');
    this.datosTecnicosIncremento.set(null);
  }

  eliminarVehiculoIncremento(index: number) {
    this.vehiculosIncremento.update(list => list.filter((_, i) => i !== index));
  }

  // --- LÓGICA DE RENOVACIÓN ---
  toggleTodosRenovacion(checked: boolean) {
    this.vehiculosRenovacionLista.update(list => list.map(v => ({ ...v, seleccionado: checked })));
  }

  toggleVehiculoRenovacion(index: number) {
    this.vehiculosRenovacionLista.update(list => {
      const c = [...list];
      c[index].seleccionado = !c[index].seleccionado;
      return c;
    });
  }

  // --- LÓGICA DE BAJAS ---
  toggleBajaVehiculo(placa: string) {
    this.vehiculosBajaSeleccionados.update(list => {
      if (list.includes(placa)) return list.filter(p => p !== placa);
      return [...list, placa];
    });
  }

  // --- LÓGICA DE CANJE / DUPLICADO ---
  seleccionarVehiculoTuc(v: any) {
    this.vehiculoTucSeleccionado.set(v);
  }

  // --- NAVEGACIÓN Y VALIDACIÓN ---
  puedeAvanzar(paso: number): boolean {
    if (paso === 0) {
      return !!this.primigeniaActiva() && !!this.tramiteSeleccionado();
    }
    if (paso === 1) {
      return this.datosOrigenForm.valid;
    }
    if (paso === 2) {
      const tipo = this.tramiteSeleccionado();
      if (tipo === 'SUSTITUCION') return this.paresSustitucion().length > 0;
      if (tipo === 'INCREMENTO') return this.vehiculosIncremento().length > 0;
      if (tipo === 'RENOVACION') return this.vehiculosRenovacionLista().some(v => v.seleccionado);
      if (tipo === 'BAJAS') return this.vehiculosBajaSeleccionados().length > 0;
      if (tipo === 'CANJE' || tipo === 'DUPLICADO') return !!this.vehiculoTucSeleccionado();
      return true;
    }
    return true;
  }

  avanzarPaso() {
    if (this.puedeAvanzar(this.pasoActual())) {
      this.pasoActual.update(p => Math.min(p + 1, 3));
    }
  }

  retrocederPaso() {
    this.pasoActual.update(p => Math.max(p - 1, 0));
  }

  cerrar() {
    this.closed.emit();
  }

  // --- CONFIRMAR Y PROCESAR TRÁMITE ATÓMICO ---
  confirmar() {
    const tipo = this.tramiteSeleccionado();
    const primigenia = this.primigeniaActiva();
    const origenVal = this.datosOrigenForm.value;

    if (!this.ruc || !tipo || !primigenia) {
      this.snackBar.open('Información incompleta para procesar el trámite', 'Cerrar', { duration: 4000 });
      return;
    }

    const esDeOficio = origenVal.tipo_origen === 'OFICIO' || origenVal.tipo_origen === 'EXPEDIENTE_OFICIO';
    const docOrigen = origenVal.numero_origen || undefined;

    let vehiculosItems: ItemTramiteVehiculo[] = [];
    const payloadExtra: any = {};

    if (tipo === 'SUSTITUCION') {
      if (this.paresSustitucion().length === 0) {
        this.snackBar.open('Configure al menos un par de sustitución', 'Cerrar', { duration: 4000 });
        return;
      }

      vehiculosItems = this.paresSustitucion().map(p => ({
        placa: p.placa_entrante,
        placa_saliente: p.placa_saliente,
        rutas: p.rutas || [],
        tipo_operacion: 'SUSTITUCION',
        datos_tecnicos: {
          placa: p.placa_entrante,
          marca: p.marca,
          modelo: p.modelo,
          anio_fabricacion: p.anio_fabricacion,
          categoria: p.categoria,
          asientos: p.asientos,
          peso_neto: p.peso_neto
        },
        dar_de_baja_otra_empresa: p.dar_de_baja_otra_empresa,
        otra_empresa_ruc: p.otra_empresa_ruc,
        otra_empresa_razon: p.otra_empresa_razon
      }));
    } else if (tipo === 'INCREMENTO') {
      vehiculosItems = this.vehiculosIncremento().map(v => ({
        placa: v.placa,
        rutas: v.rutas || [],
        tipo_operacion: 'INCREMENTO',
        datos_tecnicos: v
      }));
    } else if (tipo === 'RENOVACION') {
      const sel = this.vehiculosRenovacionLista().filter(v => v.seleccionado);
      vehiculosItems = sel.map(v => ({
        placa: v.placa,
        rutas: v.rutas || this.rutasSeleccionadasRenovacion(),
        tipo_operacion: 'RENOVACION',
        numero_tuc: v.numero_tuc
      }));
      payloadExtra.es_renovacion = true;
      payloadExtra.nueva_resolucion_primigenia = this.renovacionForm.value.nueva_resolucion_primigenia;
      payloadExtra.nueva_fecha_emision = this.renovacionForm.value.nueva_fecha_emision;
      payloadExtra.rutas_a_ratificar = this.rutasSeleccionadasRenovacion();
    } else if (tipo === 'BAJAS') {
      vehiculosItems = this.vehiculosBajaSeleccionados().map(placa => ({
        placa,
        rutas: [],
        tipo_operacion: 'BAJA',
        observacion_custom: this.bajaForm.value.motivo_baja
      }));
    } else if (tipo === 'CANJE' || tipo === 'DUPLICADO') {
      const v = this.vehiculoTucSeleccionado();
      vehiculosItems = [{
        placa: v.placa,
        rutas: v.rutas || [],
        tipo_operacion: tipo,
        numero_tuc: v.numero_tuc,
        observacion_custom: this.duplicadoCanjeForm.value.motivo
      }];
    } else if (tipo === 'TRAMITE_GENERAL') {
      const valG = this.tramiteGeneralForm.value;
      payloadExtra.datos_modificacion = {
        codigo_ruta: valG.codigo_ruta,
        nuevo_itinerario: valG.nuevo_itinerario,
        nueva_frecuencia: valG.nueva_frecuencia,
        asunto: valG.asunto_resumen
      };
    }

    const payload: TramiteMasivoRequest = {
      ruc: this.ruc,
      razon_social: this.razonSocial,
      nro_resolucion_primigenia: primigenia,
      tipo_tramite: tipo,
      tipo_origen: origenVal.tipo_origen,
      es_de_oficio: esDeOficio,
      documento_origen: docOrigen,
      num_expediente: !esDeOficio ? docOrigen : undefined,
      fecha_expediente: origenVal.fecha_origen || undefined,
      nro_resolucion_hija: origenVal.nro_resolucion_hija?.trim() || undefined,
      tipo_resolucion_hija: tipo === 'SUSTITUCION' ? 'S' : (tipo === 'INCREMENTO' ? 'I' : (tipo === 'RENOVACION' ? 'R' : 'M')),
      fecha_emision_resolucion: origenVal.fecha_emision_resolucion || undefined,
      vehiculos: vehiculosItems,
      ...payloadExtra
    };

    this.isProcessing.set(true);

    this.flotaService.procesarTramiteMasivo(payload).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        const resHija = res?.nro_resolucion_hija ? ` (Resolución: ${res.nro_resolucion_hija})` : '';
        this.snackBar.open(`✓ Trámite de ${tipo} procesado exitosamente${resHija}`, 'Entendido', {
          duration: 6000
        });

        this.tramiteProcesado.emit(res);
        this.cerrar();
      },
      error: (err) => {
        this.isProcessing.set(false);
        const msg = err.error?.detail || err.message || 'Error al procesar el trámite';
        this.snackBar.open(`⛔ Error: ${msg}`, 'Cerrar', { duration: 7000 });
      }
    });
  }
}
