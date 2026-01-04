import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  Empresa,
  EmpresaCreate,
  EmpresaUpdate,
  EmpresaFiltros,
  EmpresaEstadisticas,
  EstadoEmpresa,
  TipoDocumento
} from '../models/empresa.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Métodos principales CRUD
  getEmpresas(skip: number = 0, limit: number = 100): Observable<Empresa[]> {
    // Temporalmente sin headers para debug
    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas?skip=${skip}&limit=${limit}`).pipe(
      map(empresas => empresas.map(empresa => this.transformEmpresaData(empresa))),
      catchError(error => {
        console.error('❌ Error en getEmpresas:', error);
        console.error('URL:', `${this.apiUrl}/empresas?skip=${skip}&limit=${limit}`);
        console.error('Headers que se intentaron usar:', this.getHeaders());
        return throwError(() => error);
      })
    );
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa))
    );
  }

  createEmpresa(empresaData: EmpresaCreate): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error creando empresa:', error);
        console.error('Status:', error.status);
        console.error('Error detail:', error.error);
        return throwError(() => error);
      })
    );
  }

  updateEmpresa(id: string, empresaData: EmpresaUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${id}`, empresaData, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error actualizando empresa:', error);
        return throwError(() => error);
      })
    );
  }

  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empresas/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error eliminando empresa:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos de filtrado y búsqueda
  getEmpresasConFiltros(filtros: EmpresaFiltros): Observable<Empresa[]> {
    const params = new HttpParams()
      .set('skip', '0')
      .set('limit', '1000');

    if (filtros.ruc) params.set('ruc', filtros.ruc);
    if (filtros.razonSocial) params.set('razon_social', filtros.razonSocial);
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.fechaDesde) params.set('fecha_desde', filtros.fechaDesde.toISOString());
    if (filtros.fechaHasta) params.set('fecha_hasta', filtros.fechaHasta.toISOString());

    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas/filtros`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(empresas => empresas.map(empresa => this.transformEmpresaData(empresa))),
      catchError(error => {
        console.error('❌ Error aplicando filtros:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos de estadísticas
  getEstadisticasEmpresas(): Observable<EmpresaEstadisticas> {
    // Temporalmente sin headers para debug
    return this.http.get<EmpresaEstadisticas>(`${this.apiUrl}/empresas/estadisticas`).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para gestión de vehículos
  agregarVehiculoAEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error agregando vehículo a empresa:', error);
        return throwError(() => error);
      })
    );
  }

  removerVehiculoDeEmpresa(empresaId: string, vehiculoId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/vehiculos/${vehiculoId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error removiendo vehículo de empresa:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para gestión de conductores
  agregarConductorAEmpresa(empresaId: string, conductorId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error agregando conductor a empresa:', error);
        return throwError(() => error);
      })
    );
  }

  removerConductorDeEmpresa(empresaId: string, conductorId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/conductores/${conductorId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error removiendo conductor de empresa:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para gestión de rutas
  agregarRutaAEmpresa(empresaId: string, rutaId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error agregando ruta a empresa:', error);
        return throwError(() => error);
      })
    );
  }

  removerRutaDeEmpresa(empresaId: string, rutaId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/rutas/${rutaId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error removiendo ruta de empresa:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para gestión de resoluciones
  agregarResolucionAEmpresa(empresaId: string, resolucionId: string): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error agregando resolución a empresa:', error);
        return throwError(() => error);
      })
    );
  }

  removerResolucionDeEmpresa(empresaId: string, resolucionId: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/empresas/${empresaId}/resoluciones/${resolucionId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => {
        console.error('❌ Error removiendo resolución de empresa:', error);
        return throwError(() => error);
      })
    );
  }

  getResolucionesEmpresa(empresaId: string): Observable<{ empresa_id: string; resoluciones: string[]; total: number }> {
    return this.http.get<{ empresa_id: string; resoluciones: string[]; total: number }>(`${this.apiUrl}/empresas/${empresaId}/resoluciones`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo resoluciones de empresa:', error);
        return throwError(() => error);
      })
    );
  }

  // Método simplificado para obtener resoluciones con estructura padre/hijas
  getResoluciones(empresaId: string, incluirHijas: boolean = true): Observable<any> {
    const params = incluirHijas ? '?incluir_hijas=true' : '?incluir_hijas=false';
    return this.http.get<any>(`${this.apiUrl}/empresas/${empresaId}/resoluciones${params}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo resoluciones simplificadas:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para validación
  validarRuc(ruc: string): Observable<{ valido: boolean; empresa?: Empresa }> {
    return this.http.get<{ valido: boolean; empresa?: Empresa }>(`${this.apiUrl}/empresas/validar-ruc/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error validando RUC:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos para exportación
  exportarEmpresas(formato: 'pdf' | 'excel' | 'csv', empresasSeleccionadas?: string[], columnasVisibles?: string[]): Observable<Blob> {
    let url = `${this.apiUrl}/empresas/exportar/${formato}`;
    const params = new URLSearchParams();
    
    // Si hay empresas seleccionadas, agregarlas como parámetro
    if (empresasSeleccionadas && empresasSeleccionadas.length > 0) {
      params.append('empresas_seleccionadas', empresasSeleccionadas.join(','));
    }
    
    // Si hay columnas visibles específicas, agregarlas como parámetro
    if (columnasVisibles && columnasVisibles.length > 0) {
      params.append('columnas_visibles', columnasVisibles.join(','));
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error exportando empresas:', error);
        return throwError(() => error);
      })
    );
  }

  // Métodos auxiliares
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private transformEmpresaData(empresa: any): Empresa {
    return {
      id: empresa.id || empresa._id || '',
      ruc: empresa.ruc || '',
      razonSocial: empresa.razonSocial || empresa.razon_social || {
        principal: '',
        sunat: '',
        minimo: ''
      },
      direccionFiscal: empresa.direccionFiscal || empresa.direccion_fiscal || '',
      estado: empresa.estado || EstadoEmpresa.EN_TRAMITE,
      estaActivo: empresa.estaActivo !== undefined ? empresa.estaActivo : (empresa.esta_activo !== undefined ? empresa.esta_activo : true),
      fechaRegistro: empresa.fechaRegistro || empresa.fecha_registro || new Date(),
      representanteLegal: empresa.representanteLegal || empresa.representante_legal || {
        dni: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: ''
      },
      emailContacto: empresa.emailContacto || empresa.email_contacto || '',
      telefonoContacto: empresa.telefonoContacto || empresa.telefono_contacto || '',
      sitioWeb: empresa.sitioWeb || empresa.sitio_web || '',
      documentos: empresa.documentos || [],
      auditoria: empresa.auditoria || [],
      resolucionesPrimigeniasIds: empresa.resolucionesPrimigeniasIds || empresa.resoluciones_primigenias_ids || [],
      vehiculosHabilitadosIds: empresa.vehiculosHabilitadosIds || empresa.vehiculos_habilitados_ids || [],
      conductoresHabilitadosIds: empresa.conductoresHabilitadosIds || empresa.conductores_habilitados_ids || [],
      rutasAutorizadasIds: empresa.rutasAutorizadasIds || empresa.rutas_autorizadas_ids || [],
      datosSunat: empresa.datosSunat || empresa.datos_sunat || {
        valido: false,
        razonSocial: '',
        estado: '',
        condicion: '',
        direccion: '',
        fechaActualizacion: new Date()
      },
      ultimaValidacionSunat: empresa.ultimaValidacionSunat || empresa.ultima_validacion_sunat || new Date(),
      scoreRiesgo: empresa.scoreRiesgo || empresa.score_riesgo || 0,
      observaciones: empresa.observaciones || '',
      codigoEmpresa: empresa.codigoEmpresa || ''
    };
  }

  // Método para validación SUNAT
  validarEmpresaSunat(ruc: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/empresas/validar-sunat/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Error validando empresa con SUNAT:', error);
        return throwError(() => error);
      })
    );
  }

  // Generar número de TUC único
  generarNumeroTuc(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `T-${numero}-${año}`;
  }

  // Generar siguiente código de empresa disponible
  generarSiguienteCodigoEmpresa(): Observable<{ siguienteCodigo: string, descripcion: string, formato: string }> {
    const url = `${this.apiUrl}/empresas/siguiente-codigo`;

    return this.http.get<{ siguienteCodigo: string, descripcion: string, formato: string }>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error generando código de empresa:', error);
          return throwError(() => error);
        })
      );
  }

  // Validar código de empresa
  validarCodigoEmpresa(codigo: string): Observable<{
    codigo: string;
    esValido: boolean;
    numeroSecuencial?: number;
    tiposEmpresa?: string[];
    descripcionTipos?: string;
    error?: string;
  }> {
    const url = `${this.apiUrl}/empresas/validar-codigo/${codigo}`;

    return this.http.get<{
      codigo: string;
      esValido: boolean;
      numeroSecuencial?: number;
      tiposEmpresa?: string[];
      descripcionTipos?: string;
      error?: string;
    }>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error validando código de empresa:', error);
          return throwError(() => error);
        })
      );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA DESDE EXCEL
  // ========================================

  /**
   * Descargar plantilla Excel para carga masiva de empresas
   */
  async descargarPlantillaEmpresas(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/empresas/carga-masiva/plantilla`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_empresas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('❌ Error descargando plantilla:', error);
      throw error;
    }
  }

  /**
   * Validar archivo Excel de empresas
   */
  validarArchivoEmpresas(archivo: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al validar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Error de red al validar archivo'));
      };

      xhr.open('POST', `${this.apiUrl}/empresas/carga-masiva/validar`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }

  /**
   * Procesar carga masiva de empresas
   */
  procesarCargaMasivaEmpresas(archivo: File, soloValidar: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Error al procesar respuesta del servidor'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || 'Error al procesar archivo'));
          } catch {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Error de red al procesar archivo'));
      };

      const url = `${this.apiUrl}/empresas/carga-masiva/procesar?solo_validar=${soloValidar}`;
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
      xhr.send(formData);
    });
  }

} 
