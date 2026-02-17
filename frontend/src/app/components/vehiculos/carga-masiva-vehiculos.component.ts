import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { VehiculoService } from '../../services/vehiculo.service';

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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SmartIconComponent
  ],
  template: `
    <div class="carga-masiva-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="header-text">
            <h1>
              <mat-icon>cloud_upload</mat-icon>
              Carga Masiva de Vehículos
            </h1>
            <p>Importa múltiples vehículos desde un archivo Excel</p>
          </div>
          <button mat-raised-button color="accent" (click)="volver()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>

      <!-- Contenido Principal -->
      <mat-card class="main-card">
        <mat-card-content>
          <div class="upload-section">
            <!-- Área de carga -->
            <div class="upload-area" 
                 (click)="fileInput.click()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 [class.dragover]="isDragging()"
                 [class.has-file]="archivoSeleccionado()">
              
              @if (!archivoSeleccionado()) {
                <div class="upload-placeholder">
                  <div class="upload-icon-container">
                    <mat-icon class="upload-icon" [style.font-size.px]="64">cloud_upload</mat-icon>
                  </div>
                  <h3>Arrastra tu archivo aquí</h3>
                  <p>o haz clic para seleccionar</p>
                  
                  <div class="supported-formats">
                    <div class="format-title">
                      <mat-icon>info</mat-icon>
                      <span>Formatos soportados</span>
                    </div>
                    <div class="format-chips">
                      <span class="format-chip excel">
                        <mat-icon>description</mat-icon>
                        .xlsx
                      </span>
                      <span class="format-chip excel">
                        <mat-icon>description</mat-icon>
                        .xls
                      </span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="file-selected">
                  <div class="file-icon-container">
                    <mat-icon class="file-icon" [style.font-size.px]="48">description</mat-icon>
                    <div class="success-badge">
                      <mat-icon [style.font-size.px]="16">check</mat-icon>
                    </div>
                  </div>
                  <div class="file-info">
                    <h4>{{ archivoSeleccionado()?.name }}</h4>
                    <div class="file-details">
                      <span class="file-size">{{ formatFileSize(archivoSeleccionado()?.size || 0) }}</span>
                      <span class="file-type">Excel</span>
                    </div>
                    <div class="file-status">
                      <mat-icon [style.font-size.px]="16">check_circle</mat-icon>
                      <span>Archivo listo para procesar</span>
                    </div>
                  </div>
                  <button mat-icon-button class="remove-file-btn" (click)="removeFile($event)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
              
              <input #fileInput type="file" hidden accept=".xlsx,.xls" (change)="onFileSelected($event)">
            </div>

            <!-- Botones de acción -->
            <div class="action-buttons">
              <div class="secondary-actions">
                <button mat-stroked-button class="download-template-btn" (click)="descargarPlantilla()">
                  <mat-icon>download</mat-icon>
                  Descargar Plantilla
                </button>
              </div>
              
              <div class="primary-actions">
                <button mat-raised-button 
                        color="primary" 
                        class="process-btn"
                        [disabled]="!archivoSeleccionado() || procesando()"
                        (click)="procesarArchivo()">
                  @if (procesando()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>Procesando...</span>
                  } @else {
                    <mat-icon>upload</mat-icon>
                    <span>Procesar Archivo</span>
                  }
                </button>
              </div>
            </div>

            <!-- Resultado -->
            @if (resultado()) {
              <div class="results-section">
                <h3>Resultado del Procesamiento</h3>
                <div class="summary-cards">
                  <div class="summary-card total">
                    <mat-icon>assessment</mat-icon>
                    <div class="card-content">
                      <h3>{{ resultado()?.total_procesados || 0 }}</h3>
                      <p>Total Procesados</p>
                    </div>
                  </div>
                  <div class="summary-card valid">
                    <mat-icon>check_circle</mat-icon>
                    <div class="card-content">
                      <h3>{{ resultado()?.exitosos || 0 }}</h3>
                      <p>Exitosos</p>
                    </div>
                  </div>
                  <div class="summary-card invalid">
                    <mat-icon>error</mat-icon>
                    <div class="card-content">
                      <h3>{{ resultado()?.errores || 0 }}</h3>
                      <p>Errores</p>
                    </div>
                  </div>
                </div>

                @if (resultado()?.vehiculos_creados && resultado()!.vehiculos_creados.length > 0) {
                  <div class="vehicles-section">
                    <h4>
                      <mat-icon>add_circle</mat-icon>
                      Vehículos Creados ({{ resultado()!.vehiculos_creados.length }})
                    </h4>
                    <div class="vehicles-grid">
                      @for (placa of resultado()!.vehiculos_creados; track placa) {
                        <span class="vehicle-chip created">
                          <mat-icon [style.font-size.px]="16">check</mat-icon>
                          {{ placa }}
                        </span>
                      }
                    </div>
                  </div>
                }

                @if (resultado()?.vehiculos_actualizados && resultado()!.vehiculos_actualizados.length > 0) {
                  <div class="vehicles-section">
                    <h4>
                      <mat-icon>update</mat-icon>
                      Vehículos Actualizados ({{ resultado()!.vehiculos_actualizados.length }})
                    </h4>
                    <div class="vehicles-grid">
                      @for (placa of resultado()!.vehiculos_actualizados; track placa) {
                        <span class="vehicle-chip updated">
                          <mat-icon [style.font-size.px]="16">sync</mat-icon>
                          {{ placa }}
                        </span>
                      }
                    </div>
                  </div>
                }

                @if (resultado()?.errores_detalle && resultado()!.errores_detalle.length > 0) {
                  <div class="error-details-section">
                    <h4>
                      <mat-icon>warning</mat-icon>
                      Errores Encontrados ({{ resultado()!.errores_detalle.length }})
                    </h4>
                    <div class="error-list">
                      @for (error of resultado()!.errores_detalle; track $index) {
                        <div class="error-item-detail">
                          <div class="error-header">
                            <div class="error-info">
                              <span class="error-row">Fila {{ error.fila }}</span>
                              <span class="error-placa">{{ error.placa || 'N/A' }}</span>
                            </div>
                          </div>
                          <div class="error-messages">
                            <div class="error-message">
                              <mat-icon [style.font-size.px]="16">error</mat-icon>
                              <span>{{ error.error || error.mensaje }}</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .carga-masiva-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .header {
      margin-bottom: 32px;
      padding: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      color: white;
      box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .header-text h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .main-card {
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .upload-section {
      padding: 32px;
    }

    .upload-area {
      border: 3px dashed #e0e7ff;
      border-radius: 24px;
      padding: 64px 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 32px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .upload-area:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
      transform: translateY(-2px);
    }

    .upload-area.dragover {
      border-color: #667eea;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      transform: scale(1.02);
    }

    .upload-area.has-file {
      border-color: #10b981;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .upload-icon {
      color: #667eea;
    }

    .upload-placeholder h3 {
      margin: 24px 0 12px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .upload-placeholder p {
      margin: 0 0 24px 0;
      color: #64748b;
      font-size: 16px;
    }

    .supported-formats {
      margin: 32px 0;
      padding: 24px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 16px;
    }

    .format-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #475569;
      font-weight: 600;
    }

    .format-chips {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .format-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .file-selected {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 3px solid #10b981;
      border-radius: 20px;
    }

    .file-icon-container {
      position: relative;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 16px;
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
    }

    .file-info {
      flex: 1;
    }

    .file-info h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      color: #065f46;
    }

    .file-details {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }

    .file-size, .file-type {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.8);
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
      font-weight: 600;
    }

    .remove-file-btn {
      background: rgba(255, 255, 255, 0.9);
      color: #64748b;
    }

    .remove-file-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .action-buttons {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 32px;
    }

    .download-template-btn {
      border-color: #e2e8f0;
      color: #475569;
      font-weight: 600;
    }

    .download-template-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    .process-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    }

    .process-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
    }

    .results-section {
      margin-top: 32px;
      padding: 32px;
      background: #f8fafc;
      border-radius: 16px;
    }

    .results-section h3 {
      margin: 0 0 24px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
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
      color: white;
    }

    .summary-card.total {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }

    .summary-card.valid {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .summary-card.invalid {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .card-content h3 {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 800;
    }

    .card-content p {
      margin: 0;
      opacity: 0.9;
      font-weight: 600;
    }

    .vehicles-section {
      margin-bottom: 32px;
    }

    .vehicles-section h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
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
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .vehicle-chip.created {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      color: #065f46;
      border: 2px solid #10b981;
    }

    .vehicle-chip.updated {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      color: #1e40af;
      border: 2px solid #3b82f6;
    }

    .error-details-section {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-radius: 16px;
      padding: 24px;
      border: 2px solid #fecaca;
    }

    .error-details-section h4 {
      margin: 0 0 16px 0;
      color: #dc2626;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .error-item-detail {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border-left: 4px solid #ef4444;
    }

    .error-header {
      margin-bottom: 8px;
    }

    .error-info {
      display: flex;
      gap: 12px;
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

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #dc2626;
    }

    @media (max-width: 768px) {
      .carga-masiva-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .action-buttons {
        flex-direction: column;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CargaMasivaVehiculosComponent {
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private snackBar = inject(MatSnackBar);

  // Signals
  archivoSeleccionado = signal<File | null>(null);
  isDragging = signal(false);
  procesando = signal(false);
  resultado = signal<ResultadoCarga | null>(null);

  volver(): void {
    this.router.navigate(['/vehiculos']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
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
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      this.snackBar.open('Por favor selecciona un archivo Excel válido (.xlsx o .xls)', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo es demasiado grande. Máximo 10MB', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    this.archivoSeleccionado.set(file);
    this.resultado.set(null);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado.set(null);
    this.resultado.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  descargarPlantilla(): void {
    this.vehiculoService.descargarPlantillaExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_vehiculos_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Plantilla descargada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error descargando plantilla:', error);
        this.snackBar.open('Error al descargar la plantilla', 'Cerrar', { duration: 3000 });
      }
    });
  }

  procesarArchivo(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) {
      this.snackBar.open('Por favor selecciona un archivo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.procesando.set(true);
    this.resultado.set(null);

    this.vehiculoService.cargaMasivaVehiculos(archivo).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.procesando.set(false);
        
        const mensaje = `Procesamiento completado: ${resultado.exitosos} exitosos, ${resultado.errores} errores`;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
      },
      error: (error) => {
        console.error('Error procesando archivo:', error);
        this.procesando.set(false);
        this.snackBar.open('Error al procesar el archivo', 'Cerrar', { duration: 5000 });
      }
    });
  }
}
