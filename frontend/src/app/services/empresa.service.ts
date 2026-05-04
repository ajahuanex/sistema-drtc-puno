import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Empresa,
  EmpresaCreate,
  EmpresaUpdate,
  EmpresaFiltros,
  EstadoEmpresa,
  Socio,
  SocioCreate,
  SocioUpdate
} from '../models/empresa.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = `${environment.apiUrl}/empresas`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========================================
  // CRUD BÁSICO
  // ========================================

  getEmpresas(page: number = 0, limit: number = 10): Observable<Empresa[]> {
    const params = new HttpParams()
      .set('skip', (page * limit).toString())
      .set('limit', limit.toString());

    return this.http.get<Empresa[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(empresas => empresas.map(e => this.transformEmpresaData(e))),
      catchError(error => this.handleError('getEmpresas', error))
    );
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('getEmpresa', error))
    );
  }

  createEmpresa(data: EmpresaCreate): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, data, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('createEmpresa', error))
    );
  }

  updateEmpresa(id: string, data: EmpresaUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('updateEmpresa', error))
    );
  }

  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError('deleteEmpresa', error))
    );
  }

  // ========================================
  // BÚSQUEDA Y FILTROS
  // ========================================

  buscarEmpresas(termino: string): Observable<Empresa[]> {
    const params = new HttpParams().set('q', termino);

    return this.http.get<Empresa[]>(`${this.apiUrl}/buscar`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(empresas => empresas.map(e => this.transformEmpresaData(e))),
      catchError(error => this.handleError('buscarEmpresas', error))
    );
  }

  filtrarEmpresas(filtros: EmpresaFiltros): Observable<Empresa[]> {
    let params = new HttpParams();

    if (filtros.ruc) params = params.set('ruc', filtros.ruc);
    if (filtros.razonSocial) params = params.set('razon_social', filtros.razonSocial);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.estaActivo !== undefined) params = params.set('esta_activo', filtros.estaActivo.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());

    return this.http.get<Empresa[]>(`${this.apiUrl}/filtrar`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(empresas => empresas.map(e => this.transformEmpresaData(e))),
      catchError(error => this.handleError('filtrarEmpresas', error))
    );
  }

  // ========================================
  // GESTIÓN DE SOCIOS
  // ========================================

  agregarSocio(empresaId: string, socio: SocioCreate): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/${empresaId}/socios`, socio, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('agregarSocio', error))
    );
  }

  actualizarSocio(empresaId: string, dniSocio: string, datos: SocioUpdate): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/${empresaId}/socios/${dniSocio}`, datos, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('actualizarSocio', error))
    );
  }

  removerSocio(empresaId: string, dniSocio: string): Observable<Empresa> {
    return this.http.delete<Empresa>(`${this.apiUrl}/${empresaId}/socios/${dniSocio}`, {
      headers: this.getHeaders()
    }).pipe(
      map(empresa => this.transformEmpresaData(empresa)),
      catchError(error => this.handleError('removerSocio', error))
    );
  }

  getSocios(empresaId: string): Observable<Socio[]> {
    return this.http.get<Socio[]>(`${this.apiUrl}/${empresaId}/socios`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError('getSocios', error))
    );
  }

  // ========================================
  // UTILIDADES
  // ========================================

  validarRuc(ruc: string): Observable<{ valido: boolean; empresa?: Empresa }> {
    return this.http.get<{ valido: boolean; empresa?: Empresa }>(`${this.apiUrl}/validar-ruc/${ruc}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => this.handleError('validarRuc', error))
    );
  }

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/carga-masiva/plantilla`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError('descargarPlantilla', error))
    );
  }

  // ========================================
  // CARGA MASIVA DESDE GOOGLE SHEETS
  // ========================================

  procesarCargaMasivaGoogleSheets(
    empresas: any[],
    soloValidar: boolean = false
  ): Observable<any> {
    const params = new HttpParams().set('solo_validar', soloValidar.toString());

    return this.http.post(
      `${this.apiUrl}/carga-masiva/google-sheets`,
      empresas,
      {
        headers: this.getHeaders(),
        params
      }
    ).pipe(
      catchError(error => this.handleError('procesarCargaMasivaGoogleSheets', error))
    );
  }

  // ========================================
  // TRANSFORMACIÓN DE DATOS
  // ========================================

  private transformEmpresaData(empresa: any): Empresa {
    return {
      id: empresa.id || empresa._id || '',
      ruc: empresa.ruc || '',
      razonSocial: empresa.razonSocial || empresa.razon_social || {
        principal: 'Sin razón social'
      },
      direccionFiscal: empresa.direccionFiscal || empresa.direccion_fiscal || '',
      estado: empresa.estado || EstadoEmpresa.EN_TRAMITE,
      tiposServicio: empresa.tiposServicio || empresa.tipos_servicio || [],
      estaActivo: empresa.estaActivo !== undefined ? empresa.estaActivo : true,
      fechaRegistro: empresa.fechaRegistro ? new Date(empresa.fechaRegistro) : new Date(),
      fechaActualizacion: empresa.fechaActualizacion ? new Date(empresa.fechaActualizacion) : undefined,
      socios: empresa.socios || [],
      emailContacto: empresa.emailContacto || empresa.email_contacto || '',
      telefonoContacto: empresa.telefonoContacto || empresa.telefono_contacto || '',
      sitioWeb: empresa.sitioWeb || empresa.sitio_web || '',
      observaciones: empresa.observaciones || ''
    };
  }

  private handleError(context: string, error: any): Observable<never> {
    console.error(`❌ Error en ${context}:`, error);
    return throwError(() => error);
  }
}
