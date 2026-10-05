import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte cualquier fecha (Date, string ISO 'YYYY-MM-DD', 'YYYY/MM/DD', etc.)
 * al formato estándar latinoamericano: DD/MM/AAAA (DD/MM/YYYY).
 * Evita desfasajes por zona horaria de cadenas ISO sin tiempo.
 */
export function formatoFechaLatina(fechaStr: string | Date | null | undefined, defaultValue: string = '-'): string {
  if (!fechaStr) return defaultValue;

  if (fechaStr instanceof Date) {
    if (isNaN(fechaStr.getTime())) return defaultValue;
    const dd = String(fechaStr.getDate()).padStart(2, '0');
    const mm = String(fechaStr.getMonth() + 1).padStart(2, '0');
    const yyyy = fechaStr.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  const str = String(fechaStr).trim();
  if (!str || str === '-' || str.toUpperCase() === 'INDEFINIDO' || str.toUpperCase() === 'S/F' || str.toUpperCase() === 'NO CONSIGNADA') {
    return str || defaultValue;
  }

  // Ya está en formato latino DD/MM/AAAA o DD-MM-AAAA
  const matchLatino = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (matchLatino) {
    return `${matchLatino[1]}/${matchLatino[2]}/${matchLatino[3]}`;
  }

  // Formato ISO YYYY-MM-DD o YYYY/MM/DD (con o sin hora T... / espacio...)
  const matchIso = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (matchIso) {
    return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]}`;
  }

  // Si no coincide con regex simple, intentar Date parser estándar
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  } catch {
    // Retornar la cadena tal como vino
  }

  return str;
}

@Pipe({
  name: 'fechaLatina',
  standalone: true
})
export class FechaLatinaPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, defaultValue: string = '-'): string {
    return formatoFechaLatina(value, defaultValue);
  }
}
