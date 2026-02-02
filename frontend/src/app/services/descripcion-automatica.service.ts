import { Injectable } from '@angular/core';
import { CategoriaConfiguracion } from '../models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class DescripcionAutomaticaService {

  /**
   * Genera una descripción automática para una configuración basándose en el contexto
   */
  generarDescripcionAutomatica(
    nombre: string, 
    categoria: CategoriaConfiguracion, 
    contexto?: any
  ): string {
    switch (categoria) {
      case CategoriaConfiguracion.RESOLUCIONES:
        return this.generarDescripcionResoluciones(nombre, contexto);
      case CategoriaConfiguracion.EXPEDIENTES:
        return this.generarDescripcionExpedientes(nombre, contexto);
      case CategoriaConfiguracion.EMPRESAS:
        return this.generarDescripcionEmpresas(nombre, contexto);
      case CategoriaConfiguracion.SISTEMA:
        return this.generarDescripcionSistema(nombre, contexto);
      case CategoriaConfiguracion.NOTIFICACIONES:
        return this.generarDescripcionNotificaciones(nombre, contexto);
      default:
        return this.generarDescripcionGenerica(nombre, contexto);
    }
  }

  /**
   * Genera descripciones para configuraciones de resoluciones
   */
  private generarDescripcionResoluciones(nombre: string, contexto?: any): string {
    const tipoTramite = contexto?.tipoTramite || 'general';
    const empresa = contexto?.empresa || 'la empresa';
    
    switch (nombre) {
      case 'ANIOS_VIGENCIA_DEFAULT':
        if (tipoTramite === 'PRIMIGENIA') {
          return `Valor por defecto para años de vigencia en resoluciones PRIMIGENIA. Se aplica automáticamente al crear nuevas resoluciones para ${empresa}. Este valor determina la fecha de vencimiento calculada desde la fecha de inicio.`;
        } else if (tipoTramite === 'RENOVACION') {
          return `Valor por defecto para años de vigencia en resoluciones de RENOVACIÓN. Se aplica automáticamente al renovar resoluciones existentes para ${empresa}.`;
        } else {
          return `Valor por defecto para años de vigencia en resoluciones. Se aplica automáticamente al crear nuevas resoluciones para ${empresa}. Este valor determina la fecha de vencimiento calculada desde la fecha de inicio.`;
        }
      
      case 'MAX_ANIOS_VIGENCIA':
        return `Límite máximo de años permitidos para la vigencia de resoluciones. Los usuarios no podrán ingresar un valor mayor a este en el formulario de creación. Se aplica a todos los tipos de trámite.`;
      
      case 'MIN_ANIOS_VIGENCIA':
        return `Límite mínimo de años requeridos para la vigencia de resoluciones. Los usuarios no podrán ingresar un valor menor a este en el formulario de creación. Se aplica a todos los tipos de trámite.`;
      
      case 'NUMERO_RESOLUCION_PREFIX':
        return `Prefijo utilizado para generar automáticamente el número de resolución. Ejemplo: R-0001-2025, R-0002-2025, etc. Se aplica al crear cualquier nueva resolución.`;
      
      case 'RESOLUCIONES_POR_EMPRESA_LIMITE':
        return `Número máximo de resoluciones activas que puede tener ${empresa} simultáneamente. Se valida al crear nuevas resoluciones y previene la sobrecarga del sistema.`;
      
      case 'DIAS_ANTES_VENCIMIENTO_ALERTA':
        return `Días antes del vencimiento de una resolución para mostrar alertas automáticas. Se notifica a los usuarios sobre la necesidad de renovación o acción. Se aplica a todas las resoluciones activas.`;
      
      default:
        return `Configuración relacionada con la gestión de resoluciones para ${empresa}.`;
    }
  }

  /**
   * Genera descripciones para configuraciones de expedientes
   */
  private generarDescripcionExpedientes(nombre: string, contexto?: any): string {
    const tipoTramite = contexto?.tipoTramite || 'general';
    const oficina = contexto?.oficina || 'la oficina';
    
    switch (nombre) {
      case 'TIEMPO_PROCESAMIENTO_DEFAULT':
        if (tipoTramite === 'PRIMIGENIA') {
          return `Tiempo estimado en días para procesar expedientes PRIMIGENIA. Se asigna por defecto al crear nuevos expedientes en ${oficina}. Este valor se muestra en el formulario de creación.`;
        } else {
          return `Tiempo estimado en días para procesar expedientes. Se asigna por defecto al crear nuevos expedientes en ${oficina}. Este valor se muestra en el formulario de creación.`;
        }
      
      case 'MAX_TIEMPO_PROCESAMIENTO':
        return `Límite máximo de días permitidos para el procesamiento de expedientes. Los usuarios no podrán ingresar un valor mayor a este en el formulario. Se aplica a todos los tipos de expediente.`;
      
      case 'EXPEDIENTES_POR_OFICINA_LIMITE':
        return `Número máximo de expedientes que puede procesar ${oficina} simultáneamente. Se valida al asignar expedientes y previene la sobrecarga de trabajo.`;
      
      case 'DIAS_ANTES_VENCIMIENTO_EXPEDIENTE':
        return `Días antes del vencimiento de un expediente para mostrar alertas automáticas. Se notifica sobre la necesidad de atención o resolución en ${oficina}.`;
      
      default:
        return `Configuración relacionada con la gestión de expedientes en ${oficina}.`;
    }
  }

  /**
   * Genera descripciones para configuraciones de empresas
   */
  private generarDescripcionEmpresas(nombre: string, contexto?: any): string {
    const empresa = contexto?.empresa || 'la empresa';
    const tipoEmpresa = contexto?.tipoEmpresa || 'transporte';
    
    switch (nombre) {
      case 'CAPACIDAD_MAXIMA_DEFAULT':
        return `Número máximo de expedientes que puede manejar una oficina simultáneamente. Este valor se asigna por defecto al crear nuevas oficinas para empresas de ${tipoEmpresa} y se puede modificar individualmente.`;
      
      case 'EMPRESAS_ACTIVAS_LIMITE':
        return `Número máximo de empresas que pueden estar activas en el sistema simultáneamente. Se valida al registrar nuevas empresas de ${tipoEmpresa}.`;
      
      case 'DIAS_VALIDEZ_DOCUMENTOS':
        return `Días de validez por defecto para documentos empresariales como licencias, certificados y permisos de ${tipoEmpresa}. Se usa para calcular fechas de vencimiento automáticamente.`;
      
      default:
        return `Configuración relacionada con la gestión de empresas de ${tipoEmpresa}.`;
    }
  }

  /**
   * Genera descripciones para configuraciones del sistema
   */
  private generarDescripcionSistema(nombre: string, contexto?: any): string {
    switch (nombre) {
      case 'PAGINACION_DEFAULT':
        return `Número de elementos que se muestran por página en todas las listas del sistema (resoluciones, expedientes, empresas, etc.). Afecta la navegación y rendimiento de las consultas. Se aplica globalmente.`;
      
      case 'SESSION_TIMEOUT':
        return `Tiempo en horas que permanece activa la sesión del usuario sin actividad. Después de 1 hora, el usuario deberá volver a iniciar sesión. Se aplica a todos los usuarios del sistema.`;
      
      default:
        return `Configuración general del sistema que afecta el comportamiento global de la aplicación.`;
    }
  }

  /**
   * Genera descripciones para configuraciones de notificaciones
   */
  private generarDescripcionNotificaciones(nombre: string, contexto?: any): string {
    const usuario = contexto?.usuario || 'los usuarios';
    
    switch (nombre) {
      case 'NOTIFICACIONES_EMAIL':
        return `Habilita el envío automático de notificaciones por correo electrónico para ${usuario}. Incluye: creación de resoluciones, cambios de estado en expedientes, recordatorios de vencimiento, y alertas importantes del sistema.`;
      
      case 'NOTIFICACIONES_PUSH':
        return `Habilita las notificaciones push en tiempo real dentro de la aplicación para ${usuario}. Alerta sobre cambios importantes, tareas pendientes, o actualizaciones de estado sin necesidad de recargar la página.`;
      
      default:
        return `Configuración relacionada con el sistema de notificaciones para ${usuario}.`;
    }
  }

  /**
   * Genera descripciones genéricas
   */
  private generarDescripcionGenerica(nombre: string, contexto?: any): string {
    return `Configuración del sistema relacionada con ${nombre.toLowerCase().replace(/_/g, ' ')}. Se aplica según el contexto de uso.`;
  }

  /**
   * Actualiza la descripción de una configuración basándose en el contexto actual
   */
  actualizarDescripcionAutomatica(
    nombre: string, 
    categoria: CategoriaConfiguracion, 
    contexto?: any
  ): string {
    const descripcionGenerada = this.generarDescripcionAutomatica(nombre, categoria, contexto);
    // console.log removed for production
    return descripcionGenerada;
  }

  /**
   * Genera descripciones automáticas para el contexto de creación de resoluciones
   */
  generarDescripcionResolucionContexto(
    expediente: any, 
    empresa: any, 
    tipoResolucion: string
  ): any {
    const contexto = {
      tipoTramite: expediente?.tipoTramite || 'general',
      empresa: empresa?.razonSocial?.principal || 'la empresa',
      tipoEmpresa: 'transporte',
      oficina: 'la oficina asignada',
      usuario: 'los usuarios del sistema'
    };

    return {
      ANIOS_VIGENCIA_DEFAULT: this.generarDescripcionAutomatica('ANIOS_VIGENCIA_DEFAULT', CategoriaConfiguracion.RESOLUCIONES, contexto),
      MAX_ANIOS_VIGENCIA: this.generarDescripcionAutomatica('MAX_ANIOS_VIGENCIA', CategoriaConfiguracion.RESOLUCIONES, contexto),
      MIN_ANIOS_VIGENCIA: this.generarDescripcionAutomatica('MIN_ANIOS_VIGENCIA', CategoriaConfiguracion.RESOLUCIONES, contexto),
      NUMERO_RESOLUCION_PREFIX: this.generarDescripcionAutomatica('NUMERO_RESOLUCION_PREFIX', CategoriaConfiguracion.RESOLUCIONES, contexto),
      RESOLUCIONES_POR_EMPRESA_LIMITE: this.generarDescripcionAutomatica('RESOLUCIONES_POR_EMPRESA_LIMITE', CategoriaConfiguracion.RESOLUCIONES, contexto),
      DIAS_ANTES_VENCIMIENTO_ALERTA: this.generarDescripcionAutomatica('DIAS_ANTES_VENCIMIENTO_ALERTA', CategoriaConfiguracion.RESOLUCIONES, contexto)
    };
  }
} 