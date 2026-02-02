import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { 
  ConfiguracionSistema, 
  CategoriaConfiguracion,
  CONFIGURACIONES_DEFAULT 
} from '../../models/configuracion.model';
import { ConfiguracionService } from '../../services/configuracion.service';
import { EditarConfiguracionModalComponent } from './editar-configuracion-modal.component';
import { EditarConfiguracionConDefaultModalComponent } from './editar-configuracion-con-default-modal.component';
import { EditarEstadosVehiculosModalComponent } from './editar-estados-vehiculos-modal.component';
import { GestionarTiposRutaModalComponent } from './gestionar-tipos-ruta-modal.component';
import { GestionarTiposServicioModalComponent } from './gestionar-tipos-servicio-modal.component';

export interface TipoRuta {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="configuracion-container">
      <div class="page-header">
        <div>
          <h1>Configuración del Sistema</h1>
          <p>Gestionar parámetros y configuraciones por defecto de todos los módulos</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="accent" 
                  (click)="resetearTodasLasConfiguraciones()"
                  matTooltip="Restaurar todas las configuraciones a valores por defecto">
            <mat-icon>restore</mat-icon>
            Restaurar Valores por Defecto
          </button>
          <button mat-raised-button 
                  color="primary" 
                  (click)="exportarConfiguraciones()"
                  matTooltip="Exportar configuraciones actuales">
            <mat-icon>download</mat-icon>
            Exportar
          </button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab de Configuraciones del Sistema -->
        <mat-tab label="Configuraciones del Sistema">
          <div class="tab-content">
            <div class="configuraciones-container">
              <!-- Resoluciones -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>description</mat-icon>
                    Resoluciones
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones para el módulo de resoluciones
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.RESOLUCIONES)" 
                       class="config-item">
                    <div class="config-info">
                      <div class="config-header">
                        <h4>{{ config.nombre | titlecase }}</h4>
                        <mat-chip [color]="config.esEditable ? 'primary' : 'warn'">
                          {{ config.esEditable ? 'Editable' : 'Solo Lectura' }}
                        </mat-chip>
                      </div>
                      <p class="config-description">{{ config.descripcion }}</p>
                      <div class="config-value">
                        <strong>Valor actual:</strong> 
                        <span class="value-display">{{ config.valor }}</span>
                      </div>
                    </div>
                    <div class="config-actions" *ngIf="config.esEditable">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="editarConfiguracion(config)"
                              matTooltip="Editar valor">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              (click)="resetearConfiguracion(config.nombre)"
                              matTooltip="Restaurar valor por defecto">
                        <mat-icon>restore</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Expedientes -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>folder</mat-icon>
                    Expedientes
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones para el módulo de expedientes
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.EXPEDIENTES)" 
                       class="config-item">
                    <div class="config-info">
                      <div class="config-header">
                        <h4>{{ config.nombre | titlecase }}</h4>
                        <mat-chip [color]="config.esEditable ? 'primary' : 'warn'">
                          {{ config.esEditable ? 'Editable' : 'Solo Lectura' }}
                        </mat-chip>
                      </div>
                      <p class="config-description">{{ config.descripcion }}</p>
                      <div class="config-value">
                        <strong>Valor actual:</strong> 
                        <span class="value-display">{{ config.valor }}</span>
                      </div>
                    </div>
                    <div class="config-actions" *ngIf="config.esEditable">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="editarConfiguracion(config)"
                              matTooltip="Editar valor">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              (click)="resetearConfiguracion(config.nombre)"
                              matTooltip="Restaurar valor por defecto">
                        <mat-icon>restore</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Empresas -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>business</mat-icon>
                    Empresas
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones para el módulo de empresas
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.EMPRESAS)" 
                       class="config-item">
                    <div class="config-info">
                      <div class="config-header">
                        <h4>{{ config.nombre | titlecase }}</h4>
                        <mat-chip [color]="config.esEditable ? 'primary' : 'warn'">
                          {{ config.esEditable ? 'Editable' : 'Solo Lectura' }}
                        </mat-chip>
                      </div>
                      <p class="config-description">{{ config.descripcion }}</p>
                      <div class="config-value">
                        <strong>Valor actual:</strong> 
                        <span class="value-display">{{ config.valor }}</span>
                      </div>
                    </div>
                    <div class="config-actions" *ngIf="config.esEditable">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="editarConfiguracion(config)"
                              matTooltip="Editar valor">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              (click)="resetearConfiguracion(config.nombre)"
                              matTooltip="Restaurar valor por defecto">
                        <mat-icon>restore</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Vehículos -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>directions_bus</mat-icon>
                    Vehículos
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones para el módulo de vehículos y estados
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.VEHICULOS)" 
                       class="config-item">
                    <div class="config-info">
                      <div class="config-header">
                        <h4>{{ config.nombre | titlecase }}</h4>
                        <mat-chip [color]="config.esEditable ? 'primary' : 'warn'">
                          {{ config.esEditable ? 'Editable' : 'Solo Lectura' }}
                        </mat-chip>
                      </div>
                      <p class="config-description">{{ config.descripcion }}</p>
                      <div class="config-value">
                        <strong>Valor actual:</strong> 
                        <span class="value-display" [innerHTML]="formatearValorConfiguracion(config)"></span>
                      </div>
                    </div>
                    <div class="config-actions" *ngIf="config.esEditable">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="editarConfiguracion(config)"
                              matTooltip="Editar valor">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              (click)="resetearConfiguracion(config.nombre)"
                              matTooltip="Restaurar valor por defecto">
                        <mat-icon>restore</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>

              <!-- Sistema -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>settings</mat-icon>
                    Sistema
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones generales del sistema
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.SISTEMA)" 
                       class="config-item">
                    <div class="config-info">
                      <div class="config-header">
                        <h4>{{ config.nombre | titlecase }}</h4>
                        <mat-chip [color]="config.esEditable ? 'primary' : 'warn'">
                          {{ config.esEditable ? 'Editable' : 'Solo Lectura' }}
                        </mat-chip>
                      </div>
                      <p class="config-description">{{ config.descripcion }}</p>
                      <div class="config-value">
                        <strong>Valor actual:</strong> 
                        <span class="value-display">{{ config.valor }}</span>
                      </div>
                    </div>
                    <div class="config-actions" *ngIf="config.esEditable">
                      <button mat-icon-button 
                              color="primary" 
                              (click)="editarConfiguracion(config)"
                              matTooltip="Editar valor">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="accent" 
                              (click)="resetearConfiguracion(config.nombre)"
                              matTooltip="Restaurar valor por defecto">
                        <mat-icon>restore</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>
          </div>
        </mat-tab>

        <!-- Tab de Tipos de Ruta y Servicio -->
        <mat-tab label="Tipos de Ruta y Servicio">
          <div class="tab-content">
            <div class="tab-header">
              <div class="header-info">
                <h2>Gestión de Tipos</h2>
                <p>Configurar tipos de ruta y servicio disponibles en el sistema</p>
              </div>
              <div class="header-actions">
                <button mat-raised-button 
                        color="primary" 
                        (click)="gestionarTiposRuta()">
                  <mat-icon>category</mat-icon>
                  Gestionar Tipos de Ruta
                </button>
                <button mat-raised-button 
                        color="accent" 
                        (click)="gestionarTiposServicio()">
                  <mat-icon>business</mat-icon>
                  Gestionar Tipos de Servicio
                </button>
              </div>
            </div>

            <div class="tipos-info">
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>category</mat-icon>
                    Tipos de Ruta
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>Los tipos de ruta definen las categorías de rutas disponibles en el sistema (Urbana, Interprovincial, etc.).</p>
                  <div class="tipos-actuales">
                    <h4>Tipos actuales:</h4>
                    <div class="chips-container">
                      @for (tipo of getTiposRutaActuales(); track tipo) {
                        <mat-chip>{{ tipo }}</mat-chip>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>business</mat-icon>
                    Tipos de Servicio
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>Los tipos de servicio definen las modalidades de transporte disponibles (Pasajeros, Carga, Mixto, etc.).</p>
                  <div class="tipos-actuales">
                    <h4>Tipos actuales:</h4>
                    <div class="chips-container">
                      @for (tipo of getTiposServicioActuales(); track tipo) {
                        <mat-chip color="accent">{{ tipo }}</mat-chip>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private configuracionService = inject(ConfiguracionService);

  // Signals para las configuraciones
  configuraciones = computed(() => this.configuracionService.configuraciones());
  configuracionesCargadas = computed(() => this.configuracionService.configuracionesCargadas());
  
  // Hacer disponible CategoriaConfiguracion en el template
  CategoriaConfiguracion = CategoriaConfiguracion;

  ngOnInit(): void {
    // console.log removed for production
    
    // Las configuraciones ya están cargadas por el servicio
    const configuraciones = this.configuracionService.configuraciones();
    // console.log removed for production
  }

  // Métodos para configuraciones del sistema
  getConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): ConfiguracionSistema[] {
    return this.configuracionService.getConfiguracionesPorCategoria(categoria);
  }

  // Método para editar configuraciones
  editarConfiguracion(config: ConfiguracionSistema): void {
    // Usar modal especializado para configuraciones con valores por defecto
    if (config.tieneValorDefault) {
      const dialogRef = this.dialog.open(EditarConfiguracionConDefaultModalComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: { configuracion: config },
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // console.log removed for production
        }
      });
    } else {
      // Usar modal estándar para configuraciones simples
      const dialogRef = this.dialog.open(EditarConfiguracionModalComponent, {
        width: '600px',
        maxWidth: '90vw',
        data: { configuracion: config },
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // console.log removed for production
        }
      });
    }
  }

  // Método para resetear una configuración específica
  resetearConfiguracion(nombreConfig: string): void {
    this.configuracionService.resetearConfiguracion(nombreConfig).subscribe({
      next: () => {
        this.snackBar.open('Configuración restaurada a valor por defecto', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error reseteando configuración::', error);
        this.snackBar.open('Error reseteando configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Método para resetear todas las configuraciones
  resetearTodasLasConfiguraciones(): void {
    const confirmacion = confirm('¿Está seguro de que desea restaurar todas las configuraciones a sus valores por defecto? Esta acción no se puede deshacer.');
    
    if (confirmacion) {
      this.configuracionService.resetearTodasLasConfiguraciones().subscribe({
        next: () => {
          this.snackBar.open('Todas las configuraciones han sido restauradas', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error reseteando configuraciones::', error);
          this.snackBar.open('Error reseteando configuraciones', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  // Método para exportar configuraciones
  exportarConfiguraciones(): void {
    const configuraciones = this.configuracionService.configuraciones();
    const blob = new Blob([JSON.stringify(configuraciones, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuraciones_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Configuraciones exportadas exitosamente', 'Cerrar', { duration: 3000 });
  }

  formatearValorConfiguracion(config: ConfiguracionSistema): string {
    if (config.nombre === 'ESTADOS_VEHICULOS_CONFIG') {
      try {
        const estados = JSON.parse(config.valor);
        return estados.map((estado: any) => 
          `<span class="estado-chip" style="background-color: ${estado.color}; color: white; padding: 2px 8px; border-radius: 12px; margin: 2px; display: inline-block; font-size: 12px;">${estado.nombre}</span>`
        ).join(' ');
      } catch (error) {
        return config.valor;
      }
    }
    return config.valor;
  }

  // Métodos para gestión de tipos
  gestionarTiposRuta(): void {
    const dialogRef = this.dialog.open(GestionarTiposRutaModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // console.log removed for production
      }
    });
  }

  gestionarTiposServicio(): void {
    const dialogRef = this.dialog.open(GestionarTiposServicioModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // console.log removed for production
      }
    });
  }

  getTiposRutaActuales(): string[] {
    const config = this.configuracionService.getConfiguracion('TIPOS_RUTA_CONFIG');
    if (config && config.valor) {
      try {
        const tipos = JSON.parse(config.valor);
        return tipos.filter((t: any) => t.estaActivo).map((t: any) => t.nombre);
      } catch (error) {
        console.error('Error parseando tipos de ruta::', error);
      }
    }
    return ['Urbana', 'Interurbana', 'Interprovincial', 'Interregional', 'Rural'];
  }

  getTiposServicioActuales(): string[] {
    const config = this.configuracionService.getConfiguracion('TIPOS_SERVICIO_CONFIG');
    if (config && config.valor) {
      try {
        const tipos = JSON.parse(config.valor);
        return tipos.filter((t: any) => t.estaActivo).map((t: any) => t.nombre);
      } catch (error) {
        console.error('Error parseando tipos de servicio::', error);
      }
    }
    return ['Transporte de Pasajeros', 'Transporte de Carga', 'Transporte Mixto'];
  }
}