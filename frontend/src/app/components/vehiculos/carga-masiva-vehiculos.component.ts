import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartIconComponent } from '../../shared/smart-(icon as any).component';
import { VehiculoService } from '../../services/(vehiculo as any).service';

interface ValidacionExcel {
  fila: number;
  placa: string;
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

interface ResultadoCarga {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];
  vehiculos_actualizados: string[];
  errores_detalle: any[];
}

@Component({
  selector: 'app-carga-masiva-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatDialogModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    SmartIconComponent
  ],
  template: `
    <div class="carga-masiva-container">
      <div class="header">
        <div class="header-content">
          <div class="header-icon">
            <app-smart-icon [iconName]="'cloud_upload'" [size]="40"></app-smart-icon>
          </div>
          <div class="header-text">
            <h1>Carga Masiva de Vehículos</h1>
            <p>Importa múltiples vehículos de forma rápida y eficiente</p>
          </div>
        </div>
        <button mat-icon-button 
                (click)="cerrarModal()" 
                class="close-button"
                matTooltip="Cerrar modal">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <mat-stepper [linear]="true" #stepper class="modern-stepper">
        <!-- Paso 1: Selección de archivo -->
        <mat-step [stepControl]="archivoForm" label="Seleccionar Archivo">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon [iconName]="'folder_open'" [size]="20"></app-smart-icon>
              <span>Seleccionar Archivo</span>
            </div>
          </ng-template>
          
          <div class="step-content">
            <form [formGroup]="archivoForm">
              <div class="upload-section">
                <div class="upload-area" 
                     [(class as any).dragover]="isDragOver()"
                     [(class as any).has-file]="archivoSeleccionado()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     (click)="(fileInput as any).click()">
                  
                  <input #fileInput 
                         type="file" 
                         accept=".xlsx,.xls,.csv" 
                         (change)="onFileSelected($event)"
                         style="display: none;">
                  
                  @if (!archivoSeleccionado()) {
                    <div class="upload-placeholder">
                      <div class="upload-icon-container">
                        <app-smart-icon [iconName]="'cloud_upload'" [size]="80" class="upload-icon"></app-smart-icon>
                        <div class="upload-pulse"></div>
                      </div>
                      <h3>Arrastra tu archivo aquí</h3>
                      <p>o haz clic para seleccionar desde tu dispositivo</p>
                      
                      <div class="supported-formats">
                        <div class="format-title">
                          <app-smart-icon [iconName]="'info'" [size]="16"></app-smart-icon>
                          <span>Formatos soportados</span>
                        </div>
                        <div class="format-chips">
                          <div class="format-chip excel">
                            <app-smart-icon [iconName]="'description'" [size]="16"></app-smart-icon>
                            <span>.xlsx</span>
                          </div>
                          <div class="format-chip excel">
                            <app-smart-icon [iconName]="'description'" [size]="16"></app-smart-icon>
                            <span>.xls</span>
                          </div>
                          <div class="format-chip csv">
                            <app-smart-icon [iconName]="'table_chart'" [size]="16"></app-smart-icon>
                            <span>.csv</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="file-requirements">
                        <div class="requirement-item">
                          <app-smart-icon [iconName]="'storage'" [size]="14"></app-smart-icon>
                          <span>Tamaño máximo: 10MB</span>
                        </div>
                        <div class="requirement-item">
                          <app-smart-icon [iconName]="'assignment'" [size]="14"></app-smart-icon>
                          <span>Usar la plantilla oficial</span>
                        </div>
                        <div class="requirement-item">
                          <app-smart-icon [iconName]="'rule'" [size]="14"></app-smart-icon>
                          <span>Completar campos obligatorios</span>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="file-selected">
                      <div class="file-icon-container">
                        <app-smart-icon [iconName]="'description'" [size]="48" class="file-icon"></app-smart-icon>
                        <div class="success-badge">
                          <app-smart-icon [iconName]="'check'" [size]="16"></app-smart-icon>
                        </div>
                      </div>
                      <div class="file-info">
                        <h4>{{ archivoSeleccionado()?.name }}</h4>
                        <div class="file-details">
                          <span class="file-size">{{ formatFileSize(archivoSeleccionado()?.size || 0) }}</span>
                          <span class="file-type">{{ getFileType(archivoSeleccionado()?.name || '') }}</span>
                        </div>
                        <div class="file-status">
                          <app-smart-icon [iconName]="'check_circle'" [size]="16"></app-smart-icon>
                          <span>Archivo listo para validar</span>
                        </div>
                      </div>
                      <button mat-icon-button 
                              (click)="removeFile($event)"
                              class="remove-file-btn"
                              matTooltip="Quitar archivo">
                        <app-smart-icon [iconName]="'close'" [size]="20"></app-smart-icon>
                      </button>
                    </div>
                  }
                </div>

                <div class="action-buttons">
                  <div class="secondary-actions">
                    <button mat-stroked-button 
                            (click)="descargarPlantilla()"
                            class="download-template-btn">
                      <app-smart-icon [iconName]="'download'" [size]="18"></app-smart-icon>
                      Descargar Plantilla
                    </button>
                    
                    <button mat-stroked-button 
                            (click)="mostrarAyuda()"
                            class="help-btn">
                      <app-smart-icon [iconName]="'help_outline'" [size]="18"></app-smart-icon>
                      Ayuda
                    </button>
                  </div>
                  
                  <div class="primary-actions">
                    <button mat-button 
                            (click)="cerrarModal()"
                            class="cancel-btn">
                      Cancelar
                    </button>
                    
                    <button mat-raised-button 
                            color="primary" 
                            matStepperNext 
                            [disabled]="!archivoSeleccionado()"
                            (click)="validarArchivo()"
                            class="validate-btn">
                      <app-smart-icon [iconName]="'verified'" [size]="18"></app-smart-icon>
                      Validar Archivo
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </mat-step>   
        <!-- Paso 2: Validación -->
        <mat-step label="Validación">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon [iconName]="'fact_check'" [size]="20"></app-smart-icon>
              <span>Validación</span>
            </div>
          </ng-template>
          
          <div class="step-content">
            @if (validando()) {
              <div class="validation-loading">
                <div class="loading-animation">
                  <div class="loading-spinner">
                    <app-smart-icon [iconName]="'hourglass_empty'" [size]="48"></app-smart-icon>
                  </div>
                  <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <h3>Validando archivo...</h3>
                <p>Verificando formato y contenido de los datos</p>
                <mat-progress-bar mode="indeterminate" class="modern-progress"></mat-progress-bar>
              </div>
            } @else if (validaciones().length > 0) {
              <div class="validation-results">
                <div class="validation-summary">
                  <div class="summary-cards">
                    <div class="summary-card valid" [(class as any).active]="validacionesValidas() > 0">
                      <div class="card-icon">
                        <app-smart-icon [iconName]="'check_circle'" [size]="32"></app-smart-icon>
                      </div>
                      <div class="card-content">
                        <h3>{{ validacionesValidas() }}</h3>
                        <p>Registros Válidos</p>
                      </div>
                    </div>
                    
                    <div class="summary-card invalid" [(class as any).active]="validacionesInvalidas() > 0">
                      <div class="card-icon">
                        <app-smart-icon [iconName]="'error'" [size]="32"></app-smart-icon>
                      </div>
                      <div class="card-content">
                        <h3>{{ validacionesInvalidas() }}</h3>
                        <p>Con Errores</p>
                      </div>
                    </div>
                    
                    <div class="summary-card total">
                      <div class="card-icon">
                        <app-smart-icon [iconName]="'assessment'" [size]="32"></app-smart-icon>
                      </div>
                      <div class="card-content">
                        <h3>{{ validaciones().length }}</h3>
                        <p>Total Registros</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="validation-table-container">
                  <div class="table-header">
                    <h4>
                      <app-smart-icon [iconName]="'list_alt'" [size]="20"></app-smart-icon>
                      Detalle de Validación
                    </h4>
                    @if (validacionesInvalidas() > 0) {
                      <div class="error-indicator">
                        <app-smart-icon [iconName]="'warning'" [size]="16"></app-smart-icon>
                        <span>{{ validacionesInvalidas() }} registros requieren corrección</span>
                      </div>
                    }
                  </div>
                  
                  <div class="table-wrapper">
                    <table mat-table [dataSource]="validaciones()" class="validation-table">
                      <ng-container matColumnDef="fila">
                        <th mat-header-cell *matHeaderCellDef>
                          <app-smart-icon [iconName]="'format_list_numbered'" [size]="16"></app-smart-icon>
                          Fila
                        </th>
                        <td mat-cell *matCellDef="let validacion">
                          <span class="row-number">{{ (validacion as any).fila }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="placa">
                        <th mat-header-cell *matHeaderCellDef>
                          <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                          Placa
                        </th>
                        <td mat-cell *matCellDef="let validacion">
                          <span class="placa-text">{{ (validacion as any).placa }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="estado">
                        <th mat-header-cell *matHeaderCellDef>
                          <app-smart-icon [iconName]="'task_alt'" [size]="16"></app-smart-icon>
                          Estado
                        </th>
                        <td mat-cell *matCellDef="let validacion">
                          @if ((validacion as any).valido) {
                            <div class="status-chip valid">
                              <app-smart-icon [iconName]="'check'" [size]="14"></app-smart-icon>
                              <span>Válido</span>
                            </div>
                          } @else {
                            <div class="status-chip invalid">
                              <app-smart-icon [iconName]="'error'" [size]="14"></app-smart-icon>
                              <span>Error</span>
                            </div>
                          }
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="errores">
                        <th mat-header-cell *matHeaderCellDef>
                          <app-smart-icon [iconName]="'info'" [size]="16"></app-smart-icon>
                          Detalles
                        </th>
                        <td mat-cell *matCellDef="let validacion">
                          @if ((validacion as any).errores.length > 0) {
                            <div class="error-details">
                              @for (error of (validacion as any).errores; track error) {
                                <div class="error-item">
                                  <app-smart-icon [iconName]="'error_outline'" [size]="12"></app-smart-icon>
                                  <span>{{ error }}</span>
                                </div>
                              }
                            </div>
                          }
                          @if ((validacion as any).advertencias.length > 0) {
                            <div class="warning-details">
                              @for (advertencia of (validacion as any).advertencias; track advertencia) {
                                <div class="warning-item">
                                  <app-smart-icon [iconName]="'warning'" [size]="12"></app-smart-icon>
                                  <span>{{ advertencia }}</span>
                                </div>
                              }
                            </div>
                          }
                          @if ((validacion as any).valido && (validacion as any).errores.length === 0 && (validacion as any).advertencias.length === 0) {
                            <div class="success-message">
                              <app-smart-icon [iconName]="'check_circle'" [size]="12"></app-smart-icon>
                              <span>Sin problemas</span>
                            </div>
                          }
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="columnasValidacion"></tr>
                      <tr mat-row *matRowDef="let row; columns: columnasValidacion;" 
                          [(class as any).error-row]="!(row as any).valido"
                          [(class as any).valid-row]="(row as any).valido"></tr>
                    </table>
                  </div>
                </div>

                <div class="action-buttons">
                  <div class="secondary-actions">
                    <button mat-stroked-button matStepperPrevious>
                      <app-smart-icon [iconName]="'arrow_back'" [size]="18"></app-smart-icon>
                      Volver
                    </button>
                    
                    <button mat-button 
                            (click)="cerrarModal()"
                            class="cancel-btn">
                      Cancelar
                    </button>
                  </div>
                  
                  <div class="primary-actions">
                    <button mat-raised-button 
                            color="primary" 
                            matStepperNext
                            [disabled]="validacionesValidas() === 0"
                            (click)="procesarCarga()"
                            class="process-btn">
                      <app-smart-icon [iconName]="'upload'" [size]="18"></app-smart-icon>
                      Procesar {{ validacionesValidas() }} vehículos
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </mat-step>

        <!-- Paso 3: Procesamiento -->
        <mat-step label="Procesamiento">
          <ng-template matStepLabel>
            <div class="step-label">
              <app-smart-icon [iconName]="'sync'" [size]="20"></app-smart-icon>
              <span>Procesamiento</span>
            </div>
          </ng-template>
          
          <div class="step-content">
            @if (procesando()) {
              <div class="processing-loading">
                <div class="processing-animation">
                  <div class="processing-circle">
                    <app-smart-icon [iconName]="'sync'" [size]="64" class="rotating-icon"></app-smart-icon>
                  </div>
                  <div class="processing-progress">
                    <div class="progress-ring">
                      <svg width="120" height="120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="8"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1976d2" stroke-width="8"
                                stroke-dasharray="(339 as any).292" 
                                [(attr as any).stroke-dashoffset]="(339 as any).292 - ((339 as any).292 * progresoProcesamiento() / 100)"
                                class="progress-circle"/>
                      </svg>
                      <div class="progress-text">
                        <span class="progress-percentage">{{ progresoProcesamiento() }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <h3>Procesando vehículos...</h3>
                <p>Creando y actualizando registros en la base de datos</p>
                <mat-progress-bar mode="determinate" [value]="progresoProcesamiento()" class="modern-progress"></mat-progress-bar>
              </div>
            } @else if (resultadoCarga()) {
              <div class="processing-results">
                <div class="results-header">
                  <div class="success-icon">
                    <app-smart-icon [iconName]="'check_circle'" [size]="64"></app-smart-icon>
                  </div>
                  <h3>¡Carga completada exitosamente!</h3>
                  <p>Los vehículos han sido procesados correctamente</p>
                </div>

                <div class="results-summary">
                  <div class="summary-grid">
                    <div class="result-card created" [(class as any).active]="(resultadoCarga()?.vehiculos_creados?.length || 0) > 0">
                      <div class="card-header">
                        <div class="card-icon">
                          <app-smart-icon [iconName]="'add_circle'" [size]="40"></app-smart-icon>
                        </div>
                        <div class="card-badge">Nuevos</div>
                      </div>
                      <div class="card-content">
                        <h3>{{ resultadoCarga()?.vehiculos_creados?.length || 0 }}</h3>
                        <p>Vehículos Creados</p>
                      </div>
                    </div>

                    <div class="result-card updated" [(class as any).active]="(resultadoCarga()?.vehiculos_actualizados?.length || 0) > 0">
                      <div class="card-header">
                        <div class="card-icon">
                          <app-smart-icon [iconName]="'update'" [size]="40"></app-smart-icon>
                        </div>
                        <div class="card-badge">Modificados</div>
                      </div>
                      <div class="card-content">
                        <h3>{{ resultadoCarga()?.vehiculos_actualizados?.length || 0 }}</h3>
                        <p>Vehículos Actualizados</p>
                      </div>
                    </div>

                    <div class="result-card errors" [(class as any).active]="(resultadoCarga()?.errores || 0) > 0">
                      <div class="card-header">
                        <div class="card-icon">
                          <app-smart-icon [iconName]="'error'" [size]="40"></app-smart-icon>
                        </div>
                        <div class="card-badge">Errores</div>
                      </div>
                      <div class="card-content">
                        <h3>{{ resultadoCarga()?.errores || 0 }}</h3>
                        <p>Con Errores</p>
                      </div>
                    </div>

                    <div class="result-card total">
                      <div class="card-header">
                        <div class="card-icon">
                          <app-smart-icon [iconName]="'assessment'" [size]="40"></app-smart-icon>
                        </div>
                        <div class="card-badge">Total</div>
                      </div>
                      <div class="card-content">
                        <h3>{{ resultadoCarga()?.total_procesados || 0 }}</h3>
                        <p>Registros Procesados</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mostrar listas de vehículos procesados -->
                @if (resultadoCarga()?.vehiculos_creados?.length || resultadoCarga()?.vehiculos_actualizados?.length) {
                  <div class="vehicles-processed">
                    @if (resultadoCarga()?.vehiculos_creados?.length) {
                      <div class="vehicles-section created">
                        <div class="section-header">
                          <app-smart-icon [iconName]="'add_circle'" [size]="24"></app-smart-icon>
                          <h4>Vehículos Creados ({{ resultadoCarga()?.vehiculos_creados?.length }})</h4>
                        </div>
                        <div class="vehicles-grid">
                          @for (placa of resultadoCarga()?.vehiculos_creados; track placa) {
                            <div class="vehicle-chip created">
                              <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                              <span>{{ placa }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    @if (resultadoCarga()?.vehiculos_actualizados?.length) {
                      <div class="vehicles-section updated">
                        <div class="section-header">
                          <app-smart-icon [iconName]="'update'" [size]="24"></app-smart-icon>
                          <h4>Vehículos Actualizados ({{ resultadoCarga()?.vehiculos_actualizados?.length }})</h4>
                        </div>
                        <div class="vehicles-grid">
                          @for (placa of resultadoCarga()?.vehiculos_actualizados; track placa) {
                            <div class="vehicle-chip updated">
                              <app-smart-icon [iconName]="'directions_car'" [size]="16"></app-smart-icon>
                              <span>{{ placa }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (resultadoCarga()?.errores_detalle && resultadoCarga()!.(errores_detalle as any).length > 0) {
                  <div class="error-details-section">
                    <div class="section-header error">
                      <app-smart-icon [iconName]="'error_outline'" [size]="24"></app-smart-icon>
                      <h4>Errores Detallados</h4>
                    </div>
                    <div class="error-list">
                      @for (error of resultadoCarga()?.errores_detalle; track (error as any).fila) {
                        <div class="error-item-detail">
                          <div class="error-header">
                            <div class="error-info">
                              <span class="error-row">Fila {{ (error as any).fila }}</span>
                              <span class="error-placa">{{ (error as any).placa }}</span>
                            </div>
                            <app-smart-icon [iconName]="'error'" [size]="20"></app-smart-icon>
                          </div>
                          <div class="error-messages">
                            @for (err of (error as any).errores; track err) {
                              <div class="error-message">
                                <app-smart-icon [iconName]="'chevron_right'" [size]="14"></app-smart-icon>
                                <span>{{ err }}</span>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="action-buttons final">
                  <button mat-stroked-button 
                          (click)="reiniciarProceso()"
                          class="secondary-btn">
                    <app-smart-icon [iconName]="'refresh'" [size]="18"></app-smart-icon>
                    Cargar Otro Archivo
                  </button>
                  
                  <button mat-raised-button 
                          color="primary" 
                          (click)="cerrarModal()"
                          class="primary-btn">
                    <app-smart-icon [iconName]="'check'" [size]="18"></app-smart-icon>
                    Finalizar
                  </button>
                </div>
              </div>
            }
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `, 
 styles: [`
    .carga-masiva-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Header Styles */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      color: white;
      box-shadow: 0 20px 40px rgba(102, 126, 234, (0 as any).3);
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://(www as any).w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="(0 as any).1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      pointer-events: none;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
      z-index: 1;
      position: relative;
    }

    .header-icon {
      padding: 16px;
      background: rgba(255, 255, 255, (0 as any).2);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .header-text h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -(0 as any).5px;
    }

    .header-text p {
      margin: 0;
      opacity: (0 as any).9;
      font-size: 16px;
      font-weight: 400;
    }

    .close-button {
      background: rgba(255, 255, 255, (0 as any).2);
      color: white;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      transition: all (0 as any).3s cubic-bezier((0 as any).4, 0, (0 as any).2, 1);
      z-index: 1;
      position: relative;
    }

    .close-button:hover {
      background: rgba(244, 67, 54, (0 as any).2);
      transform: scale((1 as any).1) rotate(90deg);
    }

    /* Modern Stepper */
    .modern-stepper {
      background: transparent;
    }

    :host ::ng-deep .modern-stepper .mat-stepper-horizontal {
      background: transparent;
    }

    :host ::ng-deep .modern-stepper .mat-step-header {
      background: white;
      border-radius: 16px;
      margin: 0 8px;
      padding: 16px 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, (0 as any).1);
      transition: all (0 as any).3s cubic-bezier((0 as any).4, 0, (0 as any).2, 1);
      border: 2px solid transparent;
    }

    :host ::ng-deep .modern-stepper .mat-step-header:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, (0 as any).15);
    }

    :host ::ng-deep .modern-stepper .mat-step-(header as any).cdk-keyboard-focused,
    :host ::ng-deep .modern-stepper .mat-step-(header as any).cdk-program-focused {
      border-color: #667eea;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      color: #333;
    }

    .step-content {
      margin-top: 32px;
      padding: 32px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, (0 as any).1);
      border: 1px solid rgba(255, 255, 255, (0 as any).2);
    }

    /* Upload Section */
    .upload-section {
      max-width: 800px;
      margin: 0 auto;
    }

    .upload-area {
      border: 3px dashed #e0e7ff;
      border-radius: 24px;
      padding: 64px 32px;
      text-align: center;
      cursor: pointer;
      transition: all (0 as any).4s cubic-bezier((0 as any).4, 0, (0 as any).2, 1);
      margin-bottom: 32px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      position: relative;
      overflow: hidden;
    }

    .upload-area::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 50% 50%, rgba(102, 126, 234, (0 as any).05) 0%, transparent 70%);
      opacity: 0;
      transition: opacity (0 as any).3s ease;
    }

    .upload-area:hover::before {
      opacity: 1;
    }

    .upload-area:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(102, 126, 234, (0 as any).2);
    }

    .upload-(area as any).dragover {
      border-color: #667eea;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      transform: scale((1 as any).02);
      box-shadow: 0 25px 80px rgba(102, 126, 234, (0 as any).3);
    }

    .upload-(area as any).has-file {
      border-color: #10b981;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .upload-icon-container {
      position: relative;
      display: inline-block;
      margin-bottom: 24px;
    }

    .upload-icon {
      color: #667eea;
      filter: drop-shadow(0 4px 12px rgba(102, 126, 234, (0 as any).3));
    }

    .upload-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border: 2px solid #667eea;
      border-radius: 50%;
      opacity: (0 as any).3;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale((0 as any).8);
        opacity: (0 as any).7;
      }
      50% {
        transform: translate(-50%, -50%) scale((1 as any).2);
        opacity: (0 as any).3;
      }
      100% {
        transform: translate(-50%, -50%) scale((1 as any).6);
        opacity: 0;
      }
    }

    .upload-placeholder h3 {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -(0 as any).5px;
    }

    .upload-placeholder p {
      margin: 0 0 32px 0;
      color: #64748b;
      font-size: 16px;
      font-weight: 500;
    }

    .supported-formats {
      margin: 32px 0;
      padding: 24px;
      background: rgba(255, 255, 255, (0 as any).7);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .format-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #475569;
      font-weight: 600;
      font-size: 14px;
    }

    .format-chips {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .format-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      transition: all (0 as any).3s ease;
      cursor: default;
    }

    .format-(chip as any).excel {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, (0 as any).3);
    }

    .format-(chip as any).csv {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, (0 as any).3);
    }

    .file-requirements {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .requirement-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
    }

    /* File Selected */
    .file-selected {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 3px solid #10b981;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }

    .file-selected::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, (0 as any).1) 50%, transparent 70%);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .file-icon-container {
      position: relative;
      padding: 16px;
      background: rgba(255, 255, 255, (0 as any).8);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .file-icon {
      color: #10b981;
    }

    .success-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, (0 as any).4);
    }

    .file-info {
      flex: 1;
      z-index: 1;
      position: relative;
    }

    .file-info h4 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
      color: #065f46;
    }

    .file-details {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .file-size, .file-type {
      padding: 4px 12px;
      background: rgba(255, 255, 255, (0 as any).8);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #065f46;
    }

    .file-status {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #10b981;
      font-size: 14px;
      font-weight: 600;
    }

    .remove-file-btn {
      background: rgba(255, 255, 255, (0 as any).9);
      color: #64748b;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      transition: all (0 as any).3s ease;
      z-index: 1;
      position: relative;
    }

    .remove-file-btn:hover {
      background: rgba(239, 68, 68, (0 as any).1);
      color: #ef4444;
      transform: scale((1 as any).1);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .secondary-actions, .primary-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .download-template-btn, .help-btn {
      border-color: #e2e8f0;
      color: #475569;
      font-weight: 600;
      border-radius: 12px;
      padding: 12px 24px;
      transition: all (0 as any).3s ease;
    }

    .download-template-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: rgba(59, 130, 246, (0 as any).05);
      transform: translateY(-2px);
    }

    .help-btn:hover {
      border-color: #8b5cf6;
      color: #8b5cf6;
      background: rgba(139, 92, 246, (0 as any).05);
      transform: translateY(-2px);
    }

    .cancel-btn {
      color: #64748b;
      font-weight: 600;
      border-radius: 12px;
      padding: 12px 24px;
      transition: all (0 as any).3s ease;
    }

    .cancel-btn:hover {
      background: rgba(239, 68, 68, (0 as any).1);
      color: #ef4444;
    }

    .validate-btn, .process-btn, .primary-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 12px 32px;
      font-weight: 700;
      letter-spacing: (0 as any).5px;
      box-shadow: 0 8px 24px rgba(102, 126, 234, (0 as any).3);
      transition: all (0 as any).3s cubic-bezier((0 as any).4, 0, (0 as any).2, 1);
    }

    .validate-btn:hover, .process-btn:hover, .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, (0 as any).4);
    }

    .validate-btn:disabled, .process-btn:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      transform: none;
    }

    /* Validation Loading */
    .validation-loading {
      text-align: center;
      padding: 80px 32px;
    }

    .loading-animation {
      margin-bottom: 32px;
    }

    .loading-spinner {
      display: inline-block;
      animation: spin 2s linear infinite;
      margin-bottom: 24px;
      color: #667eea;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .loading-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .loading-dots span {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      animation: bounce (1 as any).4s ease-in-out infinite both;
    }

    .loading-dots span:nth-child(1) { animation-delay: -(0 as any).32s; }
    .loading-dots span:nth-child(2) { animation-delay: -(0 as any).16s; }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      } 40% {
        transform: scale(1);
      }
    }

    .validation-loading h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .validation-loading p {
      margin: 0 0 32px 0;
      color: #64748b;
      font-size: 16px;
    }

    .modern-progress {
      border-radius: 8px;
      height: 8px;
      background: #e2e8f0;
    }

    :host ::ng-deep .modern-progress .mat-progress-bar-fill::after {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Validation Results */
    .validation-summary {
      margin-bottom: 32px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .summary-card {
      padding: 24px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all (0 as any).3s ease;
      border: 2px solid transparent;
      opacity: (0 as any).6;
    }

    .summary-(card as any).active {
      opacity: 1;
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, (0 as any).1);
    }

    .summary-(card as any).valid {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .summary-(card as any).valid.active {
      box-shadow: 0 12px 32px rgba(16, 185, 129, (0 as any).3);
    }

    .summary-(card as any).invalid {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .summary-(card as any).invalid.active {
      box-shadow: 0 12px 32px rgba(239, 68, 68, (0 as any).3);
    }

    .summary-(card as any).total {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .card-content h3 {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 800;
    }

    .card-content p {
      margin: 0;
      opacity: (0 as any).9;
      font-weight: 600;
    }

    /* Validation Table */
    .validation-table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, (0 as any).1);
      margin-bottom: 32px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .table-header h4 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .error-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      background: rgba(239, 68, 68, (0 as any).1);
      border-radius: 8px;
    }

    .table-wrapper {
      max-height: 400px;
      overflow-y: auto;
    }

    .validation-table {
      width: 100%;
    }

    :host ::ng-deep .validation-table .mat-header-cell {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 14px;
      padding: 16px 24px;
      border-bottom: 2px solid #e2e8f0;
    }

    :host ::ng-deep .validation-table .mat-cell {
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
    }

    :host ::ng-deep .validation-table .mat-row {
      transition: all (0 as any).2s ease;
    }

    :host ::ng-deep .validation-table .mat-row:hover {
      background: #f8fafc;
    }

    :host ::ng-deep .validation-table .mat-(row as any).error-row {
      background: rgba(239, 68, 68, (0 as any).05);
    }

    :host ::ng-deep .validation-table .mat-(row as any).valid-row {
      background: rgba(16, 185, 129, (0 as any).05);
    }

    .row-number {
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
    }

    .placa-text {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      font-size: 16px;
      color: #1e293b;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }

    .status-(chip as any).valid {
      background: rgba(16, 185, 129, (0 as any).1);
      color: #059669;
    }

    .status-(chip as any).invalid {
      background: rgba(239, 68, 68, (0 as any).1);
      color: #dc2626;
    }

    .error-details, .warning-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .error-item, .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      line-height: (1 as any).4;
    }

    .error-item {
      color: #dc2626;
    }

    .warning-item {
      color: #d97706;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #059669;
      font-size: 12px;
      font-weight: 600;
    }

    /* Processing Loading */
    .processing-loading {
      text-align: center;
      padding: 80px 32px;
    }

    .processing-animation {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      margin-bottom: 40px;
    }

    .processing-circle {
      position: relative;
    }

    .rotating-icon {
      color: #667eea;
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .processing-progress {
      position: relative;
    }

    .progress-ring {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .progress-ring svg {
      transform: rotate(-90deg);
    }

    .progress-circle {
      transition: stroke-dashoffset (0 as any).3s ease;
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .progress-percentage {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
    }

    .processing-loading h3 {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }

    .processing-loading p {
      margin: 0 0 32px 0;
      color: #64748b;
      font-size: 16px;
    }

    /* Processing Results */
    .processing-results {
      text-align: center;
    }

    .results-header {
      margin-bottom: 48px;
    }

    .success-icon {
      margin-bottom: 24px;
      color: #10b981;
      animation: successPulse 2s ease-in-out;
    }

    @keyframes successPulse {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale((1 as any).2); opacity: (0 as any).8; }
      100% { transform: scale(1); opacity: 1; }
    }

    .results-header h3 {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 800;
      color: #1e293b;
    }

    .results-header p {
      margin: 0;
      color: #64748b;
      font-size: 18px;
    }

    .results-summary {
      margin-bottom: 48px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .result-card {
      padding: 32px 24px;
      border-radius: 20px;
      transition: all (0 as any).3s cubic-bezier((0 as any).4, 0, (0 as any).2, 1);
      border: 2px solid transparent;
      opacity: (0 as any).6;
      position: relative;
      overflow: hidden;
    }

    .result-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, (0 as any).1) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform (0 as any).6s ease;
    }

    .result-(card as any).active {
      opacity: 1;
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, (0 as any).15);
    }

    .result-(card as any).active::before {
      transform: translateX(100%);
    }

    .result-(card as any).created {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .result-(card as any).updated {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .result-(card as any).errors {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .result-(card as any).total {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .card-badge {
      padding: 4px 12px;
      background: rgba(255, 255, 255, (0 as any).2);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }

    .card-content h3 {
      margin: 0 0 8px 0;
      font-size: 48px;
      font-weight: 900;
      line-height: 1;
    }

    .card-content p {
      margin: 0;
      opacity: (0 as any).9;
      font-weight: 600;
      font-size: 16px;
    }

    /* Vehicles Processed */
    .vehicles-processed {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
    }

    .vehicles-section {
      margin-bottom: 32px;
    }

    .vehicles-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-header h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .vehicles-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .vehicle-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      transition: all (0 as any).3s ease;
      cursor: default;
    }

    .vehicle-chip:hover {
      transform: translateY(-2px);
    }

    .vehicle-(chip as any).created {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      color: #065f46;
      border: 2px solid #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, (0 as any).2);
    }

    .vehicle-(chip as any).updated {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      color: #1e40af;
      border: 2px solid #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, (0 as any).2);
    }

    /* Error Details */
    .error-details-section {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 32px;
      border: 2px solid #fecaca;
    }

    .section-(header as any).error {
      color: #dc2626;
    }

    .error-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .error-item-detail {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, (0 as any).1);
    }

    .error-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .error-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .error-row {
      padding: 4px 8px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }

    .error-placa {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #1e293b;
    }

    .error-messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #dc2626;
      font-size: 14px;
      line-height: (1 as any).4;
    }

    /* Final Actions */
    .action-(buttons as any).final {
      justify-content: center;
      gap: 24px;
    }

    .secondary-btn {
      border-color: #e2e8f0;
      color: #475569;
      font-weight: 600;
      border-radius: 12px;
      padding: 12px 24px;
      transition: all (0 as any).3s ease;
    }

    .secondary-btn:hover {
      border-color: #64748b;
      color: #1e293b;
      background: rgba(100, 116, 139, (0 as any).05);
      transform: translateY(-2px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .carga-masiva-container {
        padding: 16px;
      }

      .header {
        padding: 24px;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .header-text h1 {
        font-size: 24px;
      }

      .step-content {
        padding: 24px 16px;
      }

      .upload-area {
        padding: 48px 24px;
      }

      .upload-placeholder h3 {
        font-size: 24px;
      }

      .action-buttons {
        flex-direction: column;
        gap: 16px;
      }

      .secondary-actions, .primary-actions {
        width: 100%;
        justify-content: center;
      }

      .summary-cards, .summary-grid {
        grid-template-columns: 1fr;
      }

      .file-selected {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .vehicles-grid {
        justify-content: center;
      }

      .table-wrapper {
        overflow-x: auto;
      }
    }

    @media (max-width: 480px) {
      .format-chips {
        flex-direction: column;
        align-items: center;
      }

      .upload-placeholder h3 {
        font-size: 20px;
      }

      .results-header h3 {
        font-size: 24px;
      }

      .card-content h3 {
        font-size: 36px;
      }
    }

    /* Custom Scrollbar */
    .table-wrapper::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .table-wrapper::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    .table-wrapper::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .table-wrapper::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Animation for step transitions */
    :host ::ng-deep .mat-stepper-horizontal .mat-stepper-horizontal-line {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      height: 4px;
      border-radius: 2px;
    }

    /* Snackbar Styles */
    :host ::ng-deep .snackbar-multiline {
      .mat-mdc-snack-bar-container {
        max-width: 600px !important;
        white-space: pre-line !important;
      }
      
      .mdc-snackbar__surface {
        min-width: 400px !important;
        border-radius: 12px !important;
      }
      
      .mat-mdc-snack-bar-label {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        line-height: (1 as any).4 !important;
        font-weight: 500 !important;
      }
    }

    :host ::ng-deep .snackbar-success {
      .mdc-snackbar__surface {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        box-shadow: 0 8px 32px rgba(16, 185, 129, (0 as any).3) !important;
      }
    }

    :host ::ng-deep .snackbar-error {
      .mdc-snackbar__surface {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        box-shadow: 0 8px 32px rgba(239, 68, 68, (0 as any).3) !important;
      }
    }

    :host ::ng-deep .snackbar-info {
      .mdc-snackbar__surface {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        box-shadow: 0 8px 32px rgba(59, 130, 246, (0 as any).3) !important;
      }
    }
  `]
})
export class CargaMasivaVehiculosComponent {
  private fb = inject(FormBuilder);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CargaMasivaVehiculosComponent>);

  // Formularios
  archivoForm = (this as any).fb.group({
    archivo: [null as File | null, (Validators as any).required]
  });

  // Estado del componente
  archivoSeleccionado = signal<File | null>(null);
  isDragOver = signal(false);
  validando = signal(false);
  procesando = signal(false);
  progresoProcesamiento = signal(0);

  // Datos de validación y resultados
  validaciones = signal<ValidacionExcel[]>([]);
  resultadoCarga = signal<ResultadoCarga | null>(null);

  // Configuración de tabla
  columnasValidacion = ['fila', 'placa', 'estado', 'errores'];

  // Computed properties
  validacionesValidas = computed(() => 
    (this as any).validaciones().filter(v => (v as any).valido).length
  );

  validacionesInvalidas = computed(() => 
    (this as any).validaciones().filter(v => !(v as any).valido).length
  );

  // Métodos de drag & drop
  onDragOver(event: DragEvent): void {
    (event as any).preventDefault();
    (this as any).isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    (event as any).preventDefault();
    (this as any).isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    (event as any).preventDefault();
    (this as any).isDragOver.set(false);
    
    const files = (event as any).dataTransfer?.files;
    if (files && (files as any).length > 0) {
      (this as any).handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = (event as any).target as HTMLInputElement;
    if ((input as any).files && (input as any).files.length > 0) {
      (this as any).handleFile((input as any).files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validar extensión del archivo
    const fileName = (file as any).name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = (validExtensions as any).some(ext => (fileName as any).endsWith(ext));
    
    if (!hasValidExtension) {
      (this as any).snackBar.open(
        'Tipo de archivo no válido. Use archivos Excel (.xlsx, .xls) o CSV (.csv)', 
        'Cerrar', 
        { 
          duration: 5000,
          panelClass: ['snackbar-error']
        }
      );
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if ((file as any).size > maxSize) {
      (this as any).snackBar.open(
        `El archivo es demasiado grande (${(this as any).formatFileSize((file as any).size)}). Máximo permitido: 10MB`, 
        'Cerrar', 
        { 
          duration: 5000,
          panelClass: ['snackbar-error']
        }
      );
      return;
    }

    // Validar que el archivo no esté vacío
    if ((file as any).size === 0) {
      (this as any).snackBar.open('El archivo está vacío. Seleccione un archivo válido.', 'Cerrar', { 
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Archivo válido
    (this as any).archivoSeleccionado.set(file);
    (this as any).archivoForm.patchValue({ archivo: file });
    
    // Limpiar validaciones anteriores
    (this as any).validaciones.set([]);
    (this as any).resultadoCarga.set(null);
    
    (this as any).snackBar.open(
      `Archivo "${(file as any).name}" seleccionado correctamente`, 
      'Cerrar', 
      { 
        duration: 2000,
        panelClass: ['snackbar-success']
      }
    );
  }

  removeFile(event: Event): void {
    (event as any).stopPropagation();
    (this as any).archivoSeleccionado.set(null);
    (this as any).archivoForm.patchValue({ archivo: null });
    (this as any).validaciones.set([]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = (Math as any).floor((Math as any).log(bytes) / (Math as any).log(k));
    return parseFloat((bytes / (Math as any).pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileType(fileName: string): string {
    const extension = (fileName as any).toLowerCase().split('.').pop();
    switch (extension) {
      case 'xlsx':
        return 'Excel 2007+';
      case 'xls':
        return 'Excel 97-2003';
      case 'csv':
        return 'CSV';
      default:
        return 'Desconocido';
    }
  }

  descargarPlantilla(): void {
    (this as any).vehiculoService.descargarPlantillaExcel().subscribe({
      next: (blob) => {
        const url = (window as any).URL.createObjectURL(blob);
        const link = (document as any).createElement('a');
        (link as any).href = url;
        
        // Generar nombre con fecha actual y extensión Excel
        const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        (link as any).download = `plantilla_vehiculos_sirret_${fecha}.xlsx`;
        
        // Agregar al DOM temporalmente para hacer clic
        (document as any).body.appendChild(link);
        (link as any).click();
        
        // Limpiar
        (document as any).body.removeChild(link);
        (window as any).URL.revokeObjectURL(url);
        
        (this as any).snackBar.open('Plantilla Excel descargada exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        (console as any).error('Error descargando plantilla:', error);
        (this as any).snackBar.open('Error al descargar la plantilla. Intente nuevamente.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  validarArchivo(): void {
    const archivo = (this as any).archivoSeleccionado();
    if (!archivo) return;

    (this as any).validando.set(true);
    
    (this as any).vehiculoService.validarExcel(archivo).subscribe({
      next: (validaciones) => {
        (this as any).validaciones.set(validaciones);
        (this as any).validando.set(false);
        
        if ((validaciones as any).length === 0) {
          (this as any).snackBar.open('El archivo está vacío o no tiene datos válidos', 'Cerrar', { duration: 3000 });
        } else {
          }
      },
      error: (error) => {
        (console as any).error('[COMPONENTE] ❌ Error validando archivo:', error);
        (this as any).snackBar.open('Error al validar el archivo', 'Cerrar', { duration: 3000 });
        (this as any).validando.set(false);
      }
    });
  }

  procesarCarga(): void {
    const archivo = (this as any).archivoSeleccionado();
    if (!archivo) return;

    (this as any).procesando.set(true);
    (this as any).progresoProcesamiento.set(0);

    // Simular progreso
    const interval = setInterval(() => {
      const progreso = (this as any).progresoProcesamiento();
      if (progreso < 90) {
        (this as any).progresoProcesamiento.set(progreso + 10);
      }
    }, 500);

    (this as any).vehiculoService.cargaMasivaVehiculos(archivo).subscribe({
      next: (resultado) => {
        clearInterval(interval);
        (this as any).progresoProcesamiento.set(100);
        (this as any).resultadoCarga.set(resultado);
        (this as any).procesando.set(false);
        
        const mensajeExito = [];
        if ((resultado as any).vehiculos_creados?.length > 0) {
          (mensajeExito as any).push(`${(resultado as any).vehiculos_creados.length} vehículos creados`);
        }
        if ((resultado as any).vehiculos_actualizados?.length > 0) {
          (mensajeExito as any).push(`${(resultado as any).vehiculos_actualizados.length} vehículos actualizados`);
        }
        
        const mensaje = (mensajeExito as any).length > 0 
          ? `Carga completada: ${(mensajeExito as any).join(', ')}`
          : `Procesamiento completado: ${(resultado as any).exitosos} vehículos procesados`;
        
        (this as any).snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        clearInterval(interval);
        (console as any).error('Error en carga masiva:', error);
        (this as any).snackBar.open('Error en la carga masiva', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        (this as any).procesando.set(false);
      }
    });
  }

  reiniciarProceso(): void {
    (this as any).archivoSeleccionado.set(null);
    (this as any).validaciones.set([]);
    (this as any).resultadoCarga.set(null);
    (this as any).archivoForm.reset();
  }

  cerrarModal(): void {
    // Si hay procesamiento en curso, confirmar antes de cerrar
    if ((this as any).procesando()) {
      const confirmar = confirm('¿Está seguro de cancelar? El procesamiento está en curso y se perderá el progreso.');
      if (!confirmar) {
        return;
      }
    }
    
    // Si hay datos cargados pero no procesados, confirmar
    if ((this as any).archivoSeleccionado() && (this as any).validaciones().length > 0 && !(this as any).resultadoCarga()) {
      const confirmar = confirm('¿Está seguro de cancelar? Se perderán los datos validados.');
      if (!confirmar) {
        return;
      }
    }
    
    (this as any).dialogRef.close((this as any).resultadoCarga());
  }

  mostrarAyuda(): void {
    const ayudaContent = `
    📋 GUÍA RÁPIDA DE CARGA MASIVA DE VEHÍCULOS (36 CAMPOS)

    🔹 PASOS A SEGUIR:
    1. Descargar la plantilla Excel oficial (.xlsx)
    2. Completar los datos en la hoja "DATOS"
    3. Subir el archivo al sistema
    4. Revisar validaciones
    5. Procesar la carga

    🔹 CAMPOS OBLIGATORIOS:
    • Placa (formato: ABC-123)

    🔹 CAMPOS CON AUTOCOMPLETADO:
    • DNI: 1-8 dígitos (se completa a 8: 123 → 00000123)
    • TUC: 1-6 dígitos (se completa a 6: 123 → 000123)

    🔹 NUEVOS CAMPOS INCLUIDOS:
    • RUC Empresa (11 dígitos)
    • Resoluciones Primigenia/Hija (R-0123-2025)
    • DNI del propietario (8 dígitos)
    • Fecha de Resolución (DD/MM/AAAA)
    • Placa de Baja (para reemplazos)
    • Número Serie VIN
    • Cilindrada y Potencia
    • Expediente administrativo (E-01234-2025)
    • Rutas asignadas (01,02,03)

    🔹 ARCHIVO EXCEL INCLUYE:
    • Hoja "INSTRUCCIONES": Guía completa
    • Hoja "REFERENCIA": Descripción de 36 campos
    • Hoja "DATOS": Donde completar información

    🔹 FORMATOS SOPORTADOS:
    • Excel: .xlsx, .xls (recomendado)
    • CSV: .csv (alternativo)
    • Tamaño máximo: 10MB

    🔹 VALIDACIONES IMPORTANTES:
    • Placas únicas (no duplicadas)
    • Formato de placa peruano (ABC-123)
    • RUC de 11 dígitos
    • DNI de 1-8 dígitos (se completa automáticamente)
    • Fechas en formato DD/MM/AAAA
    • Resoluciones: R-0123-2025 o 0123-2025 (prefijo opcional)
    • Expediente: E-01234-2025 o 01234-2025 (prefijo opcional)
    • TUC: T-123456 o 123456 o 123 (se completa a 6 dígitos)
    • Rutas: 1 o 01 o 01,02,03
    • Años entre 1990-${new Date().getFullYear() + 1}

    🔹 CONSEJOS:
    • Use la plantilla Excel oficial actualizada
    • Complete datos en la hoja "DATOS"
    • Consulte la hoja "REFERENCIA" para ejemplos
    • Los prefijos R-, E-, T- son opcionales
    • El DNI se completa automáticamente (123 → 00000123)
    • El TUC se completa automáticamente (123 → 000123)
    • Solo la PLACA es obligatoria, todo lo demás es opcional
    • Verifique los datos antes de subir

    ❓ ¿Necesita más ayuda?
    Consulte las hojas de instrucciones en el archivo Excel.
    `;

    (this as any).snackBar.open(ayudaContent, 'Cerrar', {
      duration: 15000,
      panelClass: ['snackbar-info', 'snackbar-multiline'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}