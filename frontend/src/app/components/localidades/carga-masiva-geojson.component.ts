import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LocalidadService } from '../../services/localidad.service';
import { TipoLocalidad } from '../../models/localidad.model';

interface GeoJSONFeature {
  type: string;
  id: number;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    NOMB_CCPP: string;
    UBIGEO: string;
    NOMB_DEPAR: string;
    NOMB_PROVI: string;
    NOMB_DISTR: string;
    COD_CCPP?: string;
    TIPO?: string; // Rural/Urbano
    POBTOTAL?: number;
  };
}

interface ValidacionPrevia {
  totalFeatures: number;
  conCoordenadas: number;
  sinCoordenadas: number;
  conUbigeo: number;
  sinUbigeo: number;
  porProvincia: { [key: string]: number };
  porDistrito: { [key: string]: number };
  ejemplos: Array<{
    nombre: string;
    tipo?: string;
    provincia: string;
    distrito: string;
    ubigeo?: string;
    coordenadas?: boolean;
  }>;
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

interface ResultadoImportacion {
  total: number;
  importados: number;
  actualizados: number;
  omitidos: number;
  errores: number;
  detallesErrores?: string[];
  duplicados_detectados?: Array<{
    nombre: string;
    ubigeo: string;
    tipo: string;
    departamento: string;
    provincia: string;
    distrito: string;
    razon: string;
    accion: string;
  }>;
}

@Component({
  selector: 'app-carga-masiva-geojson',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatChipsModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTabsModule
  ],
  template: `
    <div class="carga-masiva-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>upload_file</mat-icon>
          Carga Masiva desde GeoJSON
        </h2>
        <button mat-icon-button (click)="cerrar()" [disabled]="cargando()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        @if (!iniciado() && !validando() && !validacionCompleta()) {
          <!-- Paso 1: Selección de modo -->
          <div class="paso-inicial">
            <mat-tab-group>
              <!-- Tab 1: Archivos por defecto -->
              <mat-tab label="Archivos por Defecto">
                <div class="tab-content">
                  <div class="info-card">
                    <mat-icon class="info-icon">info</mat-icon>
                    <div class="info-content">
                      <h3>Importar Localidades Completas de Puno</h3>
                      <p>
                        Este proceso importará TODAS las localidades desde archivos GeoJSON con coordenadas:
                        <br>• <strong>13 Provincias</strong> desde puno-provincias-point.geojson
                        <br>• <strong>~110 Distritos</strong> desde puno-distritos-point.geojson
                        <br>• <strong>~9000 Centros Poblados</strong> desde puno-centrospoblados.geojson
                      </p>
                    </div>
                  </div>

                  <div class="archivos-disponibles-section">
                    <h4>Archivos Disponibles en Assets:</h4>
                    <div class="archivos-list">
                      @for (archivo of archivosDisponibles(); track archivo) {
                        <div class="archivo-item" (click)="cargarArchivoPreview(archivo)">
                          <mat-icon>description</mat-icon>
                          <span>{{ archivo }}</span>
                          @if (archivo.includes('point')) {
                            <mat-chip class="coordenadas-chip">📍 Con Coordenadas</mat-chip>
                          }
                        </div>
                      }
                    </div>
                    <div class="nota-centros-poblados">
                      <mat-icon>info</mat-icon>
                      <span><strong>Centros Poblados:</strong> El archivo puno-centrospoblados.geojson (~9000 registros) se importa directamente desde el backend. Selecciona la opción "Centros Poblados" en los tipos de localidades para incluirlo en la importación.</span>
                    </div>
                  </div>

                  @if (archivoSeleccionadoNombre()) {
                    <div class="archivo-preview-section">
                      <h4>Preview: {{ archivoSeleccionadoNombre() }}</h4>
                      
                      <div class="preview-columnas">
                        <strong>Columnas Disponibles ({{ archivoPreviewColumnas().length }}):</strong>
                        <div class="columnas-grid">
                          @for (columna of archivoPreviewColumnas(); track columna) {
                            <mat-chip class="columna-chip">{{ columna }}</mat-chip>
                          }
                        </div>
                      </div>

                      <div class="mapeo-columnas">
                        <strong>Seleccionar Columnas a Importar:</strong>
                        <div class="columnas-seleccion">
                          @for (columna of archivoPreviewColumnas(); track columna) {
                            <mat-checkbox 
                              [(ngModel)]="columnasSeleccionadas()[columna]"
                              class="columna-checkbox">
                              {{ columna }}
                            </mat-checkbox>
                          }
                        </div>
                      </div>

                      <div class="preview-tabla">
                        <table class="datos-table">
                          <thead>
                            <tr>
                              @for (columna of archivoPreviewColumnas(); track columna) {
                                <th>{{ columna }}</th>
                              }
                            </tr>
                          </thead>
                          <tbody>
                            @for (dato of archivoPreviewDatos(); track $index) {
                              <tr>
                                @for (columna of archivoPreviewColumnas(); track columna) {
                                  <td>
                                    @if (columna === 'coordenadas' && dato[columna]) {
                                      <span class="coordenadas-badge">📍 [{{ dato[columna][0] | number:'1.4-4' }}, {{ dato[columna][1] | number:'1.4-4' }}]</span>
                                    } @else if (isObject(dato[columna])) {
                                      <code>{{ dato[columna] | json }}</code>
                                    } @else {
                                      {{ dato[columna] || '-' }}
                                    }
                                  </td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>

              <!-- Tab 2: Archivo personalizado -->
              <mat-tab label="Archivo Personalizado">
                <div class="tab-content">
                  <div class="upload-card">
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                    <h3>Cargar archivo GeoJSON personalizado</h3>
                    <p>Selecciona un archivo .geojson desde tu computadora</p>
                    
                    <div class="file-input-wrapper">
                      <input 
                        type="file" 
                        #fileInput 
                        accept=".geojson,.json"
                        (change)="onFileSelected($event)"
                        style="display: none"
                      >
                      <button mat-raised-button color="primary" (click)="fileInput.click()">
                        <mat-icon>attach_file</mat-icon>
                        Seleccionar Archivo
                      </button>
                    </div>

                    @if (archivoSeleccionado()) {
                      <div class="archivo-info">
                        <mat-icon class="success-icon">check_circle</mat-icon>
                        <div>
                          <strong>{{ archivoSeleccionado()?.name }}</strong>
                          <span>{{ (archivoSeleccionado()?.size || 0) / 1024 | number:'1.0-0' }} KB</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>

            <div class="modo-seleccion">
              <h3>Selecciona el modo de importación:</h3>
              <mat-radio-group [(ngModel)]="modoImportacion" class="modo-radio-group">
                <mat-radio-button value="crear">
                  <div class="radio-content">
                    <strong>Crear solo nuevos</strong>
                    <span>Importa únicamente localidades que no existen</span>
                  </div>
                </mat-radio-button>
                
                <mat-radio-button value="actualizar">
                  <div class="radio-content">
                    <strong>Actualizar solo existentes</strong>
                    <span>Actualiza únicamente localidades ya registradas</span>
                  </div>
                </mat-radio-button>
                
                <mat-radio-button value="ambos">
                  <div class="radio-content">
                    <strong>Crear y actualizar (ambos)</strong>
                    <span>Crea nuevos y actualiza existentes (recomendado)</span>
                  </div>
                </mat-radio-button>
              </mat-radio-group>
            </div>

            <div class="tipos-seleccion">
              <h3>Selecciona qué tipos de localidades importar:</h3>
              <div class="checkbox-group">
                <mat-checkbox [(ngModel)]="importarProvincias" class="tipo-checkbox">
                  <div class="checkbox-content">
                    <strong>Provincias</strong>
                    <span>13 provincias de Puno</span>
                  </div>
                </mat-checkbox>
                
                <mat-checkbox [(ngModel)]="importarDistritos" class="tipo-checkbox">
                  <div class="checkbox-content">
                    <strong>Distritos</strong>
                    <span>~110 distritos de Puno</span>
                  </div>
                </mat-checkbox>
                
                <mat-checkbox [(ngModel)]="importarCentrosPoblados" class="tipo-checkbox">
                  <div class="checkbox-content">
                    <strong>Centros Poblados</strong>
                    <span>~9000 centros poblados (desde backend)</span>
                  </div>
                </mat-checkbox>
              </div>
            </div>

            <div class="datos-esperados">
              <h4>Campos que se importarán:</h4>
              <div class="datos-grid">
                <mat-chip class="campo-obligatorio">Nombre *</mat-chip>
                <mat-chip class="campo-obligatorio">Tipo *</mat-chip>
                <mat-chip>UBIGEO</mat-chip>
                <mat-chip>Departamento</mat-chip>
                <mat-chip>Provincia</mat-chip>
                <mat-chip>Distrito</mat-chip>
                <mat-chip>Coordenadas GPS</mat-chip>
                <mat-chip class="campo-nuevo">Población</mat-chip>
                <mat-chip class="campo-nuevo">Tipo de Área</mat-chip>
              </div>
              <p class="nota-campos success">
                <mat-icon>check_circle</mat-icon>
                Se importarán provincias, distritos y centros poblados con sus coordenadas y datos demográficos.
              </p>
            </div>
          </div>
        }

        @if (validando()) {
          <!-- Paso 1.5: Validando archivo -->
          <div class="validacion-proceso">
            <mat-icon class="spinner">sync</mat-icon>
            <h3>Validando archivo GeoJSON...</h3>
            <p>Analizando estructura y datos</p>
          </div>
        }

        @if (validacionCompleta() && !cargando() && !completado()) {
          <!-- Paso 2: Resultados de validación -->
          <div class="validacion-resultados">
            <div class="validacion-header">
              <mat-icon class="check-icon">check_circle</mat-icon>
              <div>
                <h3>Archivo Validado - Preview por Tipo</h3>
                @if (usarArchivoPersonalizado && archivoSeleccionado()) {
                  <p class="archivo-nombre">Archivo: <strong>{{ archivoSeleccionado()?.name }}</strong></p>
                } @else {
                  <p class="archivo-nombre">Archivos por defecto de Puno</p>
                }
              </div>
            </div>

            <div class="columnas-disponibles">
              <h4>Columnas Disponibles:</h4>
              <div class="columnas-grid">
                @for (columna of obtenerColumnasDisponibles(); track columna) {
                  <mat-chip class="columna-chip">{{ columna }}</mat-chip>
                }
              </div>
            </div>

            <div class="validacion-stats">
              <div class="stat-row">
                <span class="stat-label">Total de registros:</span>
                <span class="stat-value">{{ validacion()?.totalFeatures || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Con coordenadas GPS:</span>
                <span class="stat-value success">{{ validacion()?.conCoordenadas || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Con UBIGEO:</span>
                <span class="stat-value success">{{ validacion()?.conUbigeo || 0 }}</span>
              </div>
            </div>

            <div class="preview-por-tipo">
              <h4>Preview de Datos por Tipo:</h4>
              <mat-tab-group>
                <!-- Tab: Provincias -->
                <mat-tab label="Provincias">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>UBIGEO</th>
                          <th>Coordenadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ejemplo of getEjemplosPorTipo('PROVINCIA'); track ejemplo.nombre) {
                          <tr>
                            <td>{{ ejemplo.nombre }}</td>
                            <td>{{ ejemplo.ubigeo || 'N/A' }}</td>
                            <td>
                              @if (ejemplo.coordenadas) {
                                <mat-chip class="mini-chip success">✓ GPS</mat-chip>
                              } @else {
                                <mat-chip class="mini-chip warning">✗ Sin GPS</mat-chip>
                              }
                            </td>
                          </tr>
                        }
                        @if (getEjemplosPorTipo('PROVINCIA').length === 0) {
                          <tr>
                            <td colspan="3" class="sin-datos">No hay provincias en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>

                <!-- Tab: Distritos -->
                <mat-tab label="Distritos">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Provincia</th>
                          <th>UBIGEO</th>
                          <th>Coordenadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ejemplo of getEjemplosPorTipo('DISTRITO'); track ejemplo.nombre) {
                          <tr>
                            <td>{{ ejemplo.nombre }}</td>
                            <td>{{ ejemplo.provincia }}</td>
                            <td>{{ ejemplo.ubigeo || 'N/A' }}</td>
                            <td>
                              @if (ejemplo.coordenadas) {
                                <mat-chip class="mini-chip success">✓ GPS</mat-chip>
                              } @else {
                                <mat-chip class="mini-chip warning">✗ Sin GPS</mat-chip>
                              }
                            </td>
                          </tr>
                        }
                        @if (getEjemplosPorTipo('DISTRITO').length === 0) {
                          <tr>
                            <td colspan="4" class="sin-datos">No hay distritos en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>

                <!-- Tab: Centros Poblados -->
                <mat-tab label="Centros Poblados">
                  <div class="preview-tabla">
                    <table class="datos-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Distrito</th>
                          <th>Provincia</th>
                          <th>UBIGEO</th>
                          <th>Coordenadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ejemplo of getEjemplosPorTipo('CENTRO_POBLADO'); track ejemplo.nombre) {
                          <tr>
                            <td>{{ ejemplo.nombre }}</td>
                            <td>{{ ejemplo.distrito }}</td>
                            <td>{{ ejemplo.provincia }}</td>
                            <td>{{ ejemplo.ubigeo || 'N/A' }}</td>
                            <td>
                              @if (ejemplo.coordenadas) {
                                <mat-chip class="mini-chip success">✓ GPS</mat-chip>
                              } @else {
                                <mat-chip class="mini-chip warning">✗ Sin GPS</mat-chip>
                              }
                            </td>
                          </tr>
                        }
                        @if (getEjemplosPorTipo('CENTRO_POBLADO').length === 0) {
                          <tr>
                            <td colspan="5" class="sin-datos">No hay centros poblados en el preview</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </div>

            <div class="validacion-confirmacion">
              <mat-icon>info</mat-icon>
              <p>Revisa el preview anterior. Si los datos se ven correctos, haz clic en "Confirmar e Importar"</p>
            </div>
          </div>
        }

        @if (cargando()) {
          <!-- Paso 2: Proceso de carga -->
          <div class="proceso-carga">
            <div class="progreso-container">
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <div class="progreso-texto">
                Importando localidades...
              </div>
            </div>

            <div class="estado-actual">
              <mat-icon class="spinner">sync</mat-icon>
              <span>{{ estadoActual() }}</span>
            </div>

            <div class="estadisticas-proceso">
              <div class="stat-item success">
                <mat-icon>check_circle</mat-icon>
                <span>{{ importados() }} importados</span>
              </div>
              <div class="stat-item info">
                <mat-icon>update</mat-icon>
                <span>{{ actualizados() }} actualizados</span>
              </div>
              <div class="stat-item warning">
                <mat-icon>skip_next</mat-icon>
                <span>{{ omitidos() }} omitidos</span>
              </div>
              @if (errores() > 0) {
                <div class="stat-item error">
                  <mat-icon>error</mat-icon>
                  <span>{{ errores() }} errores</span>
                </div>
              }
            </div>
          </div>
        }

        @if (completado()) {
          <!-- Paso 3: Resultados -->
          <div class="resultados">
            <div class="resultado-header">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <h3>Importación Completada</h3>
            </div>

            <div class="resultado-stats">
              <div class="stat-card">
                <div class="stat-number">{{ resultado()?.total || 0 }}</div>
                <div class="stat-label">Total procesados</div>
              </div>
              <div class="stat-card success">
                <div class="stat-number">{{ resultado()?.importados || 0 }}</div>
                <div class="stat-label">Nuevos importados</div>
              </div>
              <div class="stat-card info">
                <div class="stat-number">{{ resultado()?.actualizados || 0 }}</div>
                <div class="stat-label">Actualizados</div>
              </div>
              <div class="stat-card warning">
                <div class="stat-number">{{ resultado()?.omitidos || 0 }}</div>
                <div class="stat-label">Omitidos</div>
              </div>
              @if ((resultado()?.errores || 0) > 0) {
                <div class="stat-card error">
                  <div class="stat-number">{{ resultado()?.errores || 0 }}</div>
                  <div class="stat-label">Errores</div>
                </div>
              }
            </div>

            @if ((resultado()?.detallesErrores?.length || 0) > 0) {
              <div class="errores-detalle">
                <h4>Detalles de errores:</h4>
                <div class="error-list">
                  @for (error of (resultado()?.detallesErrores || []).slice(0, 5); track error) {
                    <div class="error-item">
                      <mat-icon>error_outline</mat-icon>
                      <span>{{ error }}</span>
                    </div>
                  }
                  @if ((resultado()?.detallesErrores?.length || 0) > 5) {
                    <div class="error-item">
                      <span>... y {{ (resultado()?.detallesErrores?.length || 0) - 5 }} errores más</span>
                    </div>
                  }
                </div>
              </div>
            }

            @if ((resultado()?.duplicados_detectados?.length || 0) > 0) {
              <div class="duplicados-detalle">
                <h4>Duplicados detectados ({{ resultado()?.duplicados_detectados?.length || 0 }}):</h4>
                <p class="duplicados-info">Estas localidades no se importaron porque ya existen en la base de datos</p>
                <div class="duplicados-list">
                  @for (dup of (resultado()?.duplicados_detectados || []).slice(0, 10); track dup.nombre + dup.ubigeo) {
                    <div class="duplicado-item">
                      <div class="duplicado-header">
                        <strong>{{ dup.nombre }}</strong>
                        <mat-chip class="tipo-chip">{{ dup.tipo }}</mat-chip>
                      </div>
                      <div class="duplicado-info">
                        <span class="info-label">UBIGEO:</span>
                        <span class="info-value">{{ dup.ubigeo || 'N/A' }}</span>
                      </div>
                      <div class="duplicado-info">
                        <span class="info-label">Ubicación:</span>
                        <span class="info-value">{{ dup.provincia }}{{ dup.distrito ? ' - ' + dup.distrito : '' }}</span>
                      </div>
                      <div class="duplicado-razon">
                        <mat-icon>info</mat-icon>
                        <span>{{ dup.razon }}</span>
                      </div>
                    </div>
                  }
                  @if ((resultado()?.duplicados_detectados?.length || 0) > 10) {
                    <div class="duplicado-item">
                      <span>... y {{ (resultado()?.duplicados_detectados?.length || 0) - 10 }} duplicados más</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions>
        @if (!iniciado() && !validando() && !validacionCompleta()) {
          <button mat-button (click)="cerrar()">Cancelar</button>
          <button mat-button color="accent" (click)="importarTest()">
            <mat-icon>science</mat-icon>
            TEST (2 de cada tipo)
          </button>
          <button mat-raised-button color="primary" (click)="validarArchivo()">
            <mat-icon>fact_check</mat-icon>
            Validar Archivo
          </button>
        }

        @if (validacionCompleta() && !cargando() && !completado()) {
          <button mat-button (click)="volverAInicio()">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
          <button mat-raised-button color="primary" (click)="iniciarImportacion()">
            <mat-icon>upload</mat-icon>
            Confirmar e Importar
          </button>
        }

        @if (completado()) {
          <button mat-raised-button color="primary" (click)="cerrarYRecargar()">
            <mat-icon>done</mat-icon>
            Aceptar
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .carga-masiva-dialog {
      width: 600px;
      max-width: 90vw;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    mat-dialog-content {
      padding: 24px;
      min-height: 300px;
    }

    .paso-inicial {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;

      .info-icon {
        color: #2196f3;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .info-content {
        flex: 1;

        h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
        }

        p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        code {
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }

    .modo-seleccion {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .modo-radio-group {
        display: flex;
        flex-direction: column;
        gap: 12px;

        mat-radio-button {
          ::ng-deep .mdc-radio {
            padding: 8px;
          }

          .radio-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-left: 8px;

            strong {
              font-size: 14px;
            }

            span {
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
    }

    .tipos-seleccion {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;

        mat-checkbox {
          ::ng-deep .mdc-checkbox {
            padding: 8px;
          }

          .checkbox-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-left: 8px;

            strong {
              font-size: 14px;
            }

            span {
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
    }

    .tab-content {
      padding: 16px 0;
    }

    .upload-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 2px dashed #2196f3;
      text-align: center;

      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #2196f3;
      }

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }

      .file-input-wrapper {
        display: flex;
        gap: 12px;
      }
    }

    .archivo-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
      width: 100%;

      .success-icon {
        color: #4caf50;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;

        strong {
          font-size: 14px;
        }

        span {
          font-size: 12px;
          color: #666;
        }
      }
    }

    .datos-esperados {
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
      }

      .datos-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;

        mat-chip {
          font-size: 12px;
          
          &.campo-obligatorio {
            background: #e3f2fd;
            color: #1976d2;
          }
          
          &.campo-nuevo {
            background: #e8f5e9;
            color: #2e7d32;
          }
        }
      }

      .nota-campos {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0;
        padding: 12px;
        background: #fff3e0;
        border-radius: 4px;
        font-size: 12px;
        color: #f57c00;

        &.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
      }
    }

    .proceso-carga {
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-items: center;
      padding: 24px 0;
    }

    .progreso-container {
      width: 100%;

      mat-progress-bar {
        height: 8px;
        border-radius: 4px;
      }

      .progreso-texto {
        text-align: center;
        margin-top: 12px;
        font-size: 14px;
        color: #666;
      }
    }

    .estado-actual {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      color: #333;

      .spinner {
        animation: spin 1s linear infinite;
        color: #2196f3;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .estadisticas-proceso {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      width: 100%;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 8px;
        background: #f5f5f5;

        &.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.info {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        &.error {
          background: #ffebee;
          color: #c62828;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        span {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    .resultados {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .resultado-header {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: center;

      .success-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #4caf50;
      }

      h3 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
    }

    .resultado-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 16px;

      .stat-card {
        text-align: center;
        padding: 16px;
        border-radius: 8px;
        background: #f5f5f5;

        &.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.info {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        &.error {
          background: #ffebee;
          color: #c62828;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
      }
    }

    .errores-detalle {
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: #c62828;
      }

      .error-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;

        .error-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          background: #ffebee;
          border-radius: 4px;
          font-size: 12px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #c62828;
            flex-shrink: 0;
          }

          span {
            flex: 1;
            line-height: 1.4;
          }
        }
      }
    }

    .duplicados-detalle {
      margin-top: 24px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;
      border-left: 4px solid #f57c00;

      h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: #f57c00;
      }

      .duplicados-info {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: #666;
      }

      .duplicados-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;

        .duplicado-item {
          padding: 12px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #f57c00;

          .duplicado-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            strong {
              font-size: 13px;
              flex: 1;
            }

            .tipo-chip {
              font-size: 10px;
              height: 20px;
              background: #fff3e0;
              color: #f57c00;
            }
          }

          .duplicado-info {
            display: flex;
            gap: 8px;
            font-size: 11px;
            margin-bottom: 4px;

            .info-label {
              font-weight: 600;
              color: #666;
              min-width: 60px;
            }

            .info-value {
              color: #333;
              flex: 1;
            }
          }

          .duplicado-razon {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 11px;
            color: #f57c00;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #ffe0b2;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
              flex-shrink: 0;
            }

            span {
              flex: 1;
            }
          }
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
      gap: 12px;
    }

    .preview-tabla {
      margin: 16px 0;
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;

      .datos-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;

        thead {
          background: #f5f5f5;
          border-bottom: 2px solid #e0e0e0;

          th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #e0e0e0;

            &:hover {
              background: #f9f9f9;
            }

            td {
              padding: 10px 12px;
              color: #666;

              &.sin-datos {
                text-align: center;
                color: #999;
                font-style: italic;
              }

              mat-chip {
                font-size: 10px;
                height: 20px;
              }
            }
          }
        }
      }
    }

    .preview-por-tipo {
      margin: 20px 0;

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .validacion-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;

      .check-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #4caf50;
        flex-shrink: 0;
        margin-top: 4px;
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 500;
      }

      .archivo-nombre {
        margin: 0;
        font-size: 13px;
        color: #666;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        border-left: 3px solid #2196f3;

        strong {
          color: #1976d2;
          font-weight: 600;
        }
      }
    }

    .columnas-disponibles {
      margin: 16px 0;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      border: 1px solid #e0e0e0;

      h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .columnas-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .columna-chip {
          font-size: 11px;
          height: 24px;
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #90caf9;
        }
      }
    }

    .archivos-disponibles-section {
      margin-top: 16px;
      padding: 12px;
      background: #f0f7ff;
      border-radius: 8px;
      border: 1px solid #b3e5fc;

      h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: #01579b;
      }

      .archivos-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .archivo-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #0288d1;
          font-size: 12px;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #e3f2fd;
            border-left-color: #1976d2;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #0288d1;
          }

          .coordenadas-chip {
            margin-left: auto;
            font-size: 10px;
            height: 20px;
            background: #c8e6c9;
            color: #2e7d32;
          }
        }
      }

      .nota-centros-poblados {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 12px;
        padding: 10px;
        background: #fff3e0;
        border-radius: 4px;
        border-left: 3px solid #f57c00;
        font-size: 11px;
        color: #e65100;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        span {
          flex: 1;
          line-height: 1.4;

          strong {
            font-weight: 600;
          }
        }
      }
    }

    .archivo-preview-section {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;

      h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: #333;
      }

      .preview-columnas {
        margin-bottom: 12px;

        strong {
          display: block;
          font-size: 11px;
          margin-bottom: 8px;
          color: #666;
        }

        .columnas-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .columna-chip {
            font-size: 10px;
            height: 22px;
            background: #e1f5fe;
            color: #01579b;
            border: 1px solid #80deea;
          }
        }
      }

      .mapeo-columnas {
        margin-bottom: 12px;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e0e0e0;

        strong {
          display: block;
          font-size: 11px;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
        }

        .columnas-seleccion {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;

          .columna-checkbox {
            font-size: 12px;
          }
        }
      }

      .preview-tabla {
        overflow-x: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-top: 12px;

        .datos-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;

          thead {
            background: #e0e0e0;
            border-bottom: 2px solid #bdbdbd;

            th {
              padding: 8px;
              text-align: left;
              font-weight: 600;
              color: #333;
              white-space: nowrap;
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid #f0f0f0;

              &:hover {
                background: #fafafa;
              }

              td {
                padding: 8px;
                color: #666;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                code {
                  background: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 2px;
                  font-size: 9px;
                }

                .coordenadas-badge {
                  background: #c8e6c9;
                  color: #2e7d32;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-weight: 500;
                }
              }
            }
          }
        }
      }
    }
  `]
})
export class CargaMasivaGeojsonComponent {
  private dialogRef = signal<MatDialogRef<CargaMasivaGeojsonComponent> | null>(null);

