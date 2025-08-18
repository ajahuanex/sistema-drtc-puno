import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { AuditoriaEmpresa } from '../../models/empresa.model';

export interface HistorialAuditoriaData {
  empresaId: string;
  empresaRuc: string;
  empresaRazonSocial: string;
  auditoria: AuditoriaEmpresa[];
}

@Component({
  selector: 'app-historial-auditoria-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatListModule,
    FormsModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>history</mat-icon>
        HISTORIAL DE AUDITORÍA
      </h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <!-- Información de la empresa -->
      <div class="empresa-info">
        <h3>EMPRESA</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">RUC:</span>
            <span class="value">{{ data.empresaRuc }}</span>
          </div>
          <div class="info-item">
            <span class="label">RAZÓN SOCIAL:</span>
            <span class="value">{{ data.empresaRazonSocial }}</span>
          </div>
        </div>
      </div>

      <!-- Filtros de auditoría -->
      <div class="filtros-section">
        <h3>FILTROS</h3>
        <div class="filtros-grid">
          <mat-form-field appearance="outline">
            <mat-label>TIPO DE CAMBIO</mat-label>
            <mat-select [(ngModel)]="filtroTipoCambio">
              <mat-option value="">TODOS LOS TIPOS</mat-option>
              <mat-option value="CREACION_EMPRESA">CREACIÓN DE EMPRESA</mat-option>
              <mat-option value="ACTUALIZACION_EMPRESA">ACTUALIZACIÓN DE EMPRESA</mat-option>
              <mat-option value="CAMBIO_ESTADO">CAMBIO DE ESTADO</mat-option>
              <mat-option value="AGREGAR_VEHICULO">AGREGAR VEHÍCULO</mat-option>
              <mat-option value="REMOVER_VEHICULO">REMOVER VEHÍCULO</mat-option>
              <mat-option value="AGREGAR_CONDUCTOR">AGREGAR CONDUCTOR</mat-option>
              <mat-option value="REMOVER_CONDUCTOR">REMOVER CONDUCTOR</mat-option>
              <mat-option value="AGREGAR_DOCUMENTO">AGREGAR DOCUMENTO</mat-option>
              <mat-option value="REMOVER_DOCUMENTO">REMOVER DOCUMENTO</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>FECHA DESDE</mat-label>
            <input matInput [matDatepicker]="fechaDesdePicker" [(ngModel)]="filtroFechaDesde">
            <mat-datepicker-toggle matSuffix [for]="fechaDesdePicker"></mat-datepicker-toggle>
            <mat-datepicker #fechaDesdePicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>FECHA HASTA</mat-label>
            <input matInput [matDatepicker]="fechaHastaPicker" [(ngModel)]="filtroFechaHasta">
            <mat-datepicker-toggle matSuffix [for]="fechaHastaPicker"></mat-datepicker-toggle>
            <mat-datepicker #fechaHastaPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>USUARIO</mat-label>
            <input matInput [(ngModel)]="filtroUsuario" placeholder="FILTRAR POR USUARIO">
          </mat-form-field>
        </div>

        <div class="filtros-actions">
          <button mat-raised-button color="primary" (click)="aplicarFiltros()">
            <mat-icon>filter_list</mat-icon>
            APLICAR FILTROS
          </button>
          <button mat-button (click)="limpiarFiltros()">
            <mat-icon>clear</mat-icon>
            LIMPIAR
          </button>
        </div>
      </div>

      <!-- Lista de auditoría -->
      <div class="auditoria-section">
        <h3>REGISTROS DE AUDITORÍA</h3>
        
        @if (auditoriaFiltrada().length === 0) {
          <div class="empty-auditoria">
            <mat-icon>history</mat-icon>
            <p>NO HAY REGISTROS DE AUDITORÍA</p>
          </div>
        } @else {
          <div class="auditoria-list">
            @for (registro of auditoriaFiltrada(); track registro.fechaCambio) {
              <mat-expansion-panel class="auditoria-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <div class="panel-header">
                      <mat-icon [class]="getIconoTipoCambio(registro.tipoCambio)">
                        {{ getIconoTipoCambio(registro.tipoCambio) }}
                      </mat-icon>
                      <span class="tipo-cambio">{{ getTipoCambioDisplayName(registro.tipoCambio) }}</span>
                    </div>
                  </mat-panel-title>
                  <mat-panel-description>
                    <div class="panel-description">
                      <span class="fecha">{{ registro.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</span>
                      <span class="usuario">Usuario: {{ registro.usuarioId }}</span>
                    </div>
                  </mat-panel-description>
                </mat-expansion-panel-header>

                <div class="panel-content">
                  @if (registro.campoAnterior || registro.campoNuevo) {
                    <div class="cambios-detalle">
                      <h4>DETALLE DE CAMBIOS</h4>
                      @if (registro.campoAnterior) {
                        <div class="cambio-item">
                          <span class="label">VALOR ANTERIOR:</span>
                          <span class="value anterior">{{ registro.campoAnterior }}</span>
                        </div>
                      }
                      @if (registro.campoNuevo) {
                        <div class="cambio-item">
                          <span class="label">VALOR NUEVO:</span>
                          <span class="value nuevo">{{ registro.campoNuevo }}</span>
                        </div>
                      }
                    </div>
                  }

                  @if (registro.observaciones) {
                    <div class="observaciones">
                      <h4>OBSERVACIONES</h4>
                      <p>{{ registro.observaciones }}</p>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            }
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-raised-button color="primary" (click)="exportarAuditoria()" [disabled]="auditoriaFiltrada().length === 0">
        <mat-icon>download</mat-icon>
        EXPORTAR
      </button>
      <button mat-button mat-dialog-close>
        <mat-icon>close</mat-icon>
        CERRAR
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .close-button {
      color: #666;
    }

    .modal-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .empresa-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .empresa-info h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .info-grid {
      display: grid;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item .label {
      font-weight: 500;
      color: #666;
    }

    .info-item .value {
      font-weight: 600;
      color: #2c3e50;
    }

    .filtros-section {
      margin-bottom: 32px;
    }

    .filtros-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .filtros-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .filtros-actions button {
      text-transform: uppercase;
      font-weight: 500;
    }

    .auditoria-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .empty-auditoria {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-auditoria mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .auditoria-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .auditoria-panel {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .panel-header mat-icon {
      font-size: 20px;
    }

    .tipo-cambio {
      font-weight: 600;
      color: #2c3e50;
      text-transform: uppercase;
    }

    .panel-description {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .fecha {
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }

    .usuario {
      font-size: 12px;
      color: #999;
    }

    .panel-content {
      padding: 16px 0;
    }

    .cambios-detalle {
      margin-bottom: 16px;
    }

    .cambios-detalle h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cambio-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .cambio-item:last-child {
      border-bottom: none;
    }

    .cambio-item .label {
      font-weight: 500;
      color: #666;
    }

    .cambio-item .value {
      font-weight: 600;
      max-width: 300px;
      word-break: break-word;
    }

    .cambio-item .value.anterior {
      color: #dc3545;
    }

    .cambio-item .value.nuevo {
      color: #28a745;
    }

    .observaciones h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .observaciones p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    .modal-actions {
      padding: 16px 24px 24px;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-actions button {
      text-transform: uppercase;
      font-weight: 500;
    }

    /* Iconos por tipo de cambio */
    .icono-creacion { color: #28a745; }
    .icono-actualizacion { color: #17a2b8; }
    .icono-estado { color: #ffc107; }
    .icono-vehiculo { color: #6f42c1; }
    .icono-conductor { color: #fd7e14; }
    .icono-documento { color: #20c997; }
  `]
})
export class HistorialAuditoriaModalComponent {
  private dialogRef = inject(MatDialogRef<HistorialAuditoriaModalComponent>);
  data = inject(MAT_DIALOG_DATA) as HistorialAuditoriaData;

  // Filtros
  filtroTipoCambio = '';
  filtroFechaDesde: Date | null = null;
  filtroFechaHasta: Date | null = null;
  filtroUsuario = '';

  // Signals
  auditoriaFiltrada = computed(() => {
    let auditoria = this.data.auditoria;

    if (this.filtroTipoCambio) {
      auditoria = auditoria.filter(r => r.tipoCambio === this.filtroTipoCambio);
    }

    if (this.filtroFechaDesde) {
      auditoria = auditoria.filter(r => new Date(r.fechaCambio) >= this.filtroFechaDesde!);
    }

    if (this.filtroFechaHasta) {
      auditoria = auditoria.filter(r => new Date(r.fechaCambio) <= this.filtroFechaHasta!);
    }

    if (this.filtroUsuario) {
      auditoria = auditoria.filter(r => 
        r.usuarioId.toLowerCase().includes(this.filtroUsuario.toLowerCase())
      );
    }

    return auditoria.sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime());
  });

  getTipoCambioDisplayName(tipo: string): string {
    const nombres = {
      'CREACION_EMPRESA': 'CREACIÓN DE EMPRESA',
      'ACTUALIZACION_EMPRESA': 'ACTUALIZACIÓN DE EMPRESA',
      'CAMBIO_ESTADO': 'CAMBIO DE ESTADO',
      'AGREGAR_VEHICULO': 'AGREGAR VEHÍCULO',
      'REMOVER_VEHICULO': 'REMOVER VEHÍCULO',
      'AGREGAR_CONDUCTOR': 'AGREGAR CONDUCTOR',
      'REMOVER_CONDUCTOR': 'REMOVER CONDUCTOR',
      'AGREGAR_DOCUMENTO': 'AGREGAR DOCUMENTO',
      'REMOVER_DOCUMENTO': 'REMOVER DOCUMENTO'
    };
    return nombres[tipo as keyof typeof nombres] || tipo;
  }

  getIconoTipoCambio(tipo: string): string {
    const iconos = {
      'CREACION_EMPRESA': 'add_business',
      'ACTUALIZACION_EMPRESA': 'edit',
      'CAMBIO_ESTADO': 'swap_horiz',
      'AGREGAR_VEHICULO': 'directions_car',
      'REMOVER_VEHICULO': 'remove_circle',
      'AGREGAR_CONDUCTOR': 'person_add',
      'REMOVER_CONDUCTOR': 'person_remove',
      'AGREGAR_DOCUMENTO': 'description',
      'REMOVER_DOCUMENTO': 'delete'
    };
    return iconos[tipo as keyof typeof iconos] || 'info';
  }

  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente a través del computed
  }

  limpiarFiltros(): void {
    this.filtroTipoCambio = '';
    this.filtroFechaDesde = null;
    this.filtroFechaHasta = null;
    this.filtroUsuario = '';
  }

  exportarAuditoria(): void {
    // Implementar exportación a CSV/Excel
    const auditoria = this.auditoriaFiltrada();
    const csvContent = this.convertirACSV(auditoria);
    this.descargarCSV(csvContent, `auditoria_empresa_${this.data.empresaRuc}.csv`);
  }

  private convertirACSV(auditoria: AuditoriaEmpresa[]): string {
    const headers = ['FECHA', 'TIPO_CAMBIO', 'USUARIO', 'CAMPO_ANTERIOR', 'CAMPO_NUEVO', 'OBSERVACIONES'];
    const rows = auditoria.map(r => [
      new Date(r.fechaCambio).toLocaleString('es-PE'),
      r.tipoCambio,
      r.usuarioId,
      r.campoAnterior || '',
      r.campoNuevo || '',
      r.observaciones || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private descargarCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 