import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { LocalidadService } from '../../services/localidad.service';

interface ImportacionResultado {
  procesados: number;
  importados: number;
  actualizados: number;
  errores: string[];
  tiempo: number;
}

@Component({
  selector: 'app-importar-centros-poblados-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatTabsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="importar-centros-poblados-modal">
      <div mat-dialog-title class="modal-header">
        <mat-icon class="header-icon">location_city</mat-icon>
        <h2>Importar Centros Poblados de Puno</h2>
      </div>

      <mat-dialog-content class="modal-content">
        <mat-tab-group [(selectedIndex)]="tabSeleccionado">
          
          <!-- Tab 1: Fuentes Oficiales -->
          <mat-tab label="Fuentes Oficiales">
            <div class="tab-content">
              <p class="descripcion">
                Importa centros poblados desde fuentes oficiales del Estado Peruano
              </p>

              <div class="fuentes-grid">
                <!-- INEI -->
                <mat-card class="fuente-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>analytics</mat-icon>
                      INEI
                    </mat-card-title>
                    <mat-card-subtitle>Instituto Nacional de Estadística</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p>Base de datos oficial de centros poblados con información censal actualizada.</p>
                    <div class="stats">
                      <span class="stat-item">
                        <mat-icon>location_on</mat-icon>
                        ~2,500 centros poblados
                      </span>
                      <span class="stat-item">
                        <mat-icon>update</mat-icon>
                        Actualizado 2023
                      </span>
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <button 
                      mat-raised-button 
                      color="primary"
                      [disabled]="importandoINEI"
                      (click)="importarDesdeINEI()">
                      @if (importandoINEI) {
                        <mat-spinner diameter="20"></mat-spinner>
                        Importando...
                      } @else {
                        <mat-icon>download</mat-icon>
                        Importar desde INEI
                      }
                    </button>
                  </mat-card-actions>
                </mat-card>

                <!-- RENIEC -->
                <mat-card class="fuente-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>badge</mat-icon>
                      RENIEC
                    </mat-card-title>
                    <mat-card-subtitle>Registro Nacional de Identificación</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p>Ubigeos completos con centros poblados para documentos de identidad.</p>
                    <div class="stats">
                      <span class="stat-item">
                        <mat-icon>location_on</mat-icon>
                        ~3,200 localidades
                      </span>
                      <span class="stat-item">
                        <mat-icon>verified</mat-icon>
                        Oficial DNI
                      </span>
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <button 
                      mat-raised-button 
                      color="accent"
                      [disabled]="importandoRENIEC"
                      (click)="importarDesdeRENIEC()">
                      @if (importandoRENIEC) {
                        <mat-spinner diameter="20"></mat-spinner>
                        Importando...
                      } @else {
                        <mat-icon>download</mat-icon>
                        Importar desde RENIEC
                      }
                    </button>
                  </mat-card-actions>
                </mat-card>

                <!-- Municipalidad -->
                <mat-card class="fuente-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>account_balance</mat-icon>
                      Municipalidad
                    </mat-card-title>
                    <mat-card-subtitle>Municipalidad Provincial de Puno</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p>Base de datos local con coordenadas GPS y información detallada.</p>
                    <div class="stats">
                      <span class="stat-item">
                        <mat-icon>gps_fixed</mat-icon>
                        Con coordenadas
                      </span>
                      <span class="stat-item">
                        <mat-icon>local_government</mat-icon>
                        Datos locales
                      </span>
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <button 
                      mat-raised-button 
                      color="warn"
                      [disabled]="importandoMunicipalidad"
                      (click)="importarDesdeMunicipalidad()">
                      @if (importandoMunicipalidad) {
                        <mat-spinner diameter="20"></mat-spinner>
                        Importando...
                      } @else {
                        <mat-icon>download</mat-icon>
                        Importar Local
                      }
                    </button>
                  </mat-card-actions>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Archivo Manual -->
          <mat-tab label="Archivo Manual">
            <div class="tab-content">
              <p class="descripcion">
                Sube un archivo CSV o Excel con centros poblados
              </p>

              <div class="upload-section">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Fuente del archivo</mat-label>
                  <mat-select [(value)]="fuenteArchivo">
                    <mat-option value="INEI">INEI - Instituto Nacional de Estadística</mat-option>
                    <mat-option value="RENIEC">RENIEC - Registro Nacional</mat-option>
                    <mat-option value="MUNICIPALIDAD">Municipalidad Provincial</mat-option>
                    <mat-option value="PERSONALIZADO">Personalizado</mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="file-upload-area" 
                     [class.dragover]="dragOver"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)">
                  
                  @if (!archivoSeleccionado) {
                    <div class="upload-placeholder">
                      <mat-icon class="upload-icon">cloud_upload</mat-icon>
                      <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                      <p class="upload-hint">Formatos soportados: CSV, XLSX, XLS</p>
                      <button mat-raised-button color="primary" (click)="fileInput.click()">
                        <mat-icon>folder_open</mat-icon>
                        Seleccionar Archivo
                      </button>
                    </div>
                  } @else {
                    <div class="file-selected">
                      <mat-icon class="file-icon">description</mat-icon>
                      <div class="file-info">
                        <p class="file-name">{{ archivoSeleccionado.name }}</p>
                        <p class="file-size">{{ formatearTamanoArchivo(archivoSeleccionado.size) }}</p>
                      </div>
                      <button mat-icon-button color="warn" (click)="removerArchivo()">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }

                  <input #fileInput
                         type="file"
                         accept=".csv,.xlsx,.xls"
                         style="display: none"
                         (change)="onFileSelected($event)">
                </div>

                @if (archivoSeleccionado) {
                  <div class="upload-actions">
                    <button 
                      mat-raised-button 
                      color="primary"
                      [disabled]="subiendoArchivo"
                      (click)="subirArchivo()">
                      @if (subiendoArchivo) {
                        <mat-spinner diameter="20"></mat-spinner>
                        Procesando...
                      } @else {
                        <mat-icon>upload</mat-icon>
                        Importar Archivo
                      }
                    </button>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Estadísticas -->
          <mat-tab label="Estadísticas">
            <div class="tab-content">
              <p class="descripcion">
                Estado actual de centros poblados en el sistema
              </p>

              @if (cargandoEstadisticas) {
                <div class="loading-stats">
                  <mat-spinner></mat-spinner>
                  <p>Cargando estadísticas...</p>
                </div>
              } @else {
                <div class="stats-grid">
                  <mat-card class="stat-card">
                    <mat-card-content>
                      <div class="stat-number">{{ estadisticas.totalCentrosPoblados }}</div>
                      <div class="stat-label">Total Centros Poblados</div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="stat-card">
                    <mat-card-content>
                      <div class="stat-number">{{ estadisticas.conCoordenadas }}</div>
                      <div class="stat-label">Con Coordenadas GPS</div>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="stat-card">
                    <mat-card-content>
                      <div class="stat-number">{{ estadisticas.sinCoordenadas }}</div>
                      <div class="stat-label">Sin Coordenadas</div>
                    </mat-card-content>
                  </mat-card>
                </div>

                @if (estadisticas.porDistrito.length > 0) {
                  <mat-card class="distrito-stats">
                    <mat-card-header>
                      <mat-card-title>Centros Poblados por Distrito</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="distrito-list">
                        @for (item of estadisticas.porDistrito; track item.distrito) {
                          <div class="distrito-item">
                            <span class="distrito-nombre">{{ item.distrito }}</span>
                            <mat-chip class="distrito-cantidad">{{ item.cantidad }}</mat-chip>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              }

              <div class="actions-section">
                <button mat-raised-button color="accent" (click)="cargarEstadisticas()">
                  <mat-icon>refresh</mat-icon>
                  Actualizar Estadísticas
                </button>
                
                <button mat-raised-button color="warn" (click)="validarYLimpiar()">
                  <mat-icon>cleaning_services</mat-icon>
                  Validar y Limpiar Datos
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Progreso de importación -->
        @if (mostrarProgreso) {
          <div class="progress-section">
            <mat-divider></mat-divider>
            <div class="progress-content">
              <h3>{{ tituloProgreso }}</h3>
              <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              <p class="progress-text">{{ textoProgreso }}</p>
            </div>
          </div>
        }

        <!-- Resultados -->
        @if (ultimoResultado) {
          <div class="results-section">
            <mat-divider></mat-divider>
            <mat-card class="results-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon color="primary">check_circle</mat-icon>
                  Importación Completada
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="results-grid">
                  <div class="result-item">
                    <span class="result-label">Procesados:</span>
                    <span class="result-value">{{ ultimoResultado.procesados }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Importados:</span>
                    <span class="result-value success">{{ ultimoResultado.importados }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Actualizados:</span>
                    <span class="result-value info">{{ ultimoResultado.actualizados }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Tiempo:</span>
                    <span class="result-value">{{ ultimoResultado.tiempo }}s</span>
                  </div>
                </div>

                @if (ultimoResultado.errores.length > 0) {
                  <div class="errors-section">
                    <h4>Errores encontrados:</h4>
                    <div class="error-list">
                      @for (error of ultimoResultado.errores; track error) {
                        <div class="error-item">
                          <mat-icon color="warn">warning</mat-icon>
                          <span>{{ error }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()">Cerrar</button>
        <button mat-raised-button color="primary" (click)="cerrarYActualizar()" [disabled]="!ultimoResultado">
          <mat-icon>refresh</mat-icon>
          Cerrar y Actualizar Lista
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./importar-centros-poblados-modal.component.scss']
})
export class ImportarCentrosPobladosModalComponent implements OnInit {
  tabSeleccionado = 0;
  
  // Estados de importación
  importandoINEI = false;
  importandoRENIEC = false;
  importandoMunicipalidad = false;
  subiendoArchivo = false;
  cargandoEstadisticas = false;
  
  // Archivo manual
  archivoSeleccionado: File | null = null;
  fuenteArchivo = 'INEI';
  dragOver = false;
  
  // Progreso
  mostrarProgreso = false;
  tituloProgreso = '';
  textoProgreso = '';
  
  // Resultados
  ultimoResultado: ImportacionResultado | null = null;
  
  // Estadísticas
  estadisticas = {
    totalCentrosPoblados: 0,
    porDistrito: [] as { distrito: string; cantidad: number }[],
    porTipo: [] as { tipo: string; cantidad: number }[],
    conCoordenadas: 0,
    sinCoordenadas: 0
  };

  constructor(
    private dialogRef: MatDialogRef<ImportarCentrosPobladosModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.cargandoEstadisticas = true;
    try {
      this.estadisticas = await this.localidadService.obtenerEstadisticasCentrosPoblados();
    } catch (error) {
      console.error('Error cargando estadísticas::', error);
      this.snackBar.open('Error cargando estadísticas', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargandoEstadisticas = false;
    }
  }

  async importarDesdeINEI() {
    this.importandoINEI = true;
    this.mostrarProgreso = true;
    this.tituloProgreso = 'Importando desde INEI';
    this.textoProgreso = 'Conectando con la base de datos del INEI...';
    
    try {
      const inicio = Date.now();
      const resultado = await this.localidadService.importarCentrosPobladosINEI();
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      
      this.ultimoResultado = {
        procesados: resultado.procesados || 0,
        importados: resultado.importados || 0,
        actualizados: resultado.actualizados || 0,
        errores: resultado.errores || [],
        tiempo
      };
      
      this.snackBar.open('Importación desde INEI completada', 'Cerrar', { duration: 3000 });
      await this.cargarEstadisticas();
      
    } catch (error) {
      console.error('Error importando desde INEI::', error);
      this.snackBar.open('Error importando desde INEI', 'Cerrar', { duration: 4000 });
    } finally {
      this.importandoINEI = false;
      this.mostrarProgreso = false;
    }
  }

  async importarDesdeRENIEC() {
    this.importandoRENIEC = true;
    this.mostrarProgreso = true;
    this.tituloProgreso = 'Importando desde RENIEC';
    this.textoProgreso = 'Conectando con la base de datos de RENIEC...';
    
    try {
      const inicio = Date.now();
      const resultado = await this.localidadService.importarCentrosPobladosRENIEC();
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      
      this.ultimoResultado = {
        procesados: resultado.procesados || 0,
        importados: resultado.importados || 0,
        actualizados: resultado.actualizados || 0,
        errores: resultado.errores || [],
        tiempo
      };
      
      this.snackBar.open('Importación desde RENIEC completada', 'Cerrar', { duration: 3000 });
      await this.cargarEstadisticas();
      
    } catch (error) {
      console.error('Error importando desde RENIEC::', error);
      this.snackBar.open('Error importando desde RENIEC', 'Cerrar', { duration: 4000 });
    } finally {
      this.importandoRENIEC = false;
      this.mostrarProgreso = false;
    }
  }

  async importarDesdeMunicipalidad() {
    this.importandoMunicipalidad = true;
    this.mostrarProgreso = true;
    this.tituloProgreso = 'Importando desde Municipalidad';
    this.textoProgreso = 'Conectando con la base de datos municipal...';
    
    try {
      const inicio = Date.now();
      const resultado = await this.localidadService.sincronizarConBaseDatosOficial('MUNICIPALIDAD');
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      
      this.ultimoResultado = {
        procesados: resultado.procesados || 0,
        importados: resultado.importados || 0,
        actualizados: resultado.actualizados || 0,
        errores: resultado.errores || [],
        tiempo
      };
      
      this.snackBar.open('Importación municipal completada', 'Cerrar', { duration: 3000 });
      await this.cargarEstadisticas();
      
    } catch (error) {
      console.error('Error importando desde municipalidad::', error);
      this.snackBar.open('Error importando desde municipalidad', 'Cerrar', { duration: 4000 });
    } finally {
      this.importandoMunicipalidad = false;
      this.mostrarProgreso = false;
    }
  }

  // Manejo de archivos
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivo(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  procesarArchivo(file: File) {
    const extensionesPermitidas = ['.csv', '.xlsx', '.xls'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!extensionesPermitidas.includes(extension)) {
      this.snackBar.open('Formato de archivo no soportado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.snackBar.open('El archivo es demasiado grande (máximo 10MB)', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.archivoSeleccionado = file;
  }

  removerArchivo() {
    this.archivoSeleccionado = null;
  }

  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async subirArchivo() {
    if (!this.archivoSeleccionado) return;
    
    this.subiendoArchivo = true;
    this.mostrarProgreso = true;
    this.tituloProgreso = 'Procesando archivo';
    this.textoProgreso = 'Analizando y validando datos...';
    
    try {
      const inicio = Date.now();
      const resultado = await this.localidadService.importarCentrosPobladosArchivo(
        this.archivoSeleccionado, 
        this.fuenteArchivo
      );
      const tiempo = Math.round((Date.now() - inicio) / 1000);
      
      this.ultimoResultado = {
        procesados: resultado.procesados || 0,
        importados: resultado.importados || 0,
        actualizados: resultado.actualizados || 0,
        errores: resultado.errores || [],
        tiempo
      };
      
      this.snackBar.open('Archivo procesado exitosamente', 'Cerrar', { duration: 3000 });
      await this.cargarEstadisticas();
      
    } catch (error) {
      console.error('Error procesando archivo::', error);
      this.snackBar.open('Error procesando archivo', 'Cerrar', { duration: 4000 });
    } finally {
      this.subiendoArchivo = false;
      this.mostrarProgreso = false;
    }
  }

  async validarYLimpiar() {
    this.mostrarProgreso = true;
    this.tituloProgreso = 'Validando y limpiando datos';
    this.textoProgreso = 'Verificando integridad de los datos...';
    
    try {
      const resultado = await this.localidadService.validarYLimpiarCentrosPoblados();
      
      this.snackBar.open(
        `Validación completada: ${resultado.procesados} procesados, ${resultado.corregidos} corregidos`, 
        'Cerrar', 
        { duration: 4000 }
      );
      
      await this.cargarEstadisticas();
      
    } catch (error) {
      console.error('Error validando datos::', error);
      this.snackBar.open('Error validando datos', 'Cerrar', { duration: 4000 });
    } finally {
      this.mostrarProgreso = false;
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }

  cerrarYActualizar() {
    this.dialogRef.close(true);
  }
}