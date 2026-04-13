import { Component, inject, signal, computed, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { BaseLocalidadesComponent } from './shared/base-localidades.component';
import { LocalidadModalComponent } from './localidad-modal.component';
import { MapaLocalidadModalComponent } from './mapa-localidad-modal.component';
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
    LocalidadModalComponent,
    MapaLocalidadModalComponent
  ],
  templateUrl: './localidades.component.html',
  styleUrls: ['./localidades.component.scss']
})
export class LocalidadesComponent extends BaseLocalidadesComponent {
  // Inyectar dependencias usando inject()
  private dialog = inject(MatDialog);
  protected http = inject(HttpClient);

  // Estado de filtros colapsables
  filtrosExpandidos = false;

  // Término de búsqueda
  terminoBusqueda = '';

  // Configuración de columnas visibles
  columnasDisponibles = [
    { key: 'nombre', label: 'Nombre', visible: true },
    { key: 'tipo', label: 'Tipo', visible: true },
    { key: 'ubicacion', label: 'Ubicación', visible: false },
    { key: 'poblacion', label: 'Población', visible: false },
    { key: 'coordenadas', label: 'Coordenadas', visible: true },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true }
  ];

  // Columnas visibles actualmente
  get columnasVisibles(): string[] {
    return this.columnasDisponibles
      .filter(col => col.visible)
      .map(col => col.key);
  }

  // Estadísticas totales - Se cargan una sola vez al inicio
  estadisticasTotales = signal({
    provincias: 0,
    distritos: 0,
    centrosPoblados: 0,
    aliases: 0
  });

  // Sobrescribir ngOnInit para cargar estadísticas totales
  override async ngOnInit() {
    await super.ngOnInit();
    await this.cargarEstadisticasTotales();
  }

  // Cargar estadísticas totales desde el servicio
  private async cargarEstadisticasTotales() {
    try {
      // Obtener TODAS las localidades incluyendo centros poblados
      const todasLasLocalidades = await this.localidadService.obtenerTodasLasLocalidades();
      
      // Contar solo localidades reales (sin aliases)
      const provincias = todasLasLocalidades.filter(l => l.tipo === 'PROVINCIA' && !l.metadata?.es_alias).length;
      const distritos = todasLasLocalidades.filter(l => l.tipo === 'DISTRITO' && !l.metadata?.es_alias).length;
      const centrosPoblados = todasLasLocalidades.filter(l => l.tipo === 'CENTRO_POBLADO' && !l.metadata?.es_alias).length;
      const aliases = todasLasLocalidades.filter(l => l.metadata?.es_alias).length;
      
      this.estadisticasTotales.set({
        provincias,
        distritos,
        centrosPoblados,
        aliases
      });
    } catch (error) {
      console.error('Error cargando estadísticas totales:', error);
    }
  }

  // Método para cargar estadísticas (mantener para compatibilidad)
  async cargarEstadisticasCompletas() {
    await this.cargarEstadisticasTotales();
  }

  // Método para importar localidades desde GeoJSON
  async abrirCargaMasiva() {
    // Importar dinámicamente el componente
    const { CargaMasivaGeojsonComponent } = await import('./carga-masiva-geojson.component');
    
    const dialogRef = this.dialog.open(CargaMasivaGeojsonComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: false
    });

    const recargar = await dialogRef.afterClosed().toPromise();
    
    if (recargar) {
      // Recargar datos si la importación fue exitosa
      await this.cargarLocalidades();
      await this.cargarEstadisticasCompletas();
      
      this.snackBar.open(
        '✅ Localidades importadas exitosamente',
        'Cerrar',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        }
      );
    }
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

  // Método para filtrar desde las tarjetas de estadísticas
  async filtrarPorTipo(tipo: string) {
    // Si ya está filtrado por este tipo, limpiar solo ese filtro y recargar
    if (this.filtrosService.tipo === tipo) {
      this.filtrosService.setTipo('');
      await this.cargarLocalidades();
      return;
    }

    // Aplicar filtro de tipo
    this.filtrosService.setTipo(tipo);
    
    // Si es CENTRO_POBLADO, mostrar mensaje y recargar
    if (tipo === 'CENTRO_POBLADO') {
      this.mostrarMensaje('Cargando centros poblados... Esto puede tardar unos segundos', 'info');
    }
    
    await this.cargarLocalidades();
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

  async filtrarPorAliases() {
    // Los aliases ya están en el cache expandido, solo filtrar
    this.cargando.set(true);
    try {
      // Usar el cache que ya tiene los aliases expandidos
      const todasLasLocalidades = this.localidadService.getLocalidadesCache();
      
      // Filtrar solo aliases
      const aliases = todasLasLocalidades.filter(l => l.metadata?.es_alias);
      this.localidades.set(aliases);
      this.dataSource.data = aliases;
      this.mostrarMensaje(`Mostrando ${aliases.length} aliases`, 'info');
    } catch (error) {
      console.error('Error cargando aliases:', error);
      this.mostrarMensaje('Error cargando aliases', 'error');
    } finally {
      this.cargando.set(false);
    }
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

  // Métodos específicos del componente
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

  // Signal para el modal del mapa
  mostrarMapa = signal(false);
  localidadMapa = signal<Localidad | null>(null);

  // Método para abrir el mapa de una localidad
  verEnMapa(localidad: Localidad) {
    console.log('🗺️ verEnMapa llamado para:', localidad.nombre);
    console.log('📍 Coordenadas:', localidad.coordenadas);
    this.localidadMapa.set(localidad);
    this.mostrarMapa.set(true);
    console.log('✅ Modal del mapa activado');
  }

  // Método para cerrar el modal del mapa
  cerrarMapa() {
    this.mostrarMapa.set(false);
    this.localidadMapa.set(null);
  }

  // Método para actualizar coordenadas desde el mapa
  async actualizarCoordenadas(coordenadas: {latitud: number, longitud: number}) {
    const localidad = this.localidadMapa();
    if (!localidad || !localidad.id) {
      console.error('❌ No hay localidad seleccionada o no tiene ID');
      return;
    }

    try {
      console.log('💾 Actualizando coordenadas en BD:', {
        localidadId: localidad.id,
        localidadNombre: localidad.nombre,
        coordenadas: coordenadas
      });

      // Preparar el objeto de actualización
      const updateData: LocalidadUpdate = {
        coordenadas: {
          latitud: coordenadas.latitud,
          longitud: coordenadas.longitud,
          esPersonalizada: true,
          fechaModificacion: new Date().toISOString(),
          fuenteOriginal: localidad.coordenadas?.fuenteOriginal || 'INEI',
          latitudOriginal: localidad.coordenadas?.latitudOriginal || localidad.coordenadas?.latitud,
          longitudOriginal: localidad.coordenadas?.longitudOriginal || localidad.coordenadas?.longitud
        }
      };

      console.log('📤 Enviando actualización:', updateData);

      // Actualizar en el backend
      const resultado = await this.localidadService.actualizarLocalidad(localidad.id, updateData);

      console.log('📥 Respuesta del backend:', resultado);

      // Actualizar en la lista local
      const index = this.localidades().findIndex(l => l.id === localidad.id);
      if (index !== -1) {
        const localidadesActualizadas = [...this.localidades()];
        localidadesActualizadas[index] = {
          ...localidadesActualizadas[index],
          coordenadas: updateData.coordenadas
        };
        this.localidades.set(localidadesActualizadas);
        console.log('✅ Lista local actualizada');
      }

      // Actualizar la localidad en el mapa también
      if (this.localidadMapa()) {
        this.localidadMapa.set({
          ...this.localidadMapa()!,
          coordenadas: updateData.coordenadas
        });
        console.log('✅ Localidad del mapa actualizada');
      }

      console.log('✅ Coordenadas actualizadas exitosamente en BD');
      alert('Coordenadas actualizadas correctamente');
    } catch (error: any) {
      console.error('❌ Error actualizando coordenadas:', error);
      console.error('❌ Detalles del error:', {
        message: error?.message,
        status: error?.status,
        error: error?.error
      });
      alert(`Error al guardar las coordenadas: ${error?.message || 'Error desconocido'}`);
    }
  }

  // Métodos para identificar alias
  esAlias(localidad: Localidad): boolean {
    return !!(localidad.metadata?.es_alias);
  }

  getNombreOriginal(localidad: Localidad): string {
    return localidad.metadata?.['localidad_nombre'] || 'localidad principal';
  }

  // Verificar si una localidad es un alias para deshabilitar acciones
  esAliasParaEditar(localidad: Localidad): boolean {
    return this.esAlias(localidad);
  }
}


// ============================================
// DIÁLOGOS DE IMPORTACIÓN
// ============================================

@Component({
  selector: 'confirmacion-importacion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>cloud_upload</mat-icon>
      Importar Localidades desde GeoJSON
    </h2>
    <mat-dialog-content>
      <p>¿Deseas importar/actualizar todas las localidades desde los archivos GeoJSON?</p>
      
      <div class="info-box">
        <h3>Esto incluye:</h3>
        <ul>
          <li><mat-icon>location_city</mat-icon> 13 Provincias</li>
          <li><mat-icon>map</mat-icon> 110 Distritos</li>
          <li><mat-icon>home</mat-icon> 9,372 Centros Poblados</li>
        </ul>
      </div>

      <p class="warning">
        <mat-icon>info</mat-icon>
        El proceso puede tardar unos segundos.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        <mat-icon>check</mat-icon>
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }

    mat-dialog-content {
      padding: 20px 24px;
    }

    .info-box {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;

      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 14px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #1976d2;
          }
        }
      }
    }

    .warning {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f57c00;
      font-size: 13px;
      margin: 16px 0 0 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }
  `]
})
export class ConfirmacionImportacionDialog {}

@Component({
  selector: 'resultado-importacion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="success">check_circle</mat-icon>
      Importación Completada
    </h2>
    <mat-dialog-content>
      <div class="resultado-grid">
        <div class="resultado-item success">
          <mat-icon>add_circle</mat-icon>
          <div class="resultado-info">
            <div class="numero">{{ data.total_importados }}</div>
            <div class="label">Importados</div>
          </div>
        </div>

        <div class="resultado-item info">
          <mat-icon>update</mat-icon>
          <div class="resultado-info">
            <div class="numero">{{ data.total_actualizados }}</div>
            <div class="label">Actualizados</div>
          </div>
        </div>

        <div class="resultado-item warning">
          <mat-icon>skip_next</mat-icon>
          <div class="resultado-info">
            <div class="numero">{{ data.total_omitidos }}</div>
            <div class="label">Omitidos</div>
          </div>
        </div>

        <div class="resultado-item error" *ngIf="data.total_errores > 0">
          <mat-icon>error</mat-icon>
          <div class="resultado-info">
            <div class="numero">{{ data.total_errores }}</div>
            <div class="label">Errores</div>
          </div>
        </div>
      </div>

      <div class="detalle" *ngIf="data.detalle">
        <h3>Detalle por tipo:</h3>
        <div class="detalle-item">
          <strong>Provincias:</strong> 
          {{ data.detalle.provincias.importados }} nuevas, 
          {{ data.detalle.provincias.actualizados }} actualizadas
        </div>
        <div class="detalle-item">
          <strong>Distritos:</strong> 
          {{ data.detalle.distritos.importados }} nuevos, 
          {{ data.detalle.distritos.actualizados }} actualizados
        </div>
        <div class="detalle-item">
          <strong>Centros Poblados:</strong> 
          {{ data.detalle.centros_poblados.importados }} nuevos, 
          {{ data.detalle.centros_poblados.actualizados }} actualizados
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>done</mat-icon>
        Aceptar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;

      mat-icon.success {
        color: #4caf50;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    mat-dialog-content {
      padding: 20px 24px;
      min-width: 400px;
    }

    .resultado-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .resultado-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: #f5f5f5;

      &.success {
        background: #e8f5e9;
        color: #2e7d32;
      }

      &.info {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.warning {
        background: #fff3e0;
        color: #f57c00;
      }

      &.error {
        background: #ffebee;
        color: #c62828;
      }

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .resultado-info {
        .numero {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .label {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }
      }
    }

    .detalle {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;

      h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
      }

      .detalle-item {
        font-size: 13px;
        padding: 4px 0;
        
        strong {
          color: #1976d2;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class ResultadoImportacionDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
