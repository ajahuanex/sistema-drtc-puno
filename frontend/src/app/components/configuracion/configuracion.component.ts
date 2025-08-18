import { Component, inject, OnInit } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal, computed } from '@angular/core';

import { 
  ConfiguracionSistema, 
  CategoriaConfiguracion,
  CONFIGURACIONES_DEFAULT 
} from '../../models/configuracion.model';
import { ConfiguracionService } from '../../services/configuracion.service';
import { EditarConfiguracionModalComponent } from './editar-configuracion-modal.component';

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
            <div class="configuraciones-grid">
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

              <!-- Notificaciones -->
              <mat-expansion-panel class="config-category-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>notifications</mat-icon>
                    Notificaciones
                  </mat-panel-title>
                  <mat-panel-description>
                    Configuraciones para el sistema de notificaciones
                  </mat-panel-description>
                </mat-expansion-panel-header>
                
                <div class="configuraciones-list">
                  <div *ngFor="let config of getConfiguracionesPorCategoria(CategoriaConfiguracion.NOTIFICACIONES)" 
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

        <!-- Tab de Tipos de Ruta -->
        <mat-tab label="Tipos de Ruta">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Tipos de Ruta</h2>
              <button mat-raised-button 
                      color="primary" 
                      (click)="agregarTipoRuta()">
                <mat-icon>add</mat-icon>
                Agregar Tipo
              </button>
            </div>

            <mat-table [dataSource]="tiposRuta()" class="config-table">
              <ng-container matColumnDef="codigo">
                <mat-header-cell *matHeaderCellDef>Código</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.codigo }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="nombre">
                <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.nombre }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="descripcion">
                <mat-header-cell *matHeaderCellDef>Descripción</mat-header-cell>
                <mat-cell *matCellDef="let tipo">{{ tipo.descripcion }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="estado">
                <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
                <mat-cell *matCellDef="let tipo">
                  <span class="estado-badge" [class.activo]="tipo.estaActivo">
                    {{ tipo.estaActivo ? 'Activo' : 'Inactivo' }}
                  </span>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
                <mat-cell *matCellDef="let tipo">
                  <button mat-icon-button 
                          color="primary" 
                          (click)="editarTipoRuta(tipo)"
                          matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          [color]="tipo.estaActivo ? 'warn' : 'primary'"
                          (click)="toggleEstadoTipoRuta(tipo)"
                          [matTooltip]="tipo.estaActivo ? 'Desactivar' : 'Activar'">
                    <mat-icon>{{ tipo.estaActivo ? 'block' : 'check_circle' }}</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
            </mat-table>
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

  tiposRuta = signal<TipoRuta[]>([
    { id: '1', codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Rutas entre provincias', estaActivo: true },
    { id: '2', codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Rutas entre ciudades', estaActivo: true },
    { id: '3', codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Rutas dentro de la ciudad', estaActivo: true },
    { id: '4', codigo: 'RURAL', nombre: 'Rural', descripcion: 'Rutas rurales', estaActivo: true }
  ]);

  displayedColumns = ['codigo', 'nombre', 'descripcion', 'estado', 'acciones'];

  // Signals para las configuraciones
  configuraciones = computed(() => this.configuracionService.configuraciones());
  configuracionesCargadas = computed(() => this.configuracionService.configuracionesCargadas());
  
  // Hacer disponible CategoriaConfiguracion en el template
  CategoriaConfiguracion = CategoriaConfiguracion;

  ngOnInit(): void {
    // Cargar configuraciones al inicializar
    this.configuracionService.cargarConfiguraciones().subscribe({
      next: (configuraciones) => {
        console.log('🔧 Configuraciones cargadas:', configuraciones.length);
      },
      error: (error) => {
        console.error('Error cargando configuraciones:', error);
        this.snackBar.open('Error cargando configuraciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Métodos para configuraciones del sistema
  getConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): ConfiguracionSistema[] {
    return this.configuracionService.getConfiguracionesPorCategoria(categoria);
  }

  editarConfiguracion(config: ConfiguracionSistema): void {
    const dialogRef = this.dialog.open(EditarConfiguracionModalComponent, {
      width: '600px',
      data: { configuracion: config },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔧 Configuración actualizada:', result);
        // La configuración ya se actualizó en el servicio, no necesitamos hacer nada más
      }
    });
  }

  resetearConfiguracion(nombre: string): void {
    this.configuracionService.resetearConfiguracion(nombre).subscribe({
      next: (configuracion) => {
        this.snackBar.open(`Configuración ${nombre} restaurada a valor por defecto`, 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error reseteando configuración:', error);
        this.snackBar.open('Error reseteando configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }

  resetearTodasLasConfiguraciones(): void {
    this.configuracionService.resetearTodasLasConfiguraciones().subscribe({
      next: (configuraciones) => {
        this.snackBar.open('Todas las configuraciones han sido restauradas a valores por defecto', 'Cerrar', { duration: 5000 });
      },
      error: (error) => {
        console.error('Error reseteando configuraciones:', error);
        this.snackBar.open('Error reseteando configuraciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  exportarConfiguraciones(): void {
    const configuracionesJson = this.configuracionService.exportarConfiguraciones();
    const blob = new Blob([configuracionesJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuraciones_sistema_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Configuraciones exportadas exitosamente', 'Cerrar', { duration: 3000 });
  }

  // Métodos para tipos de ruta (mantenidos del código original)
  agregarTipoRuta(): void {
    // TODO: Implementar modal para agregar tipo de ruta
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  editarTipoRuta(tipo: TipoRuta): void {
    // TODO: Implementar modal para editar tipo de ruta
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  toggleEstadoTipoRuta(tipo: TipoRuta): void {
    tipo.estaActivo = !tipo.estaActivo;
    this.tiposRuta.update(tipos => [...tipos]);
    
    const mensaje = tipo.estaActivo ? 'activado' : 'desactivado';
    this.snackBar.open(`Tipo de ruta ${mensaje} exitosamente`, 'Cerrar', { duration: 3000 });
  }
}