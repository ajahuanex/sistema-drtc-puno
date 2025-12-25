import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  Localidad, 
  LocalidadCreate, 
  LocalidadUpdate, 
  FiltroLocalidades,
  LocalidadesPaginadas,
  LOCALIDADES_PUNO,
  TipoLocalidad
} from '../models/localidad.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private apiUrl = 'http://localhost:8000/api/v1/localidades';
  
  // Signals para el estado
  private localidadesSignal = signal<Localidad[]>([]);
  private cargandoSignal = signal<boolean>(false);
  
  // BehaviorSubject para compatibilidad con observables
  private localidadesSubject = new BehaviorSubject<Localidad[]>([]);
  
  // Datos mock para desarrollo
  private localidadesMock: Localidad[] = [];

  constructor(private http: HttpClient) {
    this.inicializarLocalidadesMock();
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

  private inicializarLocalidadesMock(): void {
    this.localidadesMock = LOCALIDADES_PUNO.map((localidad, index) => ({
      id: `loc_${index + 1}`,
      ...localidad,
      estaActiva: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    }));
    
    this.localidadesSignal.set(this.localidadesMock);
    this.localidadesSubject.next(this.localidadesMock);
  }

  // Obtener todas las localidades
  getLocalidades(filtros?: FiltroLocalidades): Observable<Localidad[]> {
    this.cargandoSignal.set(true);
    
    // Simular llamada al backend
    return of(this.localidadesMock).pipe(
      map(localidades => {
        if (!filtros) return localidades;
        
        return localidades.filter(localidad => {
          if (filtros.nombre && !localidad.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
            return false;
          }
          if (filtros.tipo && localidad.tipo !== filtros.tipo) {
            return false;
          }
          if (filtros.departamento && !localidad.departamento.toLowerCase().includes(filtros.departamento.toLowerCase())) {
            return false;
          }
          if (filtros.provincia && !localidad.provincia.toLowerCase().includes(filtros.provincia.toLowerCase())) {
            return false;
          }
          if (filtros.estaActiva !== undefined && localidad.estaActiva !== filtros.estaActiva) {
            return false;
          }
          return true;
        });
      }),
      tap(localidades => {
        // Actualizar signals y subjects
        this.localidadesSignal.set([...this.localidadesMock]); // Usar todos los datos, no solo filtrados
        this.localidadesSubject.next([...this.localidadesMock]);
        this.cargandoSignal.set(false);
      }),
      catchError(error => {
        console.error('Error obteniendo localidades:', error);
        this.cargandoSignal.set(false);
        return of([]);
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
    const localidad = this.localidadesMock.find(l => l.id === id);
    return of(localidad || null);
  }

  // Crear nueva localidad
  createLocalidad(localidad: LocalidadCreate): Observable<Localidad> {
    const nuevaLocalidad: Localidad = {
      id: `loc_${Date.now()}`,
      ...localidad,
      estaActiva: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    this.localidadesMock.push(nuevaLocalidad);
    this.localidadesSignal.set([...this.localidadesMock]);
    this.localidadesSubject.next([...this.localidadesMock]);
    
    return of(nuevaLocalidad);
  }

  // Actualizar localidad
  updateLocalidad(id: string, localidad: LocalidadUpdate): Observable<Localidad> {
    const index = this.localidadesMock.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Localidad no encontrada');
    }

    const localidadActualizada: Localidad = {
      ...this.localidadesMock[index],
      ...localidad,
      fechaActualizacion: new Date()
    };

    this.localidadesMock[index] = localidadActualizada;
    this.localidadesSignal.set([...this.localidadesMock]);
    this.localidadesSubject.next([...this.localidadesMock]);
    
    return of(localidadActualizada);
  }

  // Eliminar localidad (desactivar)
  deleteLocalidad(id: string): Observable<boolean> {
    return this.updateLocalidad(id, { estaActiva: false }).pipe(
      map(() => true)
    );
  }

  // Activar/Desactivar localidad
  toggleEstadoLocalidad(id: string): Observable<Localidad> {
    const localidad = this.localidadesMock.find(l => l.id === id);
    if (!localidad) {
      throw new Error('Localidad no encontrada');
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
    const existe = this.localidadesMock.some(l => 
      l.codigo.toLowerCase() === codigo.toLowerCase() && l.id !== idExcluir
    );
    return of(!existe);
  }

  // Importar localidades desde archivo
  importarLocalidades(localidades: LocalidadCreate[]): Observable<Localidad[]> {
    const localidadesImportadas: Localidad[] = localidades.map((localidad, index) => ({
      id: `loc_import_${Date.now()}_${index}`,
      ...localidad,
      estaActiva: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    }));

    this.localidadesMock.push(...localidadesImportadas);
    this.localidadesSignal.set([...this.localidadesMock]);
    this.localidadesSubject.next([...this.localidadesMock]);
    
    return of(localidadesImportadas);
  }

  // Exportar localidades
  exportarLocalidades(): string {
    return JSON.stringify(this.localidadesMock, null, 2);
  }

  // Resetear a localidades por defecto
  resetearLocalidades(): Observable<Localidad[]> {
    this.inicializarLocalidadesMock();
    return of(this.localidadesMock);
  }

  // Calcular distancia entre dos localidades (método simulado)
  calcularDistancia(origenId: string, destinoId: string): Observable<number> {
    // Simulación de cálculo de distancia
    // En un sistema real, esto usaría APIs de mapas o coordenadas geográficas
    
    const origen = this.localidadesMock.find(l => l.id === origenId);
    const destino = this.localidadesMock.find(l => l.id === destinoId);
    
    if (!origen || !destino) {
      return of(0);
    }

    // Si ambas localidades tienen coordenadas, calcular distancia real
    if (origen.coordenadas && destino.coordenadas) {
      const distancia = this.calcularDistanciaHaversine(
        origen.coordenadas.latitud,
        origen.coordenadas.longitud,
        destino.coordenadas.latitud,
        destino.coordenadas.longitud
      );
      return of(Math.round(distancia));
    }

    // Distancias aproximadas por defecto (simuladas)
    const distanciasSimuladas: { [key: string]: number } = {
      'loc_1_loc_2': 45,   // Puno - Juliaca
      'loc_1_loc_11': 1350, // Puno - Lima
      'loc_1_loc_12': 290,  // Puno - Arequipa
      'loc_1_loc_13': 385,  // Puno - Cusco
      'loc_2_loc_11': 1305, // Juliaca - Lima
      'loc_2_loc_12': 245,  // Juliaca - Arequipa
    };

    const clave1 = `${origenId}_${destinoId}`;
    const clave2 = `${destinoId}_${origenId}`;
    
    return of(distanciasSimuladas[clave1] || distanciasSimuladas[clave2] || 100);
  }

  // Fórmula de Haversine para calcular distancia entre coordenadas
  private calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}