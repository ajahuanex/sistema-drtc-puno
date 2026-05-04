import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface SheetInfo {
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
   * Obtener datos reales de Google Sheets sin API key (usando CSV export)
   */
  obtenerDatosReales(spreadsheetId: string, sheetName: string = ''): Observable<SheetInfo> {
    // Usar la URL de exportación CSV de Google Sheets (no requiere API key)
    // Si no especifica hoja, usa la primera (gid=0)
    const gid = sheetName ? `&gid=0` : '';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid}`;

    return this.http.get(csvUrl, { responseType: 'text' }).pipe(
      map(csv => this.parsearCSV(csv)),
      catchError(error => this.handleError('obtenerDatosReales', error))
    );
  }

  /**
   * Parsear CSV a formato estructurado
   */
  private parsearCSV(csv: string): SheetInfo {
    const lineas = csv.trim().split('\n');
    
    if (lineas.length === 0) {
      throw new Error('El archivo CSV está vacío');
    }

    // Primera línea son los encabezados
    const encabezados = this.parsearLinea(lineas[0]);
    
    // Resto son datos
    const datos = lineas.slice(1).map(linea => this.parsearLinea(linea));

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
      } else if (char === ',' && !entreComillas) {
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
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validar si una URL o ID es válido
   */
  validarUrl(url: string): boolean {
    if (!url.trim()) return false;
    
    if (url.includes('docs.google.com')) {
      return this.extraerIdDeUrl(url) !== null;
    }
    
    return /^[a-zA-Z0-9-_]+$/.test(url);
  }

  private handleError(context: string, error: any): Observable<never> {
    console.error(`❌ Error en ${context}:`, error);
    
    let mensaje = 'Error al acceder a Google Sheets';
    
    if (error.status === 404) {
      mensaje = 'Hoja de cálculo no encontrada. Verifica el ID o URL.';
    } else if (error.status === 403) {
      mensaje = 'Acceso denegado. Asegúrate de que la hoja sea pública o compartida.';
    } else if (error.status === 400) {
      mensaje = 'Solicitud inválida. Verifica el rango de celdas.';
    } else if (error.status === 0) {
      mensaje = 'Error de conexión. Verifica tu conexión a internet.';
    }

    return throwError(() => new Error(mensaje));
  }
}
