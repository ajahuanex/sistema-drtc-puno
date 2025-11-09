/**
 * Servicio para consulta pública de documentos por QR
 * No requiere autenticación
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { QRConsultaResponse, DocumentoPublico } from '../../models/mesa-partes/qr-consulta.model';

@Injectable({
  providedIn: 'root'
})
export class QRConsultaService {
  private apiUrl = `${environment.apiUrl}/public/qr`;

  constructor(private http: HttpClient) {}

  /**
   * Consultar documento por código QR
   */
  consultarPorQR(codigoQR: string): Observable<QRConsultaResponse> {
    return this.http.get<QRConsultaResponse>(`${this.apiUrl}/consultar/${codigoQR}`).pipe(
      map(response => {
        if (response.documento) {
          // Convertir fechas de string a Date
          response.documento.fecha_recepcion = new Date(response.documento.fecha_recepcion);
          response.documento.historial = response.documento.historial.map(d => ({
            ...d,
            fecha_derivacion: new Date(d.fecha_derivacion)
          }));
        }
        return response;
      })
    );
  }

  /**
   * Consultar documento por número de expediente
   */
  consultarPorExpediente(numeroExpediente: string): Observable<QRConsultaResponse> {
    return this.http.get<QRConsultaResponse>(
      `${this.apiUrl}/consultar-expediente/${numeroExpediente}`
    ).pipe(
      map(response => {
        if (response.documento) {
          // Convertir fechas de string a Date
          response.documento.fecha_recepcion = new Date(response.documento.fecha_recepcion);
          response.documento.historial = response.documento.historial.map(d => ({
            ...d,
            fecha_derivacion: new Date(d.fecha_derivacion)
          }));
        }
        return response;
      })
    );
  }
}
