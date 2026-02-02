/**
 * Configuración para el módulo de localidades
 */
export const LOCALIDADES_CONFIG = {
  // Modo de operación: 'local' para usar datos locales, 'remote' para MongoDB
  modo: 'remote' as 'local' | 'remote',
  
  // Configuración de la API remota
  api: {
    baseUrl: '/api/localidades',
    timeout: 30000,
    retries: 3
  },
  
  // Configuración de datos locales
  local: {
    archivoJson: '/assets/data/localidades.json',
    autoGuardar: false, // Si se debe guardar automáticamente en localStorage
    cacheKey: 'sirret_localidades_cache'
  },
  
  // Configuración de la interfaz
  ui: {
    paginacion: {
      tamanosDisponibles: [10, 25, 50, 100],
      tamanoDefault: 25
    },
    filtros: {
      expandidosPorDefecto: false,
      recordarEstado: true
    },
    busqueda: {
      minimoCaracteres: 1,
      retardoMs: 300
    }
  },
  
  // Configuración de validaciones
  validaciones: {
    nombre: {
      minLength: 2,
      maxLength: 100,
      required: true
    },
    ubigeo: {
      pattern: /^\d{6,9}$/,
      required: true
    }
  },
  
  // Mensajes del sistema
  mensajes: {
    cargando: 'Cargando localidades...',
    sinResultados: 'No se encontraron localidades',
    errorCarga: 'Error al cargar las localidades',
    guardadoExitoso: 'Localidad guardada exitosamente',
    eliminadoExitoso: 'Localidad eliminada exitosamente'
  },

  // Configuración de la tabla
  columnasTabla: ['nombre', 'tipo', 'ubicacion', 'nivel', 'estado', 'acciones'],
  
  // Labels para tipos
  tipoLabels: {
    'PROVINCIA': 'Provincia',
    'DISTRITO': 'Distrito', 
    'CENTRO_POBLADO': 'Centro Poblado',
    'PUEBLO': 'Pueblo',
    'LOCALIDAD': 'Localidad',
    'DEPARTAMENTO': 'Departamento',
    'CIUDAD': 'Ciudad'
  },
  
  // Labels para niveles
  nivelLabels: {
    'PROVINCIA': 'Provincia',
    'DISTRITO': 'Distrito',
    'CENTRO_POBLADO': 'Centro Poblado',
    'PUEBLO': 'Pueblo',
    'DEPARTAMENTO': 'Departamento'
  },

  // Labels para departamentos
  departamentoLabels: {
    'PUNO': 'Puno',
    'OTROS': 'Otros (datos incompletos)'
  },

  // Descripción de filtros especiales
  filtrosEspeciales: {
    'OTROS_DEPARTAMENTO': 'Localidades con datos de ubicación incompletos (sin departamento, provincia o distrito estándar)'
  },

  // Configuración de paginación (compatibilidad)
  paginacion: {
    tamanosDisponibles: [10, 25, 50, 100],
    tamanoDefault: 25
  }
} as const;

/**
 * Función para obtener la configuración según el entorno
 */
export function obtenerConfigLocalidades(entorno: 'development' | 'production' = 'development') {
  const config = { ...LOCALIDADES_CONFIG };
  
  // En desarrollo, usar datos locales por defecto
  if (entorno === 'development') {
    config.modo = 'local';
  }
  
  // En producción, usar API remota por defecto
  if (entorno === 'production') {
    config.modo = 'remote';
  }
  
  return config;
}

/**
 * Tipos para la configuración
 */
export type LocalidadesConfigType = typeof LOCALIDADES_CONFIG;
export type ModoOperacion = typeof LOCALIDADES_CONFIG.modo;