import { Injectable, inject } from '@angular/core';
import { NotificationService, TipoNotificacion, PrioridadNotificacion, CategoriaNotificacion } from './notification.service';
import { Vehiculo } from '../models/vehiculo.model';
import { Empresa } from '../models/empresa.model';

/**
 * Servicio especializado para notificaciones del módulo de vehículos
 * Requirements: 9.1, 9.2, 9.3
 */
@Injectable({
  providedIn: 'root'
})
export class VehiculoNotificationService {
  private notificationService = inject(NotificationService);

  /**
   * Notificar transferencia de vehículo
   * Requirements: 9.1, 9.2
   * 
   * @param vehiculo Vehículo transferido
   * @param empresaOrigen Empresa de origen
   * @param empresaDestino Empresa de destino
   * @param usuarioId ID del usuario que realizó la transferencia
   * @param destinatariosIds IDs de usuarios a notificar (supervisores, administradores)
   */
  notificarTransferencia(
    vehiculo: Vehiculo,
    empresaOrigen: Empresa,
    empresaDestino: Empresa,
    usuarioId: string,
    destinatariosIds: string[]
  ): void {
    const titulo = `Transferencia de Vehículo ${vehiculo.placa}`;
    const mensaje = `El vehículo ${vehiculo.placa} (${vehiculo.marca} ${vehiculo.modelo}) ha sido transferido de ${empresaOrigen.razonSocial.principal} a ${empresaDestino.razonSocial.principal}`;

    destinatariosIds.forEach(destinatarioId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.SISTEMA,
        titulo,
        mensaje,
        destinatarioId,
        prioridad: PrioridadNotificacion.MEDIA,
        categoria: CategoriaNotificacion.OPERATIVA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          empresaOrigenId: empresaOrigen.id,
          empresaOrigenNombre: empresaOrigen.razonSocial.principal,
          empresaDestinoId: empresaDestino.id,
          empresaDestinoNombre: empresaDestino.razonSocial.principal,
          usuarioId,
          tipoEvento: 'TRANSFERENCIA_VEHICULO'
        },
        accionUrl: `/vehiculos/${vehiculo.id}`,
        accionTexto: 'Ver Vehículo'
      }).subscribe({
        next: () => {
          console.log(`Notificación de transferencia enviada a usuario ${destinatarioId}`);
        },
        error: (error) => {
          console.error('Error enviando notificación de transferencia:', error);
        }
      });
    });

    // Notificar también a las empresas involucradas
    this.notificarEmpresaTransferencia(vehiculo, empresaOrigen, empresaDestino, 'ORIGEN');
    this.notificarEmpresaTransferencia(vehiculo, empresaOrigen, empresaDestino, 'DESTINO');
  }

  /**
   * Notificar a empresa sobre transferencia
   * Requirements: 9.1, 9.2
   */
  private notificarEmpresaTransferencia(
    vehiculo: Vehiculo,
    empresaOrigen: Empresa,
    empresaDestino: Empresa,
    tipo: 'ORIGEN' | 'DESTINO'
  ): void {
    const esOrigen = tipo === 'ORIGEN';
    const empresa = esOrigen ? empresaOrigen : empresaDestino;
    const otraEmpresa = esOrigen ? empresaDestino : empresaOrigen;
    
    const titulo = esOrigen 
      ? `Vehículo Transferido - ${vehiculo.placa}`
      : `Nuevo Vehículo Recibido - ${vehiculo.placa}`;
    
    const mensaje = esOrigen
      ? `El vehículo ${vehiculo.placa} ha sido transferido a ${otraEmpresa.razonSocial.principal}`
      : `Se ha recibido el vehículo ${vehiculo.placa} desde ${otraEmpresa.razonSocial.principal}`;

    // Notificar al representante legal de la empresa
    const destinatarioId = `empresa_${empresa.id}_representante`;

    this.notificationService.createNotificacion({
      tipo: TipoNotificacion.SISTEMA,
      titulo,
      mensaje,
      destinatarioId,
      prioridad: PrioridadNotificacion.ALTA,
      categoria: CategoriaNotificacion.OPERATIVA,
      datosAdicionales: {
        vehiculoId: vehiculo.id,
        placa: vehiculo.placa,
        empresaId: empresa.id,
        tipoEvento: esOrigen ? 'TRANSFERENCIA_SALIDA' : 'TRANSFERENCIA_ENTRADA'
      },
      accionUrl: `/vehiculos/${vehiculo.id}`,
      accionTexto: 'Ver Vehículo'
    }).subscribe({
      next: () => {
        console.log(`Notificación de transferencia enviada a empresa ${empresa.razonSocial.principal}`);
      },
      error: (error) => {
        console.error('Error enviando notificación a empresa:', error);
      }
    });
  }

  /**
   * Notificar solicitud de baja de vehículo
   * Requirements: 9.1, 9.2
   * 
   * @param vehiculo Vehículo para el cual se solicita baja
   * @param motivo Motivo de la solicitud de baja
   * @param empresa Empresa propietaria del vehículo
   * @param usuarioSolicitanteId ID del usuario que solicita la baja
   * @param supervisoresIds IDs de supervisores a notificar
   */
  notificarSolicitudBaja(
    vehiculo: Vehiculo,
    motivo: string,
    empresa: Empresa,
    usuarioSolicitanteId: string,
    supervisoresIds: string[]
  ): void {
    const titulo = `Solicitud de Baja - Vehículo ${vehiculo.placa}`;
    const mensaje = `Se ha solicitado la baja del vehículo ${vehiculo.placa} (${vehiculo.marca} ${vehiculo.modelo}) de la empresa ${empresa.razonSocial.principal}. Motivo: ${motivo}`;

    supervisoresIds.forEach(supervisorId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.APROBACION,
        titulo,
        mensaje,
        destinatarioId: supervisorId,
        prioridad: PrioridadNotificacion.ALTA,
        categoria: CategoriaNotificacion.ADMINISTRATIVA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          empresaId: empresa.id,
          empresaNombre: empresa.razonSocial.principal,
          motivo,
          usuarioSolicitanteId,
          tipoEvento: 'SOLICITUD_BAJA_VEHICULO',
          requiereAprobacion: true
        },
        accionUrl: `/vehiculos/${vehiculo.id}/baja`,
        accionTexto: 'Revisar Solicitud'
      }).subscribe({
        next: () => {
          console.log(`Notificación de solicitud de baja enviada a supervisor ${supervisorId}`);
        },
        error: (error) => {
          console.error('Error enviando notificación de solicitud de baja:', error);
        }
      });
    });
  }

  /**
   * Notificar cambio de estado de vehículo
   * Requirements: 9.2, 9.4
   * 
   * @param vehiculo Vehículo con cambio de estado
   * @param estadoAnterior Estado anterior del vehículo
   * @param estadoNuevo Estado nuevo del vehículo
   * @param empresa Empresa propietaria
   * @param destinatariosIds IDs de usuarios a notificar
   */
  notificarCambioEstado(
    vehiculo: Vehiculo,
    estadoAnterior: string,
    estadoNuevo: string,
    empresa: Empresa,
    destinatariosIds: string[]
  ): void {
    const titulo = `Cambio de Estado - Vehículo ${vehiculo.placa}`;
    const mensaje = `El vehículo ${vehiculo.placa} de ${empresa.razonSocial.principal} ha cambiado de estado de ${estadoAnterior} a ${estadoNuevo}`;

    // Determinar prioridad según el nuevo estado
    let prioridad = PrioridadNotificacion.MEDIA;
    if (estadoNuevo === 'SUSPENDIDO' || estadoNuevo === 'INACTIVO') {
      prioridad = PrioridadNotificacion.ALTA;
    } else if (estadoNuevo === 'ACTIVO') {
      prioridad = PrioridadNotificacion.BAJA;
    }

    destinatariosIds.forEach(destinatarioId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.SISTEMA,
        titulo,
        mensaje,
        destinatarioId,
        prioridad,
        categoria: CategoriaNotificacion.OPERATIVA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          empresaId: empresa.id,
          empresaNombre: empresa.razonSocial.principal,
          estadoAnterior,
          estadoNuevo,
          tipoEvento: 'CAMBIO_ESTADO_VEHICULO'
        },
        accionUrl: `/vehiculos/${vehiculo.id}`,
        accionTexto: 'Ver Vehículo'
      }).subscribe({
        next: () => {
          console.log(`Notificación de cambio de estado enviada a usuario ${destinatarioId}`);
        },
        error: (error) => {
          console.error('Error enviando notificación de cambio de estado:', error);
        }
      });
    });
  }

  /**
   * Notificar vencimiento próximo de documentos
   * Requirements: 9.3
   * 
   * @param vehiculos Lista de vehículos con documentos próximos a vencer
   * @param diasAnticipacion Días de anticipación para la notificación
   */
  notificarVencimientoDocumentos(
    vehiculos: Array<{
      vehiculo: Vehiculo;
      empresa: Empresa;
      documentosVencimiento: Array<{
        tipo: string;
        fechaVencimiento: Date;
        diasRestantes: number;
      }>;
    }>,
    diasAnticipacion: number = 30
  ): void {
    vehiculos.forEach(({ vehiculo, empresa, documentosVencimiento }) => {
      documentosVencimiento.forEach(doc => {
        const titulo = `Documento Próximo a Vencer - ${vehiculo.placa}`;
        const mensaje = `El documento ${doc.tipo} del vehículo ${vehiculo.placa} (${empresa.razonSocial.principal}) vence en ${doc.diasRestantes} días (${this.formatearFecha(doc.fechaVencimiento)})`;

        // Determinar prioridad según días restantes
        let prioridad = PrioridadNotificacion.BAJA;
        if (doc.diasRestantes <= 7) {
          prioridad = PrioridadNotificacion.CRITICA;
        } else if (doc.diasRestantes <= 15) {
          prioridad = PrioridadNotificacion.ALTA;
        } else if (doc.diasRestantes <= 30) {
          prioridad = PrioridadNotificacion.MEDIA;
        }

        // Notificar a la empresa
        const destinatarioId = `empresa_${empresa.id}_representante`;

        this.notificationService.createNotificacion({
          tipo: TipoNotificacion.ALERTA,
          titulo,
          mensaje,
          destinatarioId,
          prioridad,
          categoria: CategoriaNotificacion.ADMINISTRATIVA,
          datosAdicionales: {
            vehiculoId: vehiculo.id,
            placa: vehiculo.placa,
            empresaId: empresa.id,
            empresaNombre: empresa.razonSocial.principal,
            tipoDocumento: doc.tipo,
            fechaVencimiento: doc.fechaVencimiento,
            diasRestantes: doc.diasRestantes,
            tipoEvento: 'VENCIMIENTO_DOCUMENTO_VEHICULO'
          },
          accionUrl: `/vehiculos/${vehiculo.id}`,
          accionTexto: 'Ver Vehículo',
          expiraEn: doc.fechaVencimiento
        }).subscribe({
          next: () => {
            console.log(`Notificación de vencimiento enviada para vehículo ${vehiculo.placa}`);
          },
          error: (error) => {
            console.error('Error enviando notificación de vencimiento:', error);
          }
        });
      });
    });
  }

  /**
   * Notificar aprobación de baja de vehículo
   * Requirements: 9.2
   * 
   * @param vehiculo Vehículo cuya baja fue aprobada
   * @param empresa Empresa propietaria
   * @param usuarioAprobadorId ID del usuario que aprobó
   * @param destinatariosIds IDs de usuarios a notificar
   */
  notificarAprobacionBaja(
    vehiculo: Vehiculo,
    empresa: Empresa,
    usuarioAprobadorId: string,
    destinatariosIds: string[]
  ): void {
    const titulo = `Baja Aprobada - Vehículo ${vehiculo.placa}`;
    const mensaje = `La solicitud de baja del vehículo ${vehiculo.placa} de ${empresa.razonSocial.principal} ha sido aprobada`;

    destinatariosIds.forEach(destinatarioId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.APROBACION,
        titulo,
        mensaje,
        destinatarioId,
        prioridad: PrioridadNotificacion.MEDIA,
        categoria: CategoriaNotificacion.ADMINISTRATIVA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          empresaId: empresa.id,
          empresaNombre: empresa.razonSocial.principal,
          usuarioAprobadorId,
          tipoEvento: 'BAJA_APROBADA'
        },
        accionUrl: `/vehiculos/${vehiculo.id}`,
        accionTexto: 'Ver Vehículo'
      }).subscribe({
        next: () => {
          console.log(`Notificación de aprobación de baja enviada a usuario ${destinatarioId}`);
        },
        error: (error) => {
          console.error('Error enviando notificación de aprobación:', error);
        }
      });
    });
  }

  /**
   * Notificar rechazo de baja de vehículo
   * Requirements: 9.2
   * 
   * @param vehiculo Vehículo cuya baja fue rechazada
   * @param empresa Empresa propietaria
   * @param motivo Motivo del rechazo
   * @param usuarioRechazadorId ID del usuario que rechazó
   * @param destinatariosIds IDs de usuarios a notificar
   */
  notificarRechazoBaja(
    vehiculo: Vehiculo,
    empresa: Empresa,
    motivo: string,
    usuarioRechazadorId: string,
    destinatariosIds: string[]
  ): void {
    const titulo = `Baja Rechazada - Vehículo ${vehiculo.placa}`;
    const mensaje = `La solicitud de baja del vehículo ${vehiculo.placa} de ${empresa.razonSocial.principal} ha sido rechazada. Motivo: ${motivo}`;

    destinatariosIds.forEach(destinatarioId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.RECHAZO,
        titulo,
        mensaje,
        destinatarioId,
        prioridad: PrioridadNotificacion.MEDIA,
        categoria: CategoriaNotificacion.ADMINISTRATIVA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          empresaId: empresa.id,
          empresaNombre: empresa.razonSocial.principal,
          motivo,
          usuarioRechazadorId,
          tipoEvento: 'BAJA_RECHAZADA'
        },
        accionUrl: `/vehiculos/${vehiculo.id}`,
        accionTexto: 'Ver Vehículo'
      }).subscribe({
        next: () => {
          console.log(`Notificación de rechazo de baja enviada a usuario ${destinatarioId}`);
        },
        error: (error) => {
          console.error('Error enviando notificación de rechazo:', error);
        }
      });
    });
  }

  /**
   * Notificar error crítico en operación de vehículo
   * Requirements: 9.4
   * 
   * @param vehiculo Vehículo relacionado con el error
   * @param operacion Operación que falló
   * @param error Descripción del error
   * @param administradoresIds IDs de administradores a notificar
   */
  notificarErrorCritico(
    vehiculo: Vehiculo,
    operacion: string,
    error: string,
    administradoresIds: string[]
  ): void {
    const titulo = `Error Crítico - Vehículo ${vehiculo.placa}`;
    const mensaje = `Error crítico en operación "${operacion}" para el vehículo ${vehiculo.placa}: ${error}`;

    administradoresIds.forEach(adminId => {
      this.notificationService.createNotificacion({
        tipo: TipoNotificacion.ALERTA,
        titulo,
        mensaje,
        destinatarioId: adminId,
        prioridad: PrioridadNotificacion.CRITICA,
        categoria: CategoriaNotificacion.TECNICA,
        datosAdicionales: {
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          operacion,
          error,
          tipoEvento: 'ERROR_CRITICO_VEHICULO'
        },
        accionUrl: `/vehiculos/${vehiculo.id}`,
        accionTexto: 'Ver Vehículo'
      }).subscribe({
        next: () => {
          console.log(`Notificación de error crítico enviada a administrador ${adminId}`);
        },
        error: (err) => {
          console.error('Error enviando notificación de error crítico:', err);
        }
      });
    });
  }

  /**
   * Formatear fecha para mostrar en notificaciones
   */
  private formatearFecha(fecha: Date): string {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
}
