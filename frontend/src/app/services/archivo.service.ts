import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArchivoSustentatorio, CategoriaArchivo } from '../models/historial-transferencia-empresa.model';

export interface ArchivoSubida {
  file: File;
  descripcion?: string;
  categoria: CategoriaArchivo;
  progreso?: number;
  estado: 'pendiente' | 'subiendo' | 'completado' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/archivos`;

  // Estado de subida
  private archivosSubiendoSubject = new BehaviorSubject<ArchivoSubida[]>([]);
  archivosSubiendo = this.archivosSubiendoSubject.asObservable();

  /**
   * Sube un archivo al servidor
   */
  subirArchivo(
    file: File, 
    descripcion?: string, 
    categoria: CategoriaArchivo = CategoriaArchivo.OTRO
  ): Observable<ArchivoSustentatorio> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('descripcion', descripcion || '');
    formData.append('categoria', categoria);

    // Agregar a la lista de archivos subiendo
    const archivoSubida: ArchivoSubida = {
      file,
      descripcion,
      categoria,
      estado: 'pendiente'
    };
    this.agregarArchivoSubiendo(archivoSubida);

    return new Observable(observer => {
      this.http.post<ArchivoSustentatorio>(`${this.apiUrl}/subir`, formData, {
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            this.actualizarProgresoArchivo(file.name, progress);
          } else if (event.type === HttpEventType.Response) {
            const archivo = event.body as ArchivoSustentatorio;
            this.marcarArchivoCompletado(file.name, archivo);
            observer.next(archivo);
            observer.complete();
          }
        },
        error: (error: any) => {
          this.marcarArchivoError(file.name, error.message || 'Error al subir archivo');
          observer.error(error);
        }
      });
    });
  }

  /**
   * Sube múltiples archivos
   */
  subirArchivos(archivos: ArchivoSubida[]): Observable<ArchivoSustentatorio[]> {
    const observables = archivos.map(archivo => 
      this.subirArchivo(archivo.file, archivo.descripcion, archivo.categoria)
    );

    return new Observable(observer => {
      const resultados: ArchivoSustentatorio[] = [];
      let completados = 0;

      observables.forEach((observable, index) => {
        observable.subscribe({
          next: (archivo: ArchivoSustentatorio) => {
            resultados[index] = archivo;
            completados++;

            if (completados === archivos.length) {
              observer.next(resultados);
              observer.complete();
            }
          },
          error: (error: any) => {
            observer.error(error);
          }
        });
      });
    });
  }

  /**
   * Obtiene un archivo por ID
   */
  obtenerArchivo(id: string): Observable<ArchivoSustentatorio> {
    return this.http.get<ArchivoSustentatorio>(`${this.apiUrl}/${id}`);
  }

  /**
   * Descarga un archivo
   */
  descargarArchivo(archivo: ArchivoSustentatorio): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${archivo.id}/descargar`, {
      responseType: 'blob'
    });
  }

  /**
   * Elimina un archivo
   */
  eliminarArchivo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene las categorías de archivos disponibles
   */
  obtenerCategorias(): CategoriaArchivo[] {
    return Object.values(CategoriaArchivo);
  }

  /**
   * Obtiene el nombre legible de una categoría
   */
  obtenerNombreCategoria(categoria: CategoriaArchivo): string {
    const nombres: Record<CategoriaArchivo, string> = {
      [CategoriaArchivo.RESOLUCION]: 'Resolución',
      [CategoriaArchivo.CONTRATO]: 'Contrato',
      [CategoriaArchivo.FACTURA]: 'Factura',
      [CategoriaArchivo.RECIBO]: 'Recibo',
      [CategoriaArchivo.AUTORIZACION]: 'Autorización',
      [CategoriaArchivo.INSPECCION]: 'Inspección',
      [CategoriaArchivo.OTRO]: 'Otro'
    };
    return nombres[categoria] || categoria;
  }

  /**
   * Obtiene el icono para una categoría
   */
  obtenerIconoCategoria(categoria: CategoriaArchivo): string {
    const iconos: Record<CategoriaArchivo, string> = {
      [CategoriaArchivo.RESOLUCION]: 'description',
      [CategoriaArchivo.CONTRATO]: 'assignment',
      [CategoriaArchivo.FACTURA]: 'receipt',
      [CategoriaArchivo.RECIBO]: 'receipt_long',
      [CategoriaArchivo.AUTORIZACION]: 'verified',
      [CategoriaArchivo.INSPECCION]: 'search',
      [CategoriaArchivo.OTRO]: 'attach_file'
    };
    return iconos[categoria] || 'attach_file';
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Valida el tipo de archivo
   */
  validarTipoArchivo(file: File): { valido: boolean; mensaje?: string } {
    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!tiposPermitidos.includes(file.type)) {
      return {
        valido: false,
        mensaje: 'Tipo de archivo no permitido. Solo se permiten PDF, imágenes, Word y Excel.'
      };
    }

    const tamanoMaximo = 10 * 1024 * 1024; // 10MB
    if (file.size > tamanoMaximo) {
      return {
        valido: false,
        mensaje: 'El archivo es demasiado grande. Tamaño máximo: 10MB.'
      };
    }

    return { valido: true };
  }

  // Métodos privados para manejo del estado de subida
  private agregarArchivoSubiendo(archivo: ArchivoSubida): void {
    const archivosActuales = this.archivosSubiendoSubject.value;
    this.archivosSubiendoSubject.next([...archivosActuales, archivo]);
  }

  private actualizarProgresoArchivo(nombreArchivo: string, progreso: number): void {
    const archivosActuales = this.archivosSubiendoSubject.value;
    const archivosActualizados = archivosActuales.map(archivo => 
      archivo.file.name === nombreArchivo 
        ? { ...archivo, progreso, estado: 'subiendo' as const }
        : archivo
    );
    this.archivosSubiendoSubject.next(archivosActualizados);
  }

  private marcarArchivoCompletado(nombreArchivo: string, archivoResultado: ArchivoSustentatorio): void {
    const archivosActuales = this.archivosSubiendoSubject.value;
    const archivosActualizados = archivosActuales.map(archivo => 
      archivo.file.name === nombreArchivo 
        ? { ...archivo, estado: 'completado' as const, progreso: 100 }
        : archivo
    );
    this.archivosSubiendoSubject.next(archivosActualizados);
  }

  private marcarArchivoError(nombreArchivo: string, error: string): void {
    const archivosActuales = this.archivosSubiendoSubject.value;
    const archivosActualizados = archivosActuales.map(archivo => 
      archivo.file.name === nombreArchivo 
        ? { ...archivo, estado: 'error' as const, error }
        : archivo
    );
    this.archivosSubiendoSubject.next(archivosActualizados);
  }

  /**
   * Limpia la lista de archivos subiendo
   */
  limpiarArchivosSubiendo(): void {
    this.archivosSubiendoSubject.next([]);
  }
} 