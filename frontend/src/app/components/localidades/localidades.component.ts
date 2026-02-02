import { Component } from '@angular/core';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { BaseLocalidadesComponent } from './shared/base-localidades.component';
import { FiltrosLocalidadesComponent } from './shared/filtros-localidades.component';
import { LocalidadModalComponent } from './localidad-modal.component';
import { InfoBaseDatosComponent } from './info-base-datos.component';
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
    FiltrosLocalidadesComponent,
    LocalidadModalComponent,
    InfoBaseDatosComponent
  ],
  templateUrl: './localidades.component.html',
  styleUrls: ['./localidades.component.scss']
})
export class LocalidadesComponent extends BaseLocalidadesComponent {
  // Estado de filtros colapsables
  filtrosExpandidos = false;

  // Término de búsqueda
  terminoBusqueda = '';

  // Método para toggle de filtros
  toggleFiltros() {
    this.filtrosExpandidos = !this.filtrosExpandidos;
  }

  // Método para buscar localidades
  buscarLocalidades(termino: string | Event) {
    let terminoTexto = '';

    if (typeof termino === 'string') {
      terminoTexto = termino;
    } else if (termino && termino.target) {
      terminoTexto = (termino.target as HTMLInputElement).value;
    }

    this.terminoBusqueda = terminoTexto.toLowerCase().trim();
    
    // Usar el servicio de filtros en lugar de lógica propia
    this.filtrosService.setTexto(this.terminoBusqueda);
  }

  // Método para limpiar búsqueda
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.filtrosService.setTexto('');

    // Limpiar el input visualmente
    const input = document.querySelector('input[placeholder="Nombre, ubigeo, departamento..."]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  // Aplicar filtros de búsqueda - ahora delegado al servicio
  private aplicarFiltrosBusqueda() {
    // Este método ya no es necesario porque el servicio maneja los filtros
    // pero lo mantenemos para compatibilidad
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