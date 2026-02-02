import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { LocalidadesFiltrosService } from './localidades-filtros.service';
import { LOCALIDADES_CONFIG } from './localidades.config';

@Component({
  selector: 'app-filtros-localidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <mat-card class="filtros-card">
      <mat-card-content>
        <div class="filtros-grid">
          <!-- Filtro de texto -->
          <mat-form-field appearance="outline" class="filtro-texto">
            <mat-label>Buscar</mat-label>
            <input matInput 
                   [value]="filtrosService.texto" 
                   (input)="onFiltroTextoChange($event)" 
                   placeholder="Nombre, provincia, distrito...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <!-- Filtro de departamento -->
          <mat-form-field appearance="outline" class="filtro-departamento">
            <mat-label>Departamento</mat-label>
            <mat-select [value]="filtrosService.departamento" 
                        (selectionChange)="onFiltroDepartamentoChange($event.value)">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let dept of config.departamentos" [value]="dept">
                {{ dept }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filtro de provincia -->
          <mat-form-field appearance="outline" class="filtro-provincia">
            <mat-label>Provincia</mat-label>
            <mat-select [value]="filtrosService.provincia" 
                        (selectionChange)="onFiltroProvinciaChange($event.value)">
              <mat-option value="">Todas</mat-option>
              <mat-option *ngFor="let prov of config.provincias" [value]="prov">
                {{ prov }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filtro de tipo -->
          <mat-form-field appearance="outline" class="filtro-tipo">
            <mat-label>Tipo</mat-label>
            <mat-select [value]="filtrosService.tipo" 
                        (selectionChange)="onFiltroTipoChange($event.value)">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let tipo of config.tiposLocalidad" [value]="tipo">
                {{ tipo }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filtro de nivel -->
          <mat-form-field appearance="outline" class="filtro-nivel">
            <mat-label>Nivel Territorial</mat-label>
            <mat-select [value]="filtrosService.nivel" 
                        (selectionChange)="onFiltroNivelChange($event.value)">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let nivel of config.nivelesTerritoriales" [value]="nivel">
                {{ nivel }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Filtro de estado -->
          <mat-form-field appearance="outline" class="filtro-estado">
            <mat-label>Estado</mat-label>
            <mat-select [value]="filtrosService.estado" 
                        (selectionChange)="onFiltroEstadoChange($event.value)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="true">Activas</mat-option>
              <mat-option value="false">Inactivas</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Acciones de filtros -->
          <div class="filtros-acciones">
            <button mat-stroked-button (click)="limpiarFiltros()" class="btn-limpiar">
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filtros-card {
      margin-bottom: 16px;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filtro-texto {
      grid-column: span 2;
      min-width: 300px;
    }

    .filtros-acciones {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-limpiar {
      height: 40px;
    }

    @media (max-width: 768px) {
      .filtros-grid {
        grid-template-columns: 1fr;
      }
      
      .filtro-texto {
        grid-column: span 1;
        min-width: unset;
      }
    }
  `]
})
export class FiltrosLocalidadesComponent {
  protected filtrosService = inject(LocalidadesFiltrosService);
  readonly config = LOCALIDADES_CONFIG;

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
  }

  onFiltroNivelChange(valor: string) {
    this.filtrosService.setNivel(valor);
  }

  onFiltroEstadoChange(valor: string) {
    this.filtrosService.setEstado(valor);
  }

  limpiarFiltros() {
    this.filtrosService.limpiarFiltros();
  }
}