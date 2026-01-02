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
import { EditarConfiguracionConDefaultModalComponent } from './editar-configuracion-con-default-modal.component';
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
            <div class="configuraciones-container">
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
                        color="primary" 
                        (click)="agregarLocalidad()">
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

                <ng-container matColumnDef="departamento">
                  <mat-header-cell *matHeaderCellDef>Departamento</mat-header-cell>
                  <mat-cell *matCellDef="let localidad">{{ localidad.departamento }}</mat-cell>
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
                  </mat-cell>
                </ng-container>

                <mat-header-row *matHeaderRowDef="displayedColumnsLocalidades"></mat-header-row>
                <mat-row *matRowDef="let row; columns: displayedColumnsLocalidades;"></mat-row>
              </mat-table>
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

  // Signals para localidades
  localidades = signal<Localidad[]>([]);
  localidadesFiltradas = signal<Localidad[]>([]);
  cargandoLocalidades = signal<boolean>(false);
  filtroLocalidades = signal<string>('');

  displayedColumnsLocalidades = ['codigo', 'nombre', 'departamento', 'acciones'];

  // Signals para las configuraciones
  configuraciones = computed(() => this.configuracionService.configuraciones());
  configuracionesCargadas = computed(() => this.configuracionService.configuracionesCargadas());
  
  // Hacer disponible CategoriaConfiguracion en el template
  CategoriaConfiguracion = CategoriaConfiguracion;

  ngOnInit(): void {
    console.log('🔧 Inicializando componente de configuración...');
    
    // Las configuraciones ya están cargadas por el servicio
    const configuraciones = this.configuracionService.configuraciones();
    console.log('📊 Configuraciones disponibles:', configuraciones.length);

    // Cargar localidades
    this.cargarLocalidades();
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
          console.log('Configuración actualizada');
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
          console.log('Configuración actualizada');
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
        console.error('Error reseteando configuración:', error);
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
          console.error('Error reseteando configuraciones:', error);
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

  // Métodos para localidades
  cargarLocalidades(): void {
    this.cargandoLocalidades.set(true);
    // Simular carga de localidades por ahora
    setTimeout(() => {
      const localidadesMock: Localidad[] = [
        {
          id: '1',
          codigo: 'PUNO001',
          nombre: 'Puno',
          tipo: 'CIUDAD' as TipoLocalidad,
          departamento: 'Puno',
          provincia: 'Puno',
          distrito: 'Puno',
          estaActiva: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date()
        },
        {
          id: '2',
          codigo: 'JULI001',
          nombre: 'Juliaca',
          tipo: 'CIUDAD' as TipoLocalidad,
          departamento: 'Puno',
          provincia: 'San Román',
          distrito: 'Juliaca',
          estaActiva: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date()
        }
      ];
      
      this.localidades.set(localidadesMock);
      this.aplicarFiltros();
      this.cargandoLocalidades.set(false);
    }, 1000);
  }

  private aplicarFiltros(): void {
    let localidadesFiltradas = [...this.localidades()];
    const filtroNombre = this.filtroLocalidades().toLowerCase();
    
    if (filtroNombre) {
      localidadesFiltradas = localidadesFiltradas.filter(localidad =>
        localidad.nombre.toLowerCase().includes(filtroNombre) ||
        localidad.codigo.toLowerCase().includes(filtroNombre) ||
        localidad.departamento.toLowerCase().includes(filtroNombre)
      );
    }
    
    this.localidadesFiltradas.set(localidadesFiltradas);
  }

  filtrarLocalidades(evento: Event): void {
    const filtro = (evento.target as HTMLInputElement).value;
    this.filtroLocalidades.set(filtro);
    this.aplicarFiltros();
  }

  agregarLocalidad(): void {
    const dialogRef = this.dialog.open(GestionarLocalidadModalComponent, {
      width: '600px',
      data: { localidad: null, esEdicion: false },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarLocalidades();
      }
    });
  }

  editarLocalidad(localidad: Localidad): void {
    const dialogRef = this.dialog.open(GestionarLocalidadModalComponent, {
      width: '600px',
      data: { localidad: localidad, esEdicion: true },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarLocalidades();
      }
    });
  }
}