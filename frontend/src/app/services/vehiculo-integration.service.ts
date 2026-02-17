import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { VehiculoService } from './vehiculo.service';
import { VehiculoSoloService } from './vehiculo-solo.service';
import { Vehiculo, VehiculoCreate } from '../models/vehiculo.model';
import { VehiculoSolo, VehiculoSoloCreate, VehiculoSoloDetallado } from '../models/vehiculo-solo.model';

/**
 * Servicio de Integración entre Vehiculo (administrativo) y VehiculoSolo (técnico)
 * 
 * Este servicio maneja la relación entre:
 * - Vehiculo: Datos administrativos (empresa, resolución, rutas, TUC)
 * - VehiculoSolo: Datos técnicos puros (marca, modelo, motor, SUNARP, etc.)
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoIntegrationService {
  private vehiculoService = inject(VehiculoService);
  private vehiculoSoloService = inject(VehiculoSoloService);

  // ========================================
  // CONSULTAS INTEGRADAS
  // ========================================

  /**
   * Obtener vehículo completo (administrativo + técnico)
   * TODO: Implementar cuando VehiculoService tenga el método obtenerVehiculo
   */
  obtenerVehiculoCompleto(vehiculoId: string): Observable<VehiculoCompleto> {
    // Temporalmente retornar observable vacío
    return of({} as VehiculoCompleto);
    
    /* TODO: Descomentar cuando VehiculoService esté listo
    return this.vehiculoService.obtenerVehiculo(vehiculoId).pipe(
      switchMap((vehiculoAdmin: Vehiculo) => {
        if (!vehiculoAdmin.vehiculoSoloId) {
          return of({
            ...vehiculoAdmin,
            datosTecnicos: null,
            historialPlacas: [],
            propietarioRegistral: null,
            inspeccionVigente: null,
            soatVigente: null
          } as VehiculoCompleto);
        }

        return this.vehiculoSoloService.obtenerVehiculoPorId(vehiculoAdmin.vehiculoSoloId).pipe(
          map(vehiculoSolo => this.combinarDatos(vehiculoAdmin, vehiculoSolo)),
          catchError(error => {
            console.error('Error obteniendo datos técnicos:', error);
            return of({
              ...vehiculoAdmin,
              datosTecnicos: null,
              historialPlacas: [],
              propietarioRegistral: null,
              inspeccionVigente: null,
              soatVigente: null
            } as VehiculoCompleto);
          })
        );
      })
    );
    */
  }

  /**
   * Obtener múltiples vehículos completos
   */
  obtenerVehiculosCompletos(vehiculoIds: string[]): Observable<VehiculoCompleto[]> {
    const observables = vehiculoIds.map(id => this.obtenerVehiculoCompleto(id));
    return forkJoin(observables);
  }

  /**
   * Buscar vehículo por placa (busca en ambos módulos)
   * TODO: Implementar cuando VehiculoService tenga el método buscarPorPlaca
   */
  buscarPorPlaca(placa: string): Observable<VehiculoCompleto | null> {
    return of(null);
    /* TODO: Descomentar cuando VehiculoService esté listo
    return this.vehiculoService.buscarPorPlaca(placa).pipe(
      switchMap((vehiculoAdmin: Vehiculo | null) => {
        if (!vehiculoAdmin) {
          return of(null);
        }

        if (!vehiculoAdmin.vehiculoSoloId) {
          return of({
            ...vehiculoAdmin,
            datosTecnicos: null,
            historialPlacas: [],
            propietarioRegistral: null,
            inspeccionVigente: null,
            soatVigente: null
          } as VehiculoCompleto);
        }

        return this.vehiculoSoloService.obtenerVehiculoPorId(vehiculoAdmin.vehiculoSoloId).pipe(
          map(vehiculoSolo => this.combinarDatos(vehiculoAdmin, vehiculoSolo))
        );
      })
    );
    */
  }

  // ========================================
  // CREACIÓN INTEGRADA
  // ========================================

  /**
   * Crear vehículo completo (técnico + administrativo)
   * TODO: Implementar cuando VehiculoService tenga el método crearVehiculo
   */
  crearVehiculoCompleto(
    datosAdmin: VehiculoCreate,
    datosTecnicos: VehiculoSoloCreate
  ): Observable<VehiculoCompletoCreado> {
    // Temporalmente retornar observable vacío
    return of({} as VehiculoCompletoCreado);
    
    /* TODO: Descomentar cuando VehiculoService esté listo
    return this.vehiculoSoloService.crearVehiculo(datosTecnicos).pipe(
      switchMap(vehiculoSolo => {
        const vehiculoConReferencia: VehiculoCreate = {
          ...datosAdmin,
          vehiculoSoloId: vehiculoSolo.id,
          placa: vehiculoSolo.placaActual,
          marca: vehiculoSolo.marca,
          modelo: vehiculoSolo.modelo,
          anioFabricacion: vehiculoSolo.anioFabricacion,
          numeroMotor: vehiculoSolo.numeroMotor,
          numeroSerie: vehiculoSolo.numeroSerie
        };

        return this.vehiculoService.createVehiculo(vehiculoConReferencia).pipe(
          map((vehiculoAdmin: Vehiculo) => ({
            vehiculoAdmin,
            vehiculoSolo,
            vehiculoCompleto: this.combinarDatos(vehiculoAdmin, {
              ...vehiculoSolo,
              historialPlacas: [],
              propietarios: [],
              inspecciones: [],
              seguros: [],
              documentos: []
            })
          }))
        );
      })
    );
    */
  }

  /**
   * Crear solo vehículo técnico y vincularlo a uno administrativo existente
   * TODO: Implementar cuando VehiculoService tenga el método actualizarVehiculo
   */
  vincularVehiculoSolo(
    vehiculoAdminId: string,
    datosTecnicos: VehiculoSoloCreate
  ): Observable<VehiculoCompleto> {
    return of({} as VehiculoCompleto);
    
    /* TODO: Descomentar cuando VehiculoService esté listo
    return this.vehiculoSoloService.crearVehiculo(datosTecnicos).pipe(
      switchMap(vehiculoSolo => {
        return this.vehiculoService.actualizarVehiculo(vehiculoAdminId, {
          vehiculoSoloId: vehiculoSolo.id
        }).pipe(
          map((vehiculoAdmin: Vehiculo) => this.combinarDatos(vehiculoAdmin, {
            ...vehiculoSolo,
            historialPlacas: [],
            propietarios: [],
            inspecciones: [],
            seguros: [],
            documentos: []
          }))
        );
      })
    );
    */
  }

  // ========================================
  // ACTUALIZACIÓN INTEGRADA
  // ========================================

  /**
   * Actualizar datos técnicos desde SUNARP y sincronizar con datos administrativos
   * TODO: Implementar cuando VehiculoService tenga los métodos necesarios
   */
  actualizarDesdeSUNARP(vehiculoAdminId: string): Observable<VehiculoCompleto> {
    return of({} as VehiculoCompleto);
    
    /* TODO: Descomentar cuando VehiculoService esté listo
    return this.vehiculoService.obtenerVehiculo(vehiculoAdminId).pipe(
      switchMap((vehiculoAdmin: Vehiculo) => {
        if (!vehiculoAdmin.vehiculoSoloId) {
          throw new Error('El vehículo no tiene datos técnicos vinculados');
        }

        return this.vehiculoSoloService.actualizarDesdeSUNARP(
          vehiculoAdmin.vehiculoSoloId,
          vehiculoAdmin.placa
        ).pipe(
          switchMap(vehiculoSoloActualizado => {
            return this.vehiculoService.actualizarVehiculo(vehiculoAdminId, {
              placa: vehiculoSoloActualizado.placaActual,
              marca: vehiculoSoloActualizado.marca,
              modelo: vehiculoSoloActualizado.modelo,
              anio: vehiculoSoloActualizado.anioFabricacion
            }).pipe(
              switchMap((vehiculoAdminActualizado: Vehiculo) => 
                this.obtenerVehiculoCompleto(vehiculoAdminActualizado.id)
              )
            );
          })
        );
      })
    );
    */
  }

  // ========================================
  // VALIDACIONES
  // ========================================

  /**
   * Verificar si un vehículo tiene todos los requisitos técnicos vigentes
   */
  verificarRequisitosVigentes(vehiculoId: string): Observable<RequisitosVigentes> {
    return this.obtenerVehiculoCompleto(vehiculoId).pipe(
      map(vehiculo => {
        const hoy = new Date();
        
        return {
          tieneInspeccionVigente: vehiculo.inspeccionVigente !== null &&
            new Date(vehiculo.inspeccionVigente.fechaVencimiento) > hoy,
          tieneSOATVigente: vehiculo.soatVigente !== null &&
            new Date(vehiculo.soatVigente.fechaVencimiento) > hoy,
          tienePropietarioRegistrado: vehiculo.propietarioRegistral !== null,
          tieneDatosTecnicosCompletos: vehiculo.datosTecnicos !== null,
          cumpleTodosRequisitos: false
        };
      }),
      map(requisitos => ({
        ...requisitos,
        cumpleTodosRequisitos: requisitos.tieneInspeccionVigente &&
          requisitos.tieneSOATVigente &&
          requisitos.tienePropietarioRegistrado &&
          requisitos.tieneDatosTecnicosCompletos
      }))
    );
  }

  // ========================================
  // UTILIDADES PRIVADAS
  // ========================================

  private combinarDatos(
    vehiculoAdmin: Vehiculo,
    vehiculoSolo: VehiculoSoloDetallado
  ): VehiculoCompleto {
    const hoy = new Date();

    return {
      ...vehiculoAdmin,
      datosTecnicos: vehiculoSolo,
      historialPlacas: vehiculoSolo.historialPlacas || [],
      propietarioRegistral: vehiculoSolo.propietarios?.find(p => p.esPropietarioActual) || null,
      inspeccionVigente: vehiculoSolo.inspecciones?.find(i =>
        new Date(i.fechaVencimiento) > hoy && i.resultado === 'APROBADO'
      ) || null,
      soatVigente: vehiculoSolo.seguros?.find(s =>
        s.tipoSeguro === 'SOAT' &&
        new Date(s.fechaVencimiento) > hoy &&
        s.estado === 'VIGENTE'
      ) || null
    };
  }
}

// ========================================
// INTERFACES
// ========================================

export interface VehiculoCompleto {
  // Datos administrativos
  id: string;
  placa: string;
  empresaActualId: string;
  resolucionId?: string; // Opcional
  estado: string;
  // ... otros campos de Vehiculo
  
  // Datos técnicos adicionales
  datosTecnicos: VehiculoSoloDetallado | null;
  historialPlacas: any[];
  propietarioRegistral: any | null;
  inspeccionVigente: any | null;
  soatVigente: any | null;
}

export interface VehiculoCompletoCreado {
  vehiculoAdmin: Vehiculo;
  vehiculoSolo: VehiculoSolo;
  vehiculoCompleto: VehiculoCompleto;
}

export interface RequisitosVigentes {
  tieneInspeccionVigente: boolean;
  tieneSOATVigente: boolean;
  tienePropietarioRegistrado: boolean;
  tieneDatosTecnicosCompletos: boolean;
  cumpleTodosRequisitos: boolean;
}
