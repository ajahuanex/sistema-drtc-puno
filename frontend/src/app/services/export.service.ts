import { Injectable } from '@angular/core';
import { Ruta } from '../models/ruta.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  customColumns?: string[];
  dateFormat?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Exporta rutas a Excel
   */
  exportToExcel(rutas: Ruta[], options: ExportOptions = {}): void {
    const {
      filename = 'rutas_export',
      includeHeaders = true,
      customColumns
    } = options;

    // Preparar datos para exportación
    const data = this.prepareDataForExport(rutas, customColumns);
    
    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(data, { 
      header: customColumns || this.getDefaultColumns(),
      skipHeader: !includeHeaders 
    });
    
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Empresa
      { wch: 12 }, // RUC
      { wch: 15 }, // Resolución
      { wch: 12 }, // Código Ruta
      { wch: 20 }, // Origen
      { wch: 20 }, // Destino
      { wch: 30 }, // Itinerario
      { wch: 15 }, // Frecuencias
      { wch: 12 }, // Tipo Ruta
      { wch: 15 }, // Tipo Servicio
      { wch: 10 }, // Estado
      { wch: 12 }  // Fecha Registro
    ];
    ws['!cols'] = colWidths;

    // Aplicar estilos a headers
    if (includeHeaders) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1976D2" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rutas');
    
    // Agregar metadatos
    wb.Props = {
      Title: 'Exportación de Rutas',
      Subject: 'Sistema DRTC Puno',
      Author: 'Sistema SIRRET',
      CreatedDate: new Date()
    };

    // Guardar archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  }

  /**
   * Exporta rutas a CSV
   */
  exportToCSV(rutas: Ruta[], options: ExportOptions = {}): void {
    const {
      filename = 'rutas_export',
      customColumns
    } = options;

    const data = this.prepareDataForExport(rutas, customColumns);
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    saveAs(blob, `${filename}_${timestamp}.csv`);
  }

  /**
   * Exporta rutas a PDF
   */
  exportToPDF(rutas: Ruta[], options: ExportOptions = {}): void {
    const {
      filename = 'rutas_export',
      customColumns
    } = options;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más columnas
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Rutas - Sistema SIRRET', 20, 20);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 20, 30);
    doc.text(`Total de rutas: ${rutas.length}`, 20, 35);

    // Preparar datos para la tabla
    const tableData = rutas.map(ruta => [
      this.getEmpresaNombre(ruta),
      ruta.empresa?.ruc || 'Sin RUC',
      ruta.resolucion?.nroResolucion || 'Sin resolución',
      ruta.codigoRuta,
      ruta.origen?.nombre || ruta.origen || 'Sin origen',
      ruta.destino?.nombre || ruta.destino || 'Sin destino',
      ruta.frecuencia?.descripcion || 'Sin frecuencias',
      ruta.tipoRuta || 'Sin tipo',
      ruta.estado || 'Sin estado'
    ]);

    const headers = [
      'Empresa', 'RUC', 'Resolución', 'Código', 
      'Origen', 'Destino', 'Frecuencias', 'Tipo', 'Estado'
    ];

    // Generar tabla
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 45,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Empresa
        1: { cellWidth: 25 }, // RUC
        2: { cellWidth: 25 }, // Resolución
        3: { cellWidth: 20 }, // Código
        4: { cellWidth: 30 }, // Origen
        5: { cellWidth: 30 }, // Destino
        6: { cellWidth: 25 }, // Frecuencias
        7: { cellWidth: 20 }, // Tipo
        8: { cellWidth: 20 }  // Estado
      },
      margin: { top: 45, left: 20, right: 20 }
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }

    // Guardar archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    doc.save(`${filename}_${timestamp}.pdf`);
  }

  /**
   * Exporta estadísticas de rutas a Excel
   */
  exportEstadisticasToExcel(estadisticas: any, rutas: Ruta[]): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen general
    const resumenData = [
      ['Métrica', 'Valor'],
      ['Total de Rutas', rutas.length],
      ['Rutas Activas', rutas.filter(r => r.estado === 'ACTIVA').length],
      ['Rutas Inactivas', rutas.filter(r => r.estado === 'INACTIVA').length],
      ['Empresas Únicas', new Set(rutas.map(r => r.empresa?.id)).size],
      ['Resoluciones Únicas', new Set(rutas.map(r => r.resolucion?.id)).size]
    ];
    
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Rutas por empresa
    if (estadisticas.porEmpresa) {
      const empresaData = [['Empresa', 'RUC', 'Cantidad de Rutas']];
      Object.entries(estadisticas.porEmpresa).forEach(([empresaId, datos]: [string, any]) => {
        empresaData.push([datos.nombre, datos.ruc, datos.cantidad]);
      });
      
      const wsEmpresa = XLSX.utils.aoa_to_sheet(empresaData);
      XLSX.utils.book_append_sheet(wb, wsEmpresa, 'Por Empresa');
    }

    // Hoja 3: Rutas por estado
    if (estadisticas.porEstado) {
      const estadoData = [['Estado', 'Cantidad']];
      Object.entries(estadisticas.porEstado).forEach(([estado, cantidad]) => {
        estadoData.push([estado, String(cantidad)]);
      });
      
      const wsEstado = XLSX.utils.aoa_to_sheet(estadoData);
      XLSX.utils.book_append_sheet(wb, wsEstado, 'Por Estado');
    }

    // Hoja 4: Datos completos
    const rutasData = this.prepareDataForExport(rutas);
    const wsRutas = XLSX.utils.json_to_sheet(rutasData);
    XLSX.utils.book_append_sheet(wb, wsRutas, 'Datos Completos');

    // Guardar archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    XLSX.writeFile(wb, `estadisticas_rutas_${timestamp}.xlsx`);
  }

  /**
   * Prepara los datos para exportación
   */
  private prepareDataForExport(rutas: Ruta[], customColumns?: string[]): any[] {
    return rutas.map(ruta => {
      const data: any = {
        'Empresa': this.getEmpresaNombre(ruta),
        'RUC': ruta.empresa?.ruc || 'Sin RUC',
        'Resolución': ruta.resolucion?.nroResolucion || 'Sin resolución',
        'Código Ruta': ruta.codigoRuta,
        'Origen': ruta.origen?.nombre || ruta.origen || 'Sin origen',
        'Destino': ruta.destino?.nombre || ruta.destino || 'Sin destino',
        'Itinerario': ruta.descripcion || ruta.nombre || `${ruta.origen?.nombre || ruta.origen} - ${ruta.destino?.nombre || ruta.destino}`,
        'Frecuencias': ruta.frecuencia?.descripcion || 'Sin frecuencias',
        'Tipo Ruta': ruta.tipoRuta || 'Sin tipo',
        'Tipo Servicio': ruta.tipoServicio || 'Sin tipo servicio',
        'Estado': ruta.estado || 'Sin estado',
        'Fecha Registro': ruta.fechaRegistro ? new Date(ruta.fechaRegistro).toLocaleDateString('es-PE') : 'Sin fecha'
      };

      // Si hay columnas personalizadas, filtrar solo esas
      if (customColumns && customColumns.length > 0) {
        const filteredData: any = {};
        customColumns.forEach(col => {
          if (data[col] !== undefined) {
            filteredData[col] = data[col];
          }
        });
        return filteredData;
      }

      return data;
    });
  }

  /**
   * Obtiene las columnas por defecto para exportación
   */
  private getDefaultColumns(): string[] {
    return [
      'Empresa', 'RUC', 'Resolución', 'Código Ruta', 'Origen', 'Destino',
      'Itinerario', 'Frecuencias', 'Tipo Ruta', 'Tipo Servicio', 'Estado', 'Fecha Registro'
    ];
  }

  /**
   * Obtiene el nombre de la empresa
   */
  private getEmpresaNombre(ruta: Ruta): string {
    if (ruta.empresa?.razonSocial) {
      if (typeof ruta.empresa.razonSocial === 'string') {
        return ruta.empresa.razonSocial;
      } else if (ruta.empresa.razonSocial.principal) {
        return ruta.empresa.razonSocial.principal;
      }
    }
    return 'Sin nombre de empresa';
  }
}