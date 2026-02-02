import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EmpresaService } from '../../services/empresa.service';

interface ResultadoValidacion {
  total_filas?: number;
  validos?: number;
  invalidos?: number;
  con_advertencias?: number;
  errores?: Array<{
    fila: number;
    codigo_empresa: string;
    errores: string[];
  }>;
  advertencias?: Array<{
    fila: number;
    codigo_empresa: string;
    advertencias: string[];
  }>;
}

interface ResultadoProcesamiento extends ResultadoValidacion {
  empresas_creadas?: Array<{
    codigo_empresa: string;
    ruc: string;
    razon_social: string;
    estado: string;
  }>;
  errores_creacion?: Array<{
    codigo_empresa: string;
    error: string;
  }>;
  total_creadas?: number;
}

@Component({
  selector: 'app-carga-masiva-empresas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    SmartIconComponent
  ],
  templateUrl: './carga-masiva-empresas.component.html',
  styleUrls: ['./carga-masiva-empresas.component.scss']
})
export class CargaMasivaEmpresasComponent implements OnInit {
  
  // Estado del componente
  archivoSeleccionado: File | null = null;
  cargando = false;
  mostrarResultados = false;
  soloValidar = true;
  isDragOver = false;
  
  // Resultados
  resultadoValidacion: ResultadoValidacion | null = null;
  resultadoProcesamiento: ResultadoProcesamiento | null = null;
  
  // UI State
  mostrarErrores = true;
  mostrarAdvertencias = true;
  mostrarEmpresasCreadas = true;
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' | 'info' | '' = '';
  mostrarMensajeFlag = false;

