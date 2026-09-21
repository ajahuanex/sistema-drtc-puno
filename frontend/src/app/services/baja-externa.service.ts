import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface BajaExterna {
  id?: string;
  placa: string;
  ruc_empresa: string;
  razon_social: string;
  motivo: string;
  observaciones?: string;
  archivo_evidencia?: string;
  estado_notificacion?: 'PENDIENTE' | 'NOTIFICADO';
  fecha_registro?: string;
  fecha_notificacion?: string;
  registrado_por?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BajaExternaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bajas`;

  // Signals para estado
  bajas = signal<BajaExterna[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Obtiene la lista de bajas, opcionalmente filtrada por estado
   */
  loadBajas(estado?: 'PENDIENTE' | 'NOTIFICADO'): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }

    this.http.get<BajaExterna[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.bajas.set(data);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('Error cargando bajas externas', err);
        this.error.set('No se pudo cargar la lista de notificaciones externas.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Registra una nueva baja externa enviando FormData (incluyendo archivo)
   */
  registrarBaja(formData: FormData): Observable<BajaExterna> {
    return this.http.post<BajaExterna>(this.apiUrl, formData).pipe(
      tap((nuevaBaja) => {
        // Actualizar el signal con el nuevo registro al inicio
        this.bajas.update(current => [nuevaBaja, ...current]);
      })
    );
  }

  /**
   * Marca una baja como notificada
   */
  notificarBaja(id: string, observaciones?: string): Observable<BajaExterna> {
    const body = observaciones ? { observaciones } : {};
    return this.http.put<BajaExterna>(`${this.apiUrl}/${id}/notificar`, body).pipe(
      tap((bajaActualizada) => {
        // Actualizar el signal reemplazando el item actualizado
        this.bajas.update(current => 
          current.map(b => b.id === id ? bajaActualizada : b)
        );
      })
    );
  }
}
