import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalidadService } from './localidad.service';
import { LocalidadCreate, NivelTerritorial } from '../models/localidad.model';
import * as XLSX from 'xlsx';

export interface MunicipalidadExcel {
  ubigeo: string;
  ubigeo_identificador_mcp: string;
  departamento: string;
  provincia: string;
  distrito: string;
  municipalidad_centro_poblado: string;
  dispositivo_legal_creacion: string;
}

export interface ResultadoImportacion {
  totalProcesados: number;
  exitosos: number;
  errores: number;
  detallesErrores: string[];
  municipalidadesCreadas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportacionMunicipalidadesService {

  constructor(
    private http: HttpClient,
    private localidadService: LocalidadService
  ) {}

  /**
   * Procesa un archivo Excel de municipalidades
   */
  async procesarArchivoExcel(file: File): Promise<MunicipalidadExcel[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Tomar la primera hoja
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Procesar datos (asumiendo que la primera fila son headers)
          const municipalidades = this.procesarDatosExcel(jsonData as any[][]);
          
          console.log(`📊 Procesadas ${municipalidades.length} municipalidades del Excel`);
          resolve(municipalidades);
          
        } catch (error) {
          console.error('❌ Error procesando Excel:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Procesa los datos del Excel según la estructura mostrada
   */
  private procesarDatosExcel(data: any[][]): MunicipalidadExcel[] {
    const municipalidades: MunicipalidadExcel[] = [];
    
    // Saltar las primeras filas si son headers
    const startRow = this.encontrarFilaInicio(data);
    
    for (let i = startRow; i < data.length; i++) {
      const fila = data[i];
      
      // Verificar que la fila tenga datos suficientes
      if (!fila || fila.length < 7) continue;
      
      try {
        const municipalidad: MunicipalidadExcel = {
          ubigeo: this.limpiarTexto(fila[0]), // Columna A: UBIGEO
          ubigeo_identificador_mcp: this.limpiarTexto(fila[1]), // Columna B: UBIGEO E IDENTIFICADOR MCP
          departamento: this.limpiarTexto(fila[2]), // Columna C: DEPARTAMENTO
          provincia: this.limpiarTexto(fila[3]), // Columna D: PROVINCIA
          distrito: this.limpiarTexto(fila[4]), // Columna E: DISTRITO
          municipalidad_centro_poblado: this.limpiarTexto(fila[5]), // Columna F: Municipalidad de Centro Poblado
          dispositivo_legal_creacion: this.limpiarTexto(fila[6]) // Columna G: Dispositivo Legal de Creación
        };
        
        // Validar que tenga los campos obligatorios
        if (municipalidad.municipalidad_centro_poblado && 
            municipalidad.departamento && 
            municipalidad.provincia && 
            municipalidad.distrito) {
          municipalidades.push(municipalidad);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error procesando fila ${i + 1}:`, error);
      }
    }
    
    return municipalidades;
  }

  /**
   * Encuentra la fila donde empiezan los datos reales
   */
  private encontrarFilaInicio(data: any[][]): number {
    for (let i = 0; i < data.length; i++) {
      const fila = data[i];
      if (fila && fila.length > 0) {
        // Buscar una fila que tenga UBIGEO o números
        const primerCampo = String(fila[0]).trim();
        if (primerCampo && /^\d+$/.test(primerCampo)) {
          return i;
        }
      }
    }
    return 1; // Por defecto, saltar la primera fila (headers)
  }

  /**
   * Limpia y normaliza texto
   */
  private limpiarTexto(valor: any): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
  }

  /**
   * Importa municipalidades a la base de datos
   */
  async importarMunicipalidades(
    municipalidades: MunicipalidadExcel[],
    sobreescribir: boolean = false
  ): Promise<ResultadoImportacion> {
    
    console.log(`🚀 Iniciando importación de ${municipalidades.length} municipalidades...`);
    
    const resultado: ResultadoImportacion = {
      totalProcesados: municipalidades.length,
      exitosos: 0,
      errores: 0,
      detallesErrores: [],
      municipalidadesCreadas: []
    };

    // Obtener localidades existentes si no se va a sobreescribir
    let existentes: Set<string> = new Set();
    if (!sobreescribir) {
      try {
        const localidadesExistentes = await this.localidadService.getLocalidades().toPromise();
        existentes = new Set(
          localidadesExistentes?.map(l => 
            `${l.departamento}-${l.provincia}-${l.distrito}-${l.municipalidad_centro_poblado}`.toUpperCase()
          ) || []
        );
      } catch (error) {
        console.warn('⚠️ No se pudieron obtener localidades existentes:', error);
      }
    }

    // Procesar cada municipalidad
    for (const municipalidad of municipalidades) {
      try {
        const clave = `${municipalidad.departamento}-${municipalidad.provincia}-${municipalidad.distrito}-${municipalidad.municipalidad_centro_poblado}`.toUpperCase();
        
        // Verificar si ya existe
        if (!sobreescribir && existentes.has(clave)) {
          console.log(`⏭️ Saltando (ya existe): ${municipalidad.municipalidad_centro_poblado}`);
          continue;
        }

        // Crear la localidad
        const localidadCreate: LocalidadCreate = {
          ubigeo: municipalidad.ubigeo || undefined,
          ubigeo_identificador_mcp: municipalidad.ubigeo_identificador_mcp || undefined,
          departamento: municipalidad.departamento.toUpperCase(),
          provincia: municipalidad.provincia.toUpperCase(),
          distrito: municipalidad.distrito.toUpperCase(),
          municipalidad_centro_poblado: municipalidad.municipalidad_centro_poblado,
          nivel_territorial: NivelTerritorial.CENTRO_POBLADO,
          dispositivo_legal_creacion: municipalidad.dispositivo_legal_creacion || undefined,
          descripcion: 'Importado desde Excel de Municipalidades de Centros Poblados 2025',
          observaciones: `Importado automáticamente el ${new Date().toLocaleDateString()}`
        };

        await this.localidadService.crearLocalidad(localidadCreate);
        
        resultado.exitosos++;
        resultado.municipalidadesCreadas.push(municipalidad.municipalidad_centro_poblado);
        
        console.log(`✅ Creada: ${municipalidad.municipalidad_centro_poblado}`);
        
      } catch (error) {
        resultado.errores++;
        const mensaje = `Error con ${municipalidad.municipalidad_centro_poblado}: ${error}`;
        resultado.detallesErrores.push(mensaje);
        console.error(`❌ ${mensaje}`);
      }
    }

    console.log('✅ Importación completada:', resultado);
    return resultado;
  }

  /**
   * Valida los datos del Excel antes de importar
   */
  validarDatos(municipalidades: MunicipalidadExcel[]): {
    validas: MunicipalidadExcel[];
    invalidas: { municipalidad: MunicipalidadExcel; errores: string[] }[];
  } {
    const validas: MunicipalidadExcel[] = [];
    const invalidas: { municipalidad: MunicipalidadExcel; errores: string[] }[] = [];

    municipalidades.forEach(municipalidad => {
      const errores: string[] = [];

      // Validaciones obligatorias
      if (!municipalidad.municipalidad_centro_poblado) {
        errores.push('Municipalidad de Centro Poblado es obligatorio');
      }
      if (!municipalidad.departamento) {
        errores.push('Departamento es obligatorio');
      }
      if (!municipalidad.provincia) {
        errores.push('Provincia es obligatorio');
      }
      if (!municipalidad.distrito) {
        errores.push('Distrito es obligatorio');
      }

      // Validaciones de formato
      if (municipalidad.ubigeo && !/^\d{6}$/.test(municipalidad.ubigeo)) {
        errores.push('UBIGEO debe tener 6 dígitos');
      }

      if (errores.length === 0) {
        validas.push(municipalidad);
      } else {
        invalidas.push({ municipalidad, errores });
      }
    });

    return { validas, invalidas };
  }

  /**
   * Genera un reporte de la importación
   */
  generarReporte(resultado: ResultadoImportacion): string {
    let reporte = '📊 REPORTE DE IMPORTACIÓN DE MUNICIPALIDADES\n';
    reporte += '='.repeat(50) + '\n\n';
    
    reporte += `📈 RESUMEN:\n`;
    reporte += `   • Total procesados: ${resultado.totalProcesados}\n`;
    reporte += `   • Exitosos: ${resultado.exitosos}\n`;
    reporte += `   • Errores: ${resultado.errores}\n`;
    reporte += `   • Tasa de éxito: ${((resultado.exitosos / resultado.totalProcesados) * 100).toFixed(1)}%\n\n`;

    if (resultado.municipalidadesCreadas.length > 0) {
      reporte += `✅ MUNICIPALIDADES CREADAS (${resultado.municipalidadesCreadas.length}):\n`;
      resultado.municipalidadesCreadas.forEach((nombre, index) => {
        reporte += `   ${index + 1}. ${nombre}\n`;
      });
      reporte += '\n';
    }

    if (resultado.detallesErrores.length > 0) {
      reporte += `❌ ERRORES ENCONTRADOS (${resultado.detallesErrores.length}):\n`;
      resultado.detallesErrores.forEach((error, index) => {
        reporte += `   ${index + 1}. ${error}\n`;
      });
    }

    return reporte;
  }

  /**
   * Descarga una plantilla Excel para municipalidades
   */
  descargarPlantilla(): void {
    const datos = [
      ['UBIGEO', 'UBIGEO E IDENTIFICADOR MCP', 'DEPARTAMENTO', 'PROVINCIA', 'DISTRITO', 'Municipalidad de Centro Poblado', 'Dispositivo Legal de Creación de la Municipalidad'],
      ['010106', '010106001', 'AMAZONAS', 'CHACHAPOYAS', 'CHUQUIBAMBA', 'La Morada', 'Ordenanza Municipal N° 038 del 14 Feb 2008'],
      ['010202', '010202001', 'AMAZONAS', 'BAGUA', 'ARAMANGO', 'Copallin de Aramango', 'Ordenanza Municipal N° 263 del 06 Dic 1988'],
      ['', '', '', '', '', '', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Municipalidades');

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 10 }, // UBIGEO
      { wch: 20 }, // UBIGEO E IDENTIFICADOR MCP
      { wch: 15 }, // DEPARTAMENTO
      { wch: 15 }, // PROVINCIA
      { wch: 15 }, // DISTRITO
      { wch: 30 }, // Municipalidad
      { wch: 40 }  // Dispositivo Legal
    ];
    ws['!cols'] = colWidths;

    // Descargar archivo
    XLSX.writeFile(wb, 'plantilla_municipalidades.xlsx');
  }
}