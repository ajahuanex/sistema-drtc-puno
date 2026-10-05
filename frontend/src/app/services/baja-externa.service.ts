import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface BajaExterna {
  id?: string;
  tipo_baja?: 'EXTERNA' | 'LOCAL';
  placa: string;
  ruc_empresa?: string;
  razon_social?: string;
  motivo?: string;
  observaciones?: string;
  archivo_evidencia?: string;
  entidad_destino?: string;
  numero_oficio?: string;
  estado_notificacion?: 'PENDIENTE' | 'NOTIFICADO';
  fecha_registro?: string;
  fecha_notificacion?: string;
  registrado_por?: string;
}

export interface VehiculoBajaInfo {
  encontrado: boolean;
  placa: string;
  ruc_empresa?: string;
  razon_social?: string;
  origen?: string;
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
   * Obtiene la lista de bajas, opcionalmente filtrada por estado, tipo y término de búsqueda
   */
  loadBajas(estado?: 'PENDIENTE' | 'NOTIFICADO' | '', tipo_baja?: 'EXTERNA' | 'LOCAL' | '', q?: string): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    if (tipo_baja && tipo_baja !== 'TODOS' as any) {
      params = params.set('tipo_baja', tipo_baja);
    }
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    this.http.get<BajaExterna[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.bajas.set(data);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('Error cargando bajas', err);
        this.error.set('No se pudo cargar la lista de bajas vehiculares.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Busca si el vehículo existe en la flota regional para autocompletar
   */
  buscarVehiculo(placa: string): Observable<VehiculoBajaInfo> {
    return this.http.get<VehiculoBajaInfo>(`${this.apiUrl}/buscar-vehiculo/${placa.toUpperCase().trim()}`);
  }

  /**
   * Registra una nueva baja vehicular (externa o local) enviando FormData
   */
  registrarBaja(formData: FormData): Observable<BajaExterna> {
    return this.http.post<BajaExterna>(this.apiUrl, formData).pipe(
      tap((nuevaBaja) => {
        this.bajas.update(current => [nuevaBaja, ...current]);
      })
    );
  }

  /**
   * Marca una baja como notificada con oficio u observaciones opcionales
   */
  notificarBaja(id: string, payload?: { observaciones?: string; numero_oficio?: string; entidad_destino?: string }): Observable<BajaExterna> {
    return this.http.put<BajaExterna>(`${this.apiUrl}/${id}/notificar`, payload || {}).pipe(
      tap((bajaActualizada) => {
        this.bajas.update(current => 
          current.map(b => b.id === id ? bajaActualizada : b)
        );
      })
    );
  }

  /**
   * Elimina un registro de baja
   */
  eliminarBaja(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.bajas.update(current => current.filter(b => b.id !== id));
      })
    );
  }
}
