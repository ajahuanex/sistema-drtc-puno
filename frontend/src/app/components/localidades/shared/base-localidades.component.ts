import { Component, ViewChild, OnInit, signal, computed, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LocalidadService } from '../../../services/localidad.service';
import { LocalidadesFiltrosService } from './localidades-filtros.service';
import { Localidad, TipoLocalidad, NivelTerritorial } from '../../../models/localidad.model';
import { LOCALIDADES_CONFIG } from '../../../config/localidades.config';

@Component({
  template: ''
})
export abstract class BaseLocalidadesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Servicios inyectados
  protected localidadService = inject(LocalidadService);
  protected filtrosService = inject(LocalidadesFiltrosService);
  protected snackBar = inject(MatSnackBar);

  // Signals para el estado
  localidades = signal<Localidad[]>([]);
  cargando = signal(false);
  mostrarModal = signal(false);
  localidadSeleccionada = signal<Localidad | null>(null);
  esEdicion = signal(false);

  // DataSource para la tabla
  dataSource = new MatTableDataSource<Localidad>([]);

  // Configuración desde config
  readonly config = LOCALIDADES_CONFIG;
  readonly columnasTabla = LOCALIDADES_CONFIG.columnasTabla;

  // Computed signals
  localidadesFiltradas = computed(() => {
    const localidadesBase = this.localidades();
    const filtradas = this.filtrosService.aplicarFiltros(localidadesBase);
    
    // Actualizar el dataSource
    this.dataSource.data = filtradas;
    
    return filtradas;
  });

  localidadesActivas = computed(() => 
    this.localidades().filter(l => l.estaActiva)
  );

  // Getters para acceso a filtros
  get filtros() {
    return this.filtrosService.filtros();
  }

  async ngOnInit() {
    await this.cargarLocalidades();
    this.configurarTabla();
  }

  // ========================================
  // MÉTODOS PRINCIPALES
  // ========================================

  async cargarLocalidades() {
    this.cargando.set(true);
    try {
      const filtroTipo = this.filtrosService.tipo;
      
      // 🚀 OPTIMIZACIÓN: Usar paginación del servidor
      // Solo cargar la primera página (25 registros por defecto)
      const pagina = this.paginator?.pageIndex || 0;
      const limite = this.paginator?.pageSize || 25;
      
      // Obtener ordenamiento actual
      const sortActive = this.sort?.active || 'nombre';
      const sortDirection = this.sort?.direction || 'asc';
      
      let localidades: Localidad[];
      
      if (filtroTipo === 'CENTRO_POBLADO') {
        // Si se filtra por CENTRO_POBLADO, usar paginación del servidor
        const resultado = await this.localidadService.obtenerLocalidadesPaginadas(
          pagina + 1, 
          limite, 
          { tipo: 'CENTRO_POBLADO' as any }
        );
        localidades = resultado.localidades;
        
        // Actualizar el total para el paginador
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = resultado.total;
          }
        });
        
        console.log(`✅ ${localidades.length} de ${resultado.total} centros poblados cargados (página ${pagina + 1})`);
      } else if (filtroTipo) {
        // Si hay otro filtro de tipo, usar paginación
        const resultado = await this.localidadService.obtenerLocalidadesPaginadas(
          pagina + 1, 
          limite, 
          { tipo: filtroTipo as any }
        );
        localidades = resultado.localidades;
        
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = resultado.total;
          }
        });
        
        console.log(`✅ ${localidades.length} de ${resultado.total} localidades tipo ${filtroTipo} cargadas (página ${pagina + 1})`);
      } else {
        // Sin filtro: cargar solo provincias y distritos (rápido)
        // Excluir centros poblados por defecto
        localidades = await this.localidadService.obtenerLocalidades();
        localidades = localidades.filter(l => l.tipo !== 'CENTRO_POBLADO');
        
        // Ordenar localmente
        localidades = this.ordenarLocalidades(localidades, sortActive, sortDirection);
        
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = localidades.length;
          }
        });
        
        console.log(`✅ ${localidades.length} localidades cargadas (sin centros poblados)`);
      }
      
      this.localidades.set(localidades);
      this.dataSource.data = localidades;
    } catch (error) {
      console.error('❌ Error cargando localidades:', error);
      this.mostrarMensaje('Error cargando localidades', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  private ordenarLocalidades(localidades: Localidad[], campo: string, direccion: string): Localidad[] {
    if (!campo || direccion === '') return localidades;
    
    return [...localidades].sort((a: any, b: any) => {
      let valorA = a[campo];
      let valorB = b[campo];
      
      // Manejar valores nulos o undefined
      if (valorA === null || valorA === undefined) valorA = '';
      if (valorB === null || valorB === undefined) valorB = '';
      
      // Convertir a string para comparación
      if (typeof valorA === 'string') valorA = valorA.toLowerCase();
      if (typeof valorB === 'string') valorB = valorB.toLowerCase();
      
      let comparacion = 0;
      if (valorA > valorB) {
        comparacion = 1;
      } else if (valorA < valorB) {
        comparacion = -1;
      }
      
      return direccion === 'asc' ? comparacion : -comparacion;
    });
  }

  async recargarDatos() {
    await this.cargarLocalidades();
    this.mostrarMensaje('Datos recargados exitosamente', 'success');
  }

  configurarTabla() {
    setTimeout(() => {
      if (this.paginator) {
        // NO asignar el paginator al dataSource cuando usamos paginación del servidor
        // this.dataSource.paginator = this.paginator;
        this.configurarPaginadorTextos();
        
        // 🚀 Escuchar cambios de página para cargar datos del servidor
        this.paginator.page.subscribe(() => {
          this.cargarLocalidades();
        });
      }
      
      if (this.sort) {
        this.dataSource.sort = this.sort;
        
        // Escuchar cambios de ordenamiento
        this.sort.sortChange.subscribe(() => {
          // Resetear a la primera página cuando cambia el ordenamiento
          if (this.paginator) {
            this.paginator.pageIndex = 0;
          }
          this.cargarLocalidades();
        });
      }
    });
  }

  private configurarPaginadorTextos() {
    if (!this.paginator) return;
    
    this.paginator._intl.itemsPerPageLabel = 'Elementos por página:';
    this.paginator._intl.nextPageLabel = 'Página siguiente';
    this.paginator._intl.previousPageLabel = 'Página anterior';
    this.paginator._intl.firstPageLabel = 'Primera página';
    this.paginator._intl.lastPageLabel = 'Última página';
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
  }

  // ========================================
  // MÉTODOS DE FILTROS
  // ========================================

  onFiltroTextoChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.filtrosService.setTexto(target.value);
  }

  onFiltroDepartamentoChange(valor: string) {
    this.filtrosService.setDepartamento(valor);
  }

  onFiltroProvinciaChange(valor: string) {
    this.filtrosService.setProvincia(valor);
  }

  onFiltroTipoChange(valor: string) {
    this.filtrosService.setTipo(valor);
    
    // 🚀 Si se selecciona CENTRO_POBLADO, mostrar mensaje y recargar datos
    if (valor === 'CENTRO_POBLADO') {
      this.mostrarMensaje('Cargando centros poblados... Esto puede tardar unos segundos', 'info');
      this.cargarLocalidades();
    }
  }

  onFiltroEstadoChange(valor: string) {
    this.filtrosService.setEstado(valor);
  }

  limpiarFiltros() {
    this.filtrosService.limpiarFiltros();
    
    // 🚀 Al limpiar filtros, recargar sin centros poblados
    this.cargarLocalidades();
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  localidadesOtros(): Localidad[] {
    return this.localidades().filter(l => 
      // Sin departamento o departamento vacío
      (!l.departamento || l.departamento.trim() === '') ||
      // Sin provincia o provincia vacía
      (!l.provincia || l.provincia.trim() === '') ||
      // Sin distrito o distrito vacío
      (!l.distrito || l.distrito.trim() === '')
    );
  }

  getTipoLabel(tipo?: TipoLocalidad): string {
    if (!tipo) return 'Distrito';
    return (this.config.tipoLabels as any)[tipo] || 'Distrito';
  }

  // ========================================
  // MÉTODOS DE ACCIONES
  // ========================================

  abrirModalNuevaLocalidad() {
    this.localidadSeleccionada.set(null);
    this.esEdicion.set(false);
    this.mostrarModal.set(true);
  }

  editarLocalidad(localidad: Localidad) {
    this.localidadSeleccionada.set(localidad);
    this.esEdicion.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.localidadSeleccionada.set(null);
    this.esEdicion.set(false);
  }

  async toggleEstado(localidad: Localidad) {
    try {
      const accionTexto = localidad.estaActiva ? 'desactivar' : 'activar';
      const confirmacion = confirm(`¿Estás seguro de ${accionTexto} la localidad "${localidad.nombre || 'Sin nombre'}"?`);
      
      if (!confirmacion) return;

      await this.localidadService.toggleEstadoLocalidad(localidad.id);
      const accion = localidad.estaActiva ? 'desactivada' : 'activada';
      this.mostrarMensaje(`Localidad ${accion} exitosamente`, 'success');
      await this.cargarLocalidades();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      this.mostrarMensaje('Error cambiando estado de localidad', 'error');
    }
  }

  async eliminarLocalidad(localidad: Localidad) {
    try {
      // 1️⃣ Primero verificar si está en uso
      const verificacion = await this.localidadService.verificarUsoLocalidad(localidad.id);
      
      if (verificacion.en_uso) {
        // 🚫 Mostrar mensaje detallado de por qué no se puede eliminar
        let mensaje = `❌ NO SE PUEDE ELIMINAR\n\n`;
        mensaje += `La localidad "${localidad.nombre}" está siendo utilizada en:\n\n`;
        
        if (verificacion.rutas_como_origen > 0) {
          mensaje += `• ${verificacion.rutas_como_origen} ruta(s) como ORIGEN\n`;
        }
        if (verificacion.rutas_como_destino > 0) {
          mensaje += `• ${verificacion.rutas_como_destino} ruta(s) como DESTINO\n`;
        }
        if (verificacion.rutas_en_itinerario > 0) {
          mensaje += `• ${verificacion.rutas_en_itinerario} ruta(s) en ITINERARIO\n`;
        }
        
        mensaje += `\n📋 Rutas afectadas:\n`;
        verificacion.rutas_afectadas.forEach((ruta: any) => {
          mensaje += `   - ${ruta.nombre}\n`;
        });
        
        mensaje += `\n💡 Primero debes actualizar o eliminar estas rutas.`;
        
        alert(mensaje);
        return;
      }

      // 2️⃣ Si no está en uso, proceder con confirmación
      const confirmacion = confirm(
        `⚠️ ATENCIÓN: Esta acción eliminará permanentemente la localidad "${localidad.nombre || 'Sin nombre'}".\n\n` +
        `Esta acción NO se puede deshacer.\n\n` +
        `¿Estás completamente seguro de continuar?`
      );
      
      if (!confirmacion) return;

      const segundaConfirmacion = confirm(
        `Última confirmación: ¿Eliminar "${localidad.nombre || 'Sin nombre'}"?`
      );
      
      if (!segundaConfirmacion) return;

      // 3️⃣ Eliminar
      await this.localidadService.eliminarLocalidad(localidad.id);
      this.mostrarMensaje('✅ Localidad eliminada exitosamente', 'success');
      await this.cargarLocalidades();
      
    } catch (error: any) {
      console.error('Error eliminando localidad:', error);
      
      let mensajeError = 'Error eliminando localidad';
      if (error?.error?.detail) {
        mensajeError = error.error.detail;
      } else if (error?.message) {
        mensajeError = error.message;
      }
      
      this.mostrarMensaje(mensajeError, 'error');
    }
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  protected mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warn' | 'info' = 'info') {
    const config = {
      duration: tipo === 'error' ? 4000 : 3000,
      panelClass: [`${tipo}-snackbar`]
    };
    
    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  debugFiltros() {
    console.log('🐛 [DEBUG] Localidades totales:', this.localidades().length);
    console.log('🐛 [DEBUG] Localidades filtradas:', this.localidadesFiltradas().length);
    console.log('🐛 [DEBUG] Filtros actuales:', this.filtros);
    console.log('🐛 [DEBUG] Muestra de datos:', this.localidades().slice(0, 2));
    
    // Debug específico para filtro OTROS
    const localidadesOtros = this.localidadesOtros();
    console.log('🐛 [DEBUG] Localidades OTROS (método):', localidadesOtros.length);
    console.log('🐛 [DEBUG] Localidades OTROS (detalle):', localidadesOtros.map(l => ({
      nombre: l.nombre,
      departamento: l.departamento,
      provincia: l.provincia,
      distrito: l.distrito,
      razon: this.getOtrosReason(l)
    })));
    
    // Debug del filtro aplicado
    if (this.filtros.departamento === 'OTROS') {
      const filtradas = this.filtrosService.aplicarFiltros(this.localidades());
      console.log('🐛 [DEBUG] Filtro OTROS aplicado - Resultados:', filtradas.length);
      console.log('🐛 [DEBUG] Filtro OTROS aplicado - Detalle:', filtradas.map(l => ({
        nombre: l.nombre,
        departamento: l.departamento,
        provincia: l.provincia,
        distrito: l.distrito
      })));
    }
  }

  private getOtrosReason(localidad: any): string {
    const reasons = [];
    if (!localidad.departamento || localidad.departamento.trim() === '') {
      reasons.push('sin departamento');
    }
    if (!localidad.provincia || localidad.provincia.trim() === '') {
      reasons.push('sin provincia');
    }
    if (!localidad.distrito || localidad.distrito.trim() === '') {
      reasons.push('sin distrito');
    }
    return reasons.join(', ') || 'datos completos';
  }
}