/**
 * Configuración simple de estados de empresa
 */

export const ESTADOS_EMPRESA = {
  AUTORIZADA: 'AUTORIZADA',
  SUSPENDIDA: 'SUSPENDIDA', 
  CANCELADA: 'CANCELADA',
  EN_TRAMITE: 'EN_TRAMITE'
} as const;

export const ESTADOS_LABELS = {
  'AUTORIZADA': 'Autorizada',
  'SUSPENDIDA': 'Suspendida',
  'CANCELADA': 'Cancelada',
  'EN_TRAMITE': 'En Trámite'
};

export const ESTADOS_BACKEND = {
  [ESTADOS_EMPRESA.AUTORIZADA]: 'AUTORIZADA',
  [ESTADOS_EMPRESA.SUSPENDIDA]: 'SUSPENDIDA',
  [ESTADOS_EMPRESA.CANCELADA]: 'CANCELADA',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'EN_TRAMITE'
};

export const ESTADOS_COLORS = {
  [ESTADOS_EMPRESA.AUTORIZADA]: 'success',
  [ESTADOS_EMPRESA.SUSPENDIDA]: 'warning',
  [ESTADOS_EMPRESA.CANCELADA]: 'danger',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'info'
};

export const ESTADOS_ICONS = {
  [ESTADOS_EMPRESA.AUTORIZADA]: 'check_circle',
  [ESTADOS_EMPRESA.SUSPENDIDA]: 'pause_circle',
  [ESTADOS_EMPRESA.CANCELADA]: 'cancel',
  [ESTADOS_EMPRESA.EN_TRAMITE]: 'hourglass_empty'
};

// Ya no necesitamos conversión porque los valores coinciden