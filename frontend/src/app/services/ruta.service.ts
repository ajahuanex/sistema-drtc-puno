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
    const url = `${this.apiUrl}/rutas/`;
    
    return this.http.get<any[]>(url, { headers: this.getHeaders() })
      .pipe(
        switchMap(rutasRaw => {
          const rucsParaNormalizar = this.obtenerRucsParaNormalizar(rutasRaw);

          if (rucsParaNormalizar.size === 0) {
            return of(rutasRaw.map(ruta => this.transformRutaData(ruta)));
          }

          const empresasRequests = Array.from(rucsParaNormalizar).map(ruc => 
            this.empresaService.validarRuc(ruc).pipe(
              map(response => response.empresa || null),
              catchError(error => {
                console.warn(`No se pudo obtener empresa para RUC ${ruc}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(empresasRequests).pipe(
            map(empresas => {
              const empresasPorRuc = new Map<string, any>();
              empresas.forEach((empresa, index) => {
                if (empresa) {
                  const ruc = Array.from(rucsParaNormalizar)[index];
                  empresasPorRuc.set(ruc, empresa);
                }
              });

              const rutasTransformadas = rutasRaw.map(ruta => this.transformRutaDataConEmpresas(ruta, empresasPorRuc));
              return rutasTransformadas;
            })
          );
        }),
        catchError(error => {
          console.error('ERROR AL OBTENER RUTAS DEL BACKEND:', error);
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
    const url = `${this.apiUrl}/rutas/`;
    
    return this.http.post<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating ruta:', error);
          return throwError(() => error);
        })
      );
  }

  updateRuta(id: string, ruta: RutaUpdate): Observable<Ruta> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.put<Ruta>(url, ruta, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating ruta:', error);
          return throwError(() => error);
        })
      );
  }

  deleteRuta(id: string): Observable<void> {
    const url = `${this.apiUrl}/rutas/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting ruta:', error);
          return throwError(() => error);
        })
      );
  }

  private transformRutaData(ruta: any): Ruta {
    const origen = this.extractLocalidad(ruta, 'origen');
    const destino = this.extractLocalidad(ruta, 'destino');
    
    const nombreGenerado = origen && destino 
      ? `${origen.nombre} - ${destino.nombre}`
      : (ruta.nombre || '');

    return {
      id: ruta.id || ruta._id || '',
      codigoRuta: ruta.codigoRuta || ruta.codigo_ruta || '',
      nombre: nombreGenerado,
      origen: origen,
      destino: destino,
      itinerario: this.extractItinerario(ruta.itinerario || ruta.paradas || []),
      empresa: this.extractEmpresa(ruta),
      resolucion: this.extractResolucion(ruta),
      frecuencia: ruta.frecuencia || {
        tipo: 'DIARIO',
        cantidad: 1,
        dias: [],
        descripcion: 'Sin frecuencia'
      },
      tipoRuta: ruta.tipoRuta || ruta.tipo_ruta || 'INTERPROVINCIAL',
      tipoServicio: ruta.tipoServicio || ruta.tipo_servicio || 'PASAJEROS',
      estado: ruta.estado || 'ACTIVA',
      distancia: ruta.distancia || 0,
      tiempoEstimado: ruta.tiempoEstimado || ruta.tiempo_estimado || '',
      tarifaBase: ruta.tarifaBase || ruta.tarifa_base || 0,
      capacidadMaxima: ruta.capacidadMaxima || ruta.capacidad_maxima || 0,
      horarios: ruta.horarios || [],
      restricciones: ruta.restricciones || [],
      observaciones: ruta.observaciones || '',
      descripcion: ruta.descripcion || '',
      estaActivo: ruta.estaActivo !== undefined ? ruta.estaActivo : (ruta.esta_activo !== undefined ? ruta.esta_activo : true),
      fechaRegistro: ruta.fechaRegistro ? new Date(ruta.fechaRegistro) : (ruta.fecha_registro ? new Date(ruta.fecha_registro) : new Date()),
      fechaActualizacion: ruta.fechaActualizacion ? new Date(ruta.fechaActualizacion) : (ruta.fecha_actualizacion ? new Date(ruta.fecha_actualizacion) : undefined)
    };
  }

  private extractItinerario(itinerario: any[]): any[] {
    if (!itinerario || !Array.isArray(itinerario)) {
      return [];
    }

    return itinerario.map((parada, index) => {
      if (parada && typeof parada === 'object') {
        const localidad = parada.localidad || parada;
        
        return {
          id: localidad.id || localidad._id || '',
          nombre: localidad.nombre || 'Sin nombre',
          tipo: localidad.tipo || undefined,
          ubigeo: localidad.ubigeo || undefined,
          departamento: localidad.departamento || undefined,
          provincia: localidad.provincia || undefined,
          distrito: localidad.distrito || undefined,
          coordenadas: localidad.coordenadas || undefined,
          orden: parada.orden !== undefined ? parada.orden : index
        };
      }
      
      return {
        id: '',
        nombre: parada || 'Sin nombre',
        orden: index
      };
    });
  }

  private transformRutaDataConEmpresas(ruta: any, empresasPorRuc: Map<string, any>): Ruta {
    const rutaBase = this.transformRutaData(ruta);
    
    if (ruta.empresa && typeof ruta.empresa === 'object') {
      return rutaBase;
    }
    
    const rucOriginal = ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc;
    if (rucOriginal) {
      const rucNormalizado = this.normalizarRuc(rucOriginal);
      
      if (empresasPorRuc.has(rucNormalizado)) {
        const empresaNormalizada = empresasPorRuc.get(rucNormalizado);
        
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
      }
    }
    
    return rutaBase;
  }

  private extractLocalidad(ruta: any, tipo: 'origen' | 'destino'): any {
    const localidad = ruta[tipo];
    if (localidad && typeof localidad === 'object') {
      return {
        id: localidad.id || localidad._id || '',
        nombre: localidad.nombre || `Sin ${tipo}`,
        tipo: localidad.tipo || undefined,
        ubigeo: localidad.ubigeo || undefined,
        departamento: localidad.departamento || undefined,
        provincia: localidad.provincia || undefined,
        distrito: localidad.distrito || undefined,
        coordenadas: localidad.coordenadas || undefined
      };
    }
    
    const idField = `${tipo}Id`;
    const nombreField = `${tipo}Nombre` || `${tipo}_nombre`;
    
    return {
      id: ruta[idField] || '',
      nombre: ruta[nombreField] || ruta[tipo] || `Sin ${tipo}`,
      tipo: ruta[`${tipo}Tipo`] || ruta[`${tipo}_tipo`] || undefined,
      ubigeo: ruta[`${tipo}Ubigeo`] || ruta[`${tipo}_ubigeo`] || undefined,
      departamento: ruta[`${tipo}Departamento`] || ruta[`${tipo}_departamento`] || undefined,
      provincia: ruta[`${tipo}Provincia`] || ruta[`${tipo}_provincia`] || undefined,
      distrito: ruta[`${tipo}Distrito`] || ruta[`${tipo}_distrito`] || undefined,
      coordenadas: ruta[`${tipo}Coordenadas`] || ruta[`${tipo}_coordenadas`] || undefined
    };
  }

  private extractEmpresa(ruta: any): any {
    if (ruta.empresa && typeof ruta.empresa === 'object') {
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

  async validarCargaMasiva(archivo: File): Promise<any> {
    return await this.validarCargaMasivaBasica(archivo);
  }

  async procesarCargaMasiva(archivo: File, opciones: {
    soloValidar?: boolean;
    modo?: 'crear' | 'actualizar' | 'upsert';
    procesarEnLotes?: boolean;
    tamanoLote?: number;
  } = {}): Promise<any> {
    const { soloValidar = false, modo = 'upsert' } = opciones;
    
    if (soloValidar) {
      return await this.validarCargaMasiva(archivo);
    }

    const resultado = await this.procesarCargaMasivaBasico(archivo, false, modo);
    
    if (resultado && resultado.rutas_creadas) {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    formData.append('localidades_no_encontradas_como_otros', 'true');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const resultado = await this.http.post(url, formData, { headers }).toPromise();
    
    if (resultado && (resultado as any).validacion && (resultado as any).validacion.rutas_validas) {
      await this.validarNormalizacionRucs((resultado as any).validacion.rutas_validas);
    }
    
    return resultado;
  }

  private async procesarCargaMasivaBasico(archivo: File, soloValidar: boolean, modo: string = 'crear'): Promise<any> {
    const url = `${this.apiUrl}/rutas/carga-masiva/procesar`;
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('validar_ruc', 'true');
    formData.append('validar_resoluciones', 'true');
    formData.append('validar_localidades', 'true');
    formData.append('normalizar_codigos', 'true');
    formData.append('normalizar_empresas', 'true');
    formData.append('localidades_no_encontradas_como_otros', 'true');
    formData.append('modo_seguro', 'true');
    
    const params = new URLSearchParams();
    if (soloValidar) {
      params.append('solo_validar', 'true');
    }
    params.append('modo', modo);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

    const resultado = await this.http.post(finalUrl, formData, { headers }).toPromise();
    
    if (!soloValidar && resultado && (resultado as any).rutas_creadas) {
      await this.normalizarRucsRutasCreadas((resultado as any).rutas_creadas);
    }
    
    return resultado;
  }

  buscarLocalidadesParaRutas(nombre: string, limite: number = 10): Observable<any[]> {
    return from(this.localidadService.buscarLocalidades(nombre, limite)).pipe(
      map(localidades => {
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
        console.error('Error buscando localidades para rutas:', error);
        return of([]);
      })
    );
  }

  obtenerLocalidadesPopulares(limite: number = 20): Observable<any[]> {
    return from(this.localidadService.obtenerLocalidades()).pipe(
      map(localidades => {
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
        console.error('Error obteniendo localidades populares:', error);
        return of([]);
      })
    );
  }

  async eliminarTodasLasRutas(): Promise<any> {
    const url = `${this.apiUrl}/rutas/`;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    try {
      const resultado = await this.http.delete(`${url}?confirmar=true`, { headers }).toPromise();
      return resultado;
    } catch (error: any) {
      console.error('Error eliminando todas las rutas:', error);
      throw error;
    }
  }

  getSiguienteCodigoDisponible(resolucionId: string): Observable<string> {
    const url = `${this.apiUrl}/rutas/siguiente-codigo/${resolucionId}`;
    
    return this.http.get<{codigo: string}>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          return response.codigo;
        }),
        catchError(error => {
          console.error('Error obteniendo siguiente código, usando fallback:', error);
          return of('01');
        })
      );
  }

  validarCodigoRutaUnico(resolucionId: string, codigoRuta: string, rutaIdExcluir?: string): Observable<boolean> {
    const url = `${this.apiUrl}/rutas/validar-codigo-unico`;
    const body = {
      resolucionId,
      codigoRuta,
      rutaIdExcluir
    };

    return this.http.post<{esUnico: boolean}>(url, body, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          return response.esUnico;
        }),
        catchError(error => {
          console.error('Error validando código único:', error);
          return of(true);
        })
      );
  }

  getRutasPorEmpresa(empresaId: string): Observable<Ruta[]> {
    const url = `${this.apiUrl}/empresas/${empresaId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo rutas por empresa:', error);
          return of([]);
        })
      );
  }

  getRutasPorResolucion(resolucionId: string): Observable<Ruta[]> {
    const url = `${this.apiUrl}/resoluciones/${resolucionId}/rutas`;
    
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        map(rutas => {
          return rutas;
        }),
        catchError(error => {
          console.error('Error obteniendo rutas por resolución:', error);
          return of([]);
        })
      );
  }

  getRutasPorEmpresaYResolucion(empresaId: string, resolucionId: string): Observable<Ruta[]> {
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resolucion/${resolucionId}`;
    return this.http.get<Ruta[]>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo rutas por empresa y resolución:', error);
          return of([]);
        })
      );
  }

  getResolucionesPrimigeniasEmpresa(empresaId: string): Observable<any> {
    const url = `${this.apiUrl}/rutas/empresa/${empresaId}/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo resoluciones primigenias:', error);
          return of([]);
        })
      );
  }

  getTodasResolucionesPrimigenias(): Observable<any> {
    const url = `${this.apiUrl}/rutas/resoluciones-primigenias`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo todas las resoluciones primigenias:', error);
          return of([]);
        })
      );
  }

  verificarCoordenadasRutas(): Observable<any> {
    const url = `${this.apiUrl}/rutas/verificar-coordenadas`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error verificando coordenadas de rutas:', error);
          return of(null);
        })
      );
  }

  sincronizarLocalidades(): Observable<any> {
    const url = `${this.apiUrl}/rutas/sincronizar-localidades`;
    
    return this.http.post<any>(url, {}, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error sincronizando localidades:', error);
          return of(null);
        })
      );
  }

  verificarSincronizacionLocalidades(): Observable<any> {
    const url = `${this.apiUrl}/rutas/verificar-sincronizacion`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error verificando sincronización:', error);
          return of(null);
        })
      );
  }

  private normalizarRuc(ruc: string): string {
    if (!ruc || ruc === 'Sin RUC') {
      return 'Sin RUC';
    }
    
    return ruc.replace(/[\s\-\.]/g, '').trim();
  }

  private validarFormatoRuc(ruc: string): boolean {
    if (!ruc || ruc === 'Sin RUC') {
      return false;
    }
    
    const rucNormalizado = this.normalizarRuc(ruc);
    return /^\d{11}$/.test(rucNormalizado);
  }

  private obtenerRucsParaNormalizar(rutas: any[]): Set<string> {
    const rucsParaNormalizar = new Set<string>();
    
    rutas.forEach(ruta => {
      const ruc = ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc;
      
      if (ruc && ruc !== 'Sin RUC' && (!ruta.empresa || typeof ruta.empresa !== 'object')) {
        const rucNormalizado = this.normalizarRuc(ruc);
        
        if (this.validarFormatoRuc(rucNormalizado)) {
          rucsParaNormalizar.add(rucNormalizado);
        }
      }
    });
    
    return rucsParaNormalizar;
  }

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

  private async normalizarRucsRutasCreadas(rutasCreadas: any[]): Promise<void> {
    if (!rutasCreadas || rutasCreadas.length === 0) {
      return;
    }

    const idsRutas = rutasCreadas.map(ruta => ruta.id).filter(id => id);
    
    if (idsRutas.length === 0) {
      return;
    }

    try {
      const rutasCompletas = await Promise.all(
        idsRutas.map(id => this.getRutaById(id).toPromise().catch(error => {
          console.warn(`No se pudo obtener la ruta ${id}:`, error);
          return null;
        }))
      );

      const rutasValidas = rutasCompletas.filter(ruta => ruta !== null);
      
      if (rutasValidas.length === 0) {
        return;
      }

      const rucsParaNormalizar = this.obtenerRucsParaNormalizar(rutasValidas);
      
      if (rucsParaNormalizar.size === 0) {
        return;
      }

      const empresasPromises = Array.from(rucsParaNormalizar).map(async (ruc) => {
        try {
          const response = await this.empresaService.validarRuc(ruc).toPromise();
          return { ruc, empresa: response?.empresa || null };
        } catch (error) {
          console.warn(`Error obteniendo empresa para RUC ${ruc}:`, error);
          return { ruc, empresa: null };
        }
      });

      const empresasResultados = await Promise.all(empresasPromises);
      
      const empresasPorRuc = new Map<string, any>();
      empresasResultados.forEach(resultado => {
        if (resultado.empresa) {
          empresasPorRuc.set(resultado.ruc, resultado.empresa);
        }
      });

      let rutasActualizadas = 0;
      const actualizacionesPromises = rutasValidas.map(async (ruta) => {
        const rucOriginal = this.extraerRucDeRuta(ruta);
        if (!rucOriginal) return false;

        const rucNormalizado = this.normalizarRuc(rucOriginal);
        const empresa = empresasPorRuc.get(rucNormalizado);
        
        if (!empresa) {
          return false;
        }

        try {
          const rutaActualizada: any = {
            empresa: {
              id: empresa.id,
              ruc: empresa.ruc,
              razonSocial: empresa.razonSocial || { principal: empresa.nombre || 'Sin razón social' }
            }
          };

          await this.updateRuta(ruta!.id, rutaActualizada).toPromise();
          return true;
        } catch (error) {
          console.error(`Error actualizando ruta ${ruta!.id}:`, error);
          return false;
        }
      });

      const resultados = await Promise.all(actualizacionesPromises);
      rutasActualizadas = resultados.filter(resultado => resultado === true).length;

    } catch (error) {
      console.error('ERROR EN NORMALIZACIÓN DE RUCs:', error);
    }
  }

  private extraerRucDeRuta(ruta: any): string | null {
    if (ruta.empresa && typeof ruta.empresa === 'object' && ruta.empresa.ruc) {
      return ruta.empresa.ruc;
    }
    
    return ruta.ruc || ruta.empresa_ruc || ruta.empresaRuc || null;
  }

  private async validarNormalizacionRucs(rutasValidas: any[]): Promise<void> {
    if (!rutasValidas || rutasValidas.length === 0) {
      return;
    }

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
      return;
    }

    const verificacionesPromises = Array.from(rucsUnicos).map(async (ruc) => {
      try {
        const response = await this.empresaService.validarRuc(ruc).toPromise();
        if (response?.empresa) {
          return { ruc, valido: true, empresa: response.empresa };
        } else {
          return { ruc, valido: false, empresa: null };
        }
      } catch (error) {
        return { ruc, valido: false, empresa: null };
      }
    });

    const verificaciones = await Promise.all(verificacionesPromises);
    
    const rucsValidos = verificaciones.filter(v => v.valido).length;
    const rucsInvalidos = verificaciones.filter(v => !v.valido).length;
    
    if (rucsInvalidos > 0) {
      const rucsNoEncontrados = verificaciones.filter(v => !v.valido).map(v => v.ruc);
      console.warn('RUCs NO ENCONTRADOS EN MÓDULO DE EMPRESAS:', rucsNoEncontrados);
    }
  }

  private async forzarNormalizacionCompleta(rutasCreadas: any[]): Promise<void> {
    if (!rutasCreadas || rutasCreadas.length === 0) {
      return;
    }

    try {
      const todasLasRutas = await this.getRutas().toPromise();
      
      if (!todasLasRutas || todasLasRutas.length === 0) {
        return;
      }

      const rutasParaNormalizar = todasLasRutas.filter(ruta => {
        if (!ruta.empresa || typeof ruta.empresa !== 'object') {
          return true;
        }
        
        if (!ruta.empresa.id || !ruta.empresa.razonSocial) {
          return true;
        }
        
        return false;
      });

      if (rutasParaNormalizar.length === 0) {
        return;
      }

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
        return;
      }

      const empresasPromises = Array.from(rucsParaNormalizar).map(async (ruc) => {
        try {
          const response = await this.empresaService.validarRuc(ruc).toPromise();
          return { ruc, empresa: response?.empresa || null };
        } catch (error) {
          console.warn(`Error obteniendo empresa para RUC ${ruc}:`, error);
          return { ruc, empresa: null };
        }
      });

      const empresasResultados = await Promise.all(empresasPromises);
      
      const empresasPorRuc = new Map<string, any>();
      empresasResultados.forEach(resultado => {
        if (resultado.empresa) {
          empresasPorRuc.set(resultado.ruc, resultado.empresa);
        }
      });

      let rutasActualizadas = 0;
      const actualizacionesPromises = rutasParaNormalizar.map(async (ruta) => {
        const rucOriginal = this.extraerRucDeRuta(ruta);
        if (!rucOriginal) return false;

        const rucNormalizado = this.normalizarRuc(rucOriginal);
        const empresa = empresasPorRuc.get(rucNormalizado);
        
        if (!empresa) {
          return false;
        }

        try {
          const rutaActualizada: any = {
            empresa: {
              id: empresa.id,
              ruc: empresa.ruc,
              razonSocial: empresa.razonSocial || { principal: empresa.nombre || 'Sin razón social' }
            }
          };

          await this.updateRuta(ruta!.id, rutaActualizada).toPromise();
          return true;
        } catch (error) {
          console.error(`Error actualizando ruta ${ruta!.id}:`, error);
          return false;
        }
      });

      const resultados = await Promise.all(actualizacionesPromises);
      rutasActualizadas = resultados.filter(resultado => resultado === true).length;

    } catch (error) {
      console.error('ERROR EN NORMALIZACIÓN COMPLETA:', error);
    }
  }
}
