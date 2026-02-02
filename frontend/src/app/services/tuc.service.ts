import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Tuc, TucCreate, TucUpdate, EstadoTuc } from '../models/tuc.model';
import { Vehiculo } from '../models/vehiculo.model';
import { Empresa } from '../models/empresa.model';
import { Resolucion } from '../models/resolucion.model';
import { AuthService } from './auth.service';
import { VehiculoService } from './vehiculo.service';
import { EmpresaService } from './empresa.service';
import { ResolucionService } from './resolucion.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TucService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private vehiculoService = inject(VehiculoService);
  private empresaService = inject(EmpresaService);
  private resolucionService = inject(ResolucionService);

  private apiUrl = environment.apiUrl;

  // Función helper para mapear TUCs del backend al frontend
  private mapearTucBackend(tucBackend: any): Tuc {
    return {
      id: tucBackend.id,
      vehiculoId: tucBackend.vehiculo_id,
      empresaId: tucBackend.empresa_id,
      expedienteId: tucBackend.expediente_id,
      nroTuc: tucBackend.nro_tuc,
      fechaEmision: tucBackend.fecha_emision,
      fechaVencimiento: tucBackend.fecha_vencimiento,
      estado: tucBackend.estado,
      observaciones: tucBackend.observaciones,
      estaActivo: tucBackend.esta_activo,
      documentoId: tucBackend.documento_id || undefined,
      qrVerificationUrl: tucBackend.qr_verification_url || undefined,
      razonDescarte: tucBackend.razon_descarte || undefined,
      // Información relacionada incluida directamente
      vehiculo: tucBackend.vehiculo || undefined,
      empresa: tucBackend.empresa || undefined,
      resolucion: tucBackend.resolucion || undefined
    };
  }



  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los TUCs
  getTucs(skip: number = 0, limit: number = 1000, estado?: EstadoTuc): Observable<Tuc[]> {
    // Aumentar el límite para obtener todos los TUCs
    console.log('AuthService.isAuthenticated():', this.authService.isAuthenticated());
    
    if (this.authService.isAuthenticated()) {
      // console.log removed for production
      const params: any = { skip, limit };
      if (estado) params.estado = estado;

      return this.http.get<any[]>(`${this.apiUrl}/tucs`, { 
        headers: this.getHeaders(),
        params 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs desde API::', error);
          return throwError(() => error);
        })
      );
    }
    
    // Si no está autenticado, retornar array vacío
    return of([]);
  }

  // Obtener TUC por ID
  getTucById(id: string): Observable<Tuc> {
    if (this.authService.isAuthenticated()) {
      return this.http.get<any>(`${this.apiUrl}/tucs/${id}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucBackend => this.mapearTucBackend(tucBackend)),
        catchError(error => {
          console.error('Error obteniendo TUC desde API::', error);
          return throwError(() => error);
        })
      );
    }
    return throwError(() => new Error('No autenticado'));
  }

  // Obtener TUC por número
  getTucByNumero(nroTuc: string): Observable<Tuc> {
    if (this.authService.isAuthenticated()) {
      return this.http.get<any>(`${this.apiUrl}/tucs/numero/${nroTuc}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucBackend => this.mapearTucBackend(tucBackend)),
        catchError(error => {
          console.error('Error obteniendo TUC por número desde API::', error);
          return throwError(() => error);
        })
      );
    }
    return throwError(() => new Error('No autenticado'));
  }

  // Obtener TUCs por empresa
  getTucsByEmpresa(empresaId: string): Observable<Tuc[]> {
    if (this.authService.isAuthenticated()) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/empresa/${empresaId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por empresa desde API::', error);
          return of([]);
        })
      );
    }
    return of([]);
  }

  // Obtener TUCs por vehículo
  getTucsByVehiculo(vehiculoId: string): Observable<Tuc[]> {
    if (this.authService.isAuthenticated()) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/vehiculo/${vehiculoId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por vehículo desde API::', error);
          return of([]);
        })
      );
    }
    return of([]);
  }

  // Obtener TUCs por resolución
  getTucsByResolucion(resolucionId: string): Observable<Tuc[]> {
    if (this.authService.isAuthenticated()) {
      return this.http.get<any[]>(`${this.apiUrl}/tucs/resolucion/${resolucionId}`, { 
        headers: this.getHeaders() 
      }).pipe(
        map(tucsBackend => tucsBackend.map(tucBackend => this.mapearTucBackend(tucBackend))),
        catchError(error => {
          console.error('Error obteniendo TUCs por resolución desde API::', error);
          return of([]);
        })
      );
    }
    return of([]);
  }

  // Crear nuevo TUC
  createTuc(tuc: TucCreate): Observable<Tuc> {
    if (this.authService.isAuthenticated()) {
      return this.http.post<Tuc>(`${this.apiUrl}/tucs`, tuc, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error creando TUC desde API::', error);
          return throwError(() => error);
        })
      );
    }
    return throwError(() => new Error('No autenticado'));
  }

  // Actualizar TUC
  updateTuc(id: string, tuc: TucUpdate): Observable<Tuc> {
    if (this.authService.isAuthenticated()) {
      return this.http.put<Tuc>(`${this.apiUrl}/tucs/${id}`, tuc, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error actualizando TUC desde API::', error);
          return throwError(() => error);
        })
      );
    }
    return throwError(() => new Error('No autenticado'));
  }

  // Eliminar TUC
  deleteTuc(id: string): Observable<void> {
    if (this.authService.isAuthenticated()) {
      return this.http.delete<void>(`${this.apiUrl}/tucs/${id}`, { 
        headers: this.getHeaders() 
      }).pipe(
        catchError(error => {
          console.error('Error eliminando TUC desde API::', error);
          return throwError(() => error);
        })
      );
    }
    return throwError(() => new Error('No autenticado'));
  }

  // Cambiar estado del TUC
  cambiarEstadoTuc(id: string, nuevoEstado: EstadoTuc, razonDescarte?: string): Observable<Tuc> {
    const updateData: TucUpdate = { 
      estado: nuevoEstado,
      estaActivo: nuevoEstado === 'VIGENTE'
    };
    
    if (razonDescarte) {
      updateData.razonDescarte = razonDescarte;
    }

    return this.updateTuc(id, updateData);
  }

  // Generar número de TUC único
  generarNumeroTuc(): string {
    const año = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `T-${numero}-${año}`;
  }

  // Verificar si un TUC está próximo a vencer (30 días)
  isTucProximoAVencer(fechaEmision: string): boolean {
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimiento = new Date(fechaEmisionDate);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes <= 30 && diasRestantes > 0;
  }

  // Verificar si un TUC está vencido
  isTucVencido(fechaEmision: string): boolean {
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimiento = new Date(fechaEmisionDate);
    fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    
    const hoy = new Date();
    return hoy > fechaVencimiento;
  }

  // Obtener TUCs próximos a vencer
  getTucsProximosAVencer(): Observable<Tuc[]> {
    return this.getTucs().pipe(
      map(tucs => tucs.filter(tuc => 
        tuc.estado === 'VIGENTE' && 
        this.isTucProximoAVencer(tuc.fechaEmision)
      ))
    );
  }

  // Obtener TUCs vencidos
  getTucsVencidos(): Observable<Tuc[]> {
    return this.getTucs().pipe(
      map(tucs => tucs.filter(tuc => 
        tuc.estado === 'VIGENTE' && 
        this.isTucVencido(tuc.fechaEmision)
      ))
    );
  }

  // Obtener TUC con información completa (vehículo, empresa, resolución)
  getTucCompleto(id: string): Observable<{
    tuc: Tuc;
    vehiculo: Vehiculo | null;
    empresa: Empresa;
    resolucion: Resolucion;
  }> {
    return this.getTucById(id).pipe(
      switchMap(tuc => {
        // Verificar que el TUC tenga los IDs necesarios
        if (!tuc.vehiculoId || !tuc.empresaId || !tuc.expedienteId) {
          console.warn('TUC sin IDs completos:', tuc);
          // Retornar solo el TUC con objetos vacíos para las entidades relacionadas
          return of({
            tuc,
            vehiculo: null as any as Vehiculo,
            empresa: {} as Empresa,
            resolucion: {} as Resolucion
          });
        }

        // Obtener información relacionada solo si los IDs existen
        return this.vehiculoService.getVehiculo(tuc.vehiculoId).pipe(
          catchError(error => {
            console.warn('Error obteniendo vehículo, usando objeto vacío:', error);
            return of({} as Vehiculo);
          }),
          switchMap(vehiculo => 
            this.empresaService.getEmpresa(tuc.empresaId).pipe(
              catchError(error => {
                console.warn('Error obteniendo empresa, usando objeto vacío:', error);
                return of({} as Empresa);
              }),
              switchMap(empresa => 
                this.resolucionService.getResolucionById(tuc.expedienteId).pipe(
                  catchError(error => {
                    console.warn('Error obteniendo resolución, usando objeto vacío:', error);
                    return of({} as Resolucion);
                  }),
                  map(resolucion => ({
                    tuc,
                    vehiculo,
                    empresa,
                    resolucion
                  }))
                )
              )
            )
          )
        );
      })
    );
  }

  // Obtener estadísticas de TUCs
  getEstadisticasTucs(): Observable<{
    total: number;
    vigentes: number;
    dadosDeBaja: number;
    desechados: number;
    proximosAVencer: number;
    vencidos: number;
  }> {
    return this.getTucs().pipe(
      map(tucs => {
        const total = tucs.length;
        const vigentes = tucs.filter(t => t.estado === 'VIGENTE').length;
        const dadosDeBaja = tucs.filter(t => t.estado === 'DADA_DE_BAJA').length;
        const desechados = tucs.filter(t => t.estado === 'DESECHADA').length;
        const proximosAVencer = tucs.filter(t => 
          t.estado === 'VIGENTE' && this.isTucProximoAVencer(t.fechaEmision)
        ).length;
        const vencidos = tucs.filter(t => 
          t.estado === 'VIGENTE' && this.isTucVencido(t.fechaEmision)
        ).length;

        return {
          total,
          vigentes,
          dadosDeBaja,
          desechados,
          proximosAVencer,
          vencidos
        };
      })
    );
  }
} 
