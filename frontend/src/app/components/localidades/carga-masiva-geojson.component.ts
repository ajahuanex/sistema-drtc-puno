import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
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
  ejemplos: any[];
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
  detallesErrores: string[];
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
    MatRadioModule
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
            <div class="info-card">
              <mat-icon class="info-icon">info</mat-icon>
              <div class="info-content">
                <h3>Importar Localidades Completas de Puno</h3>
                <p>
                  Este proceso importará TODAS las localidades desde archivos GeoJSON:
                  <br>• <strong>13 Provincias</strong> desde puno-provincias.geojson
                  <br>• <strong>~110 Distritos</strong> desde puno-distritos.geojson
                  <br>• <strong>~9000 Centros Poblados</strong> desde puno-centrospoblados.geojson
                </p>
              </div>
            </div>

            <div class="modo-seleccion">
              <h3>Selecciona el modo de importación:</h3>
              <mat-radio-group [(ngModel)]="modoImportacion" class="modo-radio-group">
                <mat-radio-button value="crear">
                  <div class="radio-content">
                    <strong>Crear solo nuevos</strong>
                    <span>Importa únicamente centros poblados que no existen</span>
                  </div>
                </mat-radio-button>
                
                <mat-radio-button value="actualizar">
                  <div class="radio-content">
                    <strong>Actualizar solo existentes</strong>
                    <span>Actualiza únicamente centros poblados ya registrados</span>
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
              <h3>Archivo Validado</h3>
            </div>

            <div class="validacion-stats">
              <div class="stat-row">
                <span class="stat-label">Total de centros poblados:</span>
                <span class="stat-value">{{ validacion()?.totalFeatures || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Con coordenadas GPS:</span>
                <span class="stat-value success">{{ validacion()?.conCoordenadas || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Sin coordenadas:</span>
                <span class="stat-value warning">{{ validacion()?.sinCoordenadas || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Con UBIGEO:</span>
                <span class="stat-value success">{{ validacion()?.conUbigeo || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Sin UBIGEO:</span>
                <span class="stat-value warning">{{ validacion()?.sinUbigeo || 0 }}</span>
              </div>
            </div>

            <div class="validacion-distribucion">
              <h4>Distribución por provincia (top 5):</h4>
              <div class="distribucion-list">
                @for (item of getTopProvincias(); track item.nombre) {
                  <div class="distribucion-item">
                    <span class="nombre">{{ item.nombre }}</span>
                    <span class="cantidad">{{ item.cantidad }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="validacion-ejemplos">
              <h4>Ejemplos de datos (primeros 3):</h4>
              <div class="ejemplos-list">
                @for (ejemplo of validacion()?.ejemplos || []; track ejemplo.nombre) {
                  <div class="ejemplo-item">
                    <div class="ejemplo-nombre">{{ ejemplo.nombre }}</div>
                    <div class="ejemplo-detalles">
                      <span>{{ ejemplo.provincia }} - {{ ejemplo.distrito }}</span>
                      @if (ejemplo.ubigeo) {
                        <mat-chip class="mini-chip">{{ ejemplo.ubigeo }}</mat-chip>
                      }
                      @if (ejemplo.coordenadas) {
                        <mat-chip class="mini-chip success">GPS</mat-chip>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="validacion-confirmacion">
              <mat-icon>warning</mat-icon>
              <p>¿Deseas continuar con la importación de {{ validacion()?.totalFeatures || 0 }} localidades (provincias, distritos y centros poblados)?</p>
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

            @if (resultado()?.detallesErrores && resultado()!.detallesErrores.length > 0) {
              <div class="errores-detalle">
                <h4>Detalles de errores:</h4>
                <div class="error-list">
                  @for (error of resultado()!.detallesErrores.slice(0, 5); track error) {
                    <div class="error-item">
                      <mat-icon>error_outline</mat-icon>
                      <span>{{ error }}</span>
                    </div>
                  }
                  @if (resultado()!.detallesErrores.length > 5) {
                    <div class="error-item">
                      <span>... y {{ resultado()!.detallesErrores.length - 5 }} errores más</span>
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

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
      gap: 12px;
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
    dialogRef: MatDialogRef<CargaMasivaGeojsonComponent>
  ) {
    this.dialogRef.set(dialogRef);
  }

  get progreso(): () => number {
    return () => {
      const t = this.total();
      const p = this.procesados();
      return t > 0 ? (p / t) * 100 : 0;
    };
  }

  async validarArchivo() {
    this.validando.set(true);

    try {
      // Validar que existan los archivos (centros poblados deshabilitado por tamaño)
      const [provincias, distritos] = await Promise.all([
        this.http.get<any>('assets/geojson/puno-provincias.geojson').toPromise(),
        this.http.get<any>('assets/geojson/puno-distritos.geojson').toPromise()
        // DESHABILITADO: puno-centrospoblados.geojson (10MB, 9372 features)
      ]);

      // Filtrar solo provincias de Puno
      const provinciasPuno = provincias.features.filter((f: any) => f.properties.NOMBDEP === 'PUNO');

      // Analizar los datos (sin centros poblados)
      const totalFeatures = provinciasPuno.length + distritos.features.length; // + centros.features.length;
      
      const validacion: ValidacionPrevia = {
        totalFeatures: totalFeatures,
        conCoordenadas: 0,
        sinCoordenadas: 0,
        conUbigeo: 0,
        sinUbigeo: 0,
        porProvincia: {},
        porDistrito: {},
        ejemplos: []
      };

      // DESHABILITADO: Análisis de centros poblados (archivo muy grande)
      // Los centros poblados se importan desde el backend directamente
      /*
      centros.features.forEach((feature: any, index: number) => {
        const props = feature.properties;
        const coords = feature.geometry?.coordinates;

        if (coords && coords.length === 2) {
          validacion.conCoordenadas++;
        } else {
          validacion.sinCoordenadas++;
        }

        if (props.UBIGEO && props.UBIGEO.trim()) {
          validacion.conUbigeo++;
        } else {
          validacion.sinUbigeo++;
        }

        const provincia = props.NOMB_PROVI || 'Sin provincia';
        validacion.porProvincia[provincia] = (validacion.porProvincia[provincia] || 0) + 1;

        const distrito = props.NOMB_DISTR || 'Sin distrito';
        validacion.porDistrito[distrito] = (validacion.porDistrito[distrito] || 0) + 1;

        if (index < 3) {
          validacion.ejemplos.push({
            nombre: props.NOMB_CCPP || 'Sin nombre',
            ubigeo: props.UBIGEO || null,
            provincia: props.NOMB_PROVI || 'N/A',
            distrito: props.NOMB_DISTR || 'N/A',
            coordenadas: coords && coords.length === 2
          });
        }
      });
      */

      this.validacion.set(validacion);
      this.validando.set(false);
      this.validacionCompleta.set(true);

    } catch (error: any) {
      console.error('Error validando archivos:', error);
      this.validando.set(false);
      alert('Error al validar los archivos GeoJSON: ' + (error.message || 'Error desconocido'));
    }
  }

  getTopProvincias(): Array<{ nombre: string; cantidad: number }> {
    const validacion = this.validacion();
    if (!validacion) return [];

    return Object.entries(validacion.porProvincia)
      .map(([nombre, cantidad]) => ({ nombre, cantidad: cantidad as number }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  volverAInicio() {
    this.validacionCompleta.set(false);
    this.validacion.set(null);
  }

  async iniciarImportacion() {
    this.iniciado.set(true);
    this.cargando.set(true);
    this.validacionCompleta.set(false);
    this.estadoActual.set('Importando localidades desde base de datos...');

    try {
      // Llamar al endpoint que importa desde GeoJSON en el backend
      const resultado: any = await this.http.post(
        'http://localhost:8000/api/v1/localidades/importar-desde-geojson',
        {},
        { params: { modo: this.modoImportacion, test: 'false' } }
      ).toPromise();

      console.log('📊 Resultado importación:', resultado);

      // Completar
      this.cargando.set(false);
      this.completado.set(true);

      this.resultado.set({
        total: resultado.total_importados + resultado.total_actualizados + resultado.total_omitidos,
        importados: resultado.total_importados,
        actualizados: resultado.total_actualizados,
        omitidos: resultado.total_omitidos,
        errores: resultado.total_errores,
        detallesErrores: []
      });

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
    this.iniciado.set(true);
    this.cargando.set(true);
    this.estadoActual.set('TEST: Importando 2 de cada tipo...');

    try {
      const resultado: any = await this.http.post(
        'http://localhost:8000/api/v1/localidades/importar-desde-geojson',
        {},
        { params: { modo: this.modoImportacion, test: 'true' } }
      ).toPromise();

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

  private async importarProvincias() {
    const geojsonData = await this.http.get<any>('assets/geojson/peru-provincias.geojson').toPromise();
    const features = geojsonData.features.filter((f: any) => f.properties.NOMBDEP === 'PUNO');
    
    let importados = 0, actualizados = 0, omitidos = 0, errores = 0;

    for (const feature of features) {
      try {
        const props = feature.properties;
        const coords = this.extraerCentroide(feature.geometry);

        const localidad: any = {
          nombre: props.NOMBPROV?.trim() || '',
          tipo: TipoLocalidad.PROVINCIA,
          departamento: 'PUNO',
          provincia: props.NOMBPROV?.trim() || '',
          ubigeo: props.IDPROV?.toString().substring(0, 4) || '',
          poblacion: props.POBTOTAL || null,
          coordenadas: coords
        };

        const existe = await this.verificarExistente(localidad.ubigeo, localidad.nombre, TipoLocalidad.PROVINCIA);

        if (existe) {
          if (this.modoImportacion !== 'crear') {
            await this.localidadService.actualizarLocalidad(existe.id, localidad);
            actualizados++;
          } else {
            omitidos++;
          }
        } else {
          if (this.modoImportacion !== 'actualizar') {
            await this.localidadService.crearLocalidad(localidad);
            importados++;
          } else {
            omitidos++;
          }
        }
      } catch (error) {
        errores++;
      }
    }

    return { importados, actualizados, omitidos, errores };
  }

  private async importarDistritos() {
    const geojsonData = await this.http.get<any>('assets/geojson/puno-distritos.geojson').toPromise();
    const features = geojsonData.features;
    
    let importados = 0, actualizados = 0, omitidos = 0, errores = 0;

    for (const feature of features) {
      try {
        const props = feature.properties;
        const coords = this.extraerCentroide(feature.geometry);

        const localidad: any = {
          nombre: props.DISTRITO?.trim() || '',
          tipo: TipoLocalidad.DISTRITO,
          departamento: props.DEPARTAMEN?.trim() || 'PUNO',
          provincia: props.PROVINCIA?.trim() || '',
          distrito: props.DISTRITO?.trim() || '',
          ubigeo: props.UBIGEO?.trim() || '',
          coordenadas: coords
        };

        const existe = await this.verificarExistente(localidad.ubigeo, localidad.nombre, TipoLocalidad.DISTRITO);

        if (existe) {
          if (this.modoImportacion !== 'crear') {
            await this.localidadService.actualizarLocalidad(existe.id, localidad);
            actualizados++;
          } else {
            omitidos++;
          }
        } else {
          if (this.modoImportacion !== 'actualizar') {
            await this.localidadService.crearLocalidad(localidad);
            importados++;
          } else {
            omitidos++;
          }
        }
      } catch (error) {
        errores++;
      }
    }

    return { importados, actualizados, omitidos, errores };
  }

  private async importarCentrosPoblados() {
    // DESHABILITADO: Archivo muy grande (10MB, 9372 features)
    // Los centros poblados deben importarse desde el backend
    console.warn('⚠️ Importación de centros poblados deshabilitada en frontend');
    console.info('💡 Usa el endpoint del backend: POST /api/v1/localidades/importar-geojson');
    return { importados: 0, actualizados: 0, omitidos: 0, errores: 0 };
  }

  private extraerCentroide(geometry: any): { latitud: number; longitud: number } | null {
    if (!geometry) return null;

    if (geometry.type === 'Point') {
      const coords = geometry.coordinates;
      return coords ? { longitud: coords[0], latitud: coords[1] } : null;
    }

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0];
      if (coords && coords.length > 0) {
        const lons = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        return {
          longitud: lons.reduce((a: number, b: number) => a + b, 0) / lons.length,
          latitud: lats.reduce((a: number, b: number) => a + b, 0) / lats.length
        };
      }
    }

    return null;
  }

  private async verificarExistente(ubigeo: string, nombre: string, tipo: TipoLocalidad): Promise<any> {
    try {
      const localidades = await this.localidadService.obtenerLocalidades({
        tipo: tipo,
        departamento: 'PUNO'
      });

      return localidades.find((l: any) => 
        (ubigeo && l.ubigeo === ubigeo) || 
        (l.nombre === nombre && l.tipo === tipo)
      );
    } catch (error) {
      return null;
    }
  }

  cerrar() {
    this.dialogRef()?.close(false);
  }

  cerrarYRecargar() {
    this.dialogRef()?.close(true);
  }
}
