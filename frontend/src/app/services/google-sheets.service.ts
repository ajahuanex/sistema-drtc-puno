import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SheetInfo {
  encabezados: string[];
  datos: string[][];
  totalFilas: number;
  totalColumnas: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  constructor(private http: HttpClient) {}

  /**
   * Extraer GID de hoja/tab de una URL de Google Sheets
   */
  extraerGidDeUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/[?&#]gid=([0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Obtener datos reales de Google Sheets sin API key usando fetch() nativo
   * (Evita la inyección de encabezados Authorization y problemas de interceptores)
   */
  obtenerDatosReales(spreadsheetIdOrUrl: string, sheetName: string = ''): Observable<SheetInfo> {
    const cleanId = this.extraerIdDeUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;
    const extractedGid = this.extraerGidDeUrl(spreadsheetIdOrUrl);
    const gid = extractedGid ? extractedGid : (sheetName ? sheetName : '0');
    const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=${gid}`;

    // Usar fetch() nativo del navegador para evitar que el interceptor de Angular inserte Bearer token
    return from(
      fetch(csvUrl, { method: 'GET' })
        .then(async (response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              throw new Error('Google Sheets denegó el acceso (401/403). Por favor verifica que la hoja sea PÚBLICA ("Cualquier persona con el enlace puede ver").');
            }
            if (response.status === 404) {
              throw new Error('Hoja de Google Sheets no encontrada. Verifica el ID o URL proporcionado.');
            }
            throw new Error(`Error HTTP ${response.status} al acceder a Google Sheets.`);
          }
          return await response.text();
        })
    ).pipe(
      map(csv => this.parsearCSV(csv)),
      catchError(error => {
        console.error('❌ Error en GoogleSheetsService:', error);
        return throwError(() => new Error(error.message || 'Error de conexión con Google Sheets.'));
      })
    );
  }

  /**
   * Parsear CSV a formato estructurado
   */
  parsearCSV(csv: string): SheetInfo {
    const lineas = csv.trim().split(/\r?\n/);

    if (lineas.length === 0 || !lineas[0].trim()) {
      throw new Error('El archivo descargado de Google Sheets está vacío.');
    }

    // Primera línea son los encabezados
    const encabezados = this.parsearLinea(lineas[0]);

    // Resto son datos
    const datos = lineas.slice(1)
      .filter(l => l.trim().length > 0)
      .map(linea => this.parsearLinea(linea));

    return {
      encabezados,
      datos,
      totalFilas: datos.length,
      totalColumnas: encabezados.length
    };
  }

  /**
   * Parsear una línea CSV respetando comillas
   */
  private parsearLinea(linea: string): string[] {
    const resultado: string[] = [];
    let actual = '';
    let entreComillas = false;

    for (let i = 0; i < linea.length; i++) {
      const char = linea[i];
      const siguienteChar = linea[i + 1];

      if (char === '"') {
        if (entreComillas && siguienteChar === '"') {
          actual += '"';
          i++;
        } else {
          entreComillas = !entreComillas;
        }
      } else if ((char === ',' || char === ';') && !entreComillas) {
        resultado.push(actual.trim());
        actual = '';
      } else {
        actual += char;
      }
    }

    resultado.push(actual.trim());
    return resultado;
  }

  /**
   * Extraer ID de una URL de Google Sheets
   */
  extraerIdDeUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];

    // Si pasaron directamente el ID sin URL
    if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
      return url.trim();
    }
    return null;
  }

  /**
   * Validar si una URL o ID es válido
   */
  validarUrl(url: string): boolean {
    if (!url || !url.trim()) return false;
    return this.extraerIdDeUrl(url) !== null;
  }
}