  // Estado
  iniciado = signal(false);
  cargando = signal(false);
  completado = signal(false);
  validando = signal(false);
  validacionCompleta = signal(false);

  // Modo de importación
  modoImportacion = 'ambos';

  // Selección de tipos de localidades
  importarProvincias = true;
  importarDistritos = true;
  importarCentrosPoblados = true;

  // Archivos disponibles
  archivosDisponibles = signal<string[]>([]);
  archivoSeleccionadoNombre = signal<string>('');
  archivoPreviewDatos = signal<any[]>([]);
  archivoPreviewColumnas = signal<string[]>([]);
  
  // Mapeo de columnas
  columnasSeleccionadas = signal<{ [key: string]: boolean }>({});
  mostrarMapeoColumnas = signal(false);

  // Archivo personalizado
  archivoSeleccionado = signal<File | null>(null);
  usarArchivoPersonalizado = false;
  
  // Mapeo de columnas
  mapeoColumnas = signal<any | null>(null);
  datosPreview = signal<any[]>([]);

  // Validación previa
  validacion = signal<ValidacionPrevia | null>(null);

  // Progreso
  total = signal(0);
  procesados = signal(0);
  importados = signal(0);
  actualizados = signal(0);
  omitidos = signal(0);
  errores = signal(0);
  estadoActual = signal('Iniciando...');

