import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedienteService } from '../../services/expediente.service';

interface ResultadoValidacion {
  total_filas?: number;
  validos?: number;
  invalidos?: number;
  con_advertencias?: number;
  errores?: Array<{
    fila: number;
    numero_expediente: string;
    errores: string[];
  }>;
  advertencias?: Array<{
    fila: number;
    numero_expediente: string;
    advertencias: string[];
  }>;
}

interface ResultadoProcesamiento extends ResultadoValidacion {
  expedientes_creados?: Array<{
    numero_expediente: string;
    empresa_ruc: string;
    tipo_tramite: string;
    estado: string;
  }>;
  errores_creacion?: Array<{
    numero_expediente: string;
    error: string;
  }>;
  total_creadas?: number;
}

@Component({
  selector: 'app-carga-masiva-expedientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-masiva-expedientes.component.html',
  styleUrls: ['./carga-masiva-expedientes.component.scss']
})
export class CargaMasivaExpedientesComponent implements OnInit {
  
  // Estado del componente
  archivoSeleccionado: File | null = null;
  cargando = false;
  mostrarResultados = false;
  soloValidar = true;
  
  // Resultados
  resultadoValidacion: ResultadoValidacion | null = null;
  resultadoProcesamiento: ResultadoProcesamiento | null = null;
  
  // UI State
  mostrarErrores = true;
  mostrarAdvertencias = true;
  mostrarExpedientesCreados = true;
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' | 'info' | '' = '';
  mostrarMensajeFlag = false;

  constructor(private expedienteService: ExpedienteService) {}

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar tipo de archivo
      if (!archivo.name.endsWith('.xlsx') && !archivo.name.endsWith('.xls')) {
        this.mostrarMensaje('Por favor seleccione un archivo Excel (.xlsx o .xls)', 'error');
        // Limpiar el input
        event.target.value = '';
        return;
      }
      
      // Validar tamaño del archivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (archivo.size > maxSize) {
        this.mostrarMensaje('El archivo es demasiado grande. Máximo permitido: 10MB', 'error');
        event.target.value = '';
        return;
      }
      
      this.archivoSeleccionado = archivo;
      this.limpiarResultados();
      this.mostrarMensaje(`Archivo seleccionado: ${archivo.name} (${(archivo.size / 1024).toFixed(2)} KB)`, 'info');
    } else {
      this.archivoSeleccionado = null;
      this.limpiarResultados();
    }
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.cargando = true;
      await this.expedienteService.descargarPlantillaExpedientes();
      // Mostrar mensaje de éxito
      this.mostrarMensaje('✅ Plantilla descargada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al descargar plantilla:', error);
      this.mostrarMensaje(`❌ Error al descargar plantilla: ${error.message || 'Error desconocido'}`, 'error');
    } finally {
      this.cargando = false;
    }
  }

  async procesarArchivo(): Promise<void> {
    if (!this.archivoSeleccionado) {
      this.mostrarMensaje('Por favor seleccione un archivo', 'error');
      return;
    }

    try {
      this.cargando = true;
      this.limpiarResultados();

      if (this.soloValidar) {
        // Solo validar
        const resultado = await this.expedienteService.validarArchivoExpedientes(this.archivoSeleccionado);
        this.resultadoValidacion = resultado.validacion;
      } else {
        // Procesar y crear expedientes
        const resultado = await this.expedienteService.procesarCargaMasivaExpedientes(
          this.archivoSeleccionado, 
          false
        );
        this.resultadoProcesamiento = resultado.resultado;
      }

      this.mostrarResultados = true;

    } catch (error: any) {
      console.error('Error al procesar archivo:', error);
      this.mostrarMensaje(`❌ Error al procesar archivo: ${error.message || 'Error desconocido'}`, 'error');
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
    
    // Limpiar input file
    const fileInput = document.getElementById('archivoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Getters para la vista
  get resultado(): ResultadoValidacion | ResultadoProcesamiento | null {
    return this.resultadoProcesamiento || this.resultadoValidacion;
  }

  get esResultadoProcesamiento(): boolean {
    return this.resultadoProcesamiento !== null;
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

  get errores(): Array<{fila: number; numero_expediente: string; errores: string[]}> {
    return this.resultado?.errores || [];
  }

  get advertencias(): Array<{fila: number; numero_expediente: string; advertencias: string[]}> {
    return this.resultado?.advertencias || [];
  }

  get tieneErrores(): boolean {
    return this.errores.length > 0;
  }

  get tieneAdvertencias(): boolean {
    return this.advertencias.length > 0;
  }

  get tieneExpedientesCreados(): boolean {
    return this.esResultadoProcesamiento && 
           (this.resultadoProcesamiento?.expedientes_creados?.length || 0) > 0;
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