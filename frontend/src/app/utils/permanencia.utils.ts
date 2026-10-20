/**
 * Utilidades para el Régimen de Permanencia Vehicular
 * Conforme a:
 * - Marco Regional Puno: Resolución Ministerial N.° 585-2021-MTC/01 (1990 - 2009)
 * - Marco Nacional: Reglamento Nacional de Administración de Transporte - RENAT
 *   (Decreto Supremo N.° 017-2009-MTC, Art. 25: 15 años de vida útil máxima)
 */

export interface EvaluacionPermanencia {
  anioFabricacion: number | null;
  antiguedadAnios: number | null;
  anioRetiro: number | null;
  fechaLimiteRetiro: string | null;      // Formato DD/MM/AAAA (ej: 31/12/2028)
  fechaLimiteRetiroIso: string | null;   // Formato AAAA-MM-DD (ej: 2028-12-31)
  normaAplicable: string;
  esRegimenPuno: boolean;
  estado: 'VIGENTE' | 'PROXIMO_A_VENCER' | 'RETIRO_ANIO_ACTUAL' | 'VENCIDO' | 'NO_DETERMINADO';
  badgeColor: 'green' | 'amber' | 'red' | 'gray';
  badgeTexto: string;
  esApto: boolean;                       // false si el régimen de permanencia ya está vencido
  esCritico: boolean;                    // true si está vencido o vence en el año en curso
  mensaje: string;
}

export interface CompatibilidadConcesion {
  esCompatible: boolean;
  tipo: 'COMPATIBLE' | 'RETIRO_PREVIO_A_CONCESION' | 'RETIRO_VENCIDO' | 'SIN_DATOS';
  mensaje: string;
  badgeColor: 'green' | 'amber' | 'red' | 'gray';
}

/**
 * Cronograma oficial de permanencia extraordinaria para la Región Puno
 * R.M. N.° 585-2021-MTC/01 (Art. 1.1)
 */
const CRONOGRAMA_PUNO: { inicio: number; fin: number; anioRetiro: number }[] = [
  { inicio: 1990, fin: 1991, anioRetiro: 2021 },
  { inicio: 1992, fin: 1993, anioRetiro: 2022 },
  { inicio: 1994, fin: 1995, anioRetiro: 2023 },
  { inicio: 1996, fin: 1997, anioRetiro: 2024 },
  { inicio: 1998, fin: 1999, anioRetiro: 2025 },
  { inicio: 2000, fin: 2001, anioRetiro: 2026 },
  { inicio: 2002, fin: 2004, anioRetiro: 2027 },
  { inicio: 2005, fin: 2007, anioRetiro: 2028 },
  { inicio: 2008, fin: 2009, anioRetiro: 2029 }
];

/**
 * Evalúa el régimen de permanencia de un vehículo según su año de fabricación o modelo.
 */
