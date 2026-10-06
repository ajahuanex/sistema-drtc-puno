import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { InfoCasillaResponse } from '../models/casilla.models';
import { environment } from '../../environments/environment';

/** ============================================================
 *  CasillaService
 *  Encapsula las llamadas al API de Casillas Electrónicas
 *  (Node-RED) de la DRTC Puno, con aislamiento de interceptores.
 * ============================================================ */
@Injectable({ providedIn: 'root' })
export class CasillaService {
  private httpBackend = inject(HttpBackend);
  // Cliente HTTP aislado: no inyecta tokens de SIRRETT ni redirige al login si falla la red externa
  private rawHttp = new HttpClient(this.httpBackend);
  private http = inject(HttpClient);

  private readonly baseUrl = 'https://mtc.transportespuno.gob.pe/api/v2';
  private readonly apiKey = 'topSecret123';
  private readonly proxyUrl = `${environment.apiUrl}/casilla/verificar`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Paso 1 – Verificar existencia y estado de la casilla del administrado.
   * Consulta al API Node-RED y cuenta con fallback transparente en caso de CORS.
   */
  verificarEstado(tipoPers: string, tipoDoc: string, numDoc: string): Observable<InfoCasillaResponse> {
    const params = new HttpParams()
      .set('codTipoPersona', tipoPers)
      .set('codTipoDocumento', tipoDoc)
      .set('nroDocumento', numDoc);

    // Intentamos la llamada directa con el cliente aislado
    return this.rawHttp.get<InfoCasillaResponse>(`${this.baseUrl}/info`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError((err) => {
        console.warn('[CasillaService] Consulta directa interceptada (posible CORS / firewall). Recurriendo al puente seguro...', err);
        // Fallback al backend local para evitar problemas de CORS en navegador
        return this.http.get<InfoCasillaResponse>(this.proxyUrl, { params });
      })
    );
  }

  /**
   * Obtiene el resumen consolidado de casillas de todas las empresas guardado en MongoDB.
   */
  obtenerResumenEmpresas(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/casilla/resumen-empresas`);
  }

  /**
   * Consulta el progreso y estado actual de la verificación masiva en segundo plano.
   */
  obtenerEstadoVerificacionMasiva(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/casilla/estado-verificacion-masiva`);
  }

  /**
   * Inicia la verificación masiva de casilla para todas las empresas activas.
   */
  iniciarVerificacionTodasEmpresas(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/casilla/verificar-todas-empresas`, {});
  }

  /**
   * Verifica individualmente una empresa por RUC y actualiza la base de datos.
   */
  verificarEmpresaIndividual(ruc: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/casilla/verificar-empresa/${ruc}`, {});
  }

  /**
   * Obtiene el historial de verificaciones masivas guardadas en la base de datos.
   */
  obtenerHistorialVerificaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/casilla/historial`);
  }
}


