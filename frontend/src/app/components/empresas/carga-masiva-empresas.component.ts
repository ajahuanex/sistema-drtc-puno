import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-carga-masiva-empresas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatStepperModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatRadioModule
  ],
  template: `
    <div class="container">
      <mat-card class="header">
        <h1><mat-icon>cloud_upload</mat-icon> Carga desde Google Sheets</h1>
      </mat-card>

      <mat-stepper #stepper [linear]="false">
        <!-- PASO 1 -->
        <mat-step label="Conectar" [completed]="paso1Completo">
          <div class="step-content">
            <h2>Paso 1: Conectar a Google Sheets</h2>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>URL de Google Sheets</mat-label>
              <input matInput [(ngModel)]="urlSheet" placeholder="https://docs.google.com/spreadsheets/d/...">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre de la hoja (ej: Empresas, Sheet1)</mat-label>
              <input matInput [(ngModel)]="hojaSeleccionada" placeholder="Nombre de la pestaña">
              <mat-hint>Si dejas vacío, usará la primera hoja</mat-hint>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="conectar()" [disabled]="cargando">
              <mat-icon>check</mat-icon> Conectar
            </button>

            @if (cargando) {
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            }

            @if (error) {
              <div class="error">{{ error }}</div>
            }

            @if (paso1Completo) {
              <div class="success">
                ✅ {{ columnasDetectadas.length }} columnas detectadas
                <br>{{ totalFilas }} filas de datos
              </div>
            }
          </div>
        </mat-step>

        <!-- PASO 2 -->
        <mat-step label="Mapear" [completed]="paso2Completo">
          <div class="step-content">
            <h2>Paso 2: Mapear Columnas</h2>
            <p>Selecciona qué columna corresponde a cada campo</p>

            @if (columnasDetectadas.length > 0) {
              <div class="mapeo-grid">
                <div class="mapeo-item">
                  <label>RUC *</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.ruc">
                      <mat-option value="">-- Seleccionar --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Razón Social *</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.razonSocial">
                      <mat-option value="">-- Seleccionar --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Dirección *</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.direccion">
                      <mat-option value="">-- Seleccionar --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Estado</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.estado">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Email</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.email">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Teléfono</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.telefono">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Representante Legal</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.representante">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Nombres Representante</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.nombres">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Apellidos Representante</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.apellidos">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>DNI</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.dni">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="mapeo-item">
                  <label>Partida Registral</label>
                  <mat-form-field appearance="outline">
                    <mat-select [(ngModel)]="mapeo.partida">
                      <mat-option value="">-- No mapear --</mat-option>
                      @for (col of columnasDetectadas; track col) {
                        <mat-option [value]="col">{{ col }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <button mat-raised-button color="primary" (click)="confirmarMapeo()" [disabled]="!validarMapeo()">
                <mat-icon>check</mat-icon> {{ validarMapeo() ? 'Confirmar' : 'Completa los campos' }}
              </button>
            }
          </div>
        </mat-step>

        <!-- PASO 3 -->
        <mat-step label="Previsualizar" [completed]="datosPreview.length > 0">
          <div class="step-content">
            <h2>Paso 3: Previsualizar</h2>

            @if (datosPreview.length > 0) {
              <p>Mostrando {{ datosPreview.length }} de {{ totalFilas }} filas</p>
              <div class="table-scroll">
                <table class="preview-table">
                  <thead>
                    <tr>
                      <th>RUC</th>
                      <th>Razón Social</th>
                      <th>Dirección</th>
                      @if (mapeo.estado) { <th>Estado</th> }
                      @if (mapeo.email) { <th>Email</th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of datosPreview; track $index) {
                      <tr>
                        <td>{{ row.ruc }}</td>
                        <td>{{ row.razonSocial }}</td>
                        <td>{{ row.direccion }}</td>
                        @if (mapeo.estado) { <td>{{ row.estado }}</td> }
                        @if (mapeo.email) { <td>{{ row.email }}</td> }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </mat-step>

        <!-- PASO 4 -->
        <mat-step label="Procesar" [completed]="resultado !== null">
          <div class="step-content">
            <h2>Paso 4: Procesar</h2>

            <mat-radio-group [(ngModel)]="soloValidar">
              <mat-radio-button [value]="true">Solo validar</mat-radio-button>
              <mat-radio-button [value]="false">Validar y crear</mat-radio-button>
            </mat-radio-group>

            <button mat-raised-button color="accent" (click)="procesar()" [disabled]="cargando">
              <mat-icon>play_arrow</mat-icon> {{ soloValidar ? 'Validar' : 'Procesar' }}
            </button>

            @if (cargando) {
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            }
          </div>
        </mat-step>

        <!-- PASO 5 -->
        <mat-step label="Resultados" [completed]="resultado !== null">
          <div class="step-content">
            <h2>Paso 5: Resultados</h2>

            @if (resultado) {
              <div class="stats">
                <div class="stat">
                  <div class="number">{{ resultado.total_filas }}</div>
                  <div class="label">Total</div>
                </div>
                <div class="stat success">
                  <div class="number">{{ resultado.exitosas }}</div>
                  <div class="label">Exitosas</div>
                </div>
                @if (resultado.fallidas > 0) {
                  <div class="stat error">
                    <div class="number">{{ resultado.fallidas }}</div>
                    <div class="label">Fallidas</div>
                  </div>
                }
              </div>

              @if (resultado.empresas_creadas?.length > 0) {
                <h3>✅ Empresas Creadas ({{ resultado.empresas_creadas.length }})</h3>
                <div class="table-scroll">
                  <table class="results-table">
                    <thead>
                      <tr>
                        <th>RUC</th>
                        <th>Razón Social</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (emp of resultado.empresas_creadas.slice(0, 10); track emp.ruc) {
                        <tr>
                          <td>{{ emp.ruc }}</td>
                          <td>{{ emp.razonSocial }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              @if (resultado.empresas_actualizadas?.length > 0) {
                <h3>🔄 Empresas Actualizadas ({{ resultado.empresas_actualizadas.length }})</h3>
                <div class="table-scroll">
                  <table class="results-table">
                    <thead>
                      <tr>
                        <th>RUC</th>
                        <th>Razón Social</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (emp of resultado.empresas_actualizadas.slice(0, 10); track emp.ruc) {
                        <tr>
                          <td>{{ emp.ruc }}</td>
                          <td>{{ emp.razonSocial }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              @if (resultado.errores?.length > 0) {
                <h3>❌ Errores</h3>
                <div class="errors">
                  @for (err of resultado.errores.slice(0, 10); track $index) {
                    <div class="error-item">
                      <strong>Fila {{ err.fila }}:</strong> {{ err.error }}
                    </div>
                  }
                </div>
              }

              <button mat-raised-button color="primary" (click)="reiniciar()">
                <mat-icon>refresh</mat-icon> Nuevo Proceso
              </button>
            }
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 30px;

      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 24px;
      }
    }

    .step-content {
      padding: 20px;

      h2 {
        margin-top: 0;
        color: #333;
      }

      p {
        color: #666;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    button {
      margin-top: 16px;
      margin-right: 8px;
    }

    .error {
      padding: 12px;
      background: #ffebee;
      border-left: 4px solid #f44336;
      color: #c62828;
      margin-top: 16px;
      border-radius: 4px;
    }

    .success {
      padding: 12px;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      color: #2e7d32;
      margin-top: 16px;
      border-radius: 4px;
    }

    .mapeo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin: 20px 0;

      .mapeo-item {
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        mat-form-field {
          width: 100%;
        }
      }
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 20px 0;
    }

    .table-scroll {
      overflow-x: auto;
      margin: 20px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: #f5f5f5;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #eee;
      }
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin: 20px 0;

      .stat {
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid #999;

        .number {
          font-size: 32px;
          font-weight: 600;
          color: #333;
        }

        .label {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }

        &.success {
          border-left-color: #4caf50;
          .number { color: #4caf50; }
        }

        &.error {
          border-left-color: #f44336;
          .number { color: #f44336; }
        }
      }
    }

    .errors {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 16px 0;

      .error-item {
        padding: 8px;
        background: #ffebee;
        border-radius: 4px;
        font-size: 14px;

        strong {
          color: #f44336;
        }
      }
    }

    h3 {
      margin-top: 24px;
      color: #333;
    }
  `]
})
export class CargaMasivaEmpresasComponent {
  urlSheet = '';
  hojaSeleccionada = '';
  columnasDetectadas: string[] = [];
  totalFilas = 0;
  datosPreview: any[] = [];
  cargando = false;
  error = '';
  paso1Completo = false;
  paso2Completo = false;
  soloValidar = true;
  resultado: any = null;
  datosCompletos: string[][] = [];

