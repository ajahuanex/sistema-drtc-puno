import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError, map, tap, switchMap } from 'rxjs';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { AuthService } from './auth.service';
import { ConfiguracionService } from './configuracion.service';
import { DataManagerClientService } from './data-manager-client.service';
import { HistorialVehicularService } from './historial-vehicular.service';
import { TipoEventoHistorial, EstadoVehiculo } from '../models/historial-vehicular.model';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

// Interfaces para carga masiva
interface VehiculoValidacion {
  fila: number;
  placa: string;
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

interface CargaMasivaResponse {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];
  errores_detalle: {
    fila: number;
    placa: string;
    errores: string[];
  }[];
}

interface EstadisticasCargaMasiva {
  total_cargas: number;
  vehiculos_cargados_total: number;
  ultima_carga: string;
  promedio_exitosos: number;
  errores_comunes: {
    error: string;
    frecuencia: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private configuracionService = inject(ConfiguracionService);
  private dataManager = inject(DataManagerClientService);
  private historialService = inject(HistorialVehicularService);
  
  private apiUrl = environment.apiUrl;



  // Constructor removido - usando inject() en las propiedades

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ========================================
  // MÉTODOS BÁSICOS CRUD
  // ========================================

  getVehiculos(): Observable<Vehiculo[]> {
    // SOLO API REAL - NO DATAMANAGER
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todos los vehículos incluyendo los eliminados (para administradores)
   */
  getTodosLosVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/todos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo todos los vehículos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener solo los vehículos eliminados
   */
  getVehiculosEliminados(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos`, {
      headers: this.getHeaders()
    }).pipe(
      map(vehiculos => vehiculos.filter(vehiculo => vehiculo.estaActivo === false)),
      catchError(error => {
        console.error('Error obteniendo vehículos eliminados:', error);
        return of([]);
      })
    );
  }

  /**
   * Restaurar un vehículo eliminado (cambiar estado de ELIMINADO a ACTIVO)
   */
  restaurarVehiculo(id: string): Observable<void> {
    return this.getVehiculo(id).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        if (vehiculo.estaActivo !== false) {
          return throwError(() => new Error('El vehículo no está eliminado'));
        }

        const vehiculoRestaurado: VehiculoUpdate = {
          estado: 'ACTIVO',
          estaActivo: true
        };

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculoRestaurado, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(() => {
            // Registrar restauración en el historial
            return this.historialService.crearRegistroHistorial({
              vehiculoId: id,
              placa: vehiculo.placa,
              tipoEvento: TipoEventoHistorial.MODIFICACION,
              descripcion: `Vehículo ${vehiculo.placa} restaurado del estado eliminado`,
              fechaEvento: new Date().toISOString(),
              estadoAnterior: EstadoVehiculo.DADO_DE_BAJA,
              estadoNuevo: EstadoVehiculo.ACTIVO,
              observaciones: 'Restauración de vehículo previamente eliminado'
            }).pipe(
              map(() => undefined),
              catchError(error => {
                console.error('Error registrando restauración:', error);
                return of(undefined);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error restaurando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  getVehiculo(id: string): Observable<Vehiculo | null> {
    // SOLO API REAL - NO DATAMANAGER
    return this.http.get<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo vehículo:', error);
        return of(null);
      })
    );
  }

  createVehiculo(vehiculo: VehiculoCreate): Observable<Vehiculo> {
    // SOLO API REAL - NO DATAMANAGER
    console.log('🔍 Creando vehículo en API real:', vehiculo);
    return this.http.post<Vehiculo>(`${this.apiUrl}/vehiculos`, vehiculo, {
      headers: this.getHeaders()
    }).pipe(
      switchMap(vehiculoCreado => {
        // Registrar en el historial vehicular
        return this.historialService.registrarCreacionVehiculo(
          vehiculoCreado.id,
          vehiculoCreado.placa,
          vehiculoCreado
        ).pipe(
          map(() => vehiculoCreado),
          catchError(error => {
            console.error('Error registrando historial de creación:', error);
            // No fallar la creación del vehículo por error en historial
            return of(vehiculoCreado);
          })
        );
      }),
      catchError(error => {
        console.error('Error creando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  updateVehiculo(id: string, vehiculo: VehiculoUpdate): Observable<Vehiculo> {
    // Primero obtener los datos actuales para el historial
    return this.getVehiculo(id).pipe(
      switchMap(vehiculoAnterior => {
        if (!vehiculoAnterior) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        return this.http.put<Vehiculo>(`${this.apiUrl}/vehiculos/${id}`, vehiculo, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(vehiculoActualizado => {
            // Registrar cambios en el historial
            const promesasHistorial: Observable<any>[] = [];

            // Detectar transferencia de empresa
            if (vehiculo.empresaActualId && vehiculoAnterior.empresaActualId !== vehiculo.empresaActualId) {
              promesasHistorial.push(
                this.historialService.registrarTransferenciaEmpresa(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior.empresaActualId || '',
                  vehiculo.empresaActualId,
                  'Empresa Anterior', // TODO: Obtener nombres reales
                  'Empresa Nueva'
                ).pipe(catchError(error => {
                  console.error('Error registrando transferencia:', error);
                  return of(null);
                }))
              );
            }

            // Detectar cambio de estado
            if (vehiculo.estado && vehiculoAnterior.estado !== vehiculo.estado) {
              promesasHistorial.push(
                this.historialService.registrarCambioEstado(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior.estado as EstadoVehiculo,
                  vehiculo.estado as EstadoVehiculo
                ).pipe(catchError(error => {
                  console.error('Error registrando cambio de estado:', error);
                  return of(null);
                }))
              );
            }

            // Registrar modificación general si no hay eventos específicos
            if (promesasHistorial.length === 0) {
              promesasHistorial.push(
                this.historialService.registrarModificacionVehiculo(
                  id,
                  vehiculoActualizado.placa,
                  vehiculoAnterior,
                  vehiculoActualizado
                ).pipe(catchError(error => {
                  console.error('Error registrando modificación:', error);
                  return of(null);
                }))
              );
            }

            // Ejecutar registros de historial en paralelo sin bloquear la respuesta
            promesasHistorial.forEach(promesa => promesa.subscribe());

            return of(vehiculoActualizado);
          })
        );
      }),
      catchError(error => {
        console.error('Error actualizando vehículo:', error);
        return throwError(() => error);
      })
    );
  }

  deleteVehiculo(id: string): Observable<void> {
    return this.getVehiculo(id).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        // Usar DELETE en lugar de PUT para eliminación lógica
        return this.http.delete<void>(`${this.apiUrl}/vehiculos/${id}`, {
          headers: this.getHeaders()
        }).pipe(
          switchMap(() => {
            // Registrar eliminación lógica en el historial
            return this.historialService.crearRegistroHistorial({
              vehiculoId: id,
              placa: vehiculo.placa,
              tipoEvento: TipoEventoHistorial.BAJA_DEFINITIVA,
              descripcion: `Vehículo ${vehiculo.placa} eliminado del sistema (borrado lógico)`,
              fechaEvento: new Date().toISOString(),
              estadoAnterior: vehiculo.estado as EstadoVehiculo,
              estadoNuevo: EstadoVehiculo.DADO_DE_BAJA,
              observaciones: 'Eliminación lógica del vehículo - El registro se mantiene en la base de datos'
            }).pipe(
              map(() => undefined),
              catchError(error => {
                console.error('Error registrando eliminación lógica:', error);
                return of(undefined);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error eliminando vehículo (borrado lógico):', error);
        return throwError(() => error);
      })
    );
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * Cambiar estado de un vehículo con registro en historial
   */
  cambiarEstadoVehiculo(
    vehiculoId: string, 
    nuevoEstado: string, 
    motivo: string, 
    observaciones?: string
  ): Observable<Vehiculo> {
    console.log('[VEHICULO-SERVICE] 🔄 Cambiando estado de vehículo:', { vehiculoId, nuevoEstado, motivo });
    
    return this.getVehiculo(vehiculoId).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        const vehiculoUpdate: VehiculoUpdate = {
          estado: nuevoEstado
        };

        // Agregar campos de baja si es necesario
        if (nuevoEstado !== 'ACTIVO') {
          vehiculoUpdate.fechaBaja = new Date().toISOString();
          if (motivo) {
            vehiculoUpdate.motivoBaja = motivo;
          }
          if (observaciones) {
            vehiculoUpdate.observacionesBaja = observaciones;
          }
        }

        return this.updateVehiculo(vehiculoId, vehiculoUpdate);
      }),
      catchError(error => {
        console.error('[VEHICULO-SERVICE] ❌ Error cambiando estado:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener vehículos por empresa
   */
  getVehiculosPorEmpresa(empresaId: string): Observable<Vehiculo[]> {
    console.log('[VEHICULO-SERVICE] 🏢 Obteniendo vehículos por empresa:', empresaId);
    
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/empresa/${empresaId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('[VEHICULO-SERVICE] ❌ Error obteniendo vehículos por empresa:', error);
        return of([]);
      })
    );
  }

  /**
   * Validar si una placa ya existe
   */
  validarPlacaExistente(placa: string, vehiculoIdExcluir?: string): Observable<boolean> {
    console.log('[VEHICULO-SERVICE] 🔍 Validando placa existente:', placa);
    
    let url = `${this.apiUrl}/vehiculos/validar-placa/${encodeURIComponent(placa)}`;
    if (vehiculoIdExcluir) {
      url += `?excluir=${vehiculoIdExcluir}`;
    }
    
    return this.http.get<{ existe: boolean }>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.existe),
      catchError(error => {
        console.error('[VEHICULO-SERVICE] ❌ Error validando placa:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtener estadísticas de vehículos
   */
  getEstadisticasVehiculos(): Observable<any> {
    console.log('[VEHICULO-SERVICE] 📊 Obteniendo estadísticas de vehículos');
    
    return this.http.get<any>(`${this.apiUrl}/vehiculos/estadisticas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('[VEHICULO-SERVICE] ❌ Error obteniendo estadísticas:', error);
        return of({
          total: 0,
          activos: 0,
          inactivos: 0,
          porEstado: {},
          porEmpresa: {}
        });
      })
    );
  }

  // ========================================
  // MÉTODOS DE CARGA MASIVA (SIMPLIFICADOS)
  // ========================================

  validarArchivoExcel(archivo: File): Observable<VehiculoValidacion[]> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<any>(`${this.apiUrl}/vehiculos/validar-excel`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      map(response => response.validaciones || []),
      catchError(error => {
        console.error('Error validando archivo:', error);
        return of([]);
      })
    );
  }

  procesarCargaMasiva(archivo: File, empresaId: string): Observable<CargaMasivaResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('empresa_id', empresaId);

    return this.http.post<CargaMasivaResponse>(`${this.apiUrl}/vehiculos/carga-masiva`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      catchError(error => {
        console.error('Error en carga masiva:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasCargaMasiva(): Observable<EstadisticasCargaMasiva> {
    return this.http.get<EstadisticasCargaMasiva>(`${this.apiUrl}/vehiculos/estadisticas-carga-masiva`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return of({
          total_cargas: 0,
          vehiculos_cargados_total: 0,
          ultima_carga: '',
          promedio_exitosos: 0,
          errores_comunes: []
        });
      })
    );
  }

  /**
   * Marca vehículos como historial actual
   */
  async marcarVehiculosHistorialActual(): Promise<any> {
    try {
      const response = await this.http.post(`${this.apiUrl}/vehiculos/marcar-historial-actual`, {}, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error marcando vehículos como historial actual:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas filtradas
   */
  async obtenerEstadisticasFiltrado(): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/estadisticas-filtrado`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas filtradas:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial detallado de un vehículo
   */
  async obtenerHistorialDetallado(vehiculoId: string): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/${vehiculoId}/historial-detallado`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo historial detallado:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de historial
   */
  async obtenerEstadisticasHistorial(): Promise<any> {
    try {
      const response = await this.http.get(`${this.apiUrl}/vehiculos/estadisticas-historial`, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error obteniendo estadísticas de historial:', error);
      throw error;
    }
  }

  /**
   * Actualiza historial de todos los vehículos
   */
  async actualizarHistorialTodos(): Promise<any> {
    try {
      const response = await this.http.post(`${this.apiUrl}/vehiculos/actualizar-historial-todos`, {}, {
        headers: this.getHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('Error actualizando historial de todos:', error);
      throw error;
    }
  }

  getVehiculoById(id: string): Observable<Vehiculo | null> {
    return this.getVehiculo(id);
  }

  getVehiculoByPlaca(placa: string): Observable<Vehiculo | null> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/validar-placa/${placa}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.vehiculo || null),
      catchError(() => of(null))
    );
  }

  getVehiculosPorResolucion(resolucionId: string): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/resolucion/${resolucionId}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  async obtenerVehiculosVisibles(): Promise<Vehiculo[]> {
    try {
      const response = await this.http.get<Vehiculo[]>(`${this.apiUrl}/vehiculos/visibles`, {
        headers: this.getHeaders()
      }).toPromise();
      return response || [];
    } catch (error: any) {
      console.error('Error obteniendo vehículos visibles:', error);
      return [];
    }
  }

  /**
   * Descargar plantilla Excel para carga masiva de vehículos
   */
  descargarPlantillaExcel(): Observable<Blob> {
    console.log('[VEHICULO-SERVICE] 📥 Generando plantilla Excel local con orden correcto...');
    
    // Usar directamente la plantilla local actualizada con el orden correcto
    return this.crearPlantillaLocal();
  }

  /**
   * Descargar plantilla desde el backend (cuando esté actualizado)
   */
  descargarPlantillaExcelBackend(): Observable<Blob> {
    console.log('[VEHICULO-SERVICE] 📥 Descargando plantilla Excel desde backend...');
    
    return this.http.get(`${this.apiUrl}/vehiculos/carga-masiva/plantilla`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('[VEHICULO-SERVICE] ✅ Plantilla Excel descargada exitosamente desde backend');
      }),
      catchError(error => {
        console.error('[VEHICULO-SERVICE] ❌ Error descargando plantilla Excel desde backend:', error);
        
        // Fallback: crear plantilla local si el backend no está disponible
        return this.crearPlantillaLocal();
      })
    );
  }

  /**
   * Crear plantilla Excel local como fallback
   */
  private crearPlantillaLocal(): Observable<Blob> {
    console.log('[VEHICULO-SERVICE] 🔄 Creando plantilla Excel local como fallback...');
    
    try {
      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Definir las columnas con sus descripciones según la nueva estructura
      const columnas = [
        { campo: 'RUC Empresa', descripcion: 'RUC de la empresa transportista (11 dígitos)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Resolución Primigenia', descripcion: 'Número de resolución primigenia (Ej: R-0123-2025 o 0123-2025)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'DNI', descripcion: 'DNI del propietario (1-8 dígitos, se completa automáticamente)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Resolución Hija', descripcion: 'Número de resolución hija (Ej: R-0124-2025 o 0124-2025)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Fecha Resolución', descripcion: 'Fecha de la resolución (DD/MM/AAAA)', obligatorio: 'NO', tipo: 'Fecha' },
        { campo: 'Tipo de Resolución', descripcion: 'Tipo de resolución (Autorización, Modificación, etc.)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Placa de Baja', descripcion: 'Placa del vehículo anterior en caso de sustitución', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Placa', descripcion: 'Placa del vehículo (Ej: ABC-123)', obligatorio: 'SÍ', tipo: 'Texto' },
        { campo: 'Marca', descripcion: 'Marca del vehículo', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Modelo', descripcion: 'Modelo del vehículo', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Año Fabricación', descripcion: 'Año de fabricación (1990-2026)', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Color', descripcion: 'Color del vehículo', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Categoría', descripcion: 'Categoría (M1, M2, M3, N1, N2, N3)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Carroceria', descripcion: 'Tipo de carrocería', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Tipo Combustible', descripcion: 'Tipo de combustible (Gasolina, Diesel, GLP, etc.)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Motor', descripcion: 'Número de motor', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Número Serie VIN', descripcion: 'Número de serie VIN del vehículo', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Numero de pasajeros', descripcion: 'Número total de pasajeros (1-200, diferente de asientos)', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Asientos', descripcion: 'Número de asientos (1-100)', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Cilindros', descripcion: 'Número de cilindros del motor', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Ejes', descripcion: 'Número de ejes del vehículo', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Ruedas', descripcion: 'Número de ruedas del vehículo', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Peso Bruto (t)', descripcion: 'Peso bruto en toneladas', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Peso Neto (t)', descripcion: 'Peso neto en toneladas', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Carga Útil (t)', descripcion: 'Carga útil en toneladas (se calcula automáticamente)', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Largo (m)', descripcion: 'Largo del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Ancho (m)', descripcion: 'Ancho del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Alto (m)', descripcion: 'Alto del vehículo en metros', obligatorio: 'NO', tipo: 'Decimal' },
        { campo: 'Cilindrada', descripcion: 'Cilindrada del motor en cc', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Potencia (HP)', descripcion: 'Potencia del motor en caballos de fuerza', obligatorio: 'NO', tipo: 'Número' },
        { campo: 'Estado', descripcion: 'Estado del vehículo (ACTIVO, INACTIVO, etc.)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Observaciones', descripcion: 'Observaciones adicionales del vehículo', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Sede de Registro', descripcion: 'Sede donde se registra el vehículo (opcional)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Expediente', descripcion: 'Número de expediente (Ej: E-01234-2025 o 01234-2025)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'TUC', descripcion: 'Número de TUC (Ej: T-123456-2024 o 123456 o 123)', obligatorio: 'NO', tipo: 'Texto' },
        { campo: 'Rutas Asignadas', descripcion: 'Rutas asignadas (formato: 1 o 01 o 01,02,03)', obligatorio: 'NO', tipo: 'Texto' }
      ];

      // Hoja 1: Instrucciones
      const instrucciones = [
        ['PLANTILLA DE CARGA MASIVA DE VEHÍCULOS - SIRRET'],
        ['Sistema Integral de Registros y Regulación de Empresas de Transporte'],
        [''],
        ['INSTRUCCIONES DE USO:'],
        ['1. Complete los datos en la hoja "DATOS" usando las columnas correspondientes'],
        ['2. Los campos marcados como obligatorios (SÍ) deben completarse'],
        ['3. La placa debe ser única y seguir el formato peruano (ABC-123)'],
        ['4. Use punto (.) como separador decimal para números'],
        ['5. Consulte la hoja "REFERENCIA" para ver descripciones de campos'],
        ['6. La hoja "DATOS" está lista para completar (sin ejemplos que eliminar)'],
        [''],
        ['CAMPOS OBLIGATORIOS:'],
        ['• Placa: Placa del vehículo (formato ABC-123)'],
        [''],
        ['CAMPOS CON AUTOCOMPLETADO:'],
        ['• DNI: Se completa automáticamente a 8 dígitos (123 → 00000123)'],
        ['• TUC: Se completa automáticamente a 6 dígitos (123 → 000123)'],
        [''],
        ['EJEMPLOS DE DATOS VÁLIDOS:'],
        ['Ejemplo 1 - Vehículo de transporte público (con prefijos):'],
        ['20123456789,R-0123-2025,1234567,R-0124-2025,15/01/2024,Autorización,,ABC-123,MERCEDES BENZ,SPRINTER,2020,BLANCO,M3,MINIBUS,DIESEL,MB123456789,VIN123456789,20,20,4,2,6,5.5,3.5,2.0,8.5,2.4,2.8,2400,150,ACTIVO,Vehículo en buen estado,LIMA,E-01234-2025,T-123456-2024,01,02,03'],
        [''],
        ['Ejemplo 2 - Vehículo sin prefijos (también válido):'],
        ['20987654321,0125-2025,123456,0126-2025,20/01/2024,Modificación,,DEF-456,TOYOTA,HIACE,2019,AZUL,M2,MINIBUS,GASOLINA,TY987654321,VIN987654321,15,15,4,2,4,4.2,2.8,1.4,6.2,1.9,2.3,2000,120,ACTIVO,Vehículo operativo,AREQUIPA,01235-2025,123456,02,04'],
        [''],
        ['Ejemplo 3 - Solo campos obligatorios:'],
        [',,,,,,,,GHI-789,,,,,,,,,,,,,,,,,,,,,,,,,,,'],
        [''],
        ['FORMATOS VÁLIDOS:'],
        ['• Placa: 3 caracteres alfanuméricos + guión + 3 números (ABC-123)'],
        ['• RUC: 11 dígitos numéricos'],
        ['• DNI: 1-8 dígitos numéricos (se completa automáticamente a 8)'],
        ['• Fecha: DD/MM/AAAA (15/01/2024)'],
        ['• Resoluciones: R-0123-2025 o 0123-2025 (prefijo R- opcional)'],
        ['• Expediente: E-01234-2025 o 01234-2025 (prefijo E- opcional)'],
        ['• TUC: T-123456-2024 o 123456 o 123 (prefijo T- opcional, se completa a 6 dígitos)'],
        ['• Rutas: 1 o 01 o 01,02,03 (números separados por comas)'],
        ['• Año: Entre 1990 y ' + (new Date().getFullYear() + 1)],
        ['• Números de pasajeros/asientos: Entre 1 y 100'],
        ['• Pesos: En toneladas con decimales (3.5)'],
        ['• Dimensiones: En metros con decimales (8.5)'],
        [''],
        ['NOTAS IMPORTANTES:'],
        ['• Verifique que no haya placas duplicadas'],
        ['• Los datos numéricos deben usar formato correcto'],
        ['• La hoja DATOS está lista para usar - no hay ejemplos que eliminar'],
        ['• Las rutas se separan por comas si hay múltiples'],
        ['• Los prefijos R-, E-, T- son OPCIONALES en resoluciones, expediente y TUC'],
        ['• El DNI se completará automáticamente a 8 dígitos (123 → 00000123)'],
        ['• El TUC se completará automáticamente a 6 dígitos (123 → 000123)'],
        ['• Solo la PLACA es obligatoria, todos los demás campos son opcionales'],
        ['• DNI actualiza el representante legal de la empresa (no del vehículo)'],
        ['• Numero de pasajeros es diferente de asientos (capacidad total vs disponibles)'],
        ['• Placa de Baja se usa para lógica de sustitución de vehículos'],
        ['• Resoluciones y fechas se actualizan automáticamente si es necesario'],
        ['• Consulte con el administrador si tiene dudas'],
        [''],
        ['CAMPOS NUEVOS Y ACTUALIZADOS:'],
        ['• Placa de Baja: Para sustituciones de vehículos (opcional)'],
        ['• Numero de pasajeros: Capacidad total (diferente de asientos)'],
        ['• DNI: Se actualiza en la empresa del RUC proporcionado'],
        ['• Resoluciones: Se actualizan fechas si es necesario'],
        ['• Expediente: Se relaciona con las resoluciones'],
        [''],
        ['Fecha de creación: ' + new Date().toLocaleDateString('es-PE')],
        ['Versión del sistema: SIRRET v1.0.0'],
        ['Total de campos: 36 (2 obligatorios, 34 opcionales)']
      ];

      const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
      XLSX.utils.book_append_sheet(workbook, wsInstrucciones, 'INSTRUCCIONES');

      // Hoja 2: Referencia de campos
      const referencia = [
        ['CAMPO', 'DESCRIPCIÓN', 'OBLIGATORIO', 'TIPO', 'EJEMPLO'],
        ...columnas.map(col => [
          col.campo,
          col.descripcion,
          col.obligatorio,
          col.tipo,
          this.getEjemploParaCampo(col.campo)
        ])
      ];

      const wsReferencia = XLSX.utils.aoa_to_sheet(referencia);
      XLSX.utils.book_append_sheet(workbook, wsReferencia, 'REFERENCIA');

      // Hoja 3: Datos (donde el usuario completará) - VERSIÓN SIMPLIFICADA
      const headers = columnas.map(col => col.campo);
      
      // Crear filas vacías con el número correcto de columnas (36)
      const filaVacia = new Array(36).fill('');
      
      const datosPlanilla = [
        headers,
        // Solo filas vacías para que el usuario complete - SIN EJEMPLOS
        [...filaVacia],
        [...filaVacia],
        [...filaVacia],
        [...filaVacia],
        [...filaVacia]
      ];

      const wsDatos = XLSX.utils.aoa_to_sheet(datosPlanilla);
      
      // Aplicar estilos a los headers
      const range = XLSX.utils.decode_range(wsDatos['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!wsDatos[cellAddress]) continue;
        wsDatos[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        };
      }

      // Aplicar estilos a las filas de separación
      for (let col = range.s.c; col <= range.e.c; col++) {
        // Fila de ejemplos
        const exampleSeparatorAddress = XLSX.utils.encode_cell({ r: 1, c: col });
        if (wsDatos[exampleSeparatorAddress]) {
          wsDatos[exampleSeparatorAddress].s = {
            font: { bold: true, color: { rgb: "FF6600" } },
            fill: { fgColor: { rgb: "FFF3E0" } },
            alignment: { horizontal: "center" }
          };
        }
        
        // Fila de datos del usuario
        const userSeparatorAddress = XLSX.utils.encode_cell({ r: 5, c: col });
        if (wsDatos[userSeparatorAddress]) {
          wsDatos[userSeparatorAddress].s = {
            font: { bold: true, color: { rgb: "2E7D32" } },
            fill: { fgColor: { rgb: "E8F5E8" } },
            alignment: { horizontal: "center" }
          };
        }
      }

      // Establecer ancho de columnas
      wsDatos['!cols'] = headers.map(() => ({ width: 15 }));

      XLSX.utils.book_append_sheet(workbook, wsDatos, 'DATOS');

      // Generar el archivo Excel
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      console.log('[VEHICULO-SERVICE] ✅ Plantilla Excel creada exitosamente');
      return of(blob);
      
    } catch (error) {
      console.error('[VEHICULO-SERVICE] ❌ Error creando plantilla Excel:', error);
      
      // Fallback a CSV si falla la generación de Excel
      return this.crearPlantillaCSVFallback();
    }
  }

  /**
   * Obtener ejemplo para un campo específico
   */
  private getEjemploParaCampo(campo: string): string {
    const ejemplos: { [key: string]: string } = {
      'RUC Empresa': '20123456789',
      'Resolución Primigenia': '0123-2025',
      'DNI': '1234567',
      'Resolución Hija': '0124-2025',
      'Fecha Resolución': '15/01/2024',
      'Tipo de Resolución': 'Autorización',
      'Placa de Baja': 'XYZ-789',
      'Placa': 'ABC-123',
      'Marca': 'MERCEDES BENZ',
      'Modelo': 'SPRINTER',
      'Año Fabricación': '2020',
      'Color': 'BLANCO',
      'Categoría': 'M3',
      'Carroceria': 'MINIBUS',
      'Tipo Combustible': 'DIESEL',
      'Motor': 'MB123456789',
      'Número Serie VIN': 'VIN123456789',
      'Numero de pasajeros': '20',
      'Asientos': '20',
      'Cilindros': '4',
      'Ejes': '2',
      'Ruedas': '6',
      'Peso Bruto (t)': '5.5',
      'Peso Neto (t)': '3.5',
      'Carga Útil (t)': '2.0',
      'Largo (m)': '8.5',
      'Ancho (m)': '2.4',
      'Alto (m)': '2.8',
      'Cilindrada': '2400',
      'Potencia (HP)': '150',
      'Estado': 'ACTIVO',
      'Observaciones': 'Vehículo en buen estado',
      'Sede de Registro': 'LIMA',
      'Expediente': '01234-2025',
      'TUC': '123456',
      'Rutas Asignadas': '01,02,03'
    };
    
    return ejemplos[campo] || '';
  }

  /**
   * Procesar carga masiva de vehículos (crear o actualizar)
   */
  cargaMasivaVehiculos(archivo: File): Observable<any> {
    console.log('[CARGA-MASIVA] 🚀 Iniciando procesamiento de carga masiva');
    
    // Usar directamente el endpoint de carga masiva del backend
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    return this.http.post<any>(`${this.apiUrl}/vehiculos/carga-masiva`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    }).pipe(
      tap(resultado => {
        console.log('[CARGA-MASIVA] ✅ Resultado del backend:', resultado);
      }),
      catchError(error => {
        console.error('[CARGA-MASIVA] ❌ Error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Procesar vehículos en lote (crear o actualizar)
   */
  private procesarVehiculosEnLote(validaciones: any[], archivo: File): Observable<any> {
    return new Observable(observer => {
      // Leer datos del archivo nuevamente para obtener información completa
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: any;
          let jsonData: any[][] = [];

          if (archivo.name.toLowerCase().endsWith('.csv')) {
            const content = data as string;
            const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            jsonData = lines.map(line => line.split(',').map(cell => cell.trim()));
          } else {
            workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.Sheets['DATOS'] ? 'DATOS' : workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '',
              raw: false 
            }) as any[][];
          }

          // Procesar cada vehículo
          const resultados = {
            total_procesados: 0,
            exitosos: 0,
            errores: 0,
            vehiculos_creados: [] as string[],
            vehiculos_actualizados: [] as string[],
            errores_detalle: [] as any[]
          };

          const procesarVehiculo = (index: number) => {
            if (index >= validaciones.length) {
              // Terminamos de procesar todos
              observer.next(resultados);
              observer.complete();
              return;
            }

            const validacion = validaciones[index];
            const filaData = this.encontrarFilaPorPlaca(jsonData, validacion.placa);
            
            if (!filaData) {
              resultados.errores++;
              resultados.errores_detalle.push({
                placa: validacion.placa,
                errores: ['No se encontraron datos para esta placa']
              });
              procesarVehiculo(index + 1);
              return;
            }

            // Verificar si el vehículo existe
            this.verificarPlacaDisponible(validacion.placa).subscribe({
              next: (disponible) => {
                const vehiculoData = this.convertirFilaAVehiculo(filaData);
                
                if (disponible) {
                  // Crear nuevo vehículo
                  this.createVehiculo(vehiculoData).subscribe({
                    next: (vehiculoCreado) => {
                      resultados.exitosos++;
                      resultados.vehiculos_creados.push(vehiculoCreado.placa);
                      resultados.total_procesados++;
                      procesarVehiculo(index + 1);
                    },
                    error: (error) => {
                      resultados.errores++;
                      resultados.errores_detalle.push({
                        placa: validacion.placa,
                        errores: [error.message || 'Error al crear vehículo']
                      });
                      resultados.total_procesados++;
                      procesarVehiculo(index + 1);
                    }
                  });
                } else {
                  // Actualizar vehículo existente
                  this.obtenerVehiculoPorPlaca(validacion.placa).subscribe({
                    next: (vehiculoExistente) => {
                      if (vehiculoExistente) {
                        const vehiculoActualizado = { ...vehiculoExistente, ...vehiculoData };
                        this.updateVehiculo(vehiculoExistente.id, vehiculoActualizado).subscribe({
                          next: (vehiculoModificado) => {
                            resultados.exitosos++;
                            resultados.vehiculos_actualizados.push(vehiculoModificado.placa);
                            resultados.total_procesados++;
                            procesarVehiculo(index + 1);
                          },
                          error: (error) => {
                            resultados.errores++;
                            resultados.errores_detalle.push({
                              placa: validacion.placa,
                              errores: [error.message || 'Error al actualizar vehículo']
                            });
                            resultados.total_procesados++;
                            procesarVehiculo(index + 1);
                          }
                        });
                      } else {
                        resultados.errores++;
                        resultados.errores_detalle.push({
                          placa: validacion.placa,
                          errores: ['No se pudo encontrar el vehículo para actualizar']
                        });
                        resultados.total_procesados++;
                        procesarVehiculo(index + 1);
                      }
                    },
                    error: (error) => {
                      resultados.errores++;
                      resultados.errores_detalle.push({
                        placa: validacion.placa,
                        errores: ['Error al buscar vehículo existente']
                      });
                      resultados.total_procesados++;
                      procesarVehiculo(index + 1);
                    }
                  });
                }
              },
              error: (error) => {
                resultados.errores++;
                resultados.errores_detalle.push({
                  placa: validacion.placa,
                  errores: ['Error al verificar disponibilidad de placa']
                });
                resultados.total_procesados++;
                procesarVehiculo(index + 1);
              }
            });
          };

          // Iniciar procesamiento
          procesarVehiculo(0);

        } catch (error) {
          observer.error('Error procesando archivo para carga masiva');
        }
      };

      reader.onerror = () => {
        observer.error('Error leyendo archivo');
      };

      if (archivo.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(archivo, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(archivo);
      }
    });
  }

  /**
   * Encontrar fila de datos por placa
   */
  private encontrarFilaPorPlaca(jsonData: any[][], placa: string): any[] | null {
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const placaFila = (row[0] || '').toString().trim();
      if (placaFila === placa) {
        return row;
      }
    }
    return null;
  }

  /**
   * Convertir fila de Excel a objeto vehículo
   */
  private convertirFilaAVehiculo(fila: any[]): VehiculoCreate {
    return {
      placa: (fila[0] || '').toString().trim(),
      marca: (fila[1] || '').toString().trim() || undefined,
      modelo: (fila[2] || '').toString().trim() || undefined,
      anioFabricacion: fila[3] ? parseInt(fila[3].toString()) : 0,
      categoria: (fila[4] || '').toString().trim() || undefined,
      carroceria: (fila[5] || '').toString().trim() || undefined,
      color: (fila[6] || '').toString().trim() || undefined,
      numeroSerie: (fila[9] || '').toString().trim() || undefined,
      sedeRegistro: (fila[22] || '').toString().trim(),
      empresaActualId: (fila[23] || '').toString().trim() || undefined,
      datosTecnicos: {
        motor: (fila[10] || '').toString().trim() || undefined,
        chasis: (fila[11] || '').toString().trim() || undefined,
        tipoCombustible: (fila[12] || '').toString().trim() || undefined,
        cilindros: fila[13] ? parseInt(fila[13].toString()) : undefined,
        ejes: fila[14] ? parseInt(fila[14].toString()) : 2,
        ruedas: fila[15] ? parseInt(fila[15].toString()) : undefined,
        asientos: fila[7] ? parseInt(fila[7].toString()) : 1,
        pesoNeto: fila[16] ? parseFloat(fila[16].toString()) : 0,
        pesoBruto: fila[17] ? parseFloat(fila[17].toString()) : 0,
        medidas: {
          largo: fila[19] ? parseFloat(fila[19].toString()) : 0,
          ancho: fila[20] ? parseFloat(fila[20].toString()) : 0,
          alto: fila[21] ? parseFloat(fila[21].toString()) : 0
        }
      },
      resolucionId: (fila[24] || '').toString().trim() || undefined
    };
  }

  /**
   * Obtener vehículo por placa
   */
  private obtenerVehiculoPorPlaca(placa: string): Observable<Vehiculo | null> {
    return this.getVehiculos().pipe(
      map((vehiculos: Vehiculo[]) => {
        const vehiculo = vehiculos.find((v: Vehiculo) => v.placa.toUpperCase() === placa.toUpperCase());
        return vehiculo || null;
      }),
      catchError(() => of(null))
    );
  }
  private crearPlantillaCSVFallback(): Observable<Blob> {
    console.log('[VEHICULO-SERVICE] 🔄 Creando plantilla CSV como último recurso...');
    
    const headers = [
      'RUC Empresa', 'Resolución Primigenia', 'DNI', 'Resolución Hija', 'Fecha Resolución',
      'Tipo de Resolución', 'Placa de Baja', 'Placa', 'Marca', 'Modelo', 'Año Fabricación',
      'Color', 'Categoría', 'Carroceria', 'Tipo Combustible', 'Motor', 'Número Serie VIN',
      'Numero de pasajeros', 'Asientos', 'Cilindros', 'Ejes', 'Ruedas', 'Peso Bruto (t)',
      'Peso Neto (t)', 'Carga Útil (t)', 'Largo (m)', 'Ancho (m)', 'Alto (m)', 'Cilindrada',
      'Potencia (HP)', 'Estado', 'Observaciones', 'Sede de Registro', 'Expediente', 'TUC', 'Rutas Asignadas'
    ];

    const ejemplos = [
      '20123456789,R-0123-2025,1234567,R-0124-2025,15/01/2024,Autorización,,ABC-123,MERCEDES BENZ,SPRINTER,2020,BLANCO,M3,MINIBUS,DIESEL,MB123456789,VIN123456789,20,20,4,2,6,5.5,3.5,2.0,8.5,2.4,2.8,2400,150,ACTIVO,Vehículo en buen estado,LIMA,E-01234-2025,T-123456-2024,01,02,03',
      '20987654321,0125-2025,123456,0126-2025,20/01/2024,Modificación,,DEF-456,TOYOTA,HIACE,2019,AZUL,M2,MINIBUS,GASOLINA,TY987654321,VIN987654321,15,15,4,2,4,4.2,2.8,1.4,6.2,1.9,2.3,2000,120,ACTIVO,Vehículo operativo,AREQUIPA,01235-2025,123456,02,04'
    ];

    const csvContent = [
      '# PLANTILLA DE CARGA MASIVA DE VEHÍCULOS - SIRRET (36 CAMPOS)',
      '# CAMPO OBLIGATORIO: Solo Placa',
      '# FORMATO DE PLACA: ABC-123',
      '# FORMATO DE RUC: 11 dígitos',
      '# FORMATO DE DNI: 1-8 dígitos (se completa automáticamente)',
      '# FORMATO DE FECHA: DD/MM/AAAA',
      '# RESOLUCIONES: R-0123-2025 o 0123-2025 (prefijo R- opcional)',
      '# EXPEDIENTE: E-01234-2025 o 01234-2025 (prefijo E- opcional)',
      '# TUC: T-123456-2024 o 123456 o 123 (prefijo T- opcional, se completa a 6 dígitos)',
      '# RUTAS: 1 o 01 o 01,02,03',
      '',
      headers.join(','),
      ...ejemplos
    ].join('\n');
    
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    return of(blob);
  }

  validarExcel(archivo: File): Observable<any[]> {
    console.log('[CARGA-MASIVA] 🔍 Iniciando validación de archivo:', archivo.name);
    console.log('[CARGA-MASIVA] 📊 Tipo de archivo:', archivo.type);
    console.log('[CARGA-MASIVA] 📏 Tamaño:', archivo.size, 'bytes');
    
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: any;
          let worksheet: any;
          let jsonData: any[][] = [];

          // Determinar si es Excel o CSV
          if (archivo.name.toLowerCase().endsWith('.csv')) {
            console.log('[CARGA-MASIVA] 📄 Procesando como archivo CSV');
            // Procesar CSV
            const content = data as string;
            const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            
            if (lines.length < 2) {
              console.log('[CARGA-MASIVA] ⚠️ Archivo CSV vacío o sin datos');
              observer.next([]);
              observer.complete();
              return;
            }

            jsonData = lines.map(line => line.split(',').map(cell => cell.trim()));
          } else {
            console.log('[CARGA-MASIVA] 📊 Procesando como archivo Excel');
            // Procesar Excel
            try {
              console.log('[CARGA-MASIVA] 📊 Procesando archivo Excel...');
              workbook = XLSX.read(data, { type: 'array' });
              
              console.log('[CARGA-MASIVA] 📋 Hojas disponibles:', workbook.SheetNames);
              
              // Buscar la hoja "DATOS" primero, luego la primera hoja disponible
              let sheetName = 'DATOS';
              if (!workbook.Sheets[sheetName]) {
                sheetName = workbook.SheetNames[0];
                console.log('[CARGA-MASIVA] ⚠️ Hoja "DATOS" no encontrada, usando:', sheetName);
              } else {
                console.log('[CARGA-MASIVA] ✅ Usando hoja "DATOS" correctamente');
              }
              
              worksheet = workbook.Sheets[sheetName];
              
              // Verificar que la hoja existe
              if (!worksheet) {
                console.error('[CARGA-MASIVA] ❌ No se pudo acceder a la hoja:', sheetName);
                observer.error('No se pudo leer la hoja del archivo Excel.');
                return;
              }
              
              // Convertir a JSON array
              jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: '',
                raw: false 
              }) as any[][];
              
              console.log('[CARGA-MASIVA] 📊 Datos extraídos de Excel:', jsonData.length, 'filas');
              console.log('[CARGA-MASIVA] 🔍 Primeras 3 filas:', jsonData.slice(0, 3));
              
            } catch (excelError) {
              console.error('[CARGA-MASIVA] ❌ Error procesando Excel:', excelError);
              observer.error('Error al procesar archivo Excel. Verifique que el archivo no esté corrupto.');
              return;
            }
          }

          // Filtrar filas vacías
          jsonData = jsonData.filter(row => 
            row && row.length > 0 && row.some(cell => cell && cell.toString().trim())
          );

          if (jsonData.length < 2) {
            console.log('[CARGA-MASIVA] No hay datos suficientes para validar');
            observer.next([]);
            observer.complete();
            return;
          }

          const headers = jsonData[0];
          const validaciones: any[] = [];

          console.log('[CARGA-MASIVA] Headers encontrados:', headers);
          console.log('[CARGA-MASIVA] Filas de datos a procesar:', jsonData.length - 1);

          // Validar cada fila de datos (saltando el header)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Saltar filas completamente vacías
            if (!row.some(cell => cell && cell.toString().trim())) {
              console.log('[CARGA-MASIVA] 🚫 Saltando fila vacía:', i + 1);
              continue;
            }
            
            // MAPEO ACTUALIZADO PARA EL NUEVO ORDEN DE 36 COLUMNAS
            // Orden: RUC Empresa,Resolución Primigenia,DNI,Resolución Hija,Fecha Resolución,Tipo de Resolución,Placa de Baja,Placa,Marca,Modelo,Año Fabricación,Color,Categoría,Carroceria,Tipo Combustible,Motor,Número Serie VIN,Numero de pasajeros,Asientos,Cilindros,Ejes,Ruedas,Peso Bruto (t),Peso Neto (t),Carga Útil (t),Largo (m),Ancho (m),Alto (m),Cilindrada,Potencia (HP),Estado,Observaciones,Sede de Registro,Expediente,TUC,Rutas Asignadas
            
            const rucEmpresa = (row[0] || '').toString().trim();           // Posición 0
            const resolucionPrimigenia = (row[1] || '').toString().trim(); // Posición 1
            const dni = (row[2] || '').toString().trim();                 // Posición 2
            const resolucionHija = (row[3] || '').toString().trim();      // Posición 3
            const fechaResolucion = (row[4] || '').toString().trim();     // Posición 4
            const tipoResolucion = (row[5] || '').toString().trim();      // Posición 5
            const placaBaja = (row[6] || '').toString().trim();           // Posición 6
            const placa = (row[7] || '').toString().trim();               // Posición 7 - OBLIGATORIO
            const marca = (row[8] || '').toString().trim();               // Posición 8
            const modelo = (row[9] || '').toString().trim();              // Posición 9
            const anioStr = (row[10] || '').toString().trim();            // Posición 10
            const color = (row[11] || '').toString().trim();              // Posición 11
            const categoria = (row[12] || '').toString().trim();          // Posición 12
            const carroceria = (row[13] || '').toString().trim();         // Posición 13
            const tipoCombustible = (row[14] || '').toString().trim();    // Posición 14
            const motor = (row[15] || '').toString().trim();              // Posición 15
            const numeroSerieVIN = (row[16] || '').toString().trim();     // Posición 16
            const numeroPasajeros = (row[17] || '').toString().trim();    // Posición 17
            const asientosStr = (row[18] || '').toString().trim();        // Posición 18
            const cilindros = (row[19] || '').toString().trim();          // Posición 19
            const ejes = (row[20] || '').toString().trim();               // Posición 20
            const ruedas = (row[21] || '').toString().trim();             // Posición 21
            const pesoBruto = (row[22] || '').toString().trim();          // Posición 22
            const pesoNeto = (row[23] || '').toString().trim();           // Posición 23
            const cargaUtil = (row[24] || '').toString().trim();          // Posición 24
            const largo = (row[25] || '').toString().trim();              // Posición 25
            const ancho = (row[26] || '').toString().trim();              // Posición 26
            const alto = (row[27] || '').toString().trim();               // Posición 27
            const cilindrada = (row[28] || '').toString().trim();         // Posición 28
            const potencia = (row[29] || '').toString().trim();           // Posición 29
            const estado = (row[30] || '').toString().trim();             // Posición 30
            const observaciones = (row[31] || '').toString().trim();      // Posición 31
            const sedeRegistro = (row[32] || '').toString().trim();       // Posición 32 - OBLIGATORIO
            const expediente = (row[33] || '').toString().trim();         // Posición 33
            const tuc = (row[34] || '').toString().trim();                // Posición 34
            const rutasAsignadas = (row[35] || '').toString().trim();     // Posición 35
            
            // Saltar filas de separadores usando la placa (posición correcta)
            const esSeparador = placa.includes('EJEMPLOS') || 
                              placa.includes('COMPLETE') || 
                              placa.includes('---') ||
                              placa.includes('ELIMINAR') ||
                              placa.includes('AQUÍ') ||
                              placa.includes('🚫') ||
                              placa.includes('✅');
            
            if (esSeparador) {
              console.log('[CARGA-MASIVA] 🚫 Saltando fila de separador:', placa);
              continue;
            }
            
            // Saltar filas que son claramente ejemplos ESPECÍFICOS
            const esEjemploEspecifico = placa === 'ABC-123' || 
                                      placa === 'DEF-456' || 
                                      placa === 'GHI-789';
            
            if (esEjemploEspecifico) {
              console.log('[CARGA-MASIVA] 🚫 Saltando fila de ejemplo específico:', placa);
              continue;
            }
            
            // Si llegamos aquí, es una fila que debemos procesar
            console.log('[CARGA-MASIVA] ✅ Procesando fila:', i + 1, 'Placa:', placa);
            
            const validacion = {
              fila: i + 1,
              placa: placa,
              valido: true,
              errores: [] as string[],
              advertencias: [] as string[]
            };

            // Validación de placa (obligatoria)
            if (!placa) {
              validacion.valido = false;
              validacion.errores.push('Placa es obligatoria');
            } else {
              // Validar formato de placa peruana
              const placaRegex = /^[A-Z0-9]{1,3}-[0-9]{3}$/;
              if (!placaRegex.test(placa)) {
                validacion.valido = false;
                validacion.errores.push('Formato de placa inválido (use ABC-123)');
              } else {
                // Nota: En carga masiva, si la placa existe se actualizará el vehículo
                validacion.advertencias.push('Si la placa existe, se actualizarán los datos del vehículo');
              }
            }

            // Validación de sede de registro (opcional) - ya definida arriba en posición 32
            if (sedeRegistro) {
              // Si se proporciona sede, podríamos validar que existe (opcional)
              validacion.advertencias.push(`Sede de registro: ${sedeRegistro}`);
            } else {
              validacion.advertencias.push('Sede de registro no especificada');
            }

            // Validaciones opcionales con advertencias
            if (!marca) {
              validacion.advertencias.push('Marca no especificada');
            }

            if (!modelo) {
              validacion.advertencias.push('Modelo no especificado');
            }

            // Validar año si está presente
            if (anioStr) {
              const anio = parseInt(anioStr);
              if (isNaN(anio) || anio < 1990 || anio > new Date().getFullYear() + 1) {
                validacion.valido = false;
                validacion.errores.push(`Año de fabricación inválido: ${anioStr} (debe estar entre 1990-${new Date().getFullYear() + 1})`);
              }
            }

            // Validar asientos si está presente
            if (asientosStr) {
              const asientos = parseInt(asientosStr);
              if (isNaN(asientos) || asientos < 1 || asientos > 100) {
                validacion.valido = false;
                validacion.errores.push(`Número de asientos inválido: ${asientosStr} (debe estar entre 1-100)`);
              }
            }

            // Validar número de pasajeros si está presente
            if (numeroPasajeros) {
              const pasajeros = parseInt(numeroPasajeros);
              if (isNaN(pasajeros) || pasajeros < 1 || pasajeros > 200) {
                validacion.valido = false;
                validacion.errores.push(`Número de pasajeros inválido: ${numeroPasajeros} (debe estar entre 1-200)`);
              }
            }

            // Validar asientos si está presente
            if (asientosStr) {
              const asientos = parseInt(asientosStr);
              if (isNaN(asientos) || asientos < 1 || asientos > 100) {
                validacion.valido = false;
                validacion.errores.push(`Número de asientos inválido: ${asientosStr} (debe estar entre 1-100)`);
              }
            }

            // Validar coherencia entre pasajeros y asientos
            if (numeroPasajeros && asientosStr) {
              const pasajeros = parseInt(numeroPasajeros);
              const asientos = parseInt(asientosStr);
              if (!isNaN(pasajeros) && !isNaN(asientos) && pasajeros < asientos) {
                validacion.advertencias.push(`Número de pasajeros (${pasajeros}) es menor que asientos (${asientos})`);
              }
            }

            // Validar RUC si está presente
            if (rucEmpresa) {
              if (!/^\d{11}$/.test(rucEmpresa)) {
                validacion.valido = false;
                validacion.errores.push(`RUC inválido: ${rucEmpresa} (debe tener 11 dígitos)`);
              }
            }

            // Validar DNI si está presente (flexible: 1-8 dígitos, se completa a 8)
            if (dni) {
              if (!/^\d{1,8}$/.test(dni)) {
                validacion.valido = false;
                validacion.errores.push(`DNI inválido: ${dni} (debe contener solo dígitos)`);
              } else if (dni.length < 8) {
                validacion.advertencias.push(`DNI se completará a 8 dígitos: ${dni} → ${dni.padStart(8, '0')}`);
              }
            }

            // Validar TUC si está presente (posición 34, formatos flexibles)
            if (tuc) {
              // Formatos válidos: T-123456-2024, T-123456, 123456, 123
              const tucCompleto = /^T-\d{6}-\d{4}$/.test(tuc);
              const tucSinAnio = /^T-\d{6}$/.test(tuc);
              const tucSoloNumero = /^\d{1,6}$/.test(tuc);
              
              if (!tucCompleto && !tucSinAnio && !tucSoloNumero) {
                validacion.valido = false;
                validacion.errores.push(`Formato de TUC inválido: ${tuc} (use T-123456-2024 o 123456 o 123)`);
              } else if (tucSoloNumero && tuc.length < 6) {
                validacion.advertencias.push(`TUC se completará a 6 dígitos: ${tuc} → ${tuc.padStart(6, '0')}`);
              }
            }

            // Validar pesos si están presentes (posiciones 22 y 23)
            if (pesoNeto && pesoBruto) {
              const pesoNetoNum = parseFloat(pesoNeto);
              const pesoBrutoNum = parseFloat(pesoBruto);
              
              if (!isNaN(pesoNetoNum) && !isNaN(pesoBrutoNum) && pesoBrutoNum <= pesoNetoNum) {
                validacion.valido = false;
                validacion.errores.push('Peso bruto debe ser mayor que peso neto');
              }
            }

            // Mensaje de éxito si no hay errores
            if (validacion.errores.length === 0) {
              if (validacion.advertencias.length === 0) {
                validacion.advertencias.push('Registro válido para procesamiento');
              }
            }

            validaciones.push(validacion);
          }

          console.log('[CARGA-MASIVA] Validaciones completadas:', validaciones.length, 'registros procesados');
          observer.next(validaciones);
          observer.complete();
          
        } catch (error) {
          console.error('[CARGA-MASIVA] Error procesando archivo:', error);
          observer.error('Error al procesar el archivo. Verifique que el formato sea correcto.');
        }
      };

      reader.onerror = () => {
        console.error('[CARGA-MASIVA] Error leyendo archivo');
        observer.error('Error al leer el archivo');
      };

      // Leer como ArrayBuffer para Excel, como texto para CSV
      if (archivo.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(archivo, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(archivo);
      }
    });
  }

  // ========================================
  // MÉTODOS DE RUTAS ESPECÍFICAS
  // ========================================

  /**
   * Obtener rutas específicas de un vehículo
   */
  getRutasEspecificasVehiculo(vehiculoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-especificas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo rutas específicas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener rutas generales disponibles para un vehículo
   */
  getRutasGeneralesDisponibles(vehiculoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-generales-disponibles`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo rutas generales disponibles:', error);
        return of([]);
      })
    );
  }

  /**
   * Crear una ruta específica para un vehículo
   */
  crearRutaEspecifica(vehiculoId: string, rutaEspecificaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/vehiculos/${vehiculoId}/rutas-especificas`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar una ruta específica
   */
  actualizarRutaEspecifica(rutaEspecificaId: string, rutaEspecificaData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error actualizando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar una ruta específica
   */
  eliminarRutaEspecifica(rutaEspecificaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error eliminando ruta específica:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener detalle de una ruta específica
   */
  getRutaEspecifica(rutaEspecificaId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rutas-especificas/${rutaEspecificaId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo ruta específica:', error);
        return of(null);
      })
    );
  }

  /**
   * Validar datos de ruta específica antes de crear/actualizar
   */
  validarRutaEspecifica(rutaEspecificaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rutas-especificas/validar`, rutaEspecificaData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error validando ruta específica:', error);
        return of({ valida: false, errores: ['Error de validación'] });
      })
    );
  }

  /**
   * Obtener plantilla de ruta específica basada en ruta general
   */
  getPlantillaRutaEspecifica(rutaGeneralId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rutas-generales/${rutaGeneralId}/plantilla`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo plantilla de ruta específica:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener estadísticas de rutas específicas de un vehículo
   */
  getEstadisticasRutasEspecificas(vehiculoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehiculos/${vehiculoId}/estadisticas-rutas-especificas`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas de rutas específicas:', error);
        return of({
          totalRutasEspecificas: 0,
          rutasActivas: 0,
          rutasInactivas: 0,
          horariosDefinidos: 0,
          paradasAdicionales: 0
        });
      })
    );
  }

  // ========================================
  // MÉTODOS DE VALIDACIÓN
  // ========================================

  /**
   * Verificar si una placa está disponible (no duplicada)
   * @param placa - Placa a verificar
   * @param vehiculoIdActual - ID del vehículo actual (para edición)
   * @returns Observable<boolean> - true si está disponible, false si está duplicada
   */
  verificarPlacaDisponible(placa: string, vehiculoIdActual?: string): Observable<boolean> {
    // Usar API real para validar placa
    return this.validarPlacaExistente(placa, vehiculoIdActual).pipe(
      map(existe => !existe) // Invertir: si existe, no está disponible
    );
  }

  /**
   * Obtener los estados de vehículos configurados
   */
  getEstadosVehiculos() {
    return this.configuracionService.estadosVehiculosConfig();
  }

  /**
   * Obtener el color de un estado específico
   */
  getColorEstado(codigo: string): string {
    return this.configuracionService.getColorEstadoVehiculo(codigo);
  }

  /**
   * Obtener información completa de un estado
   */
  getEstadoInfo(codigo: string) {
    return this.configuracionService.getEstadoVehiculo(codigo);
  }

  /**
   * Verificar si el cambio de estado masivo está habilitado
   */
  isCambioEstadoMasivoHabilitado(): boolean {
    return this.configuracionService.permitirCambioEstadoMasivo();
  }

  /**
   * Verificar si el motivo es obligatorio para cambios de estado
   */
  isMotivoObligatorio(): boolean {
    return this.configuracionService.motivoObligatorioCambioEstado();
  }

  /**
   * Exportar vehículos filtrados a Excel
   */
  exportarVehiculos(filtros: any = {}): Observable<Blob> {
    const params = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        if (Array.isArray(filtros[key])) {
          filtros[key].forEach((value: any) => params.append(key, value));
        } else {
          params.append(key, filtros[key]);
        }
      }
    });

    return this.http.get(`${this.apiUrl}/vehiculos/exportar/excel?${params.toString()}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exportando vehículos:', error);
        return throwError(() => error);
      })
    );
  }
}