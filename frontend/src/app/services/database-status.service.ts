import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DatabaseStatusData {
  connected: boolean;
  target: 'local' | 'remote' | string;
  is_remote: boolean;
  database_name: string;
  masked_url: string;
  host: string;
  ping_ms: number | null;
  collections_count: number;
  collections: string[];
  error?: string | null;
  persisted_in_env?: boolean;
}

export interface DatabaseStatusResponse {
  success: boolean;
  data: DatabaseStatusData;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseStatusService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private apiUrl = `${environment.apiUrl}/database`;

  // Signals
  readonly status = signal<DatabaseStatusData | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSwitching = signal<boolean>(false);

  // Computed properties
  readonly isRemote = computed(() => this.status()?.is_remote ?? false);
  readonly isConnected = computed(() => this.status()?.connected ?? false);
  readonly targetName = computed(() => (this.status()?.target || 'local').toUpperCase());
  readonly pingMs = computed(() => this.status()?.ping_ms ?? null);
  readonly host = computed(() => this.status()?.host || 'Desconocido');

  constructor() {
    this.refreshStatus();
  }

  /**
   * Consulta el estado de la conexión a la base de datos
   */
  refreshStatus(): Observable<DatabaseStatusResponse | null> {
    this.isLoading.set(true);
    return this.http.get<DatabaseStatusResponse>(`${this.apiUrl}/status`).pipe(
      tap(res => {
        this.isLoading.set(false);
        if (res && res.success && res.data) {
          this.status.set(res.data);
        }
      }),
      catchError(err => {
        this.isLoading.set(false);
        console.warn('No se pudo obtener el estado de la base de datos:', err);
        return of(null);
      })
    );
  }

  /**
   * Cambia la conexión de base de datos en caliente a 'local' o 'remote'
   */
  switchTarget(target: 'local' | 'remote'): Observable<DatabaseStatusResponse | null> {
    this.isSwitching.set(true);
    const targetLabel = target === 'remote' ? 'REMOTO (161.132.52.69)' : 'LOCAL (localhost)';
    this.snackBar.open(`Cambiando a MongoDB ${targetLabel}...`, 'Espera', { duration: 3000 });

    return this.http.post<DatabaseStatusResponse>(`${this.apiUrl}/switch`, {
      target,
      persist_env: true
    }).pipe(
      tap(res => {
        this.isSwitching.set(false);
        if (res && res.data) {
          this.status.set(res.data);
          const isOk = res.data.connected;
          const msg = isOk
            ? `✅ Conectado exitosamente a MongoDB ${target.toUpperCase()}`
            : `⚠️ Se cambió a ${target.toUpperCase()}, pero el ping falló`;
          this.snackBar.open(msg, 'OK', {
            duration: 4000,
            panelClass: isOk ? 'snackbar-success' : 'snackbar-warning'
          });
        }
      }),
      catchError(err => {
        this.isSwitching.set(false);
        this.snackBar.open(`❌ Error al cambiar de base de datos: ${err.message || 'Error del servidor'}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'snackbar-error'
        });
        return of(null);
      })
    );
  }

  /**
   * Prueba la conectividad a un destino sin cambiar la activa
   */
  testConnection(target: 'local' | 'remote'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/test`, { target }).pipe(
      tap(res => {
        if (res && res.data) {
          const lat = res.data.ping_ms;
          const ok = res.data.success;
          this.snackBar.open(
            ok ? `Ping a ${target.toUpperCase()}: ${lat} ms ✅` : `Fallo al conectar con ${target.toUpperCase()} ❌`,
            'Cerrar',
            { duration: 4000 }
          );
        }
      })
    );
  }
}
