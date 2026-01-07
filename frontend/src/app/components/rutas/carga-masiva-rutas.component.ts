import { Component, OnInit, signal, computed } from '@angular/core';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';

interface ResultadoValidacion {
  total_filas?: number;
  validos?: number;
  invalidos?: number;
  con_advertencias?: number;
  errores?: Array<{
    fila: number;
    codigo_ruta: string;
    errores: string[];
  }>;
  advertencias?: Array<{
    fila: number;
    codigo_ruta: string;
    advertencias: string[];
  }>;
}

interface ResultadoProcesamiento extends ResultadoValidacion {
  rutas_creadas?: Array<{
    codigo_ruta: string;
    nombre: string;
    tipo_ruta: string;
    estado: string;
    id: string;
  }>;
  errores_creacion?: Array<{
    codigo_ruta: string;
    error: string;
  }>;
  total_creadas?: number;
}

@Component({
  selector: 'app-carga-masiva-rutas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule
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
                <p>Descarga la plantilla oficial para cargar rutas. La plantilla incluye:</p>
                <ul>
                  <li>Instrucciones detalladas</li>
                  <li>Ejemplos de datos válidos</li>
                  <li>Hoja de datos para completar</li>
                </ul>
                
                <div class="action-buttons">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="descargarPlantilla()"
                          [disabled]="cargando">
                    <mat-icon>download</mat-icon>
                    Descargar Plantilla Excel
                  </button>
                  
                  <button mat-button 
                          color="accent" 
                          (click)="mostrarAyuda()"
                          matTooltip="Ver información de ayuda">
                    <mat-icon>help</mat-icon>
                    Ayuda
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
                <p>Selecciona el archivo Excel con los datos de las rutas completados.</p>
                
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

        <!-- Paso 3: Validar -->
        <mat-step label="Validar Datos" [completed]="resultadoValidacion !== null">
          <mat-card class="step-card">
            <mat-card-content>
              <div class="step-content">
                <mat-icon class="step-icon">verified</mat-icon>
                <h3>Paso 3: Validar datos</h3>
                <p>Valida los datos antes de procesarlos para detectar errores.</p>
                
                <div class="validation-options">
                  <mat-radio-group [(ngModel)]="soloValidar" class="radio-group">
                    <mat-radio-button [value]="true">Solo validar (recomendado)</mat-radio-button>
                    <mat-radio-button [value]="false">Validar y procesar directamente</mat-radio-button>
                  </mat-radio-group>
                </div>
                
                <div class="action-buttons">
                  <button mat-raised-button 
                          color="accent" 
                          (click)="validarArchivo()"
                          [disabled]="!archivoSeleccionado || cargando">
                    <mat-icon>verified</mat-icon>
                    {{ soloValidar ? 'Validar Archivo' : 'Validar y Procesar' }}
                  </button>
                </div>
                
                @if (cargando) {
                  <div class="loading-section">
                    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                    <p>{{ soloValidar ? 'Validando archivo...' : 'Procesando rutas...' }}</p>
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
                
                @if (resultadoValidacion && !soloValidar && resultadoProcesamiento) {
                  <!-- Resultados de procesamiento -->
                  <div class="results-summary processing">
                    <h4>Procesamiento Completado</h4>
                    <div class="summary-stats">
                      <div class="stat-item success">
                        <mat-icon>check_circle</mat-icon>
                        <span class="stat-number">{{ resultadoProcesamiento.total_creadas || 0 }}</span>
                        <span class="stat-label">Rutas creadas</span>
                      </div>
                      <div class="stat-item error" *ngIf="(resultadoProcesamiento.errores_creacion?.length || 0) > 0">
                        <mat-icon>error</mat-icon>
                        <span class="stat-number">{{ resultadoProcesamiento.errores_creacion?.length || 0 }}</span>
                        <span class="stat-label">Errores de creación</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Rutas creadas exitosamente -->
                  @if (resultadoProcesamiento.rutas_creadas && resultadoProcesamiento.rutas_creadas.length > 0) {
                    <mat-card class="results-card success">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>check_circle</mat-icon>
                          Rutas Creadas ({{ resultadoProcesamiento.rutas_creadas.length }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="table-container">
                          <table mat-table [dataSource]="resultadoProcesamiento.rutas_creadas" class="results-table">
                            <ng-container matColumnDef="codigo">
                              <th mat-header-cell *matHeaderCellDef>Código</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.codigo_ruta }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="nombre">
                              <th mat-header-cell *matHeaderCellDef>Nombre</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.nombre }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="tipo">
                              <th mat-header-cell *matHeaderCellDef>Tipo</th>
                              <td mat-cell *matCellDef="let ruta">{{ ruta.tipo_ruta }}</td>
                            </ng-container>
                            
                            <ng-container matColumnDef="estado">
                              <th mat-header-cell *matHeaderCellDef>Estado</th>
                              <td mat-cell *matCellDef="let ruta">
                                <mat-chip class="status-chip success">{{ ruta.estado }}</mat-chip>
                              </td>
                            </ng-container>
                            
                            <tr mat-header-row *matHeaderRowDef="['codigo', 'nombre', 'tipo', 'estado']"></tr>
                            <tr mat-row *matRowDef="let row; columns: ['codigo', 'nombre', 'tipo', 'estado'];"></tr>
                          </table>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Errores de creación -->
                  @if (resultadoProcesamiento.errores_creacion && resultadoProcesamiento.errores_creacion.length > 0) {
                    <mat-card class="results-card error">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>error</mat-icon>
                          Errores de Creación ({{ resultadoProcesamiento.errores_creacion.length }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="error-list">
                          @for (error of resultadoProcesamiento.errores_creacion; track error.codigo_ruta) {
                            <div class="error-item">
                              <strong>Ruta {{ error.codigo_ruta }}:</strong>
                              <span>{{ error.error }}</span>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                } @else if (resultadoValidacion) {
                  <!-- Resultados de validación -->
                  <div class="results-summary validation">
                    <h4>Validación Completada</h4>
                    <div class="summary-stats">
                      <div class="stat-item total">
                        <mat-icon>description</mat-icon>
                        <span class="stat-number">{{ resultadoValidacion.total_filas || 0 }}</span>
                        <span class="stat-label">Total filas</span>
                      </div>
                      <div class="stat-item success">
                        <mat-icon>check_circle</mat-icon>
                        <span class="stat-number">{{ resultadoValidacion.validos || 0 }}</span>
                        <span class="stat-label">Válidos</span>
                      </div>
                      <div class="stat-item error" *ngIf="(resultadoValidacion.invalidos || 0) > 0">
                        <mat-icon>error</mat-icon>
                        <span class="stat-number">{{ resultadoValidacion.invalidos || 0 }}</span>
                        <span class="stat-label">Inválidos</span>
                      </div>
                      <div class="stat-item warning" *ngIf="(resultadoValidacion.con_advertencias || 0) > 0">
                        <mat-icon>warning</mat-icon>
                        <span class="stat-number">{{ resultadoValidacion.con_advertencias || 0 }}</span>
                        <span class="stat-label">Con advertencias</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Errores de validación -->
                  @if (resultadoValidacion.errores && resultadoValidacion.errores.length > 0) {
                    <mat-card class="results-card error">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>error</mat-icon>
                          Errores de Validación ({{ resultadoValidacion.errores.length }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="error-list">
                          @for (error of resultadoValidacion.errores; track error.fila) {
                            <div class="error-item">
                              <div class="error-header">
                                <strong>Fila {{ error.fila }} - Ruta {{ error.codigo_ruta }}:</strong>
                              </div>
                              <ul class="error-details">
                                @for (detalle of error.errores; track detalle) {
                                  <li>{{ detalle }}</li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Advertencias -->
                  @if (resultadoValidacion.advertencias && resultadoValidacion.advertencias.length > 0) {
                    <mat-card class="results-card warning">
                      <mat-card-header>
                        <mat-card-title>
                          <mat-icon>warning</mat-icon>
                          Advertencias ({{ resultadoValidacion.advertencias.length }})
                        </mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="warning-list">
                          @for (advertencia of resultadoValidacion.advertencias; track advertencia.fila) {
                            <div class="warning-item">
                              <div class="warning-header">
                                <strong>Fila {{ advertencia.fila }} - Ruta {{ advertencia.codigo_ruta }}:</strong>
                              </div>
                              <ul class="warning-details">
                                @for (detalle of advertencia.advertencias; track detalle) {
                                  <li>{{ detalle }}</li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                  
                  <!-- Botón para procesar si la validación fue exitosa -->
                  @if ((resultadoValidacion.validos || 0) > 0 && soloValidar) {
                    <div class="process-section">
                      <h4>¿Proceder con la creación?</h4>
                      <p>Se crearán {{ resultadoValidacion.validos }} rutas válidas.</p>
                      <button mat-raised-button 
                              color="primary" 
                              (click)="procesarRutas()"
                              [disabled]="cargando">
                        <mat-icon>play_arrow</mat-icon>
                        Crear Rutas
                      </button>
                    </div>
                  }
                }
                
                <!-- Acciones finales -->
                <div class="final-actions">
                  <button mat-button 
                          (click)="reiniciar()">
                    <mat-icon>refresh</mat-icon>
                    Procesar otro archivo
                  </button>
                  
                  <button mat-raised-button 
                          color="primary" 
                          routerLink="/rutas">
                    <mat-icon>list</mat-icon>
                    Ver todas las rutas
                  </button>
                </div>
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
  isDragOver = false;
  plantillaDescargada = false;
  
  // Resultados
  resultadoValidacion: ResultadoValidacion | null = null;
  resultadoProcesamiento: ResultadoProcesamiento | null = null;
  
  constructor(
    private rutaService: RutaService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit() {
    // Inicialización si es necesaria
  }
  
  async descargarPlantilla() {
    try {
      this.cargando = true;
      const blob = await this.rutaService.descargarPlantillaCargaMasiva();
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_rutas.xlsx';
      link.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      
      this.plantillaDescargada = true;
      this.snackBar.open('Plantilla descargada exitosamente', 'Cerrar', { duration: 3000 });
      
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }
  
  async mostrarAyuda() {
    try {
      const ayuda = await this.rutaService.obtenerAyudaCargaMasiva();
      // Aquí podrías mostrar un modal con la información de ayuda
      console.log('Ayuda:', ayuda);
      this.snackBar.open('Información de ayuda mostrada en consola', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error al obtener ayuda:', error);
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.snackBar.open('Por favor selecciona un archivo Excel (.xlsx o .xls)', 'Cerrar', { duration: 5000 });
      return;
    }
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo es demasiado grande (máximo 10MB)', 'Cerrar', { duration: 5000 });
      return;
    }
    
    this.archivoSeleccionado = file;
    this.limpiarResultados();
    this.snackBar.open(`Archivo "${file.name}" seleccionado`, 'Cerrar', { duration: 3000 });
  }
  
  limpiarArchivo() {
    this.archivoSeleccionado = null;
    this.limpiarResultados();
  }
  
  private limpiarResultados() {
    this.resultadoValidacion = null;
    this.resultadoProcesamiento = null;
    this.mostrarResultados = false;
  }
  
  async validarArchivo() {
    if (!this.archivoSeleccionado) {
      this.snackBar.open('Por favor selecciona un archivo', 'Cerrar', { duration: 3000 });
      return;
    }
    
    try {
      this.cargando = true;
      this.limpiarResultados();
      
      if (this.soloValidar) {
        // Solo validar
        const resultado = await this.rutaService.validarCargaMasiva(this.archivoSeleccionado);
        this.resultadoValidacion = resultado.validacion;
        this.snackBar.open('Validación completada', 'Cerrar', { duration: 3000 });
      } else {
        // Validar y procesar
        const resultado = await this.rutaService.procesarCargaMasiva(this.archivoSeleccionado, false);
        this.resultadoValidacion = resultado.resultado;
        this.resultadoProcesamiento = resultado.resultado;
        this.snackBar.open('Procesamiento completado', 'Cerrar', { duration: 3000 });
      }
      
      this.mostrarResultados = true;
      
    } catch (error: any) {
      console.error('Error en validación/procesamiento:', error);
      this.snackBar.open(
        error.error?.detail || 'Error al procesar el archivo', 
        'Cerrar', 
        { duration: 5000 }
      );
    } finally {
      this.cargando = false;
    }
  }
  
  async procesarRutas() {
    if (!this.archivoSeleccionado) {
      return;
    }
    
    try {
      this.cargando = true;
      
      const resultado = await this.rutaService.procesarCargaMasiva(this.archivoSeleccionado, false);
      this.resultadoProcesamiento = resultado.resultado;
      this.soloValidar = false; // Cambiar vista a procesamiento
      
      this.snackBar.open(
        `Procesamiento completado: ${resultado.resultado.total_creadas || 0} rutas creadas`, 
        'Cerrar', 
        { duration: 5000 }
      );
      
    } catch (error: any) {
      console.error('Error en procesamiento:', error);
      this.snackBar.open(
        error.error?.detail || 'Error al procesar las rutas', 
        'Cerrar', 
        { duration: 5000 }
      );
    } finally {
      this.cargando = false;
    }
  }
  
  reiniciar() {
    this.archivoSeleccionado = null;
    this.limpiarResultados();
    this.soloValidar = true;
    this.cargando = false;
    this.plantillaDescargada = false;
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}