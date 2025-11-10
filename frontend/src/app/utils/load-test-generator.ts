/**
 * Load Test Generator
 * 
 * Genera datos de prueba para testing de carga
 * Permite crear datasets grandes para probar el rendimiento
 */

import { ResolucionConEmpresa } from '../models/resolucion-table.model';

export class LoadTestGenerator {
  private static readonly EMPRESAS_MOCK = [
    { id: '1', razonSocial: { principal: 'Transportes Unidos SAC' }, ruc: '20123456789' },
    { id: '2', razonSocial: { principal: 'Expreso del Sur EIRL' }, ruc: '20234567890' },
    { id: '3', razonSocial: { principal: 'Turismo Nacional SA' }, ruc: '20345678901' },
    { id: '4', razonSocial: { principal: 'Carga Pesada del Norte SRL' }, ruc: '20456789012' },
    { id: '5', razonSocial: { principal: 'Transporte Rápido SAC' }, ruc: '20567890123' },
    { id: '6', razonSocial: { principal: 'Servicios Logísticos SA' }, ruc: '20678901234' }
  ];

  private static readonly TIPOS_TRAMITE = ['PRIMIGENIA', 'RENOVACION', 'INCREMENTO', 'SUSTITUCION', 'OTROS'];
  private static readonly ESTADOS = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'VIGENTE', 'VENCIDO', 'ANULADO'];
  private static readonly TIPOS_RESOLUCION = ['PADRE', 'HIJO'];

  /**
   * Genera un dataset de resoluciones para pruebas de carga
   */
  static generateResoluciones(count: number): ResolucionConEmpresa[] {
    console.log(`🔧 Generando ${count} resoluciones para pruebas de carga...`);
    
    const resoluciones: ResolucionConEmpresa[] = [];
    const startYear = 2020;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      const year = startYear + Math.floor(Math.random() * (currentYear - startYear + 1));
      const empresa = this.EMPRESAS_MOCK[Math.floor(Math.random() * this.EMPRESAS_MOCK.length)];
      const tipoTramite = this.TIPOS_TRAMITE[Math.floor(Math.random() * this.TIPOS_TRAMITE.length)];
      const estado = this.ESTADOS[Math.floor(Math.random() * this.ESTADOS.length)];
      const tipoResolucion = this.TIPOS_RESOLUCION[Math.floor(Math.random() * this.TIPOS_RESOLUCION.length)];
      
      const fechaEmision = this.randomDate(new Date(year, 0, 1), new Date(year, 11, 31));
      const fechaVigenciaInicio = new Date(fechaEmision);
      const fechaVigenciaFin = new Date(fechaVigenciaInicio);
      fechaVigenciaFin.setFullYear(fechaVigenciaFin.getFullYear() + 5);

      const resolucion: ResolucionConEmpresa = {
        id: `load-test-${i + 1}`,
        nroResolucion: `R-${String(i + 1).padStart(4, '0')}-${year}`,
        empresaId: empresa.id,
        empresa: empresa,
        expedienteId: `exp-${i + 1}`,
        fechaEmision: fechaEmision,
        fechaVigenciaInicio: fechaVigenciaInicio,
        fechaVigenciaFin: fechaVigenciaFin,
        tipoResolucion: tipoResolucion as any,
        resolucionPadreId: tipoResolucion === 'HIJO' && i > 0 ? `load-test-${Math.floor(Math.random() * i) + 1}` : undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: this.generateIds('veh', Math.floor(Math.random() * 5) + 1),
        rutasAutorizadasIds: this.generateIds('ruta', Math.floor(Math.random() * 3) + 1),
        tipoTramite: tipoTramite as any,
        descripcion: `Resolución de ${tipoTramite} para ${empresa.razonSocial.principal}`,
        documentoId: `doc-${i + 1}`,
        estaActivo: Math.random() > 0.1, // 90% activas
        estado: estado as any,
        fechaRegistro: fechaEmision,
        fechaActualizacion: fechaEmision,
        usuarioEmisionId: `user-${Math.floor(Math.random() * 5) + 1}`,
        usuarioAprobacionId: estado !== 'BORRADOR' ? `user-${Math.floor(Math.random() * 5) + 1}` : undefined,
        fechaAprobacion: estado !== 'BORRADOR' ? fechaEmision : undefined,
        documentos: [],
        auditoria: []
      };

      resoluciones.push(resolucion);
    }

    console.log(`✅ ${count} resoluciones generadas exitosamente`);
    return resoluciones;
  }

  /**
   * Genera IDs aleatorios
   */
  private static generateIds(prefix: string, count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(`${prefix}-${Math.floor(Math.random() * 1000) + 1}`);
    }
    return ids;
  }

  /**
   * Genera una fecha aleatoria entre dos fechas
   */
  private static randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  /**
   * Genera un dataset con distribución específica
   */
  static generateWithDistribution(config: {
    total: number;
    empresaDistribution?: { [empresaId: string]: number };
    estadoDistribution?: { [estado: string]: number };
    yearRange?: { start: number; end: number };
  }): ResolucionConEmpresa[] {
    console.log('🔧 Generando dataset con distribución personalizada...');
    
    const resoluciones: ResolucionConEmpresa[] = [];
    const { total, empresaDistribution, estadoDistribution, yearRange } = config;

    // Si no hay distribución, generar aleatoriamente
    if (!empresaDistribution && !estadoDistribution) {
      return this.generateResoluciones(total);
    }

    // Generar según distribución de empresas
    if (empresaDistribution) {
      Object.entries(empresaDistribution).forEach(([empresaId, percentage]) => {
        const count = Math.floor(total * percentage);
        const empresaResoluciones = this.generateResolucionesForEmpresa(empresaId, count, yearRange);
        resoluciones.push(...empresaResoluciones);
      });
    }

    console.log(`✅ ${resoluciones.length} resoluciones generadas con distribución`);
    return resoluciones;
  }

  /**
   * Genera resoluciones para una empresa específica
   */
  private static generateResolucionesForEmpresa(
    empresaId: string,
    count: number,
    yearRange?: { start: number; end: number }
  ): ResolucionConEmpresa[] {
    const empresa = this.EMPRESAS_MOCK.find(e => e.id === empresaId) || this.EMPRESAS_MOCK[0];
    const resoluciones: ResolucionConEmpresa[] = [];
    
    const startYear = yearRange?.start || 2020;
    const endYear = yearRange?.end || new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
      const tipoTramite = this.TIPOS_TRAMITE[Math.floor(Math.random() * this.TIPOS_TRAMITE.length)];
      const estado = this.ESTADOS[Math.floor(Math.random() * this.ESTADOS.length)];
      
      const fechaEmision = this.randomDate(new Date(year, 0, 1), new Date(year, 11, 31));
      const fechaVigenciaInicio = new Date(fechaEmision);
      const fechaVigenciaFin = new Date(fechaVigenciaInicio);
      fechaVigenciaFin.setFullYear(fechaVigenciaFin.getFullYear() + 5);

      const resolucion: ResolucionConEmpresa = {
        id: `${empresaId}-${i + 1}`,
        nroResolucion: `R-${String(i + 1).padStart(4, '0')}-${year}`,
        empresaId: empresaId,
        empresa: empresa,
        expedienteId: `exp-${empresaId}-${i + 1}`,
        fechaEmision: fechaEmision,
        fechaVigenciaInicio: fechaVigenciaInicio,
        fechaVigenciaFin: fechaVigenciaFin,
        tipoResolucion: Math.random() > 0.3 ? 'PADRE' : 'HIJO',
        resolucionPadreId: undefined,
        resolucionesHijasIds: [],
        vehiculosHabilitadosIds: this.generateIds('veh', Math.floor(Math.random() * 5) + 1),
        rutasAutorizadasIds: this.generateIds('ruta', Math.floor(Math.random() * 3) + 1),
        tipoTramite: tipoTramite as any,
        descripcion: `Resolución de ${tipoTramite} para ${empresa.razonSocial.principal}`,
        documentoId: `doc-${empresaId}-${i + 1}`,
        estaActivo: Math.random() > 0.1,
        estado: estado as any,
        fechaRegistro: fechaEmision,
        fechaActualizacion: fechaEmision,
        usuarioEmisionId: `user-${Math.floor(Math.random() * 5) + 1}`,
        usuarioAprobacionId: estado !== 'BORRADOR' ? `user-${Math.floor(Math.random() * 5) + 1}` : undefined,
        fechaAprobacion: estado !== 'BORRADOR' ? fechaEmision : undefined,
        documentos: [],
        auditoria: []
      };

      resoluciones.push(resolucion);
    }

    return resoluciones;
  }

  /**
   * Genera escenarios de prueba predefinidos
   */
  static generateTestScenarios(): {
    small: ResolucionConEmpresa[];
    medium: ResolucionConEmpresa[];
    large: ResolucionConEmpresa[];
    xlarge: ResolucionConEmpresa[];
  } {
    console.log('🔧 Generando escenarios de prueba...');
    
    return {
      small: this.generateResoluciones(50),
      medium: this.generateResoluciones(250),
      large: this.generateResoluciones(1000),
      xlarge: this.generateResoluciones(5000)
    };
  }
}
