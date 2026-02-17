import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RutaService } from '../../services/ruta.service';

// Interfaces unificadas
interface ResultadoCargaMasiva {
  // Datos de validación
  total_filas?: number;
  validos?: number;
  invalidos?: number;
  con_advertencias?: number;

  // Datos de procesamiento
  total_procesadas?: number;
  exitosas?: number;
  fallidas?: number;
  total_creadas?: number;

  // Rutas creadas
  rutas_creadas?: Array<{
    codigo?: string;
    codigo_ruta?: string;
    nombre: string;
    id: string;
    tipo_ruta?: string;
    estado?: string;
  }>;

  // Errores y advertencias
  errores?: Array<{
    fila?: number;
    codigo_ruta?: string;
    codigo?: string;
    error?: string;
    errores?: string[];
  }>;

  advertencias?: Array<{
    fila?: number;
    codigo_ruta?: string;
    advertencias?: string[];
  }>;

  errores_procesamiento?: Array<{
    codigo_ruta?: string;
    error?: string;
  }>;

  errores_creacion?: Array<{
    codigo_ruta?: string;
    error?: string;
  }>;

  // Resultado anidado (para compatibilidad)
  resultado?: {
    total_procesadas?: number;
    exitosas?: number;
    fallidas?: number;
    rutas_creadas?: Array<any>;
    errores_procesamiento?: Array<any>;
    errores_creacion?: Array<any>;
  };

  // NUEVO: Estructura de respuesta del backend
  validacion?: {
    total_filas?: number;
    validos?: number;
    invalidos?: number;
    con_advertencias?: number;
    errores?: Array<any>;
    advertencias?: Array<any>;
    rutas_validas?: Array<any>;
  };

  // Metadatos de respuesta
  archivo?: string;
  mensaje?: string;
}

