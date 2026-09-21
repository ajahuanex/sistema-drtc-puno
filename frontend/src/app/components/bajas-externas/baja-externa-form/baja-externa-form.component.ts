import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BajaExternaService } from '../../../services/baja-externa.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-baja-externa-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Registrar Baja Externa / Notificación MTC</h2>
    
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="flex flex-col gap-4 pt-2">
        
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Placa del Vehículo</mat-label>
            <input matInput formControlName="placa" placeholder="Ej: ABC-123" uppercase>
            <mat-error *ngIf="form.get('placa')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>RUC Empresa Origen</mat-label>
            <input matInput formControlName="ruc_empresa" maxlength="11">
            <mat-error *ngIf="form.get('ruc_empresa')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Razón Social (Empresa Origen)</mat-label>
          <input matInput formControlName="razon_social">
          <mat-error *ngIf="form.get('razon_social')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Motivo de la Baja</mat-label>
          <mat-select formControlName="motivo">
            <mat-option value="Habilitado en MTC Lima">Habilitado en MTC Lima</mat-option>
            <mat-option value="Habilitado en otra Empresa (Interprovincial)">Habilitado en otra Empresa (Interprovincial)</mat-option>
            <mat-option value="Retiro Voluntario">Retiro Voluntario (Sin resolución)</mat-option>
            <mat-option value="Otros">Otros</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('motivo')?.hasError('required')">Requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones Adicionales</mat-label>
          <textarea matInput formControlName="observaciones" rows="2"></textarea>
        </mat-form-field>

        <div class="file-upload-container p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,image/*" class="hidden">
          
          @if (!selectedFile) {
            <div class="flex flex-col items-center cursor-pointer text-gray-500 hover:text-blue-600" (click)="fileInput.click()">
              <mat-icon class="scale-150 mb-2">cloud_upload</mat-icon>
              <span>Haz clic para subir Evidencia (Captura MTC o PDF)</span>
              <span class="text-xs text-red-500 mt-1">* Requerido</span>
            </div>
          } @else {
            <div class="flex items-center justify-between bg-blue-50 p-2 rounded">
              <div class="flex items-center truncate">
                <mat-icon class="mr-2 text-blue-600">insert_drive_file</mat-icon>
                <span class="truncate max-w-xs">{{ selectedFile.name }}</span>
              </div>
              <button mat-icon-button color="warn" type="button" (click)="removeFile(); fileInput.value=''">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>

      </mat-dialog-content>
      
      <mat-dialog-actions align="end" class="pb-4 pr-4">
        <button mat-button type="button" mat-dialog-close [disabled]="submitting">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || !selectedFile || submitting">
          <mat-icon *ngIf="submitting" class="animate-spin">sync</mat-icon>
          Guardar Registro
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class BajaExternaFormComponent {
  private fb = inject(FormBuilder);
  private bajaService = inject(BajaExternaService);
  private dialogRef = inject(MatDialogRef<BajaExternaFormComponent>);
  private snackBar = inject(MatSnackBar);

  submitting = false;
  selectedFile: File | null = null;

  form = this.fb.group({
    placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{6,8}$/i)]],
    ruc_empresa: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    razon_social: ['', Validators.required],
    motivo: ['', Validators.required],
    observaciones: ['']
  });

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        this.snackBar.open('El archivo no debe superar los 5MB', 'Cerrar', { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.form.invalid || !this.selectedFile) return;

    this.submitting = true;
    const formData = new FormData();
    formData.append('placa', this.form.value.placa!);
    formData.append('ruc_empresa', this.form.value.ruc_empresa!);
    formData.append('razon_social', this.form.value.razon_social!);
    formData.append('motivo', this.form.value.motivo!);
    if (this.form.value.observaciones) {
      formData.append('observaciones', this.form.value.observaciones);
    }
    formData.append('archivo', this.selectedFile);

    this.bajaService.registrarBaja(formData).subscribe({
      next: () => {
        this.snackBar.open('Baja externa registrada correctamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al registrar la baja', 'Cerrar', { duration: 3000 });
        this.submitting = false;
      }
    });
  }
}