  // Resultado final
  resultado = signal<ResultadoImportacion | null>(null);

  constructor(
    private http: HttpClient,
    private localidadService: LocalidadService,
    private dialog: MatDialog,
    dialogRef: MatDialogRef<CargaMasivaGeojsonComponent>
  ) {
    this.dialogRef.set(dialogRef);
    this.cargarArchivosDisponibles();
  }

  get progreso(): () => number {
    return () => {
      const t = this.total();
      const p = this.procesados();
      return t > 0 ? (p / t) * 100 : 0;
    };
  }

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private cargarArchivosDisponibles() {
    // Lista de archivos GeoJSON disponibles en assets
    // IMPORTANTE: Usar archivos con "-point" para tener coordenadas reales
    this.archivosDisponibles.set([
      'puno-provincias-point.geojson',    // Provincias con coordenadas
      'puno-distritos-point.geojson',     // Distritos con coordenadas
      'puno-centrospoblados.geojson'      // Centros poblados con coordenadas
    ]);
  }

  async cargarArchivoPreview(nombreArchivo: string) {
    try {
      console.log(`Cargando preview de ${nombreArchivo}...`);
      
      // Para archivos muy grandes, usar un enfoque diferente
      if (nombreArchivo.includes('centrospoblados')) {
        await this.cargarArchivoGrandePreview(nombreArchivo);
      } else {
        await this.cargarArchivoNormalPreview(nombreArchivo);
      }
    } catch (error) {
      console.error(`Error cargando archivo ${nombreArchivo}:`, error);
      alert(`Error al cargar ${nombreArchivo}`);
    }
  }

