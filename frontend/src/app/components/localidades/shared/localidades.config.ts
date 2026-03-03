import { TipoLocalidad, NivelTerritorial } from '../../../models/localidad.model';

export const LOCALIDADES_CONFIG = {
  // Configuración de tabla
  columnasTabla: ['nombre', 'tipo', 'ubicacion', 'poblacion', 'coordenadas', 'estado', 'acciones'],
  
  // Opciones para filtros
  departamentos: ['PUNO'],
  
  provincias: [
    'PUNO', 'AZANGARO', 'CARABAYA', 'CHUCUITO', 'EL COLLAO', 
    'HUANCANE', 'LAMPA', 'MELGAR', 'MOHO', 'SAN ANTONIO DE PUTINA', 
    'SAN ROMAN', 'SANDIA', 'YUNGUYO'
  ],
  
  tiposLocalidad: [
    'PROVINCIA', 'DISTRITO', 'CENTRO_POBLADO', 'LOCALIDAD', 'CIUDAD'
  ],

  // Labels para tipos
  tipoLabels: {
    [TipoLocalidad.PUEBLO]: 'Pueblo',
    [TipoLocalidad.CENTRO_POBLADO]: 'Centro Poblado',
    [TipoLocalidad.LOCALIDAD]: 'Localidad',
    [TipoLocalidad.DISTRITO]: 'Distrito',
    [TipoLocalidad.PROVINCIA]: 'Provincia',
    [TipoLocalidad.DEPARTAMENTO]: 'Departamento',
    [TipoLocalidad.CIUDAD]: 'Ciudad'
  },

  // Configuración de paginación
  paginacion: {
    tamanosDisponibles: [10, 25, 50, 100],
    tamanoDefault: 25
  }
};