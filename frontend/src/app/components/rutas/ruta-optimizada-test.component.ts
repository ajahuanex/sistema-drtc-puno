import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RutaProcessorOptimizadoService, RutaOptimizadaData, ResultadoProcesamientoOptimizado } from '../../services/ruta-processor-optimizado.service';

@Component({
  selector: 'app-ruta-optimizada-test',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="test-container">
      <div class="page-header">
        <h1>🚀 Test Ruta Optimizada (Sin Bucles)</h1>
        <p>Prueba la nueva estructura que evita consultas múltiples</p>
      </div>

      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="primary">speed</mat-icon>
            Crear Ruta con Estructura Optimizada
          </mat-card-title>
          <mat-card-subtitle>
            Los datos de empresa ya están incluidos, sin necesidad de consultas adicionales
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="rutaForm" (ngSubmit)="crearRutaOptimizada()">
            <div class="form-grid">
              <!-- Datos básicos -->
              <mat-form-field appearance="outline">
                <mat-label>Código de Ruta</mat-label>
                <input matInput formControlName="codigoRuta" placeholder="001">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nombre de Ruta</mat-label>
                <input matInput formControlName="nombre" placeholder="PUNO - JULIACA">
              </mat-form-field>

              <!-- Empresa (datos completos) -->
              <mat-form-field appearance="outline">
                <mat-label>RUC Empresa</mat-label>
                <input matInput formControlName="empresaRuc" placeholder="20123456789">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Razón Social</mat-label>
                <input matInput formControlName="empresaRazonSocial" placeholder="EMPRESA DE TRANSPORTES SAC">
              </mat-form-field>

              <!-- Origen -->
              <mat-form-field appearance="outline">
                <mat-label>Origen</mat-label>
                <input matInput formControlName="origenNombre" placeholder="PUNO">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Departamento Origen</mat-label>
                <input matInput formControlName="origenDepartamento" placeholder="PUNO">
              </mat-form-field>

              <!-- Destino -->
              <mat-form-field appearance="outline">
                <mat-label>Destino</mat-label>
                <input matInput formControlName="destinoNombre" placeholder="JULIACA">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Departamento Destino</mat-label>
                <input matInput formControlName="destinoDepartamento" placeholder="PUNO">
              </mat-form-field>

              <!-- Tipo de ruta -->
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Ruta</mat-label>
                <mat-select formControlName="tipoRuta">
                  <mat-option value="INTERURBANA">Interurbana</mat-option>
                  <mat-option value="URBANA">Urbana</mat-option>
                  <mat-option value="INTERPROVINCIAL">Interprovincial</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de Servicio</mat-label>
                <mat-select formControlName="tipoServicio">
                  <mat-option value="PASAJEROS">Pasajeros</mat-option>
                  <mat-option value="CARGA">Carga</mat-option>
                  <mat-option value="MIXTO">Mixto</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="!rutaForm.valid || procesando()">
                <mat-icon>rocket_launch</mat-icon>
                Crear Ruta Optimizada
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Procesamiento -->
      @if (procesando()) {
        <mat-card class="processing-card">
          <mat-card-content>
            <div class="processing-content">
              <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
              <h3>Procesando ruta optimizada...</h3>
              <p>{{ mensajeProcesamiento() }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Resultados -->
      @if (resultado()) {
        <mat-card class="result-card" [class.success]="resultado()?.exito" [class.error]="!resultado()?.exito">
          <mat-card-header>
            <mat-card-title>
              <mat-icon [color]="resultado()?.exito ? 'primary' : 'warn'">
                {{ resultado()?.exito ? 'check_circle' : 'error' }}
              </mat-icon>
              {{ resultado()?.exito ? 'Ruta Creada Exitosamente' : 'Error en el Procesamiento' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="result-details">
              <p><strong>Mensaje:</strong> {{ resultado()?.mensaje }}</p>
              @if (resultado()?.rutaId) {
                <p><strong>ID de Ruta:</strong> {{ resultado()?.rutaId }}</p>
              }
              @if (resultado()?.tiempoProcessamiento) {
                <p><strong>Tiempo de Procesamiento:</strong> {{ resultado()?.tiempoProcessamiento }}ms</p>
              }
              <p><strong>Localidades Procesadas:</strong> {{ resultado()?.localidadesProcesadas?.length || 0 }}</p>
            </div>

            @if (resultado()?.errores?.length) {
              <div class="errors-section">
                <h4>Errores:</h4>
                <ul>
                  @for (error of resultado()?.errores; track error) {
                    <li>{{ error }}</li>
                  }
                </ul>
              </div>
            }

            @if (resultado()?.localidadesProcesadas?.length) {
              <div class="localidades-section">
                <h4>Localidades Procesadas:</h4>
                <div class="table-container">
                  <table mat-table [dataSource]="resultado()?.localidadesProcesadas || []">
                    <ng-container matColumnDef="nombre">
                      <th mat-header-cell *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let localidad">{{ localidad.nombre }}</td>
                    </ng-container>

                    <ng-container matColumnDef="tipo">
                      <th mat-header-cell *matHeaderCellDef>Tipo</th>
                      <td mat-cell *matCellDef="let localidad">
                        <mat-chip [class]="'tipo-' + localidad.tipo.toLowerCase()">
                          {{ localidad.tipo }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="estado">
                      <th mat-header-cell *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let localidad">
                        <mat-chip [class.nueva]="localidad.esNueva" [class.reutilizada]="!localidad.esNueva">
                          {{ localidad.esNueva ? 'Nueva' : 'Reutilizada' }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="id">
                      <th mat-header-cell *matHeaderCellDef>ID</th>
                      <td mat-cell *matCellDef="let localidad">
                        <code>{{ localidad.id.substring(0, 8) }}...</code>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['nombre', 'tipo', 'estado', 'id']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['nombre', 'tipo', 'estado', 'id'];"></tr>
                  </table>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- Comparación de rendimiento -->
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="accent">info</mat-icon>
            Ventajas de la Estructura Optimizada
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="advantages-grid">
            <div class="advantage-item">
              <mat-icon color="primary">speed</mat-icon>
              <h4>Sin Bucles de Consultas</h4>
              <p>Los datos de empresa están embebidos, eliminando consultas HTTP adicionales</p>
            </div>
            <div class="advantage-item">
              <mat-icon color="primary">memory</mat-icon>
              <h4>Menor Uso de Recursos</h4>
              <p>Reduce significativamente el uso de CPU y memoria del sistema</p>
            </div>
            <div class="advantage-item">
              <mat-icon color="primary">flash_on</mat-icon>
              <h4>Procesamiento Rápido</h4>
              <p>Tiempo de procesamiento reducido de segundos a milisegundos</p>
            </div>
            <div class="advantage-item">
              <mat-icon color="primary">check_circle</mat-icon>
              <h4>Localidades Únicas</h4>
              <p>Mantiene la funcionalidad de unicidad sin impacto en rendimiento</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
      text-align: center;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .test-card, .result-card, .processing-card, .info-card {
      margin-bottom: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .form-actions {
      text-align: center;
    }

    .processing-content {
      text-align: center;
      padding: 20px;
    }

    .processing-content mat-progress-spinner {
      margin-bottom: 16px;
    }

    .result-card.success {
      border-left: 4px solid #4caf50;
    }

    .result-card.error {
      border-left: 4px solid #f44336;
    }

    .result-details p {
      margin: 8px 0;
    }

    .errors-section {
      margin-top: 16px;
      padding: 16px;
      background: #ffebee;
      border-radius: 4px;
    }

    .errors-section h4 {
      margin: 0 0 8px 0;
      color: #d32f2f;
    }

    .localidades-section {
      margin-top: 16px;
    }

    .table-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 16px;
    }

    .advantages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .advantage-item {
      text-align: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .advantage-item mat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .advantage-item h4 {
      margin: 8px 0;
      color: #333;
    }

    .advantage-item p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    mat-chip.nueva {
      background: #e8f5e8;
      color: #2e7d32;
    }

    mat-chip.reutilizada {
      background: #e3f2fd;
      color: #1976d2;
    }

    mat-chip.tipo-origen {
      background: #e8f5e8;
      color: #2e7d32;
    }

    mat-chip.tipo-destino {
      background: #ffebee;
      color: #d32f2f;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `]
})
export class RutaOptimizadaTestComponent implements OnInit {
  
  rutaForm: FormGroup;
  procesando = signal(false);
  resultado = signal<ResultadoProcesamientoOptimizado | null>(null);
  mensajeProcesamiento = signal('');

  constructor(
    private fb: FormBuilder,
    private rutaProcessorOptimizado: RutaProcessorOptimizadoService,
    private snackBar: MatSnackBar
  ) {
    this.rutaForm = this.fb.group({
      codigoRuta: ['001', Validators.required],
      nombre: ['PUNO - JULIACA', Validators.required],
      empresaRuc: ['20123456789', Validators.required],
      empresaRazonSocial: ['EMPRESA DE TRANSPORTES SAC', Validators.required],
      origenNombre: ['PUNO', Validators.required],
      origenDepartamento: ['PUNO'],
      destinoNombre: ['JULIACA', Validators.required],
      destinoDepartamento: ['PUNO'],
      tipoRuta: ['INTERURBANA', Validators.required],
      tipoServicio: ['PASAJEROS', Validators.required]
    });
  }

  ngOnInit() {
    // Inicialización si es necesaria
  }

  async crearRutaOptimizada() {
    if (!this.rutaForm.valid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      this.procesando.set(true);
      this.resultado.set(null);
      this.mensajeProcesamiento.set('Preparando datos optimizados...');

      const formData = this.rutaForm.value;

      // Crear estructura optimizada (sin necesidad de consultas adicionales)
      const rutaOptimizada: RutaOptimizadaData = {
        codigoRuta: formData.codigoRuta,
        nombre: formData.nombre,
        tipoRuta: formData.tipoRuta,
        tipoServicio: formData.tipoServicio,
        frecuencias: 'Cada 30 minutos',
        descripcion: `Ruta ${formData.nombre} - Estructura optimizada`,
        
        // Datos completos de empresa (sin consultas adicionales)
        empresa: {
          id: '507f1f77bcf86cd799439011', // ID simulado
          ruc: formData.empresaRuc,
          razonSocial: formData.empresaRazonSocial
        },
        
        // Localidades con datos completos
        origen: {
          nombre: formData.origenNombre,
          departamento: formData.origenDepartamento,
          provincia: formData.origenDepartamento, // Simplificado para el test
          distrito: formData.origenNombre
        },
        destino: {
          nombre: formData.destinoNombre,
          departamento: formData.destinoDepartamento,
          provincia: formData.destinoDepartamento, // Simplificado para el test
          distrito: formData.destinoNombre
        }
      };

      this.mensajeProcesamiento.set('Procesando con estructura optimizada...');

      // Procesar con el servicio optimizado
      const resultado = await this.rutaProcessorOptimizado.procesarRutaOptimizada(rutaOptimizada);
      
      this.resultado.set(resultado);
      
      if (resultado.exito) {
        this.snackBar.open(
          `✅ Ruta creada en ${resultado.tiempoProcessamiento}ms`, 
          'Cerrar', 
          { duration: 5000 }
        );
      } else {
        this.snackBar.open('❌ Error en el procesamiento', 'Cerrar', { duration: 5000 });
      }

    } catch (error: any) {
      console.error('Error creando ruta optimizada:', error);
      this.snackBar.open(`Error: ${error.message}`, 'Cerrar', { duration: 5000 });
      
      this.resultado.set({
        exito: false,
        localidadesProcesadas: [],
        errores: [error.message || error.toString()],
        mensaje: 'Error inesperado',
        tiempoProcessamiento: 0
      });
    } finally {
      this.procesando.set(false);
    }
  }
}