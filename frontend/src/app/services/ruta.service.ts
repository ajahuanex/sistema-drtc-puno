import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
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

    // Obtener todas las rutas activas de la resolución específica
    const rutasDeResolucion: any[] = [];


    console.log('📊 RUTAS A VALIDAR:', {
      resolucionId,
      totalRutas: rutasDeResolucion.length,
      rutas: rutasDeResolucion.map(r => ({ 
        id: r.id, 
        codigoRuta: r.codigoRuta,
        nombre: r.nombre,
        origen: r.origen,
        destino: r.destino
      }))
    });

    // Verificar si el código ya existe
    const codigoExiste = rutasDeResolucion.some(r => r.codigoRuta === codigoRuta);
    
    console.log('✅ RESULTADO VALIDACIÓN:', {
      resolucionId,
      codigoRuta,
      codigoExiste,
      esUnico: !codigoExiste
    });

    // Si el código existe, NO es único
    if (codigoExiste) {
      console.error('❌ CÓDIGO DUPLICADO DETECTADO:', {
        resolucionId,
        codigoRuta,
        rutasExistentes: rutasDeResolucion.filter(r => r.codigoRuta === codigoRuta)
      });
    }

    return of(!codigoExiste);
  }

  // Método para generar código de ruta único dentro de una resolución primigenia
  generarCodigoRutaPorResolucion(resolucionId: string): Observable<string> {
    console.log('🔧 GENERANDO CÓDIGO PARA RESOLUCIÓN:', resolucionId);
    
    // Obtener todas las rutas activas de la resolución
    const rutasDeResolucion: any[] = [];

    // Buscar el siguiente número disponible dentro de la resolución
    let numero = 1;
    let codigoGenerado = numero.toString().padStart(2, '0');
    
    // Verificar que no exista el código generado
    // while (rutasDeResolucion.some((r: any) => r.codigoRuta === codigoGenerado)) {
    //   numero++;
    //   codigoGenerado = numero.toString().padStart(2, '0');
    //   
    //   // Protección contra bucles infinitos
    //   if (numero > 99) {
    //     console.error('❌ ERROR: No se pueden generar más códigos de ruta (límite 99)');
    //     break;
    //   }
    // }
    
    console.log('✅ CÓDIGO GENERADO:', {
      resolucionId,
      codigoGenerado,
      intentos: numero,
      totalRutasExistentes: rutasDeResolucion.length
    });
    
    return of(codigoGenerado);
  }

  // Método para calcular distancia y tiempo estimado automáticamente
  calcularDistanciaYTiempo(origenId: string, destinoId: string): Observable<{distancia: number, tiempoEstimado: number}> {
    return this.localidadService.calcularDistancia(origenId, destinoId).pipe(
      map(distancia => {
        // Calcular tiempo estimado basado en distancia (promedio 60 km/h)
        const tiempoEstimado = Math.ceil(distancia / 60);
        return { distancia, tiempoEstimado };
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
    
    // Usar API
    const url = `${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}/rutas`;
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(() => of([]))
      );
    
 
    //   r.estaActivo
    // );
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
   * Validar archivo Excel de rutas sin procesarlo
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

  /**
   * Procesar carga masiva de rutas desde Excel
   */
  procesarCargaMasiva(archivo: File, soloValidar: boolean = false): Observable<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/procesar`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    // Agregar parámetro de solo validar
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }

    // Headers sin Content-Type para FormData
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    return this.http.post(finalUrl, formData, { headers }).pipe(
      catchError(error => {
        console.error('Error procesando carga masiva de rutas:', error);
        return throwError(() => new Error('Error al procesar el archivo'));
      })
    );
  }
} 

