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
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';

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
          <h2>
            <app-smart-icon [iconName]="'upload_file'" [size]="32"></app-smart-icon>
            Carga Masiva de Vehículos
          </h2>
          <p>Importa múltiples vehículos desde un archivo Excel</p>
        </div>
        <button mat-icon-button 
                (click)="cerrarModal()" 
                class="close-button"
                matTooltip="Cerrar modal">
          <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
        </button>
      </div>

      <mat-stepper [linear]="true" #stepper>
        <!-- Paso 1: Selección de archivo -->
        <mat-step [stepControl]="archivoForm" label="Seleccionar Archivo">
          <form [formGroup]="archivoForm">
            <mat-card>
              <mat-card-content>
                <div class="upload-area" 
                     [class.dragover]="isDragOver()"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">
                  
                  <input #fileInput 
                         type="file" 
                         accept=".xlsx,.xls" 
                         (change)="onFileSelected($event)"
                         style="display: none;">
                  
                  @if (!archivoSeleccionado()) {
                    <div class="upload-placeholder">
                      <app-smart-icon [iconName]="'cloud_upload'" [size]="64" class="upload-icon"></app-smart-icon>
                      <h3>Arrastra tu archivo aquí</h3>
                      <p>o haz clic para seleccionar</p>
                      <div class="supported-formats">
                        <small><strong>Formatos soportados:</strong></small>
                        <div class="format-chips">
                          <span class="format-chip">.xlsx</span>
                          <span class="format-chip">.xls</span>
                          <span class="format-chip">.csv</span>
                        </div>
                      </div>
                      <div class="file-requirements">
                        <small>• Tamaño máximo: 10MB</small>
                        <small>• Usar la plantilla oficial</small>
                        <small>• Completar campos obligatorios</small>
                      </div>
                    </div>
                  } @else {
                    <div class="file-selected">
                      <app-smart-icon [iconName]="'description'" [size]="48" class="file-icon"></app-smart-icon>
                      <div class="file-info">
                        <h4>{{ archivoSeleccionado()?.name }}</h4>
                        <p>{{ formatFileSize(archivoSeleccionado()?.size || 0) }}</p>
                        <div class="file-status">
                          <app-smart-icon [iconName]="'check_circle'" [size]="16"></app-smart-icon>
                          <span>Archivo listo para validar</span>
                        </div>
                      </div>
                      <button mat-icon-button 
                              (click)="removeFile($event)"
                              class="remove-file-btn"
                              matTooltip="Quitar archivo">
                        <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
                      </button>
                    </div>
                  }
                </div>

                <div class="actions">
                  <button mat-button 
                          (click)="cerrarModal()"
                          type="button"
                          class="cancel-button">
                    <app-smart-icon [iconName]="'close'" [size]="20"></app-smart-icon>
                    Cancelar
                  </button>
                  
                  <button mat-raised-button 
                          color="primary" 
                          (click)="descargarPlantilla()"
                          type="button">
                    <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
                    Descargar Plantilla
                  </button>
                  
                  <button mat-button 
                          (click)="mostrarAyuda()"
                          type="button">
                    <app-smart-icon [iconName]="'help'" [size]="20"></app-smart-icon>
                    Ayuda
                  </button>
                  
                  <button mat-raised-button 
                          color="accent" 
                          matStepperNext 
                          [disabled]="!archivoSeleccionado()"
                          (click)="validarArchivo()">
                    <app-smart-icon [iconName]="'check_circle'" [size]="20"></app-smart-icon>
                    Validar Archivo
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </form>
        </mat-step>   
     <!-- Paso 2: Validación -->
        <mat-step label="Validación">
          <mat-card>
            <mat-card-content>
              @if (validando()) {
                <div class="validacion-loading">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>Validando archivo...</p>
                </div>
              } @else if (validaciones().length > 0) {
                <div class="validacion-resultados">
                  <div class="stats">
                    <mat-chip-set>
                      <mat-chip [color]="validacionesValidas() > 0 ? 'primary' : 'basic'">
                        <app-smart-icon [iconName]="'check_circle'" [size]="16"></app-smart-icon>
                        {{ validacionesValidas() }} Válidos
                      </mat-chip>
                      <mat-chip [color]="validacionesInvalidas() > 0 ? 'warn' : 'basic'">
                        <app-smart-icon [iconName]="'error'" [size]="16"></app-smart-icon>
                        {{ validacionesInvalidas() }} Con Errores
                      </mat-chip>
                    </mat-chip-set>
                  </div>

                  <div class="tabla-validaciones">
                    <table mat-table [dataSource]="validaciones()" class="validacion-table">
                      <ng-container matColumnDef="fila">
                        <th mat-header-cell *matHeaderCellDef>Fila</th>
                        <td mat-cell *matCellDef="let validacion">{{ validacion.fila }}</td>
                      </ng-container>

                      <ng-container matColumnDef="placa">
                        <th mat-header-cell *matHeaderCellDef>Placa</th>
                        <td mat-cell *matCellDef="let validacion">{{ validacion.placa }}</td>
                      </ng-container>

                      <ng-container matColumnDef="estado">
                        <th mat-header-cell *matHeaderCellDef>Estado</th>
                        <td mat-cell *matCellDef="let validacion">
                          @if (validacion.valido) {
                            <mat-chip color="primary">
                              <app-smart-icon [iconName]="'check'" [size]="16"></app-smart-icon>
                              Válido
                            </mat-chip>
                          } @else {
                            <mat-chip color="warn">
                              <app-smart-icon [iconName]="'error'" [size]="16"></app-smart-icon>
                              Error
                            </mat-chip>
                          }
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="errores">
                        <th mat-header-cell *matHeaderCellDef>Errores/Advertencias</th>
                        <td mat-cell *matCellDef="let validacion">
                          @if (validacion.errores.length > 0) {
                            <div class="errores-lista">
                              @for (error of validacion.errores; track error) {
                                <small class="error-item">• {{ error }}</small>
                              }
                            </div>
                          }
                          @if (validacion.advertencias.length > 0) {
                            <div class="advertencias-lista">
                              @for (advertencia of validacion.advertencias; track advertencia) {
                                <small class="advertencia-item">⚠ {{ advertencia }}</small>
                              }
                            </div>
                          }
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="columnasValidacion"></tr>
                      <tr mat-row *matRowDef="let row; columns: columnasValidacion;"></tr>
                    </table>
                  </div>

                  <div class="actions">
                    <button mat-button matStepperPrevious>
                      <app-smart-icon [iconName]="'arrow_back'" [size]="20"></app-smart-icon>
                      Volver
                    </button>
                    
                    <button mat-button 
                            (click)="cerrarModal()"
                            class="cancel-button">
                      <app-smart-icon [iconName]="'close'" [size]="20"></app-smart-icon>
                      Cancelar
                    </button>
                    
                    <button mat-raised-button 
                            color="primary" 
                            matStepperNext
                            [disabled]="validacionesValidas() === 0"
                            (click)="procesarCarga()">
                      <app-smart-icon [iconName]="'upload'" [size]="20"></app-smart-icon>
                      Procesar Carga ({{ validacionesValidas() }} vehículos)
                    </button>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </mat-step>

        <!-- Paso 3: Procesamiento -->
        <mat-step label="Procesamiento">
          <mat-card>
            <mat-card-content>
              @if (procesando()) {
                <div class="procesamiento-loading">
                  <mat-progress-bar mode="determinate" [value]="progresoProcesamiento()"></mat-progress-bar>
                  <p>Procesando vehículos... {{ progresoProcesamiento() }}%</p>
                </div>
              } @else if (resultadoCarga()) {
                <div class="resultado-carga">
                  <div class="resultado-stats">
                    <div class="stat-card creados">
                      <app-smart-icon [iconName]="'add_circle'" [size]="32"></app-smart-icon>
                      <div class="stat-info">
                        <h3>{{ resultadoCarga()?.vehiculos_creados?.length || 0 }}</h3>
                        <p>Vehículos Creados</p>
                      </div>
                    </div>

                    <div class="stat-card actualizados">
                      <app-smart-icon [iconName]="'update'" [size]="32"></app-smart-icon>
                      <div class="stat-info">
                        <h3>{{ resultadoCarga()?.vehiculos_actualizados?.length || 0 }}</h3>
                        <p>Vehículos Actualizados</p>
                      </div>
                    </div>

                    <div class="stat-card errores">
                      <app-smart-icon [iconName]="'error'" [size]="32"></app-smart-icon>
                      <div class="stat-info">
                        <h3>{{ resultadoCarga()?.errores || 0 }}</h3>
                        <p>Errores</p>
                      </div>
                    </div>

                    <div class="stat-card total">
                      <app-smart-icon [iconName]="'assessment'" [size]="32"></app-smart-icon>
                      <div class="stat-info">
                        <h3>{{ resultadoCarga()?.total_procesados || 0 }}</h3>
                        <p>Total Procesados</p>
                      </div>
                    </div>
                  </div>

                  <!-- Mostrar listas de vehículos procesados -->
                  @if (resultadoCarga()?.vehiculos_creados?.length || resultadoCarga()?.vehiculos_actualizados?.length) {
                    <div class="vehiculos-procesados">
                      @if (resultadoCarga()?.vehiculos_creados?.length) {
                        <div class="vehiculos-creados">
                          <h4>
                            <app-smart-icon [iconName]="'add_circle'" [size]="20"></app-smart-icon>
                            Vehículos Creados:
                          </h4>
                          <div class="placas-lista">
                            @for (placa of resultadoCarga()?.vehiculos_creados; track placa) {
                              <span class="placa-chip creado">{{ placa }}</span>
                            }
                          </div>
                        </div>
                      }

                      @if (resultadoCarga()?.vehiculos_actualizados?.length) {
                        <div class="vehiculos-actualizados">
                          <h4>
                            <app-smart-icon [iconName]="'update'" [size]="20"></app-smart-icon>
                            Vehículos Actualizados:
                          </h4>
                          <div class="placas-lista">
                            @for (placa of resultadoCarga()?.vehiculos_actualizados; track placa) {
                              <span class="placa-chip actualizado">{{ placa }}</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }

                  @if (resultadoCarga()?.errores_detalle && resultadoCarga()!.errores_detalle.length > 0) {
                    <div class="errores-detalle">
                      <h4>Errores Detallados:</h4>
                      <div class="errores-lista">
                        @for (error of resultadoCarga()?.errores_detalle; track error.fila) {
                          <div class="error-detalle">
                            <strong>Fila {{ error.fila }} - {{ error.placa }}:</strong>
                            <ul>
                              @for (err of error.errores; track err) {
                                <li>{{ err }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <div class="actions">
                    <button mat-raised-button 
                            color="primary" 
                            (click)="cerrarModal()">
                      <app-smart-icon [iconName]="'check'" [size]="20"></app-smart-icon>
                      Finalizar
                    </button>
                    
                    <button mat-button 
                            (click)="reiniciarProceso()">
                      <app-smart-icon [iconName]="'refresh'" [size]="20"></app-smart-icon>
                      Cargar Otro Archivo
                    </button>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </mat-step>
      </mat-stepper>
    </div>
  `, 
 styles: [`
    .carga-masiva-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      text-align: left;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      flex: 1;
    }

    .header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      color: #666;
      background: rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      margin-left: 16px;
    }

    .close-button:hover {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      transform: scale(1.1);
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 24px;
      background: #fafafa;
      position: relative;
      overflow: hidden;
    }

    .upload-area:hover {
      border-color: #1976d2;
      background-color: #f0f7ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
    }

    .upload-area.dragover {
      border-color: #1976d2;
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
      box-shadow: 0 8px 24px rgba(25, 118, 210, 0.2);
      transform: scale(1.02);
    }

    .upload-placeholder {
      color: #666;
    }

    .upload-icon {
      color: #1976d2;
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .upload-placeholder h3 {
      margin: 16px 0 8px 0;
      color: #333;
      font-weight: 500;
    }

    .upload-placeholder p {
      margin: 0 0 16px 0;
      color: #666;
    }

    .supported-formats {
      margin: 16px 0;
    }

    .format-chips {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .format-chip {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .file-requirements {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .file-requirements small {
      color: #666;
      font-size: 11px;
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
      border: 2px solid #4caf50;
      border-radius: 12px;
      position: relative;
    }

    .file-icon {
      color: #4caf50;
    }

    .file-info {
      flex: 1;
    }

    .file-info h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-weight: 500;
    }

    .file-info p {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
    }

    .file-status {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #4caf50;
      font-size: 12px;
      font-weight: 500;
    }

    .remove-file-btn {
      color: #666;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
    }

    .remove-file-btn:hover {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      align-items: center;
    }

    .cancel-button {
      color: #666;
      border-color: #ddd;
    }

    .cancel-button:hover {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border-color: #f44336;
    }

    .validacion-loading,
    .procesamiento-loading {
      text-align: center;
      padding: 48px 24px;
    }

    .stats {
      margin-bottom: 24px;
    }

    .validacion-table {
      width: 100%;
      margin-bottom: 24px;
    }

    .errores-lista {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .error-item {
      color: #d32f2f;
    }

    .advertencia-item {
      color: #f57c00;
    }

    .resultado-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-card.creados {
      background: linear-gradient(135deg, #4caf50, #66bb6a);
      color: white;
    }

    .stat-card.actualizados {
      background: linear-gradient(135deg, #2196f3, #42a5f5);
      color: white;
    }

    .stat-card.errores {
      background: linear-gradient(135deg, #f44336, #ef5350);
      color: white;
    }

    .stat-card.total {
      background: linear-gradient(135deg, #9c27b0, #ba68c8);
      color: white;
    }

    .stat-info h3 {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 600;
    }

    .stat-info p {
      margin: 0;
      opacity: 0.9;
    }

    .errores-detalle {
      background: #ffebee;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .error-detalle {
      margin-bottom: 16px;
      padding: 12px;
      background: white;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    .error-detalle ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .vehiculos-procesados {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .vehiculos-creados,
    .vehiculos-actualizados {
      margin-bottom: 16px;
    }

    .vehiculos-creados:last-child,
    .vehiculos-actualizados:last-child {
      margin-bottom: 0;
    }

    .vehiculos-procesados h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
      font-weight: 500;
    }

    .placas-lista {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .placa-chip {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .placa-chip.creado {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #4caf50;
    }

    .placa-chip.actualizado {
      background: #e3f2fd;
      color: #1565c0;
      border: 1px solid #2196f3;
    }

    @media (max-width: 768px) {
      .carga-masiva-container {
        padding: 16px;
      }

      .upload-area {
        padding: 32px 16px;
      }

      .actions {
        flex-direction: column;
      }

      .resultado-stats {
        grid-template-columns: 1fr;
      }
    }

    /* Estilos globales para snackbars de ayuda */
    :host ::ng-deep .snackbar-multiline {
      .mat-mdc-snack-bar-container {
        max-width: 600px !important;
        white-space: pre-line !important;
      }
      
      .mdc-snackbar__surface {
        min-width: 400px !important;
      }
      
      .mat-mdc-snack-bar-label {
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
      }
    }

    :host ::ng-deep .snackbar-success {
      .mdc-snackbar__surface {
        background-color: #4caf50 !important;
      }
    }

    :host ::ng-deep .snackbar-error {
      .mdc-snackbar__surface {
        background-color: #f44336 !important;
      }
    }

    :host ::ng-deep .snackbar-info {
      .mdc-snackbar__surface {
        background-color: #2196f3 !important;
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
  archivoForm = this.fb.group({
    archivo: [null as File | null, Validators.required]
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
    this.validaciones().filter(v => v.valido).length
  );

  validacionesInvalidas = computed(() => 
    this.validaciones().filter(v => !v.valido).length
  );

  // Métodos de drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    console.log('[CARGA-MASIVA] Procesando archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
    
    // Validar extensión del archivo
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      this.snackBar.open(
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
    if (file.size > maxSize) {
      this.snackBar.open(
        `El archivo es demasiado grande (${this.formatFileSize(file.size)}). Máximo permitido: 10MB`, 
        'Cerrar', 
        { 
          duration: 5000,
          panelClass: ['snackbar-error']
        }
      );
      return;
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      this.snackBar.open('El archivo está vacío. Seleccione un archivo válido.', 'Cerrar', { 
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Archivo válido
    this.archivoSeleccionado.set(file);
    this.archivoForm.patchValue({ archivo: file });
    
    // Limpiar validaciones anteriores
    this.validaciones.set([]);
    this.resultadoCarga.set(null);
    
    this.snackBar.open(
      `Archivo "${file.name}" seleccionado correctamente`, 
      'Cerrar', 
      { 
        duration: 2000,
        panelClass: ['snackbar-success']
      }
    );
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado.set(null);
    this.archivoForm.patchValue({ archivo: null });
    this.validaciones.set([]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  descargarPlantilla(): void {
    this.vehiculoService.descargarPlantillaExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generar nombre con fecha actual y extensión Excel
        const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.download = `plantilla_vehiculos_sirret_${fecha}.xlsx`;
        
        // Agregar al DOM temporalmente para hacer clic
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Plantilla Excel descargada exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        console.error('Error descargando plantilla:', error);
        this.snackBar.open('Error al descargar la plantilla. Intente nuevamente.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  validarArchivo(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) return;

    console.log('[COMPONENTE] 🔍 Iniciando validación de archivo:', archivo.name);
    this.validando.set(true);
    
    this.vehiculoService.validarExcel(archivo).subscribe({
      next: (validaciones) => {
        console.log('[COMPONENTE] 📊 Validaciones recibidas:', validaciones);
        console.log('[COMPONENTE] 📈 Cantidad de validaciones:', validaciones.length);
        
        this.validaciones.set(validaciones);
        this.validando.set(false);
        
        if (validaciones.length === 0) {
          console.log('[COMPONENTE] ⚠️ No hay validaciones para mostrar');
          this.snackBar.open('El archivo está vacío o no tiene datos válidos', 'Cerrar', { duration: 3000 });
        } else {
          console.log('[COMPONENTE] ✅ Validaciones establecidas correctamente');
        }
      },
      error: (error) => {
        console.error('[COMPONENTE] ❌ Error validando archivo:', error);
        this.snackBar.open('Error al validar el archivo', 'Cerrar', { duration: 3000 });
        this.validando.set(false);
      }
    });
  }

  procesarCarga(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) return;

    this.procesando.set(true);
    this.progresoProcesamiento.set(0);

    // Simular progreso
    const interval = setInterval(() => {
      const progreso = this.progresoProcesamiento();
      if (progreso < 90) {
        this.progresoProcesamiento.set(progreso + 10);
      }
    }, 500);

    this.vehiculoService.cargaMasivaVehiculos(archivo).subscribe({
      next: (resultado) => {
        clearInterval(interval);
        this.progresoProcesamiento.set(100);
        this.resultadoCarga.set(resultado);
        this.procesando.set(false);
        
        const mensajeExito = [];
        if (resultado.vehiculos_creados?.length > 0) {
          mensajeExito.push(`${resultado.vehiculos_creados.length} vehículos creados`);
        }
        if (resultado.vehiculos_actualizados?.length > 0) {
          mensajeExito.push(`${resultado.vehiculos_actualizados.length} vehículos actualizados`);
        }
        
        const mensaje = mensajeExito.length > 0 
          ? `Carga completada: ${mensajeExito.join(', ')}`
          : `Procesamiento completado: ${resultado.exitosos} vehículos procesados`;
        
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        clearInterval(interval);
        console.error('Error en carga masiva:', error);
        this.snackBar.open('Error en la carga masiva', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.procesando.set(false);
      }
    });
  }

  reiniciarProceso(): void {
    this.archivoSeleccionado.set(null);
    this.validaciones.set([]);
    this.resultadoCarga.set(null);
    this.archivoForm.reset();
  }

  cerrarModal(): void {
    // Si hay procesamiento en curso, confirmar antes de cerrar
    if (this.procesando()) {
      const confirmar = confirm('¿Está seguro de cancelar? El procesamiento está en curso y se perderá el progreso.');
      if (!confirmar) {
        return;
      }
    }
    
    // Si hay datos cargados pero no procesados, confirmar
    if (this.archivoSeleccionado() && this.validaciones().length > 0 && !this.resultadoCarga()) {
      const confirmar = confirm('¿Está seguro de cancelar? Se perderán los datos validados.');
      if (!confirmar) {
        return;
      }
    }
    
    this.dialogRef.close(this.resultadoCarga());
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

    this.snackBar.open(ayudaContent, 'Cerrar', {
      duration: 15000,
      panelClass: ['snackbar-info', 'snackbar-multiline'],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}