  private async cargarArchivoNormalPreview(nombreArchivo: string) {
    const data = await this.http.get<any>(`assets/geojson/${nombreArchivo}`).toPromise();
    
    if (data?.features && data.features.length > 0) {
      this.procesarPreviewData(nombreArchivo, data.features);
    }
  }

  private async cargarArchivoGrandePreview(nombreArchivo: string) {
    try {
      // Para archivos grandes, hacer una solicitud con responseType text
      // y parsear manualmente solo los primeros 10 features
      const response = await this.http.get(`assets/geojson/${nombreArchivo}`, {
        responseType: 'text'
      }).toPromise();
      
      if (!response) throw new Error('No response');
      
      // Parsear el JSON
      const data = JSON.parse(response);
      
      if (data?.features && data.features.length > 0) {
        console.log(`✅ Archivo grande cargado: ${nombreArchivo} (${data.features.length} total)`);
        this.procesarPreviewData(nombreArchivo, data.features);
      }
    } catch (error) {
      console.error(`Error cargando archivo grande ${nombreArchivo}:`, error);
      throw error;
    }
  }

  private procesarPreviewData(nombreArchivo: string, allFeatures: any[]) {
    // Tomar solo los primeros 10 registros
    const features = allFeatures.slice(0, 10);
    
    // Extraer datos de propiedades
    const datos = features.map((f: any) => ({
      ...f.properties,
      coordenadas: f.geometry?.coordinates || null,
      tipo_geometria: f.geometry?.type || null
    }));
    
    // Obtener columnas únicas de TODOS los features
    const columnasSet = new Set<string>();
    allFeatures.forEach((f: any) => {
      Object.keys(f.properties || {}).forEach(col => columnasSet.add(col));
    });
    
    const columnas = Array.from(columnasSet).sort();
    
    this.archivoSeleccionadoNombre.set(nombreArchivo);
    this.archivoPreviewDatos.set(datos);
    this.archivoPreviewColumnas.set(columnas);
    
    // Inicializar mapeo de columnas (todas seleccionadas por defecto)
    const mapeo: { [key: string]: boolean } = {};
    columnas.forEach(col => {
      mapeo[col] = true;
    });
    this.columnasSeleccionadas.set(mapeo);
    this.mostrarMapeoColumnas.set(true);
    
    console.log(`✅ Preview procesado: ${nombreArchivo}`, {
      total: allFeatures.length,
      preview: datos.length,
      columnasUnicas: columnas.length,
      columnas: columnas
    });
  }

