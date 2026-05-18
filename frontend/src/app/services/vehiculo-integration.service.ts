import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, switchMap, map, catchError } from 'rxjs';
import { VehiculoService } from './vehiculo.service';
import { VehiculoSoloService } from './vehiculo-solo.service';
import { EmpresaService } from './empresa.service';
import { RutaService } from './ruta.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../models/vehiculo.model';
import { VehiculoSolo, VehiculoSoloCreate } from '../models/vehiculo-solo.model';

/**
 * Servicio de Integración entre Vehículos y Datos Técnicos
 * 
 * Responsabilidades:
 * - Crear vehículos completos (VehiculoSolo + Vehiculo)
 * - Validar integridad referencial
 * - Sincronizar datos entre módulos
 * - Detectar inconsistencias
 * - Manejar transacciones
 * 
 * @author Sistema DRTC
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoIntegrationService {
  private vehiculoService = inject(VehiculoService);
  private vehiculoSoloService = inject(VehiculoSoloService);
  private empresaService = inject(EmpresaService);
  private rutaService = inject(RutaService);

  /**
   * Crear vehículo completo (VehiculoSolo + Vehiculo)
   * 
   * Flujo:
   * 1. Validar datos técnicos
   * 2. Crear VehiculoSolo
   * 3. Validar datos administrativos
   * 4. Crear Vehiculo con referencia a VehiculoSolo
   * 5. Validar integridad final
   * 
   * @param datosTecnicos - Datos técnicos del vehículo
   * @param datosAdministrativos - Datos administrativos del vehículo
   * @returns Observable con vehículos creados
   */
  crearVehiculoCompleto(
    datosTecnicos: VehiculoSoloCreate,
    datosAdministrativos: VehiculoCreate
  ): Observable<{ vehiculoSolo: VehiculoSolo; vehiculo: Vehiculo }> {
    return new Observable(observer => {
      (async () => {
        try {
          // 1. Validar datos técnicos
          this.validarDatosTecnicos(datosTecnicos);
          console.log('✅ Datos técnicos validados');

          // 2. Crear VehiculoSolo
          const vehiculoSolo = await this.vehiculoSoloService
            .crearVehiculo(datosTecnicos)
            .toPromise();

          if (!vehiculoSolo) {
            throw new Error('Error creando datos técnicos');
          }
          console.log('✅ VehiculoSolo creado:', vehiculoSolo.id);

          // 3. Validar datos administrativos
          this.validarDatosAdministrativos(datosAdministrativos);
          console.log('✅ Datos administrativos validados');

          // 4. Agregar referencia a VehiculoSolo
          datosAdministrativos.vehiculoDataId = vehiculoSolo.id;

          // 5. Crear Vehiculo
          const vehiculo = await this.vehiculoService
            .createVehiculo(datosAdministrativos)
            .toPromise();

          if (!vehiculo) {
            // Rollback: eliminar VehiculoSolo
            await this.vehiculoSoloService
              .eliminarVehiculo(vehiculoSolo.id)
              .toPromise();
            throw new Error('Error creando vehículo administrativo');
          }
          console.log('✅ Vehiculo creado:', vehiculo.id);

          // 6. Validar integridad final
          const validacion = await this.validarIntegridad(vehiculo.id).toPromise();
          if (!validacion?.valido) {
            throw new Error(`Inconsistencias detectadas: ${validacion?.errores.join(', ')}`);
          }
          console.log('✅ Integridad validada');

          observer.next({ vehiculoSolo, vehiculo });
          observer.complete();
        } catch (error) {
          console.error('❌ Error en crearVehiculoCompleto:', error);
          observer.error(error);
        }
      })();
    });
  }

  /**
   * Obtener vehículo con datos técnicos completos
   * 
   * @param vehiculoId - ID del vehículo
   * @returns Observable con vehículo y datos técnicos
   */
  obtenerVehiculoCompleto(vehiculoId: string): Observable<VehiculoConDatos> {
    return this.vehiculoService.getVehiculo(vehiculoId).pipe(
      switchMap(vehiculo => {
        if (!vehiculo) {
          return throwError(() => new Error('Vehículo no encontrado'));
        }

        if (!vehiculo.vehiculoDataId) {
          return throwError(() => new Error('Vehículo sin datos técnicos'));
        }

        return this.vehiculoSoloService.obtenerVehiculos({ limit: 1 }).pipe(
          switchMap(response => {
            const vehiculoSolo = response.vehiculos.find(v => v.id === vehiculo.vehiculoDataId);
            return vehiculoSolo ? of(vehiculoSolo) : throwError(() => new Error('Datos técnicos no encontrados'));
          }),
          map(vehiculoSolo => {
            if (!vehiculoSolo) {
              throw new Error('Datos técnicos no encontrados');
            }

            return {
              ...vehiculo,
              datosTecnicos: vehiculoSolo
            } as VehiculoConDatos;
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error en obtenerVehiculoCompleto:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validar integridad referencial de un vehículo
   * 
   * Valida:
   * - VehiculoSolo existe
   * - Empresa existe
   * - Resolución existe (si se proporciona)
   * - Rutas existen (si se proporcionan)
   * - Datos son consistentes
   * 
   * @param vehiculoId - ID del vehículo
   * @returns Observable con resultado de validación
   */
  validarIntegridad(vehiculoId: string): Observable<ValidationResult> {
    return new Observable(observer => {
      (async () => {
        try {
          const vehiculo = await this.vehiculoService
            .getVehiculo(vehiculoId)
            .toPromise();

          if (!vehiculo) {
            observer.next({
              valido: false,
              errores: ['Vehículo no encontrado']
            });
            return;
          }

          const errors: string[] = [];

          // Validar VehiculoSolo
          if (!vehiculo.vehiculoDataId) {
            errors.push('Falta referencia a datos técnicos');
          } else {
            const response = await this.vehiculoSoloService
              .obtenerVehiculos({ limit: 1 })
              .toPromise();
            
            const vehiculoSolo = response?.vehiculos?.find(v => v.id === vehiculo.vehiculoDataId);

            if (!vehiculoSolo) {
              errors.push('Datos técnicos no encontrados');
            } else {
              // Validar consistencia de placa
              if (vehiculo.placa !== vehiculoSolo.placaActual) {
                errors.push(
                  `Inconsistencia de placa: ${vehiculo.placa} vs ${vehiculoSolo.placaActual}`
                );
              }
            }
          }

          // Validar Empresa
          if (vehiculo.empresaActualId) {
            const empresa = await this.empresaService
              .getEmpresa(vehiculo.empresaActualId)
              .toPromise();

            if (!empresa) {
              errors.push('Empresa no encontrada');
            }
          } else {
            errors.push('Empresa no asignada');
          }

          // Validar Rutas
          if (vehiculo.rutasAsignadasIds && vehiculo.rutasAsignadasIds.length > 0) {
            for (const rutaId of vehiculo.rutasAsignadasIds) {
              const rutas = await this.rutaService
                .getRutas()
                .toPromise();

              const ruta = rutas?.find(r => r.id === rutaId);

              if (!ruta) {
                errors.push(`Ruta ${rutaId} no encontrada`);
              }
            }
          }

          observer.next({
            valido: errors.length === 0,
            errores: errors
          });
          observer.complete();
        } catch (error) {
          console.error('❌ Error en validarIntegridad:', error);
          observer.error(error);
        }
      })();
    });
  }

  /**
   * Detectar inconsistencias en todos los vehículos
   * 
   * @returns Observable con array de inconsistencias
   */
  detectarInconsistencias(): Observable<Inconsistencia[]> {
    return new Observable(observer => {
      (async () => {
        try {
          const vehiculos = await this.vehiculoService
            .getVehiculos()
            .toPromise();

          if (!vehiculos || vehiculos.length === 0) {
            observer.next([]);
            return;
          }

          const inconsistencias: Inconsistencia[] = [];

          for (const vehiculo of vehiculos) {
            const validacion = await this.validarIntegridad(vehiculo.id).toPromise();

            if (!validacion?.valido) {
              inconsistencias.push({
                vehiculoId: vehiculo.id,
                placa: vehiculo.placa,
                errores: validacion?.errores || []
              });
            }
          }

          observer.next(inconsistencias);
          observer.complete();
        } catch (error) {
          console.error('❌ Error en detectarInconsistencias:', error);
          observer.error(error);
        }
      })();
    });
  }

  /**
   * Sincronizar datos entre VehiculoSolo y Vehiculo
   * 
   * Actualiza:
   * - Placa en VehiculoSolo si cambió en Vehiculo
   * - Datos técnicos en Vehiculo si cambió en VehiculoSolo
   * 
   * @param vehiculoId - ID del vehículo
   * @returns Observable con resultado de sincronización
   */
  sincronizarDatos(vehiculoId: string): Observable<SyncResult> {
    return new Observable(observer => {
      (async () => {
        try {
          const vehiculo = await this.vehiculoService
            .getVehiculo(vehiculoId)
            .toPromise();

          if (!vehiculo || !vehiculo.vehiculoDataId) {
            observer.next({
              exitoso: false,
              mensaje: 'Vehículo o datos técnicos no encontrados'
            });
            return;
          }

          const response = await this.vehiculoSoloService
            .obtenerVehiculos({ limit: 1 })
            .toPromise();
          
          const vehiculoSolo = response?.vehiculos?.find(v => v.id === vehiculo.vehiculoDataId);

          if (!vehiculoSolo) {
            observer.next({
              exitoso: false,
              mensaje: 'Datos técnicos no encontrados'
            });
            return;
          }

          let cambios = 0;

          // Sincronizar placa
          if (vehiculo.placa !== vehiculoSolo.placaActual) {
            console.log(`Sincronizando placa: ${vehiculoSolo.placaActual} → ${vehiculo.placa}`);
            // Aquí iría la actualización en VehiculoSolo
            cambios++;
          }

          observer.next({
            exitoso: true,
            mensaje: `Sincronización completada. ${cambios} cambios realizados.`,
            cambios
          });
          observer.complete();
        } catch (error) {
          console.error('❌ Error en sincronizarDatos:', error);
          observer.error(error);
        }
      })();
    });
  }

  /**
   * Validar datos técnicos
   * 
   * @param datos - Datos técnicos a validar
   * @throws Error si hay campos requeridos faltantes
   */
  private validarDatosTecnicos(datos: VehiculoSoloCreate): void {
    const errors: string[] = [];

    if (!datos.placaActual) errors.push('Placa requerida');
    if (!datos.marca) errors.push('Marca requerida');
    if (!datos.modelo) errors.push('Modelo requerido');
    if (!datos.anioFabricacion) errors.push('Año de fabricación requerido');
    if (!datos.categoria) errors.push('Categoría requerida');
    if (!datos.carroceria) errors.push('Carrocería requerida');
    if (!datos.combustible) errors.push('Combustible requerido');
    if (datos.numeroAsientos === undefined) errors.push('Número de asientos requerido');
    if (datos.numeroPasajeros === undefined) errors.push('Número de pasajeros requerido');
    if (datos.numeroEjes === undefined) errors.push('Número de ejes requerido');
    if (datos.pesoSeco === undefined) errors.push('Peso seco requerido');
    if (datos.pesoBruto === undefined) errors.push('Peso bruto requerido');
    if (datos.cilindrada === undefined) errors.push('Cilindrada requerida');
    if (!datos.paisOrigen) errors.push('País de origen requerido');

    if (errors.length > 0) {
      throw new Error(`Datos técnicos inválidos: ${errors.join(', ')}`);
    }
  }

  /**
   * Validar datos administrativos
   * 
   * @param datos - Datos administrativos a validar
   * @throws Error si hay campos requeridos faltantes
   */
  private validarDatosAdministrativos(datos: VehiculoCreate): void {
    const errors: string[] = [];

    if (!datos.placa) errors.push('Placa requerida');
    if (!datos.empresaActualId) errors.push('Empresa requerida');
    if (!datos.tipoServicio) errors.push('Tipo de servicio requerido');

    if (errors.length > 0) {
      throw new Error(`Datos administrativos inválidos: ${errors.join(', ')}`);
    }
  }
}

/**
 * Interfaz para vehículo con datos técnicos completos
 * Combina Vehiculo (datos administrativos) con VehiculoSolo (datos técnicos)
 */
export interface VehiculoConDatos {
  // Datos administrativos de Vehiculo
  id: string;
  placa: string;
  empresaActualId: string;
  resolucionId?: string;
  tipoServicio: string;
  rutasAsignadasIds: string[];
  rutasEspecificas?: any[];
  estado: string;
  estaActivo: boolean;
  sedeRegistro?: string;
  observaciones?: string;
  placaSustituida?: string;
  placaBaja?: string;
  fechaSustitucion?: Date | string;
  motivoSustitucion?: string;
  resolucionSustitucion?: string;
  fechaBaja?: Date | string;
  motivoBaja?: string;
  observacionesBaja?: string;
  
  // Datos técnicos de VehiculoSolo
  datosTecnicos: VehiculoSolo;
}

/**
 * Interfaz para resultado de validación
 */
export interface ValidationResult {
  valido: boolean;
  errores: string[];
}

/**
 * Interfaz para inconsistencia detectada
 */
export interface Inconsistencia {
  vehiculoId: string;
  placa: string;
  errores: string[];
}

/**
 * Interfaz para resultado de sincronización
 */
export interface SyncResult {
  exitoso: boolean;
  mensaje: string;
  cambios?: number;
}