  constructor(private empresaService: EmpresaService) {}

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  // Métodos de drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      this.handleFile(archivo);
    } else {
      this.archivoSeleccionado = null;
      this.limpiarResultados();
    }
  }

  private handleFile(archivo: File): void {
    // console.log removed for production
    
    // Validar extensión del archivo
    const fileName = archivo.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      this.mostrarMensaje('Tipo de archivo no válido. Use archivos Excel (.xlsx, .xls)', 'error');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (archivo.size > maxSize) {
      this.mostrarMensaje(`El archivo es demasiado grande (${this.formatFileSize(archivo.size)}). Máximo permitido: 10MB`, 'error');
      return;
    }

    // Validar que el archivo no esté vacío
    if (archivo.size === 0) {
      this.mostrarMensaje('El archivo está vacío. Seleccione un archivo válido.', 'error');
      return;
    }

    // Archivo válido
    this.archivoSeleccionado = archivo;
    this.limpiarResultados();
    this.mostrarMensaje(`Archivo "${archivo.name}" seleccionado correctamente (${this.formatFileSize(archivo.size)})`, 'success');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.cargando = true;
      await this.empresaService.descargarPlantillaEmpresas();
      // Mostrar mensaje de éxito
      this.mostrarMensaje('✅ Plantilla descargada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al descargar plantilla::', error);
      this.mostrarMensaje(`❌ Error al descargar plantilla: ${error.message || 'Error desconocido'}`, 'error');
    } finally {
      this.cargando = false;
    }
  }

  async procesarArchivo(): Promise<void> {
    if (!this.archivoSeleccionado) {
      this.mostrarMensaje('Por favor seleccione un archivo', 'warning');
      return;
    }

    try {
      this.cargando = true;
      this.limpiarResultados();

      // console.log removed for production

      if (this.soloValidar) {
        // Solo validar
        // console.log removed for production
        const resultado = await this.empresaService.validarArchivoEmpresas(this.archivoSeleccionado);
        // console.log removed for production
        
        if (resultado && resultado.validacion) {
          this.resultadoValidacion = resultado.validacion;
          this.mostrarMensaje('Validación completada', 'success');
        } else {
          throw new Error('Respuesta de validación inválida');
        }
      } else {
        // Procesar y crear empresas
        // console.log removed for production
        const resultado = await this.empresaService.procesarCargaMasivaEmpresas(
          this.archivoSeleccionado, 
          false // soloValidar = false para crear empresas
        );
        // console.log removed for production
        
        if (resultado && resultado.resultado) {
          this.resultadoProcesamiento = resultado.resultado;
          this.mostrarMensaje('Procesamiento completado', 'success');
        } else {
          throw new Error('Respuesta de procesamiento inválida');
        }
      }

      this.mostrarResultados = true;

    } catch (error: any) {
      console.error('[CARGA-MASIVA] Error al procesar archivo::', error);
      
      let mensajeError = 'Error desconocido';
      if (error.message) {
        mensajeError = error.message;
      } else if (typeof error === 'string') {
        mensajeError = error;
      }
      
      this.mostrarMensaje(`❌ Error al procesar archivo: ${mensajeError}`, 'error');
    } finally {
      this.cargando = false;
    }
  }

  limpiarResultados(): void {
    this.resultadoValidacion = null;
    this.resultadoProcesamiento = null;
    this.mostrarResultados = false;
  }

  reiniciar(): void {
    this.archivoSeleccionado = null;
    this.limpiarResultados();
    this.soloValidar = true;
    this.isDragOver = false;
    
    // Limpiar input file usando ViewChild o querySelector
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => {
      if (input) {
        input.value = '';
      }
    });
    
    this.mostrarMensaje('Formulario reiniciado', 'info');
  }

  // Getters para la vista
  get resultado(): ResultadoValidacion | ResultadoProcesamiento | null {
    return this.resultadoProcesamiento || this.resultadoValidacion;
  }

  // Getters seguros para propiedades específicas
  get totalFilas(): number {
    return this.resultado?.total_filas || 0;
  }

  get validos(): number {
    return this.resultado?.validos || 0;
  }

  get invalidos(): number {
    return this.resultado?.invalidos || 0;
  }

  get conAdvertencias(): number {
    return this.resultado?.con_advertencias || 0;
  }

  get errores(): Array<{fila: number; codigo_empresa: string; errores: string[]}> {
    return this.resultado?.errores || [];
  }

  get advertencias(): Array<{fila: number; codigo_empresa: string; advertencias: string[]}> {
    return this.resultado?.advertencias || [];
  }

  get esResultadoProcesamiento(): boolean {
    return this.resultadoProcesamiento !== null;
  }

  get tieneErrores(): boolean {
    return this.errores.length > 0;
  }

  get tieneAdvertencias(): boolean {
    return this.advertencias.length > 0;
  }

  get tieneEmpresasCreadas(): boolean {
    return this.esResultadoProcesamiento && 
           (this.resultadoProcesamiento?.empresas_creadas?.length || 0) > 0;
  }

  // Métodos de utilidad
  obtenerClaseEstado(validos: number, invalidos: number): string {
    if (invalidos === 0) return 'success';
    if (validos === 0) return 'danger';
    return 'warning';
  }

  obtenerIconoEstado(validos: number, invalidos: number): string {
    if (invalidos === 0) return '✅';
    if (validos === 0) return '❌';
    return '⚠️';
  }

  obtenerPorcentajeValidos(): number {
    if (this.totalFilas === 0) return 0;
    return Math.round((this.validos / this.totalFilas) * 100);
  }

  // Método para mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    this.mostrarMensajeFlag = true;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.ocultarMensaje();
    }, 5000);
  }

  ocultarMensaje(): void {
    this.mostrarMensajeFlag = false;
    this.mensaje = '';
    this.tipoMensaje = '';
  }

  // Método para obtener la clase CSS del mensaje
  obtenerClaseMensaje(): string {
    switch (this.tipoMensaje) {
      case 'success': return 'alert alert-success';
      case 'error': return 'alert alert-danger';
      case 'warning': return 'alert alert-warning';
      case 'info': return 'alert alert-info';
      default: return 'alert alert-info';
    }
  }
}