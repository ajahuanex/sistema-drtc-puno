import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LocalidadUnicaService } from '../../services/localidad-unica.service';
import { LocalidadService } from '../../services/localidad.service';

@Component({
  selector: 'app-gestion-localidades-unicas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="gestion-container">
      <div class="page-header">
        <div>
          <h1>Gestión de Localidades Únicas</h1>
          <p>Administra la unicidad de localidades en el sistema</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button 
                  color="primary" 
                  (click)="validarUnicidad()"
                  [disabled]="cargando()">
            <mat-icon>verified</mat-icon>
            Validar Unicidad
          </button>
          <button mat-stroked-button 
                  color="accent" 
                  (click)="recargarEstadisticas()"
                  [disabled]="cargando()">
            <mat-icon>refresh</mat-icon>
            Recargar
          </button>
        </div>
      </div>

      <mat-tab-group>
        <!-- Tab de Estadísticas -->
        <mat-tab label="Estadísticas">
          <div class="tab-content">
            @if (cargando()) {
              <div class="loading-container">
                <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
                <p>Cargando estadísticas...</p>
              </div>
            } @else {
              <!-- Resumen General -->
              <mat-card class="stats-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon color="primary">analytics</mat-icon>
                    Resumen General
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-number">{{ estadisticas()?.total_localidades || 0 }}</div>
                      <div class="stat-label">Total Localidades</div>
                    </div>
                    <div class="stat-item success">
                      <div class="stat-number">{{ estadisticas()?.creadas_desde_rutas || 0 }}</div>
                      <div class="stat-label">Creadas desde Rutas</div>
                    </div>
                    <div class="stat-item info">
                      <div class="stat-number">{{ estadisticas()?.reutilizadas || 0 }}</div>
                      <div class="stat-label">Reutilizadas</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">{{ getObjectKeysLength(estadisticas()?.por_empresa || {}) }}</div>
                      <div class="stat-label">Empresas</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Localidades por Empresa -->
              @if (estadisticas()?.por_empresa && getObjectKeysLength(estadisticas()?.por_empresa || {}) > 0) {
                <mat-card class="empresas-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon color="accent">business</mat-icon>
                      Localidades por Empresa
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="empresas-grid">
                      @for (empresa of getObjectEntries(estadisticas()?.por_empresa || {}); track empresa[0]) {
                        <div class="empresa-item">
                          <div class="empresa-id">{{ empresa[0] }}</div>
                          <div class="empresa-count">{{ empresa[1] }} localidades</div>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            }
          </div>
        </mat-tab>

        <!-- Tab de Validación -->
        <mat-tab label="Validación de Unicidad">
          <div class="tab-content">
            @if (validacionRealizada()) {
              <!-- Resultado de Validación -->
              <mat-card class="validation-card" [class.success]="resultadoValidacion()?.valido" [class.error]="!resultadoValidacion()?.valido">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon [color]="resultadoValidacion()?.valido ? 'primary' : 'warn'">
                      {{ resultadoValidacion()?.valido ? 'check_circle' : 'error' }}
                    </mat-icon>
                    Resultado de Validación
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ resultadoValidacion()?.mensaje }}</p>
                  
                  @if (!resultadoValidacion()?.valido && resultadoValidacion()?.duplicados?.length) {
                    <div class="duplicados-section">
                      <h4>Localidades Duplicadas Encontradas ({{ resultadoValidacion()?.duplicados?.length }})</h4>
                      
                      <div class="table-container">
                        <table mat-table [dataSource]="resultadoValidacion()?.duplicados || []" class="duplicados-table">
                          <ng-container matColumnDef="nombre">
                            <th mat-header-cell *matHeaderCellDef>Nombre</th>
                            <td mat-cell *matCellDef="let duplicado">{{ duplicado.nombre }}</td>
                          </ng-container>

                          <ng-container matColumnDef="cantidad">
                            <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                            <td mat-cell *matCellDef="let duplicado">
                              <mat-chip class="warning-chip">{{ duplicado.ids.length }}</mat-chip>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="ids">
                            <th mat-header-cell *matHeaderCellDef>IDs</th>
                            <td mat-cell *matCellDef="let duplicado">
                              <div class="ids-container">
                                @for (id of duplicado.ids; track id) {
                                  <mat-chip class="id-chip">{{ id.substring(0, 8) }}...</mat-chip>
                                }
                              </div>
                            </td>
                          </ng-container>

                          <ng-container matColumnDef="acciones">
                            <th mat-header-cell *matHeaderCellDef>Acciones</th>
                            <td mat-cell *matCellDef="let duplicado">
                              <button mat-icon-button 
                                      color="primary" 
                                      (click)="consolidarDuplicado(duplicado)"
                                      matTooltip="Consolidar duplicados">
                                <mat-icon>merge</mat-icon>
                              </button>
                            </td>
                          </ng-container>

                          <tr mat-header-row *matHeaderRowDef="['nombre', 'cantidad', 'ids', 'acciones']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['nombre', 'cantidad', 'ids', 'acciones'];"></tr>
                        </table>
                      </div>

                      <div class="consolidation-actions">
                        <button mat-raised-button 
                                color="warn" 
                                (click)="consolidarTodosDuplicados()"
                                [disabled]="cargando()">
                          <mat-icon>merge</mat-icon>
                          Consolidar Todos los Duplicados
                        </button>
                      </div>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card class="info-card">
                <mat-card-content>
                  <div class="info-content">
                    <mat-icon class="info-icon">info</mat-icon>
                    <h3>Validación de Unicidad</h3>
                    <p>Ejecuta la validación para verificar si existen localidades duplicadas en el sistema.</p>
                    <button mat-raised-button 
                            color="primary" 
                            (click)="validarUnicidad()"
                            [disabled]="cargando()">
                      <mat-icon>play_arrow</mat-icon>
                      Ejecutar Validación
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Tab de Herramientas -->
        <mat-tab label="Herramientas">
          <div class="tab-content">
            <div class="tools-grid">
              <!-- Herramienta de Limpieza -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon color="accent">cleaning_services</mat-icon>
                    Limpieza de Localidades
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>Elimina localidades huérfanas y consolida duplicados automáticamente.</p>
                  <button mat-raised-button 
                          color="accent" 
                          (click)="ejecutarLimpieza()"
                          [disabled]="cargando()">
                    <mat-icon>auto_fix_high</mat-icon>
                    Ejecutar Limpieza
                  </button>
                </mat-card-content>
              </mat-card>

              <!-- Herramienta de Sincronización -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon color="primary">sync</mat-icon>
                    Sincronización con Rutas
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>Sincroniza las localidades con las rutas existentes en el sistema.</p>
                  <button mat-raised-button 
                          color="primary" 
                          (click)="sincronizarConRutas()"
                          [disabled]="cargando()">
                    <mat-icon>sync</mat-icon>
                    Sincronizar
                  </button>
                </mat-card-content>
              </mat-card>

              <!-- Herramienta de Exportación -->
              <mat-card class="tool-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon color="warn">file_download</mat-icon>
                    Exportar Reporte
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>Genera un reporte completo de localidades y su estado de unicidad.</p>
                  <button mat-raised-button 
                          color="warn" 
                          (click)="exportarReporte()"
                          [disabled]="cargando()">
                    <mat-icon>download</mat-icon>
                    Exportar Excel
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./gestion-localidades-unicas.component.scss']
})
export class GestionLocalidadesUnicasComponent implements OnInit {
  
  // Signals para el estado del componente
  cargando = signal(false);
  estadisticas = signal<any>(null);
  validacionRealizada = signal(false);
  resultadoValidacion = signal<any>(null);

  constructor(
    private localidadUnicaService: LocalidadUnicaService,
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.recargarEstadisticas();
  }

  async recargarEstadisticas() {
    try {
      this.cargando.set(true);
      const stats = await this.localidadUnicaService.obtenerEstadisticasLocalidadesRutas();
      this.estadisticas.set(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.snackBar.open('Error cargando estadísticas', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async validarUnicidad() {
    try {
      this.cargando.set(true);
      const resultado = await this.localidadUnicaService.validarLocalidadesUnicas();
      this.resultadoValidacion.set(resultado);
      this.validacionRealizada.set(true);
      
      if (resultado.valido) {
        this.snackBar.open('✅ Todas las localidades son únicas', 'Cerrar', { duration: 3000 });
      } else {
        this.snackBar.open(`⚠️ Se encontraron ${resultado.duplicados?.length || 0} grupos de duplicados`, 'Cerrar', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error validando unicidad:', error);
      this.snackBar.open('Error validando unicidad', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async consolidarDuplicado(duplicado: any) {
    try {
      this.cargando.set(true);
      await this.localidadUnicaService.consolidarLocalidadesDuplicadas(duplicado.ids);
      this.snackBar.open(`✅ Duplicados consolidados para "${duplicado.nombre}"`, 'Cerrar', { duration: 3000 });
      
      // Revalidar después de consolidar
      await this.validarUnicidad();
    } catch (error) {
      console.error('Error consolidando duplicado:', error);
      this.snackBar.open('Error consolidando duplicados', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async consolidarTodosDuplicados() {
    const duplicados = this.resultadoValidacion()?.duplicados || [];
    if (duplicados.length === 0) return;

    try {
      this.cargando.set(true);
      
      for (const duplicado of duplicados) {
        await this.localidadUnicaService.consolidarLocalidadesDuplicadas(duplicado.ids);
      }
      
      this.snackBar.open(`✅ Todos los duplicados han sido consolidados`, 'Cerrar', { duration: 3000 });
      
      // Revalidar después de consolidar todo
      await this.validarUnicidad();
      await this.recargarEstadisticas();
    } catch (error) {
      console.error('Error consolidando todos los duplicados:', error);
      this.snackBar.open('Error consolidando duplicados', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  async ejecutarLimpieza() {
    // Implementar lógica de limpieza
    this.snackBar.open('Funcionalidad de limpieza en desarrollo', 'Cerrar', { duration: 3000 });
  }

  async sincronizarConRutas() {
    // Implementar lógica de sincronización
    this.snackBar.open('Funcionalidad de sincronización en desarrollo', 'Cerrar', { duration: 3000 });
  }

  async exportarReporte() {
    try {
      this.cargando.set(true);
      await this.localidadService.exportarExcel();
      this.snackBar.open('✅ Reporte exportado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error exportando reporte:', error);
      this.snackBar.open('Error exportando reporte', 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando.set(false);
    }
  }

  // Métodos auxiliares para el template
  getObjectKeysLength(obj: any): number {
    return Object.keys(obj || {}).length;
  }

  getObjectEntries(obj: any): [string, any][] {
    return Object.entries(obj || {});
  }
}