  async validarArchivo() {
    this.validando.set(true);

    try {
      if (this.usarArchivoPersonalizado && this.archivoSeleccionado()) {
        // Validar archivo personalizado
        const file = this.archivoSeleccionado()!;
        const contenido = await file.text();
        const data = JSON.parse(contenido);
        
        if (!data.features || !Array.isArray(data.features)) {
          throw new Error('El archivo no contiene features válidas');
        }
        
        this.procesarValidacion(data.features);
      } else {
        // Cargar y validar archivos por defecto (solo provincias y distritos)
        // Los centros poblados se cargan desde el backend por su tamaño
        await this.cargarYValidarArchivosPorDefecto();
      }
      
      this.validando.set(false);
      this.validacionCompleta.set(true);
    } catch (error: any) {
      console.error('Error validando archivos:', error);
      this.validando.set(false);
      alert('Error al validar los archivos GeoJSON: ' + (error.message || 'Error desconocido'));
    }
  }

  private async cargarYValidarArchivosPorDefecto() {
    try {
      const features: any[] = [];
      
      // Cargar provincias si está seleccionado (usar archivo con -point para coordenadas)
      if (this.importarProvincias) {
        try {
          const data = await this.http.get<any>('assets/geojson/puno-provincias-point.geojson').toPromise();
          if (data?.features) {
            features.push(...data.features.slice(0, 10).map((f: any) => ({
              ...f,
              properties: { ...f.properties, tipo: 'PROVINCIA', archivo: 'puno-provincias-point.geojson' }
            })));
          }
        } catch (error) {
          console.warn('Error cargando provincias:', error);
        }
      }
      
      // Cargar distritos si está seleccionado (usar archivo con -point para coordenadas)
      if (this.importarDistritos) {
        try {
          const data = await this.http.get<any>('assets/geojson/puno-distritos-point.geojson').toPromise();
          if (data?.features) {
            features.push(...data.features.slice(0, 10).map((f: any) => ({
              ...f,
              properties: { ...f.properties, tipo: 'DISTRITO', archivo: 'puno-distritos-point.geojson' }
            })));
          }
        } catch (error) {
          console.warn('Error cargando distritos:', error);
        }
      }
      
      // Cargar centros poblados si está seleccionado
      if (this.importarCentrosPoblados) {
        try {
          const data = await this.http.get<any>('assets/geojson/puno-centrospoblados.geojson').toPromise();
          if (data?.features) {
            features.push(...data.features.slice(0, 10).map((f: any) => ({
              ...f,
              properties: { ...f.properties, tipo: 'CENTRO_POBLADO', archivo: 'puno-centrospoblados.geojson' }
            })));
          }
        } catch (error) {
          console.warn('Error cargando centros poblados (archivo muy grande):', error);
          // No lanzar error, solo advertencia
        }
      }
      
      if (features.length === 0) {
        throw new Error('No se pudieron cargar los archivos GeoJSON');
      }
      
      this.procesarValidacion(features);
    } catch (error) {
      console.error('Error cargando archivos por defecto:', error);
      throw new Error('Error cargando archivos GeoJSON por defecto');
    }
  }