@Component({
  selector: 'app-carga-masiva-rutas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  template: `
    <div class="carga-masiva-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="title-icon">upload</mat-icon>
            Carga Masiva de Rutas
          </mat-card-title>
          <mat-card-subtitle>
            Importar múltiples rutas desde un archivo Excel
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-stepper #stepper [linear]="false" class="stepper-container">
        <!-- Paso 1: Descargar Plantilla -->
        <mat-step label="Descargar Plantilla" [completed]="plantillaDescargada">
          <mat-card class="step-card">
            <mat-card-content>
              <div class="step-content">
                <mat-icon class="step-icon">download</mat-icon>
                <h3>Paso 1: Descargar la plantilla Excel</h3>
                <p>Descarga la plantilla oficial para cargar rutas con validaciones automáticas.</p>
                
                <!-- Información importante sobre localidades -->
                <div class="info-section localidades-info">
                  <mat-icon class="info-icon">info</mat-icon>
                  <div class="info-content">
                    <h5>📍 Información Importante sobre Localidades</h5>
                    <p>Las localidades que incluyas en tu archivo Excel serán procesadas automáticamente:</p>
                    <ul>
                      <li><strong>Localidades existentes:</strong> Se vincularán con la base de datos principal</li>
                      <li><strong>Localidades nuevas:</strong> Se crearán automáticamente como tipo "OTROS"</li>
                    </ul>
                    <p class="info-note">No necesitas preocuparte por crear las localidades previamente.</p>
                  </div>
                </div>
                
                <div class="action-buttons">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="descargarPlantilla()"
                          [disabled]="cargando">
                    <mat-icon>download</mat-icon>
                    Descargar Plantilla Excel
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-step>

        <!-- Paso 2: Subir Archivo -->
        <mat-step label="Subir Archivo" [completed]="archivoSeleccionado !== null">
          <mat-card class="step-card">
            <mat-card-content>
              <div class="step-content">
                <mat-icon class="step-icon">upload</mat-icon>
                <h3>Paso 2: Subir archivo Excel</h3>
                
                <!-- Zona de arrastrar y soltar -->
                <div class="upload-zone" 
                     [class.drag-over]="isDragOver"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">
                  
                  <input #fileInput 
                         type="file" 
                         accept=".xlsx,.xls" 
                         (change)="onFileSelected($event)"
                         style="display: none;">
                  
                  <div class="upload-content">
                    @if (archivoSeleccionado) {
                      <mat-icon class="upload-icon success">check_circle</mat-icon>
                      <h4>Archivo seleccionado</h4>
                      <p>{{ archivoSeleccionado.name }}</p>
                      <p class="file-size">{{ formatFileSize(archivoSeleccionado.size) }}</p>
                    } @else {
                      <mat-icon class="upload-icon">cloud_upload</mat-icon>
                      <h4>Arrastra tu archivo aquí o haz clic para seleccionar</h4>
                      <p>Archivos Excel (.xlsx, .xls)</p>
                    }
                  </div>
                </div>
                
                @if (archivoSeleccionado) {
                  <div class="file-actions">
                    <button mat-button 
                            color="warn" 
                            (click)="limpiarArchivo()">
                      <mat-icon>clear</mat-icon>
                      Cambiar archivo
                    </button>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </mat-step>

        <!-- Paso 3: Configurar y Procesar -->
        <mat-step label="Configurar y Procesar" [completed]="resultado !== null">
          <mat-card class="step-card">
            <mat-card-content>
              <div class="step-content">
                <mat-icon class="step-icon">settings</mat-icon>
                <h3>Paso 3: Configurar procesamiento</h3>
                
                <!-- Opciones de procesamiento -->
                <div class="processing-options">
                  <h4>Modo de Procesamiento</h4>
                  <mat-radio-group [(ngModel)]="soloValidar" class="radio-group">
                    <mat-radio-button [value]="true">
                      Solo validar archivo (recomendado primero)
                    </mat-radio-button>
                    <mat-radio-button [value]="false">
                      Validar y procesar rutas
                    </mat-radio-button>
                  </mat-radio-group>
                  
                  <!-- ✅ NUEVO: Selector de modo UPSERT -->
                  @if (!soloValidar) {
                    <div class="modo-upsert-section">
                      <h5>🔄 Modo de Actualización</h5>
                      <mat-radio-group [(ngModel)]="modoProcesamiento" class="radio-group-vertical">
                        <mat-radio-button value="crear">
                          <div class="radio-content">
                            <strong>Solo Crear</strong>
                            <p>Crear solo rutas nuevas (error si ya existe)</p>
                          </div>
                        </mat-radio-button>
                        
                        <mat-radio-button value="upsert">
                          <div class="radio-content">
                            <strong>Crear o Actualizar (Recomendado)</strong>
                            <p>Crear si no existe, actualizar si existe</p>
                          </div>
                        </mat-radio-button>
                      </mat-radio-group>
                      
                      <!-- Información sobre la clave única -->
                      <div class="info-box upsert-info">
                        <mat-icon>key</mat-icon>
                        <div>
                          <h6>Identificación Única de Rutas</h6>
                          <p>Las rutas se identifican por: <strong>RUC + Resolución + Código</strong></p>
                          <p class="example">Ejemplo: 20448048242 + R-0921-2023 + 01</p>
                        </div>
                      </div>
                    </div>
                  }
                  
                  <!-- Información sobre localidades -->
                  <div class="info-section localidades-info">
                    <mat-icon class="info-icon">info</mat-icon>
                    <div class="info-content">
                      <h5>📍 Manejo de Localidades</h5>
                      <p>Las localidades que no se encuentren en la base de datos principal serán automáticamente clasificadas como:</p>
                      <ul>
                        <li><strong>Tipo:</strong> OTROS</li>
                        <li><strong>Nivel:</strong> OTROS</li>
                      </ul>
                      <p class="info-note">Esto permite importar rutas con localidades nuevas sin errores de validación.</p>
                    </div>
                  </div>
                  
                  <!-- Configuración de lotes -->
                  @if (!soloValidar) {
                    <div class="batch-config">
                      <h5>⚡ Configuración de Procesamiento</h5>
                      <mat-slide-toggle [(ngModel)]="procesarEnLotes" color="primary">
                        Procesar en lotes (recomendado para archivos grandes)
                      </mat-slide-toggle>
                      
                      @if (procesarEnLotes) {
                        <div class="batch-size-config">
                          <mat-form-field appearance="outline">
                            <mat-label>Tamaño del lote</mat-label>
                            <mat-select [(ngModel)]="tamanoLote">
                              <mat-option [value]="25">25 rutas por lote (más seguro)</mat-option>
                              <mat-option [value]="50">50 rutas por lote (recomendado)</mat-option>
                              <mat-option [value]="100">100 rutas por lote (más rápido)</mat-option>
                            </mat-select>
                            <mat-hint>Lotes más pequeños son más seguros pero más lentos</mat-hint>
                          </mat-form-field>
                        </div>
                      }
                    </div>
                  }
                </div>
                
                <div class="action-buttons">
                  <button mat-raised-button 
                          color="accent" 
                          (click)="procesarArchivo()"
                          [disabled]="!archivoSeleccionado || cargando">
                    <mat-icon>{{ soloValidar ? 'verified' : 'play_arrow' }}</mat-icon>
                    {{ soloValidar ? 'Validar Archivo' : 'Procesar Rutas' }}
                  </button>
                </div>
                
                <!-- Indicador de progreso -->
                @if (cargando) {
                  <div class="loading-section">
                    @if (procesarEnLotes && !soloValidar && totalLotes > 0) {
                      <div class="batch-progress">
                        <h5>🔄 Procesando en lotes...</h5>
                        <mat-progress-bar 
                          mode="determinate" 
                          [value]="progresoPorLotes">
                        </mat-progress-bar>
                        <div class="batch-info">
                          <span>Lote {{ loteActual }} de {{ totalLotes }}</span>
                          <span>{{ progresoPorLotes.toFixed(1) }}% completado</span>
                        </div>
                        <p class="batch-description">
                          Procesando {{ tamanoLote }} rutas por lote para mayor estabilidad...
                        </p>
                      </div>
                    } @else {
                      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                      <p>{{ soloValidar ? 'Validando archivo...' : 'Procesando rutas...' }}</p>
                    }
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </mat-step>

        <!-- Paso 4: Resultados -->
        <mat-step label="Resultados" [completed]="mostrarResultados">
          <mat-card class="step-card">
            <mat-card-content>
              <div class="step-content">
                <mat-icon class="step-icon">assessment</mat-icon>
                <h3>Paso 4: Resultados</h3>
                
                @if (resultado) {
                  <!-- Resumen de estadísticas -->
                  <div class="results-summary" [class]="soloValidar ? 'validation' : 'processing'">
                    <h4>{{ soloValidar ? 'Validación Completada' : 'Procesamiento Completado' }}</h4>
                    <div class="summary-stats">
                      <div class="stat-item total">
                        <mat-icon>description</mat-icon>
                        <span class="stat-number">{{ getEstadistica('total') }}</span>
                        <span class="stat-label">{{ soloValidar ? 'Total filas' : 'Total procesadas' }}</span>
                      </div>
                      
                      @if (!soloValidar && modoProcesamiento === 'upsert') {
                        <!-- Mostrar creadas y actualizadas por separado en modo UPSERT -->
                        <div class="stat-item success">
                          <mat-icon>add_circle</mat-icon>
                          <span class="stat-number">{{ getRutasCreadas().length }}</span>
                          <span class="stat-label">Creadas</span>
                        </div>
                        <div class="stat-item info">
                          <mat-icon>update</mat-icon>
                          <span class="stat-number">{{ getRutasActualizadas().length }}</span>
                          <span class="stat-label">Actualizadas</span>
                        </div>
                      } @else {
                        <!-- Mostrar solo exitosas en otros modos -->
                        <div class="stat-item success">
                          <mat-icon>check_circle</mat-icon>
                          <span class="stat-number">{{ getEstadistica('exitosas') }}</span>
                          <span class="stat-label">{{ soloValidar ? 'Válidos' : 'Rutas creadas' }}</span>
                        </div>
                      }
                      
                      @if (getEstadistica('errores') > 0) {
                        <div class="stat-item error">
                          <mat-icon>error</mat-icon>
                          <span class="stat-number">{{ getEstadistica('errores') }}</span>
                          <span class="stat-label">{{ soloValidar ? 'Inválidos' : 'Fallidas' }}</span>
                        </div>
                      }
                      @if (getEstadistica('advertencias') > 0) {
                        <div class="stat-item warning">
                          <mat-icon>warning</mat-icon>
                          <span class="stat-number">{{ getEstadistica('advertencias') }}</span>
                          <span class="stat-label">Con advertencias</span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <!-- Rutas creadas exitosamente -->
                  @if (!soloValidar && getRutasCreadas().length > 0) {
                    <mat-card class="results-card success">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>check_circle</mat-icon>
                          Rutas Creadas Exitosamente ({{ (getRutasCreadas())?.length || 0 }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="table-container">
                          <table mat-table [dataSource]="getRutasCreadas().slice(0, 10)" class="results-table">
                            <ng-container matColumnDef="codigo">
                              <th mat-header-cell *matHeaderCellDef>Código</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.codigo || ruta.codigo_ruta }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="nombre">
                              <th mat-header-cell *matHeaderCellDef>Nombre</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.nombre }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="id">
                              <th mat-header-cell *matHeaderCellDef>ID</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.id }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="estado">
                              <th mat-header-cell *matHeaderCellDef>Estado</th>
                              <td mat-cell *matCellDef="let ruta">
                                <mat-chip class="status-chip success">CREADA</mat-chip>
                              </td>
                            </ng-container>
                            
                            <tr mat-header-row *matHeaderRowDef="['codigo', 'nombre', 'id', 'estado']"></tr>
                            <tr mat-row *matRowDef="let row; columns: ['codigo', 'nombre', 'id', 'estado'];"></tr>
                          </table>
                          
                          @if (getRutasCreadas().length > 10) {
                            <div class="more-results">
                              <p><strong>... y {{ getRutasCreadas().length - 10 }} rutas más creadas exitosamente</strong></p>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- ✅ NUEVO: Rutas actualizadas exitosamente -->
                  @if (!soloValidar && getRutasActualizadas().length > 0) {
                    <mat-card class="results-card info">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>update</mat-icon>
                          Rutas Actualizadas Exitosamente ({{ (getRutasActualizadas())?.length || 0 }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="table-container">
                          <table mat-table [dataSource]="getRutasActualizadas().slice(0, 10)" class="results-table">
                            <ng-container matColumnDef="codigo">
                              <th mat-header-cell *matHeaderCellDef>Código</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.codigo || ruta.codigo_ruta }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="nombre">
                              <th mat-header-cell *matHeaderCellDef>Nombre</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.nombre }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="cambios">
                              <th mat-header-cell *matHeaderCellDef>Cambios</th>
                              <td mat-cell *matCellDef="let ruta">
                                @if (ruta.cambios && ruta.cambios.length > 0) {
                                  <ul class="cambios-list">
                                    @for (cambio of ruta.cambios; track $index) {
                                      <li>{{ cambio }}</li>
                                    }
                                  </ul>
                                } @else {
                                  <span class="no-cambios">Sin cambios detectados</span>
                                }
                              </td>
                            </ng-container>
                            
                            <ng-container matColumnDef="estado">
                              <th mat-header-cell *matHeaderCellDef>Estado</th>
                              <td mat-cell *matCellDef="let ruta">
                                <mat-chip class="status-chip info">ACTUALIZADA</mat-chip>
                              </td>
                            </ng-container>
                            
                            <tr mat-header-row *matHeaderRowDef="['codigo', 'nombre', 'cambios', 'estado']"></tr>
                            <tr mat-row *matRowDef="let row; columns: ['codigo', 'nombre', 'cambios', 'estado'];"></tr>
                          </table>
                          
                          @if (getRutasActualizadas().length > 10) {
                            <div class="more-results">
                              <p><strong>... y {{ getRutasActualizadas().length - 10 }} rutas más actualizadas exitosamente</strong></p>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Errores encontrados -->
                  @if (getErrores().length > 0) {
                    <mat-card class="results-card error">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>error</mat-icon>
                          {{ soloValidar ? 'Errores de Validación' : 'Rutas Fallidas' }} ({{ (getErrores())?.length || 0 }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="error-table">
                          <table mat-table [dataSource]="getErrores().slice(0, 20)" class="results-table error-table">
                            <ng-container matColumnDef="fila">
                              <th mat-header-cell *matHeaderCellDef>Fila</th>
                              <td mat-cell *matCellDef="let error">{{ error.fila || 'N/A' }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="codigo">
                              <th mat-header-cell *matHeaderCellDef>Código</th>
                              <td mat-cell *matCellDef="let error">{{ error.codigo_ruta || error.codigo || 'N/A' }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="error">
                              <th mat-header-cell *matHeaderCellDef>Error</th>
                              <td mat-cell *matCellDef="let error" class="error-cell">
                                <div class="error-details">
                                  @if (error.error) {
                                    <span class="error-message">{{ error.error }}</span>
                                  }
                                  @if (error.errores && error.errores.length > 0) {
                                    <ul class="error-list">
                                      @for (detalle of error.errores; track $index) {
                                        <li>{{ detalle }}</li>
                                      }
                                    </ul>
                                  }
                                </div>
                              </td>
                            </ng-container>
                            
                            <tr mat-header-row *matHeaderRowDef="['fila', 'codigo', 'error']"></tr>
                            <tr mat-row *matRowDef="let row; columns: ['fila', 'codigo', 'error'];"></tr>
                          </table>
                          
                          @if (getErrores().length > 20) {
                            <div class="more-results">
                              <p><strong>... y {{ getErrores().length - 20 }} errores más</strong></p>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Advertencias -->
                  @if (getAdvertencias().length > 0) {
                    <mat-card class="results-card warning">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>warning</mat-icon>
                          Advertencias ({{ (getAdvertencias())?.length || 0 }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="warning-list">
                          @for (advertencia of getAdvertencias().slice(0, 10); track $index) {
                            <div class="warning-item">
                              <strong>Fila {{ advertencia.fila }} - {{ advertencia.codigo_ruta }}:</strong>
                              @if (advertencia.advertencias) {
                                <ul>
                                  @for (adv of advertencia.advertencias; track $index) {
                                    <li>{{ adv }}</li>
                                  }
                                </ul>
                              }
                            </div>
                          }
                          @if (getAdvertencias().length > 10) {
                            <div class="warning-item">
                              <strong>... y {{ getAdvertencias().length - 10 }} advertencias más</strong>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Acciones finales -->
                  <div class="final-actions">
                    @if (!soloValidar && getRutasCreadas().length > 0) {
                      <button mat-raised-button color="primary" (click)="irAListaRutas()">
                        <mat-icon>list</mat-icon>
                        Ver Rutas Creadas
                      </button>
                    }
                    
                    @if (soloValidar && getEstadistica('exitosas') > 0) {
                      <button mat-raised-button color="accent" (click)="procesarDespuesDeValidar()">
                        <mat-icon>play_arrow</mat-icon>
                        Procesar Rutas Válidas
                      </button>
                    }
                    
                    <button mat-button (click)="reiniciarProceso()">
                      <mat-icon>refresh</mat-icon>
                      Nuevo Proceso
                    </button>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styleUrls: ['./carga-masiva-rutas.component.scss']
})
export class CargaMasivaRutasComponent implements OnInit {

  // Estado del componente
  archivoSeleccionado: File | null = null;
  cargando = false;
  mostrarResultados = false;
  soloValidar = true;

  // Configuración de procesamiento
  modoProcesamiento: 'crear' | 'actualizar' | 'upsert' = 'upsert';  // ✅ NUEVO
  procesarEnLotes = true;
  tamanoLote = 50;
  loteActual = 0;
  totalLotes = 0;
  progresoPorLotes = 0;

  // Resultado unificado
  resultado: ResultadoCargaMasiva | null = null;

  // Control de UI
  plantillaDescargada = false;
  isDragOver = false;

  constructor(
    private rutaService: RutaService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    // console.log removed for production
  }

  // ========================================
  // MÉTODOS DE DESCARGA DE PLANTILLA
  // ========================================

  async descargarPlantilla() {
    try {
      this.cargando = true;
      // console.log removed for production

      const blob = await this.rutaService.descargarPlantillaCargaMasiva();

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_carga_masiva_rutas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.plantillaDescargada = true;
      this.snackBar.open('Plantilla descargada exitosamente', 'Cerrar', { duration: 3000 });

    } catch (error: any) {
      console.error('❌ Error descargando plantilla::', error);
      this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  // ========================================
  // MÉTODOS DE MANEJO DE ARCHIVOS
  // ========================================

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivoSeleccionado(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivoSeleccionado(file);
    }
  }

  private procesarArchivoSeleccionado(file: File) {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Por favor selecciona un archivo Excel (.xlsx o .xls)', 'Cerrar', { duration: 5000 });
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.snackBar.open('El archivo es demasiado grande. Máximo 10MB permitido.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.archivoSeleccionado = file;
    this.limpiarResultados();
    console.log('📁 Archivo seleccionado:', file.name, this.formatFileSize(file.size));
  }

  limpiarArchivo() {
    this.archivoSeleccionado = null;
    this.limpiarResultados();
  }

  private limpiarResultados() {
    this.resultado = null;
    this.mostrarResultados = false;
    this.loteActual = 0;
    this.totalLotes = 0;
    this.progresoPorLotes = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ========================================
  // MÉTODO PRINCIPAL DE PROCESAMIENTO
  // ========================================

  async procesarArchivo() {
    if (!this.archivoSeleccionado) {
      this.snackBar.open('Por favor selecciona un archivo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;
    this.limpiarResultados();

    // console.log removed for production

    try {
      if (this.soloValidar) {
        await this.ejecutarValidacion();
      } else {
        await this.ejecutarProcesamiento();
      }

      this.mostrarResultados = true;

    } catch (error: any) {
      console.error('❌ ERROR EN PROCESAMIENTO::', error);
      this.snackBar.open(
        `Error: ${error.error?.mensaje || error.message || 'Error desconocido'}`,
        'Cerrar',
        { duration: 5000 }
      );
    } finally {
      this.cargando = false;
    }
  }

  private async ejecutarValidacion() {
    // console.log removed for production
    this.resultado = await this.rutaService.validarCargaMasiva(this.archivoSeleccionado!);
    // console.log removed for production

    // Debug: Mostrar la estructura de datos para verificar
    if (this.resultado) {
      const datos: any = (this.resultado as any).validacion || this.resultado;
      console.log('🔍 DEBUG - Estructura de resultado:', {
        tieneValidacion: !!(this.resultado as any).validacion,
        datos: datos,
        estadisticas: {
          total: this.getEstadistica('total'),
          exitosas: this.getEstadistica('exitosas'),
          errores: this.getEstadistica('errores'),
          advertencias: this.getEstadistica('advertencias')
        }
      });
    }
  }

  private async ejecutarProcesamiento() {
    const opciones = {
      soloValidar: false,
      modo: this.modoProcesamiento,  // ✅ NUEVO: Enviar modo
      procesarEnLotes: this.procesarEnLotes,
      tamanoLote: this.tamanoLote
    };

    this.resultado = await this.rutaService.procesarCargaMasiva(this.archivoSeleccionado!, opciones);

    // Debug: Mostrar la estructura de datos para verificar
    if (this.resultado) {
      const resultado: any = this.resultado as any;

      // Información específica sobre RUCs y normalización
      const rutasCreadas = resultado.rutas_creadas || resultado.resultado?.rutas_creadas || [];
      const rutasValidas = resultado.validacion?.rutas_validas || [];

      console.log('🔍 DEBUG - Estructura de procesamiento:', {
        tieneValidacion: !!resultado.validacion,
        tieneResultado: !!resultado.resultado,
        datosValidacion: resultado.validacion,
        datosProcesamiento: resultado.resultado,
        estadisticas: {
          total: this.getEstadistica('total'),
          exitosas: this.getEstadistica('exitosas'),
          errores: this.getEstadistica('errores'),
          advertencias: this.getEstadistica('advertencias')
        }
      });

      // Debug específico para RUCs
      console.log('🔍 DEBUG - Análisis de RUCs:', {
        rutasCreadas: rutasCreadas.length,
        rutasValidas: rutasValidas.length,
        muestraRutasCreadas: rutasCreadas.slice(0, 3),
        muestraRutasValidas: rutasValidas.slice(0, 3)
      });

      // Verificar si las rutas creadas tienen información de empresa
      if (rutasCreadas.length > 0) {
        console.log('🔍 DEBUG - Verificando información de empresa en rutas creadas:');
        rutasCreadas.forEach((ruta: any, index: number) => {
          console.log(`  Ruta ${index + 1}:`, {
            id: ruta.id,
            codigo: ruta.codigo || ruta.codigo_ruta,
            nombre: ruta.nombre,
            tieneEmpresa: !!ruta.empresa,
            empresaInfo: ruta.empresa ? {
              id: ruta.empresa.id,
              ruc: ruta.empresa.ruc,
              razonSocial: ruta.empresa.razonSocial
            } : 'No tiene empresa',
            rucDirecto: ruta.ruc || 'No tiene RUC directo'
          });
        });
      }

      // Verificar RUCs en rutas válidas
      if (rutasValidas.length > 0) {
        console.log('🔍 DEBUG - RUCs en rutas válidas:');
        const rucsEncontrados = new Set<string>();
        rutasValidas.forEach((ruta: any, index: number) => {
          if (ruta.ruc) {
            rucsEncontrados.add(ruta.ruc);
            if (index < 5) { // Solo mostrar los primeros 5
              console.log(`  Ruta válida ${index + 1}: RUC ${ruta.ruc}, Código: ${ruta.codigoRuta}`);
            }
          }
        });
        console.log(`📊 Total RUCs únicos encontrados: ${rucsEncontrados.size}`, Array.from(rucsEncontrados));
      }
    }
  }

  // ========================================
  // MÉTODOS DE OBTENCIÓN DE DATOS UNIFICADOS
  // ========================================

  getEstadistica(tipo: 'total' | 'exitosas' | 'errores' | 'advertencias'): number {
    if (!this.resultado) return 0;

    // Manejar diferentes estructuras de respuesta del backend
    const resultado: any = this.resultado as any;

    // Para validación: { validacion: {...} }
    // Para procesamiento: { resultado: {...} }
    const datosValidacion = resultado.validacion;
    const datosProcesamiento = resultado.resultado;
    const datosDirect = resultado;

    switch (tipo) {
      case 'total':
        if (this.soloValidar) {
          return datosValidacion?.total_filas || datosDirect.total_filas || 0;
        } else {
          return datosProcesamiento?.total_procesadas ||
            datosDirect.total_procesadas ||
            datosValidacion?.total_filas ||
            datosDirect.total_filas || 0;
        }

      case 'exitosas':
        if (this.soloValidar) {
          return datosValidacion?.validos || datosDirect.validos || 0;
        } else {
          return datosProcesamiento?.exitosas ||
            datosProcesamiento?.total_creadas ||
            datosDirect.exitosas ||
            datosDirect.total_creadas || 0;
        }

      case 'errores':
        if (this.soloValidar) {
          return datosValidacion?.invalidos || datosDirect.invalidos || 0;
        } else {
          return datosProcesamiento?.fallidas ||
            datosDirect.fallidas || 0;
        }

      case 'advertencias':
        return datosValidacion?.con_advertencias ||
          datosDirect.con_advertencias || 0;

      default:
        return 0;
    }
  }

  getRutasCreadas(): any[] {
    if (!this.resultado || this.soloValidar) return [];

    const resultado: any = this.resultado as any;
    const datosProcesamiento = resultado.resultado;

    const rutasOriginales = datosProcesamiento?.rutas_creadas ||
      resultado.rutas_creadas ||
      [];

    // Transformar las rutas para mostrar nombre como "ORIGEN - DESTINO"
    return rutasOriginales.map((ruta: any) => {
      // Intentar extraer origen y destino del nombre o itinerario
      let nombreTransformado = ruta.nombre;

      if (ruta.nombre && ruta.nombre.includes(' - ')) {
        // Si ya tiene el formato correcto, mantenerlo
        const partes = ruta.nombre.split(' - ');
        if (partes.length >= 2) {
          nombreTransformado = `${partes[0]} - ${partes[partes.length - 1]}`;
        }
      } else if (ruta.origen && ruta.destino) {
        // Si tiene origen y destino separados
        const origen = typeof ruta.origen === 'string' ? ruta.origen : ruta.origen.nombre;
        const destino = typeof ruta.destino === 'string' ? ruta.destino : ruta.destino.nombre;
        nombreTransformado = `${origen} - ${destino}`;
      } else if (ruta.nombre) {
        // Intentar extraer origen y destino del itinerario completo
        const itinerario = ruta.nombre.replace(/\s*-\s*/g, ' - ');
        const localidades = itinerario.split(' - ').map((loc: string) => loc.trim());

        if (localidades.length >= 2) {
          nombreTransformado = `${localidades[0]} - ${localidades[localidades.length - 1]}`;
        }
      }

      return {
        ...ruta,
        nombre: nombreTransformado
      };
    });
  }

  getErrores(): any[] {
    if (!this.resultado) return [];

    const resultado: any = this.resultado as any;
    const datosValidacion = resultado.validacion;
    const datosProcesamiento = resultado.resultado;

    // Errores de validación
    const erroresValidacion = datosValidacion?.errores || resultado.errores || [];

    // Errores de procesamiento
    const erroresProcesamiento = datosProcesamiento?.errores_procesamiento ||
      resultado.errores_procesamiento ||
      [];
    const erroresCreacion = datosProcesamiento?.errores_creacion ||
      resultado.errores_creacion ||
      [];

    return [...erroresValidacion, ...erroresProcesamiento, ...erroresCreacion];
  }

  getAdvertencias(): any[] {
    if (!this.resultado) return [];

    const resultado: any = this.resultado as any;
    const datosValidacion = resultado.validacion;

    return datosValidacion?.advertencias || resultado.advertencias || [];
  }

  // ========================================
  // MÉTODOS DE ACCIONES FINALES
  // ========================================

  procesarDespuesDeValidar() {
    this.soloValidar = false;
    this.procesarArchivo();
  }

  irAListaRutas() {
    // Navegar a la lista de rutas
    window.location.href = '/rutas';
  }

  reiniciarProceso() {
    this.archivoSeleccionado = null;
    this.limpiarResultados();
    this.soloValidar = true;
    this.procesarEnLotes = true;
    this.tamanoLote = 50;
    this.plantillaDescargada = false;
  }

  getRutasActualizadas(): any[] {
    if (!this.resultado || this.soloValidar) return [];

    const resultado: any = this.resultado as any;
    
    // Intentar obtener de diferentes estructuras posibles
    return resultado.rutas_actualizadas || 
           resultado.resultado?.rutas_actualizadas || 
           [];
  }
}
