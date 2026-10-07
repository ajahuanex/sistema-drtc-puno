import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TucService, VariablePlantillaTuc, PlantillaTucCalibradorConfig, PlantillaTucResumen, LineaHorizontalConfig } from '../../services/tuc.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-tuc-studio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './tuc-studio.component.html',
  styleUrls: ['./tuc-studio.component.scss']
})
export class TucStudioComponent implements OnInit {
  protected readonly Math = Math;
  private tucService = inject(TucService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  // Estados reactivos con Signals
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isPrinting = signal<boolean>(false);

  // Configuración de la plantilla
  config = signal<PlantillaTucCalibradorConfig | null>(null);

  // Gestión de múltiples plantillas y persistencia JSON / BD
  plantillas = signal<PlantillaTucResumen[]>([]);
  plantillaActualId = signal<string>('');
  plantillaActual = computed(() => this.plantillas().find(p => p.id === this.plantillaActualId() || p._id === this.plantillaActualId()) || null);
  esPredeterminadaActual = computed(() => this.config()?.activa ?? false);

  // Modal Guardar Como nueva plantilla
  mostrarModalGuardarComo = signal<boolean>(false);
  nombreNuevaPlantilla = signal<string>('');
  descripcionNuevaPlantilla = signal<string>('');
  hacerPredeterminadaNueva = signal<boolean>(false);
  guardandoNuevaPlantilla = signal<boolean>(false);

  selectedVariables = signal<VariablePlantillaTuc[]>([]);
  selectedVariable = computed(() => this.selectedVariables().length > 0 ? this.selectedVariables()[this.selectedVariables().length - 1] : null);
  esMultipleSeleccion = computed(() => this.selectedVariables().length > 1);
  totalSeleccionados = computed(() => this.selectedVariables().length);

  // Filtros y vistas
  filtroVariable = signal<string>('');
  modoVista = signal<'tags' | 'reales'>('reales');
  tabInspector = signal<'propiedades' | 'codigo'>('propiedades');
  zoom = signal<number>(100);
  guiasSmart = signal<boolean>(true);
  guiasMargenes = signal<boolean>(true);
  reglasMm = signal<boolean>(true);
  rejilla = signal<boolean>(true);

  // Estado de Arrastre con Ratón (Drag & Drop interactivo)
  isDragging = signal<boolean>(false);
  dragDeltaMm = signal<{ x: number, y: number }>({ x: 0, y: 0 });
  private startMouseX = 0;
  private startMouseY = 0;
  private initialPositions = new Map<string, { x: number, y: number }>();

  // Dimensiones de hoja completa
  anchoHojaMm = computed(() => {
    const f = this.formatoPapel();
    const orient = this.orientacion();
    if (f === 'DUAL_PVC') return 85.6;
    return orient === 'landscape' ? 297.0 : 210.0;
  });

  altoHojaMm = computed(() => {
    const f = this.formatoPapel();
    const orient = this.orientacion();
    if (f === 'DUAL_PVC') return 108.0;
    return orient === 'landscape' ? 210.0 : 297.0;
  });

  // Modo de Distribución de Hojas (1 Hoja vs 2 Hojas separadas Anverso/Reverso)
  modoHojas = computed(() => this.config()?.modo_hojas || 'UNA_HOJA');
  margenIzq = computed(() => this.config()?.margen_izq_mm ?? 10.0);
  margenDer = computed(() => this.config()?.margen_der_mm ?? 10.0);
  margenTop = computed(() => this.config()?.margen_top_mm ?? 10.0);
  margenBottom = computed(() => this.config()?.margen_bottom_mm ?? 10.0);
  guiasReferencialesH = signal<boolean>(true);

  // Configuración de la Línea Horizontal Superior (Límite de Inicio de Contenido)
  vincularContenidoALimiteH = signal<boolean>(true);

  lineaHConfig = computed<LineaHorizontalConfig>(() => {
    const c = this.config();
    if (c?.linea_horizontal) {
      return c.linea_horizontal;
    }
    const f = this.formatoPapel();
    const yDefault = f === 'DUAL_PVC' ? 20.0 : 50.0;
    const anchoDefault = this.anchoHojaMm();
    return {
      activa: true,
      y_mm: yDefault,
      x_mm: 0.0,
      ancho_mm: anchoDefault,
      grosor_mm: 1.0,
      color: '#2563eb',
      estilo: 'dashed',
      imprimible: false,
      etiqueta: 'Línea Límite Superior (Inicio de Contenido)',
      limitar_contenido_superior: true
    };
  });

  lineaHSeleccionada = signal<boolean>(false);
  isDraggingLineaH = signal<boolean>(false);

  // Eje de referencia horizontal (mitad de hoja horizontal o pliegue referencial)
  referenciaHorizontalMm = computed(() => {
    return this.lineaHConfig().y_mm;
  });

  // Estado para exportación y generación PDF
  isGeneratingPdf = signal<boolean>(false);
  mostrarModalLotePdf = signal<boolean>(false);
  placasLoteTexto = signal<string>('VBE-959\nZ4B-960\nX1Y-234');
  generandoLotePdf = signal<boolean>(false);

  // Elementos por Sección
  varsAnverso = computed(() => this.config()?.variables?.filter(v => v.visible && v.seccion === 'anverso') || []);
  varsReverso = computed(() => this.config()?.variables?.filter(v => v.visible && v.seccion === 'reverso') || []);

  // Vehículo de prueba en tiempo real
  searchPlaca = signal<string>('VBE-959');
  datosVehiculo = signal<any>(null);
  placeholdersVehiculo = signal<Record<string, string>>({});
  rutasVehiculo = signal<any[]>([]);

  // Modal para agregar nueva variable
  mostrarModalNuevaVar = signal<boolean>(false);
  autoDesplazarTextoInferior = signal<boolean>(true);
  nuevaVarForm: Partial<VariablePlantillaTuc> = {
    id: '',
    tag: '',
    label: '',
    categoria: 'personalizado',
    seccion: 'anverso',
    x_mm: 20.0,
    y_mm: 20.0,
    font_size_pt: 7.0,
    font_weight: 'normal',
    etiqueta_font_weight: 'bold',
    max_lineas: 1,
    resaltar_comillas: true,
    color: '#000000',
    align: 'left',
    visible: true,
    prefix: '',
    suffix: '',
    valor_ejemplo: 'EJEMPLO'
  };

  // Formato de Papel y Orientación
  formatoPapel = computed(() => this.config()?.formato_papel || 'DUAL_PVC');
  orientacion = computed(() => this.config()?.orientacion || 'portrait');

  // Presets de imágenes institucionales
  presetsImagenes = [
    { label: 'Emblema Transporte Puno', url: 'assets/images/logo_transporte_puno.png' },
    { label: 'Logo DRTC Puno', url: '/assets/images/drtc-logo-light.png' },
    { label: 'Escudo Región Puno', url: '/assets/images/escudo-region-puno.png' },
    { label: 'Sello de Circulación', url: '/assets/images/sello-circulacion.png' },
    { label: 'Logo MTC Oficial', url: '/assets/images/mtc-logo.png' },
    { label: 'Logo Principal DRTC', url: '/assets/logo.png' }
  ];

  // Modales para agregar elementos
  mostrarModalImagen = signal<boolean>(false);
  nuevaImagenForm: Partial<VariablePlantillaTuc> = {
    tag: '{{LOGO_NUEVO}}',
    label: 'Logo / Imagen Institucional',
    seccion: 'anverso',
    tipo: 'imagen',
    categoria: 'personalizado',
    imagen_url: '/assets/images/drtc-logo-light.png',
    x_mm: 10.0,
    y_mm: 10.0,
    width_mm: 18.0,
    height_mm: 15.0,
    opacidad: 1.0,
    visible: true
  };

  mostrarModalQR = signal<boolean>(false);
  nuevoQRForm: Partial<VariablePlantillaTuc> = {
    tag: '{{QR_VALIDACION}}',
    label: 'Código QR de Validación TUC',
    seccion: 'reverso',
    tipo: 'qr',
    categoria: 'personalizado',
    qr_contenido: 'https://drtc-puno.gob.pe/verificar-tuc/{{PLACA}}',
    x_mm: 10.0,
    y_mm: 90.0,
    width_mm: 16.0,
    height_mm: 16.0,
    visible: true
  };

  // Variables filtradas computadas
  variablesFiltradas = computed(() => {
    const c = this.config();
    if (!c) return [];
    const q = this.filtroVariable().toLowerCase().trim();
    if (!q) return c.variables;
    return c.variables.filter(v =>
      v.tag.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q)
    );
  });

