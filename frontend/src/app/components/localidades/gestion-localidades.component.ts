import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { LocalidadService } from '../../services/localidad.service';
import { ExtraccionLocalidadesService } from '../../services/extraccion-localidades.service';
import { ImportacionMunicipalidadesService } from '../../services/importacion-municipalidades.service';
import { Localidad, LocalidadCreate, NivelTerritorial } from '../../models/localidad.model';

@Component({
  selector: 'app-gestion-localidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="gestion-localidades-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Localidades</h1>
          <p>Sistema completo de gestión de localidades con importación automática</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="nuevaLocalidad()">
            <mat-icon>add</mat-icon>
            Nueva Localidad
          </button>
          <button mat-stroked-button color="accent" (click)="recargarDatos()">
            <mat-icon>refresh</mat-icon>
            Recargar
          </button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Localidades Actuales -->
        <mat-tab label="Localidades Actuales">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Localidades en el Sistema</mat-card-title>
                <mat-card-subtitle>{{ localidades().length }} localidades registradas</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <!-- Filtros -->
                <div class="filtros-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Buscar</mat-label>
                    <input matInput [(ngModel)]="filtroTexto" placeholder="Nombre, departamento, provincia...">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Departamento</mat-label>
                    <mat-select [(ngModel)]="filtroDepartamento">
                      <mat-option value="">Todos</mat-option>
                      @for (dept of departamentosUnicos(); track dept) {
                        <mat-option [value]="dept">{{ dept }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Nivel Territorial</mat-label>
                    <mat-select [(ngModel)]="filtroNivel">
                      <mat-option value="">Todos</mat-option>
                      @for (nivel of nivelesTerritoriales; track nivel.value) {
                        <mat-option [value]="nivel.value">{{ nivel.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <!-- Tabla de localidades -->
                <div class="table-container">
                  <table mat-table [dataSource]="localidadesFiltradas()" class="localidades-table">
                    <!-- Municipalidad -->
                    <ng-container matColumnDef="municipalidad">
                      <th mat-header-cell *matHeaderCellDef>Municipalidad de Centro Poblado</th>
                      <td mat-cell *matCellDef="let localidad">
                        <div class="municipalidad-info">
                          <div class="nombre">{{ localidad.municipalidad_centro_poblado }}</div>
                          @if (localidad.ubigeo) {
                            <div class="ubigeo">UBIGEO: {{ localidad.ubigeo }}</div>
                          }
                        </div>
                      </td>
                    </ng-container>

                    <!-- Ubicación -->
                    <ng-container matColumnDef="ubicacion">
                      <th mat-header-cell *matHeaderCellDef>Ubicación</th>
                      <td mat-cell *matCellDef="let localidad">
                        <div class="ubicacion-info">
                          <div class="departamento">{{ localidad.departamento }}</div>
                          <div class="provincia">{{ localidad.provincia }}</div>
                          <div class="distrito">{{ localidad.distrito }}</div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Nivel -->
                    <ng-container matColumnDef="nivel">
                      <th mat-header-cell *matHeaderCellDef>Nivel</th>
                      <td mat-cell *matCellDef="let localidad">
                        <mat-chip [class]="'nivel-' + localidad.nivel_territorial.toLowerCase()">
                          {{ getNivelLabel(localidad.nivel_territorial) }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <!-- Estado -->
                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let localidad">
                        <mat-chip [class]="localidad.esta_activa ? 'estado-activo' : 'estado-inactivo'">
                          {{ localidad.esta_activa ? 'Activa' : 'Inactiva' }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <!-- Acciones -->
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let localidad">
                        <button mat-icon-button color="primary" (click)="editarLocalidad(localidad)" matTooltip="Editar">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="accent" (click)="toggleEstado(localidad)" 
                                [matTooltip]="localidad.esta_activa ? 'Desactivar' : 'Activar'">
                          <mat-icon>{{ localidad.esta_activa ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="eliminarLocalidad(localidad)" matTooltip="Eliminar">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="columnasLocalidades"></tr>
                    <tr mat-row *matRowDef="let row; columns: columnasLocalidades;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Extracción de Rutas -->
        <mat-tab label="Extracción de Rutas">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Localidades desde Rutas Existentes</mat-card-title>
                <mat-card-subtitle>Extrae automáticamente localidades de las rutas del sistema</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="acciones-extraccion">
                  <button mat-raised-button color="primary" (click)="extraerLocalidadesRutas()" [disabled]="cargandoExtraccion()">
                    <mat-icon>search</mat-icon>
                    Analizar Rutas
                  </button>
                  
                  @if (resultadoExtraccion()) {
                    <button mat-raised-button color="accent" (click)="crearLocalidadesDesdeRutas()" [disabled]="cargandoCreacion()">
                      <mat-icon>add_circle</mat-icon>
                      Crear Localidades Automáticamente
                    </button>
                    
                    <button mat-stroked-button (click)="obtenerEstadisticas()">
                      <mat-icon>analytics</mat-icon>
                      Ver Estadísticas
                    </button>
                  }
                </div>

                @if (cargandoExtraccion()) {
                  <div class="loading-section">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Analizando rutas existentes...</p>
                  </div>
                }

                @if (resultadoExtraccion()) {
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        Resultados del Análisis
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ resultadoExtraccion()?.totalLocalidades }} localidades encontradas
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="estadisticas-grid">
                      <div class="stat-card">
                        <mat-icon>place</mat-icon>
                        <div class="stat-info">
                          <div class="stat-number">{{ resultadoExtraccion()?.estadisticas.origenes }}</div>
                          <div class="stat-label">Orígenes</div>
                        </div>
                      </div>
                      
                      <div class="stat-card">
                        <mat-icon>flag</mat-icon>
                        <div class="stat-info">
                          <div class="stat-number">{{ resultadoExtraccion()?.estadisticas.destinos }}</div>
                          <div class="stat-label">Destinos</div>
                        </div>
                      </div>
                      
                      <div class="stat-card">
                        <mat-icon>route</mat-icon>
                        <div class="stat-info">
                          <div class="stat-number">{{ resultadoExtraccion()?.estadisticas.itinerarios }}</div>
                          <div class="stat-label">En Itinerarios</div>
                        </div>
                      </div>
                      
                      <div class="stat-card">
                        <mat-icon>content_copy</mat-icon>
                        <div class="stat-info">
                          <div class="stat-number">{{ resultadoExtraccion()?.estadisticas.duplicadas }}</div>
                          <div class="stat-label">Duplicadas</div>
                        </div>
                      </div>
                    </div>

                    <!-- Lista de localidades encontradas -->
                    <div class="localidades-encontradas">
                      <h4>Localidades Más Frecuentes</h4>
                      <div class="localidades-chips">
                        @for (localidad of localidadesMasFrecuentes(); track localidad.nombre) {
                          <mat-chip [matTooltip]="'Frecuencia: ' + localidad.frecuencia + ' - Tipo: ' + localidad.tipo">
                            {{ localidad.nombre }}
                            <span class="frecuencia-badge">{{ localidad.frecuencia }}</span>
                          </mat-chip>
                        }
                      </div>
                    </div>
                  </mat-expansion-panel>
                }

                @if (resultadoCreacion()) {
                  <mat-card class="resultado-creacion">
                    <mat-card-header>
                      <mat-card-title>Resultado de Creación Automática</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="resultado-stats">
                        <div class="stat-item success">
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ resultadoCreacion()?.creadas }} localidades creadas</span>
                        </div>
                        @if (resultadoCreacion()?.errores && resultadoCreacion()?.errores.length > 0) {
                          <div class="stat-item error">
                            <mat-icon>error</mat-icon>
                            <span>{{ resultadoCreacion()?.errores.length }} errores</span>
                          </div>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 3: Importación Excel -->
        <mat-tab label="Importación Excel">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Importar Municipalidades desde Excel</mat-card-title>
                <mat-card-subtitle>Importa el archivo de Municipalidades de Centros Poblados 2025</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="importacion-section">
                  <div class="upload-area" (click)="fileInput.click()" 
                       [class.dragover]="isDragOver" 
                       (dragover)="onDragOver($event)" 
                       (dragleave)="onDragLeave($event)" 
                       (drop)="onDrop($event)">
                    <mat-icon>cloud_upload</mat-icon>
                    <h3>Seleccionar Archivo Excel</h3>
                    <p>Arrastra el archivo aquí o haz clic para seleccionar</p>
                    <p class="file-info">Formatos soportados: .xlsx, .xls</p>
                  </div>
                  
                  <input #fileInput type="file" accept=".xlsx,.xls" (change)="onFileSelected($event)" style="display: none;">
                  
                  <div class="importacion-actions">
                    <button mat-stroked-button (click)="descargarPlantilla()">
                      <mat-icon>download</mat-icon>
                      Descargar Plantilla
                    </button>
                    
                    @if (archivoSeleccionado()) {
                      <button mat-raised-button color="primary" (click)="procesarArchivo()" [disabled]="procesandoArchivo()">
                        <mat-icon>upload</mat-icon>
                        Procesar Archivo
                      </button>
                    }
                  </div>
                </div>

                @if (archivoSeleccionado()) {
                  <mat-card class="archivo-info">
                    <mat-card-content>
                      <div class="archivo-detalles">
                        <mat-icon>description</mat-icon>
                        <div>
                          <div class="archivo-nombre">{{ archivoSeleccionado()?.name }}</div>
                          <div class="archivo-size">{{ formatFileSize(archivoSeleccionado()?.size || 0) }}</div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }

                @if (procesandoArchivo()) {
                  <div class="loading-section">
                    <mat-spinner diameter="40"></mat-spinner>
                    <p>Procesando archivo Excel...</p>
                  </div>
                }

                @if (datosExcel().length > 0) {
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Vista Previa de Datos</mat-panel-title>
                      <mat-panel-description>{{ datosExcel().length }} municipalidades encontradas</mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="preview-table">
                      <table mat-table [dataSource]="datosExcel().slice(0, 10)" class="preview-table">
                        <ng-container matColumnDef="ubigeo">
                          <th mat-header-cell *matHeaderCellDef>UBIGEO</th>
                          <td mat-cell *matCellDef="let item">{{ item.ubigeo }}</td>
                        </ng-container>
                        
                        <ng-container matColumnDef="departamento">
                          <th mat-header-cell *matHeaderCellDef>Departamento</th>
                          <td mat-cell *matCellDef="let item">{{ item.departamento }}</td>
                        </ng-container>
                        
                        <ng-container matColumnDef="provincia">
                          <th mat-header-cell *matHeaderCellDef>Provincia</th>
                          <td mat-cell *matCellDef="let item">{{ item.provincia }}</td>
                        </ng-container>
                        
                        <ng-container matColumnDef="municipalidad">
                          <th mat-header-cell *matHeaderCellDef>Municipalidad</th>
                          <td mat-cell *matCellDef="let item">{{ item.municipalidad_centro_poblado }}</td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="columnasPreview"></tr>
                        <tr mat-row *matRowDef="let row; columns: columnasPreview;"></tr>
                      </table>
                      
                      @if (datosExcel().length > 10) {
                        <p class="preview-note">Mostrando 10 de {{ datosExcel().length }} registros</p>
                      }
                    </div>
                    
                    <div class="importacion-final-actions">
                      <mat-checkbox [(ngModel)]="sobreescribirExistentes">
                        Sobreescribir localidades existentes
                      </mat-checkbox>
                      
                      <button mat-raised-button color="accent" (click)="importarDatos()" [disabled]="importandoDatos()">
                        <mat-icon>save</mat-icon>
                        Importar {{ datosExcel().length }} Municipalidades
                      </button>
                    </div>
                  </mat-expansion-panel>
                }

                @if (resultadoImportacion()) {
                  <mat-card class="resultado-importacion">
                    <mat-card-header>
                      <mat-card-title>Resultado de Importación</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="resultado-stats">
                        <div class="stat-item success">
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ resultadoImportacion()?.exitosos }} importadas exitosamente</span>
                        </div>
                        @if (resultadoImportacion()?.errores > 0) {
                          <div class="stat-item error">
                            <mat-icon>error</mat-icon>
                            <span>{{ resultadoImportacion()?.errores }} errores</span>
                          </div>
                        }
                      </div>
                      
                      @if (resultadoImportacion()?.detallesErrores && resultadoImportacion()?.detallesErrores.length > 0) {
                        <mat-expansion-panel>
                          <mat-expansion-panel-header>
                            <mat-panel-title>Detalles de Errores</mat-panel-title>
                          </mat-expansion-panel-header>
                          <div class="errores-list">
                            @for (error of resultadoImportacion()?.detallesErrores; track error) {
                              <div class="error-item">{{ error }}</div>
                            }
                          </div>
                        </mat-expansion-panel>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./gestion-localidades.component.scss']
})
export class GestionLocalidadesComponent implements OnInit {
  // Signals para datos
  localidades = signal<Localidad[]>([]);
  cargandoDatos = signal(false);
  
  // Signals para extracción de rutas
  resultadoExtraccion = signal<any>(null);
  cargandoExtraccion = signal(false);
  resultadoCreacion = signal<any>(null);
  cargandoCreacion = signal(false);
  
  // Signals para importación Excel
  archivoSeleccionado = signal<File | null>(null);
  procesandoArchivo = signal(false);
  datosExcel = signal<any[]>([]);
  importandoDatos = signal(false);
  resultadoImportacion = signal<any>(null);
  
  // Filtros
  filtroTexto = '';
  filtroDepartamento = '';
  filtroNivel = '';
  sobreescribirExistentes = false;
  isDragOver = false;

  // Configuración de tablas
  columnasLocalidades = ['municipalidad', 'ubicacion', 'nivel', 'estado', 'acciones'];
  columnasPreview = ['ubigeo', 'departamento', 'provincia', 'municipalidad'];

  // Datos de configuración
  nivelesTerritoriales = [
    { value: NivelTerritorial.CENTRO_POBLADO, label: 'Centro Poblado' },
    { value: NivelTerritorial.DISTRITO, label: 'Distrito' },
    { value: NivelTerritorial.PROVINCIA, label: 'Provincia' },
    { value: NivelTerritorial.DEPARTAMENTO, label: 'Departamento' }
  ];

  // Computed signals
  departamentosUnicos = computed(() => {
    const departamentos = this.localidades().map(l => l.departamento);
    return [...new Set(departamentos)].sort();
  });

  localidadesFiltradas = computed(() => {
    let filtradas = this.localidades();
    
    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();
      filtradas = filtradas.filter(l => 
        l.municipalidad_centro_poblado.toLowerCase().includes(texto) ||
        l.departamento.toLowerCase().includes(texto) ||
        l.provincia.toLowerCase().includes(texto) ||
        l.distrito.toLowerCase().includes(texto)
      );
    }
    
    if (this.filtroDepartamento) {
      filtradas = filtradas.filter(l => l.departamento === this.filtroDepartamento);
    }
    
    if (this.filtroNivel) {
      filtradas = filtradas.filter(l => l.nivel_territorial === this.filtroNivel);
    }
    
    return filtradas;
  });

  localidadesMasFrecuentes = computed(() => {
    const resultado = this.resultadoExtraccion();
    if (!resultado) return [];
    
    return resultado.localidadesEncontradas
      .sort((a: any, b: any) => b.frecuencia - a.frecuencia)
      .slice(0, 20);
  });

  constructor(
    private localidadService: LocalidadService,
    private extraccionService: ExtraccionLocalidadesService,
    private importacionService: ImportacionMunicipalidadesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    await this.cargarLocalidades();
  }

  async cargarLocalidades() {
    this.cargandoDatos.set(true);
    try {
      const localidades = await this.localidadService.getLocalidades().toPromise() as Localidad[];
      this.localidades.set(localidades || []);
    } catch (error) {
      console.error('Error cargando localidades:', error);
      this.snackBar.open('Error cargando localidades', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargandoDatos.set(false);
    }
  }

  async recargarDatos() {
    await this.cargarLocalidades();
    this.snackBar.open('Datos recargados', 'Cerrar', { duration: 2000 });
  }

  // Métodos para extracción de rutas
  async extraerLocalidadesRutas() {
    this.cargandoExtraccion.set(true);
    try {
      const resultado = await this.extraccionService.extraerLocalidadesDeRutas();
      this.resultadoExtraccion.set(resultado);
      this.snackBar.open(`${resultado.totalLocalidades} localidades encontradas en rutas`, 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error extrayendo localidades:', error);
      this.snackBar.open('Error extrayendo localidades de rutas', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargandoExtraccion.set(false);
    }
  }

  async crearLocalidadesDesdeRutas() {
    this.cargandoCreacion.set(true);
    try {
      const resultado = await this.extraccionService.crearLocalidadesDesdeRutas();
      this.resultadoCreacion.set(resultado);
      this.snackBar.open(`${resultado.creadas} localidades creadas automáticamente`, 'Cerrar', { duration: 3000 });
      await this.cargarLocalidades(); // Recargar datos
    } catch (error) {
      console.error('Error creando localidades:', error);
      this.snackBar.open('Error creando localidades automáticamente', 'Cerrar', { duration: 3000 });
    } finally {
      this.cargandoCreacion.set(false);
    }
  }

  async obtenerEstadisticas() {
    try {
      const estadisticas = await this.extraccionService.obtenerEstadisticasUso();
      console.log('Estadísticas de uso:', estadisticas);
      // Aquí podrías abrir un modal con las estadísticas detalladas
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }

  // Métodos para importación Excel
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
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
      this.archivoSeleccionado.set(files[0]);
    }
  }

  async procesarArchivo() {
    const archivo = this.archivoSeleccionado();
    if (!archivo) return;

    this.procesandoArchivo.set(true);
    try {
      const datos = await this.importacionService.procesarArchivoExcel(archivo);
      this.datosExcel.set(datos);
      this.snackBar.open(`${datos.length} municipalidades encontradas en el archivo`, 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error procesando archivo:', error);
      this.snackBar.open('Error procesando el archivo Excel', 'Cerrar', { duration: 3000 });
    } finally {
      this.procesandoArchivo.set(false);
    }
  }

  async importarDatos() {
    const datos = this.datosExcel();
    if (datos.length === 0) return;

    this.importandoDatos.set(true);
    try {
      const resultado = await this.importacionService.importarMunicipalidades(datos, this.sobreescribirExistentes);
      this.resultadoImportacion.set(resultado);
      this.snackBar.open(`${resultado.exitosos} municipalidades importadas exitosamente`, 'Cerrar', { duration: 3000 });
      await this.cargarLocalidades(); // Recargar datos
    } catch (error) {
      console.error('Error importando datos:', error);
      this.snackBar.open('Error importando municipalidades', 'Cerrar', { duration: 3000 });
    } finally {
      this.importandoDatos.set(false);
    }
  }

  descargarPlantilla() {
    this.importacionService.descargarPlantilla();
    this.snackBar.open('Plantilla descargada', 'Cerrar', { duration: 2000 });
  }

  // Métodos de utilidad
  getNivelLabel(nivel: NivelTerritorial): string {
    const nivelObj = this.nivelesTerritoriales.find(n => n.value === nivel);
    return nivelObj?.label || nivel;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Métodos CRUD (placeholder)
  nuevaLocalidad() {
    // Implementar modal de creación
    console.log('Nueva localidad');
  }

  editarLocalidad(localidad: Localidad) {
    // Implementar modal de edición
    console.log('Editar localidad:', localidad);
  }

  async toggleEstado(localidad: Localidad) {
    try {
      await this.localidadService.toggleEstadoLocalidad(localidad.id);
      await this.cargarLocalidades();
      this.snackBar.open(`Localidad ${localidad.esta_activa ? 'desactivada' : 'activada'}`, 'Cerrar', { duration: 2000 });
    } catch (error) {
      console.error('Error cambiando estado:', error);
      this.snackBar.open('Error cambiando estado de la localidad', 'Cerrar', { duration: 3000 });
    }
  }

  async eliminarLocalidad(localidad: Localidad) {
    if (confirm(`¿Estás seguro de eliminar la localidad "${localidad.municipalidad_centro_poblado}"?`)) {
      try {
        await this.localidadService.eliminarLocalidad(localidad.id);
        await this.cargarLocalidades();
        this.snackBar.open('Localidad eliminada', 'Cerrar', { duration: 2000 });
      } catch (error) {
        console.error('Error eliminando localidad:', error);
        this.snackBar.open('Error eliminando la localidad', 'Cerrar', { duration: 3000 });
      }
    }
  }
}