  private procesarValidacion(features: any[]) {
    let conCoordenadas = 0;
    let sinCoordenadas = 0;
    let conUbigeo = 0;
    let sinUbigeo = 0;
    const porProvincia: { [key: string]: number } = {};
    const porDistrito: { [key: string]: number } = {};
    
    // Separar ejemplos por tipo
    const ejemplosProvincias: any[] = [];
    const ejemplosDistritos: any[] = [];
    const ejemplosCentrosPoblados: any[] = [];
    
    features.forEach((feature, index) => {
      const props = feature.properties || {};
      const tipo = props.tipo || 'N/A';
      
      // Mapear localidad con UBIGEO correcto según tipo
      const localidad = this.mapearLocalidad(feature, tipo);
      
      // Contar coordenadas
      if (localidad.longitud !== null && localidad.latitud !== null) {
        conCoordenadas++;
      } else {
        sinCoordenadas++;
      }
      
      // Contar UBIGEO
      if (localidad.ubigeo && localidad.ubigeo.length > 0) {
        conUbigeo++;
      } else {
        sinUbigeo++;
      }
      
      // Contar por provincia
      const provincia = localidad.provincia || 'Sin provincia';
      porProvincia[provincia] = (porProvincia[provincia] || 0) + 1;
      
      // Contar por distrito
      const distrito = localidad.distrito || 'Sin distrito';
      porDistrito[distrito] = (porDistrito[distrito] || 0) + 1;
      
      // Crear ejemplo
      const ejemplo = {
        nombre: localidad.nombre,
        tipo: tipo,
        provincia: provincia,
        distrito: distrito,
        ubigeo: localidad.ubigeo,
        coordenadas: localidad.longitud !== null && localidad.latitud !== null
      };
      
      // Separar por tipo - IMPORTANTE: usar === para comparación exacta
      if (tipo === 'PROVINCIA' && ejemplosProvincias.length < 5) {
        ejemplosProvincias.push(ejemplo);
      } else if (tipo === 'DISTRITO' && ejemplosDistritos.length < 5) {
        ejemplosDistritos.push(ejemplo);
      } else if (tipo === 'CENTRO_POBLADO' && ejemplosCentrosPoblados.length < 5) {
        ejemplosCentrosPoblados.push(ejemplo);
      }
    });
    
    this.validacion.set({
      totalFeatures: features.length,
      conCoordenadas,
      sinCoordenadas,
      conUbigeo,
      sinUbigeo,
      porProvincia,
      porDistrito,
      ejemplos: [...ejemplosProvincias, ...ejemplosDistritos, ...ejemplosCentrosPoblados]
    });
  }

