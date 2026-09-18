import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  DashboardService, 
  DashboardEstadisticas, 
  FlotaCorredor, 
  EmpresaMultiResolucionItem 
} from '../../services/dashboard.service';
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
  
  estadisticas = signal<DashboardEstadisticas | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  
  generandoReporte = signal<boolean>(false);
  reporteUrl = signal<string | null>(null);
  reporteError = signal<string | null>(null);

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
  
  @ViewChild('resolucionesChart') resolucionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rutasChart') rutasChartRef!: ElementRef<HTMLCanvasElement>;
  resolucionesChartInstance: Chart | null = null;
  rutasChartInstance: Chart | null = null;

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

  descargarReporteCorredores(): void {
    const stats = this.estadisticas();
    if (!stats || !stats.flotasPorCorredor?.length) return;

    const exportData = stats.flotasPorCorredor.map((c, idx) => ({
      '#': idx + 1,
      'Corredor (Origen - Destino y vic.)': c.corredor,
      'Origen': c.origen,
      'Destino': c.destino,
      'Flota Vehicular Habilitada': c.totalVehiculos,
      'Empresas Operadoras': c.totalEmpresas,
      'Empresas (Muestra)': c.empresas?.join(', ') || ''
    }));

    this.exportarExcel(exportData, 'DRTC_PUNO_Flota_Por_Corredores_Rutas', 'Corredores y Flotas');
  }

  descargarReporteEmpresasResoluciones(): void {
    const stats = this.estadisticas();
    if (!stats || !stats.detalleEmpresasMultiResolucion?.length) return;

    const f = this.filtroResoluciones();
    const lista = this.empresasMultiResolucionFiltradas();

    const exportData = lista.map((e, idx) => ({
      '#': idx + 1,
      'Razón Social': e.razonSocial,
      'RUC': e.ruc,
      'N° Resoluciones Primigenias Vigentes': e.totalResoluciones,
      'Resoluciones Vigentes': e.resoluciones.join(', ')
    }));

    const sufijo = f === 0 ? 'Todas_Multiples_Vigentes' : `${f}_Resoluciones_Vigentes`;
    this.exportarExcel(exportData, `DRTC_PUNO_Empresas_Habilitadas_${sufijo}`, 'Empresas y Resoluciones Vigentes');
  }

  descargarReporteTopFlotas(): void {
    const stats = this.estadisticas();
    if (!stats || !stats.topFlotasPorEmpresa?.length) return;

    const exportData = stats.topFlotasPorEmpresa.map((e, idx) => ({
      'Ranking': idx + 1,
      'Razón Social': e.razonSocial,
      'RUC': e.ruc,
      'Flota Habilitada (Unidades)': e.total
    }));

    this.exportarExcel(exportData, 'DRTC_PUNO_Top_Empresas_Mayor_Flota', 'Top Empresas Flota');
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
          'Empresa Concesionaria': r.razonSocial,
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
          'Empresa Concesionaria': rp.razonSocial,
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
          'Empresa Concesionaria': f.razonSocial,
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

  descargarReporteTramitesEmpresas(): void {
    if (this.descargandoTramites()) return;
    this.descargandoTramites.set(true);
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
        this.exportarExcel(exportData, 'DRTC_PUNO_Tramites_Sustitucion_Incremento_Empresas', 'Trámites por Empresa');
        this.descargandoTramites.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte de trámites', err);
        this.descargandoTramites.set(false);
      }
    });
  }

  descargarReportePorVencer(): void {
    if (this.descargandoPorVencer()) return;
    this.descargandoPorVencer.set(true);
    this.dashboardService.getReporteDetallePorVencer().subscribe({
      next: (items) => {
        const exportData = items.map((pv, idx) => ({
          '#': idx + 1,
          'N° Resolución': pv.nroResolucion,
          'RUC Empresa': pv.ruc,
          'Empresa Concesionaria': pv.razonSocial,
          'Modalidad': pv.modalidad,
          'Fecha de Vencimiento': pv.fechaFinVigencia,
          'Días Restantes': pv.diasRestantes,
          'Nivel de Urgencia': pv.urgencia,
          'Enlace Digital': pv.linkDocumento
        }));
        this.exportarExcel(exportData, 'DRTC_PUNO_Resoluciones_Primigenias_Por_Vencer_30_60_Dias', 'Por Vencer');
        this.descargandoPorVencer.set(false);
      },
      error: (err) => {
        console.error('Error al descargar reporte por vencer', err);
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
              color: '#334155',
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
            ticks: { precision: 0 }
          },
          y: {
            ticks: {
              callback: function(value, index) {
                const label = this.getLabelForValue(index as number);
                return label.length > 28 ? label.substring(0, 28) + '...' : label;
              }
            }
          }
        }
      }
    });
  }
}
