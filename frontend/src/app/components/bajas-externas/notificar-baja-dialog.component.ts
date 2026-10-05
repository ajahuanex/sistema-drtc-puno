import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BajaExterna } from '../../services/baja-externa.service';

@Component({
  selector: 'app-notificar-baja-dialog',
  standalone: true,
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="notificar-dialog-root">
      
      <!-- HEADER -->
      <div class="notif-header">
        <div class="notif-icon-box">
          <mat-icon>mark_email_read</mat-icon>
        </div>
        <div>
          <h2 class="notif-title">Marcar como Notificado</h2>
          <p class="notif-subtitle">
            Placa: <strong class="plate-text">{{ data.baja.placa }}</strong> 
            <span class="scope-tag" [class.tag-local]="data.baja.tipo_baja === 'LOCAL'">
              {{ data.baja.tipo_baja === 'LOCAL' ? 'Baja Local' : 'Baja Externa' }}
            </span>
          </p>
        </div>
      </div>

      <p class="notif-description">
        Complete los datos de la notificación emitida para registrar la trazabilidad administrativa oficial.
      </p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="notif-form">
        <div class="fields-stack">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Entidad o Destinatario Notificado</mat-label>
            <input matInput formControlName="entidad_destino" placeholder="Ej: MTC Lima / Gerencia de Transportes">
            <mat-hint>Entidad receptora del oficio o resolución</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>N° Oficio / Documento de Notificación</mat-label>
            <input matInput formControlName="numero_oficio" placeholder="Ej: Oficio N° 089-2025-GR-DRTC/SST">
            <mat-hint>Número de documento con que se notificó</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Observaciones de la Notificación</mat-label>
            <textarea matInput formControlName="observaciones" rows="3" placeholder="Detalle del despacho, acuse de recibo o fecha de notificación..."></textarea>
          </mat-form-field>
        </div>

        <div class="notif-actions">
          <button mat-button type="button" mat-dialog-close>Cancelar</button>
          <button mat-flat-button color="primary" type="submit" class="btn-confirmar">
            <mat-icon>check</mat-icon>
            <span>Confirmar Notificación</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .notificar-dialog-root {
      padding: 1.5rem;
      background: #ffffff;
      border-radius: 14px;
      font-family: inherit;
      min-width: 440px;
      max-width: 520px;
    }

    /* HEADER */
    .notif-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .notif-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #d1fae5;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-icon-box mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .notif-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .notif-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .plate-text {
      color: #4f46e5;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .scope-tag {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      background: #eef2ff;
      color: #3730a3;
    }
    .scope-tag.tag-local {
      background: #fef3c7;
      color: #92400e;
    }

    .notif-description {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.4;
      margin-bottom: 1.25rem;
    }

    /* FORM */
    .notif-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .fields-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .w-full {
      width: 100%;
    }

    /* ACTIONS */
    .notif-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-confirmar {
      height: 38px;
      border-radius: 8px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  `]
})
export class NotificarBajaDialogComponent {
  dialogRef = inject(MatDialogRef<NotificarBajaDialogComponent>);
  data = inject<{ baja: BajaExterna }>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    entidad_destino: [this.data.baja.entidad_destino || (this.data.baja.tipo_baja === 'LOCAL' ? 'Empresa de Transportes / Región' : 'MTC Lima - Dirección de Autorizaciones')],
    numero_oficio: [this.data.baja.numero_oficio || ''],
    observaciones: [this.data.baja.observaciones || '']
  });

  onSubmit() {
    this.dialogRef.close(this.form.value);
  }
}
