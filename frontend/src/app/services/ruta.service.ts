import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, from, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalidadService } from './localidad.service';
import { EmpresaService } from './empresa.service';
import { Ruta, RutaCreate, RutaUpdate, ValidacionRuta, RespuestaValidacionRuta, EstadoRuta, TipoRuta } from '../models/ruta.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private localidadService: LocalidadService,
    private empresaService: EmpresaService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getRutas(): Observable<Ruta[]> {
    const url = `${this.apiUrl}/rutas`;
    
    return this.http.get<any[]>(url, { headers: this.getHeaders() })
      .pipe(
        switchMap(rutasRaw => {
          console.log('✅ RUTAS RECIBIDAS DEL BACKEND:', rutasRaw.length);
          
          // Obtener todos los RUCs únicos que necesitan normalización usando el método de utilidad
          const rucsParaNormalizar = this.obtenerRucsParaNormalizar(rutasRaw);

          if (rucsParaNormalizar.size === 0) {
            // No hay RUCs para normalizar, procesar directamente
            return of(rutasRaw.map(ruta => this.transformRutaData(ruta)));
          }

          // Obtener información de empresas por RUC
          console.log('🔍 NORMALIZANDO EMPRESAS PARA RUCs:', Array.from(rucsParaNormalizar));
          
          const empresasRequests = Array.from(rucsParaNormalizar).map(ruc => 
            this.empresaService.validarRuc(ruc).pipe(
              map(response => response.empresa || null),
              catchError(error => {
                console.warn(`⚠️ No se pudo obtener empresa para RUC ${ruc}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(empresasRequests).pipe(
            map(empresas => {
              // Crear mapa de RUC -> Empresa
              const empresasPorRuc = new Map<string, any>();
              empresas.forEach((empresa, index) => {
                if (empresa) {
                  const ruc = Array.from(rucsParaNormalizar)[index];
                  empresasPorRuc.set(ruc, empresa);
                }
              });

              // Transformar rutas con empresas normalizadas
              return rutasRaw.map(ruta => this.transformRutaDataConEmpresas(ruta, empresasPorRuc));
            })
          );
        }),
        catchError(error => {
          console.error('❌ ERROR AL OBTENER RUTAS DEL BACKEND:', error);
          return of([]);
        })
      );
  }

  getRutaById(id: string): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.get<Ruta>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo ruta::', error);
          return throwError(() => new Error('Ruta no encontrada'));
        })
      );
  }

  createRuta(ruta: RutaCreate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas`;
    // console.log removed for production
    
    return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error creating ruta::', error);
          return throwError(() => error);
        })
      );
  }

  updateRuta(id: string, ruta: RutaUpdate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    // console.log removed for production
    
    return this.http.put<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error updating ruta::', error);
          return throwError(() => error);
        })
      );
  }

  deleteRuta(id: string): Observable<void> {
    const url = `${this.apiUrl}/rutas/${id}`;
    // console.log removed for production
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error deleting ruta::', error);
          return throwError(() => error);
        })
      );
  }

  private transformRutaData(ruta: any): Ruta {
    // Extraer origen y destino primero
    const origen = this.extractLocalidad(ruta, 'origen');
    const destino = this.extractLocalidad(ruta, 'destino');
    
    // Generar nombre como "ORIGEN - DESTINO"
    const nombreGenerado = origen && destino 
      ? `${origen.nombre} - ${destino.nombre}`
      : (ruta.nombre || '');

    return {
      id: ruta.id || ruta._id || '',
      codigoRuta: ruta.codigoRuta || ruta.codigo_ruta || '',
      nombre: nombreGenerado,
      
      // Localidades
      origen: origen,
      destino: destino,
      
      // Itinerario - simplificado como dijiste
      itinerario: ruta.itinerario || ruta.paradas || [],
      
      // Empresa
      empresa: this.extractEmpresa(ruta),
      
      // Resolución
      resolucion: this.extractResolucion(ruta),
      
      // Datos operativos - simplificados
      frecuencias: ruta.frecuencia?.descripcion || ruta.frecuencias || ruta.horarios || '',
      tipoRuta: ruta.tipoRuta || ruta.tipo_ruta || 'INTERPROVINCIAL',
      tipoServicio: ruta.tipoServicio || ruta.tipo_servicio || 'PASAJEROS',
      estado: ruta.estado || 'ACTIVA',
      
      // Datos técnicos
      distancia: ruta.distancia || 0,
      tiempoEstimado: ruta.tiempoEstimado || ruta.tiempo_estimado || '',
      tarifaBase: ruta.tarifaBase || ruta.tarifa_base || 0,
      capacidadMaxima: ruta.capacidadMaxima || ruta.capacidad_maxima || 0,
      
      // Datos adicionales
      horarios: ruta.horarios || [],
      restricciones: ruta.restricciones || [],
      observaciones: ruta.observaciones || '',
      descripcion: ruta.descripcion || '',
      
      // Control de estado
      estaActivo: ruta.estaActivo !== undefined ? ruta.estaActivo : (ruta.esta_activo !== undefined ? ruta.esta_activo : true),
      fechaRegistro: ruta.fechaRegistro ? new Date(ruta.fechaRegistro) : (ruta.fecha_registro ? new Date(ruta.fecha_registro) : new Date()),
      fechaActualizacion: ruta.fechaActualizacion ? new Date(ruta.fechaActualizacion) : (ruta.fecha_actualizacion ? new Date(ruta.fecha_actualizacion) : undefined)
    };
  }

  /**
   * Transforma datos de ruta con empresas normalizadas
   */
  private transformRutaDataConEmpresas(ruta: any, empresasPorRuc: Map<string, any>): Ruta {
    const rutaBase = this.transformRutaData(ruta);
    
    // Si ya tiene empresa completa, no hacer nada
    if (ruta.empresa && typeof ruta.empresa === 'object') {
      return rutaBase;
    }
    
    // Buscar empresa normalizada por RUC
    const rucOriginal = ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc;
    if (rucOriginal) {
      const rucNormalizado = this.normalizarRuc(rucOriginal);
      
      if (empresasPorRuc.has(rucNormalizado)) {
        const empresaNormalizada = empresasPorRuc.get(rucNormalizado);
        
        // Normalizar la estructura de razonSocial
        let razonSocial;
        if (empresaNormalizada.razonSocial) {
          if (typeof empresaNormalizada.razonSocial === 'object') {
            razonSocial = empresaNormalizada.razonSocial;
          } else {
            razonSocial = { principal: empresaNormalizada.razonSocial };
          }
        } else {
          razonSocial = { principal: empresaNormalizada.nombre || 'Sin razón social' };
        }
        
        rutaBase.empresa = {
          id: empresaNormalizada.id,
          ruc: empresaNormalizada.ruc,
          razonSocial: razonSocial
        };
        
        console.log('✅ EMPRESA NORMALIZADA:', rucOriginal, '→', rucNormalizado, '→', razonSocial.principal);
      } else {
        console.warn(`⚠️ No se encontró empresa para RUC: ${rucOriginal} (normalizado: ${rucNormalizado})`);
      }
    }
    
    return rutaBase;
  }

  private extractLocalidad(ruta: any, tipo: 'origen' | 'destino'): any {
    const localidad = ruta[tipo];
    if (localidad && typeof localidad === 'object') {
      return {
        id: localidad.id || localidad._id || '',
        nombre: localidad.nombre || `Sin ${tipo}`
      };
    }
    
    const idField = `${tipo}Id`;
    const nombreField = `${tipo}Nombre` || `${tipo}_nombre`;
    
    return {
      id: ruta[idField] || '',
      nombre: ruta[nombreField] || ruta[tipo] || `Sin ${tipo}`
    };
  }

  private extractEmpresa(ruta: any): any {
    if (ruta.empresa && typeof ruta.empresa === 'object') {
      // Normalizar la estructura de razonSocial
      let razonSocial;
      if (ruta.empresa.razonSocial) {
        if (typeof ruta.empresa.razonSocial === 'object') {
          razonSocial = ruta.empresa.razonSocial;
        } else {
          razonSocial = { principal: ruta.empresa.razonSocial };
        }
      } else if (ruta.empresa.razon_social) {
        razonSocial = { principal: ruta.empresa.razon_social };
      } else if (ruta.empresa.nombre) {
        razonSocial = { principal: ruta.empresa.nombre };
      } else {
        razonSocial = { principal: 'Sin razón social' };
      }

      return {
        id: ruta.empresa.id || ruta.empresa._id || '',
        ruc: ruta.empresa.ruc || 'Sin RUC',
        razonSocial: razonSocial
      };
    }
    
    const ruc = ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc || 'Sin RUC';
    const empresaId = ruta.empresaId || ruta.empresa_id || '';
    const razonSocial = ruta.empresaNombre || ruta.empresa_nombre || ruta.razon_social || 'Sin razón social';
    
    return {
      id: empresaId,
      ruc: ruc,
      razonSocial: { principal: razonSocial }
    };
  }

  private extractResolucion(ruta: any): any {
    if (ruta.resolucion && typeof ruta.resolucion === 'object') {
      return {
        id: ruta.resolucion.id || ruta.resolucion._id || '',
        numero: ruta.resolucion.numero || ruta.resolucion.nroResolucion || ruta.resolucion.nro_resolucion || 'Sin resolución',
        nroResolucion: ruta.resolucion.nroResolucion || ruta.resolucion.nro_resolucion || ruta.resolucion.numero || 'Sin resolución',
        tipoResolucion: ruta.resolucion.tipoResolucion || ruta.resolucion.tipo_resolucion || 'PADRE',
        estado: ruta.resolucion.estado || 'VIGENTE'
      };
    }
    
    const numero = ruta.resolucionNumero || ruta.resolucion_numero || ruta.numero_resolucion || 'Sin resolución';
    const resolucionId = ruta.resolucionId || ruta.resolucion_id || '';
    const tipo = ruta.resolucionTipo || ruta.resolucion_tipo || 'PADRE';
    
    return {
      id: resolucionId,
      numero: numero,
      nroResolucion: numero,
      tipoResolucion: tipo,
      estado: 'VIGENTE'
    };
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA
  // ========================================

  /**
   * Descarga la plantilla Excel para carga masiva de rutas
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
      console.error('Error descargando plantilla de rutas::', error);
      throw new Error('Error al descargar la plantilla');
    }
  }

  /**
   * Valida un archivo Excel de carga masiva de rutas
   * @param archivo - Archivo Excel a validar
   * @returns Resultado de la validación con estadísticas y errores
   */
  async validarCargaMasiva(archivo: File): Promise<any> {
    // console.log removed for production
    return await this.validarCargaMasivaBasica(archivo);
  }

  /**
   * Procesa un archivo Excel de carga masiva de rutas
   * @param archivo - Archivo Excel a procesar
   * @param opciones - Opciones de procesamiento (validación, lotes, etc.)
   * @returns Resultado del procesamiento con rutas creadas y errores
   * 
   * NOTA: Las localidades no encontradas en la base de datos principal
   * se crearán automáticamente con tipo y nivel "OTROS"
   */
  async procesarCargaMasiva(archivo: File, opciones: {
    soloValidar?: boolean;
    procesarEnLotes?: boolean;
    tamanoLote?: number;
  } = {}): Promise<any> {
    const { soloValidar = false } = opciones;
    
    if (soloValidar) {
      return await this.validarCargaMasiva(archivo);
    }

    const resultado = await this.procesarCargaMasivaBasico(archivo, false);
    
    // Después del procesamiento, forzar normalización de todas las rutas
    if (resultado && resultado.rutas_creadas) {
      console.log('🔄 INICIANDO NORMALIZACIÓN POST-PROCESAMIENTO...');
      
      // Esperar un momento para que las rutas se guarden completamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Forzar normalización de todas las rutas recién creadas
      await this.forzarNormalizacionCompleta(resultado.rutas_creadas);
    }
    
    return resultado;
  }

  private async validarCargaMasivaBasica(archivo: File): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/validar`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('validar_ruc', 'true');
    formData.append('validar_resoluciones', 'true');
    formData.append('validar_localidades', 'true');
    formData.append('normalizar_codigos', 'true');
    formData.append('normalizar_empresas', 'true');
    // Parámetro para crear localidades no encontradas como tipo "OTROS"
    formData.append('localidades_no_encontradas_como_otros', 'true');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const resultado = await this.http.post(url, formData, { headers }).toPromise();
    
    // Si hay rutas válidas en la validación, intentar normalizar los RUCs
    if (resultado && (resultado as any).validacion && (resultado as any).validacion.rutas_validas) {
      console.log('🔍 VALIDANDO NORMALIZACIÓN DE RUCs EN VALIDACIÓN...');
      await this.validarNormalizacionRucs((resultado as any).validacion.rutas_validas);
    }
    
    return resultado;
  }

  private async procesarCargaMasivaBasico(archivo: File, soloValidar: boolean): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/procesar`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('validar_ruc', 'true');
    formData.append('validar_resoluciones', 'true');
    formData.append('validar_localidades', 'true');
    formData.append('normalizar_codigos', 'true');
    formData.append('normalizar_empresas', 'true');
    // Parámetro para crear localidades no encontradas como tipo "OTROS"
    formData.append('localidades_no_encontradas_como_otros', 'true');
    formData.append('modo_seguro', 'true');
    
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    const resultado = await this.http.post(finalUrl, formData, { headers }).toPromise();
    
    // Si no es solo validación y hay rutas creadas, normalizar los RUCs
    if (!soloValidar && resultado && (resultado as any).rutas_creadas) {
      console.log('🔍 NORMALIZANDO RUCs DE RUTAS CREADAS...');
      await this.normalizarRucsRutasCreadas((resultado as any).rutas_creadas);
    }
    
    return resultado;
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA DE LOCALIDADES
  // ========================================

  buscarLocalidadesParaRutas(nombre: string, limite: number = 10): Observable<any[]> {
    // console.log removed for production
    
    return from(this.localidadService.buscarLocalidades(nombre, limite)).pipe(
      map(localidades => {
        // console.log removed for production
        return localidades.map(loc => ({
          id: loc.id,
          nombre: loc.nombre,
          departamento: loc.departamento,
          provincia: loc.provincia,
          distrito: loc.distrito,
          tipo: loc.tipo
        }));
      }),
      catchError(error => {
        console.error('❌ Error buscando localidades para rutas::', error);
        return of([]);
      })
    );
  }

  obtenerLocalidadesPopulares(limite: number = 20): Observable<any[]> {
    // console.log removed for production
    
    return from(this.localidadService.obtenerLocalidades()).pipe(
      map(localidades => {
        // console.log removed for production
        return localidades
          .filter(loc => loc.esta_activa)
          .slice(0, limite)
          .map(loc => ({
            id: loc.id,
            nombre: loc.nombre,
            departamento: loc.departamento,
            provincia: loc.provincia,
            distrito: loc.distrito,
            tipo: loc.tipo
          }));
      }),
      catchError(error => {
        console.error('❌ Error obteniendo localidades populares::', error);
        return of([]);
      })
    );
  }

  // ========================================
  // MÉTODOS ADICIONALES
  // ========================================

  async eliminarTodasLasRutas(): Promise<any> {
    const url = `${this.apiUrl}/rutas/`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    try {
      // console.log removed for production
      
      const resultado = await this.http.delete(`${url}?confirmar=true`, { headers }).toPromise();
      
      // console.log removed for production
      return resultado;
    } catch (error: any) {
      console.error('❌ Error eliminando todas las rutas::', error);
      throw error;
    }
  }

  async obtenerAyudaCargaMasiva(): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/ayuda`;
    
    try {
      return await this.http.get(url, { headers: this.getHeaders() }).toPromise();
    } catch (error) {
      console.error('Error obteniendo ayuda de carga masiva::', error);
      throw error;
    }
  }

  getSiguienteCodigoDisponible(resolucionId: string): Observable<string> {
    // console.log removed for production
    const url = `${this.apiUrl}/rutas/siguiente-codigo/${resolucionId}`;
    
    return this.http.get<{codigo: string}>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          // console.log removed for production
          return response.codigo;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo siguiente código, usando fallback::', error);
          return of('01');
        })
      );
  }

  validarCodigoRutaUnico(resolucionId: string, codigoRuta: string, rutaIdExcluir?: string): Observable<boolean> {
    // console.log removed for production

    const url = `${this.apiUrl}/rutas/validar-codigo-unico`;
    const body = {
      resolucionId,
      codigoRuta,
      rutaIdExcluir
    };

    return this.http.post<{esUnico: boolean}>(url, body, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          // console.log removed for production

          return response.esUnico;
        }),
        catchError(error => {
          console.error('❌ Error validando código único::', error);
          return of(true);
        })
      );
  }

  getRutasPorEmpresa(empresaId: string): Observable<Ruta[]> {
    // console.log removed for production
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por empresa::', error);
          return of([]);
        })
      );
  }

  getRutasPorResolucion(resolucionId: string): Observable<Ruta[]> {
    // console.log removed for production
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por resolución::', error);
          return of([]);
        })
      );
  }

  getRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): Observable<Ruta[]> {
    // console.log removed for production
    
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo rutas por empresa y resolución::', error);
          return of([]);
        })
      );
  }

  getResolucionesPrimigeniasEmpresa(empresaId: string): Observable<any> {
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo resoluciones primigenias::', error);
          return of([]);
        })
      );
  }

  getTodasResolucionesPrimigenias(): Observable<any> {
    const url = `${this.apiUrl}/rutas/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo todas las resoluciones primigenias::', error);
          return of([]);
        })
      );
  }

  // ========================================
  // MÉTODOS DE UTILIDAD PARA NORMALIZACIÓN DE RUC
  // ========================================

  /**
   * Normaliza un RUC eliminando espacios y caracteres especiales
   */
  private normalizarRuc(ruc: string): string {
    if (!ruc || ruc === 'Sin RUC') {
      return 'Sin RUC';
    }
    
    // Eliminar espacios, guiones y otros caracteres especiales
    return ruc.replace(/[\s\-\.]/g, '').trim();
  }

  /**
   * Valida si un RUC tiene el formato correcto (11 dígitos)
   */
  private validarFormatoRuc(ruc: string): boolean {
    if (!ruc || ruc === 'Sin RUC') {
      return false;
    }
    
    const rucNormalizado = this.normalizarRuc(ruc);
    return /^\d{11}$/.test(rucNormalizado);
  }

  /**
   * Obtiene todos los RUCs únicos de un array de rutas que necesitan normalización
   */
  private obtenerRucsParaNormalizar(rutas: any[]): Set<string> {
    const rucsParaNormalizar = new Set<string>();
    
    rutas.forEach(ruta => {
      const ruc = ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc;
      
      if (ruc && ruc !== 'Sin RUC' && (!ruta.empresa || typeof ruta.empresa !== 'object')) {
        const rucNormalizado = this.normalizarRuc(ruc);
        
        if (this.validarFormatoRuc(rucNormalizado)) {
          rucsParaNormalizar.add(rucNormalizado);
        } else {
          console.warn(`⚠️ RUC con formato inválido encontrado: ${ruc}`);
        }
      }
    });
    
    return rucsParaNormalizar;
  }

  /**
   * Método público para validar y normalizar un RUC
   */
  validarYNormalizarRuc(ruc: string): { valido: boolean; rucNormalizado: string; mensaje?: string } {
    if (!ruc || ruc.trim() === '') {
      return {
        valido: false,
        rucNormalizado: '',
        mensaje: 'RUC no puede estar vacío'
      };
    }

    const rucNormalizado = this.normalizarRuc(ruc);
    
    if (!this.validarFormatoRuc(rucNormalizado)) {
      return {
        valido: false,
        rucNormalizado: rucNormalizado,
        mensaje: 'RUC debe tener exactamente 11 dígitos'
      };
    }

    return {
      valido: true,
      rucNormalizado: rucNormalizado
    };
  }

  /**
   * Normaliza los RUCs de las rutas recién creadas en carga masiva
   */
  private async normalizarRucsRutasCreadas(rutasCreadas: any[]): Promise<void> {
    if (!rutasCreadas || rutasCreadas.length === 0) {
      return;
    }

    console.log(`🔍 INICIANDO NORMALIZACIÓN DE ${rutasCreadas.length} RUTAS CREADAS`);

    // Obtener los IDs de las rutas creadas
    const idsRutas = rutasCreadas.map(ruta => ruta.id).filter(id => id);
    
    if (idsRutas.length === 0) {
      console.warn('⚠️ No se encontraron IDs válidos en las rutas creadas');
      return;
    }

    try {
      // Obtener las rutas completas del backend
      const rutasCompletas = await Promise.all(
        idsRutas.map(id => this.getRutaById(id).toPromise().catch(error => {
          console.warn(`⚠️ No se pudo obtener la ruta ${id}:`, error);
          return null;
        }))
      );

      // Filtrar rutas válidas
      const rutasValidas = rutasCompletas.filter(ruta => ruta !== null);
      
      if (rutasValidas.length === 0) {
        console.warn('⚠️ No se pudieron obtener rutas válidas para normalizar');
        return;
      }

      // Obtener RUCs únicos que necesitan normalización
      const rucsParaNormalizar = this.obtenerRucsParaNormalizar(rutasValidas);
      
      if (rucsParaNormalizar.size === 0) {
        console.log('✅ No hay RUCs para normalizar en las rutas creadas');
        return;
      }

      console.log(`🔍 NORMALIZANDO ${rucsParaNormalizar.size} RUCs ÚNICOS:`, Array.from(rucsParaNormalizar));

      // Obtener información de empresas por RUC
      const empresasRequests = Array.from(rucsParaNormalizar).map(ruc => 
        this.empresaService.validarRuc(ruc).pipe(
          map(response => ({ ruc, empresa: response.empresa || null })),
          catchError(error => {
            console.warn(`⚠️ No se pudo obtener empresa para RUC ${ruc}:`, error);
            return of({ ruc, empresa: null });
          })
        ).toPromise()
      );

      const empresasResultados = await Promise.all(empresasRequests);
      
      // Crear mapa de RUC -> Empresa
      const empresasPorRuc = new Map<string, any>();
      empresasResultados.forEach(resultado => {
        if (resultado && resultado.empresa) {
          empresasPorRuc.set(resultado.ruc, resultado.empresa);
          const empresaNombre = resultado.empresa.razonSocial?.principal || 'Sin razón social';
          console.log(`✅ EMPRESA ENCONTRADA PARA RUC ${resultado.ruc}:`, empresaNombre);
        } else if (resultado) {
          console.warn(`⚠️ NO SE ENCONTRÓ EMPRESA PARA RUC ${resultado.ruc}`);
        }
      });

      // Actualizar las rutas con la información de empresa normalizada
      const actualizacionesPromises = rutasValidas.map(async (ruta) => {
        const rucOriginal = this.extraerRucDeRuta(ruta);
        if (!rucOriginal) return null;

        const rucNormalizado = this.normalizarRuc(rucOriginal);
        const empresa = empresasPorRuc.get(rucNormalizado);
        
        if (!empresa) return null;

        // Actualizar la ruta con la información de empresa normalizada
        const rutaActualizada = {
          ...ruta,
          empresa: {
            id: empresa.id,
            ruc: empresa.ruc,
            razonSocial: empresa.razonSocial || { principal: empresa.nombre || 'Sin razón social' }
          }
        };

        try {
          await this.updateRuta(ruta!.id, rutaActualizada).toPromise();
          console.log(`✅ RUTA ${ruta!.codigoRuta} ACTUALIZADA CON EMPRESA:`, empresa.razonSocial?.principal);
          return rutaActualizada;
        } catch (error) {
          console.error(`❌ ERROR ACTUALIZANDO RUTA ${ruta!.id}:`, error);
          return null;
        }
      });

      const rutasActualizadas = await Promise.all(actualizacionesPromises);
      const exitosas = rutasActualizadas.filter(ruta => ruta !== null).length;
      
      console.log(`✅ NORMALIZACIÓN COMPLETADA: ${exitosas}/${rutasValidas.length} rutas actualizadas`);

    } catch (error) {
      console.error('❌ ERROR EN NORMALIZACIÓN DE RUCs:', error);
    }
  }

  /**
   * Extrae el RUC de una ruta (maneja diferentes formatos)
   */
  private extraerRucDeRuta(ruta: any): string | null {
    if (ruta.empresa && typeof ruta.empresa === 'object' && ruta.empresa.ruc) {
      return ruta.empresa.ruc;
    }
    
    return ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc || null;
  }

  /**
   * Valida la normalización de RUCs durante la validación de carga masiva
   */
  private async validarNormalizacionRucs(rutasValidas: any[]): Promise<void> {
    if (!rutasValidas || rutasValidas.length === 0) {
      return;
    }

    console.log(`🔍 VALIDANDO NORMALIZACIÓN DE ${rutasValidas.length} RUTAS`);

    // Obtener RUCs únicos
    const rucsUnicos = new Set<string>();
    rutasValidas.forEach(ruta => {
      const ruc = ruta.ruc;
      if (ruc && ruc !== 'Sin RUC') {
        const rucNormalizado = this.normalizarRuc(ruc);
        if (this.validarFormatoRuc(rucNormalizado)) {
          rucsUnicos.add(rucNormalizado);
        }
      }
    });

    if (rucsUnicos.size === 0) {
      console.log('⚠️ No hay RUCs válidos para validar normalización');
      return;
    }

    console.log(`🔍 VALIDANDO ${rucsUnicos.size} RUCs ÚNICOS:`, Array.from(rucsUnicos));

    // Verificar que cada RUC existe en el módulo de empresas
    const verificacionesPromises = Array.from(rucsUnicos).map(async (ruc) => {
      try {
        const response = await this.empresaService.validarRuc(ruc).toPromise();
        if (response?.empresa) {
          console.log(`✅ RUC ${ruc} VÁLIDO - Empresa: ${response.empresa.razonSocial?.principal}`);
          return { ruc, valido: true, empresa: response.empresa };
        } else {
          console.warn(`⚠️ RUC ${ruc} NO ENCONTRADO EN MÓDULO DE EMPRESAS`);
          return { ruc, valido: false, empresa: null };
        }
      } catch (error) {
        console.error(`❌ ERROR VALIDANDO RUC ${ruc}:`, error);
        return { ruc, valido: false, empresa: null };
      }
    });

    const verificaciones = await Promise.all(verificacionesPromises);
    
    const rucsValidos = verificaciones.filter(v => v.valido).length;
    const rucsInvalidos = verificaciones.filter(v => !v.valido).length;
    
    console.log(`📊 RESULTADO VALIDACIÓN RUCs: ${rucsValidos} válidos, ${rucsInvalidos} inválidos`);
    
    if (rucsInvalidos > 0) {
      const rucsNoEncontrados = verificaciones.filter(v => !v.valido).map(v => v.ruc);
      console.warn('⚠️ RUCs NO ENCONTRADOS EN MÓDULO DE EMPRESAS:', rucsNoEncontrados);
    }
  }

  /**
   * Fuerza la normalización completa de rutas recién creadas
   */
  private async forzarNormalizacionCompleta(rutasCreadas: any[]): Promise<void> {
    if (!rutasCreadas || rutasCreadas.length === 0) {
      console.log('⚠️ No hay rutas para normalizar');
      return;
    }

    console.log(`🔄 FORZANDO NORMALIZACIÓN COMPLETA DE ${rutasCreadas.length} RUTAS`);

    try {
      // Obtener todas las rutas del sistema para encontrar las recién creadas
      const todasLasRutas = await this.getRutas().toPromise();
      
      if (!todasLasRutas || todasLasRutas.length === 0) {
        console.warn('⚠️ No se pudieron obtener las rutas del sistema');
        return;
      }

      // Filtrar las rutas que necesitan normalización (las que no tienen empresa completa)
      const rutasParaNormalizar = todasLasRutas.filter(ruta => {
        // Verificar si la ruta necesita normalización
        if (!ruta.empresa || typeof ruta.empresa !== 'object') {
          return true;
        }
        
        // Verificar si la empresa no tiene información completa
        if (!ruta.empresa.id || !ruta.empresa.razonSocial) {
          return true;
        }
        
        return false;
      });

      if (rutasParaNormalizar.length === 0) {
        console.log('✅ Todas las rutas ya están normalizadas');
        return;
      }

      console.log(`🔍 ENCONTRADAS ${rutasParaNormalizar.length} RUTAS QUE NECESITAN NORMALIZACIÓN`);

      // Obtener RUCs únicos de las rutas que necesitan normalización
      const rucsParaNormalizar = new Set<string>();
      rutasParaNormalizar.forEach(ruta => {
        const ruc = this.extraerRucDeRuta(ruta);
        if (ruc && ruc !== 'Sin RUC') {
          const rucNormalizado = this.normalizarRuc(ruc);
          if (this.validarFormatoRuc(rucNormalizado)) {
            rucsParaNormalizar.add(rucNormalizado);
          }
        }
      });

      if (rucsParaNormalizar.size === 0) {
        console.warn('⚠️ No se encontraron RUCs válidos para normalizar');
        return;
      }

      console.log(`🔍 NORMALIZANDO ${rucsParaNormalizar.size} RUCs ÚNICOS:`, Array.from(rucsParaNormalizar));

      // Obtener información de empresas
      const empresasPromises = Array.from(rucsParaNormalizar).map(async (ruc) => {
        try {
          const response = await this.empresaService.validarRuc(ruc).toPromise();
          return { ruc, empresa: response?.empresa || null };
        } catch (error) {
          console.warn(`⚠️ Error obteniendo empresa para RUC ${ruc}:`, error);
          return { ruc, empresa: null };
        }
      });

      const empresasResultados = await Promise.all(empresasPromises);
      
      // Crear mapa de RUC -> Empresa
      const empresasPorRuc = new Map<string, any>();
      empresasResultados.forEach(resultado => {
        if (resultado.empresa) {
          empresasPorRuc.set(resultado.ruc, resultado.empresa);
          console.log(`✅ EMPRESA ENCONTRADA: RUC ${resultado.ruc} -> ${resultado.empresa.razonSocial?.principal}`);
        }
      });

      // Actualizar rutas con información de empresa
      let rutasActualizadas = 0;
      const actualizacionesPromises = rutasParaNormalizar.map(async (ruta) => {
        const rucOriginal = this.extraerRucDeRuta(ruta);
        if (!rucOriginal) return false;

        const rucNormalizado = this.normalizarRuc(rucOriginal);
        const empresa = empresasPorRuc.get(rucNormalizado);
        
        if (!empresa) {
          console.warn(`⚠️ No se encontró empresa para RUC ${rucOriginal} (normalizado: ${rucNormalizado})`);
          return false;
        }

        try {
          // Actualizar la ruta con información de empresa
          const rutaActualizada: any = {
            empresa: {
              id: empresa.id,
              ruc: empresa.ruc,
              razonSocial: empresa.razonSocial || { principal: empresa.nombre || 'Sin razón social' }
            }
          };

          await this.updateRuta(ruta.id, rutaActualizada).toPromise();
          console.log(`✅ RUTA NORMALIZADA: ${ruta.codigoRuta} -> ${empresa.razonSocial?.principal || empresa.nombre}`);
          return true;
        } catch (error) {
          console.error(`❌ Error actualizando ruta ${ruta.id}:`, error);
          return false;
        }
      });

      const resultados = await Promise.all(actualizacionesPromises);
      rutasActualizadas = resultados.filter(resultado => resultado === true).length;

      console.log(`🎉 NORMALIZACIÓN COMPLETA FINALIZADA: ${rutasActualizadas}/${rutasParaNormalizar.length} rutas actualizadas`);

    } catch (error) {
      console.error('❌ ERROR EN NORMALIZACIÓN COMPLETA:', error);
    }
  }
}