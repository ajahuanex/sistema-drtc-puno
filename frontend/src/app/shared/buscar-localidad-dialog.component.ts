import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalidadService } from '../services/localidad.service';
import { Localidad } from '../models/localidad.model';

@Component({
  selector: 'app-buscar-localidad-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>search</mat-icon>
      Buscar Localidad
    </h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar localidad</mat-label>
        <input matInput 
               [formControl]="searchControl"
               placeholder="Escribe el nombre de la localidad..."
               autofocus>
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (buscando) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Buscando...</p>
        </div>
      }

      @if (!buscando && resultados.length > 0) {
        <div class="resultados">
          @for (localidad of resultados; track localidad.id) {
            <div class="resultado-item" (click)="seleccionar(localidad)">
              <div class="nombre-container">
                <div class="nombre">{{ localidad.nombre }}</div>
                <span class="tipo-badge" [class]="'tipo-' + getTipoClase(localidad.tipo)">
                  {{ getTipoLabel(localidad.tipo) }}
                </span>
              </div>
              <div class="ubicacion">
                {{ getUbicacion(localidad) }}
              </div>
            </div>
          }
        </div>
      }

      @if (!buscando && searchControl.value && searchControl.value.length >= 2 && resultados.length === 0) {
        <div class="no-results">
          <mat-icon>search_off</mat-icon>
          <p>No se encontraron localidades</p>
        </div>
      }

      @if (!searchControl.value || searchControl.value.length < 2) {
        <div class="hint">
          <mat-icon>info</mat-icon>
          <p>Escribe al menos 2 caracteres para buscar</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
    }

    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
      min-height: 300px;
      padding: 20px;
    }

    .search-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }

    .loading p {
      margin-top: 16px;
    }

    .resultados {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .resultado-item {
      padding: 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
    }

    .resultado-item:hover {
      background: #e3f2fd;
    }

    .resultado-item:last-child {
      border-bottom: none;
    }

    .nombre-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .nombre {
      font-weight: 500;
      font-size: 16px;
      color: #333;
    }

    .tipo-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tipo-badge.tipo-distrito {
      background: #e3f2fd;
      color: #1976d2;
    }

    .tipo-badge.tipo-provincia {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .tipo-badge.tipo-departamento {
      background: #fff3e0;
      color: #f57c00;
    }

    .tipo-badge.tipo-centro-poblado {
      background: #e8f5e9;
      color: #388e3c;
    }

    .tipo-badge.tipo-ciudad {
      background: #fce4ec;
      color: #c2185b;
    }

    .tipo-badge.tipo-pueblo,
    .tipo-badge.tipo-localidad {
      background: #f5f5f5;
      color: #616161;
    }

    .ubicacion {
      font-size: 14px;
      color: #666;
    }

    .no-results, .hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #999;
      text-align: center;
    }

    .no-results mat-icon, .hint mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .hint {
      color: #666;
    }

    .hint mat-icon {
      color: #1976d2;
    }
  `]
})
export class BuscarLocalidadDialogComponent implements OnInit {
  searchControl = new FormControl('');
  resultados: Localidad[] = [];
  buscando = false;

  constructor(
    private dialogRef: MatDialogRef<BuscarLocalidadDialogComponent>,
    private localidadService: LocalidadService
  ) {}

  ngOnInit() {
    this.searchControl.valueChanges.subscribe(async (termino) => {
      if (!termino || termino.length < 2) {
        this.resultados = [];
        return;
      }

      this.buscando = true;
      try {
        this.resultados = await this.localidadService.buscarLocalidades(termino, 30);
      } catch (error) {
        console.error('Error buscando localidades:', error);
        this.resultados = [];
      } finally {
        this.buscando = false;
      }
    });
  }

  seleccionar(localidad: Localidad) {
    this.dialogRef.close(localidad);
  }

  getTipoLabel(tipo: string): string {
    const labels: { [key: string]: string } = {
      'DISTRITO': 'Distrito',
      'PROVINCIA': 'Provincia',
      'DEPARTAMENTO': 'Departamento',
      'CENTRO_POBLADO': 'C. Poblado',
      'CIUDAD': 'Ciudad',
      'PUEBLO': 'Pueblo',
      'LOCALIDAD': 'Localidad'
    };
    return labels[tipo] || tipo;
  }

  getTipoClase(tipo: string): string {
    return tipo.toLowerCase().replace(/_/g, '-');
  }

  getUbicacion(localidad: Localidad): string {
    const partes: string[] = [];

    // Según el tipo, mostrar solo lo que NO es la localidad misma
    switch (localidad.tipo) {
      case 'DEPARTAMENTO':
        // Si es departamento, no mostrar nada más (es el nivel más alto)
        break;

      case 'PROVINCIA':
        // Si es provincia, mostrar solo el departamento
        if (localidad.departamento) {
          partes.push(localidad.departamento);
        }
        break;

      case 'DISTRITO':
        // Si es distrito, mostrar provincia y departamento
        if (localidad.provincia) {
          partes.push(localidad.provincia);
        }
        if (localidad.departamento) {
          partes.push(localidad.departamento);
        }
        break;

      case 'CENTRO_POBLADO':
      case 'PUEBLO':
      case 'CIUDAD':
      case 'LOCALIDAD':
      default:
        // Para localidades menores, mostrar distrito, provincia y departamento
        if (localidad.distrito) {
          partes.push(localidad.distrito);
        }
        if (localidad.provincia) {
          partes.push(localidad.provincia);
        }
        if (localidad.departamento) {
          partes.push(localidad.departamento);
        }
        break;
    }

    return partes.length > 0 ? partes.join(', ') : 'Sin ubicación';
  }
}
