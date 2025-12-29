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
    SmartIconComponent
  ],
  template: `
    <div class="carga-masiva-container">
      <div class="header">
        <h2>
          <app-smart-icon [iconName]="'upload_file'" [size]="32"></app-smart-icon>
          Carga Masiva de Vehículos
        </h2>
        <p>Importa múltiples vehículos desde un archivo Excel</p>
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
                      <app-smart-icon [iconName]="'cloud_upload'" [size]="64"></app-smart-icon>
                      <h3>Arrastra tu archivo Excel aquí</h3>
                      <p>o haz clic para seleccionar</p>
                      <small>Formatos soportados: .xlsx, .xls</small>
                    </div>
                  } @else {
                    <div class="file-selected">
                      <app-smart-icon [iconName]="'description'" [size]="48"></app-smart-icon>
                      <div class="file-info">
                        <h4>{{ archivoSeleccionado()?.name }}</h4>
                        <p>{{ formatFileSize(archivoSeleccionado()?.size || 0) }}</p>
                      </div>
                      <button mat-icon-button (click)="removeFile($event)">
                        <app-smart-icon [iconName]="'close'" [size]="24"></app-smart-icon>
                      </button>
                    </div>
                  }
                </div>

                <div class="actions">
                  <button mat-raised-button 
                          color="primary" 
                          (click)="descargarPlantilla()"
                          type="button">
                    <app-smart-icon [iconName]="'download'" [size]="20"></app-smart-icon>
                    Descargar Plantilla
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
                    <div class="stat-card exitosos">
                      <app-smart-icon [iconName]="'check_circle'" [size]="32"></app-smart-icon>
                      <div class="stat-info">
                        <h3>{{ resultadoCarga()?.exitosos || 0 }}</h3>
                        <p>Vehículos Creados</p>
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
      text-align: center;
      margin-bottom: 32px;
    }

    .header h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 24px;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: #1976d2;
      background-color: #f5f5f5;
    }

    .upload-placeholder {
      color: #666;
    }

    .upload-placeholder h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .file-info h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .file-info p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

    .stat-card.exitosos {
      background: linear-gradient(135deg, #4caf50, #66bb6a);
      color: white;
    }

    .stat-card.errores {
      background: linear-gradient(135deg, #f44336, #ef5350);
      color: white;
    }

    .stat-card.total {
      background: linear-gradient(135deg, #2196f3, #42a5f5);
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
    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Tipo de archivo no válido. Use .xlsx o .xls', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo es demasiado grande. Máximo 10MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.archivoForm.patchValue({ archivo: file });
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
        link.download = 'plantilla_vehiculos.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando plantilla:', error);
        this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 3000 });
      }
    });
  }

  validarArchivo(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) return;

    this.validando.set(true);
    
    this.vehiculoService.validarExcel(archivo).subscribe({
      next: (validaciones) => {
        this.validaciones.set(validaciones);
        this.validando.set(false);
        
        if (validaciones.length === 0) {
          this.snackBar.open('El archivo está vacío o no tiene datos válidos', 'Cerrar', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error validando archivo:', error);
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
        
        this.snackBar.open(
          `Carga completada: ${resultado.exitosos} vehículos creados`,
          'Cerrar',
          { duration: 5000 }
        );
      },
      error: (error) => {
        clearInterval(interval);
        console.error('Error en carga masiva:', error);
        this.snackBar.open('Error en la carga masiva', 'Cerrar', { duration: 3000 });
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
    this.dialogRef.close(this.resultadoCarga());
  }
}