  mapeo = {
    ruc: '',
    razonSocial: '',
    direccion: '',
    estado: '',
    email: '',
    telefono: '',
    representante: '',
    nombres: '',
    apellidos: '',
    dni: '',
    partida: ''
  };

  constructor(
    private googleSheets: GoogleSheetsService,
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  conectar(): void {
    if (!this.urlSheet.trim()) {
      this.error = 'Ingresa una URL';
      return;
    }

    this.cargando = true;
    this.error = '';

    const id = this.googleSheets.extraerIdDeUrl(this.urlSheet) || this.urlSheet;

    // Obtener los datos de la hoja especificada
    this.googleSheets.obtenerDatosReales(id, this.hojaSeleccionada).subscribe({
      next: (info) => {
        this.columnasDetectadas = info.encabezados;
        this.datosCompletos = info.datos;
        this.totalFilas = info.totalFilas;
        this.paso1Completo = true;
        this.cargando = false;
        this.snackBar.open(`✅ ${info.totalColumnas} columnas, ${info.totalFilas} filas`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      }
    });
  }

  validarMapeo(): boolean {
    const valido = this.mapeo.ruc !== '' && this.mapeo.razonSocial !== '' && this.mapeo.direccion !== '';
    console.log('Validación mapeo:', { mapeo: this.mapeo, valido });
    return valido;
  }

  confirmarMapeo(): void {
    console.log('Confirmar mapeo - Validación:', this.validarMapeo());
    
    if (!this.validarMapeo()) {
      this.snackBar.open('Completa los campos requeridos: RUC, Razón Social y Dirección', 'OK', { duration: 3000 });
      return;
    }

    this.paso2Completo = true;
    this.cargarPreview();
  }

  cargarPreview(): void {
    const idx = {
      ruc: this.columnasDetectadas.indexOf(this.mapeo.ruc),
      razonSocial: this.columnasDetectadas.indexOf(this.mapeo.razonSocial),
      direccion: this.columnasDetectadas.indexOf(this.mapeo.direccion),
      estado: this.mapeo.estado ? this.columnasDetectadas.indexOf(this.mapeo.estado) : -1,
      email: this.mapeo.email ? this.columnasDetectadas.indexOf(this.mapeo.email) : -1,
      telefono: this.mapeo.telefono ? this.columnasDetectadas.indexOf(this.mapeo.telefono) : -1,
      representante: this.mapeo.representante ? this.columnasDetectadas.indexOf(this.mapeo.representante) : -1,
      nombres: this.mapeo.nombres ? this.columnasDetectadas.indexOf(this.mapeo.nombres) : -1,
      apellidos: this.mapeo.apellidos ? this.columnasDetectadas.indexOf(this.mapeo.apellidos) : -1,
      dni: this.mapeo.dni ? this.columnasDetectadas.indexOf(this.mapeo.dni) : -1,
      partida: this.mapeo.partida ? this.columnasDetectadas.indexOf(this.mapeo.partida) : -1
    };

    this.datosPreview = this.datosCompletos.slice(0, 10).map(fila => ({
      ruc: fila[idx.ruc] || '',
      razonSocial: fila[idx.razonSocial] || '',
      direccion: fila[idx.direccion] || '',
      estado: idx.estado >= 0 ? fila[idx.estado] : '',
      email: idx.email >= 0 ? fila[idx.email] : '',
      telefono: idx.telefono >= 0 ? fila[idx.telefono] : '',
      representante: idx.representante >= 0 ? fila[idx.representante] : '',
      dni: idx.dni >= 0 ? fila[idx.dni] : '',
      partida: idx.partida >= 0 ? fila[idx.partida] : ''
    }));
  }

  procesar(): void {
    this.cargando = true;

    const idx = {
      ruc: this.columnasDetectadas.indexOf(this.mapeo.ruc),
      razonSocial: this.columnasDetectadas.indexOf(this.mapeo.razonSocial),
      direccion: this.columnasDetectadas.indexOf(this.mapeo.direccion),
      estado: this.mapeo.estado ? this.columnasDetectadas.indexOf(this.mapeo.estado) : -1,
      email: this.mapeo.email ? this.columnasDetectadas.indexOf(this.mapeo.email) : -1,
      telefono: this.mapeo.telefono ? this.columnasDetectadas.indexOf(this.mapeo.telefono) : -1,
      representante: this.mapeo.representante ? this.columnasDetectadas.indexOf(this.mapeo.representante) : -1,
      nombres: this.mapeo.nombres ? this.columnasDetectadas.indexOf(this.mapeo.nombres) : -1,
      apellidos: this.mapeo.apellidos ? this.columnasDetectadas.indexOf(this.mapeo.apellidos) : -1,
      dni: this.mapeo.dni ? this.columnasDetectadas.indexOf(this.mapeo.dni) : -1,
      partida: this.mapeo.partida ? this.columnasDetectadas.indexOf(this.mapeo.partida) : -1
    };

    const empresas = this.datosCompletos.map(fila => ({
      ruc: fila[idx.ruc] || '',
      razonSocial: fila[idx.razonSocial] || '',
      direccionFiscal: fila[idx.direccion] || '',
      estado: idx.estado >= 0 ? fila[idx.estado] : 'EN_TRAMITE',
      emailContacto: idx.email >= 0 ? fila[idx.email] : '',
      telefonoContacto: idx.telefono >= 0 ? fila[idx.telefono] : '',
      representanteLegal: idx.representante >= 0 ? fila[idx.representante] : '',
      nombresRepresentante: idx.nombres >= 0 ? fila[idx.nombres] : '',
      apellidosRepresentante: idx.apellidos >= 0 ? fila[idx.apellidos] : '',
      dniRepresentante: idx.dni >= 0 ? fila[idx.dni] : '',
      partida: idx.partida >= 0 ? fila[idx.partida] : ''
    }));

    this.empresaService.procesarCargaMasivaGoogleSheets(empresas, this.soloValidar).subscribe({
      next: (res) => {
        this.resultado = res.resultado;
        this.cargando = false;
        this.snackBar.open('✅ Procesamiento completado', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.cargando = false;
        this.snackBar.open('❌ Error: ' + err.message, 'OK', { duration: 5000 });
      }
    });
  }

  reiniciar(): void {
    this.urlSheet = '';
    this.columnasDetectadas = [];
    this.datosPreview = [];
    this.paso1Completo = false;
    this.paso2Completo = false;
    this.resultado = null;
    this.mapeo = { ruc: '', razonSocial: '', direccion: '', estado: '', email: '', telefono: '', representante: '', nombres: '', apellidos: '', dni: '', partida: '' };
    
    // Navegar de vuelta a empresas
    this.router.navigate(['/empresas']);
  }
}
