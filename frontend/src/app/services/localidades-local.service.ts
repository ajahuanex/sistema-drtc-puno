import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, of } from 'rxjs';
import { Localidad, LocalidadCreate, LocalidadUpdate, TipoLocalidad } from '../models/localidad.model';

interface LocalidadesData {
  localidades: Localidad[];
  metadata: {
    version: string;
    fechaGeneracion: string;
    descripcion: string;
    totalRegistros: number;
    provincias: number;
    distritos: number;
    centrosPoblados: number;
    fuente: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LocalidadesLocalService {
  private localidadesSubject = new BehaviorSubject<Localidad[]>([]);
  private localidadesData: LocalidadesData | null = null;
  private nextId = 2000; // ID para nuevas localidades (se convertirá a string)

  constructor(private http: HttpClient) {
    this.cargarDatosLocales();
  }

  /**
   * Cargar datos desde el archivo JSON local
   */
  private async cargarDatosLocales(): Promise<void> {
    try {
      this.localidadesData = await this.http.get<LocalidadesData>('/assets/data/localidades.json').toPromise() as LocalidadesData;
      this.localidadesSubject.next(this.localidadesData.localidades);
      console.log('✅ Datos de localidades cargados desde archivo local:', this.localidadesData.metadata);
    } catch (error) {
      console.error('❌ Error cargando datos locales de localidades:', error);
      this.localidadesSubject.next([]);
    }
  }

  /**
   * Obtener todas las localidades
   */
  obtenerLocalidades(): Observable<Localidad[]> {
    return this.localidadesSubject.asObservable();
  }

  /**
   * Obtener localidades de forma síncrona (para compatibilidad)
   */
  obtenerLocalidadesSync(): Promise<Localidad[]> {
    return Promise.resolve(this.localidadesSubject.value);
  }

  /**
   * Obtener localidad por ID
   */
  obtenerLocalidadPorId(id: string): Observable<Localidad | null> {
    const localidades = this.localidadesSubject.value;
    const localidad = localidades.find(l => l.id === id) || null;
    return of(localidad);
  }

  /**
   * Crear nueva localidad
   */
  crearLocalidad(datos: LocalidadCreate): Observable<Localidad> {
    const nuevaLocalidad: Localidad = {
      id: (this.nextId++).toString(), // Convertir a string
      nombre: datos.nombre,
      tipo: datos.tipo || 'DISTRITO' as any,
      estaActiva: true,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      nivel_territorial: datos.nivel_territorial || 'DISTRITO' as any,
      ubigeo: datos.ubigeo,
      departamento: datos.departamento,
      provincia: datos.provincia,
      distrito: datos.distrito,
      codigo: datos.codigo,
      descripcion: datos.descripcion,
      coordenadas: datos.coordenadas,
      observaciones: datos.observaciones
    };

    const localidadesActuales = this.localidadesSubject.value;
    const localidadesActualizadas = [...localidadesActuales, nuevaLocalidad];
    this.localidadesSubject.next(localidadesActualizadas);

    console.log('✅ Localidad creada localmente:', nuevaLocalidad);
    return of(nuevaLocalidad);
  }

  /**
   * Actualizar localidad existente
   */
  actualizarLocalidad(id: string, datos: LocalidadUpdate): Observable<Localidad> {
    const localidadesActuales = this.localidadesSubject.value;
    const indice = localidadesActuales.findIndex(l => l.id === id);

    if (indice === -1) {
      throw new Error(`Localidad con ID ${id} no encontrada`);
    }

    const localidadActualizada: Localidad = {
      ...localidadesActuales[indice],
      ...datos,
      fechaActualizacion: new Date().toISOString()
    };

    const localidadesActualizadas = [...localidadesActuales];
    localidadesActualizadas[indice] = localidadActualizada;
    this.localidadesSubject.next(localidadesActualizadas);

    console.log('✅ Localidad actualizada localmente:', localidadActualizada);
    return of(localidadActualizada);
  }

  /**
   * Eliminar localidad
   */
  eliminarLocalidad(id: string): Observable<void> {
    const localidadesActuales = this.localidadesSubject.value;
    const localidadesFiltradas = localidadesActuales.filter(l => l.id !== id);
    this.localidadesSubject.next(localidadesFiltradas);

    console.log('✅ Localidad eliminada localmente, ID:', id);
    return of(void 0);
  }

  /**
   * Cambiar estado de localidad (activar/desactivar)
   */
  cambiarEstadoLocalidad(id: string, activa: boolean): Observable<Localidad> {
    return this.actualizarLocalidad(id, { estaActiva: activa });
  }

  /**
   * Obtener localidades por tipo
   */
  obtenerLocalidadesPorTipo(tipo: TipoLocalidad): Observable<Localidad[]> {
    return this.localidadesSubject.pipe(
      map(localidades => localidades.filter(l => l.tipo === tipo))
    );
  }

  /**
   * Obtener localidades por departamento
   */
  obtenerLocalidadesPorDepartamento(departamento: string): Observable<Localidad[]> {
    return this.localidadesSubject.pipe(
      map(localidades => localidades.filter(l => 
        l.departamento?.toLowerCase() === departamento.toLowerCase()
      ))
    );
  }

  /**
   * Obtener localidades por provincia
   */
  obtenerLocalidadesPorProvincia(provincia: string): Observable<Localidad[]> {
    return this.localidadesSubject.pipe(
      map(localidades => localidades.filter(l => 
        l.provincia?.toLowerCase() === provincia.toLowerCase()
      ))
    );
  }

  /**
   * Buscar localidades por término
   */
  buscarLocalidades(termino: string): Observable<Localidad[]> {
    const terminoLower = termino.toLowerCase().trim();
    
    if (!terminoLower) {
      return this.obtenerLocalidades();
    }

    return this.localidadesSubject.pipe(
      map(localidades => localidades.filter(localidad => {
        const nombre = (localidad.nombre || '').toLowerCase();
        const ubigeo = (localidad.ubigeo || '').toLowerCase();
        const departamento = (localidad.departamento || '').toLowerCase();
        const provincia = (localidad.provincia || '').toLowerCase();
        const distrito = (localidad.distrito || '').toLowerCase();
        const tipo = (localidad.tipo || '').toLowerCase();

        return nombre.includes(terminoLower) ||
               ubigeo.includes(terminoLower) ||
               departamento.includes(terminoLower) ||
               provincia.includes(terminoLower) ||
               distrito.includes(terminoLower) ||
               tipo.includes(terminoLower);
      }))
    );
  }

  /**
   * Obtener estadísticas de localidades
   */
  obtenerEstadisticas(): Observable<{
    total: number;
    provincias: number;
    distritos: number;
    centrosPoblados: number;
    activas: number;
    inactivas: number;
  }> {
    return this.localidadesSubject.pipe(
      map(localidades => {
        const provincias = localidades.filter(l => l.tipo === 'PROVINCIA').length;
        const distritos = localidades.filter(l => l.tipo === 'DISTRITO').length;
        const centrosPoblados = localidades.filter(l => l.tipo === 'CENTRO_POBLADO').length;
        const activas = localidades.filter(l => l.estaActiva).length;
        const inactivas = localidades.filter(l => !l.estaActiva).length;

        return {
          total: localidades.length,
          provincias,
          distritos,
          centrosPoblados,
          activas,
          inactivas
        };
      })
    );
  }

  /**
   * Obtener metadatos de la base de datos
   */
  obtenerMetadata() {
    return this.localidadesData?.metadata || null;
  }

  /**
   * Recargar datos desde el archivo
   */
  async recargarDatos(): Promise<void> {
    await this.cargarDatosLocales();
  }

  /**
   * Exportar datos actuales como JSON
   */
  exportarDatos(): string {
    const datosExportacion = {
      localidades: this.localidadesSubject.value,
      metadata: {
        ...this.localidadesData?.metadata,
        fechaExportacion: new Date().toISOString(),
        totalRegistros: this.localidadesSubject.value.length
      }
    };

    return JSON.stringify(datosExportacion, null, 2);
  }

  /**
   * Importar datos desde JSON
   */
  importarDatos(datosJson: string): Observable<boolean> {
    try {
      const datos = JSON.parse(datosJson) as LocalidadesData;
      
      if (!datos.localidades || !Array.isArray(datos.localidades)) {
        throw new Error('Formato de datos inválido');
      }

      this.localidadesData = datos;
      this.localidadesSubject.next(datos.localidades);
      
      console.log('✅ Datos importados exitosamente:', datos.metadata);
      return of(true);
    } catch (error) {
      console.error('❌ Error importando datos:', error);
      return of(false);
    }
  }
}