  // Agrupaciones de variables
  varsGraficos = computed(() => this.variablesFiltradas().filter(v => v.tipo === 'imagen' || v.tipo === 'qr' || v.tipo === 'linea' || v.categoria === 'imagen' || v.categoria === 'qr' || (v as any).categoria === 'graficos'));
  varsAutorizacion = computed(() => this.variablesFiltradas().filter(v => v.categoria === 'autorizacion' && v.tipo !== 'imagen' && v.tipo !== 'qr' && v.tipo !== 'linea'));
  varsVehiculo = computed(() => this.variablesFiltradas().filter(v => v.categoria === 'vehiculo' && v.tipo !== 'imagen' && v.tipo !== 'qr' && v.tipo !== 'linea'));
  varsRutas = computed(() => this.variablesFiltradas().filter(v => v.categoria === 'rutas' && v.tipo !== 'imagen' && v.tipo !== 'qr' && v.tipo !== 'linea'));
  varsActoReverso = computed(() => this.variablesFiltradas().filter(v => v.categoria === 'acto_reverso' && v.tipo !== 'imagen' && v.tipo !== 'qr' && v.tipo !== 'linea'));
  varsPersonalizadas = computed(() => this.variablesFiltradas().filter(v => (v.categoria === 'personalizado' || v.es_dinamica) && v.tipo !== 'imagen' && v.tipo !== 'qr' && v.tipo !== 'linea'));

  ngOnInit(): void {
    this.cargarPlantillas();
    this.cargarDatosVehiculoPrueba(this.searchPlaca());
  }

  cargarPlantillas(seleccionarId?: string): void {
    this.isLoading.set(true);
    this.tucService.getPlantillas().subscribe({
      next: (list) => {
        this.plantillas.set(list || []);
        let targetId = seleccionarId;
        if (!targetId) {
          const activa = list.find(p => p.activa);
          targetId = activa ? activa.id : (list.length > 0 ? list[0].id : undefined);
        }
        if (targetId) {
          this.plantillaActualId.set(targetId);
          this.cargarConfiguracion(targetId);
        } else {
          this.cargarConfiguracion();
        }
      },
      error: (err) => {
        console.error('Error al listar plantillas:', err);
        this.cargarConfiguracion();
      }
    });
  }

