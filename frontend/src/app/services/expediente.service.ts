import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Expediente, ExpedienteCreate, ExpedienteUpdate, ExpedienteSincronizacion, RespuestaSincronizacion, SistemaOrigen, EstadoSincronizacion, ValidacionExpediente, RespuestaValidacion, TipoSolicitante } from '../models/expediente.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/expedientes';

  getExpedientes(): Observable<Expediente[]> {
    return this.http.get<Expediente[]>(this.apiUrl);
  }

  getExpedienteById(id: string): Observable<Expediente> {
    return this.http.get<Expediente>(`${this.apiUrl}/${id}`);
  }

  getExpediente(id: string): Observable<Expediente> {
    return this.getExpedienteById(id);
  }

  getExpedienteByNumero(numero: string): Observable<Expediente | null> {
    // Implementación temporal: obtener todos y filtrar
    // Idealmente: this.http.get<Expediente[]>(`${this.apiUrl}?nroExpediente=${numero}`).pipe(map(exps => exps[0] || null));
    return this.getExpedientes().pipe(
      map(expedientes => expedientes.find(e => e.nroExpediente === numero) || null)
    );
  }

  getExpedienteByFolio(folio: number): Observable<Expediente | null> {
    return this.getExpedientes().pipe(
      map(expedientes => expedientes.find(e => e.folio === folio) || null)
    );
  }

  validarExpedienteUnico(validacion: ValidacionExpediente): Observable<RespuestaValidacion> {
    const numeroCompleto = `E-${validacion.numero.padStart(4, '0')}-${validacion.fechaEmision.getFullYear()}`;

    return this.getExpedienteByNumero(numeroCompleto).pipe(
      map(expedienteExistente => {
        if (expedienteExistente && (!validacion.expedienteIdExcluir || expedienteExistente.id !== validacion.expedienteIdExcluir)) {
          return {
            valido: false,
            mensaje: `Número ${numeroCompleto} ya existe`,
            expedienteExistente: {
              id: expedienteExistente.id,
              nroExpediente: expedienteExistente.nroExpediente,
              folio: expedienteExistente.folio,
              empresaId: expedienteExistente.empresaId,
              estado: expedienteExistente.estado
            },
            conflictos: [`Duplicado`]
          };
        }
        return {
          valido: true,
          mensaje: `Número válido`
        };
      })
    );
  }

  createExpediente(expediente: ExpedienteCreate): Observable<Expediente> {
    // Asegurar que el número de expediente se genere correctamente si no viene
    if (!expediente.nroExpediente) {
      // Lógica de fallback o error
    }
    return this.http.post<Expediente>(this.apiUrl, expediente);
  }

  updateExpediente(id: string, expediente: ExpedienteUpdate): Observable<Expediente> {
    return this.http.put<Expediente>(`${this.apiUrl}/${id}`, expediente);
  }

  deleteExpediente(id: string): Observable<void> {
    // Nota: El backend no tiene endpoint DELETE expuesto aún en el router, pero el servicio sí lo soporta.
    // Asumiremos que se implementará o usaremos update para desactivar.
    // Por ahora simulamos error o implementamos endpoint DELETE en backend.
    // Vamos a asumir que update con estaActivo=false es la vía.
    return this.http.put<void>(`${this.apiUrl}/${id}`, { estaActivo: false });
  }

  getExpedientesByEmpresa(empresaId: string): Observable<Expediente[]> {
    return this.getExpedientes().pipe(
      map(expedientes => expedientes.filter(e => e.empresaId === empresaId))
    );
  }

  getExpedientesByTipoTramite(tipoTramite: string): Observable<Expediente[]> {
    return this.getExpedientes().pipe(
      map(expedientes => expedientes.filter(e => e.tipoTramite === tipoTramite))
    );
  }

  // Métodos de sincronización (Mocks por ahora, ya que requieren lógica compleja de backend no implementada)
  sincronizarExpedienteExterno(datosSincronizacion: ExpedienteSincronizacion): Observable<RespuestaSincronizacion> {
    return of({
      exitosa: true,
      mensaje: 'Simulación: Expediente sincronizado exitosamente',
      expedienteId: 'temp-id',
      fechaProcesamiento: new Date()
    });
  }

  importarExpedientesExternos(sistemaOrigen: SistemaOrigen, datos: any[]): Observable<RespuestaSincronizacion> {
    return of({
      exitosa: true,
      mensaje: 'Simulación: Importación completada',
      expedienteId: 'temp-id',
      conflictos: [],
      fechaProcesamiento: new Date()
    });
  }

  exportarExpedientesParaSincronizacion(ids: string[], sistemaDestino: SistemaOrigen): Observable<any[]> {
    return of([]);
  }

  verificarIntegridadExpediente(id: string): Observable<{ valido: boolean; hash: string; hashCalculado: string }> {
    return of({ valido: true, hash: 'hash', hashCalculado: 'hash' });
  }

  resolverConflictosSincronizacion(idExterno: string, resolucion: any): Observable<RespuestaSincronizacion> {
    return of({ exitosa: true, mensaje: 'Resuelto', fechaProcesamiento: new Date() });
  }

  obtenerEstadisticasSincronizacion(): Observable<any> {
    return of({
      totalExpedientes: 0,
      expedientesSincronizados: 0,
      expedientesPendientes: 0,
      expedientesConError: 0,
      ultimaSincronizacion: new Date()
    });
  }

  // Métodos de carga masiva (delegar a endpoints reales)
  async descargarPlantillaExpedientes(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/carga-masiva/plantilla`, {
        method: 'GET'
      });
      if (!response.ok) throw new Error('Error al descargar plantilla');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_expedientes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando plantilla:', error);
    }
  }

  validarArchivoExpedientes(archivo: File): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/carga-masiva/validar`, formData).toPromise();
  }

  procesarCargaMasivaExpedientes(archivo: File, soloValidar: boolean = false): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/carga-masiva/procesar?solo_validar=${soloValidar}`, formData).toPromise();
  }
}