export function evaluarPermanenciaVehiculo(
  anioFabricacion?: number | string | null,
  anioModelo?: number | string | null,
  anioActual: number = new Date().getFullYear()
): EvaluacionPermanencia {
  const af = anioFabricacion ? parseInt(String(anioFabricacion), 10) : null;
  const am = anioModelo ? parseInt(String(anioModelo), 10) : null;

  const anioBase = (af && !isNaN(af) && af > 1900) ? af : ((am && !isNaN(am) && am > 1900) ? am : null);

  if (!anioBase) {
    return {
      anioFabricacion: null,
      antiguedadAnios: null,
      anioRetiro: null,
      fechaLimiteRetiro: null,
      fechaLimiteRetiroIso: null,
      normaAplicable: 'Sin año consignado',
      esRegimenPuno: false,
      estado: 'NO_DETERMINADO',
      badgeColor: 'gray',
      badgeTexto: 'Sin año',
      esApto: true,
      esCritico: false,
      mensaje: 'No se consignó año de fabricación para calcular permanencia.'
    };
  }

  const antiguedad = anioActual - anioBase;
  let anioRetiro: number | null = null;
  let esRegimenPuno = false;
  let norma = '';

  // 1. Verificar cronograma Puno (1990 - 2009)
  for (const c of CRONOGRAMA_PUNO) {
    if (anioBase >= c.inicio && anioBase <= c.fin) {
      anioRetiro = c.anioRetiro;
      esRegimenPuno = true;
      norma = 'R.M. N.° 585-2021-MTC/01 (Puno)';
      break;
    }
  }

  // 2. Si no aplica Puno: Marco General RENAT (15 años)
  if (anioRetiro === null) {
    anioRetiro = anioBase + 15;
    norma = 'RENAT (D.S. N.° 017-2009-MTC, Art. 25: 15 años)';
  }

  const fechaLimiteIso = `${anioRetiro}-12-31`;
  const fechaLimiteStr = `31/12/${anioRetiro}`;

  // 3. Determinar estado de aptitud y criticidad
  if (anioRetiro < anioActual) {
    return {
      anioFabricacion: anioBase,
      antiguedadAnios: antiguedad,
      anioRetiro,
      fechaLimiteRetiro: fechaLimiteStr,
      fechaLimiteRetiroIso: fechaLimiteIso,
      normaAplicable: norma,
      esRegimenPuno,
      estado: 'VENCIDO',
      badgeColor: 'red',
      badgeTexto: `VENCIDO (${fechaLimiteStr})`,
      esApto: false,
      esCritico: true,
      mensaje: `⛔ PERMANENCIA VENCIDA: La unidad (año ${anioBase}) cumplió su retiro el ${fechaLimiteStr} conforme a ${norma}. No puede ingresar ni operar en transporte público.`
    };
  }

  if (anioRetiro === anioActual) {
    return {
      anioFabricacion: anioBase,
      antiguedadAnios: antiguedad,
      anioRetiro,
      fechaLimiteRetiro: fechaLimiteStr,
      fechaLimiteRetiroIso: fechaLimiteIso,
      normaAplicable: norma,
      esRegimenPuno,
      estado: 'RETIRO_ANIO_ACTUAL',
      badgeColor: 'amber',
      badgeTexto: `RETIRO ${anioActual} (${fechaLimiteStr})`,
      esApto: true,
      esCritico: true,
      mensaje: `⚠️ RETIRO OBLIGATORIO ESTE AÑO: Cumple fecha límite el ${fechaLimiteStr} conforme a ${norma}. Requerirá sustitución obligatoria al término del año.`
    };
  }

  if (anioRetiro === anioActual + 1) {
    return {
      anioFabricacion: anioBase,
      antiguedadAnios: antiguedad,
      anioRetiro,
      fechaLimiteRetiro: fechaLimiteStr,
      fechaLimiteRetiroIso: fechaLimiteIso,
      normaAplicable: norma,
      esRegimenPuno,
      estado: 'PROXIMO_A_VENCER',
      badgeColor: 'amber',
      badgeTexto: `Vence ${anioRetiro} (${fechaLimiteStr})`,
      esApto: true,
      esCritico: false,
      mensaje: `⚠️ ALERTA PREVENTIVA: Próximo a retiro vehicular el ${fechaLimiteStr} (${antiguedad} años de antigüedad bajo ${norma}).`
    };
  }

  return {
    anioFabricacion: anioBase,
    antiguedadAnios: antiguedad,
    anioRetiro,
    fechaLimiteRetiro: fechaLimiteStr,
    fechaLimiteRetiroIso: fechaLimiteIso,
    normaAplicable: norma,
    esRegimenPuno,
    estado: 'VIGENTE',
    badgeColor: 'green',
    badgeTexto: `Retiro: ${anioRetiro}`,
    esApto: true,
    esCritico: false,
    mensaje: `✓ APTO: Vigente bajo ${norma} hasta el ${fechaLimiteStr}.`
  };
}

/**
 * Evalúa compatibilidad entre la fecha de retiro de permanencia de la unidad
 * y la fecha de vencimiento de la resolución matriz / concesión.
 */
export function evaluarCompatibilidadConcesion(
  evalPermanencia: EvaluacionPermanencia,
  fechaFinConcesion?: string | null
): CompatibilidadConcesion {
  if (!evalPermanencia.anioRetiro || !evalPermanencia.fechaLimiteRetiroIso) {
    return {
      esCompatible: true,
      tipo: 'SIN_DATOS',
      mensaje: 'Sin datos suficientes de permanencia o resolución.',
      badgeColor: 'gray'
    };
  }

  if (!evalPermanencia.esApto) {
    return {
      esCompatible: false,
      tipo: 'RETIRO_VENCIDO',
      mensaje: `La unidad superó el régimen de permanencia (${evalPermanencia.fechaLimiteRetiro}). Incompatible con la concesión.`,
      badgeColor: 'red'
    };
  }

  if (!fechaFinConcesion) {
    return {
      esCompatible: true,
      tipo: 'COMPATIBLE',
      mensaje: `Unidad apta con límite de permanencia al ${evalPermanencia.fechaLimiteRetiro}.`,
      badgeColor: 'green'
    };
  }

  const fConcesionIso = String(fechaFinConcesion).substring(0, 10);
  const fRetiroIso = evalPermanencia.fechaLimiteRetiroIso;

  if (fRetiroIso < fConcesionIso) {
    return {
      esCompatible: false,
      tipo: 'RETIRO_PREVIO_A_CONCESION',
      mensaje: `Atención: El vehículo se retira el ${evalPermanencia.fechaLimiteRetiro}, ANTES del término de la concesión (${fConcesionIso}). La TUC solo podrá emitirse hasta la fecha de permanencia.`,
      badgeColor: 'amber'
    };
  }

  return {
    esCompatible: true,
    tipo: 'COMPATIBLE',
    mensaje: `Permanencia compatible con la vigencia de la concesión (Retiro: ${evalPermanencia.fechaLimiteRetiro}).`,
    badgeColor: 'green'
  };
}
