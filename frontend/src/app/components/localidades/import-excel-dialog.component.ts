import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalidadService } from '../../services/localidad.service';

@Component({
  selector: 'app-import-excel-dialog',
  templateUrl: './import-excel-dialog.component.html',
  styleUrls: ['./import-excel-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ImportExcelDialogComponent {
  selectedFile: File | null = null;
  loading = false;
  dragOver = false;

  constructor(
    private localidadService: LocalidadService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ImportExcelDialogComponent>
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  private validateAndSetFile(file: File): void {
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      this.snackBar.open('Por favor seleccione un archivo Excel (.xlsx o .xls)', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('El archivo es demasiado grande (máximo 10MB)', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.selectedFile = file;
  }

  async importar(): Promise<void> {
    if (!this.selectedFile) {
      this.snackBar.open('Por favor seleccione un archivo', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    this.loading = true;

    try {
      const result = await this.localidadService.importarExcel(this.selectedFile);
      
      // Mostrar resultado
      let mensaje = `Importación completada: ${result.localidades_creadas} localidades creadas`;
      
      if (result.total_errores > 0) {
        mensaje += `, ${result.total_errores} errores`;
      }

      this.snackBar.open(mensaje, 'Cerrar', {
        duration: 5000,
        panelClass: result.total_errores > 0 ? ['snackbar-warning'] : ['snackbar-success']
      });

      // Mostrar errores si los hay
      if (result.errores && result.errores.length > 0) {
        // console.log removed for production
      }

      this.dialogRef.close(true);

    } catch (error: any) {
      console.error('Error importando archivo::', error);
      this.snackBar.open(
        error.error?.detail || 'Error importando archivo', 
        'Cerrar', 
        { duration: 5000, panelClass: ['snackbar-error'] }
      );
    } finally {
      this.loading = false;
    }
  }

  async descargarPlantilla(): Promise<void> {
    try {
      // Crear plantilla de ejemplo
      const plantilla = this.crearPlantillaEjemplo();
      this.descargarArchivo(plantilla, 'plantilla_localidades.csv');
      
      this.snackBar.open('Plantilla descargada exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });
    } catch (error) {
      console.error('Error descargando plantilla::', error);
      this.snackBar.open('Error descargando plantilla', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }

  private crearPlantillaEjemplo(): string {
    const headers = [
      'departamento',
      'provincia', 
      'distrito',
      'municipalidad_centro_poblado',
      'nivel_territorial',
      'ubigeo',
      'ubigeo_identificador_mcp',
      'dispositivo_legal_creacion',
      'nombre',
      'codigo',
      'tipo',
      'descripcion',
      'observaciones',
      'latitud',
      'longitud'
    ];

    const ejemplos = [
      [
        'PUNO',
        'PUNO',
        'PUNO',
        'Municipalidad Provincial de Puno',
        'DISTRITO',
        '210101',
        '210101-MCP-001',
        'Ley N° 27972 - Ley Orgánica de Municipalidades',
        'Puno',
        'PUN001',
        'CIUDAD',
        'Capital del departamento de Puno',
        'Ciudad a orillas del Lago Titicaca',
        '-15.8402',
        '-70.0219'
      ],
      [
        'PUNO',
        'SAN ROMAN',
        'JULIACA',
        'Municipalidad Provincial de San Román',
        'DISTRITO',
        '211301',
        '211301-MCP-001',
        'Ley N° 27972 - Ley Orgánica de Municipalidades',
        'Juliaca',
        'JUL001',
        'CIUDAD',
        'Ciudad comercial importante',
        'Centro comercial del altiplano',
        '-15.5000',
        '-70.1333'
      ]
    ];

    let csv = headers.join(',') + '\n';
    ejemplos.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    return csv;
  }

  private descargarArchivo(contenido: string, nombreArchivo: string): void {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (typeof link.download !== "undefined") {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}