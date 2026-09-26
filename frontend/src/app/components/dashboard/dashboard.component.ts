import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  DashboardService, 
  DashboardEstadisticas, 
  FlotaCorredor, 
  EmpresaMultiResolucionItem 
} from '../../services/dashboard.service';
import { ThemeService } from '../../services/theme.service';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  public themeService = inject(ThemeService);
  
  estadisticas = signal<DashboardEstadisticas | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  
  generandoReporte = signal<boolean>(false);
  reporteUrl = signal<string | null>(null);
  reporteError = signal<string | null>(null);

  // Pantalla Completa Global
  pantallaCompleta = signal<boolean>(false);

  // Modal Fullscreen para estadísticas individuales
  modalFullscreenActivo = signal<'corredores' | 'empresas-res' | 'grafico-res' | 'grafico-rutas' | 'top-flotas' | 'top-tramites' | 'vencimientos' | null>(null);
  busquedaModal = signal<string>('');
  seleccionModal = signal<Set<string>>(new Set());

  // Filtro para empresas con múltiples resoluciones (0 = todas las que tienen >= 2)
  filtroResoluciones = signal<number>(0);

  // Estados de descarga de reportes detallados en Excel
  descargandoRutas = signal<boolean>(false);
  descargandoResoluciones = signal<boolean>(false);
  descargandoFlota = signal<boolean>(false);
  descargandoTramites = signal<boolean>(false);
  descargandoPorVencer = signal<boolean>(false);
  mostrarDetallePorVencer = signal<boolean>(false);

  // Lista filtrada reactiva de empresas multi-resolución
  empresasMultiResolucionFiltradas = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.detalleEmpresasMultiResolucion) return [];
    const f = this.filtroResoluciones();
    if (f === 0) return stats.detalleEmpresasMultiResolucion;
    if (f >= 5) return stats.detalleEmpresasMultiResolucion.filter(e => e.totalResoluciones >= 5);
    return stats.detalleEmpresasMultiResolucion.filter(e => e.totalResoluciones === f);
  });

  // --- Filtros avanzados para Modales Fullscreen ---
  // Corredores
  filtroCiudadCorredor = signal<string>('TODOS');
  filtroRangoFlotaCorredor = signal<string>('TODOS'); // 'TODOS' | 'ALTA' (>=100) | 'MEDIA' (50-99) | 'MODERADA' (20-49) | 'MENOR' (<20)
  filtroCompetenciaCorredor = signal<string>('TODOS'); // 'TODOS' | 'ALTA' (>=5) | 'MEDIA' (2-4) | 'EXCLUSIVA' (1)
  ordenCorredores = signal<string>('flota-desc'); // 'flota-desc' | 'flota-asc' | 'empresas-desc' | 'empresas-asc' | 'nombre-asc' | 'promedio-desc'
  corredorExpandido = signal<string | null>(null);

  // Top Flotas
  filtroRangoFlotaTop = signal<string>('TODOS');
  ordenTopFlotas = signal<string>('flota-desc');

  // Top Trámites
  filtroTipoTramitePredominante = signal<string>('TODOS');
  ordenTopTramites = signal<string>('total-desc');

  // Resoluciones por Vencer
  filtroUrgenciaVencimiento = signal<string>('TODOS');
  ordenVencimientos = signal<string>('dias-asc');

  // Lista de ciudades disponibles para filtrar corredores
  ciudadesCorredoresDisponibles = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.flotasPorCorredor) return [];
    const ciudades = new Set<string>();
    for (const c of stats.flotasPorCorredor) {
      if (c.origen && c.origen !== 'DESCONOCIDO') ciudades.add(c.origen.trim());
      if (c.destino && c.destino !== 'DESCONOCIDO') ciudades.add(c.destino.trim());
    }
    return Array.from(ciudades).sort();
  });

  // Filtros reactivos y KPIs para las vistas ampliadas en modal
  corredoresFiltradosModal = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.flotasPorCorredor) return [];
    let list = [...stats.flotasPorCorredor];

    const q = this.busquedaModal().toLowerCase().trim();
    if (q) {
      list = list.filter(c => 
        c.corredor?.toLowerCase().includes(q) ||
        c.origen?.toLowerCase().includes(q) ||
        c.destino?.toLowerCase().includes(q) ||
        c.empresas?.some(e => e.toLowerCase().includes(q))
      );
    }

    const ciudad = this.filtroCiudadCorredor();
    if (ciudad !== 'TODOS') {
      list = list.filter(c => c.origen === ciudad || c.destino === ciudad);
    }

    const rango = this.filtroRangoFlotaCorredor();
    if (rango === 'ALTA') list = list.filter(c => c.totalVehiculos >= 100);
    else if (rango === 'MEDIA') list = list.filter(c => c.totalVehiculos >= 50 && c.totalVehiculos < 100);
    else if (rango === 'MODERADA') list = list.filter(c => c.totalVehiculos >= 20 && c.totalVehiculos < 50);
    else if (rango === 'MENOR') list = list.filter(c => c.totalVehiculos < 20);

    const comp = this.filtroCompetenciaCorredor();
    if (comp === 'ALTA') list = list.filter(c => c.totalEmpresas >= 5);
    else if (comp === 'MEDIA') list = list.filter(c => c.totalEmpresas >= 2 && c.totalEmpresas <= 4);
    else if (comp === 'EXCLUSIVA') list = list.filter(c => c.totalEmpresas === 1);

    const orden = this.ordenCorredores();
    list.sort((a, b) => {
      switch (orden) {
        case 'flota-desc': return b.totalVehiculos - a.totalVehiculos;
        case 'flota-asc': return a.totalVehiculos - b.totalVehiculos;
        case 'empresas-desc': return b.totalEmpresas - a.totalEmpresas;
        case 'empresas-asc': return a.totalEmpresas - b.totalEmpresas;
        case 'nombre-asc': return a.corredor.localeCompare(b.corredor);
        case 'promedio-desc': {
          const promA = a.totalVehiculos / (a.totalEmpresas || 1);
          const promB = b.totalVehiculos / (b.totalEmpresas || 1);
          return promB - promA;
        }
        default: return 0;
      }
    });

    return list;
  });

  kpiCorredoresModal = computed(() => {
    const list = this.corredoresFiltradosModal();
    const totalCorredores = list.length;
    const totalFlota = list.reduce((sum, c) => sum + (c.totalVehiculos || 0), 0);
    const empresasUnicas = new Set<string>();
    list.forEach(c => c.empresas?.forEach(e => empresasUnicas.add(e)));
    const promedioFlota = totalCorredores > 0 ? (totalFlota / totalCorredores).toFixed(1) : '0';
    return {
      totalCorredores,
      totalFlota,
      totalEmpresasUnicas: empresasUnicas.size,
      promedioFlota
    };
  });

  empresasResFiltradasModal = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.detalleEmpresasMultiResolucion) return [];
    const q = this.busquedaModal().toLowerCase().trim();
    const f = this.filtroResoluciones();
    let list = stats.detalleEmpresasMultiResolucion;
    if (f > 0) {
      list = f >= 5 ? list.filter(e => e.totalResoluciones >= 5) : list.filter(e => e.totalResoluciones === f);
    }
    if (q) {
      list = list.filter(e =>
        e.razonSocial?.toLowerCase().includes(q) ||
        e.ruc?.includes(q) ||
        e.resoluciones?.some(r => r.toLowerCase().includes(q))
      );
    }
    return list;
  });

  kpiEmpresasResModal = computed(() => {
    const list = this.empresasResFiltradasModal();
    const totalEmpresas = list.length;
    const totalResoluciones = list.reduce((sum, e) => sum + (e.totalResoluciones || 0), 0);
    const maxRes = list.length > 0 ? Math.max(...list.map(e => e.totalResoluciones || 0)) : 0;
    return { totalEmpresas, totalResoluciones, maxRes };
  });

  topFlotasFiltradasModal = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.topFlotasPorEmpresa) return [];
    let list = [...stats.topFlotasPorEmpresa];

    const q = this.busquedaModal().toLowerCase().trim();
    if (q) {
      list = list.filter(e =>
        e.razonSocial?.toLowerCase().includes(q) ||
        e.ruc?.includes(q)
      );
    }

    const rango = this.filtroRangoFlotaTop();
    if (rango === 'ALTA') list = list.filter(e => e.total >= 50);
    else if (rango === 'MEDIA') list = list.filter(e => e.total >= 20 && e.total < 50);
    else if (rango === 'MENOR') list = list.filter(e => e.total < 20);

    const orden = this.ordenTopFlotas();
    list.sort((a, b) => {
      switch (orden) {
        case 'flota-desc': return b.total - a.total;
        case 'flota-asc': return a.total - b.total;
        case 'nombre-asc': return a.razonSocial.localeCompare(b.razonSocial);
        default: return 0;
      }
    });

    return list;
  });

  kpiTopFlotasModal = computed(() => {
    const list = this.topFlotasFiltradasModal();
    const totalEmpresas = list.length;
    const totalFlota = list.reduce((sum, e) => sum + (e.total || 0), 0);
    const lider = list[0]?.razonSocial || '-';
    return { totalEmpresas, totalFlota, lider };
  });

  topTramitesFiltradasModal = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.topEmpresasTramites) return [];
    let list = [...stats.topEmpresasTramites];

    const q = this.busquedaModal().toLowerCase().trim();
    if (q) {
      list = list.filter(e =>
        e.razonSocial?.toLowerCase().includes(q) ||
        e.ruc?.includes(q)
      );
    }

    const tipo = this.filtroTipoTramitePredominante();
    if (tipo === 'SUSTITUCIONES') list = list.filter(e => e.sustituciones > e.incrementos);
    else if (tipo === 'INCREMENTOS') list = list.filter(e => e.incrementos >= e.sustituciones);

    const orden = this.ordenTopTramites();
    list.sort((a, b) => {
      switch (orden) {
        case 'total-desc': return b.totalTramites - a.totalTramites;
        case 'sustituciones-desc': return b.sustituciones - a.sustituciones;
        case 'incrementos-desc': return b.incrementos - a.incrementos;
        case 'nombre-asc': return a.razonSocial.localeCompare(b.razonSocial);
        default: return 0;
      }
    });

    return list;
  });

  kpiTopTramitesModal = computed(() => {
    const list = this.topTramitesFiltradasModal();
    const totalEmpresas = list.length;
    const totalTramites = list.reduce((sum, e) => sum + (e.totalTramites || 0), 0);
    const totalSustituciones = list.reduce((sum, e) => sum + (e.sustituciones || 0), 0);
    const totalIncrementos = list.reduce((sum, e) => sum + (e.incrementos || 0), 0);
    return { totalEmpresas, totalTramites, totalSustituciones, totalIncrementos };
  });

  vencimientosFiltradosModal = computed(() => {
    const stats = this.estadisticas();
    if (!stats || !stats.resolucionesPorVencer60?.items) return [];
    let list = [...stats.resolucionesPorVencer60.items];

    const q = this.busquedaModal().toLowerCase().trim();
    if (q) {
      list = list.filter(item =>
        item.razonSocial?.toLowerCase().includes(q) ||
        item.ruc?.includes(q) ||
        item.nroResolucion?.toLowerCase().includes(q)
      );
    }

    const urg = this.filtroUrgenciaVencimiento();
    if (urg === 'CRITICA') list = list.filter(item => item.diasRestantes <= 30);
    else if (urg === 'PREVENTIVA') list = list.filter(item => item.diasRestantes > 30);

    const orden = this.ordenVencimientos();
    list.sort((a, b) => {
      switch (orden) {
        case 'dias-asc': return a.diasRestantes - b.diasRestantes;
        case 'dias-desc': return b.diasRestantes - a.diasRestantes;
        case 'nombre-asc': return a.razonSocial.localeCompare(b.razonSocial);
        default: return 0;
      }
    });

    return list;
  });

  kpiVencimientosModal = computed(() => {
    const list = this.vencimientosFiltradosModal();
    const total = list.length;
    const criticas = list.filter(i => i.diasRestantes <= 30).length;
    const preventivas = list.filter(i => i.diasRestantes > 30).length;
    const minDias = list.length > 0 ? Math.min(...list.map(i => i.diasRestantes)) : 0;
    return { total, criticas, preventivas, minDias };
  });
  
  @ViewChild('resolucionesChart') resolucionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rutasChart') rutasChartRef!: ElementRef<HTMLCanvasElement>;
  resolucionesChartInstance: Chart | null = null;
  rutasChartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      // Re-renderizar gráficos cuando el usuario conmuta Modo Claro / Oscuro
      const isDark = this.themeService.isDarkMode();
      const stats = this.estadisticas();
      if (stats && this.resolucionesChartRef?.nativeElement) {
        setTimeout(() => {
          this.inicializarGraficoResoluciones(stats);
          this.inicializarGraficoRutas(stats);
        }, 60);
      }
    });
  }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializarán cuando los datos estén disponibles
  }

  ngOnDestroy(): void {
    if (this.resolucionesChartInstance) {
      this.resolucionesChartInstance.destroy();
    }
    if (this.rutasChartInstance) {
      this.rutasChartInstance.destroy();
    }
  }

  cargarEstadisticas(): void {
    this.cargando.set(true);
    this.error.set(null);
    
    this.dashboardService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas.set(data);
        this.cargando.set(false);
        setTimeout(() => {
          this.inicializarGraficoResoluciones(data);
          this.inicializarGraficoRutas(data);
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando estadísticas', err);
        this.error.set('No se pudieron cargar las estadísticas. Por favor, intente de nuevo.');
        this.cargando.set(false);
      }
    });
  }

  generarReporte(): void {
    this.generandoReporte.set(true);
    this.reporteUrl.set(null);
    this.reporteError.set(null);

    this.dashboardService.generarReporte().subscribe({
      next: (res) => {
        if (res.success) {
          this.reporteUrl.set(res.url);
        } else {
          this.reporteError.set('Error en la respuesta al generar el reporte.');
        }
        this.generandoReporte.set(false);
      },
      error: (err) => {
        console.error('Error generando reporte', err);
        this.reporteError.set('No se pudo generar el reporte. ' + (err.error?.detail || err.message));
        this.generandoReporte.set(false);
      }
    });
  }

  // =========================================================================
  // EXPORTACIÓN A EXCEL (.XLSX) PARA CADA CARD
  // =========================================================================

  private exportarExcel(data: any[], nombreArchivo: string, nombreHoja: string): void {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);
    } catch (e) {
      console.error('Error al exportar Excel', e);
    }
  }

  descargarReporteCorredores(modo: 'filtrado' | 'general' = 'filtrado'): void {
    const stats = this.estadisticas();
    if (!stats || !stats.flotasPorCorredor?.length) return;

    let lista = stats.flotasPorCorredor;
    const seleccionados = this.seleccionModal();
    const esModal = this.modalFullscreenActivo() === 'corredores';

    if (esModal && modo === 'filtrado') {
      if (seleccionados.size > 0) {
        lista = this.corredoresFiltradosModal().filter(c => seleccionados.has(c.corredor));
      } else {
        lista = this.corredoresFiltradosModal();
      }
    }

    if (!lista.length) return;

    const exportData = lista.map((c, idx) => ({
      '#': idx + 1,
      'Corredor (Origen - Destino)': c.corredor,
      'Ciudad Origen': c.origen,
      'Ciudad Destino': c.destino,
      'Flota Vehicular Habilitada': c.totalVehiculos,
      'Participación Regional (%)': `${this.flotaPorcentajeRegional(c.totalVehiculos)}%`,
      'Empresas Operadoras': c.totalEmpresas,
      'Promedio Vehículos / Empresa': (c.totalVehiculos / (c.totalEmpresas || 1)).toFixed(1),
      'Nivel de Demanda': c.totalVehiculos >= 100 ? 'ALTA' : c.totalVehiculos >= 40 ? 'MEDIA' : 'LOCAL',
      'Padrón de Empresas Operadoras': c.empresas?.join(', ') || ''
    }));

    let sufijo = 'General_131_Corredores';
    if (esModal && modo === 'filtrado') {
      sufijo = seleccionados.size > 0 ? `${lista.length}_Seleccionados` : `${lista.length}_Filtrados`;
    }
    this.exportarExcel(exportData, `DRTC_PUNO_Flota_Por_Corredores_${sufijo}`, 'Corredores y Flotas');
  }

  descargarReporteEmpresasResoluciones(modo: 'filtrado' | 'general' = 'filtrado'): void {
    const stats = this.estadisticas();
    if (!stats || !stats.detalleEmpresasMultiResolucion?.length) return;

    const f = this.filtroResoluciones();
    let lista = stats.detalleEmpresasMultiResolucion;
    const seleccionados = this.seleccionModal();
    const esModal = this.modalFullscreenActivo() === 'empresas-res' || this.modalFullscreenActivo() === 'grafico-res';

    if (esModal && modo === 'filtrado') {
      if (seleccionados.size > 0) {
        lista = this.empresasResFiltradasModal().filter(e => seleccionados.has(e.ruc));
      } else {
        lista = this.empresasResFiltradasModal();
      }
    } else if (!esModal) {
      lista = this.empresasMultiResolucionFiltradas();
    }

    if (!lista.length) return;

    const exportData = lista.map((e, idx) => ({
      '#': idx + 1,
      'Razón Social': e.razonSocial,
      'RUC': e.ruc,
      'N° Resoluciones Primigenias Vigentes': e.totalResoluciones,
      'Resoluciones Vigentes': e.resoluciones.join(', ')
    }));

    let sufijo = 'General_Todas';
    if (esModal && modo === 'filtrado') {
      sufijo = seleccionados.size > 0 ? `${lista.length}_Seleccionadas` : `${lista.length}_Filtradas`;
    } else if (!esModal) {
      sufijo = f === 0 ? 'Todas_Multiples_Vigentes' : `${f}_Resoluciones_Vigentes`;
    }
    this.exportarExcel(exportData, `DRTC_PUNO_Empresas_Habilitadas_${sufijo}`, 'Empresas y Resoluciones Vigentes');
  }

  descargarReporteTopFlotas(modo: 'filtrado' | 'general' = 'filtrado'): void {
    const stats = this.estadisticas();
    if (!stats || !stats.topFlotasPorEmpresa?.length) return;

    let lista = stats.topFlotasPorEmpresa;
    const seleccionados = this.seleccionModal();
    const esModal = this.modalFullscreenActivo() === 'top-flotas';

    if (esModal && modo === 'filtrado') {
      if (seleccionados.size > 0) {
        lista = this.topFlotasFiltradasModal().filter(e => seleccionados.has(e.ruc));
      } else {
        lista = this.topFlotasFiltradasModal();
      }
    }

    if (!lista.length) return;

    const exportData = lista.map((e, idx) => ({
      'Ranking': idx + 1,
      'Razón Social': e.razonSocial,
      'RUC': e.ruc,
      'Flota Habilitada (Unidades)': e.total,
      'Participación Regional (%)': `${this.flotaPorcentajeRegional(e.total)}%`
    }));

    let sufijo = 'General_Ranking';
    if (esModal && modo === 'filtrado') {
      sufijo = seleccionados.size > 0 ? `${lista.length}_Seleccionadas` : `${lista.length}_Filtradas`;
    }
    this.exportarExcel(exportData, `DRTC_PUNO_Top_Empresas_Mayor_Flota_${sufijo}`, 'Top Empresas Flota');
  }

  descargarReporteRutasEmpresas(): void {
    const stats = this.estadisticas();
    if (!stats || !stats.rutasConMasEmpresas?.length) return;

    const exportData = stats.rutasConMasEmpresas.map((r, idx) => ({
      '#': idx + 1,
      'Ruta': r.nombre,
      'Total Empresas Autorizadas': r.totalEmpresas
    }));

    this.exportarExcel(exportData, 'DRTC_PUNO_Rutas_Con_Mas_Empresas', 'Rutas Empresas');
  }

  descargarReporteRutasHabilitadas(): void {
    if (this.descargandoRutas()) return;
    this.descargandoRutas.set(true);
    this.dashboardService.getReporteDetalleRutas().subscribe({
      next: (rutas) => {
        const exportData = rutas.map((r, idx) => ({
          '#': idx + 1,
          'Código de Ruta': r.codigoRuta,
          'Nombre de Ruta': r.nombreRuta,
          'Origen': r.origen,
          'Destino': r.destino,
          'Itinerario / Escalas': r.itinerario,
          'Frecuencia': r.frecuencia,
          'N° Resolución Primigenia': r.nroResolucion,
          'RUC Empresa': r.ruc,
          'Empresa Autorizada': r.razonSocial,
          'Modalidad': r.tipoServicio,
          'Clasificación': r.tipoRuta,
          'Flota Asignada': r.cantidadVehiculos,
          'Estado': r.estado
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Padron_Rutas_Habilitadas_447', 'Rutas Habilitadas');
        this.descargandoRutas.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de rutas', err);
        this.descargandoRutas.set(false);
      }
    });
  }

  descargarReporteResolucionesVigentes(): void {
    if (this.descargandoResoluciones()) return;
    this.descargandoResoluciones.set(true);
    this.dashboardService.getReporteDetalleResoluciones().subscribe({
      next: (resoluciones) => {
        const exportData = resoluciones.map((rp, idx) => ({
          '#': idx + 1,
          'N° Resolución Primigenia': rp.nroResolucion,
          'RUC Empresa': rp.ruc,
          'Empresa Autorizada': rp.razonSocial,
          'Modalidad / Tipo Autorización': rp.modalidad,
          'Fecha de Emisión': rp.fechaResolucion,
          'Fecha Inicio Vigencia': rp.fechaInicioVigencia,
          'Fecha Fin Vigencia': rp.fechaFinVigencia,
          'Años Otorgados': rp.aniosVigencia,
          'Días Restantes': rp.diasRestantes,
          'Estado Legal': rp.estado,
          'Eficacia Anticipada': rp.tieneEficaciaAnticipada,
          'Expedientes': rp.expedientes,
          'Enlace Digital (Drive)': rp.linkDocumento
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Padron_Resoluciones_Primigenias', 'Resoluciones Primigenias');
        this.descargandoResoluciones.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de resoluciones', err);
        this.descargandoResoluciones.set(false);
      }
    });
  }

  descargarReporteFlotaTotal(): void {
    if (this.descargandoFlota()) return;
    this.descargandoFlota.set(true);
    this.dashboardService.getReporteDetalleFlota().subscribe({
      next: (flota) => {
        const exportData = flota.map((f, idx) => ({
          '#': idx + 1,
          'Placa Vehicular': f.placa,
          'RUC Empresa': f.ruc,
          'Empresa Autorizada': f.razonSocial,
          'N° Resolución Primigenia': f.nroResolucionPrimigenia,
          'Último Trámite': f.nroResolucionHija,
          'Tipo Trámite': f.tipoResolucionHija,
          'Rutas Asignadas': f.rutasAsignadas,
          'N° Tarjeta TUC': f.numeroTuc,
          'Estado': f.estado
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Padron_Flota_Vehicular_Habilitada', 'Flota Habilitada');
        this.descargandoFlota.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de flota', err);
        this.descargandoFlota.set(false);
      }
    });
  }

  descargarReporteTramitesEmpresas(modo: 'filtrado' | 'general' = 'filtrado'): void {
    if (this.descargandoTramites()) return;
    this.descargandoTramites.set(true);

    const esModal = this.modalFullscreenActivo() === 'top-tramites';
    const seleccionados = this.seleccionModal();

    if (esModal && modo === 'filtrado') {
      let lista = this.topTramitesFiltradasModal();
      if (seleccionados.size > 0) {
        lista = lista.filter(t => seleccionados.has(t.ruc));
      }
      const exportData = lista.map((t, idx) => ({
        'Ranking': idx + 1,
        'Razón Social': t.razonSocial,
        'RUC': t.ruc,
        'Sustituciones Vehiculares': t.sustituciones,
        'Incrementos de Flota': t.incrementos,
        'Total Trámites Registrados': t.totalTramites
      }));
      const sufijo = seleccionados.size > 0 ? `${lista.length}_Seleccionadas` : `${lista.length}_Filtrados`;
      this.exportarExcel(exportData, `DRTC_PUNO_Tramites_Sustitucion_Incremento_${sufijo}`, 'Trámites por Empresa');
      this.descargandoTramites.set(false);
      return;
    }

    this.dashboardService.getReporteDetalleTramites().subscribe({
      next: (tramites) => {
        const exportData = tramites.map((t, idx) => ({
          'Ranking': idx + 1,
          'Razón Social': t.razonSocial,
          'RUC': t.ruc,
          'Sustituciones Vehiculares': t.sustituciones,
          'Incrementos de Flota': t.incrementos,
          'Total Trámites Registrados': t.totalTramites
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Tramites_Sustitucion_Incremento_General', 'Trámites por Empresa');
        this.descargandoTramites.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de trámites', err);
        this.descargandoTramites.set(false);
      }
    });
  }

  descargarReportePorVencer(modo: 'filtrado' | 'general' = 'filtrado'): void {
    if (this.descargandoPorVencer()) return;
    this.descargandoPorVencer.set(true);

    const esModal = this.modalFullscreenActivo() === 'vencimientos';
    const seleccionados = this.seleccionModal();

    if (esModal && modo === 'filtrado') {
      let lista = this.vencimientosFiltradosModal();
      if (seleccionados.size > 0) {
        lista = lista.filter(v => seleccionados.has(v.nroResolucion));
      }
      const exportData = lista.map((pv, idx) => ({
        '#': idx + 1,
        'N° Resolución': pv.nroResolucion,
        'RUC Empresa': pv.ruc,
        'Razón Social Empresa': pv.razonSocial,
        'Fecha Fin Vigencia': pv.fechaFinVigencia,
        'Días Restantes': pv.diasRestantes,
        'Nivel de Urgencia': pv.diasRestantes <= 30 ? 'CRÍTICA (≤ 30 días)' : 'PREVENTIVA (≤ 60 días)'
      }));
      const sufijo = seleccionados.size > 0 ? `${lista.length}_Seleccionadas` : `${lista.length}_Filtradas`;
      this.exportarExcel(exportData, `DRTC_PUNO_Resoluciones_Primigenias_Por_Vencer_${sufijo}`, 'Resoluciones por Vencer');
      this.descargandoPorVencer.set(false);
      return;
    }

    this.dashboardService.getReporteDetallePorVencer().subscribe({
      next: (items) => {
        const exportData = items.map((pv, idx) => ({
          '#': idx + 1,
          'N° Resolución': pv.nroResolucion,
          'RUC Empresa': pv.ruc,
          'Razón Social Empresa': pv.razonSocial,
          'Fecha Fin Vigencia': pv.fechaFinVigencia,
          'Días Restantes': pv.diasRestantes,
          'Nivel de Urgencia': pv.diasRestantes <= 30 ? 'CRÍTICA (≤ 30 días)' : 'PREVENTIVA (≤ 60 días)'
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Resoluciones_Primigenias_Por_Vencer_General_60d', 'Resoluciones por Vencer');
        this.descargandoPorVencer.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de resoluciones por vencer', err);
        this.descargandoPorVencer.set(false);
      }
    });
  }

  // =========================================================================
  // GRÁFICOS CHART.JS
  // =========================================================================

  private inicializarGraficoResoluciones(data: DashboardEstadisticas): void {
    if (!this.resolucionesChartRef || !this.resolucionesChartRef.nativeElement) return;
    
    const ctx = this.resolucionesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.resolucionesChartInstance) {
      this.resolucionesChartInstance.destroy();
    }
    
    const res = data.empresasPorResoluciones;
    const labels = [
      `1 Resolución (${res.con1})`, 
      `2 Resoluciones (${res.con2})`, 
      `3 Resoluciones (${res.con3})`, 
      `4 Resoluciones (${res.con4})`, 
      `5+ Resoluciones (${res.con5Mas})`
    ];
    const valores = [res.con1, res.con2, res.con3, res.con4, res.con5Mas];
    
    const backgroundColors = [
      'rgba(59, 130, 246, 0.85)', // 1 Res: blue-500
      'rgba(16, 185, 129, 0.85)', // 2 Res: emerald-500
      'rgba(245, 158, 11, 0.85)', // 3 Res: amber-500
      'rgba(239, 68, 68, 0.85)',  // 4 Res: red-500
      'rgba(139, 92, 246, 0.85)'  // 5+ Res: violet-500
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.85', '1'));
    
    const isDark = this.themeService.isDarkMode();
    const legendColor = isDark ? '#cbd5e1' : '#334155';

    this.resolucionesChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: "'Inter', sans-serif", size: 12 },
              color: legendColor,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 12,
            titleFont: { size: 13, family: "'Inter', sans-serif", weight: 'bold' },
            bodyFont: { size: 13, family: "'Inter', sans-serif" },
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                const total = res.totalEmpresas || 1;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${val} empresas (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  private inicializarGraficoRutas(data: DashboardEstadisticas): void {
    if (!this.rutasChartRef || !this.rutasChartRef.nativeElement) return;
    
    const ctx = this.rutasChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.rutasChartInstance) {
      this.rutasChartInstance.destroy();
    }
    
    const labels = data.rutasConMasEmpresas.map(r => r.nombre);
    const valores = data.rutasConMasEmpresas.map(r => r.totalEmpresas);
    
    const backgroundColors = [
      'rgba(249, 115, 22, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(132, 204, 22, 0.8)',
      'rgba(234, 179, 8, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));
    const isDark = this.themeService.isDarkMode();
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    
    this.rutasChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Empresas Autorizadas',
          data: valores,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 10,
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, color: tickColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: {
              color: tickColor,
              callback: function(value, index) {
                const label = this.getLabelForValue(index as number);
                return label.length > 28 ? label.substring(0, 28) + '...' : label;
              }
            },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  // =========================================================================
  // CONTROL DE PANTALLA COMPLETA Y VISTAS AMPLIADAS
  // =========================================================================

  togglePantallaCompleta(): void {
    const nuevo = !this.pantallaCompleta();
    this.pantallaCompleta.set(nuevo);

    try {
      if (nuevo) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen API error', e);
    }

    setTimeout(() => {
      this.resolucionesChartInstance?.resize();
      this.rutasChartInstance?.resize();
    }, 150);
  }

  abrirModalFullscreen(tipo: 'corredores' | 'empresas-res' | 'grafico-res' | 'grafico-rutas' | 'top-flotas' | 'top-tramites' | 'vencimientos'): void {
    this.busquedaModal.set('');
    this.seleccionModal.set(new Set());
    this.modalFullscreenActivo.set(tipo);
  }

  cerrarModalFullscreen(): void {
    this.modalFullscreenActivo.set(null);
    this.busquedaModal.set('');
    this.seleccionModal.set(new Set());
  }

  descargarDesdeModal(modalId: string, modo: 'filtrado' | 'general' = 'filtrado'): void {
    switch (modalId) {
      case 'corredores':
        this.descargarReporteCorredores(modo);
        break;
      case 'empresas-res':
      case 'grafico-res':
        this.descargarReporteEmpresasResoluciones(modo);
        break;
      case 'grafico-rutas':
        this.descargarReporteRutasEmpresas();
        break;
      case 'top-flotas':
        this.descargarReporteTopFlotas(modo);
        break;
      case 'top-tramites':
        this.descargarReporteTramitesEmpresas(modo);
        break;
      case 'vencimientos':
        this.descargarReportePorVencer(modo);
        break;
    }
  }

  totalGeneralActual(modalId: string): number {
    const stats = this.estadisticas();
    if (!stats) return 0;
    switch (modalId) {
      case 'corredores':
        return stats.flotasPorCorredor?.length || 0;
      case 'empresas-res':
      case 'grafico-res':
        return stats.detalleEmpresasMultiResolucion?.length || 0;
      case 'grafico-rutas':
        return stats.rutasConMasEmpresas?.length || 0;
      case 'top-flotas':
        return stats.topFlotasPorEmpresa?.length || 0;
      case 'top-tramites':
        return stats.topEmpresasTramites?.length || 0;
      case 'vencimientos':
        return stats.resolucionesPorVencer60?.items?.length || 0;
      default:
        return 0;
    }
  }

  toggleCorredorExpandido(corredor: string): void {
    if (this.corredorExpandido() === corredor) {
      this.corredorExpandido.set(null);
    } else {
      this.corredorExpandido.set(corredor);
    }
  }

  limpiarFiltrosCorredores(): void {
    this.busquedaModal.set('');
    this.filtroCiudadCorredor.set('TODOS');
    this.filtroRangoFlotaCorredor.set('TODOS');
    this.filtroCompetenciaCorredor.set('TODOS');
    this.ordenCorredores.set('flota-desc');
    this.corredorExpandido.set(null);
  }

  flotaPorcentajeRegional(vehiculos: number): string {
    const total = this.estadisticas()?.totalFlotaHabilitada || 1;
    return ((vehiculos / total) * 100).toFixed(1);
  }

  // Métodos de selección múltiple en modal
  toggleSeleccion(id: string): void {
    const set = new Set(this.seleccionModal());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.seleccionModal.set(set);
  }

  estaSeleccionado(id: string): boolean {
    return this.seleccionModal().has(id);
  }

  obtenerIdsFiltradosActuales(): string[] {
    const mId = this.modalFullscreenActivo();
    switch (mId) {
      case 'corredores':
        return this.corredoresFiltradosModal().map(c => c.corredor);
      case 'empresas-res':
      case 'grafico-res':
        return this.empresasResFiltradasModal().map(e => e.ruc);
      case 'top-flotas':
        return this.topFlotasFiltradasModal().map(e => e.ruc);
      case 'top-tramites':
        return this.topTramitesFiltradasModal().map(e => e.ruc);
      case 'vencimientos':
        return this.vencimientosFiltradosModal().map(v => v.nroResolucion);
      default:
        return [];
    }
  }

  todosSeleccionadosModal(): boolean {
    const ids = this.obtenerIdsFiltradosActuales();
    if (!ids.length) return false;
    const set = this.seleccionModal();
    return ids.every(id => set.has(id));
  }

  algunosSeleccionadosModal(): boolean {
    const ids = this.obtenerIdsFiltradosActuales();
    if (!ids.length) return false;
    const set = this.seleccionModal();
    const count = ids.filter(id => set.has(id)).length;
    return count > 0 && count < ids.length;
  }

  toggleSeleccionarTodos(): void {
    const ids = this.obtenerIdsFiltradosActuales();
    const set = new Set(this.seleccionModal());
    const todos = ids.length > 0 && ids.every(id => set.has(id));

    if (todos) {
      ids.forEach(id => set.delete(id));
    } else {
      ids.forEach(id => set.add(id));
    }
    this.seleccionModal.set(set);
  }

  limpiarSeleccion(): void {
    this.seleccionModal.set(new Set());
  }

  totalFiltradosActual(): number {
    return this.obtenerIdsFiltradosActuales().length;
  }

  calcularPorcentajeDistribucion(vehiculos: number): number {
    const max = this.estadisticas()?.flotasPorCorredor?.[0]?.totalVehiculos || 1;
    return Math.max(Math.round((vehiculos / max) * 100), 2);
  }

  calcularPorcentajeTopFlota(total: number): number {
    const max = this.estadisticas()?.topFlotasPorEmpresa?.[0]?.total || 1;
    return Math.max(Math.round((total / max) * 100), 2);
  }

  calcularPorcentajeTopTramites(total: number): number {
    const max = this.estadisticas()?.topEmpresasTramites?.[0]?.totalTramites || 1;
    return Math.max(Math.round((total / max) * 100), 2);
  }

  calcularPorcentajeRutas(total: number): number {
    const max = this.estadisticas()?.rutasConMasEmpresas?.[0]?.totalEmpresas || 1;
    return Math.max(Math.round((total / max) * 100), 2);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.modalFullscreenActivo()) {
        this.cerrarModalFullscreen();
      } else if (this.pantallaCompleta()) {
        this.togglePantallaCompleta();
      }
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    const isDocFullscreen = !!document.fullscreenElement;
    if (!isDocFullscreen && this.pantallaCompleta()) {
      this.pantallaCompleta.set(false);
      setTimeout(() => {
        this.resolucionesChartInstance?.resize();
        this.rutasChartInstance?.resize();
      }, 100);
    }
  }
}
