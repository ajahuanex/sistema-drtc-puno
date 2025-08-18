import { Component, OnInit, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RutaFormSharedComponent, RutaFormData } from '../../shared/ruta-form-shared.component';
import { Ruta } from '../../models/ruta.model';
import { Empresa } from '../../models/empresa.model';
import { Resolucion } from '../../models/resolucion.model';

@Component({
  selector: 'app-ruta-form',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RutaFormSharedComponent
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <h1>{{ isEditing() ? 'Editar Ruta' : 'Nueva Ruta' }}</h1>
          <p class="header-subtitle">Gestión de rutas de transporte</p>
        </div>
        <div class="header-actions">
          <button mat-button color="accent" (click)="volver()" class="action-button">
            <mat-icon>arrow_back</mat-icon>
            Volver
          </button>
        </div>
      </div>
    </div>

    <app-ruta-form-shared 
      [formData]="formData"
      (rutaCreada)="onRutaCreada($event)"
      (rutaActualizada)="onRutaActualizada($event)"
      (cancelado)="onCancelado()">
    </app-ruta-form-shared>
  `,
  styles: [`
    .page-header {
      padding: 20px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-title h1 {
      margin: 0;
      color: #333;
      font-size: 28px;
      font-weight: 600;
    }

    .header-subtitle {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
    }
  `]
})
export class RutaFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Inputs para reutilización
  @Input() empresa?: Empresa;
  @Input() resolucion?: Resolucion;
  @Input() modoModal: boolean = false;

  // Outputs para reutilización
  @Output() rutaCreada = new EventEmitter<Ruta>();
  @Output() rutaActualizada = new EventEmitter<Ruta>();
  @Output() cancelado = new EventEmitter<void>();

  // Datos para el formulario compartido
  formData: RutaFormData = {};

  ngOnInit() {
    // Inicializar datos del formulario
    this.formData.modoModal = this.modoModal;
    
    // Si se proporcionan empresa y resolución, usarlas
    if (this.empresa) {
      this.formData.empresa = this.empresa;
    }
    
    if (this.resolucion) {
      this.formData.resolucion = this.resolucion;
    }
  }

  isEditing(): boolean {
    return false; // Este componente solo se usa para crear
  }

  volver(): void {
    this.router.navigate(['/rutas']);
  }

  onRutaCreada(ruta: Ruta): void {
    // Redirigir a la lista de rutas o mostrar mensaje de éxito
    this.router.navigate(['/rutas']);
  }

  onRutaActualizada(ruta: Ruta): void {
    // Redirigir a la lista de rutas o mostrar mensaje de éxito
    this.router.navigate(['/rutas']);
  }

  onCancelado(): void {
    this.router.navigate(['/rutas']);
  }
} 