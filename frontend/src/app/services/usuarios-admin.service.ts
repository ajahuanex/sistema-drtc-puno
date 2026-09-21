import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioAdmin, UsuarioAdminCreate, UsuarioAdminUpdate } from '../models/usuario-admin.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  obtenerUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(this.apiUrl);
  }

  crearUsuario(usuario: UsuarioAdminCreate): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(this.apiUrl, usuario);
  }

  actualizarUsuario(id: string, data: UsuarioAdminUpdate): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.apiUrl}/${id}`, data);
  }

  desactivarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
