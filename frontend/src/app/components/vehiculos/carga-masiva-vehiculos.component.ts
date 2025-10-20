import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';

interface VehiculoValidacion {
  fila: number;
  placa: string;
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

interface CargaMasivaResponse {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];
  errores_detalle: {
    fila: number;
    placa: string;
    errores: string[];
  }[];
}

@Component({
  selector: 'app-carga-masiva-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="carga-masiva-container">
      <div class="header">
        <h2>Carga Masiva de Vehículos</h2>
        <p class="subtitle">Importa múltiples vehículos desde un archivo Excel</p>
      </div>

      <!-- Paso 1: Descargar plantilla -->
      <div class="step-card" [class.completed]="plantillaDescargada">
        <div class="step-header">
          <span class="step-number">1</span>
          <h3>Descargar Plantilla Excel</h3>
        </div>
        <div class="step-content">
          <p>Descarga la plantilla con el formato correcto para cargar vehículos.</p>
          <button 
            class="btn btn-outline-primary"
            (click)="descargarPlantilla()"
            [disabled]="descargandoPlantilla">
            <i class="fas fa-download" *ngIf="!descargandoPlantilla"></i>
            <i class="fas fa-spinner fa-spin" *ngIf="descargandoPlantilla"></i>
            {{ descargandoPlantilla ? 'Descargando...' : 'Descargar Plantilla' }}
          </button>
          <div class="success-message" *ngIf="plantillaDescargada">
            <i class="fas fa-check-circle"></i>
            Plantilla descargada correctamente
          </div>
        </div>
      </div>

      <!-- Paso 2: Subir archivo -->
      <div class="step-card" [class.completed]="archivoSubido" [class.disabled]="!plantillaDescargada">
        <div class="step-header">
          <span class="step-number">2</span>
          <h3>Subir Archivo Excel</h3>
        </div>
        <div class="step-content">
          <p>Sube tu archivo Excel completado con los datos de los vehículos.</p>
          
          <div class="file-upload-area" 
               [class.dragover]="isDragOver"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <input #fileInput 
                   type="file" 
                   accept=".xlsx,.xls" 
                   (change)="onFileSelected($event)"
                   style="display: none;">
            
            <div class="upload-content" *ngIf="!archivoSeleccionado">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Arrastra tu archivo Excel aquí o haz clic para seleccionar</p>
              <small>Formatos soportados: .xlsx, .xls</small>
            </div>
            
            <div class="file-info" *ngIf="archivoSeleccionado">
              <i class="fas fa-file-excel"></i>
              <span>{{ archivoSeleccionado.name }}</span>
              <button class="btn-remove" (click)="removerArchivo($event)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="file-actions" *ngIf="archivoSeleccionado">
            <button 
              class="btn btn-secondary"
              (click)="validarArchivo()"
              [disabled]="validandoArchivo">
              <i class="fas fa-check" *ngIf="!validandoArchivo"></i>
              <i class="fas fa-spinner fa-spin" *ngIf="validandoArchivo"></i>
              {{ validandoArchivo ? 'Validando...' : 'Validar Archivo' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Paso 3: Validación -->
      <div class="step-card" 
           [class.completed]="validacionCompleta && validacionExitosa" 
           [class.error]="validacionCompleta && !validacionExitosa"
           [class.disabled]="!archivoSeleccionado"
           *ngIf="validacionCompleta">
        <div class="step-header">
          <span class="step-number">3</span>
          <h3>Resultados de Validación</h3>
        </div>
        <div class="step-content">
          
          <!-- Resumen de validación -->
          <div class="validation-summary">
            <div class="summary-item success" *ngIf="validacionesExitosas > 0">
              <i class="fas fa-check-circle"></i>
              <span>{{ validacionesExitosas }} registros válidos</span>
            </div>
            <div class="summary-item error" *ngIf="validacionesConError > 0">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ validacionesConError }} registros con errores</span>
            </div>
            <div class="summary-item warning" *ngIf="validacionesConAdvertencia > 0">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ validacionesConAdvertencia }} registros con advertencias</span>
            </div>
          </div>

          <!-- Lista de errores -->
          <div class="validation-details" *ngIf="validacionesConError > 0">
            <h4>Errores encontrados:</h4>
            <div class="error-list">
              <div class="error-item" *ngFor="let validacion of validacionesConErrores">
                <div class="error-header">
                  <strong>Fila {{ validacion.fila }} - Placa: {{ validacion.placa }}</strong>
                </div>
                <ul class="error-messages">
                  <li *ngFor="let error of validacion.errores">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Advertencias -->
          <div class="validation-warnings" *ngIf="validacionesConAdvertencia > 0">
            <h4>Advertencias:</h4>
            <div class="warning-list">
              <div class="warning-item" *ngFor="let validacion of validacionesConAdvertencias">
                <div class="warning-header">
                  <strong>Fila {{ validacion.fila }} - Placa: {{ validacion.placa }}</strong>
                </div>
                <ul class="warning-messages">
                  <li *ngFor="let advertencia of validacion.advertencias">{{ advertencia }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Paso 4: Procesar -->
      <div class="step-card" 
           [class.completed]="procesamientoCompleto && procesamientoExitoso"
           [class.error]="procesamientoCompleto && !procesamientoExitoso"
           [class.disabled]="!validacionExitosa">
        <div class="step-header">
          <span class="step-number">4</span>
          <h3>Procesar Carga Masiva</h3>
        </div>
        <div class="step-content">
          <p *ngIf="!procesamientoCompleto">
            Una vez validado el archivo, procede con la carga masiva de vehículos.
          </p>
          
          <button 
            class="btn btn-primary"
            (click)="procesarCargaMasiva()"
            [disabled]="!validacionExitosa || procesandoArchivo"
            *ngIf="!procesamientoCompleto">
            <i class="fas fa-upload" *ngIf="!procesandoArchivo"></i>
            <i class="fas fa-spinner fa-spin" *ngIf="procesandoArchivo"></i>
            {{ procesandoArchivo ? 'Procesando...' : 'Procesar Carga Masiva' }}
          </button>

          <!-- Resultados del procesamiento -->
          <div class="processing-results" *ngIf="procesamientoCompleto">
            <div class="results-summary">
              <div class="result-item success">
                <i class="fas fa-check-circle"></i>
                <div>
                  <strong>{{ resultadoCarga?.exitosos || 0 }}</strong>
                  <span>vehículos creados exitosamente</span>
                </div>
              </div>
              <div class="result-item error" *ngIf="(resultadoCarga?.errores || 0) > 0">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                  <strong>{{ resultadoCarga?.errores || 0 }}</strong>
                  <span>errores en el procesamiento</span>
                </div>
              </div>
            </div>

            <!-- Errores de procesamiento -->
            <div class="processing-errors" *ngIf="resultadoCarga?.errores_detalle?.length">
              <h4>Errores de procesamiento:</h4>
              <div class="error-list">
                <div class="error-item" *ngFor="let error of resultadoCarga?.errores_detalle || []">
                  <div class="error-header">
                    <strong>Fila {{ error.fila }} - Placa: {{ error.placa }}</strong>
                  </div>
                  <ul class="error-messages">
                    <li *ngFor="let mensaje of error.errores">{{ mensaje }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Acciones finales -->
            <div class="final-actions">
              <button class="btn btn-success" (click)="reiniciarProceso()">
                <i class="fas fa-redo"></i>
                Nueva Carga Masiva
              </button>
              <button class="btn btn-outline-primary" (click)="verVehiculos()">
                <i class="fas fa-list"></i>
                Ver Vehículos
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensajes de error generales -->
      <div class="alert alert-danger" *ngIf="errorGeneral">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorGeneral }}
      </div>
    </div>
  `,
  styleUrls: ['./carga-masiva-vehiculos.component.scss']
})
export class CargaMasivaVehiculosComponent implements OnInit {
  
  // Estado del proceso
  plantillaDescargada = false;
  archivoSubido = false;
  validacionCompleta = false;
  validacionExitosa = false;
  procesamientoCompleto = false;
  procesamientoExitoso = false;

  // Estados de carga
  descargandoPlantilla = false;
  validandoArchivo = false;
  procesandoArchivo = false;

  // Archivo seleccionado
  archivoSeleccionado: File | null = null;
  isDragOver = false;

  // Validaciones
  validaciones: VehiculoValidacion[] = [];
  validacionesExitosas = 0;
  validacionesConError = 0;
  validacionesConAdvertencia = 0;

  // Resultados
  resultadoCarga: CargaMasivaResponse | null = null;

  // Error general
  errorGeneral = '';

  constructor(private vehiculoService: VehiculoService) {}

  ngOnInit() {
    // Inicialización si es necesaria
  }

  async descargarPlantilla() {
    this.descargandoPlantilla = true;
    this.errorGeneral = '';

    try {
      const response = await this.vehiculoService.descargarPlantillaExcel();
      
      // Crear enlace de descarga
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_vehiculos.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);

      this.plantillaDescargada = true;
    } catch (error) {
      this.errorGeneral = 'Error al descargar la plantilla. Inténtalo de nuevo.';
      console.error('Error descargando plantilla:', error);
    } finally {
      this.descargandoPlantilla = false;
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

  procesarArchivoSeleccionado(file: File) {
    // Validar tipo de archivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.errorGeneral = 'Por favor selecciona un archivo Excel (.xlsx o .xls)';
      return;
    }

    this.archivoSeleccionado = file;
    this.archivoSubido = true;
    this.errorGeneral = '';
    
    // Resetear validaciones anteriores
    this.validacionCompleta = false;
    this.validacionExitosa = false;
    this.procesamientoCompleto = false;
  }

  removerArchivo(event: Event) {
    event.stopPropagation();
    this.archivoSeleccionado = null;
    this.archivoSubido = false;
    this.validacionCompleta = false;
    this.validacionExitosa = false;
    this.procesamientoCompleto = false;
  }

  async validarArchivo() {
    if (!this.archivoSeleccionado) return;

    this.validandoArchivo = true;
    this.errorGeneral = '';

    try {
      this.validaciones = await this.vehiculoService.validarExcel(this.archivoSeleccionado);
      
      // Calcular estadísticas
      this.validacionesExitosas = this.validaciones.filter(v => v.valido).length;
      this.validacionesConError = this.validaciones.filter(v => !v.valido).length;
      this.validacionesConAdvertencia = this.validaciones.filter(v => v.advertencias.length > 0).length;
      
      this.validacionCompleta = true;
      this.validacionExitosa = this.validacionesConError === 0;
      
    } catch (error) {
      this.errorGeneral = 'Error al validar el archivo. Verifica el formato y contenido.';
      console.error('Error validando archivo:', error);
    } finally {
      this.validandoArchivo = false;
    }
  }

  async procesarCargaMasiva() {
    if (!this.archivoSeleccionado || !this.validacionExitosa) return;

    this.procesandoArchivo = true;
    this.errorGeneral = '';

    try {
      this.resultadoCarga = await this.vehiculoService.cargaMasivaVehiculos(this.archivoSeleccionado);
      
      if (this.resultadoCarga) {
        this.procesamientoCompleto = true;
        this.procesamientoExitoso = (this.resultadoCarga.exitosos || 0) > 0;
      } else {
        throw new Error('No se recibió respuesta del servidor');
      }
      
    } catch (error) {
      this.errorGeneral = 'Error al procesar la carga masiva. Inténtalo de nuevo.';
      console.error('Error procesando carga masiva:', error);
    } finally {
      this.procesandoArchivo = false;
    }
  }

  reiniciarProceso() {
    this.plantillaDescargada = false;
    this.archivoSubido = false;
    this.validacionCompleta = false;
    this.validacionExitosa = false;
    this.procesamientoCompleto = false;
    this.procesamientoExitoso = false;
    this.archivoSeleccionado = null;
    this.validaciones = [];
    this.resultadoCarga = null;
    this.errorGeneral = '';
  }

  verVehiculos() {
    // Navegar a la lista de vehículos
    // Implementar navegación según tu router
    console.log('Navegar a lista de vehículos');
  }

  get validacionesConErrores(): VehiculoValidacion[] {
    return this.validaciones.filter(v => !v.valido);
  }

  get validacionesConAdvertencias(): VehiculoValidacion[] {
    return this.validaciones.filter(v => v.advertencias.length > 0);
  }
}