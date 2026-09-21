import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  ModuloSistema, 
  RolPermisosConfig, 
  RolPermisosUpdate,
  UsuarioPermisosResponse, 
  UsuarioPermisosUpdate,
  TestInteroperabilidadRequest,
  TestInteroperabilidadResponse,
  EndpointInteroperabilidadInfo
} from '../models/permisos.model';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/permisos`;

  /** Obtiene la lista completa de módulos del sistema */
  getModulos(): Observable<ModuloSistema[]> {
    return this.http.get<ModuloSistema[]>(`${this.apiUrl}/modulos`);
  }

  /** Obtiene la configuración de módulos permitidos por cada rol */
  getRoles(): Observable<RolPermisosConfig[]> {
    return this.http.get<RolPermisosConfig[]>(`${this.apiUrl}/roles`);
  }

  /** Actualiza los módulos permitidos para un rol */
  actualizarRolPermisos(rolId: string, modulos: string[]): Observable<RolPermisosConfig> {
    const body: RolPermisosUpdate = { modulos };
    return this.http.put<RolPermisosConfig>(`${this.apiUrl}/roles/${rolId}`, body);
  }

  /** Obtiene los permisos calculados y personalizados de un usuario */
  getPermisosUsuario(usuarioId: string): Observable<UsuarioPermisosResponse> {
    return this.http.get<UsuarioPermisosResponse>(`${this.apiUrl}/usuarios/${usuarioId}`);
  }

  /** Actualiza o restablece los módulos de un usuario */
  actualizarPermisosUsuario(
    usuarioId: string, 
    modulosPermitidos: string[] | null, 
    heredarRol: boolean
  ): Observable<UsuarioPermisosResponse> {
    const body: UsuarioPermisosUpdate = {
      modulosPermitidos,
      heredarRol
    };
    return this.http.put<UsuarioPermisosResponse>(`${this.apiUrl}/usuarios/${usuarioId}`, body);
  }

  /** Realiza una prueba de conectividad al dominio o URL de interoperabilidad */
  probarConexionInteroperabilidad(url: string, apiKey?: string): Observable<TestInteroperabilidadResponse> {
    const body: TestInteroperabilidadRequest = { url, apiKey };
    return this.http.post<TestInteroperabilidadResponse>(`${this.apiUrl}/test-conexion`, body);
  }

  /** Catálogo informativo de endpoints integrados en el sistema */
  getEndpointsDefinidos(): EndpointInteroperabilidadInfo[] {
    return [
      {
        servicio: 'SUNAT',
        nombre: 'Consulta de RUC - Datos Principales',
        metodo: 'GET',
        pathRelativo: '/api/v1/consultas/sunat-ruc/datos-principales',
        descripcion: 'Obtiene razón social, estado de contribuyente (ACTIVO), condición (HABIDO), domicilio fiscal y ubigeo.',
        parametros: '?numruc={ruc}&transport=rest&rest_format=json'
      },
      {
        servicio: 'SUNARP',
        nombre: 'Consulta Técnica Vehicular por Placa',
        metodo: 'GET',
        pathRelativo: '/api/v1/sunarp/vehiculo/{placa}',
        descripcion: 'Consulta año de fabricación, marca, modelo, número de serie/VIN, número de motor y categoría vehicular.',
        parametros: 'Path: {placa} (sin guiones, ej. Z1A123)'
      },
      {
        servicio: 'RENIEC',
        nombre: 'Consulta de Identidad por DNI',
        metodo: 'GET',
        pathRelativo: '/api/v1/reniec/dni/{dni}',
        descripcion: 'Valida identidad de conductores, apoderados y personal de empresas de transporte.',
        parametros: 'Path: {dni} (8 dígitos numéricos)'
      },
      {
        servicio: 'SUTRAN',
        nombre: 'Fiscalización e Infracciones Vehiculares',
        metodo: 'GET',
        pathRelativo: '/api/v1/sutran/infracciones/{placa}',
        descripcion: 'Verifica papeletas pendientes, medidas preventivas y récord de conductor.',
        parametros: 'Path: {placa}'
      }
    ];
  }
}
