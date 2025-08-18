import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmpresaService } from '../../services/empresa.service';
import { DatosSunat } from '../../models/empresa.model';

export interface ValidacionSunatData {
  ruc: string;
  razonSocial?: string;
}

@Component({
  selector: 'app-validacion-sunat-modal',
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
    MatDividerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>verified</mat-icon>
        VALIDACIÓN SUNAT
      </h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <!-- Información de la empresa -->
      <div class="empresa-info">
        <h3>EMPRESA A VALIDAR</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">RUC:</span>
            <span class="value">{{ data.ruc }}</span>
          </div>
          @if (data.razonSocial) {
            <div class="info-item">
              <span class="label">RAZÓN SOCIAL:</span>
              <span class="value">{{ data.razonSocial }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Estado de validación -->
      @if (isValidando()) {
        <div class="validacion-loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>VALIDANDO CON SUNAT...</p>
        </div>
      }

      <!-- Resultado de validación -->
      @if (!isValidando() && datosSunat()) {
        <div class="resultado-validacion">
          <div class="resultado-header" [class]="'resultado-' + (datosSunat()?.valido ? 'valido' : 'invalido')">
            <mat-icon>{{ datosSunat()?.valido ? 'check_circle' : 'error' }}</mat-icon>
            <span>{{ datosSunat()?.valido ? 'VALIDACIÓN EXITOSA' : 'ERROR EN VALIDACIÓN' }}</span>
          </div>

          <div class="datos-sunat">
            <h4>DATOS OBTENIDOS DE SUNAT</h4>
            
            <div class="datos-grid">
              <div class="dato-item">
                <span class="dato-label">ESTADO:</span>
                <span class="dato-value" [class]="'estado-' + (datosSunat()?.estado?.toLowerCase() || '')">
                  {{ datosSunat()?.estado || 'NO DISPONIBLE' }}
                </span>
              </div>

              <div class="dato-item">
                <span class="dato-label">CONDICIÓN:</span>
                <span class="dato-value" [class]="'condicion-' + (datosSunat()?.condicion?.toLowerCase() || '')">
                  {{ datosSunat()?.condicion || 'NO DISPONIBLE' }}
                </span>
              </div>

              <div class="dato-item">
                <span class="dato-label">DIRECCIÓN:</span>
                <span class="dato-value">{{ datosSunat()?.direccion || 'NO DISPONIBLE' }}</span>
              </div>

              <div class="dato-item">
                <span class="dato-label">ÚLTIMA ACTUALIZACIÓN:</span>
                <span class="dato-value">
                  {{ datosSunat()?.fechaActualizacion ? (datosSunat()?.fechaActualizacion | date:'dd/MM/yyyy HH:mm') : 'NO DISPONIBLE' }}
                </span>
              </div>
            </div>

            @if (datosSunat()?.error) {
              <div class="error-message">
                <mat-icon>warning</mat-icon>
                <span>{{ datosSunat()?.error }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Error de validación -->
      @if (!isValidando() && errorValidacion()) {
        <div class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>ERROR EN VALIDACIÓN</h3>
          <p>{{ errorValidacion() }}</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      @if (!isValidando()) {
        <button mat-button (click)="revalidar()" [disabled]="!datosSunat()">
          <mat-icon>refresh</mat-icon>
          REVALIDAR
        </button>
      }
      <button mat-raised-button color="primary" (click)="aceptar()" [disabled]="isValidando()">
        <mat-icon>check</mat-icon>
        ACEPTAR
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
      min-height: 400px;
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

    .validacion-loading {
      text-align: center;
      padding: 40px 20px;
    }

    .validacion-loading p {
      margin-top: 16px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
    }

    .resultado-validacion {
      margin-top: 24px;
    }

    .resultado-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .resultado-header.resultado-valido {
      background: #d4edda;
      color: #155724;
    }

    .resultado-header.resultado-invalido {
      background: #f8d7da;
      color: #721c24;
    }

    .datos-sunat h4 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .datos-grid {
      display: grid;
      gap: 12px;
      margin-bottom: 20px;
    }

    .dato-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .dato-label {
      font-weight: 500;
      color: #666;
    }

    .dato-value {
      font-weight: 600;
      color: #2c3e50;
    }

    .estado-activo {
      color: #28a745;
    }

    .estado-inactivo {
      color: #dc3545;
    }

    .condicion-habido {
      color: #28a745;
    }

    .condicion-no-habido {
      color: #dc3545;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin-top: 16px;
    }

    .error-container {
      text-align: center;
      padding: 40px 20px;
    }

    .error-icon {
      font-size: 48px;
      color: #dc3545;
      margin-bottom: 16px;
    }

    .error-container h3 {
      margin: 0 0 8px 0;
      color: #721c24;
    }

    .error-container p {
      color: #666;
      margin: 0;
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
  `]
})
export class ValidacionSunatModalComponent {
  private dialogRef = inject(MatDialogRef<ValidacionSunatModalComponent>);
  data = inject(MAT_DIALOG_DATA) as ValidacionSunatData;
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);

  // Signals
  isValidando = signal(false);
  datosSunat = signal<DatosSunat | null>(null);
  errorValidacion = signal<string | null>(null);

  constructor() {
    this.validarEmpresa();
  }

  async validarEmpresa(): Promise<void> {
    this.isValidando.set(true);
    this.errorValidacion.set(null);
    this.datosSunat.set(null);

    try {
      const datos = await this.empresaService.validarEmpresaSunat(this.data.ruc).toPromise();
      this.datosSunat.set(datos);
    } catch (error) {
      this.errorValidacion.set(error instanceof Error ? error.message : 'Error desconocido en la validación');
      this.snackBar.open('Error al validar empresa con SUNAT', 'Cerrar', { duration: 3000 });
    } finally {
      this.isValidando.set(false);
    }
  }

  revalidar(): void {
    this.validarEmpresa();
  }

  aceptar(): void {
    this.dialogRef.close(this.datosSunat());
  }
} 