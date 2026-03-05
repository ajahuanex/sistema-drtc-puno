import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { BaseLocalidadesComponent } from './shared/base-localidades.component';
import { FiltrosLocalidadesComponent } from './shared/filtros-localidades.component';
import { LocalidadModalComponent } from './localidad-modal.component';
import { CargaMasivaGeojsonComponent } from './carga-masiva-geojson.component';
import { Localidad, LocalidadCreate, LocalidadUpdate } from '../../models/localidad.model';

@Component({
  selector: 'app-localidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    FiltrosLocalidadesComponent,
    LocalidadModalComponent
  ],
  templateUrl: './localidades.component.html',
  styleUrls: ['./localidades.component.scss']
})
export class LocalidadesComponent extends BaseLocalidadesComponent {
  // Inyectar MatDialog usando inject()
  private dialog = inject(MatDialog);

  // Estado de filtros colapsables
  filtrosExpandidos = false;

  // Término de búsqueda
  terminoBusqueda = '';

  // Configuración de columnas visibles
  columnasDisponibles = [
    { key: 'nombre', label: 'Nombre', visible: true },
    { key: 'tipo', label: 'Tipo', visible: true },
    { key: 'ubicacion', label: 'Ubicación', visible: true },
    { key: 'poblacion', label: 'Población', visible: false },
    { key: 'coordenadas', label: 'Coordenadas', visible: false },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true }
  ];

  // Columnas visibles actualmente
  get columnasVisibles(): string[] {
    return this.columnasDisponibles
      .filter(col => col.visible)
      .map(col => col.key);
  }

  // Estadísticas completas (cargadas una vez al inicio)
  estadisticasCompletas = {
    provincias: 0,
    distritos: 0,
    centrosPoblados: 0,
    otros: 0
  };

  // Sobrescribir ngOnInit para cargar estadísticas
  override async ngOnInit() {
    await super.ngOnInit();
    await this.cargarEstadisticasCompletas();
  }

  // Cargar estadísticas completas desde el backend
  async cargarEstadisticasCompletas() {
    try {
      // Hacer consultas paralelas para obtener conteos
      const [provincias, distritos, centrosPoblados] = await Promise.all([
        this.localidadService.obtenerLocalidades({ tipo: 'PROVINCIA' as any }),
        this.localidadService.obtenerLocalidades({ tipo: 'DISTRITO' as any }),
        this.localidadService.obtenerLocalidades({ tipo: 'CENTRO_POBLADO' as any })
      ]);

      this.estadisticasCompletas = {
        provincias: provincias.length,
        distritos: distritos.length,
        centrosPoblados: centrosPoblados.length,
        otros: this.localidadesOtros().length
      };

      console.log('📊 Estadísticas completas cargadas:', this.estadisticasCompletas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  // Método para abrir modal de carga masiva
  abrirCargaMasiva() {
    const dialogRef = this.dialog.open(CargaMasivaGeojsonComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'carga-masiva-dialog'
    });

    dialogRef.afterClosed().subscribe(async (recargar: boolean) => {
      if (recargar) {
        this.snackBar.open('Centros poblados importados exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        await this.cargarLocalidades();
      }
    });
  }

  // Método para toggle de filtros
  toggleFiltros() {
    this.filtrosExpandidos = !this.filtrosExpandidos;
  }

  // Métodos para configuración de columnas
  toggleColumna(key: string) {
    const columna = this.columnasDisponibles.find(c => c.key === key);
    if (columna) {
      columna.visible = !columna.visible;
    }
  }

  columnaVisible(key: string): boolean {
    return this.columnasDisponibles.find(c => c.key === key)?.visible || false;
  }

  // Métodos para filtrar desde las tarjetas de estadísticas
  async filtrarPorTipo(tipo: string) {
    // Si ya está filtrado por este tipo, limpiar solo ese filtro y recargar
    if (this.filtrosService.tipo === tipo) {
      this.filtrosService.setTipo('');
      // Recargar sin centros poblados
      await this.cargarLocalidades();
      return;
    }

    // Aplicar filtro de tipo
    this.filtrosService.setTipo(tipo);
    
    // Si es CENTRO_POBLADO, mostrar mensaje y recargar
    if (tipo === 'CENTRO_POBLADO') {
      this.mostrarMensaje('Cargando centros poblados... Esto puede tardar unos segundos', 'info');
      await this.cargarLocalidades();
    }
  }

  // Sobrescribir el método del componente base para evitar doble carga
  override onFiltroTipoChange(valor: string) {
    // Solo delegar al método filtrarPorTipo
    this.filtrarPorTipo(valor);
  }

  async filtrarPorOtros() {
    // Si ya está filtrado por OTROS, limpiar solo ese filtro
    if (this.filtrosService.departamento === 'OTROS') {
      this.filtrosService.setDepartamento('');
      return;
    }

    // Aplicar filtro de OTROS
    this.filtrosService.setDepartamento('OTROS');
  }

  // Método auxiliar para obtener la etiqueta del filtro activo
  get etiquetaFiltroActivo(): string {
    if (this.filtrosService.tipo) {
      const labels: { [key: string]: string } = {
        'PROVINCIA': 'Provincia',
        'DISTRITO': 'Distrito',
        'CENTRO_POBLADO': 'Centro Poblado',
        'DEPARTAMENTO': 'Departamento',
        'CIUDAD': 'Ciudad',
        'PUEBLO': 'Pueblo',
        'LOCALIDAD': 'Localidad'
      };
      return labels[this.filtrosService.tipo] || this.filtrosService.tipo;
    }
    if (this.filtrosService.departamento === 'OTROS') {
      return 'Otros';
    }
    if (this.filtrosService.departamento) {
      return this.filtrosService.departamento;
    }
    return '';
  }

  // Método para buscar localidades
  async buscarLocalidades(termino: string | Event) {
    let terminoTexto = '';

    if (typeof termino === 'string') {
      terminoTexto = termino;
    } else if (termino && termino.target) {
      terminoTexto = (termino.target as HTMLInputElement).value;
    }

    this.terminoBusqueda = terminoTexto.toLowerCase().trim();
    
    // Si hay término de búsqueda, buscar en TODAS las localidades (incluyendo centros poblados)
    if (this.terminoBusqueda.length >= 2) {
      this.cargando.set(true);
      try {
        // Buscar en el backend sin filtros de tipo
        const resultados = await this.localidadService.buscarLocalidades(this.terminoBusqueda, 100);
        this.localidades.set(resultados);
        this.dataSource.data = resultados;
      } catch (error) {
        console.error('Error buscando localidades:', error);
      } finally {
        this.cargando.set(false);
      }
    } else {
      // Si no hay búsqueda, volver a cargar según filtros actuales
      this.filtrosService.setTexto(this.terminoBusqueda);
      if (!this.terminoBusqueda) {
        await this.cargarLocalidades();
      }
    }
  }

  // Método para limpiar búsqueda y filtros
  async limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.filtrosService.setTexto('');
    this.filtrosService.setTipo('');
    this.filtrosService.setDepartamento('');

    // Limpiar el input visualmente
    const input = document.querySelector('input[placeholder="Nombre, ubigeo, departamento..."]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    
    // Recargar datos sin filtros
    await this.cargarLocalidades();
  }

  // Obtener número de resultados filtrados
  get resultadosFiltrados(): number {
    return this.localidadesFiltradas().length;
  }

  // Obtener provincias disponibles para el filtro
  getProvinciasDisponibles(): string[] {
    const provincias = new Set<string>();
    this.localidades().forEach(localidad => {
      if (localidad.provincia && localidad.provincia.trim()) {
        provincias.add(localidad.provincia);
      }
    });
    return Array.from(provincias).sort();
  }

  // Método para ver localidad en el mapa
  verEnMapa(localidad: Localidad) {
    if (localidad.coordenadas?.latitud && localidad.coordenadas?.longitud) {
      const lat = localidad.coordenadas.latitud;
      const lng = localidad.coordenadas.longitud;
      
      // Abrir Google Maps en una nueva pestaña
      const url = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
      window.open(url, '_blank');
      
      this.mostrarMensaje(`Abriendo mapa de ${localidad.nombre}`, 'info');
    } else {
      this.mostrarMensaje('Esta localidad no tiene coordenadas', 'warn');
    }
  }

  // Métodos específicos del componente (si los hay)
  async guardarLocalidad(datosLocalidad: LocalidadCreate | LocalidadUpdate) {
    try {
      if (this.esEdicion()) {
        const localidad = this.localidadSeleccionada();
        if (localidad) {
          await this.localidadService.actualizarLocalidad(localidad.id, datosLocalidad as LocalidadUpdate);
          this.mostrarMensaje('Localidad actualizada exitosamente', 'success');
        }
      } else {
        await this.localidadService.crearLocalidad(datosLocalidad as LocalidadCreate);
        this.mostrarMensaje('Localidad creada exitosamente', 'success');
      }

      this.cerrarModal();
      await this.cargarLocalidades();
    } catch (error: any) {
      console.error('Error guardando localidad:', error);

      let mensajeError = 'Error guardando localidad';
      if (error?.error?.detail) {
        mensajeError = error.error.detail;
      } else if (error?.message) {
        mensajeError = error.message;
      }

      this.mostrarMensaje(mensajeError, 'error');
    }
  }
}