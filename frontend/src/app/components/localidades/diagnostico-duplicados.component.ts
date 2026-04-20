import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DiagnosticoData {
  total_localidades: number;
  por_tipo: { [key: string]: number };
  duplicados_potenciales: Array<{
    nombre: string;
    tipo: string;
    cantidad: number;
    ids: string[];
  }>;
  sin_ubigeo: number;
  sin_coordenadas: number;
}

interface LimpiezaResult {
  duplicados_encontrados: number;
  registros_eliminados: number;
  detalles: Array<{
    nombre: string;
    tipo: string;
    cantidad_original: number;
    eliminados: number;
  }>;
}

@Component({
  selector: 'app-diagnostico-duplicados',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatTabsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="diagnostico-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>bug_report</mat-icon>
          Diagnóstico de Duplicados
        </h2>
        <button mat-icon-button (click)="cerrar()" [disabled]="limpiando()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        @if (cargando()) {
          <div class="cargando">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p>Analizando base de datos...</p>
          </div>
        }

        @if (!cargando() && diagnostico()) {
          <mat-tab-group>
            <!-- Tab 1: Resumen -->
            <mat-tab label="Resumen">
              <div class="tab-content">
                <div class="resumen-stats">
                  <div class="stat-card">
                    <div class="stat-number">{{ diagnostico()?.total_localidades }}</div>
                    <div class="stat-label">Total de localidades</div>
                  </div>
                  <div class="stat-card warning">
                    <div class="stat-number">{{ diagnostico()?.sin_ubigeo }}</div>
                    <div class="stat-label">Sin UBIGEO</div>
                  </div>
                  <div class="stat-card warning">
                    <div class="stat-number">{{ diagnostico()?.sin_coordenadas }}</div>
                    <div class="stat-label">Sin coordenadas</div>
                  </div>
                  <div class="stat-card error">
                    <div class="stat-number">{{ diagnostico()?.duplicados_potenciales?.length || 0 }}</div>
                    <div class="stat-label">Grupos de duplicados</div>
                  </div>
                </div>

                <div class="por-tipo">
                  <h3>Localidades por tipo:</h3>
                  <div class="tipo-list">
                    @for (item of getTiposList(); track item.tipo) {
                      <div class="tipo-item">
                        <span class="tipo-nombre">{{ item.tipo }}</span>
                        <span class="tipo-cantidad">{{ item.cantidad }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 2: Duplicados -->
            <mat-tab label="Duplicados Encontrados">
              <div class="tab-content">
                @if ((diagnostico()?.duplicados_potenciales?.length || 0) === 0) {
                  <div class="sin-duplicados">
                    <mat-icon>check_circle</mat-icon>
                    <p>No se encontraron duplicados</p>
                  </div>
                } @else {
                  <div class="duplicados-list">
                    @for (dup of diagnostico()?.duplicados_potenciales; track dup.nombre + dup.tipo; let i = $index) {
                      <div class="duplicado-item" [class.expandido]="duplicadoSeleccionado() === i" (click)="seleccionarDuplicado(i)">
                        <div class="duplicado-header">
                          <div class="duplicado-info">
                            <strong>{{ dup.nombre }}</strong>
                            <mat-chip class="tipo-chip">{{ dup.tipo }}</mat-chip>
                          </div>
                          <div class="duplicado-cantidad">
                            <span class="cantidad-badge">{{ dup.cantidad }} registros</span>
                          </div>
                        </div>
                        
                        @if (duplicadoSeleccionado() === i) {
                          <div class="duplicado-detalles">
                            <h4>IDs de registros duplicados:</h4>
                            <div class="ids-list">
                              @for (id of dup.ids; track id) {
                                <div class="id-item">
                                  <mat-icon>fingerprint</mat-icon>
                                  <span class="id-text">{{ id }}</span>
                                  <button mat-icon-button (click)="copiarAlPortapapeles(id); $event.stopPropagation()" matTooltip="Copiar ID">
                                    <mat-icon>content_copy</mat-icon>
                                  </button>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Tab 3: Problemas -->
            <mat-tab label="Problemas Detectados">
              <div class="tab-content">
                <div class="problemas-list">
                  @if ((diagnostico()?.sin_ubigeo || 0) > 0) {
                    <div class="problema-item warning">
                      <mat-icon>warning</mat-icon>
                      <div class="problema-content">
                        <strong>{{ diagnostico()?.sin_ubigeo }} localidades sin UBIGEO</strong>
                        <p>Estas localidades no tienen código UBIGEO asignado</p>
                      </div>
                    </div>
                  }
                  @if ((diagnostico()?.sin_coordenadas || 0) > 0) {
                    <div class="problema-item warning">
                      <mat-icon>warning</mat-icon>
                      <div class="problema-content">
                        <strong>{{ diagnostico()?.sin_coordenadas }} localidades sin coordenadas</strong>
                        <p>Estas localidades no tienen coordenadas GPS asignadas</p>
                      </div>
                    </div>
                  }
                  @if ((diagnostico()?.duplicados_potenciales?.length || 0) > 0) {
                    <div class="problema-item error">
                      <mat-icon>error</mat-icon>
                      <div class="problema-content">
                        <strong>{{ diagnostico()?.duplicados_potenciales?.length }} grupos de duplicados</strong>
                        <p>Se encontraron registros duplicados que pueden ser consolidados</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>

            <!-- Tab 4: Resultados de limpieza -->
            @if (resultadoLimpieza()) {
              <mat-tab label="Resultados de Limpieza">
                <div class="tab-content">
                  <div class="limpieza-resultado">
                    <div class="resultado-header success">
                      <mat-icon>check_circle</mat-icon>
                      <h3>Limpieza completada</h3>
                    </div>

                    <div class="resultado-stats">
                      <div class="stat-card">
                        <div class="stat-number">{{ resultadoLimpieza()?.duplicados_encontrados }}</div>
                        <div class="stat-label">Grupos de duplicados procesados</div>
                      </div>
                      <div class="stat-card success">
                        <div class="stat-number">{{ resultadoLimpieza()?.registros_eliminados }}</div>
                        <div class="stat-label">Registros eliminados</div>
                      </div>
                    </div>

                    <div class="detalles-limpieza">
                      <h4>Detalles:</h4>
                      <div class="detalles-list">
                        @for (detalle of resultadoLimpieza()?.detalles; track detalle.nombre + detalle.tipo) {
                          <div class="detalle-item">
                            <div class="detalle-nombre">
                              <strong>{{ detalle.nombre }}</strong>
                              <mat-chip class="tipo-chip">{{ detalle.tipo }}</mat-chip>
                            </div>
                            <div class="detalle-numeros">
                              <span>{{ detalle.cantidad_original }} → {{ detalle.cantidad_original - detalle.eliminados }}</span>
                              <span class="eliminados">({{ detalle.eliminados }} eliminados)</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        }

        @if (error()) {
          <div class="error-message">
            <mat-icon>error</mat-icon>
            <p>{{ error() }}</p>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="cerrar()" [disabled]="limpiando()">Cerrar</button>
        @if (!resultadoLimpieza() && (diagnostico()?.duplicados_potenciales?.length || 0) > 0) {
          <button mat-raised-button color="warn" (click)="limpiarDuplicados()" [disabled]="limpiando()">
            <span>
              @if (limpiando()) {
                <mat-icon>sync</mat-icon>
                Limpiando...
              } @else {
                <mat-icon>delete_sweep</mat-icon>
                Limpiar Duplicados
              }
            </span>
          </button>
        }
        @if (resultadoLimpieza()) {
          <button mat-raised-button color="primary" (click)="recargar()">
            <mat-icon>refresh</mat-icon>
            Recargar Diagnóstico
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .diagnostico-dialog {
      width: 700px;
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

    .cargando {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;

      mat-progress-bar {
        width: 100%;
      }

      p {
        color: #666;
      }
    }

    .tab-content {
      padding: 16px 0;
    }

    .resumen-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .stat-card {
        text-align: center;
        padding: 16px;
        border-radius: 8px;
        background: #f5f5f5;

        &.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        &.error {
          background: #ffebee;
          color: #c62828;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
      }
    }

    .por-tipo {
      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
      }

      .tipo-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .tipo-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;

          .tipo-nombre {
            font-weight: 500;
          }

          .tipo-cantidad {
            background: #2196f3;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        }
      }
    }

    .sin-duplicados {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
      color: #4caf50;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      p {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .duplicados-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;

      .duplicado-item {
        padding: 12px;
        border: 1px solid #ffebee;
        border-radius: 8px;
        background: #fff5f5;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #ffebee;
          border-color: #ef5350;
        }

        &.expandido {
          background: #ffebee;
          border-color: #c62828;
        }

        .duplicado-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .duplicado-info {
            display: flex;
            align-items: center;
            gap: 8px;

            strong {
              font-size: 14px;
            }

            .tipo-chip {
              font-size: 11px;
              height: 24px;
            }
          }

          .duplicado-cantidad {
            .cantidad-badge {
              background: #c62828;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
          }
        }

        .duplicado-detalles {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #ffcdd2;

          h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 600;
            color: #c62828;
          }

          .ids-list {
            display: flex;
            flex-direction: column;
            gap: 6px;

            .id-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px;
              background: white;
              border-radius: 4px;
              border: 1px solid #ffcdd2;

              mat-icon {
                font-size: 14px;
                width: 14px;
                height: 14px;
                color: #c62828;
                flex-shrink: 0;
              }

              .id-text {
                font-size: 11px;
                font-family: monospace;
                color: #333;
                flex: 1;
                word-break: break-all;
              }

              button {
                flex-shrink: 0;
              }
            }
          }
        }
      }
    }

    .problemas-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .problema-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        border-left: 4px solid;

        &.warning {
          background: #fff3e0;
          border-color: #f57c00;
          color: #f57c00;
        }

        &.error {
          background: #ffebee;
          border-color: #c62828;
          color: #c62828;
        }

        mat-icon {
          flex-shrink: 0;
        }

        .problema-content {
          flex: 1;

          strong {
            display: block;
            margin-bottom: 4px;
          }

          p {
            margin: 0;
            font-size: 12px;
            opacity: 0.8;
          }
        }
      }
    }

    .limpieza-resultado {
      display: flex;
      flex-direction: column;
      gap: 24px;

      .resultado-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;

        &.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        h3 {
          margin: 0;
          font-size: 18px;
        }
      }

      .resultado-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

          .stat-number {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 12px;
            opacity: 0.8;
          }
        }
      }

      .detalles-limpieza {
        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
        }

        .detalles-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;

          .detalle-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f5f5f5;
            border-radius: 4px;

            .detalle-nombre {
              display: flex;
              align-items: center;
              gap: 8px;

              strong {
                font-size: 13px;
              }

              .tipo-chip {
                font-size: 10px;
                height: 20px;
              }
            }

            .detalle-numeros {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;

              .eliminados {
                color: #c62828;
                font-weight: 600;
              }
            }
          }
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;

      mat-icon {
        flex-shrink: 0;
      }

      p {
        margin: 0;
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
export class DiagnosticoDuplicadosComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DiagnosticoDuplicadosComponent>);

  cargando = signal(true);
  limpiando = signal(false);
  diagnostico = signal<DiagnosticoData | null>(null);
  resultadoLimpieza = signal<LimpiezaResult | null>(null);
  error = signal<string | null>(null);
  duplicadoSeleccionado = signal<number | null>(null);

  ngOnInit() {
    this.cargarDiagnostico();
  }

  private cargarDiagnostico() {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<DiagnosticoData>('http://localhost:8000/api/v1/diagnostico-duplicados')
      .subscribe({
        next: (data) => {
          this.diagnostico.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error cargando diagnóstico:', err);
          this.error.set('Error al cargar el diagnóstico: ' + (err.error?.detail || err.message));
          this.cargando.set(false);
        }
      });
  }

  getTiposList() {
    const diagnostico = this.diagnostico();
    if (!diagnostico) return [];

    return Object.entries(diagnostico.por_tipo)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  limpiarDuplicados() {
    if (!confirm('¿Estás seguro de que deseas eliminar los duplicados? Esta acción no se puede deshacer.')) {
      return;
    }

    this.limpiando.set(true);

    this.http.post<LimpiezaResult>('http://localhost:8000/api/v1/limpiar-duplicados', {})
      .subscribe({
        next: (resultado) => {
          this.resultadoLimpieza.set(resultado);
          this.limpiando.set(false);
          this.snackBar.open(`Se eliminaron ${resultado.registros_eliminados} registros duplicados`, 'Cerrar', {
            duration: 5000
          });
        },
        error: (err) => {
          console.error('Error limpiando duplicados:', err);
          this.error.set('Error al limpiar duplicados: ' + (err.error?.detail || err.message));
          this.limpiando.set(false);
        }
      });
  }

  recargar() {
    this.resultadoLimpieza.set(null);
    this.cargarDiagnostico();
  }

  seleccionarDuplicado(index: number) {
    if (this.duplicadoSeleccionado() === index) {
      this.duplicadoSeleccionado.set(null);
    } else {
      this.duplicadoSeleccionado.set(index);
    }
  }

  copiarAlPortapapeles(texto: string) {
    navigator.clipboard.writeText(texto).then(() => {
      this.snackBar.open('ID copiado al portapapeles', 'Cerrar', { duration: 2000 });
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}
