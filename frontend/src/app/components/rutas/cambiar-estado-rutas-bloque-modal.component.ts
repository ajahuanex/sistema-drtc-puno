import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RutaService } from '../../services/ruta.service';
import { Ruta, EstadoRuta } from '../../models/ruta.model';
import { forkJoin } from 'rxjs';

export interface CambiarEstadoRutasBloqueData {
  rutas: Ruta[];
}

@Component({
  selector: 'app-cambiar-estado-rutas-bloque-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon color="primary">swap_horiz</mat-icon>
        Cambiar Estado en Bloque
      </h2>
    </div>

    <mat-dialog-content class="modal-content">
      <div class="info-message">
        <p>Cambiar el estado de <strong>{{ (data.rutas)?.length || 0 }}</strong> ruta(s) seleccionada(s).</p>
      </div>

      <form [formGroup]="form" class="estado-form">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Nuevo Estado</mat-label>
          <mat-select formControlName="nuevoEstado" required>
            <mat-option value="ACTIVA">
              <div class="estado-option">
                <mat-icon color="primary">check_circle</mat-icon>
                <span>Activa</span>
              </div>
            </mat-option>
            <mat-option value="INACTIVA">
              <div class="estado-option">
                <mat-icon color="warn">cancel</mat-icon>
                <span>Inactiva</span>
              </div>
            </mat-option>
            <mat-option value="SUSPENDIDA">
              <div class="estado-option">
                <mat-icon color="accent">pause_circle</mat-icon>
                <span>Suspendida</span>
              </div>
            </mat-option>
            <mat-option value="EN_MANTENIMIENTO">
              <div class="estado-option">
                <mat-icon>build</mat-icon>
                <span>En Mantenimiento</span>
              </div>
            </mat-option>
            <mat-option value="ARCHIVADA">
              <div class="estado-option">
                <mat-icon>archive</mat-icon>
                <span>Archivada</span>
              </div>
            </mat-option>
            <mat-option value="DADA_DE_BAJA">
              <div class="estado-option">
                <mat-icon color="warn">delete</mat-icon>
                <span>Dada de Baja</span>
              </div>
            </mat-option>
          </mat-select>
          <mat-hint>Seleccione el nuevo estado para todas las rutas</mat-hint>
        </mat-form-field>
      </form>

      <div class="rutas-preview" *ngIf="data.rutas.length <= 5">
        <h4>Rutas a modificar:</h4>
        <mat-list>
          <mat-list-item *ngFor="let ruta of data.rutas">
            <mat-icon matListItemIcon>route</mat-icon>
            <div matListItemTitle>{{ ruta.codigoRuta }} - {{ ruta.origen }} → {{ ruta.destino }}</div>
            <div matListItemLine>Estado actual: {{ getEstadoLabel(ruta.estado) }}</div>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="rutas-resumen" *ngIf="data.rutas.length > 5">
        <h4>Rutas a modificar ({{ (data.rutas)?.length || 0 }}):</h4>
        <p>Primeras 3 rutas:</p>
        <mat-list>
          <mat-list-item *ngFor="let ruta of data.rutas.slice(0, 3)">
            <mat-icon matListItemIcon>route</mat-icon>
            <div matListItemTitle>{{ ruta.codigoRuta }} - {{ ruta.origen }} → {{ ruta.destino }}</div>
            <div matListItemLine>Estado actual: {{ getEstadoLabel(ruta.estado) }}</div>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>... y {{ data.rutas.length - 3 }} rutas más</span>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="loading-container" *ngIf="procesando()">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Actualizando estados...</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button mat-button (click)="cancelar()" [disabled]="procesando()">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button 
              color="primary" 
              (click)="aplicarCambios()"
              [disabled]="form.invalid || procesando()">
        <mat-icon>save</mat-icon>
        @if (procesando()) {
          Procesando...
        } @else {
          Aplicar Cambios
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      padding: 20px 24px 0;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #1976d2;
        font-weight: 500;
      }
    }

    .modal-content {
      padding: 20px 24px;
      max-height: 500px;
      overflow-y: auto;
    }

    .info-message {
      margin-bottom: 20px;
      
      p {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
    }

    .estado-form {
      margin-bottom: 20px;
      
      .form-field {
        width: 100%;
      }
      
      .estado-option {
        display: flex;
        align-items: center;
        gap: 8px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .rutas-preview,
    .rutas-resumen {
      h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 14px;
        font-weight: 500;
      }
      
      p {
        margin: 8px 0;
        font-size: 13px;
        color: #666;
      }
      
      mat-list {
        padding: 0;
        
        mat-list-item {
          min-height: 56px;
          font-size: 13px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
      
      p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    }

    .modal-actions {
      padding: 12px 24px 20px;
      justify-content: flex-end;
      gap: 12px;
      
      button {
        display: flex;
        align-items: center;
        gap: 8px;
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }
  `]
})
export class CambiarEstadoRutasBloqueModalComponent {
  form: FormGroup;
  procesando = signal(false);

  constructor(
    private dialogRef: MatDialogRef<CambiarEstadoRutasBloqueModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CambiarEstadoRutasBloqueData,
    private fb: FormBuilder,
    private rutaService: RutaService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nuevoEstado: ['', Validators.required]
    });
  }

  getEstadoLabel(estado: EstadoRuta): string {
    const estados: { [key in EstadoRuta]: string } = {
      'ACTIVA': 'Activa',
      'INACTIVA': 'Inactiva',
      'SUSPENDIDA': 'Suspendida',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'ARCHIVADA': 'Archivada',
      'DADA_DE_BAJA': 'Dada de Baja',
      'CANCELADA': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  aplicarCambios(): void {
    if (this.form.invalid) return;

    const nuevoEstado = this.form.value.nuevoEstado as EstadoRuta;
    this.procesando.set(true);

    const actualizaciones = this.data.rutas.map(ruta => 
      this.rutaService.updateRuta(ruta.id, { estado: nuevoEstado })
    );

    forkJoin(actualizaciones).subscribe({
      next: () => {
        this.procesando.set(false);
        this.snackBar.open(
          `Estado actualizado para ${this.data.rutas.length} ruta(s)`, 
          'Cerrar', 
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.procesando.set(false);
        console.error('Error al actualizar estados::', error);
        this.snackBar.open(
          'Error al actualizar algunos estados', 
          'Cerrar', 
          { duration: 3000 }
        );
        this.dialogRef.close(true); // Cerrar de todos modos para refrescar
      }
    });
  }
}