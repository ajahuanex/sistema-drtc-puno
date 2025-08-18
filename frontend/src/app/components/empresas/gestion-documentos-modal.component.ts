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
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { DocumentoEmpresa, TipoDocumento } from '../../models/empresa.model';

export interface GestionDocumentosData {
  empresaId: string;
  empresaRuc: string;
  empresaRazonSocial: string;
  documentos: DocumentoEmpresa[];
}

@Component({
  selector: 'app-gestion-documentos-modal',
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
    ReactiveFormsModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>description</mat-icon>
        GESTIÓN DE DOCUMENTOS
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

      <!-- Formulario para nuevo documento -->
      <div class="nuevo-documento-section">
        <h3>AGREGAR NUEVO DOCUMENTO</h3>
        <form [formGroup]="documentoForm" (ngSubmit)="agregarDocumento()" class="documento-form">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>TIPO DE DOCUMENTO</mat-label>
              <mat-select formControlName="tipo" required>
                <mat-option *ngFor="let tipo of tiposDocumento" [value]="tipo">
                  {{ getTipoDocumentoDisplayName(tipo) }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="documentoForm.get('tipo')?.hasError('required')">
                EL TIPO DE DOCUMENTO ES REQUERIDO
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>NÚMERO</mat-label>
              <input matInput formControlName="numero" placeholder="NÚMERO DEL DOCUMENTO" required>
              <mat-error *ngIf="documentoForm.get('numero')?.hasError('required')">
                EL NÚMERO ES REQUERIDO
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA DE EMISIÓN</mat-label>
              <input matInput [matDatepicker]="fechaEmisionPicker" formControlName="fechaEmision" required>
              <mat-datepicker-toggle matSuffix [for]="fechaEmisionPicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaEmisionPicker></mat-datepicker>
              <mat-error *ngIf="documentoForm.get('fechaEmision')?.hasError('required')">
                LA FECHA DE EMISIÓN ES REQUERIDA
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>FECHA DE VENCIMIENTO</mat-label>
              <input matInput [matDatepicker]="fechaVencimientoPicker" formControlName="fechaVencimiento">
              <mat-datepicker-toggle matSuffix [for]="fechaVencimientoPicker"></mat-datepicker-toggle>
              <mat-datepicker #fechaVencimientoPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>URL DEL DOCUMENTO</mat-label>
              <input matInput formControlName="urlDocumento" placeholder="HTTPS://...">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>OBSERVACIONES</mat-label>
              <textarea matInput formControlName="observaciones" rows="3" placeholder="OBSERVACIONES ADICIONALES"></textarea>
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="documentoForm.invalid || isGuardando()">
              <mat-icon>add</mat-icon>
              AGREGAR DOCUMENTO
            </button>
            <button mat-button type="button" (click)="limpiarFormulario()">
              <mat-icon>clear</mat-icon>
              LIMPIAR
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de documentos -->
      <div class="documentos-section">
        <h3>DOCUMENTOS REGISTRADOS</h3>
        
        @if (documentos().length === 0) {
          <div class="empty-documentos">
            <mat-icon>description</mat-icon>
            <p>NO HAY DOCUMENTOS REGISTRADOS</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="documentos()" class="documentos-table">
              <!-- Tipo Column -->
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>TIPO</th>
                <td mat-cell *matCellDef="let documento">
                  <mat-chip [color]="getChipColor(documento.tipo)" selected>
                    {{ getTipoDocumentoDisplayName(documento.tipo) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Número Column -->
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>NÚMERO</th>
                <td mat-cell *matCellDef="let documento">{{ documento.numero }}</td>
              </ng-container>

              <!-- Fecha Emisión Column -->
              <ng-container matColumnDef="fechaEmision">
                <th mat-header-cell *matHeaderCellDef>EMISIÓN</th>
                <td mat-cell *matCellDef="let documento">
                  {{ documento.fechaEmision | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Fecha Vencimiento Column -->
              <ng-container matColumnDef="fechaVencimiento">
                <th mat-header-cell *matHeaderCellDef>VENCIMIENTO</th>
                <td mat-cell *matCellDef="let documento">
                  @if (documento.fechaVencimiento) {
                    <span [class]="isDocumentoVencido(documento) ? 'vencido' : 'vigente'">
                      {{ documento.fechaVencimiento | date:'dd/MM/yyyy' }}
                    </span>
                  } @else {
                    <span class="sin-vencimiento">SIN VENCIMIENTO</span>
                  }
                </td>
              </ng-container>

              <!-- Estado Column -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>ESTADO</th>
                <td mat-cell *matCellDef="let documento">
                  <span class="estado-badge" [class]="'estado-' + (documento.estaActivo ? 'activo' : 'inactivo')">
                    {{ documento.estaActivo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
              </ng-container>

              <!-- Acciones Column -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>ACCIONES</th>
                <td mat-cell *matCellDef="let documento; let i = index">
                  <button mat-icon-button color="warn" (click)="eliminarDocumento(i)" matTooltip="ELIMINAR">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button (click)="cancelar()">
        <mat-icon>cancel</mat-icon>
        CANCELAR
      </button>
      <button mat-raised-button color="primary" (click)="guardarCambios()" [disabled]="isGuardando()">
        <mat-icon>save</mat-icon>
        GUARDAR CAMBIOS
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

    .nuevo-documento-section {
      margin-bottom: 32px;
    }

    .nuevo-documento-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .documento-form {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .form-actions button {
      text-transform: uppercase;
      font-weight: 500;
    }

    .documentos-section h3 {
      margin: 0 0 16px 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .empty-documentos {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-documentos mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .table-container {
      overflow-x: auto;
    }

    .documentos-table {
      width: 100%;
    }

    .vencido {
      color: #dc3545;
      font-weight: 600;
    }

    .vigente {
      color: #28a745;
      font-weight: 600;
    }

    .sin-vencimiento {
      color: #666;
      font-style: italic;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .estado-activo {
      background: #d4edda;
      color: #155724;
    }

    .estado-inactivo {
      background: #f8d7da;
      color: #721c24;
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
export class GestionDocumentosModalComponent {
  private dialogRef = inject(MatDialogRef<GestionDocumentosModalComponent>);
  data = inject(MAT_DIALOG_DATA) as GestionDocumentosData;
  private empresaService = inject(EmpresaService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // Signals
  documentos = signal<DocumentoEmpresa[]>([]);
  isGuardando = signal(false);

  // Formulario
  documentoForm!: FormGroup;

  // Columnas de la tabla
  displayedColumns = ['tipo', 'numero', 'fechaEmision', 'fechaVencimiento', 'estado', 'acciones'];

  // Tipos de documento disponibles
  tiposDocumento = Object.values(TipoDocumento);

  constructor() {
    this.documentos.set([...this.data.documentos]);
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.documentoForm = this.fb.group({
      tipo: ['', Validators.required],
      numero: ['', Validators.required],
      fechaEmision: ['', Validators.required],
      fechaVencimiento: [''],
      urlDocumento: [''],
      observaciones: ['']
    });
  }

  getTipoDocumentoDisplayName(tipo: TipoDocumento): string {
    const nombres = {
      [TipoDocumento.RUC]: 'RUC',
      [TipoDocumento.DNI]: 'DNI',
      [TipoDocumento.LICENCIA_CONDUCIR]: 'LICENCIA DE CONDUCIR',
      [TipoDocumento.CERTIFICADO_VEHICULAR]: 'CERTIFICADO VEHICULAR',
      [TipoDocumento.RESOLUCION]: 'RESOLUCIÓN',
      [TipoDocumento.TUC]: 'TUC',
      [TipoDocumento.OTRO]: 'OTRO'
    };
    return nombres[tipo] || tipo;
  }

  getChipColor(tipo: TipoDocumento): string {
    const colores = {
      [TipoDocumento.RUC]: 'primary',
      [TipoDocumento.DNI]: 'accent',
      [TipoDocumento.LICENCIA_CONDUCIR]: 'warn',
      [TipoDocumento.CERTIFICADO_VEHICULAR]: 'primary',
      [TipoDocumento.RESOLUCION]: 'accent',
      [TipoDocumento.TUC]: 'warn',
      [TipoDocumento.OTRO]: 'primary'
    };
    return colores[tipo] || 'primary';
  }

  isDocumentoVencido(documento: DocumentoEmpresa): boolean {
    if (!documento.fechaVencimiento) return false;
    return new Date(documento.fechaVencimiento) < new Date();
  }

  agregarDocumento(): void {
    if (this.documentoForm.invalid) return;

    const nuevoDocumento: DocumentoEmpresa = {
      ...this.documentoForm.value,
      estaActivo: true
    };

    this.documentos.update(docs => [...docs, nuevoDocumento]);
    this.limpiarFormulario();
    this.snackBar.open('Documento agregado correctamente', 'Cerrar', { duration: 2000 });
  }

  eliminarDocumento(index: number): void {
    this.documentos.update(docs => docs.filter((_, i) => i !== index));
    this.snackBar.open('Documento eliminado', 'Cerrar', { duration: 2000 });
  }

  limpiarFormulario(): void {
    this.documentoForm.reset();
  }

  async guardarCambios(): Promise<void> {
    this.isGuardando.set(true);

    try {
      // Aquí se implementaría la lógica para guardar los cambios en el backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      
      this.snackBar.open('Cambios guardados correctamente', 'Cerrar', { duration: 3000 });
      this.dialogRef.close(this.documentos());
    } catch (error) {
      this.snackBar.open('Error al guardar cambios', 'Cerrar', { duration: 3000 });
    } finally {
      this.isGuardando.set(false);
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
} 