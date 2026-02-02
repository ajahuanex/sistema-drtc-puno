import { Component, EventEmitter, Input, Output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { ArchivoSustentatorio, CategoriaArchivo } from '../models/historial-transferencia-empresa.model';
import { ArchivoService, ArchivoSubida } from '../services/archivo.service';

@Component({
  selector: 'app-archivo-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule
  ],
  template: `
    <div class="archivo-upload-container">
      <!-- Área de subida -->
      <div class="upload-area" 
           (click)="fileInput.click()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           [class.drag-over]="dragOver()">
        
        <input #fileInput 
               type="file" 
               multiple 
               (change)="onFileSelected($event)"
               accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
               style="display: none;">
        
        <div class="upload-content">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <h3>SUBIR ARCHIVOS SUSTENTATORIOS</h3>
          <p>Arrastra archivos aquí o haz clic para seleccionar</p>
          <p class="upload-hint">
            Tipos permitidos: PDF, Word, Excel, Imágenes (máx. 10MB)
          </p>
        </div>
      </div>

      <!-- Lista de archivos seleccionados -->
      @if (archivosSeleccionados().length > 0) {
        <div class="archivos-lista">
          <h4>ARCHIVOS SELECCIONADOS ({{ (archivosSeleccionados())?.length || 0 }})</h4>
          
          @for (archivo of archivosSeleccionados(); track archivo.file.name) {
            <div class="archivo-item" [class.error]="archivo.error">
              <div class="archivo-info">
                <div class="archivo-header">
                  <mat-icon class="archivo-icon">
                    {{ obtenerIconoArchivo(archivo.file.type) }}
                  </mat-icon>
                  <div class="archivo-details">
                    <span class="archivo-nombre">{{ archivo.file.name }}</span>
                    <span class="archivo-tamano">{{ formatearTamano(archivo.file.size) }}</span>
                  </div>
                </div>

                <div class="archivo-form">
                  <mat-form-field appearance="outline" class="categoria-field">
                    <mat-label>CATEGORÍA</mat-label>
                    <mat-select [(ngModel)]="archivo.categoria">
                      @for (categoria of categorias; track categoria) {
                        <mat-option [value]="categoria">
                          {{ obtenerNombreCategoria(categoria) }}
                        </mat-option>
                      }
                    </mat-select>
                    <mat-icon matSuffix>{{ obtenerIconoCategoria(archivo.categoria) }}</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="descripcion-field">
                    <mat-label>DESCRIPCIÓN</mat-label>
                    <input matInput [(ngModel)]="archivo.descripcion" 
                           placeholder="Descripción del archivo...">
                    <mat-icon matSuffix>description</mat-icon>
                  </mat-form-field>
                </div>

                @if (archivo.error) {
                  <div class="archivo-error">
                    <mat-icon>error</mat-icon>
                    <span>{{ archivo.error }}</span>
                  </div>
                }

                @if (typeof archivo.progreso !== "undefined") {
                  <div class="archivo-progreso">
                    <mat-progress-bar 
                      [value]="archivo.progreso" 
                      [color]="archivo.estado === 'error' ? 'warn' : 'primary'">
                    </mat-progress-bar>
                    <span class="progreso-texto">
                      @if (archivo.estado === 'pendiente') {
                        PENDIENTE
                      } @else if (archivo.estado === 'subiendo') {
                        SUBIENDO... {{ archivo.progreso }}%
                      } @else if (archivo.estado === 'completado') {
                        COMPLETADO ✅
                      } @else if (archivo.estado === 'error') {
                        ERROR ❌
                      }
                    </span>
                  </div>
                }
              </div>

              <div class="archivo-actions">
                <button mat-icon-button 
                        [matMenuTriggerFor]="menu"
                        color="primary">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="eliminarArchivo(archivo)">
                    <mat-icon>delete</mat-icon>
                    ELIMINAR
                  </button>
                  @if (archivo.estado === 'error') {
                    <button mat-menu-item (click)="reintentarArchivo(archivo)">
                      <mat-icon>refresh</mat-icon>
                      REINTENTAR
                    </button>
                  }
                </mat-menu>
              </div>
            </div>
          }
        </div>
      }

      <!-- Botones de acción -->
      @if (archivosSeleccionados().length > 0) {
        <div class="upload-actions">
          <button mat-button 
                  (click)="limpiarArchivos()"
                  [disabled]="subiendo()">
            <mat-icon>clear</mat-icon>
            LIMPIAR TODO
          </button>
          
          <button mat-raised-button 
                  color="primary" 
                  (click)="subirArchivos()"
                  [disabled]="!puedeSubir() || subiendo()">
            @if (subiendo()) {
              <mat-spinner diameter="20"></mat-spinner>
              SUBIENDO...
            } @else {
              <ng-container>
                <mat-icon>cloud_upload</mat-icon>
                SUBIR ARCHIVOS
              </ng-container>
            }
          </button>
        </div>
      }

      <!-- Lista de archivos ya subidos -->
      @if (archivosSubidos().length > 0) {
        <div class="archivos-subidos">
          <h4>ARCHIVOS SUBIDOS ({{ (archivosSubidos())?.length || 0 }})</h4>
          
          @for (archivo of archivosSubidos(); track archivo.id) {
            <div class="archivo-subido-item">
              <div class="archivo-info">
                <mat-icon class="archivo-icon">
                  {{ obtenerIconoCategoria(archivo.categoria) }}
                </mat-icon>
                <div class="archivo-details">
                  <span class="archivo-nombre">{{ archivo.nombre }}</span>
                  <span class="archivo-categoria">{{ obtenerNombreCategoria(archivo.categoria) }}</span>
                  @if (archivo.descripcion) {
                    <span class="archivo-descripcion">{{ archivo.descripcion }}</span>
                  }
                  <span class="archivo-fecha">{{ archivo.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="archivo-actions">
                <button mat-icon-button 
                        (click)="descargarArchivo(archivo)"
                        color="primary"
                        matTooltip="Descargar archivo">
                  <mat-icon>download</mat-icon>
                </button>
                <button mat-icon-button 
                        (click)="eliminarArchivoSubido(archivo)"
                        color="warn"
                        matTooltip="Eliminar archivo">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./archivo-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivoUploadComponent {
  private archivoService = inject(ArchivoService);
  private snackBar = inject(MatSnackBar);

  @Input() archivosExistentes: ArchivoSustentatorio[] = [];
  @Output() archivosSubidosChange = new EventEmitter<ArchivoSustentatorio[]>();

  // Signals
  archivosSeleccionados = signal<ArchivoSubida[]>([]);
  archivosSubidos = signal<ArchivoSustentatorio[]>([]);
  dragOver = signal(false);
  subiendo = signal(false);

  // Categorías disponibles
  categorias: CategoriaArchivo[] = this.archivoService.obtenerCategorias();

  ngOnInit(): void {
    this.archivosSubidos.set(this.archivosExistentes || []);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.procesarArchivos(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      this.procesarArchivos(Array.from(files));
    }
  }

  private procesarArchivos(files: File[]): void {
    const archivosValidos: ArchivoSubida[] = [];

    files.forEach(file => {
      const validacion: { valido: boolean; mensaje?: string } = this.archivoService.validarTipoArchivo(file);
      
      if (validacion.valido) {
        archivosValidos.push({
          file,
          categoria: CategoriaArchivo.OTRO,
          estado: 'pendiente'
        });
      } else {
        this.snackBar.open(`Error en ${file.name}: ${validacion.mensaje}`, 'Cerrar', { duration: 5000 });
      }
    });

    if (archivosValidos.length > 0) {
      const archivosActuales = this.archivosSeleccionados();
      this.archivosSeleccionados.set([...archivosActuales, ...archivosValidos]);
    }
  }

  eliminarArchivo(archivo: ArchivoSubida): void {
    const archivosActuales = this.archivosSeleccionados();
    const archivosFiltrados = archivosActuales.filter(a => a.file.name !== archivo.file.name);
    this.archivosSeleccionados.set(archivosFiltrados);
  }

  reintentarArchivo(archivo: ArchivoSubida): void {
    archivo.estado = 'pendiente';
    archivo.error = undefined;
    archivo.progreso = undefined;
  }

  limpiarArchivos(): void {
    this.archivosSeleccionados.set([]);
  }

  puedeSubir(): boolean {
    return this.archivosSeleccionados().length > 0 && 
           this.archivosSeleccionados().every(a => !a.error);
  }

  subirArchivos(): void {
    if (!this.puedeSubir()) return;

    this.subiendo.set(true);
    const archivos = this.archivosSeleccionados();

    this.archivoService.subirArchivos(archivos).subscribe({
      next: (archivosSubidos: ArchivoSustentatorio[]) => {
        // Agregar a la lista de archivos subidos
        const archivosActuales = this.archivosSubidos();
        this.archivosSubidos.set([...archivosActuales, ...archivosSubidos]);
        
        // Limpiar archivos seleccionados
        this.archivosSeleccionados.set([]);
        
        // Emitir cambio
        this.archivosSubidosChange.emit(this.archivosSubidos());
        
        this.snackBar.open(
          `${archivosSubidos.length} archivo(s) subido(s) exitosamente`, 
          'Cerrar', 
          { duration: 3000 }
        );
        
        this.subiendo.set(false);
      },
      error: (error: any) => {
        console.error('Error al subir archivos::', error);
        this.snackBar.open('Error al subir archivos', 'Cerrar', { duration: 5000 });
        this.subiendo.set(false);
      }
    });
  }

  descargarArchivo(archivo: ArchivoSustentatorio): void {
    this.archivoService.descargarArchivo(archivo).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = archivo.nombre;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error al descargar archivo::', error);
        this.snackBar.open('Error al descargar archivo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarArchivoSubido(archivo: ArchivoSustentatorio): void {
    this.archivoService.eliminarArchivo(archivo.id).subscribe({
      next: () => {
        const archivosActuales = this.archivosSubidos();
        const archivosFiltrados = archivosActuales.filter(a => a.id !== archivo.id);
        this.archivosSubidos.set(archivosFiltrados);
        
        this.archivosSubidosChange.emit(this.archivosSubidos());
        
        this.snackBar.open('Archivo eliminado exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (error: any) => {
        console.error('Error al eliminar archivo::', error);
        this.snackBar.open('Error al eliminar archivo', 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Métodos de utilidad
  obtenerIconoArchivo(tipo: string): string {
    if (tipo.includes('pdf')) return 'picture_as_pdf';
    if (tipo.includes('word')) return 'description';
    if (tipo.includes('excel')) return 'table_chart';
    if (tipo.includes('image')) return 'image';
    return 'attach_file';
  }

  obtenerIconoCategoria(categoria: any): string {
    return this.archivoService.obtenerIconoCategoria(categoria as CategoriaArchivo);
  }

  obtenerNombreCategoria(categoria: any): string {
    return this.archivoService.obtenerNombreCategoria(categoria as CategoriaArchivo);
  }

  formatearTamano(bytes: number): string {
    return this.archivoService.formatearTamanoArchivo(bytes);
  }
} 