  // Métodos para mapeo correcto de UBIGEO según tipo de localidad
  private mapearLocalidad(feature: any, tipo: string): any {
    const coords = this.extraerCoordenadas(feature);
    const props = feature.properties;
    
    const localidad = {
      nombre: this.extraerNombre(props, tipo),
      tipo: tipo,
      ubigeo: this.generarUBIGEO(feature, tipo),
      departamento: props.NOMB_DEPAR || props.NOMBDEP || 'PUNO',
      provincia: props.NOMB_PROVI || props.PROVINCIA || props.NOMBPROV || '',
      distrito: props.NOMB_DISTR || props.DISTRITO || props.NOMBDIST || '',
      longitud: coords?.longitud || null,
      latitud: coords?.latitud || null,
      poblacion: props.POBTOTAL || 0,
      fuente: props.FUENTE || 'INEI - CPV2017'
    };
    
    return localidad;
  }

  private extraerNombre(props: any, tipo: string): string {
    switch(tipo) {
      case 'PROVINCIA':
        return props.NOMBPROV || props.PROVINCIA || '';
      case 'DISTRITO':
        return props.NOMBDIST || props.DISTRITO || '';
      case 'CENTRO_POBLADO':
        return props.NOMB_CCPP || '';
      default:
        return '';
    }
  }

  private extraerCoordenadas(feature: any): { longitud: number; latitud: number } | null {
    const coords = feature.geometry?.coordinates;
    
    if (!coords || coords.length < 2) {
      return null;
    }
    
    // GeoJSON usa [Longitud, Latitud]
    return {
      longitud: coords[0],
      latitud: coords[1]
    };
  }

  private generarUBIGEO(feature: any, tipo: string): string {
    const props = feature.properties;
    
    // Formato correcto: DDPPDDCCCC (10 dígitos)
    // DD = Departamento (21 para Puno)
    // PP = Provincia
    // DD = Distrito
    // CCCC = Centro Poblado
    
    switch(tipo) {
      case 'PROVINCIA':
        // PROVINCIA: DDPP000000 (10 dígitos)
        // Ejemplo: 2101000000 (Departamento 21, Provincia 01, sin distrito ni CCPP)
        const idprov = props.IDPROV || props.CODPROV;
        if (idprov) {
          const provStr = idprov.toString();
          const provCode = provStr.length === 4 ? provStr.substring(2) : provStr;
          return '21' + provCode.padStart(2, '0') + '000000';
        }
        return '';
      
      case 'DISTRITO':
        // DISTRITO: DDPPDD0000 (10 dígitos)
        // Ejemplo: 2105020000 (Departamento 21, Provincia 05, Distrito 02, sin CCPP)
        const ubigeo = props.UBIGEO || props.ubigeo;
        if (ubigeo) {
          const ubigeoStr = ubigeo.toString().padStart(6, '0');
          return ubigeoStr + '0000';
        }
        return '';
      
      case 'CENTRO_POBLADO':
        // CENTRO_POBLADO: DDPPDDCCCC (10 dígitos)
        // Ejemplo: 2110020048 (Departamento 21, Provincia 10, Distrito 02, CCPP 0048)
        const idccpp = props.IDCCPP || props.COD_CCPP;
        if (idccpp) {
          return idccpp.toString().padStart(10, '0');
        }
        return '';
      
      default:
        return '';
    }
  }

  private validarLocalidad(localidad: any): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    // Validar nombre
    if (!localidad.nombre || localidad.nombre.trim() === '') {
      errores.push('Nombre vacío');
    }
    
    // Validar UBIGEO
    if (!localidad.ubigeo || localidad.ubigeo.length === 0) {
      errores.push('UBIGEO vacío');
    }
    
    // Validar coordenadas
    if (localidad.longitud === null || localidad.latitud === null) {
      errores.push('Coordenadas faltantes');
    }
    
