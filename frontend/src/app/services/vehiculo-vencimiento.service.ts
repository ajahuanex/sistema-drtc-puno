import { Injectable, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { VehiculoService } from './vehiculo.service';
import { VehiculoNotificationService } from './vehiculo-notification.service';
import { EmpresaService } from './empresa.service';
import { Vehiculo } from '../models/vehiculo.model';
import { Empresa } from '../models/empresa.model';

/**
 * Configuración de anticipación para notificaciones de vencimiento
 */
export interface ConfiguracionVencimiento {
  diasAnticipacion: number[];  // Días de anticipación para notificar (ej: [30, 15, 7, 1])
  horaVerificacion: string;     // Hora del día para verificar (formato HH:mm)
  habilitado: boolean;          // Si el servicio está habilitado
}

/**
 * Información de documento próximo a vencer
 */
export interface DocumentoVencimiento {
  tipo: string;
  fechaVencimiento: Date;
  diasRestantes: number;
}

/**
 * Servicio para gestionar notificaciones de vencimiento de documentos de vehículos
 * Requirements: 9.3
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoVencimientoService {
  private vehiculoService = inject(VehiculoService);
  private vehiculoNotificationService = inject(VehiculoNotificationService);
  private empresaService = inject(EmpresaService);

  // Configuración por defecto
  private configuracion: ConfiguracionVencimiento = {
    diasAnticipacion: [30, 15, 7, 3, 1],
    horaVerificacion: '09:00',
    habilitado: true
  };

  // Subscription para el job periódico
  private jobSubscription: Subscription | null = null;

  // Intervalo de verificación (cada 24 horas por defecto)
  private intervaloVerificacion = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

  /**
   * Iniciar el job de verificación de vencimientos
   * Requirements: 9.3
   */
  iniciarJobVencimientos(): void {
    if (!this.configuracion.habilitado) {
      console.log('⏸️ Job de vencimientos deshabilitado');
      return;
    }

    if (this.jobSubscription) {
      console.log('⚠️ Job de vencimientos ya está en ejecución');
      return;
    }

    console.log('🚀 Iniciando job de verificación de vencimientos');
    
    // Ejecutar inmediatamente al iniciar
    this.verificarVencimientos();

    // Configurar ejecución periódica
    this.jobSubscription = interval(this.intervaloVerificacion).subscribe(() => {
      this.verificarVencimientos();
    });
  }

  /**
   * Detener el job de verificación de vencimientos
   * Requirements: 9.3
   */
  detenerJobVencimientos(): void {
    if (this.jobSubscription) {
      this.jobSubscription.unsubscribe();
      this.jobSubscription = null;
      console.log('⏹️ Job de vencimientos detenido');
    }
  }

  /**
   * Verificar vencimientos de documentos de todos los vehículos
   * Requirements: 9.3
   */
  verificarVencimientos(): void {
    console.log('🔍 Verificando vencimientos de documentos...');

    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        const vehiculosConVencimientos: Array<{
          vehiculo: Vehiculo;
          empresa: Empresa;
          documentosVencimiento: DocumentoVencimiento[];
        }> = [];

        let procesados = 0;

        vehiculos.forEach(vehiculo => {
          // Obtener documentos próximos a vencer
          const documentosVencimiento = this.obtenerDocumentosProximosVencer(vehiculo);

          if (documentosVencimiento.length > 0) {
            // Obtener empresa del vehículo
            this.empresaService.getEmpresa(vehiculo.empresaActualId).subscribe({
              next: (empresa) => {
                vehiculosConVencimientos.push({
                  vehiculo,
                  empresa,
                  documentosVencimiento
                });

                procesados++;

                // Cuando se hayan procesado todos, enviar notificaciones
                if (procesados === vehiculos.filter(v => 
                  this.obtenerDocumentosProximosVencer(v).length > 0
                ).length) {
                  this.enviarNotificacionesVencimiento(vehiculosConVencimientos);
                }
              },
              error: (error) => {
                console.error(`Error obteniendo empresa para vehículo ${vehiculo.placa}:`, error);
                procesados++;
              }
            });
          }
        });

        if (vehiculosConVencimientos.length === 0) {
          console.log('✅ No hay documentos próximos a vencer');
        }
      },
      error: (error) => {
        console.error('Error verificando vencimientos:', error);
      }
    });
  }

  /**
   * Obtener documentos próximos a vencer de un vehículo
   * Requirements: 9.3
   */
  private obtenerDocumentosProximosVencer(vehiculo: Vehiculo): DocumentoVencimiento[] {
    const documentos: DocumentoVencimiento[] = [];
    const hoy = new Date();

    // Verificar TUC (Tarjeta Única de Circulación)
    if (vehiculo.tuc?.fechaEmision) {
      const fechaEmisionTuc = new Date(vehiculo.tuc.fechaEmision);
      // TUC vence 1 año después de la emisión
      const fechaVencimientoTuc = new Date(fechaEmisionTuc);
      fechaVencimientoTuc.setFullYear(fechaVencimientoTuc.getFullYear() + 1);

      const diasRestantes = this.calcularDiasRestantes(hoy, fechaVencimientoTuc);

      if (this.debeNotificar(diasRestantes)) {
        documentos.push({
          tipo: 'TUC (Tarjeta Única de Circulación)',
          fechaVencimiento: fechaVencimientoTuc,
          diasRestantes
        });
      }
    }

    // Verificar Revisión Técnica (cada 6 meses para vehículos de transporte público)
    // Asumimos que la última revisión fue hace 6 meses desde hoy
    const fechaUltimaRevision = new Date();
    fechaUltimaRevision.setMonth(fechaUltimaRevision.getMonth() - 5); // Simulación
    const fechaVencimientoRevision = new Date(fechaUltimaRevision);
    fechaVencimientoRevision.setMonth(fechaVencimientoRevision.getMonth() + 6);

    const diasRestantesRevision = this.calcularDiasRestantes(hoy, fechaVencimientoRevision);

    if (this.debeNotificar(diasRestantesRevision)) {
      documentos.push({
        tipo: 'Revisión Técnica',
        fechaVencimiento: fechaVencimientoRevision,
        diasRestantes: diasRestantesRevision
      });
    }

    // Verificar SOAT (Seguro Obligatorio de Accidentes de Tránsito)
    // Asumimos vencimiento anual
    const fechaVencimientoSoat = new Date();
    fechaVencimientoSoat.setMonth(fechaVencimientoSoat.getMonth() + 2); // Simulación: vence en 2 meses

    const diasRestantesSoat = this.calcularDiasRestantes(hoy, fechaVencimientoSoat);

    if (this.debeNotificar(diasRestantesSoat)) {
      documentos.push({
        tipo: 'SOAT (Seguro Obligatorio)',
        fechaVencimiento: fechaVencimientoSoat,
        diasRestantes: diasRestantesSoat
      });
    }

    return documentos;
  }

  /**
   * Calcular días restantes entre dos fechas
   */
  private calcularDiasRestantes(fechaInicio: Date, fechaFin: Date): number {
    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Determinar si se debe notificar según los días restantes
   */
  private debeNotificar(diasRestantes: number): boolean {
    // Notificar si está dentro de los días de anticipación configurados
    return this.configuracion.diasAnticipacion.some(dias => diasRestantes === dias) ||
           diasRestantes <= 0; // Siempre notificar si ya venció
  }

  /**
   * Enviar notificaciones de vencimiento
   * Requirements: 9.3
   */
  private enviarNotificacionesVencimiento(
    vehiculosConVencimientos: Array<{
      vehiculo: Vehiculo;
      empresa: Empresa;
      documentosVencimiento: DocumentoVencimiento[];
    }>
  ): void {
    if (vehiculosConVencimientos.length === 0) {
      return;
    }

    console.log(`📧 Enviando notificaciones de vencimiento para ${vehiculosConVencimientos.length} vehículo(s)`);

    this.vehiculoNotificationService.notificarVencimientoDocumentos(
      vehiculosConVencimientos,
      Math.max(...this.configuracion.diasAnticipacion)
    );

    console.log('✅ Notificaciones de vencimiento enviadas');
  }

  /**
   * Obtener configuración actual
   * Requirements: 9.3
   */
  obtenerConfiguracion(): ConfiguracionVencimiento {
    return { ...this.configuracion };
  }

  /**
   * Actualizar configuración
   * Requirements: 9.3
   */
  actualizarConfiguracion(nuevaConfiguracion: Partial<ConfiguracionVencimiento>): void {
    this.configuracion = {
      ...this.configuracion,
      ...nuevaConfiguracion
    };

    console.log('⚙️ Configuración de vencimientos actualizada:', this.configuracion);

    // Reiniciar job si está habilitado
    if (this.configuracion.habilitado && this.jobSubscription) {
      this.detenerJobVencimientos();
      this.iniciarJobVencimientos();
    } else if (!this.configuracion.habilitado) {
      this.detenerJobVencimientos();
    }
  }

  /**
   * Verificar vencimientos de un vehículo específico
   * Requirements: 9.3
   */
  verificarVencimientosVehiculo(vehiculoId: string): void {
    this.vehiculoService.getVehiculo(vehiculoId).subscribe({
      next: (vehiculo) => {
        if (!vehiculo) {
          console.error('Vehículo no encontrado');
          return;
        }

        const documentosVencimiento = this.obtenerDocumentosProximosVencer(vehiculo);

        if (documentosVencimiento.length > 0) {
          this.empresaService.getEmpresa(vehiculo.empresaActualId).subscribe({
            next: (empresa) => {
              this.enviarNotificacionesVencimiento([{
                vehiculo,
                empresa,
                documentosVencimiento
              }]);
            },
            error: (error) => {
              console.error('Error obteniendo empresa:', error);
            }
          });
        } else {
          console.log(`✅ No hay documentos próximos a vencer para el vehículo ${vehiculo.placa}`);
        }
      },
      error: (error) => {
        console.error('Error verificando vencimientos del vehículo:', error);
      }
    });
  }

  /**
   * Obtener estadísticas de vencimientos
   * Requirements: 9.3
   */
  obtenerEstadisticasVencimientos(): void {
    this.vehiculoService.getVehiculos().subscribe({
      next: (vehiculos) => {
        const estadisticas = {
          totalVehiculos: vehiculos.length,
          vehiculosConVencimientos: 0,
          documentosPorVencer: 0,
          documentosVencidos: 0,
          porTipoDocumento: {} as Record<string, number>
        };

        vehiculos.forEach(vehiculo => {
          const documentos = this.obtenerDocumentosProximosVencer(vehiculo);
          
          if (documentos.length > 0) {
            estadisticas.vehiculosConVencimientos++;
            estadisticas.documentosPorVencer += documentos.length;

            documentos.forEach(doc => {
              if (doc.diasRestantes <= 0) {
                estadisticas.documentosVencidos++;
              }

              if (!estadisticas.porTipoDocumento[doc.tipo]) {
                estadisticas.porTipoDocumento[doc.tipo] = 0;
              }
              estadisticas.porTipoDocumento[doc.tipo]++;
            });
          }
        });

        console.log('📊 Estadísticas de vencimientos:', estadisticas);
      },
      error: (error) => {
        console.error('Error obteniendo estadísticas de vencimientos:', error);
      }
    });
  }
}
