export interface ConfiguracionSistema {
  id: string;
  nombre: string;
  valor: string;
  descripcion: string;
  categoria: CategoriaConfiguracion;
  activo: boolean;
  esEditable?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  // Nuevo campo para manejar valores por defecto
  tieneValorDefault?: boolean;
  valorDefault?: string;
  configuracionDefaultAsociada?: string;
}

export interface ConfiguracionCreate {
  nombre: string;
  valor: string;
  descripcion: string;
  categoria: CategoriaConfiguracion;
  esEditable: boolean;
}

export interface ConfiguracionUpdate {
  valor?: string;
  descripcion?: string;
  esEditable?: boolean;
}

// Categorías de configuración
export enum CategoriaConfiguracion {
  RESOLUCIONES = 'RESOLUCIONES',
  EXPEDIENTES = 'EXPEDIENTES',
  EMPRESAS = 'EMPRESAS',
  USUARIOS = 'USUARIOS',
  SISTEMA = 'SISTEMA',
  NOTIFICACIONES = 'NOTIFICACIONES',
  REPORTES = 'REPORTES',
  GENERAL = 'GENERAL',
  VEHICULOS = 'VEHICULOS'
}

// Configuraciones por defecto del sistema
export const CONFIGURACIONES_DEFAULT = {
  // Resoluciones
  ANIOS_VIGENCIA_DEFAULT: {
    nombre: 'ANIOS_VIGENCIA_DEFAULT',
    valor: '5',
    descripcion: 'Valor por defecto que aparecerá en el campo "Años de Vigencia" al crear una nueva resolución. Este valor se calcula automáticamente desde la fecha de inicio hasta la fecha de fin.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  MAX_ANIOS_VIGENCIA: {
    nombre: 'MAX_ANIOS_VIGENCIA',
    valor: '10',
    descripcion: 'Límite máximo de años que puede tener una resolución. Los usuarios no podrán ingresar un valor mayor a este en el formulario de creación.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  MIN_ANIOS_VIGENCIA: {
    nombre: 'MIN_ANIOS_VIGENCIA',
    valor: '1',
    descripcion: 'Límite mínimo de años que debe tener una resolución. Los usuarios no podrán ingresar un valor menor a este en el formulario de creación.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  NUMERO_RESOLUCION_PREFIX: {
    nombre: 'NUMERO_RESOLUCION_PREFIX',
    valor: 'R',
    descripcion: 'Prefijo que se usa para generar automáticamente el número de resolución. Ejemplo: R-0001-2025, R-0002-2025, etc.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  RESOLUCIONES_POR_EMPRESA_LIMITE: {
    nombre: 'RESOLUCIONES_POR_EMPRESA_LIMITE',
    valor: '50',
    descripcion: 'Número máximo de resoluciones activas que puede tener una empresa simultáneamente. Se aplica al crear nuevas resoluciones.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  DIAS_ANTES_VENCIMIENTO_ALERTA: {
    nombre: 'DIAS_ANTES_VENCIMIENTO_ALERTA',
    valor: '30',
    descripcion: 'Días antes del vencimiento de una resolución para mostrar alertas y notificaciones a los usuarios sobre la necesidad de renovación.',
    categoria: CategoriaConfiguracion.RESOLUCIONES,
    esEditable: true
  },
  
  // Expedientes
  TIEMPO_PROCESAMIENTO_DEFAULT: {
    nombre: 'TIEMPO_PROCESAMIENTO_DEFAULT',
    valor: '15',
    descripcion: 'Tiempo estimado en días que tomará procesar un expediente desde su recepción hasta su resolución. Este valor se muestra en el formulario de creación de expedientes.',
    categoria: CategoriaConfiguracion.EXPEDIENTES,
    esEditable: true
  },
  MAX_TIEMPO_PROCESAMIENTO: {
    nombre: 'MAX_TIEMPO_PROCESAMIENTO',
    valor: '30',
    descripcion: 'Límite máximo de días permitidos para el procesamiento de un expediente. Los usuarios no podrán ingresar un valor mayor a este en el formulario.',
    categoria: CategoriaConfiguracion.EXPEDIENTES,
    esEditable: true
  },
  EXPEDIENTES_POR_OFICINA_LIMITE: {
    nombre: 'EXPEDIENTES_POR_OFICINA_LIMITE',
    valor: '200',
    descripcion: 'Número máximo de expedientes que puede procesar una oficina simultáneamente. Se aplica al asignar expedientes a oficinas.',
    categoria: CategoriaConfiguracion.EXPEDIENTES,
    esEditable: true
  },
  DIAS_ANTES_VENCIMIENTO_EXPEDIENTE: {
    nombre: 'DIAS_ANTES_VENCIMIENTO_EXPEDIENTE',
    valor: '15',
    descripción: 'Días antes del vencimiento de un expediente para mostrar alertas sobre la necesidad de atención o resolución.',
    categoria: CategoriaConfiguracion.EXPEDIENTES,
    esEditable: true
  },
  
  // Empresas
  CAPACIDAD_MAXIMA_DEFAULT: {
    nombre: 'CAPACIDAD_MAXIMA_DEFAULT',
    valor: '100',
    descripcion: 'Número máximo de expedientes que puede manejar una oficina simultáneamente. Este valor se asigna por defecto al crear nuevas oficinas y se puede modificar individualmente.',
    categoria: CategoriaConfiguracion.EMPRESAS,
    esEditable: true
  },
  EMPRESAS_ACTIVAS_LIMITE: {
    nombre: 'EMPRESAS_ACTIVAS_LIMITE',
    valor: '1000',
    descripcion: 'Número máximo de empresas que pueden estar activas en el sistema simultáneamente. Se aplica al registrar nuevas empresas.',
    categoria: CategoriaConfiguracion.EMPRESAS,
    esEditable: true
  },
  DIAS_VALIDEZ_DOCUMENTOS: {
    nombre: 'DIAS_VALIDEZ_DOCUMENTOS',
    valor: '365',
    descripcion: 'Días de validez por defecto para documentos empresariales como licencias, certificados y permisos. Se usa para calcular fechas de vencimiento.',
    categoria: CategoriaConfiguracion.EMPRESAS,
    esEditable: true
  },
  
  // Sistema
  PAGINACION_DEFAULT: {
    nombre: 'PAGINACION_DEFAULT',
    valor: '20',
    descripcion: 'Número de elementos que se muestran por página en todas las listas del sistema (resoluciones, expedientes, empresas, etc.). Afecta la navegación y rendimiento de las consultas.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  SESSION_TIMEOUT: {
    nombre: 'SESSION_TIMEOUT',
    valor: '3600',
    descripcion: 'Tiempo en segundos que permanece activa la sesión del usuario sin actividad. Después de este tiempo, el usuario deberá volver a iniciar sesión. 3600 segundos = 1 hora.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  ZONA_HORARIA: {
    nombre: 'ZONA_HORARIA',
    valor: 'America/Lima',
    descripcion: 'Zona horaria del sistema (UTC-5 para Lima, Perú). Todas las fechas y horas se mostrarán y almacenarán según esta configuración. Afecta la visualización de fechas de emisión, vigencia y vencimiento.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  OFFSET_ZONA_HORARIA: {
    nombre: 'OFFSET_ZONA_HORARIA',
    valor: '-5',
    descripcion: 'Diferencia en horas respecto a UTC para la zona horaria configurada. Lima, Perú está en UTC-5. Este valor se usa para ajustar las fechas al guardar y mostrar.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  FORMATO_FECHA: {
    nombre: 'FORMATO_FECHA',
    valor: 'DD/MM/YYYY',
    descripcion: 'Formato de visualización de fechas en todo el sistema. DD=día, MM=mes, YYYY=año. Ejemplo: 04/12/2025. Este formato se aplica en reportes, formularios y listados.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  FORMATO_FECHA_HORA: {
    nombre: 'FORMATO_FECHA_HORA',
    valor: 'DD/MM/YYYY HH:mm',
    descripcion: 'Formato de visualización de fechas con hora en el sistema. HH=hora (24h), mm=minutos. Ejemplo: 04/12/2025 14:30. Se usa en logs, auditoría y timestamps.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  
  // Sedes de Registro
  SEDES_DISPONIBLES: {
    nombre: 'SEDES_DISPONIBLES',
    valor: 'PUNO,LIMA,AREQUIPA,JULIACA,CUSCO,TACNA,HUANCAYO,TRUJILLO,CHICLAYO,PIURA',
    descripcion: 'Lista de sedes disponibles para el registro de vehículos, separadas por comas. Todas las sedes deben estar en mayúsculas. Ejemplo: PUNO,LIMA,AREQUIPA',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  SEDE_DEFAULT: {
    nombre: 'SEDE_DEFAULT',
    valor: 'PUNO',
    descripcion: 'Sede por defecto que aparecerá seleccionada al crear un nuevo vehículo. Debe ser una de las sedes disponibles en SEDES_DISPONIBLES.',
    categoria: CategoriaConfiguracion.SISTEMA,
    esEditable: true
  },
  
  // Notificaciones
  NOTIFICACIONES_EMAIL: {
    nombre: 'NOTIFICACIONES_EMAIL',
    valor: 'true',
    descripcion: 'Habilita el envío automático de notificaciones por correo electrónico para eventos importantes como: creación de resoluciones, cambios de estado en expedientes, recordatorios de vencimiento, etc.',
    categoria: CategoriaConfiguracion.NOTIFICACIONES,
    esEditable: true
  },
  NOTIFICACIONES_PUSH: {
    nombre: 'NOTIFICACIONES_PUSH',
    valor: 'true',
    descripcion: 'Habilita las notificaciones push en tiempo real dentro de la aplicación para alertar sobre cambios importantes, tareas pendientes, o actualizaciones de estado sin necesidad de recargar la página.',
    categoria: CategoriaConfiguracion.NOTIFICACIONES,
    esEditable: true
  },

  // Estados de Vehículos
  ESTADOS_VEHICULOS_CONFIG: {
    nombre: 'ESTADOS_VEHICULOS_CONFIG',
    valor: JSON.stringify([
      { codigo: 'HABILITADO', nombre: 'Habilitado', color: '#4CAF50', descripcion: 'Vehículo operativo y disponible para servicio', esDefault: true },
      { codigo: 'NO_HABILITADO', nombre: 'No Habilitado', color: '#F44336', descripcion: 'Vehículo temporalmente fuera de servicio', esDefault: false },
      { codigo: 'SUSPENDIDO', nombre: 'Suspendido', color: '#FF9800', descripcion: 'Vehículo suspendido por motivos administrativos', esDefault: false },
      { codigo: 'MANTENIMIENTO', nombre: 'Mantenimiento', color: '#9C27B0', descripcion: 'Vehículo en proceso de reparación o mantenimiento', esDefault: false }
    ]),
    descripcion: 'Configuración de estados disponibles para vehículos con sus colores y descripciones. Uno de los estados debe marcarse como por defecto (esDefault: true).',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true,
    tieneValorDefault: true
  },
  
  // Categorías de Vehículos
  CATEGORIAS_VEHICULOS: {
    nombre: 'CATEGORIAS_VEHICULOS',
    valor: 'M1,M2,M2-C3,M3,N1',
    descripcion: 'Categorías de vehículos disponibles separadas por comas',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true,
    tieneValorDefault: true,
    valorDefault: 'M2-C3'
  },
  
  // Tipos de Carrocería
  TIPOS_CARROCERIA: {
    nombre: 'TIPOS_CARROCERIA',
    valor: 'MICROBUS,MINIBUS,OMNIBUS,COASTER,FURGON,CAMIONETA',
    descripcion: 'Tipos de carrocería disponibles separados por comas',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true,
    tieneValorDefault: true,
    valorDefault: 'MICROBUS'
  },
  
  // Tipos de Combustible
  TIPOS_COMBUSTIBLE: {
    nombre: 'TIPOS_COMBUSTIBLE',
    valor: 'GASOLINA,DIESEL,GAS_NATURAL,GLP,ELECTRICO,HIBRIDO',
    descripcion: 'Tipos de combustible disponibles separados por comas',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true,
    tieneValorDefault: true,
    valorDefault: 'DIESEL'
  },
  PERMITIR_CAMBIO_ESTADO_MASIVO: {
    nombre: 'PERMITIR_CAMBIO_ESTADO_MASIVO',
    valor: 'true',
    descripcion: 'Habilita la funcionalidad de cambio de estado masivo para múltiples vehículos simultáneamente.',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true
  },
  MOTIVO_OBLIGATORIO_CAMBIO_ESTADO: {
    nombre: 'MOTIVO_OBLIGATORIO_CAMBIO_ESTADO',
    valor: 'false',
    descripcion: 'Define si es obligatorio proporcionar un motivo al cambiar el estado de un vehículo.',
    categoria: CategoriaConfiguracion.VEHICULOS,
    esEditable: true
  }
}; 