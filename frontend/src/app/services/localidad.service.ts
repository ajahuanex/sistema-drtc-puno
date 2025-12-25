import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { 
  Localidad, 
  LocalidadCreate, 
  LocalidadUpdate, 
  FiltroLocalidades,
  LocalidadesPaginadas,
  TipoLocalidad
} from '../models/localidad.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/localidades`;
  
  // Signals para el estado
  private localidadesSignal = signal<Localidad[]>([]);
  private cargandoSignal = signal<boolean>(false);
  
  // BehaviorSubject para compatibilidad con observables
  private localidadesSubject = new BehaviorSubject<Localidad[]>([]);

  constructor() {
    console.log('🌍 LocalidadService inicializado - usando únicamente API');
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    });
  }

  // Getters para signals
  get localidades() {
    return this.localidadesSignal.asReadonly();
  }

  get cargando() {
    return this.cargandoSignal.asReadonly();
  }

  // Observable para compatibilidad
  get localidades$() {
    return this.localidadesSubject.asObservable();
  }

  // Obtener todas las localidades
  getLocalidades(filtros?: FiltroLocalidades): Observable<Localidad[]> {
    console.log('🔍 Obteniendo localidades desde API...');
    this.cargandoSignal.set(true);
    
    let url = this.apiUrl;
    const params = new URLSearchParams();
    
    if (filtros) {
      if (filtros.nombre) params.append('nombre', filtros.nombre);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.departamento) params.append('departamento', filtros.departamento);
      if (filtros.provincia) params.append('provincia', filtros.provincia);
      if (filtros.estaActiva !== undefined) params.append('estaActiva', filtros.estaActiva.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<Localidad[]>(url, { headers: this.getHeaders() }).pipe(
      tap(localidades => {
        console.log('✅ Localidades obtenidas desde API:', localidades.length);
        this.localidadesSignal.set(localidades);
        this.localidadesSubject.next(localidades);
        this.cargandoSignal.set(false);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo localidades:', error);
        this.cargandoSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // Obtener localidades paginadas
  getLocalidadesPaginadas(pagina: number = 1, limite: number = 10, filtros?: FiltroLocalidades): Observable<LocalidadesPaginadas> {
    return this.getLocalidades(filtros).pipe(
      map(localidades => {
        const inicio = (pagina - 1) * limite;
        const fin = inicio + limite;
        const localidadesPagina = localidades.slice(inicio, fin);
        
        return {
          localidades: localidadesPagina,
          total: localidades.length,
          pagina,
          totalPaginas: Math.ceil(localidades.length / limite)
        };
      })
    );
  }

  // Obtener localidad por ID
  getLocalidadById(id: string): Observable<Localidad | null> {
    console.log('🔍 Obteniendo localidad por ID desde API:', id);
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.get<Localidad>(url, { headers: this.getHeaders() }).pipe(
      tap(localidad => {
        console.log('✅ Localidad obtenida desde API:', localidad);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo localidad por ID:', error);
        return throwError(() => error);
      })
    );
  }

  // Crear nueva localidad
  createLocalidad(localidad: LocalidadCreate): Observable<Localidad> {
    console.log('📤 Creando localidad en API:', localidad);
    
    return this.http.post<Localidad>(this.apiUrl, localidad, { headers: this.getHeaders() }).pipe(
      tap(nuevaLocalidad => {
        console.log('✅ Localidad creada en API:', nuevaLocalidad);
        // Actualizar signals locales
        const localidades = this.localidadesSignal();
        localidades.push(nuevaLocalidad);
        this.localidadesSignal.set([...localidades]);
        this.localidadesSubject.next([...localidades]);
      }),
      catchError(error => {
        console.error('❌ Error creando localidad:', error);
        return throwError(() => error);
      })
    );
  }

  // Actualizar localidad
  updateLocalidad(id: string, localidad: LocalidadUpdate): Observable<Localidad> {
    console.log('📤 Actualizando localidad en backend:', id, localidad);
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.put<Localidad>(url, localidad, { headers: this.getHeaders() }).pipe(
      tap(localidadActualizada => {
        console.log('✅ Localidad actualizada en backend:', localidadActualizada);
        // Actualizar signals locales
        const localidades = this.localidadesSignal();
        const index = localidades.findIndex(l => l.id === id);
        if (index !== -1) {
          localidades[index] = localidadActualizada;
          this.localidadesSignal.set([...localidades]);
          this.localidadesSubject.next([...localidades]);
        }
      }),
      catchError(error => {
        console.error('❌ Error actualizando localidad:', error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar localidad (desactivar)
  deleteLocalidad(id: string): Observable<boolean> {
    console.log('📤 Eliminando localidad en backend:', id);
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.delete<void>(url, { headers: this.getHeaders() }).pipe(
      map(() => {
        console.log('✅ Localidad eliminada en backend');
        // Actualizar signals locales
        const localidades = this.localidadesSignal();
        const index = localidades.findIndex(l => l.id === id);
        if (index !== -1) {
          localidades[index].estaActiva = false;
          this.localidadesSignal.set([...localidades]);
          this.localidadesSubject.next([...localidades]);
        }
        return true;
      }),
      catchError(error => {
        console.error('❌ Error eliminando localidad:', error);
        return throwError(() => error);
      })
    );
  }

  // Activar/Desactivar localidad
  toggleEstadoLocalidad(id: string): Observable<Localidad> {
    const localidades = this.localidadesSignal();
    const localidad = localidades.find(l => l.id === id);
    if (!localidad) {
      return throwError(() => new Error('Localidad no encontrada'));
    }

    return this.updateLocalidad(id, { estaActiva: !localidad.estaActiva });
  }

  // Obtener localidades activas para selects
  getLocalidadesActivas(): Observable<Localidad[]> {
    return this.getLocalidades({ estaActiva: true });
  }

  // Obtener localidades por departamento
  getLocalidadesPorDepartamento(departamento: string): Observable<Localidad[]> {
    return this.getLocalidades({ departamento, estaActiva: true });
  }

  // Obtener localidades por tipo
  getLocalidadesPorTipo(tipo: TipoLocalidad): Observable<Localidad[]> {
    return this.getLocalidades({ tipo, estaActiva: true });
  }

  // Buscar localidades por nombre
  buscarLocalidades(termino: string): Observable<Localidad[]> {
    return this.getLocalidades({ nombre: termino, estaActiva: true });
  }

  // Validar código único
  validarCodigoUnico(codigo: string, idExcluir?: string): Observable<boolean> {
    console.log('🔍 Validando código único en API:', codigo);
    
    const url = `${this.apiUrl}/validar-codigo`;
    const body = { codigo, idExcluir };
    
    return this.http.post<{esUnico: boolean}>(url, body, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('✅ Validación de código desde API:', response.esUnico);
        return response.esUnico;
      }),
      catchError(error => {
        console.error('❌ Error validando código único:', error);
        return throwError(() => error);
      })
    );
  }

  // Importar localidades desde archivo
  importarLocalidades(localidades: LocalidadCreate[]): Observable<Localidad[]> {
    console.log('📤 Importando localidades en backend:', localidades.length);
    const url = `${this.apiUrl}/importar`;
    
    return this.http.post<Localidad[]>(url, { localidades }, { headers: this.getHeaders() }).pipe(
      tap(localidadesImportadas => {
        console.log('✅ Localidades importadas en backend:', localidadesImportadas.length);
        // Actualizar signals locales
        const localidadesActuales = this.localidadesSignal();
        const todasLasLocalidades = [...localidadesActuales, ...localidadesImportadas];
        this.localidadesSignal.set(todasLasLocalidades);
        this.localidadesSubject.next(todasLasLocalidades);
      }),
      catchError(error => {
        console.error('❌ Error importando localidades:', error);
        return throwError(() => error);
      })
    );
  }

  // Exportar localidades
  exportarLocalidades(): string {
    const localidades = this.localidadesSignal();
    return JSON.stringify(localidades, null, 2);
  }

  // Resetear a localidades por defecto
  resetearLocalidades(): Observable<Localidad[]> {
    console.log('📤 Reseteando localidades en API...');
    const url = `${this.apiUrl}/reset`;
    
    return this.http.post<Localidad[]>(url, {}, { headers: this.getHeaders() }).pipe(
      tap(localidadesReseteadas => {
        console.log('✅ Localidades reseteadas en API:', localidadesReseteadas.length);
        this.localidadesSignal.set(localidadesReseteadas);
        this.localidadesSubject.next(localidadesReseteadas);
      }),
      catchError(error => {
        console.error('❌ Error reseteando localidades:', error);
        return throwError(() => error);
      })
    );
  }

  // Calcular distancia entre dos localidades
  calcularDistancia(origenId: string, destinoId: string): Observable<number> {
    console.log('🔍 Calculando distancia entre localidades:', origenId, destinoId);
    const url = `${this.apiUrl}/calcular-distancia`;
    const body = { origenId, destinoId };
    
    return this.http.post<{distancia: number}>(url, body, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('✅ Distancia calculada desde API:', response.distancia);
        return response.distancia;
      }),
      catchError(error => {
        console.error('❌ Error calculando distancia:', error);
        return throwError(() => error);
      })
    );
  }
}