  cargarConfiguracion(plantillaId?: string): void {
    this.isLoading.set(true);
    const targetId = plantillaId || this.plantillaActualId() || undefined;
    this.tucService.getCalibradorConfig(targetId).subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        if (cfg.id) {
          this.plantillaActualId.set(cfg.id);
        }
        if (cfg.variables && cfg.variables.length > 0) {
          const placaVar = cfg.variables.find(v => v.id === 'placa') || cfg.variables[0];
          this.selectedVariables.set([placaVar]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar calibrador:', err);
        this.snackBar.open('Error al cargar configuración de la plantilla', 'Cerrar', { duration: 4000 });
        this.isLoading.set(false);
      }
    });
  }

  cambiarPlantilla(id: string): void {
    if (!id || id === this.plantillaActualId()) return;
    this.plantillaActualId.set(id);
    this.cargarConfiguracion(id);
  }

  cargarDatosVehiculoPrueba(placa: string): void {
    if (!placa || !placa.trim()) return;
    this.tucService.getDatosImpresion(placa.trim()).subscribe({
      next: (res) => {
        this.datosVehiculo.set(res.datos || {});
        this.placeholdersVehiculo.set(res.placeholders || {});
        this.rutasVehiculo.set(res.datos?.rutas_detalle || []);
      },
      error: (err) => {
        console.warn('Vehículo de prueba no encontrado en flota, usando placeholders base:', err);
      }
    });
  }

  estaSeleccionada(v: VariablePlantillaTuc): boolean {
    return this.selectedVariables().some(item => item.id === v.id);
  }

  seleccionarVariable(v: VariablePlantillaTuc, event?: MouseEvent): void {
    this.lineaHSeleccionada.set(false);
    if (event && (event.ctrlKey || event.shiftKey)) {
      this.toggleSeleccion(v);
      return;
    }
    this.selectedVariables.set([v]);
  }

  toggleSeleccion(v: VariablePlantillaTuc): void {
    const current = this.selectedVariables();
    const exists = current.some(item => item.id === v.id);
    if (exists) {
      this.selectedVariables.set(current.filter(item => item.id !== v.id));
    } else {
      this.selectedVariables.set([...current, v]);
    }
  }

  seleccionarTodasLasVariables(): void {
    const c = this.config();
    if (!c) return;
    this.selectedVariables.set(c.variables.filter(v => v.visible));
    this.snackBar.open(`${this.selectedVariables().length} elementos seleccionados`, 'OK', { duration: 2000 });
  }

  deseleccionarTodas(): void {
    this.selectedVariables.set([]);
  }

  // --- ARRASTRE CON RATÓN (DRAG & DROP REAL-TIME CON MOUSE) ---
  iniciarArrastre(v: VariablePlantillaTuc, event: MouseEvent): void {
    if (event.button !== 0) return; // Solo clic izquierdo

    // Si tiene tecla modificadora Ctrl/Shift, alternar selección
    if (event.ctrlKey || event.shiftKey) {
      this.toggleSeleccion(v);
      event.stopPropagation();
      return;
    }

    // Si no estaba en la selección, seleccionarlo
    if (!this.estaSeleccionada(v)) {
      this.selectedVariables.set([v]);
    }

    event.stopPropagation();
    event.preventDefault();

    this.isDragging.set(true);
    this.startMouseX = event.clientX;
    this.startMouseY = event.clientY;
    this.dragDeltaMm.set({ x: 0, y: 0 });

    this.initialPositions.clear();
    for (const item of this.selectedVariables()) {
      if (!item.bloqueado) {
        this.initialPositions.set(item.id, { x: item.x_mm, y: item.y_mm });
      }
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      // 96 DPI / 25.4 = 3.779527559 px por mm estándar CSS
      const pxPerMm = 3.779527559;
      const scale = (this.zoom() / 100) * pxPerMm;
      const deltaX = (moveEvent.clientX - this.startMouseX) / scale;
      const deltaY = (moveEvent.clientY - this.startMouseY) / scale;

      // Paso de 0.5 mm si la rejilla está activa
      const step = this.rejilla() ? 0.5 : 0.1;
      const snapDeltaX = Math.round(deltaX / step) * step;
      const snapDeltaY = Math.round(deltaY / step) * step;

      this.dragDeltaMm.set({ x: snapDeltaX, y: snapDeltaY });

      for (const item of this.selectedVariables()) {
        const init = this.initialPositions.get(item.id);
        if (init) {
          item.x_mm = Math.max(0, Math.round((init.x + snapDeltaX) * 10) / 10);
          const minYPermitido = (this.lineaHConfig().activa && item.tipo !== 'imagen' && item.tipo !== 'linea') ? this.lineaHConfig().y_mm : 0;
          item.y_mm = Math.max(minYPermitido, Math.round((init.y + snapDeltaY) * 10) / 10);
        }
      }
      this.notificarCambio();
    };

    const onMouseUp = () => {
      this.isDragging.set(false);
      this.dragDeltaMm.set({ x: 0, y: 0 });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.notificarCambio();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // --- MÁRGENES Y ALINEACIÓN RÁPIDA ---
  ajustarMargen(lado: 'margen_izq_mm' | 'margen_der_mm' | 'margen_top_mm' | 'margen_bottom_mm', delta: number): void {
    const c = this.config();
    if (!c) return;
    const actual = c[lado] ?? 10.0;
    const nuevo = Math.max(0, Math.min(60, Math.round((actual + delta) * 10) / 10));
    c[lado] = nuevo;
    this.config.set({ ...c });
  }

  alinearAMargenIzquierdo(): void {
    const c = this.config();
    if (!c) return;
    const margen = c.margen_izq_mm ?? 10.0;
    for (const v of this.selectedVariables()) {
      if (!v.bloqueado) {
        v.x_mm = margen;
      }
    }
    this.notificarCambio();
    this.snackBar.open(`Elementos alineados al margen izquierdo (${margen}mm)`, 'OK', { duration: 2000 });
  }

  centrarEntreMargenes(): void {
    const c = this.config();
    if (!c) return;
    const margenIzq = c.margen_izq_mm ?? 10.0;
    const margenDer = c.margen_der_mm ?? 10.0;
    const anchoDisponible = c.ancho_mm - margenIzq - margenDer;
    for (const v of this.selectedVariables()) {
      if (!v.bloqueado) {
        const w = v.width_mm || 20.0;
        v.x_mm = Math.max(0, Math.round((margenIzq + (anchoDisponible - w) / 2) * 10) / 10);
      }
    }
    this.notificarCambio();
    this.snackBar.open('Elementos centrados entre márgenes', 'OK', { duration: 2000 });
  }

  alinearAMargenDerecho(): void {
    const c = this.config();
    if (!c) return;
    const margenDer = c.margen_der_mm ?? 10.0;
    for (const v of this.selectedVariables()) {
      if (!v.bloqueado) {
        const w = v.width_mm || 20.0;
        v.x_mm = Math.max(0, Math.round((c.ancho_mm - margenDer - w) * 10) / 10);
      }
    }
    this.notificarCambio();
    this.snackBar.open(`Elementos alineados al margen derecho (${margenDer}mm)`, 'OK', { duration: 2000 });
  }

  // --- MODO 2 HOJAS (HOJA 1: ANVERSO, HOJA 2: REVERSO) ---
  cambiarModoHojas(modo: 'UNA_HOJA' | 'DOS_HOJAS'): void {
    const c = this.config();
    if (!c) return;
    c.modo_hojas = modo;
    this.config.set({ ...c });
    this.snackBar.open(
      modo === 'DOS_HOJAS'
        ? 'Modo 2 Hojas activo: Hoja 1 (Anverso) y Hoja 2 (Reverso) para impresión separada o dúplex'
        : 'Modo 1 Hoja activo: Anverso y Reverso juntos en una sola página',
      'OK',
      { duration: 3000 }
    );
  }

  toggleVisibilidad(v: VariablePlantillaTuc, event: Event): void {
    event.stopPropagation();
    v.visible = !v.visible;
    this.notificarCambio();
  }

  toggleBloqueo(v: VariablePlantillaTuc, event: Event): void {
    event.stopPropagation();
    v.bloqueado = !v.bloqueado;
    this.notificarCambio();
  }

  eliminarVariable(v: VariablePlantillaTuc, event: Event): void {
    event.stopPropagation();
    const c = this.config();
    if (!c) return;
    if (confirm(`¿Eliminar la variable "${v.label}" (${v.tag})?`)) {
      c.variables = c.variables.filter(item => item.id !== v.id);
      this.config.set({ ...c });
      this.selectedVariables.set(this.selectedVariables().filter(item => item.id !== v.id));
      this.snackBar.open(`Variable ${v.tag} eliminada`, 'OK', { duration: 2500 });
    }
  }

  notificarCambio(): void {
    const c = this.config();
    if (c) {
      this.config.set({ ...c });
    }
  }


  // --- MÉTODOS DE CALIBRACIÓN DE LÍNEA HORIZONTAL SUPERIOR (LÍMITE DE INICIO) ---
  seleccionarLineaHorizontal(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.lineaHSeleccionada.set(true);
    this.selectedVariables.set([]);
  }

  deseleccionarLineaHorizontal(): void {
    this.lineaHSeleccionada.set(false);
  }

  toggleLineaHorizontal(): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    c.linea_horizontal.activa = !c.linea_horizontal.activa;
    this.config.set({ ...c });
  }

  // Obtiene el menor Y actual del contenido (excluyendo líneas horizontales decorativas)
  obtenerMinYContenido(seccion: 'anverso' | 'reverso' = 'anverso'): number {
    const c = this.config();
    if (!c) return 0;
    const vars = c.variables.filter(v => v.visible && v.tipo !== 'linea' && (c.modo_hojas === 'UNA_HOJA' || v.seccion === seccion));
    if (vars.length === 0) return 0;
    return Math.min(...vars.map(v => v.y_mm));
  }

  // Desplaza todo el contenido de variables para que inicie exactamente a partir de la Línea Horizontal Superior (Y)
  alinearContenidoALimiteSuperior(seccion: 'anverso' | 'reverso' = 'anverso'): void {
    const c = this.config();
    if (!c) return;
    const limiteY = this.lineaHConfig().y_mm;
    const vars = c.variables.filter(v => v.visible && v.tipo !== 'linea' && (c.modo_hojas === 'UNA_HOJA' || v.seccion === seccion));
    if (vars.length === 0) {
      this.snackBar.open('No hay variables visibles para alinear', 'Cerrar', { duration: 2500 });
      return;
    }
    const minY = Math.min(...vars.map(v => v.y_mm));
    const delta = Math.round((limiteY - minY) * 10) / 10;
    if (Math.abs(delta) < 0.05) {
      this.snackBar.open(`El contenido ya inicia exactamente en Y = ${limiteY} mm`, 'OK', { duration: 2500 });
      return;
    }
    for (const v of vars) {
      if (!v.bloqueado) {
        v.y_mm = Math.max(0, Math.round((v.y_mm + delta) * 10) / 10);
      }
    }
    this.config.set({ ...c });
    this.snackBar.open(`¡Contenido alineado con éxito! El bloque de variables ahora inicia en Y = ${limiteY} mm`, 'OK', { duration: 3000 });
  }

  // Desplaza en bloque el contenido verticalmente
  desplazarContenidoBloque(deltaY: number, seccion: 'anverso' | 'reverso' = 'anverso'): void {
    const c = this.config();
    if (!c || Math.abs(deltaY) < 0.01) return;
    const vars = c.variables.filter(v => v.visible && v.tipo !== 'linea' && (c.modo_hojas === 'UNA_HOJA' || v.seccion === seccion));
    for (const v of vars) {
      if (!v.bloqueado) {
        v.y_mm = Math.max(0, Math.round((v.y_mm + deltaY) * 10) / 10);
      }
    }
  }

  ajustarLineaH(prop: 'y_mm' | 'x_mm' | 'ancho_mm' | 'grosor_mm', delta: number): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    const valActual = c.linea_horizontal[prop] ?? 0;
    let nuevoVal = Math.round((valActual + delta) * 10) / 10;
    if (prop === 'grosor_mm') {
      nuevoVal = Math.max(0.1, Math.min(10.0, nuevoVal));
    } else if (prop === 'ancho_mm') {
      nuevoVal = Math.max(5.0, Math.min(this.anchoHojaMm() * 1.5, nuevoVal));
    } else if (prop === 'y_mm') {
      nuevoVal = Math.max(0, Math.min(this.altoHojaMm(), nuevoVal));
      if (this.vincularContenidoALimiteH()) {
        const deltaReal = Math.round((nuevoVal - valActual) * 10) / 10;
        this.desplazarContenidoBloque(deltaReal);
      }
    }
    c.linea_horizontal[prop] = nuevoVal;
    this.config.set({ ...c });
  }

  ajustarLineaHDirecto(prop: 'y_mm' | 'x_mm' | 'ancho_mm' | 'grosor_mm', valor: any): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    const num = parseFloat(valor);
    if (!isNaN(num)) {
      if (prop === 'y_mm' && this.vincularContenidoALimiteH()) {
        const valActual = c.linea_horizontal.y_mm ?? 0;
        const deltaReal = Math.round((num - valActual) * 10) / 10;
        this.desplazarContenidoBloque(deltaReal);
      }
      c.linea_horizontal[prop] = num;
      this.config.set({ ...c });
    }
  }

  setLineaHColor(color: string): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    c.linea_horizontal.color = color;
    this.config.set({ ...c });
  }

  setLineaHEstilo(estilo: 'solid' | 'dashed' | 'dotted'): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    c.linea_horizontal.estilo = estilo;
    this.config.set({ ...c });
  }

  setLineaHImprimible(val: boolean): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    c.linea_horizontal.imprimible = val;
    this.config.set({ ...c });
  }

  centrarLineaH(): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    const w = c.linea_horizontal.ancho_mm || this.anchoHojaMm();
    c.linea_horizontal.x_mm = Math.max(0, Math.round(((this.anchoHojaMm() - w) / 2) * 10) / 10);
    this.config.set({ ...c });
  }

  ajustarLineaHAnchoCompleto(): void {
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    c.linea_horizontal.x_mm = 0.0;
    c.linea_horizontal.ancho_mm = this.anchoHojaMm();
    this.config.set({ ...c });
  }

  iniciarArrastreLineaH(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.seleccionarLineaHorizontal();
    this.isDraggingLineaH.set(true);

    const startClientY = event.clientY;
    const c = this.config();
    if (!c) return;
    if (!c.linea_horizontal) {
      c.linea_horizontal = { ...this.lineaHConfig() };
    }
    const startYMm = c.linea_horizontal.y_mm;

    // Guardar mapa de posiciones iniciales de variables para arrastre sincronizado
    const initialVarMap = new Map<string, number>();
    for (const v of c.variables) {
      if (v.visible && v.tipo !== 'linea' && !v.bloqueado) {
        initialVarMap.set(v.id, v.y_mm);
      }
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      const pxPerMm = 3.779527559;
      const scale = (this.zoom() / 100) * pxPerMm;
      const deltaY = (moveEvent.clientY - startClientY) / scale;
      const step = this.rejilla() ? 0.5 : 0.1;
      const snapDeltaY = Math.round(deltaY / step) * step;
      const newY = Math.max(0, Math.min(this.altoHojaMm(), Math.round((startYMm + snapDeltaY) * 10) / 10));
      const deltaReal = Math.round((newY - startYMm) * 10) / 10;

      c.linea_horizontal!.y_mm = newY;

      // Si la vinculación está activa, desplazar en tiempo real todo el contenido
      if (this.vincularContenidoALimiteH()) {
        for (const v of c.variables) {
          const initY = initialVarMap.get(v.id);
          if (initY !== undefined) {
            v.y_mm = Math.max(0, Math.round((initY + deltaReal) * 10) / 10);
          }
        }
      }

      this.config.set({ ...c });
    };

    const onMouseUp = () => {
      this.isDraggingLineaH.set(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      this.notificarCambio();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  agregarNuevaLineaHorizontal(): void {
    const c = this.config();
    if (!c) return;
    const yPos = this.formatoPapel() === 'DUAL_PVC' ? 54.0 : 100.0;
    const nuevaLinea: VariablePlantillaTuc = {
      id: `linea_h_${Date.now()}`,
      tag: '{{LINEA_H}}',
      label: 'Línea Horizontal Separadora',
      categoria: 'personalizado',
      seccion: 'anverso',
      tipo: 'linea',
      x_mm: c.margen_izq_mm || 10.0,
      y_mm: yPos,
      width_mm: (c.ancho_mm - (c.margen_izq_mm || 10) - (c.margen_der_mm || 10)),
      height_mm: 1.0,
      grosor_mm: 1.0,
      estilo_linea: 'solid',
      color: '#000000',
      font_size_pt: 0,
      font_weight: 'normal',
      align: 'left',
      visible: true,
      imprimible: true
    };
    c.variables.push(nuevaLinea);
    this.config.set({ ...c });
    this.selectedVariables.set([nuevaLinea]);
    this.lineaHSeleccionada.set(false);
    this.snackBar.open('Línea horizontal agregada a la plantilla', 'OK', { duration: 2500 });
  }

  // Modificar propiedades numéricas con pasos (afecta a todos los seleccionados)
  ajustarCoordenada(campo: 'x_mm' | 'y_mm' | 'font_size_pt', delta: number): void {
    const list = this.selectedVariables();
    if (list.length === 0) return;
    for (const sel of list) {
      if (!sel.bloqueado) {
        const nuevo = Math.round(((sel[campo] || 0) + delta) * 10) / 10;
        if (nuevo >= 0) {
          sel[campo] = nuevo;
        }
      }
    }
    this.notificarCambio();
  }

  // Guardar en Backend y sincronizar archivo JSON
  guardarConfiguracion(): void {
    const c = this.config();
    if (!c) return;
    this.isSaving.set(true);
    const id = c.id || this.plantillaActualId();
    const obs = id ? this.tucService.actualizarPlantilla(id, c) : this.tucService.guardarCalibradorConfig(c);
    obs.subscribe({
      next: (res) => {
        this.config.set(res);
        this.isSaving.set(false);
        this.snackBar.open('¡Plantilla guardada y sincronizada en BD y archivo JSON!', 'OK', { duration: 3000 });
        this.cargarPlantillas(res.id);
      },
      error: (err) => {
        console.error('Error al guardar calibrador:', err);
        this.isSaving.set(false);
        this.snackBar.open('Error al guardar calibración', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Restablecer valores de fábrica
  restablecerOficial(): void {
    if (!confirm('¿Restablecer todas las variables y coordenadas a los valores oficiales de DRTC Puno? Se sincronizará en BD y JSON.')) {
      return;
    }
    this.isLoading.set(true);
    this.tucService.restablecerCalibradorConfig().subscribe({
      next: (res) => {
        this.config.set(res);
        if (res.variables && res.variables.length > 0) {
          this.selectedVariables.set([res.variables[0]]);
        }
        this.isLoading.set(false);
        this.snackBar.open('Plantilla restablecida a coordenadas oficiales (BD y JSON actualizados)', 'OK', { duration: 3000 });
        this.cargarPlantillas(res.id);
      },
      error: (err) => {
        console.error('Error al restablecer:', err);
        this.isLoading.set(false);
        this.snackBar.open('Error al restablecer plantilla', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // --- MÉTODOS DE GESTIÓN MULTI-PLANTILLA ---
  abrirModalGuardarComo(): void {
    const baseNombre = this.config()?.nombre || 'Plantilla TUC';
    this.nombreNuevaPlantilla.set(`${baseNombre} (Copia)`);
    this.descripcionNuevaPlantilla.set(this.config()?.descripcion || 'Plantilla calibrada');
    this.hacerPredeterminadaNueva.set(false);
    this.mostrarModalGuardarComo.set(true);
  }

  cerrarModalGuardarComo(): void {
    this.mostrarModalGuardarComo.set(false);
  }

  confirmarGuardarComo(): void {
    const nombre = this.nombreNuevaPlantilla().trim();
    if (!nombre) {
      this.snackBar.open('Por favor ingresa un nombre para la nueva plantilla', 'Cerrar', { duration: 3000 });
      return;
    }
    const current = this.config();
    if (!current) return;

    this.guardandoNuevaPlantilla.set(true);
    const payload: Partial<PlantillaTucCalibradorConfig> = {
      ...current,
      nombre: nombre,
      descripcion: this.descripcionNuevaPlantilla().trim(),
      activa: this.hacerPredeterminadaNueva()
    };
    delete payload._id;
    delete payload.id;

    this.tucService.crearPlantilla(payload).subscribe({
      next: (nueva) => {
        this.guardandoNuevaPlantilla.set(false);
        this.mostrarModalGuardarComo.set(false);
        this.snackBar.open(`¡Plantilla "${nueva.nombre}" guardada en BD y en tuc_plantillas_catalogo.json!`, 'OK', { duration: 3500 });
        this.cargarPlantillas(nueva.id);
      },
      error: (err) => {
        console.error('Error al crear plantilla:', err);
        this.guardandoNuevaPlantilla.set(false);
        this.snackBar.open('Error al crear la nueva plantilla', 'Cerrar', { duration: 4000 });
      }
    });
  }

  activarComoPredeterminada(): void {
    const id = this.plantillaActualId();
    if (!id) return;
    this.tucService.activarPlantilla(id).subscribe({
      next: (res) => {
        this.snackBar.open(`"${res.nombre}" fijada como plantilla predeterminada del sistema (BD y JSON sincronizados)`, 'OK', { duration: 3000 });
        this.cargarPlantillas(id);
      },
      error: (err) => {
        console.error('Error al activar plantilla:', err);
        this.snackBar.open('Error al establecer plantilla como predeterminada', 'Cerrar', { duration: 3500 });
      }
    });
  }

  eliminarPlantillaActual(): void {
    const id = this.plantillaActualId();
    if (!id) return;
    if (this.plantillas().length <= 1) {
      this.snackBar.open('No es posible eliminar la única plantilla del sistema', 'OK', { duration: 3000 });
      return;
    }
    const nombre = this.config()?.nombre || 'esta plantilla';
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"? Esta acción se sincronizará en la base de datos y en el archivo JSON.`)) {
      return;
    }
    this.tucService.eliminarPlantilla(id).subscribe({
      next: () => {
        this.snackBar.open(`Plantilla "${nombre}" eliminada exitosamente (BD y JSON sincronizados)`, 'OK', { duration: 3000 });
        this.cargarPlantillas();
      },
      error: (err) => {
        console.error('Error al eliminar plantilla:', err);
        this.snackBar.open('Error al eliminar plantilla', 'Cerrar', { duration: 3500 });
      }
    });
  }

  exportarJson(): void {
    const cfg = this.config();
    if (!cfg) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cfg, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tuc_plantilla_${cfg.id || 'config'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.snackBar.open('Archivo JSON descargado al equipo local', 'OK', { duration: 2500 });
  }

  // Impresión Instantánea HTML
  imprimirHtmlInstantaneo(): void {
    const placa = this.searchPlaca().trim() || 'VBE-959';
    this.isPrinting.set(true);
    const cfg = this.config();
    if (cfg) {
      this.tucService.imprimirHtmlConConfig(placa, cfg);
    } else {
      this.tucService.imprimirHtmlDirecto(placa);
    }
    setTimeout(() => {
      this.isPrinting.set(false);
    }, 1200);
  }

  // Exportar TUC a PDF directamente en el navegador
  async guardarEnPdf(): Promise<void> {
    const sheet = document.getElementById('tuc-physical-sheet');
    if (!sheet) {
      this.snackBar.open('No se encontró el lienzo para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isGeneratingPdf.set(true);
    try {
      const formato = this.formatoPapel();
      const orient = this.orientacion();
      const isLandscape = orient === 'landscape';

      // Dimensiones exactas en mm
      const anchoMm = this.config()?.ancho_mm || (formato === 'A4' ? (isLandscape ? 297.0 : 210.0) : 85.6);
      const altoMm = this.config()?.alto_mm || (formato === 'A4' ? (isLandscape ? 210.0 : 297.0) : 108.0);

      // Desactivar temporalmente selección y guías para que no salgan en el PDF oficial
      const sel = [...this.selectedVariables()];
      this.selectedVariables.set([]);
      const guiasMargenPrev = this.guiasMargenes();
      const guiasRefPrev = this.guiasReferencialesH();
      this.guiasMargenes.set(false);
      this.guiasReferencialesH.set(false);

      // Esperar brevemente actualización del DOM
      await new Promise(r => setTimeout(r, 60));

      const canvas = await html2canvas(sheet, {
        scale: 3, // Calidad de impresión ultra nítida (300+ DPI equivalente)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restaurar selección y guías
      this.selectedVariables.set(sel);
      this.guiasMargenes.set(guiasMargenPrev);
      this.guiasReferencialesH.set(guiasRefPrev);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [anchoMm, altoMm]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, anchoMm, altoMm);
      const placa = this.searchPlaca().trim() || 'TUC_DRTC';
      pdf.save(`TUC_${placa}_${formato}.pdf`);

      this.snackBar.open(`¡Documento PDF guardado exitosamente: TUC_${placa}_${formato}.pdf!`, 'OK', { duration: 3500 });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      this.snackBar.open('Error al generar el documento PDF', 'Cerrar', { duration: 3500 });
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  // Modales de Impresión de Lote (Múltiples Hojas / PDF)
  abrirModalLotePdf(): void {
    const actual = this.searchPlaca()?.trim();
    if (actual && !this.placasLoteTexto().includes(actual)) {
      this.placasLoteTexto.set(`${actual}\n${this.placasLoteTexto()}`);
    }
    this.mostrarModalLotePdf.set(true);
  }

  cerrarModalLotePdf(): void {
    this.mostrarModalLotePdf.set(false);
  }

  generarLotePdf(): void {
    const lineas = this.placasLoteTexto()
      .split(/[\n,;]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (lineas.length === 0) {
      this.snackBar.open('Ingresa al menos una placa para generar el lote', 'Cerrar', { duration: 3000 });
      return;
    }

    this.generandoLotePdf.set(true);
    const cfg = this.config();
    this.tucService.imprimirLoteDirecto(lineas, cfg || undefined);
    setTimeout(() => {
      this.generandoLotePdf.set(false);
      this.mostrarModalLotePdf.set(false);
      this.snackBar.open(`¡Documento de lote con ${lineas.length} TUCs generado en múltiples hojas! Listo para imprimir o Guardar como PDF`, 'OK', { duration: 4000 });
    }, 1000);
  }

  // Abrir modal nueva variable
  abrirModalNuevaVariable(): void {
    this.nuevaVarForm = {
      id: `var_${Date.now()}`,
      tag: '{{NUEVA_VAR}}',
      label: 'Nuevo Campo Personalizado',
      categoria: 'personalizado',
      seccion: 'anverso',
      x_mm: 20.0,
      y_mm: 20.0,
      font_size_pt: 7.0,
      font_weight: 'normal',
      color: '#000000',
      align: 'left',
      visible: true,
      prefix: '',
      suffix: '',
      es_dinamica: true,
      valor_ejemplo: 'Texto de prueba'
    };
    this.mostrarModalNuevaVar.set(true);
  }

  cerrarModalNuevaVariable(): void {
    this.mostrarModalNuevaVar.set(false);
  }

  guardarNuevaVariable(): void {
    if (!this.nuevaVarForm.tag || !this.nuevaVarForm.label) {
      this.snackBar.open('Debe especificar tag y etiqueta', 'Cerrar', { duration: 3000 });
      return;
    }

    let tag = this.nuevaVarForm.tag.trim().toUpperCase();
    if (!tag.startsWith('{{')) tag = '{{' + tag;
    if (!tag.endsWith('}}')) tag = tag + '}}';

    const id = this.nuevaVarForm.id?.trim() || tag.replace(/[{}]/g, '').toLowerCase();

    const nueva: VariablePlantillaTuc = {
      id: id,
      tag: tag,
      label: this.nuevaVarForm.label.trim(),
      categoria: this.nuevaVarForm.categoria || 'personalizado',
      seccion: this.nuevaVarForm.seccion || 'anverso',
      x_mm: Number(this.nuevaVarForm.x_mm) || 20.0,
      y_mm: Number(this.nuevaVarForm.y_mm) || 20.0,
      width_mm: this.nuevaVarForm.width_mm ? Number(this.nuevaVarForm.width_mm) : undefined,
      font_size_pt: Number(this.nuevaVarForm.font_size_pt) || 7.0,
      font_weight: this.nuevaVarForm.font_weight || 'normal',
      etiqueta: this.nuevaVarForm.etiqueta || this.nuevaVarForm.prefix || '',
      etiqueta_font_weight: this.nuevaVarForm.etiqueta_font_weight || 'bold',
      max_lineas: Number(this.nuevaVarForm.max_lineas) || 1,
      resaltar_comillas: this.nuevaVarForm.resaltar_comillas !== false,
      color: this.nuevaVarForm.color || '#000000',
      align: this.nuevaVarForm.align || 'left',
      visible: true,
      prefix: this.nuevaVarForm.prefix || '',
      suffix: this.nuevaVarForm.suffix || '',
      es_dinamica: true,
      valor_ejemplo: this.nuevaVarForm.valor_ejemplo || 'Valor de prueba'
    };

    const c = this.config();
    if (c) {
      c.variables.push(nueva);
      this.config.set({ ...c });
      this.selectedVariables.set([nueva]);
      this.mostrarModalNuevaVar.set(false);
      this.snackBar.open(`Variable ${nueva.tag} agregada a la plantilla`, 'OK', { duration: 3000 });
    }
  }

  // Cambio de Formato de Papel
  cambiarFormatoPapel(formato: 'DUAL_PVC' | 'A4', orientacion: 'portrait' | 'landscape' = 'portrait'): void {
    const c = this.config();
    if (!c) return;

    c.formato_papel = formato;
    c.orientacion = orientacion;

    if (formato === 'A4') {
      if (orientacion === 'portrait') {
        c.ancho_mm = 210.0;
        c.alto_mm = 297.0;
      } else {
        c.ancho_mm = 297.0;
        c.alto_mm = 210.0;
      }
      c.anverso_alto_mm = 148.5;
      c.reverso_alto_mm = 148.5;
    } else {
      c.ancho_mm = 85.6;
      c.alto_mm = 108.0;
      c.anverso_alto_mm = 54.0;
      c.reverso_alto_mm = 54.0;
    }

    this.config.set({ ...c });
    this.snackBar.open(`Formato cambiado a: ${formato === 'A4' ? 'Hoja Completa A4' : 'Tarjeta Dual PVC (85.6×108mm)'}`, 'OK', { duration: 2500 });
  }

  // Modales de Imagen / Logo
  abrirModalImagen(): void {
    this.nuevaImagenForm = {
      id: `logo_${Date.now()}`,
      tag: '{{LOGO_INSTITUCIONAL}}',
      label: 'Logo Oficial DRTC Puno',
      tipo: 'imagen',
      categoria: 'graficos' as any,
      seccion: 'anverso',
      imagen_url: '/assets/images/drtc-logo-light.png',
      x_mm: 6.0,
      y_mm: 5.0,
      width_mm: 18.0,
      height_mm: 15.0,
      opacidad: 1.0,
      visible: true
    };
    this.mostrarModalImagen.set(true);
  }

  cerrarModalImagen(): void {
    this.mostrarModalImagen.set(false);
  }

  seleccionarPresetImagen(presetUrl: string, presetLabel: string): void {
    this.nuevaImagenForm.imagen_url = presetUrl;
    this.nuevaImagenForm.label = presetLabel;
  }

  guardarNuevaImagen(): void {
    if (!this.nuevaImagenForm.imagen_url) {
      this.snackBar.open('Debe indicar la URL o ruta de la imagen', 'Cerrar', { duration: 3000 });
      return;
    }

    let tag = (this.nuevaImagenForm.tag || '{{LOGO}}').trim().toUpperCase();
    if (!tag.startsWith('{{')) tag = '{{' + tag;
    if (!tag.endsWith('}}')) tag = tag + '}}';

    const nueva: VariablePlantillaTuc = {
      id: this.nuevaImagenForm.id || `img_${Date.now()}`,
      tag: tag,
      label: this.nuevaImagenForm.label || 'Imagen / Logo',
      categoria: 'graficos' as any,
      seccion: this.nuevaImagenForm.seccion || 'anverso',
      tipo: 'imagen',
      imagen_url: this.nuevaImagenForm.imagen_url,
      x_mm: Number(this.nuevaImagenForm.x_mm) || 6.0,
      y_mm: Number(this.nuevaImagenForm.y_mm) || 5.0,
      width_mm: Number(this.nuevaImagenForm.width_mm) || 18.0,
      height_mm: Number(this.nuevaImagenForm.height_mm) || 15.0,
      opacidad: Number(this.nuevaImagenForm.opacidad) || 1.0,
      font_size_pt: 0,
      font_weight: 'normal',
      color: '#000000',
      align: 'left',
      visible: true,
      es_dinamica: true
    };

    const c = this.config();
    if (c) {
      c.variables.push(nueva);
      this.config.set({ ...c });
      this.selectedVariables.set([nueva]);
      this.mostrarModalImagen.set(false);
      this.snackBar.open(`Elemento ${nueva.label} agregado al lienzo`, 'OK', { duration: 3000 });
    }
  }

  // Modales de Código QR
  abrirModalQR(): void {
    this.nuevoQRForm = {
      id: `qr_${Date.now()}`,
      tag: '{{QR_VALIDACION}}',
      label: 'Código QR de Seguridad y Validación',
      tipo: 'qr',
      categoria: 'graficos' as any,
      seccion: 'reverso',
      qr_contenido: 'https://drtc-puno.gob.pe/verificar-tuc/{{PLACA}}',
      x_mm: 8.0,
      y_mm: 92.0,
      width_mm: 14.0,
      height_mm: 14.0,
      visible: true
    };
    this.mostrarModalQR.set(true);
  }

  cerrarModalQR(): void {
    this.mostrarModalQR.set(false);
  }

  guardarNuevoQR(): void {
    let tag = (this.nuevoQRForm.tag || '{{QR}}').trim().toUpperCase();
    if (!tag.startsWith('{{')) tag = '{{' + tag;
    if (!tag.endsWith('}}')) tag = tag + '}}';

    const nuevo: VariablePlantillaTuc = {
      id: this.nuevoQRForm.id || `qr_${Date.now()}`,
      tag: tag,
      label: this.nuevoQRForm.label || 'Código QR Oficial',
      categoria: 'graficos' as any,
      seccion: this.nuevoQRForm.seccion || 'reverso',
      tipo: 'qr',
      qr_contenido: this.nuevoQRForm.qr_contenido || 'https://drtc-puno.gob.pe/verificar-tuc/{{PLACA}}',
      x_mm: Number(this.nuevoQRForm.x_mm) || 8.0,
      y_mm: Number(this.nuevoQRForm.y_mm) || 92.0,
      width_mm: Number(this.nuevoQRForm.width_mm) || 14.0,
      height_mm: Number(this.nuevoQRForm.height_mm) || 14.0,
      font_size_pt: 0,
      font_weight: 'normal',
      color: '#000000',
      align: 'left',
      visible: true,
      es_dinamica: true
    };

    const c = this.config();
    if (c) {
      c.variables.push(nuevo);
      this.config.set({ ...c });
      this.selectedVariables.set([nuevo]);
      this.mostrarModalQR.set(false);
      this.snackBar.open(`Código QR agregado exitosamente al lienzo`, 'OK', { duration: 3000 });
    }
  }

  // URL para vista previa interactiva del QR en el lienzo
  obtenerQrPreviewUrl(v: VariablePlantillaTuc): string {
    let raw = v.qr_contenido || `https://drtc-puno.gob.pe/verificar-tuc/${this.searchPlaca()}`;
    const ph = this.placeholdersVehiculo();
    for (const [key, val] of Object.entries(ph)) {
      raw = raw.replace(key, val);
    }
    raw = raw.replace('{{PLACA}}', this.searchPlaca() || 'VBE-959');
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(raw)}`;
  }

  // Ajustar dimensiones en mm para imágenes y QR
  ajustarTamanio(campo: 'width_mm' | 'height_mm', delta: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const actual = sel[campo] || 15.0;
    const nuevo = Math.round((actual + delta) * 10) / 10;
    if (nuevo >= 2.0) {
      sel[campo] = nuevo;
      this.notificarCambio();
    }
  }

  // Ajustar opacidad para marcas de agua
  ajustarOpacidad(delta: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const actual = sel.opacidad ?? 1.0;
    const nuevo = Math.round(Math.min(1.0, Math.max(0.1, actual + delta)) * 100) / 100;
    sel.opacidad = nuevo;
    this.notificarCambio();
  }

  // Formatear texto con comillas en negrita y +1 tamaño
  formatearTextoConComillas(texto: string, resaltar: boolean = true): string {
    if (!texto) return '';
    if (!resaltar) return this.escapeHtml(texto);
    const regex = /(".*?"|“.*?”|«.*?»)/g;
    const partes = texto.split(regex);
    return partes.map(parte => {
      if (!parte) return '';
      if ((parte.startsWith('"') && parte.endsWith('"')) ||
          (parte.startsWith('“') && parte.endsWith('”')) ||
          (parte.startsWith('«') && parte.endsWith('»'))) {
        return `<span class="tuc-quoted" style="font-weight: bold; font-size: 1.15em; display: inline;">${this.escapeHtml(parte)}</span>`;
      }
      return this.escapeHtml(parte);
    }).join('');
  }

  escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Obtener HTML renderizado con prefijo, valor y sufijo con estilos independientes
  obtenerHtmlRender(v: VariablePlantillaTuc): SafeHtml {
    if (this.modoVista() === 'tags') {
      const etiquetaTag = v.prefix || v.etiqueta || '';
      return this.sanitizer.bypassSecurityTrustHtml(
        `${etiquetaTag ? '<strong class="tuc-prefix" style="font-weight:bold;">' + this.escapeHtml(etiquetaTag) + '</strong> ' : ''}<span class="tag-txt">${this.escapeHtml(v.tag)}</span>`
      );
    }

    const ph = this.placeholdersVehiculo();
    let val = ph[v.tag] !== undefined ? ph[v.tag] : (v.valor_ejemplo || '');

    // Lógica para acto resolutivo reverso en Renovación
    if (this.datosVehiculo()?.es_fila_en_blanco && v.categoria === 'acto_reverso') {
      val = '';
    }

    const prefix = v.prefix !== undefined && v.prefix !== '' ? v.prefix : (v.etiqueta || '');
    const suffix = v.suffix || '';
    const baseSize = v.font_size_pt || 7.0;

    const prefixWeight = v.prefix_font_weight || v.etiqueta_font_weight || 'bold';
    const prefixSize = v.prefix_font_size_pt || baseSize;

    const valorWeight = v.font_weight || 'normal';
    const valorSize = baseSize;
    const resaltar = v.resaltar_comillas !== false;

    const suffixWeight = v.suffix_font_weight || 'normal';
    const suffixSize = v.suffix_font_size_pt || baseSize;

    const valHtml = this.formatearTextoConComillas(String(val), resaltar);

    let htmlOut = '';
    if (prefix) {
      htmlOut += `<span class="tuc-prefix" style="font-weight: ${prefixWeight}; font-size: ${prefixSize}pt;">${this.escapeHtml(prefix)}</span>`;
    }
    if (valHtml) {
      htmlOut += `<span class="tuc-valor" style="font-weight: ${valorWeight}; font-size: ${valorSize}pt;">${valHtml}</span>`;
    }
    if (suffix) {
      htmlOut += `<span class="tuc-suffix" style="font-weight: ${suffixWeight}; font-size: ${suffixSize}pt;">${this.escapeHtml(suffix)}</span>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(htmlOut);
  }

  // Generar código HTML del snippet actual
  getCodigoHtmlSnippet(): string {
    const sel = this.selectedVariable();
    if (!sel) return '';
    if (sel.tipo === 'imagen') {
      return `<img src="${sel.imagen_url}" alt="${sel.label}" style="position: absolute; left: ${sel.x_mm}mm; top: ${sel.y_mm}mm; width: ${sel.width_mm}mm; height: ${sel.height_mm}mm; opacity: ${sel.opacidad ?? 1.0}; object-fit: contain;" />`;
    }
    if (sel.tipo === 'qr') {
      return `<!-- Código QR dinámico renderizado en Base64 por el backend -->
<img src="${this.obtenerQrPreviewUrl(sel)}" alt="QR" style="position: absolute; left: ${sel.x_mm}mm; top: ${sel.y_mm}mm; width: ${sel.width_mm}mm; height: ${sel.height_mm}mm;" />`;
    }

    const etiqueta = sel.etiqueta || sel.prefix || '';
    const etiquetaWeight = sel.etiqueta_font_weight || 'bold';
    const valorWeight = sel.font_weight || 'normal';
    const maxLineas = sel.max_lineas || 1;
    const lineStyle = maxLineas === 2
      ? 'white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.15; word-break: break-word;'
      : (maxLineas === 0 ? 'white-space: normal; line-height: 1.18; word-break: break-word;' : 'white-space: nowrap; line-height: 1.25;');

    const widthStyle = sel.width_mm ? ` width: ${sel.width_mm}mm;` : '';

    return `<div class="tuc-var ${sel.id}" style="position: absolute; left: ${sel.x_mm}mm; top: ${sel.y_mm}mm;${widthStyle} font-size: ${sel.font_size_pt}pt; color: ${sel.color}; ${lineStyle}">
  ${etiqueta ? `<span class="tuc-etiqueta" style="font-weight: ${etiquetaWeight};">${this.escapeHtml(etiqueta)}</span>` : ''}
  <span class="tuc-valor" style="font-weight: ${valorWeight};">${sel.tag}</span>${sel.suffix || ''}
</div>`;
  }

  copiarSnippet(): void {
    const snippet = this.getCodigoHtmlSnippet();
    navigator.clipboard.writeText(snippet);
    this.snackBar.open('¡Código HTML copiado al portapapeles!', 'OK', { duration: 2500 });
  }

  // Obtener valor a renderizar en la vista previa del canvas (retrocompatibilidad)
  obtenerValorRender(v: VariablePlantillaTuc): string {
    if (this.modoVista() === 'tags') {
      return `${v.etiqueta || v.prefix || ''}${v.tag}${v.suffix || ''}`;
    }

    const ph = this.placeholdersVehiculo();
    let val = ph[v.tag] !== undefined ? ph[v.tag] : (v.valor_ejemplo || '');

    if (this.datosVehiculo()?.es_fila_en_blanco && v.categoria === 'acto_reverso') {
      return '';
    }

    return `${v.etiqueta || v.prefix || ''}${val}${v.suffix || ''}`;
  }

  // Separar / Desvincular etiqueta como un elemento nuevo e independiente
  desvincularEtiqueta(v: VariablePlantillaTuc): void {
    const etiqueta = (v.etiqueta || v.prefix || '').trim();
    if (!etiqueta) {
      this.snackBar.open('Esta variable no tiene etiqueta definida para desvincular', 'OK', { duration: 2500 });
      return;
    }

    const c = this.config();
    if (!c) return;

    // Crear elemento independiente para la etiqueta
    const nuevaEtiquetaElem: VariablePlantillaTuc = {
      id: `lbl_${v.id}_${Date.now()}`,
      tag: `{{ETIQ_${v.id.toUpperCase()}}}`,
      label: `Etiqueta: ${etiqueta}`,
      categoria: v.categoria,
      seccion: v.seccion,
      tipo: 'texto',
      x_mm: Math.max(0, Math.round((v.x_mm - 18.0) * 10) / 10),
      y_mm: v.y_mm,
      font_size_pt: v.etiqueta_font_size_pt || v.font_size_pt,
      font_weight: v.etiqueta_font_weight || 'bold',
      etiqueta_font_weight: 'bold',
      color: v.color || '#000000',
      align: 'left',
      visible: true,
      valor_ejemplo: etiqueta,
      es_dinamica: true
    };

    // Dejar la variable original libre de prefijo/etiqueta
    v.prefix = '';
    v.etiqueta = '';

    c.variables.push(nuevaEtiquetaElem);
    this.config.set({ ...c });
    this.selectedVariables.set([v, nuevaEtiquetaElem]);
    this.snackBar.open(`Etiqueta desvinculada como elemento independiente: ${nuevaEtiquetaElem.label}`, 'OK', { duration: 3500 });
  }

  setEtiquetaFontWeight(peso: 'bold' | 'normal'): void {
    this.setPrefixFontWeight(peso);
  }

  setPrefixFontWeight(peso: 'bold' | 'normal'): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.prefix_font_weight = peso;
    sel.etiqueta_font_weight = peso;
    this.notificarCambio();
  }

  ajustarPrefixFontSize(delta: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const actual = sel.prefix_font_size_pt || sel.font_size_pt || 7.0;
    sel.prefix_font_size_pt = Math.max(4.0, Math.round((actual + delta) * 10) / 10);
    this.notificarCambio();
  }

  setSuffixFontWeight(peso: 'bold' | 'normal'): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.suffix_font_weight = peso;
    this.notificarCambio();
  }

  ajustarSuffixFontSize(delta: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const actual = sel.suffix_font_size_pt || sel.font_size_pt || 7.0;
    sel.suffix_font_size_pt = Math.max(4.0, Math.round((actual + delta) * 10) / 10);
    this.notificarCambio();
  }

  ajustarLineHeight(delta: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const actual = sel.line_height !== undefined ? sel.line_height : 1.05;
    sel.line_height = Math.max(0.8, Math.min(2.0, Math.round((actual + delta) * 100) / 100));
    this.notificarCambio();
  }

  setValorFontWeight(peso: 'bold' | 'normal'): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.font_weight = peso;
    this.notificarCambio();
  }

  // Desplazar todos los elementos situados debajo de una variable base (en la misma sección)
  desplazarElementosInferiores(variableBase: VariablePlantillaTuc, deltaMm: number): number {
    const c = this.config();
    if (!c || !variableBase) return 0;
    const seccion = variableBase.seccion;
    const baseY = variableBase.y_mm;

    let count = 0;
    for (const v of c.variables) {
      if (v.id !== variableBase.id && v.seccion === seccion && v.y_mm > baseY) {
        v.y_mm = Math.max(0, Math.round((v.y_mm + deltaMm) * 10) / 10);
        count++;
      }
    }
    if (count > 0) {
      this.config.set({ ...c });
      this.notificarCambio();
    }
    return count;
  }

  // Acción manual de ajuste de texto inferior
  bajarTextoInferior(deltaMm: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    const movidos = this.desplazarElementosInferiores(sel, deltaMm);
    const accion = deltaMm > 0 ? 'bajaron' : 'subieron';
    const signo = deltaMm > 0 ? '+' : '';
    this.snackBar.open(`Se ${accion} ${movidos} elementos inferiores (${signo}${deltaMm}mm)`, 'OK', { duration: 2500 });
  }

  setMaxLineas(lineas: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;

    const anteriorLineas = sel.max_lineas ?? 1;
    sel.max_lineas = lineas;
    if (lineas === 2 && (!sel.width_mm || sel.width_mm < 25)) {
      sel.width_mm = 55.0;
    }

    // Si está activo el auto-desplazamiento vertical para que el texto inferior baje automáticamente
    if (this.autoDesplazarTextoInferior() && anteriorLineas !== lineas) {
      const stepMm = Math.round(((sel.font_size_pt || 7.0) * 0.3528 * (sel.line_height || 1.05) + 0.4) * 10) / 10 || 3.5;

      // Al cambiar a multilínea (de 1 fila a 2 o libre): bajar el resto del texto inferior
      if (anteriorLineas === 1 && (lineas === 2 || lineas === 0)) {
        const movidos = this.desplazarElementosInferiores(sel, stepMm);
        this.snackBar.open(`Multilínea: Se bajaron ${movidos} elementos inferiores (+${stepMm}mm) para evitar solapamiento`, 'OK', { duration: 3500 });
      }
      // Al volver a 1 fila (de 2 o libre a 1 fila): subir el texto inferior
      else if ((anteriorLineas === 2 || anteriorLineas === 0) && lineas === 1) {
        const movidos = this.desplazarElementosInferiores(sel, -stepMm);
        this.snackBar.open(`1 Fila: Se subieron ${movidos} elementos inferiores (-${stepMm}mm)`, 'OK', { duration: 3000 });
      }
    }

    this.notificarCambio();
  }

  toggleResaltarComillas(): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.resaltar_comillas = sel.resaltar_comillas === false ? true : false;
    this.notificarCambio();
  }

  // Orientación Vertical y Rotación de Texto
  setOrientacionTexto(orient: 'horizontal' | 'vertical' | 'vertical_270'): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.orientacion_texto = orient;
    if (orient === 'vertical') sel.rotacion = 90;
    else if (orient === 'vertical_270') sel.rotacion = 270;
    else sel.rotacion = 0;
    this.notificarCambio();
  }

  rotarElemento(grados: number): void {
    const sel = this.selectedVariable();
    if (!sel || sel.bloqueado) return;
    sel.rotacion = grados;
    if (grados === 90) sel.orientacion_texto = 'vertical';
    else if (grados === 270) sel.orientacion_texto = 'vertical_270';
    else if (grados === 0) sel.orientacion_texto = 'horizontal';
    this.notificarCambio();
  }

  // --- SELECCIÓN MÚLTIPLE DIRECTA Y POR CATEGORÍAS ---
  toggleSeleccionDirecta(v: VariablePlantillaTuc, event: Event): void {
    event.stopPropagation();
    this.toggleSeleccion(v);
  }

  toggleSeleccionCategoria(catKey: string): void {
    const varsCat = this.obtenerVariablesPorCategoria(catKey);
    if (varsCat.length === 0) return;
    const todosSeleccionados = varsCat.every(v => this.estaSeleccionada(v));
    const current = this.selectedVariables();
    if (todosSeleccionados) {
      const idsCat = new Set(varsCat.map(v => v.id));
      this.selectedVariables.set(current.filter(v => !idsCat.has(v.id)));
    } else {
      const idsActuales = new Set(current.map(v => v.id));
      const aAgregar = varsCat.filter(v => !idsActuales.has(v.id));
      this.selectedVariables.set([...current, ...aAgregar]);
    }
  }

  estaCategoriaTotalmenteSeleccionada(catKey: string): boolean {
    const varsCat = this.obtenerVariablesPorCategoria(catKey);
    return varsCat.length > 0 && varsCat.every(v => this.estaSeleccionada(v));
  }

  estaCategoriaParcialmenteSeleccionada(catKey: string): boolean {
    const varsCat = this.obtenerVariablesPorCategoria(catKey);
    const count = varsCat.filter(v => this.estaSeleccionada(v)).length;
    return count > 0 && count < varsCat.length;
  }

  obtenerVariablesPorCategoria(catKey: string): VariablePlantillaTuc[] {
    switch (catKey) {
      case 'graficos': return this.varsGraficos();
      case 'autorizacion': return this.varsAutorizacion();
      case 'vehiculo': return this.varsVehiculo();
      case 'rutas': return this.varsRutas();
      case 'acto_reverso': return this.varsActoReverso();
      case 'personalizadas': return this.varsPersonalizadas();
      default: return [];
    }
  }

  invertirSeleccion(): void {
    const c = this.config();
    if (!c) return;
    const currentIds = new Set(this.selectedVariables().map(v => v.id));
    const invertidas = c.variables.filter(v => v.visible && !currentIds.has(v.id));
    this.selectedVariables.set(invertidas);
    this.snackBar.open(`${invertidas.length} elementos seleccionados (invertido)`, 'OK', { duration: 2000 });
  }

  cambiarVisibilidadLote(visible: boolean): void {
    const selIds = new Set(this.selectedVariables().map(v => v.id));
    const c = this.config();
    if (!c || selIds.size === 0) return;
    c.variables.forEach(v => {
      if (selIds.has(v.id)) v.visible = visible;
    });
    this.config.set({ ...c });
    this.snackBar.open(`${selIds.size} elementos ${visible ? 'visibles' : 'ocultados'}`, 'OK', { duration: 2000 });
  }

  cambiarBloqueoLote(bloqueado: boolean): void {
    const selIds = new Set(this.selectedVariables().map(v => v.id));
    const c = this.config();
    if (!c || selIds.size === 0) return;
    c.variables.forEach(v => {
      if (selIds.has(v.id)) v.bloqueado = bloqueado;
    });
    this.config.set({ ...c });
    this.snackBar.open(`${selIds.size} elementos ${bloqueado ? 'bloqueados' : 'desbloqueados'}`, 'OK', { duration: 2000 });
  }

  eliminarSeleccionados(): void {
    const sel = this.selectedVariables();
    if (sel.length === 0) return;
    if (!confirm(`¿Eliminar ${sel.length} elemento(s) seleccionado(s) de la plantilla?`)) return;
    const selIds = new Set(sel.map(v => v.id));
    const c = this.config();
    if (!c) return;
    c.variables = c.variables.filter(v => !selIds.has(v.id));
    this.config.set({ ...c });
    this.selectedVariables.set([]);
    this.snackBar.open(`${sel.length} elemento(s) eliminado(s)`, 'OK', { duration: 2500 });
  }

  // --- LÍNEA DECORATIVA / SEPARADOR BAJO RUTAS ---
  agregarLineaRutas(): void {
    const c = this.config();
    if (!c) return;
    const existente = c.variables.find(v => v.id === 'linea_rutas' || v.tag === '{{LINEA_RUTAS}}');
    if (existente) {
      existente.visible = true;
      this.selectedVariables.set([existente]);
      this.snackBar.open('Línea bajo rutas seleccionada', 'OK', { duration: 2000 });
      return;
    }
    const tr = c.variables.find(v => v.id === 'tabla_rutas');
    const x = tr ? tr.x_mm : (this.formatoPapel() === 'DUAL_PVC' ? 12.0 : 59.0);
    const y = tr ? tr.y_mm + 11.5 : (this.formatoPapel() === 'DUAL_PVC' ? 72.0 : 92.0);
    const w = tr ? (tr.width_mm || 68.0) : 68.0;

    const newLinea: VariablePlantillaTuc = {
      id: 'linea_rutas',
      tag: '{{LINEA_RUTAS}}',
      label: 'Línea / Imagen Decorativa Rutas',
      categoria: 'rutas',
      seccion: 'reverso',
      tipo: 'linea',
      x_mm: x,
      y_mm: y,
      width_mm: w,
      height_mm: 1.5,
      grosor_mm: 0.8,
      color: '#1e3a8a',
      estilo_linea: 'solid',
      imagen_url: '',
      font_size_pt: 0,
      font_weight: 'normal',
      align: 'left',
      visible: true,
      imprimible: true
    };

    c.variables.push(newLinea);
    this.config.set({ ...c });
    this.selectedVariables.set([newLinea]);
    this.snackBar.open('Línea decorativa bajo rutas añadida', 'OK', { duration: 3000 });
  }

  cargarImagenParaVariable(v: VariablePlantillaTuc, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      v.imagen_url = e.target.result;
      v.tipo = 'linea';
      if (!v.height_mm || v.height_mm <= 1) v.height_mm = 2.5;
      this.config.set({ ...this.config()! });
      this.snackBar.open('Imagen cargada correctamente para ' + v.label, 'OK', { duration: 2500 });
    };
    reader.readAsDataURL(file);
  }

  quitarImagenDeVariable(v: VariablePlantillaTuc): void {
    v.imagen_url = '';
    this.config.set({ ...this.config()! });
    this.snackBar.open('Imagen removida. Ahora es línea vectorial.', 'OK', { duration: 2000 });
  }

  alinearLineaConRutas(v: VariablePlantillaTuc): void {
    const c = this.config();
    if (!c) return;
    const tr = c.variables.find(item => item.id === 'tabla_rutas');
    if (tr) {
      v.x_mm = tr.x_mm;
      v.width_mm = tr.width_mm || 68.0;
      this.config.set({ ...c });
      this.snackBar.open('Línea alineada exactamente con el ancho de Rutas (68mm)', 'OK', { duration: 2500 });
    }
  }

  volver(): void {
    this.router.navigate(['/tucs']);
  }
}
