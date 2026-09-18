import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { AuditoriaService } from '../../services/auditoria.service';
import {
  LogAuditoria,
  AuditoriaKPIs,
  ModuloAuditoria,
  AccionAuditoria,
  SeveridadAuditoria,
  FiltrosAuditoria
} from '../../models/auditoria.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);

  // Estados reactivos (Signals)
  cargando = signal<boolean>(false);
  cargandoKpis = signal<boolean>(false);
  exportando = signal<boolean>(false);
  sincronizando = signal<boolean>(false);
  mensajeFeedback = signal<string | null>(null);
  errorFeedback = signal<string | null>(null);

  logs = signal<LogAuditoria[]>([]);
  totalLogs = signal<number>(0);
  kpis = signal<AuditoriaKPIs | null>(null);

  // Paginación
  paginaActual = signal<number>(1);
  pageSize = signal<number>(25);
  totalPaginas = signal<number>(1);

  // Filtros activos
  filtroModulo = signal<string>('TODOS');
  filtroAccion = signal<string>('TODOS');
  filtroSeveridad = signal<string>('TODAS');
  terminoBusqueda = signal<string>('');
  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');

  // Modal de Detalle / Trazabilidad
  modalAbierto = signal<boolean>(false);
  logSeleccionado = signal<LogAuditoria | null>(null);

  // Lista de opciones para filtros
  modulosDisponibles = [
    { value: 'TODOS', label: 'Todos los Módulos' },
    { value: 'VEHICULOS', label: 'Vehículos / Flota' },
    { value: 'RUTAS', label: 'Rutas e Itinerarios' },
    { value: 'EMPRESAS', label: 'Empresas Operadoras' },
    { value: 'RESOLUCIONES', label: 'Resoluciones' },
    { value: 'TUCS', label: 'Tarjetas TUC' },
    { value: 'INFRAESTRUCTURA', label: 'Terminales e Infraestructura' },
    { value: 'SEGURIDAD', label: 'Seguridad y Accesos' }
  ];

  accionesDisponibles = [
    { value: 'TODOS', label: 'Todas las Acciones' },
    { value: 'REGISTRO', label: 'Registro / Creación' },
    { value: 'MODIFICACION', label: 'Modificación' },
    { value: 'SUSTITUCION', label: 'Sustitución Vehicular' },
    { value: 'INCREMENTO', label: 'Incremento de Flota' },
    { value: 'BAJA_VEHICULAR', label: 'Baja Vehicular' },
    { value: 'CAMBIO_ESTADO', label: 'Cambio de Estado' },
    { value: 'CAMBIO_REPRESENTANTE', label: 'Cambio de Representante' },
    { value: 'ASIGNACION_RUTA', label: 'Asignación de Ruta' },
    { value: 'ELIMINACION', label: 'Eliminación' }
  ];

  severidadesDisponibles = [
    { value: 'TODAS', label: 'Todas las Severidades' },
    { value: 'CRITICA', label: 'Crítica (Bajas, Cancelaciones)' },
    { value: 'ALTA', label: 'Alta (Sustituciones, Rutas)' },
    { value: 'MEDIA', label: 'Media (Modificaciones generales)' },
    { value: 'BAJA', label: 'Baja (Informativas)' }
  ];

  ngOnInit(): void {
    this.cargarKpis();
    this.cargarLogs();
  }

  cargarKpis(): void {
    this.cargandoKpis.set(true);
    this.auditoriaService.getKpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.cargandoKpis.set(false);
      },
      error: (err) => {
        console.error('Error al cargar KPIs de auditoría:', err);
        this.cargandoKpis.set(false);
      }
    });
  }

  cargarLogs(): void {
    this.cargando.set(true);
    this.errorFeedback.set(null);

    const filtros: FiltrosAuditoria = {
      modulo: this.filtroModulo(),
      accion: this.filtroAccion(),
      severidad: this.filtroSeveridad(),
      q: this.terminoBusqueda(),
      fecha_desde: this.fechaDesde() || undefined,
      fecha_hasta: this.fechaHasta() || undefined,
      page: this.paginaActual(),
      pageSize: this.pageSize()
    };

    this.auditoriaService.getLogs(filtros).subscribe({
      next: (resp) => {
        this.logs.set(resp.items || []);
        this.totalLogs.set(resp.total || 0);
        this.totalPaginas.set(resp.totalPages || 1);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al consultar logs de auditoría:', err);
        this.errorFeedback.set('Ocurrió un error al cargar la bitácora de auditoría.');
        this.cargando.set(false);
      }
    });
  }

  buscar(): void {
    this.paginaActual.set(1);
    this.cargarLogs();
  }

  limpiarFiltros(): void {
    this.filtroModulo.set('TODOS');
    this.filtroAccion.set('TODOS');
    this.filtroSeveridad.set('TODAS');
    this.terminoBusqueda.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.paginaActual.set(1);
    this.cargarLogs();
  }

  cambiarFiltroRapido(modulo: string): void {
    this.filtroModulo.set(modulo);
    this.paginaActual.set(1);
    this.cargarLogs();
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
      this.cargarLogs();
    }
  }

  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual.set(p);
      this.cargarLogs();
    }
  }

  abrirDetalle(log: LogAuditoria): void {
    this.logSeleccionado.set(log);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.logSeleccionado.set(null);
  }

  sincronizarHistorial(): void {
    if (this.sincronizando()) return;
    this.sincronizando.set(true);
    this.mensajeFeedback.set(null);
    this.errorFeedback.set(null);

    this.auditoriaService.sincronizarHistorial().subscribe({
      next: (res) => {
        this.sincronizando.set(false);
        const count = res?.detalles?.total_generados || 0;
        this.mensajeFeedback.set(`Sincronización completada: ${count} nuevos eventos históricos indexados.`);
        this.cargarKpis();
        this.cargarLogs();
        setTimeout(() => this.mensajeFeedback.set(null), 5000);
      },
      error: (err) => {
        this.sincronizando.set(false);
        this.errorFeedback.set('Error al sincronizar historial.');
        console.error(err);
      }
    });
  }

  descargarReporteExcel(): void {
    if (this.exportando()) return;
    this.exportando.set(true);

    const filtros: FiltrosAuditoria = {
      modulo: this.filtroModulo(),
      accion: this.filtroAccion(),
      severidad: this.filtroSeveridad(),
      q: this.terminoBusqueda(),
      fecha_desde: this.fechaDesde() || undefined,
      fecha_hasta: this.fechaHasta() || undefined
    };

    this.auditoriaService.exportarDatos(filtros, 3000).subscribe({
      next: (datos) => {
        if (!datos || datos.length === 0) {
          alert('No hay registros para exportar con los filtros seleccionados.');
          this.exportando.set(false);
          return;
        }

        const dataExport = datos.map((it, idx) => ({
          '#': idx + 1,
          'Fecha / Hora': this.formatDateTime(it.timestamp),
          'Módulo': it.modulo,
          'Acción': it.accion,
          'Severidad': it.severidad,
          'Entidad / Identificador': it.entidad_id,
          'Referencia': it.entidad_referencia || '',
          'Descripción del Cambio': it.descripcion,
          'Acto Resolutivo de Sustento': it.acto_resolutivo_sustento || 'No especificado',
          'Expediente': it.expediente_numero || '',
          'Usuario / Responsable': it.usuario?.nombre || 'Administrador',
          'DNI Usuario': it.usuario?.dni || 'SISTEMA',
          'Rol': it.usuario?.rol || 'ADMIN',
          'Dirección IP': it.ip_address || '127.0.0.1'
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataExport);

        // Ajustar anchos de columnas
        ws['!cols'] = [
          { wch: 5 },   // #
          { wch: 19 },  // Fecha
          { wch: 14 },  // Módulo
          { wch: 18 },  // Acción
          { wch: 12 },  // Severidad
          { wch: 16 },  // Identificador
          { wch: 35 },  // Referencia
          { wch: 50 },  // Descripción
          { wch: 30 },  // Acto Resolutivo
          { wch: 15 },  // Expediente
          { wch: 28 },  // Usuario
          { wch: 12 },  // DNI
          { wch: 16 },  // Rol
          { wch: 15 }   // IP
        ];

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Libro de Auditoría');

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        XLSX.writeFile(wb, `DRTC_PUNO_Libro_Oficial_Auditoria_${dateStr}.xlsx`);
        this.exportando.set(false);
      },
      error: (err) => {
        console.error('Error al exportar libro de auditoría:', err);
        alert('Error al generar el reporte Excel de auditoría.');
        this.exportando.set(false);
      }
    });
  }

  // Helpers de Formato
  formatDateTime(iso: string): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return iso;
    }
  }

  formatDateOnly(iso: string): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  }

  getSeveridadBadge(sev: string): string {
    switch (sev) {
      case 'CRITICA': return 'badge-sev-critica';
      case 'ALTA': return 'badge-sev-alta';
      case 'MEDIA': return 'badge-sev-media';
      case 'BAJA': return 'badge-sev-baja';
      default: return 'badge-sev-media';
    }
  }

  getModuloBadge(mod: string): string {
    switch (mod) {
      case 'VEHICULOS': return 'badge-mod-vehiculos';
      case 'RUTAS': return 'badge-mod-rutas';
      case 'EMPRESAS': return 'badge-mod-empresas';
      case 'RESOLUCIONES': return 'badge-mod-resoluciones';
      case 'TUCS': return 'badge-mod-tucs';
      default: return 'badge-mod-general';
    }
  }

  getAccionBadge(acc: string): string {
    switch (acc) {
      case 'SUSTITUCION': return 'badge-acc-sustitucion';
      case 'INCREMENTO': return 'badge-acc-incremento';
      case 'REGISTRO': return 'badge-acc-registro';
      case 'MODIFICACION': return 'badge-acc-modificacion';
      case 'BAJA_VEHICULAR': return 'badge-acc-baja';
      case 'CAMBIO_ESTADO': return 'badge-acc-estado';
      default: return 'badge-acc-general';
    }
  }

  hasDiff(log: LogAuditoria): boolean {
    return !!(log.valores_anteriores || log.valores_nuevos);
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '<Vacío / No asignado>';
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '<Lista vacía>';
      return JSON.stringify(val);
    }
    return String(val);
  }
}