    // Validar rango de coordenadas (Puno)
    if (localidad.longitud && localidad.latitud) {
      if (localidad.longitud < -72 || localidad.longitud > -68) {
        errores.push('Longitud fuera de rango para Puno');
      }
      if (localidad.latitud < -18 || localidad.latitud > -13) {
        errores.push('Latitud fuera de rango para Puno');
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  getTopProvincias(): Array<{ nombre: string; cantidad: number }> {
    const validacion = this.validacion();
    if (!validacion) return [];

    return Object.entries(validacion.porProvincia)
      .map(([nombre, cantidad]) => ({ nombre, cantidad: cantidad as number }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  getEjemplosPorTipo(tipo: string): any[] {
    const validacion = this.validacion();
    if (!validacion) return [];

    return (validacion.ejemplos || [])
      .filter(e => e.tipo === tipo)
      .slice(0, 5);
  }

  obtenerColumnasDisponibles(): string[] {
    const validacion = this.validacion();
    if (!validacion || validacion.ejemplos.length === 0) return [];

    const primerEjemplo = validacion.ejemplos[0];
    // Obtener todas las propiedades del primer ejemplo
    return Object.keys(primerEjemplo).filter(key => key !== 'tipo' && key !== 'archivo');
  }

  volverAInicio() {
    this.validacionCompleta.set(false);
    this.validacion.set(null);
  }

  async iniciarImportacion() {
    // Validar que al menos un tipo esté seleccionado
    if (!this.importarProvincias && !this.importarDistritos && !this.importarCentrosPoblados) {
      alert('Por favor selecciona al menos un tipo de localidad para importar');
      return;
    }

    // Si usa archivo personalizado, validar que esté seleccionado
    if (this.usarArchivoPersonalizado && !this.archivoSeleccionado()) {
      alert('Por favor selecciona un archivo GeoJSON');
      return;
    }

    this.iniciado.set(true);
    this.cargando.set(true);
    this.validacionCompleta.set(false);
    this.estadoActual.set('Importando localidades...');

    try {
      let resultado: any;

      if (this.usarArchivoPersonalizado && this.archivoSeleccionado()) {
        // Importar desde archivo personalizado
        const formData = new FormData();
        formData.append('file', this.archivoSeleccionado()!);
        formData.append('modo', this.modoImportacion);
        formData.append('provincias', this.importarProvincias.toString());
        formData.append('distritos', this.importarDistritos.toString());
        formData.append('centros_poblados', this.importarCentrosPoblados.toString());

        resultado = await this.http.post(
          'http://localhost:8000/api/v1/importar-desde-archivo',
          formData
        ).toPromise();
      } else {
        // Importar desde archivos por defecto
        const params = new URLSearchParams({
          modo: this.modoImportacion,
          test: 'false',
          provincias: this.importarProvincias.toString(),
          distritos: this.importarDistritos.toString(),
          centros_poblados: this.importarCentrosPoblados.toString()
        });

        resultado = await this.http.post(
          `http://localhost:8000/api/v1/importar-desde-geojson?${params}`,
          {}
        ).toPromise();
      }

      console.log('📊 Resultado importación:', resultado);

      // Completar
      this.cargando.set(false);
      this.completado.set(true);

      this.resultado.set({
        total: resultado.total_importados + resultado.total_actualizados + resultado.total_omitidos + resultado.total_errores,
        importados: resultado.total_importados,
        actualizados: resultado.total_actualizados,
        omitidos: resultado.total_omitidos,
        errores: resultado.total_errores,
        detallesErrores: resultado.errores_detalle?.map((e: any) => `${e.nombre}: ${e.error}`) || [],
        duplicados_detectados: resultado.duplicados_detectados || resultado.detalle?.distritos?.duplicados || []
      });

      // Log detallado de lo que no se importó
      if (resultado.duplicados_detectados && resultado.duplicados_detectados.length > 0) {
        console.warn('⚠️ Duplicados detectados:', resultado.duplicados_detectados);
      }
      if (resultado.detalle?.distritos?.duplicados && resultado.detalle.distritos.duplicados.length > 0) {
        console.warn('⚠️ Distritos duplicados:', resultado.detalle.distritos.duplicados);
      }

    } catch (error: any) {
      console.error('Error en importación:', error);
      this.cargando.set(false);
      this.completado.set(true);

      this.resultado.set({
        total: 0,
        importados: 0,
        actualizados: 0,
        omitidos: 0,
        errores: 1,
        detallesErrores: [error.error?.detail || error.message || 'Error desconocido']
      });
    }
  }

  async importarTest() {
    // Validar que al menos un tipo esté seleccionado
    if (!this.importarProvincias && !this.importarDistritos && !this.importarCentrosPoblados) {
      alert('Por favor selecciona al menos un tipo de localidad para importar');
      return;
    }

    // Si usa archivo personalizado, validar que esté seleccionado
    if (this.usarArchivoPersonalizado && !this.archivoSeleccionado()) {
      alert('Por favor selecciona un archivo GeoJSON');
      return;
    }

    this.iniciado.set(true);
    this.cargando.set(true);
    this.estadoActual.set('TEST: Importando 2 de cada tipo...');

    try {
      let resultado: any;

      if (this.usarArchivoPersonalizado && this.archivoSeleccionado()) {
        // Importar desde archivo personalizado (test)
        const formData = new FormData();
        formData.append('file', this.archivoSeleccionado()!);
        formData.append('modo', this.modoImportacion);
        formData.append('test', 'true');
        formData.append('provincias', this.importarProvincias.toString());
        formData.append('distritos', this.importarDistritos.toString());
        formData.append('centros_poblados', this.importarCentrosPoblados.toString());

        resultado = await this.http.post(
          'http://localhost:8000/api/v1/localidades/importar-desde-archivo',
          formData
        ).toPromise();
      } else {
        // Importar desde archivos por defecto (test)
        const params = new URLSearchParams({
          modo: this.modoImportacion,
          test: 'true',
          provincias: this.importarProvincias.toString(),
          distritos: this.importarDistritos.toString(),
          centros_poblados: this.importarCentrosPoblados.toString()
        });

        resultado = await this.http.post(
          `http://localhost:8000/api/v1/localidades/importar-desde-geojson?${params}`,
          {}
        ).toPromise();
      }

      this.cargando.set(false);
      this.completado.set(true);

      // Mostrar detalles en consola
      console.log('📊 Resultado TEST:', resultado);
      console.log('📝 Detalles:', resultado.detalle);

      this.resultado.set({
        total: resultado.total_importados + resultado.total_actualizados + resultado.total_omitidos,
        importados: resultado.total_importados,
        actualizados: resultado.total_actualizados,
        omitidos: resultado.total_omitidos,
        errores: resultado.total_errores,
        detallesErrores: []
      });

    } catch (error: any) {
      console.error('Error en TEST:', error);
      this.cargando.set(false);
      this.completado.set(true);

      this.resultado.set({
        total: 0,
        importados: 0,
        actualizados: 0,
        omitidos: 0,
        errores: 1,
        detallesErrores: [error.error?.detail || error.message || 'Error desconocido']
      });
    }
  }

  cerrar() {
    this.dialogRef()?.close(false);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        this.archivoSeleccionado.set(file);
        this.usarArchivoPersonalizado = true;
        
        // Leer el archivo para obtener vista previa
        try {
          const contenido = await file.text();
          const data = JSON.parse(contenido);
          
          if (data.features && data.features.length > 0) {
            // Extraer columnas disponibles
            const primeraFeature = data.features[0];
            const columnas = Object.keys(primeraFeature.properties || {});
            
            // Obtener datos de preview (primeros 10)
            const preview = data.features.slice(0, 10).map((f: any) => f.properties);
            this.datosPreview.set(preview);
            
            // Abrir diálogo de mapeo con preview
            this.abrirMapeoColumnasConPreview(columnas, preview);
          }
        } catch (error) {
          alert('Error al leer el archivo: ' + (error as any).message);
          this.archivoSeleccionado.set(null);
        }
      } else {
        alert('Por favor selecciona un archivo .geojson o .json');
        this.archivoSeleccionado.set(null);
      }
    }
  }

  private abrirMapeoColumnasConPreview(columnas: string[], datos: any[]) {
    // Importar dinámicamente el componente
    import('./mapeo-columnas-preview.component').then(({ MapeoColumnasPreviewComponent }) => {
      const dialogRef = this.dialog.open(MapeoColumnasPreviewComponent, {
        width: '900px',
        maxHeight: '90vh',
        data: { columnas, datos }
      });

      dialogRef.afterClosed().subscribe((mapeo) => {
        if (mapeo) {
          this.mapeoColumnas.set(mapeo);
          // Proceder a validación
          this.validarArchivo();
        } else {
          this.archivoSeleccionado.set(null);
          this.usarArchivoPersonalizado = false;
        }
      });
    });
  }

  cerrarYRecargar() {
    this.dialogRef()?.close(true);
  }
}
