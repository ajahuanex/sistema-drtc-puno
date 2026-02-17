/**
 * Configuración simple de estados de empresa
 */

export const ESTADOS_EMPRESA = {
  AUTORIZADO: 'AUTORIZADO',
  SUSPENDIDO: 'SUSPENDIDO', 
  CANCELADO: 'CANCELADO',
  EN_TRAMITE: 'EN_TRAMITE'
} as const;

export const ESTADOS_LABELS = {
  'AUTORIZADA': 'Autorizada',
  'SUSPENDIDA': 'Suspendida',
  'CANCELADA': 'Cancelada',
  'EN_TRAMITE': 'En Trámite'
};

export const ESTADOS_BACKEND = {
  [ESTADOS_EMPRESA.AUTORIZADO]: 'AUTORIZADA',
  [ESTADOS_EMPRESA.SUSPENDIDO]: 'SUSPENDIDA',
  [ESTADOS_EMPRESA.CANCELADO]: 'CANCELADA',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'EN_TRAMITE'
};

export const ESTADOS_COLORS = {
  [ESTADOS_EMPRESA.AUTORIZADO]: 'success',
  [ESTADOS_EMPRESA.SUSPENDIDO]: 'warning',
  [ESTADOS_EMPRESA.CANCELADO]: 'danger',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'info'
};

export const ESTADOS_ICONS = {
  [ESTADOS_EMPRESA.AUTORIZADO]: 'check_circle',
  [ESTADOS_EMPRESA.SUSPENDIDO]: 'pause_circle',
  [ESTADOS_EMPRESA.CANCELADO]: 'cancel',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'hourglass_empty'
};

// Ya no necesitamos conversión porque los valores coinciden