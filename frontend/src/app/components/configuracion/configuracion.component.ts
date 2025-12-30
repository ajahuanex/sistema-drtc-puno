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
import { Localidad, TipoLocalidad } from '../../models/localidad.model';
import { ConfiguracionService } from '../../services/configuracion.service';
import { LocalidadService } from '../../services/localidad.service';
import { EditarConfiguracionModalComponent } from './editar-configuracion-modal.component';
import { EditarEstadosVehiculosModalComponent } from './editar-estados-vehiculos-modal.component';
import { GestionarLocalidadModalComponent } from './gestionar-localidad-modal.component';

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

        <!-- Tab de Localidades -->
        <mat-tab label="Localidades">
          <div class="tab-content">
            <div class="tab-header">
              <div class="header-info">
                <h2>Gestión de Localidades</h2>
                <p>Configurar orígenes y destinos disponibles para las rutas</p>
              </div>
              <div class="header-actions">
                <button mat-raised-button 
                        color="accent" 
                        (click)="resetearLocalidades()"
                        matTooltip="Restaurar localidades por defecto">
                  <mat-icon>restore</mat-icon>
                  Restaurar
                </button>
                <button mat-raised-button 
                        color="primary" 
                        (click)="exportarLocalidades()"
                        matTooltip="Exportar localidades">
                  <mat-icon>download</mat-icon>
                  Exportar
                </button>
                <button mat-raised-button 
                        color="primary" 
                        (click)="agregarLocalidad()"
                        onclick="console.log('CLICK DIRECTO DETECTADO')">
                  <mat-icon>add_location</mat-icon>
                  Agregar Localidad
                </button>
              </div>
            </div>

            <!-- Filtros -->
            <div class="filtros-section">
              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Buscar localidades</mat-label>
                <input matInput 
                       placeholder="Nombre, código, departamento..."
                       (input)="filtrarLocalidades($event)">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filtro-field">
                <mat-label>Filtrar por tipo</mat-label>
                <mat-select [value]="tipoFiltroLocalidades()" 
                           (selectionChange)="filtrarPorTipo($event.value)">
                  <mat-option value="">Todos los tipos</mat-option>
                  <mat-option value="CIUDAD">Ciudad</mat-option>
                  <mat-option value="PUEBLO">Pueblo</mat-option>
                  <mat-option value="DISTRITO">Distrito</mat-option>
                  <mat-option value="PROVINCIA">Provincia</mat-option>
                  <mat-option value="DEPARTAMENTO">Departamento</mat-option>
                  <mat-option value="CENTRO_POBLADO">Centro Poblado</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Tabla de localidades -->
            @if (cargandoLocalidades()) {
              <div class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Cargando localidades...</p>
              </div>
            } @else {
              <mat-table [dataSource]="localidadesFiltradas()" class="localidades-table">
                <ng-container matColumnDef="codigo">
                  <mat-header-cell *matHeaderCellDef>Código</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">
                    <span class="codigo-badge">{{ localidad.codigo }}</span>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="nombre">
                  <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">
                    <div class="localidad-info">
                      <span class="nombre">{{ localidad.nombre }}</span>
                      @if (localidad.descripcion) {
                        <small class="descripcion">{{ localidad.descripcion }}</small>
                      }
                    </div>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="tipo">
                  <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">
                    <span class="tipo-badge" [class]="'tipo-' + localidad.tipo.toLowerCase()">
                      {{ getTipoLocalidadLabel(localidad.tipo) }}
                    </span>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="departamento">
                  <mat-header-cell *matHeaderCellDef>Departamento</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">{{ localidad.departamento }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="provincia">
                  <mat-header-cell *matHeaderCellDef>Provincia</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">{{ localidad.provincia }}</mat-cell>
                </ng-container>

                <ng-container matColumnDef="estado">
                  <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">
                    <span class="estado-badge" [class.activo]="localidad.estaActiva">
                      {{ localidad.estaActiva ? 'Activa' : 'Inactiva' }}
                    </span>
                  </mat-cell>
                </ng-container>

                <ng-container matColumnDef="acciones">
                  <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">
                    <button mat-icon-button 
                            color="primary" 
                            (click)="editarLocalidad(localidad)"
                            matTooltip="Editar localidad">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button 
                            [color]="localidad.estaActiva ? 'warn' : 'primary'"
                            (click)="toggleEstadoLocalidad(localidad)"
                            [matTooltip]="localidad.estaActiva ? 'Desactivar' : 'Activar'">
                      <mat-icon>{{ localidad.estaActiva ? 'block' : 'check_circle' }}</mat-icon>
                    </button>
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="displayedColumnsLocalidades"></mat-header-row>
                <mat-row *matRowDef="let row; columns: displayedColumnsLocalidades;"></mat-row>
              </mat-table>

              <!-- Paginador -->
              <mat-paginator 
                [length]="totalLocalidades()"
                [pageSize]="tamanioPagina()"
                [pageIndex]="paginaActual()"
                [pageSizeOptions]="[5, 10, 25, 50]"
                (page)="onPaginaChange($event)"
                showFirstLastButtons>
              </mat-paginator>
            }
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
  private localidadService = inject(LocalidadService);

  // Signals para tipos de ruta
  tiposRuta = signal<TipoRuta[]>([
    { id: '1', codigo: 'INTERPROVINCIAL', nombre: 'Interprovincial', descripcion: 'Rutas entre provincias', estaActivo: true },
    { id: '2', codigo: 'INTERURBANA', nombre: 'Interurbana', descripcion: 'Rutas entre ciudades', estaActivo: true },
    { id: '3', codigo: 'URBANA', nombre: 'Urbana', descripcion: 'Rutas dentro de la ciudad', estaActivo: true },
    { id: '4', codigo: 'RURAL', nombre: 'Rural', descripcion: 'Rutas rurales', estaActivo: true }
  ]);

  // Signals para localidades
  localidades = signal<Localidad[]>([]);
  localidadesFiltradas = signal<Localidad[]>([]);
  cargandoLocalidades = signal<boolean>(false);
  filtroLocalidades = signal<string>('');
  tipoFiltroLocalidades = signal<TipoLocalidad | ''>('');
  
  // Paginación
  paginaActual = signal<number>(0);
  tamanioPagina = signal<number>(10);
  totalLocalidades = signal<number>(0);

  displayedColumns = ['codigo', 'nombre', 'descripcion', 'estado', 'acciones'];
  displayedColumnsLocalidades = ['codigo', 'nombre', 'tipo', 'departamento', 'provincia', 'estado', 'acciones'];

  // Signals para las configuraciones
  configuraciones = computed(() => this.configuracionService.configuraciones());
  configuracionesCargadas = computed(() => this.configuracionService.configuracionesCargadas());
  
  // Hacer disponible CategoriaConfiguracion en el template
  CategoriaConfiguracion = CategoriaConfiguracion;

  ngOnInit(): void {
    console.log('🔧 Inicializando componente de configuración...');
    
    // Las configuraciones ya están cargadas por el servicio
    // Solo verificar que estén disponibles
    const configuraciones = this.configuracionService.configuraciones();
    console.log('📊 Configuraciones disponibles:', configuraciones.length);

    // Cargar localidades
    this.cargarLocalidades();
  }

  // Métodos para configuraciones del sistema
  getConfiguracionesPorCategoria(categoria: CategoriaConfiguracion): ConfiguracionSistema[] {
    return this.configuracionService.getConfiguracionesPorCategoria(categoria);
  }

  editarConfiguracion(config: ConfiguracionSistema): void {
    // Usar modal especializado para estados de vehículos
    if (config.nombre === 'ESTADOS_VEHICULOS_CONFIG') {
      const dialogRef = this.dialog.open(EditarEstadosVehiculosModalComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: { configuracion: config },
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('🔧 Estados de vehículos actualizados:', result);
        }
      });
      return;
    }

    // Modal estándar para otras configuraciones
    const dialogRef = this.dialog.open(EditarConfiguracionModalComponent, {
      width: '600px',
      data: { configuracion: config },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🔧 Configuración actualizada:', result);
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

  // Métodos para gestión de localidades
  cargarLocalidades(): void {
    this.cargandoLocalidades.set(true);
    
    const filtros = {
      nombre: this.filtroLocalidades() || undefined,
      tipo: this.tipoFiltroLocalidades() || undefined
    };

    this.localidadService.getLocalidades(filtros).subscribe({
      next: (localidades) => {
        console.log('✅ Localidades cargadas en componente:', localidades.length);
        this.localidades.set(localidades);
        this.aplicarFiltrosLocalidades();
        this.cargandoLocalidades.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando localidades:', error);
        this.snackBar.open('Error cargando localidades', 'Cerrar', { duration: 3000 });
        this.cargandoLocalidades.set(false);
      }
    });
  }

  aplicarFiltrosLocalidades(): void {
    let localidadesFiltradas = [...this.localidades()];
    
    const filtroNombre = this.filtroLocalidades().toLowerCase();
    const filtroTipo = this.tipoFiltroLocalidades();
    
    if (filtroNombre) {
      localidadesFiltradas = localidadesFiltradas.filter(localidad =>
        localidad.nombre.toLowerCase().includes(filtroNombre) ||
        localidad.codigo.toLowerCase().includes(filtroNombre) ||
        localidad.departamento.toLowerCase().includes(filtroNombre) ||
        localidad.provincia.toLowerCase().includes(filtroNombre)
      );
    }
    
    if (filtroTipo) {
      localidadesFiltradas = localidadesFiltradas.filter(localidad =>
        localidad.tipo === filtroTipo
      );
    }
    
    this.totalLocalidades.set(localidadesFiltradas.length);
    
    // Aplicar paginación
    const inicio = this.paginaActual() * this.tamanioPagina();
    const fin = inicio + this.tamanioPagina();
    const localidadesPagina = localidadesFiltradas.slice(inicio, fin);
    
    this.localidadesFiltradas.set(localidadesPagina);
  }

  filtrarLocalidades(evento: Event): void {
    const filtro = (evento.target as HTMLInputElement).value;
    this.filtroLocalidades.set(filtro);
    this.paginaActual.set(0);
    this.aplicarFiltrosLocalidades();
  }

  filtrarPorTipo(tipo: TipoLocalidad | ''): void {
    this.tipoFiltroLocalidades.set(tipo);
    this.paginaActual.set(0);
    this.aplicarFiltrosLocalidades();
  }

  onPaginaChange(evento: PageEvent): void {
    this.paginaActual.set(evento.pageIndex);
    this.tamanioPagina.set(evento.pageSize);
    this.aplicarFiltrosLocalidades();
  }

  agregarLocalidad(): void {
    console.log('🔍 BOTÓN AGREGAR LOCALIDAD CLICKEADO');
    console.log('🔍 Dialog disponible:', !!this.dialog);
    console.log('🔍 GestionarLocalidadModalComponent:', GestionarLocalidadModalComponent);
    
    try {
      const dialogRef = this.dialog.open(GestionarLocalidadModalComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: { modo: 'crear' },
        disableClose: true
      });

      console.log('✅ Modal abierto exitosamente:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔍 Modal cerrado con resultado:', result);
        if (result) {
          this.cargarLocalidades();
        }
      });
    } catch (error) {
      console.error('❌ Error abriendo modal:', error);
    }
  }

  editarLocalidad(localidad: Localidad): void {
    const dialogRef = this.dialog.open(GestionarLocalidadModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { 
        modo: 'editar',
        localidad: localidad
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarLocalidades();
      }
    });
  }

  toggleEstadoLocalidad(localidad: Localidad): void {
    this.localidadService.toggleEstadoLocalidad(localidad.id).subscribe({
      next: (localidadActualizada) => {
        const mensaje = localidadActualizada.estaActiva ? 'activada' : 'desactivada';
        this.snackBar.open(`Localidad ${mensaje} exitosamente`, 'Cerrar', { duration: 3000 });
        this.cargarLocalidades();
      },
      error: (error) => {
        console.error('Error cambiando estado de localidad:', error);
        this.snackBar.open('Error al cambiar estado de la localidad', 'Cerrar', { duration: 3000 });
      }
    });
  }

  exportarLocalidades(): void {
    const localidadesJson = this.localidadService.exportarLocalidades();
    const blob = new Blob([localidadesJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localidades_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Localidades exportadas exitosamente', 'Cerrar', { duration: 3000 });
  }

  resetearLocalidades(): void {
    this.localidadService.resetearLocalidades().subscribe({
      next: (localidades) => {
        this.snackBar.open('Localidades restauradas a valores por defecto', 'Cerrar', { duration: 3000 });
        this.cargarLocalidades();
      },
      error: (error) => {
        console.error('Error reseteando localidades:', error);
        this.snackBar.open('Error reseteando localidades', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getTipoLocalidadLabel(tipo: TipoLocalidad): string {
    const tipos = {
      'CIUDAD': 'Ciudad',
      'PUEBLO': 'Pueblo',
      'DISTRITO': 'Distrito',
      'PROVINCIA': 'Provincia',
      'DEPARTAMENTO': 'Departamento',
      'CENTRO_POBLADO': 'Centro Poblado'
    };
    return tipos[tipo] || tipo;
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
}