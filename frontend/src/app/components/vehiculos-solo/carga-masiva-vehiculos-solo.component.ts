import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-carga-masiva-vehiculos-solo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>upload_file</mat-icon>
            Carga Masiva de Vehículos
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (loading()) {
            <div class="loading">
              <mat-spinner></mat-spinner>
              <p>{{ mensajeCarga() }}</p>
            </div>
          } @else {
            <div class="upload-section">
              <div class="instructions">
                <h3>Instrucciones:</h3>
                <ol>
                  <li>Descarga la plantilla Excel</li>
                  <li>Completa los datos de los vehículos</li>
                  <li>Sube el archivo completado</li>
                </ol>
                <p><strong>Campos requeridos:</strong> Placa</p>
                <p><strong>Campos opcionales:</strong> VIN, Marca, Modelo, Año, Color, Categoría, etc.</p>
              </div>

              <div class="actions">
                <button mat-raised-button color="accent" (click)="descargarPlantilla()">
                  <mat-icon>download</mat-icon>
                  Descargar Plantilla
                </button>

                <input #fileInput type="file" accept=".xlsx,.xls" 
                       (change)="onFileSelected($event)" style="display: none">
                <button mat-raised-button color="primary" (click)="fileInput.click()">
                  <mat-icon>upload</mat-icon>
                  Seleccionar Archivo
                </button>
              </div>

              @if (archivoSeleccionado()) {
                <div class="file-info">
                  <mat-icon>description</mat-icon>
                  <span>{{ archivoSeleccionado()?.name }}</span>
                  <button mat-icon-button (click)="limpiarArchivo()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <button mat-raised-button color="primary" (click)="cargarArchivo()" 
                        class="upload-button">
                  <mat-icon>cloud_upload</mat-icon>
                  Cargar Vehículos
                </button>
              }

              @if (resultado()) {
                <div class="resultado" [class.success]="resultado()?.exitosos > 0" 
                     [class.error]="resultado()?.errores > 0">
                  <h3>Resultado de la Carga:</h3>
                  <p><strong>Exitosos:</strong> {{ resultado()?.exitosos || 0 }}</p>
                  <p><strong>Errores:</strong> {{ resultado()?.errores || 0 }}</p>
                  @if (resultado()?.detalles) {
                    <div class="detalles">
                      <h4>Detalles:</h4>
                      <ul>
                        @for (detalle of resultado()?.detalles; track $index) {
                          <li>{{ detalle }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <div class="footer-actions">
            <button mat-button (click)="volver()">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 20px;
    }

    .upload-section {
      padding: 20px 0;
    }

    .instructions {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .instructions h3 {
      margin-top: 0;
    }

    .instructions ol {
      margin: 15px 0;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin: 30px 0;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      background: #e3f2fd;
      border-radius: 8px;
      margin: 20px 0;
    }

    .upload-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .resultado {
      margin-top: 30px;
      padding: 20px;
      border-radius: 8px;
    }

    .resultado.success {
      background: #e8f5e9;
      border: 2px solid #4caf50;
    }

    .resultado.error {
      background: #ffebee;
      border: 2px solid #f44336;
    }

    .detalles {
      margin-top: 15px;
    }

    .detalles ul {
      max-height: 200px;
      overflow-y: auto;
    }

    .footer-actions {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class CargaMasivaVehiculosSoloComponent {
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  loading = signal<boolean>(false);
  mensajeCarga = signal<string>('');
  archivoSeleccionado = signal<File | null>(null);
  resultado = signal<any>(null);

  private apiUrl = `${environment.apiUrl}/vehiculos-solo`;

  descargarPlantilla(): void {
    this.loading.set(true);
    this.mensajeCarga.set('Descargando plantilla...');

    this.http.get(`${this.apiUrl}/plantilla`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_vehiculos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading.set(false);
        this.snackBar.open('Plantilla descargada', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error descargando plantilla:', error);
        this.snackBar.open('Error al descargar plantilla', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file);
      this.resultado.set(null);
    }
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.resultado.set(null);
  }

  cargarArchivo(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) return;

    this.loading.set(true);
    this.mensajeCarga.set('Procesando archivo...');

    const formData = new FormData();
    formData.append('file', archivo);

    this.http.post(`${this.apiUrl}/carga-masiva`, formData).subscribe({
      next: (response: any) => {
        this.resultado.set(response);
        this.loading.set(false);
        
        if (response.exitosos > 0) {
          this.snackBar.open(
            `${response.exitosos} vehículos cargados exitosamente`,
            'Cerrar',
            { duration: 5000 }
          );
        }
      },
      error: (error) => {
        console.error('Error en carga masiva:', error);
        this.snackBar.open('Error al procesar el archivo', 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/vehiculos-solo']);
  }
}
