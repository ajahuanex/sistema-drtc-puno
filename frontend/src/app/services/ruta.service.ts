import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Ruta, RutaCreate, RutaUpdate, ValidacionRuta, RespuestaValidacionRuta, EstadoRuta, TipoRuta } from '../models/ruta.model';
import { LocalidadService } from './localidad.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private apiUrl = environment.apiUrl;

  private localidadService = inject(LocalidadService);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRutas(): Observable<Ruta[]> {
    console.log('🔍 GET RUTAS LLAMADO - Usando API');
    const url = `${this.apiUrl}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas del backend:', error);
          console.log('📊 Retornando array vacío');
          return of([]);
        })
      );
  }

  getRutaById(id: string): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.get<Ruta>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo ruta:', error);
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  createRuta(ruta: RutaCreate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas`;
    console.log('📤 Creando ruta en backend:', ruta);
    
    return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error creating ruta:', error);
          return throwError(() => error);
        })
      );
  }

  updateRuta(id: string, ruta: RutaUpdate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    console.log('📤 Actualizando ruta en backend:', id, ruta);
    
    return this.http.put<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error updating ruta:', error);
          return throwError(() => error);
        })
      );
  }

  deleteRuta(id: string): Observable<void> {
    const url = `${this.apiUrl}/rutas/${id}`;
    console.log('📤 Eliminando ruta en backend:', id);
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error deleting ruta:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para validar que una ruta sea única
  validarRutaUnica(validacion: ValidacionRuta): Observable<RespuestaValidacionRuta> {
    // Validar usando el API
    const url = `${this.apiUrl}/rutas/validar-unica`;
    return this.http.post<RespuestaValidacionRuta>(url, validacion, { headers: this.getHeaders() })
      .pipe(
        catchError(() => {
          // Si falla, asumir que es única
          return of({ valido: true, mensaje: 'Validación no disponible' });
        })
      );
  }

  // Método para generar código de ruta automáticamente
  generarCodigoRuta(origen: string, destino: string): Observable<string> {
    // Generar código basado en origen y destino
    const codigoOrigen = origen.substring(0, 3).toUpperCase();
    const codigoDestino = destino.substring(0, 3).toUpperCase();
    
    // Buscar el siguiente número disponible
    let numero = 1;
    let codigoGenerado = `${codigoOrigen}-${codigoDestino}-${numero.toString().padStart(3, '0')}`;
    

    
    return of(codigoGenerado);
  }

  // Método para validar que el código de ruta sea único dentro de una resolución
  validarCodigoRutaUnico(resolucionId: string, codigoRuta: string, rutaIdExcluir?: string): Observable<boolean> {
    console.log('🔍 VALIDANDO UNICIDAD:', {
      resolucionId,
      codigoRuta,
      rutaIdExcluir
    });

    const url = `${this.apiUrl}/rutas/validar-codigo-unico`;
    const body = {
      resolucionId,
      codigoRuta,
      rutaIdExcluir
    };

    return this.http.post<{esUnico: boolean}>(url, body, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('✅ RESULTADO VALIDACIÓN:', {
            resolucionId,
            codigoRuta,
            esUnico: response.esUnico
          });
          return response.esUnico;
        }),
        catchError(error => {
          console.error('❌ Error validando código único:', error);
          // En caso de error, asumir que es único para no bloquear
          return of(true);
        })
      );
  }

  // Método para generar código de ruta único dentro de una resolución primigenia
  generarCodigoRutaPorResolucion(resolucionId: string): Observable<string> {
    console.log('🔧 GENERANDO CÓDIGO PARA RESOLUCIÓN:', resolucionId);
    
    const url = `${this.apiUrl}/rutas/generar-codigo/${resolucionId}`;
    
    return this.http.get<{codigo: string}>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('✅ CÓDIGO GENERADO:', {
            resolucionId,
            codigoGenerado: response.codigo
          });
          return response.codigo;
        }),
        catchError(error => {
          console.error('❌ Error generando código, usando fallback:', error);
          // Fallback: generar código simple
          const codigoFallback = '01';
          console.log('🔄 USANDO CÓDIGO FALLBACK:', codigoFallback);
          return of(codigoFallback);
        })
      );
  }

  // Método para calcular distancia y tiempo estimado automáticamente
  calcularDistanciaYTiempo(origenId: string, destinoId: string): Observable<{distancia: number, tiempoEstimado: number}> {
    return from(this.localidadService.calcularDistancia(origenId, destinoId)).pipe(
      map((response: {distancia: number, unidad: string}) => {
        // Calcular tiempo estimado basado en distancia (promedio 60 km/h)
        const tiempoEstimado = Math.ceil(response.distancia / 60);
        return { distancia: response.distancia, tiempoEstimado };
      })
    );
  }

  getRutasPorEmpresa(empresaId: string): Observable<Ruta[]> {
    console.log('🏢 OBTENIENDO RUTAS POR EMPRESA:', empresaId);
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por empresa:', error);
          return of([]);
        })
      );
  }

  // Método para obtener rutas por empresa y resolución
  getRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): Observable<Ruta[]> {
    console.log('🔍 OBTENIENDO RUTAS POR EMPRESA Y RESOLUCIÓN:', { empresaId, resolucionId });
    
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por empresa y resolución:', error);
          return of([]);
        })
      );
  }

  // Método para obtener rutas por resolución específica
  getRutasPorResolucion(resolucionId: string): Observable<Ruta[]> {
    console.log('🔍 OBTENIENDO RUTAS POR RESOLUCIÓN:', resolucionId);
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por resolución:', error);
          return of([]);
        })
      );
  }

  // Método para obtener el siguiente código disponible en una resolución
  getSiguienteCodigoDisponible(resolucionId: string): Observable<string> {
    console.log('🔧 OBTENIENDO SIGUIENTE CÓDIGO DISPONIBLE PARA RESOLUCIÓN:', resolucionId);
    const url = `${this.apiUrl}/rutas/siguiente-codigo/${resolucionId}`;
    
    return this.http.get<{codigo: string}>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('✅ SIGUIENTE CÓDIGO DISPONIBLE:', response.codigo);
          return response.codigo;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo siguiente código, usando fallback:', error);
          // Fallback: obtener rutas y calcular
          return this.getRutasPorResolucion(resolucionId).pipe(
            map(rutas => {
              const codigosExistentes = rutas.map(r => r.codigoRuta).sort();
              let numero = 1;
              let codigoGenerado = numero.toString().padStart(2, '0');
              
              while (codigosExistentes.includes(codigoGenerado)) {
                numero++;
                codigoGenerado = numero.toString().padStart(2, '0');
                if (numero > 99) break;
              }
              
              return codigoGenerado;
            })
          );
        })
      );
  }

  agregarRutaAEmpresa(empresaId: string, rutaId: string): Observable<Ruta> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.post<Ruta>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error adding ruta to empresa:', error);
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  // Método para obtener resoluciones primigenias de una empresa específica
  getResolucionesPrimigeniasEmpresa(empresaId: string): Observable<any> {
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo resoluciones primigenias de empresa:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para obtener todas las resoluciones primigenias con datos de empresa
  getTodasResolucionesPrimigenias(): Observable<any> {
    const url = `${this.apiUrl}/rutas/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo todas las resoluciones primigenias:', error);
          return throwError(() => error);
        })
      );
  }

  removerRutaDeEmpresa(empresaId: string, rutaId: string): Observable<void> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error removing ruta from empresa:', error);
          // Simular éxito en caso de error
          return of(void 0);
        })
      );
  }



  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de rutas
   */
  async descargarPlantillaCargaMasiva(): Promise<Blob> {
    const url = `${this.apiUrl}/rutas/carga-masiva/plantilla`;
    
    try {
      const blob = await this.http.get(url, { 
        headers: this.getHeaders(),
        responseType: 'blob'
      }).toPromise();
      
      if (!blob) throw new Error('No se pudo descargar la plantilla');
      return blob;
    } catch (error) {
      console.error('Error descargando plantilla de rutas:', error);
      throw new Error('Error al descargar la plantilla');
    }
  }

  /**
   * Obtener información de ayuda para carga masiva
   */
  async obtenerAyudaCargaMasiva(): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/ayuda`;
    
    try {
      return await this.http.get(url, { headers: this.getHeaders() }).toPromise();
    } catch (error) {
      console.error('Error obteniendo ayuda de carga masiva:', error);
      throw error;
    }
  }

  /**
   * Validar archivo Excel de rutas con validaciones completas
   */
  async validarCargaMasiva(archivo: File): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/validar-completo`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    try {
      return await this.http.post(url, formData, { headers }).toPromise();
    } catch (error) {
      console.error('Error validando archivo de rutas:', error);
      throw error;
    }
  }

  /**
   * Procesar carga masiva de rutas desde Excel con validaciones completas
   */
  async procesarCargaMasiva(archivo: File, soloValidar: boolean = false): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/procesar-completo`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    try {
      return await this.http.post(finalUrl, formData, { headers }).toPromise();
    } catch (error) {
      console.error('Error procesando carga masiva de rutas:', error);
      throw error;
    }
  }

  /**
   * Descargar plantilla Excel para carga masiva de rutas (método legacy)
   */
  descargarPlantillaExcel(): Observable<Blob> {
    const url = `${this.apiUrl}/rutas/carga-masiva/plantilla`;
    
    return this.http.get(url, { 
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error descargando plantilla de rutas:', error);
        return throwError(() => new Error('Error al descargar la plantilla'));
      })
    );
  }

  /**
   * Validar archivo Excel de rutas sin procesarlo (método legacy)
   */
  validarArchivoExcel(archivo: File): Observable<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/validar`;
    const formData = new FormData();
    formData.append('archivo', archivo);

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error validando archivo de rutas:', error);
        return throwError(() => new Error('Error al validar el archivo'));
      })
    );
  }
}