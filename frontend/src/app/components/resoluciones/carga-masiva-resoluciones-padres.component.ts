import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { ResolucionService } from '../../services/resolucion.service';

interface ResultadoValidacionPadres {
  valido?: boolean;
  total_filas?: number;
  errores?: string[];
  advertencias?: string[];
}

interface ResultadoProcesamiento {
  exito?: boolean;
  mensaje?: string;
  resoluciones_creadas?: Array<{
    numero: string;
    empresa: string;
    tipo: string;
    estado: string;
  }>;
  resoluciones_actualizadas?: Array<{
    numero: string;
    empresa: string;
    tipo: string;
    estado: string;
  }>;
  errores?: string[];
  advertencias?: string[];
  estadisticas?: {
    total_procesadas: number;
    creadas: number;
    actualizadas: number;
    errores: number;
  };
}

interface ReporteEstados {
  exito?: boolean;
  por_estado?: { [key: string]: number };
  por_tipo?: { [key: string]: number };
  con_resolucion_asociada?: number;
  sin_resolucion_asociada?: number;
  total?: number;
}

@Component({
  selector: 'app-carga-masiva-resoluciones-padres',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatStepperModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    SmartIconComponent
  ],
  templateUrl: './carga-masiva-resoluciones-padres.component.html',
  styleUrls: ['./carga-masiva-resoluciones-padres.component.scss']
})
export class CargaMasivaResolucionesPadresComponent implements OnInit {
  
  // Output para notificar al componente padre
  @Output() procesamientoCompletado = new EventEmitter<void>();
  
  // Estado del componente
  archivoSeleccionado: File | null = null;
  cargando = false;
  mostrarResultados = false;
  soloValidar = true;
  isDragOver = false;
  
  // Resultados
  resultadoValidacion: ResultadoValidacionPadres | null = null;
  resultadoProcesamiento: ResultadoProcesamiento | null = null;
  reporteEstados: ReporteEstados | null = null;
  
  // UI State
  mostrarErrores = true;
  mostrarAdvertencias = true;
  mostrarResolucionesCreadas = true;
  mostrarReporte = false;
  
  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' | 'info' | '' = '';
  mostrarMensajeFlag = false;

  // Estados y tipos válidos
  estadosValidos = ['ACTIVA', 'VENCIDA', 'RENOVADA', 'ANULADA'];
  tiposValidos = ['NUEVA', 'RENOVACION', 'MODIFICACION'];

  constructor(
    private resolucionService: ResolucionService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarReporteEstados();
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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async descargarPlantilla(): Promise<void> {
    try {
      this.cargando = true;
      this.resolucionService.descargarPlantillaResolucionesPadres().subscribe({
        next: (blob) => {
          // Crear y descargar archivo
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `plantilla_resoluciones_padres_${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.mostrarMensaje('Plantilla de resoluciones padres descargada exitosamente', 'success');
        },
        error: (error) => {
          console.error('Error al descargar plantilla::', error);
          this.mostrarMensaje(`Error al descargar plantilla: ${error.message || 'Error desconocido'}`, 'error');
        },
        complete: () => {
          this.cargando = false;
        }
      });
    } catch (error: any) {
      console.error('Error al descargar plantilla::', error);
      this.mostrarMensaje(`Error al descargar plantilla: ${error.message || 'Error desconocido'}`, 'error');
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
        this.resolucionService.validarArchivoResolucionesPadres(this.archivoSeleccionado).subscribe({
          next: (resultado) => {
            // console.log removed for production
            
            // La respuesta del backend tiene la estructura: { archivo, validacion, mensaje }
            if (resultado && resultado.validacion) {
              this.resultadoValidacion = resultado.validacion;
              this.mostrarMensaje(resultado.mensaje || 'Validación completada', 'success');
            } else {
              throw new Error('Respuesta de validación inválida');
            }
            this.mostrarResultados = true;
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.cargando = false;
          }
        });
      } else {
        // Procesar y crear resoluciones
        console.log('📤 Enviando archivo para procesamiento:', this.archivoSeleccionado.name);
        
        this.resolucionService.procesarCargaMasivaResolucionesPadres(this.archivoSeleccionado, false).subscribe({
          next: (resultado) => {
            console.log('📊 Resultado completo del backend:', resultado);
            console.log('📊 resultado.resultado:', resultado.resultado);
            
            // La respuesta del backend tiene la estructura: { archivo, solo_validacion, resultado, mensaje }
            if (resultado && resultado.resultado) {
              this.resultadoProcesamiento = resultado.resultado;
              
              console.log('✅ Procesamiento exitoso');
              console.log('📊 Estadísticas:', this.resultadoProcesamiento?.estadisticas);
              console.log('📊 Total creadas:', this.resultadoProcesamiento?.resoluciones_creadas?.length);
              console.log('📊 Total actualizadas:', this.resultadoProcesamiento?.resoluciones_actualizadas?.length);
              
              // Log de las primeras 3 resoluciones actualizadas para ver los datos
              if (this.resultadoProcesamiento?.resoluciones_actualizadas && 
                  this.resultadoProcesamiento.resoluciones_actualizadas.length > 0) {
                console.log('📋 Primeras 3 resoluciones actualizadas:');
                this.resultadoProcesamiento.resoluciones_actualizadas.slice(0, 3).forEach((res, index) => {
                  console.log(`  [${index + 1}] ${res.numero}:`, {
                    ...res,
                    todasLasClaves: Object.keys(res)
                  });
                });
                
                // Log completo del primer objeto
                console.log('📦 Objeto completo de la primera resolución actualizada:', 
                  this.resultadoProcesamiento.resoluciones_actualizadas[0]);
              }
              
              if (this.resultadoProcesamiento) {
                console.log('🔑 Claves disponibles en resultado:', Object.keys(this.resultadoProcesamiento));
              }
              
              this.mostrarMensaje(resultado.mensaje || 'Procesamiento completado', 'success');
              // Recargar reporte después del procesamiento
              this.cargarReporteEstados();
              // Emitir evento para que el componente padre recargue los datos
              this.procesamientoCompletado.emit();
              
              // Mostrar mensaje de éxito con opción de ir a resoluciones
              const totalProcesadas = (resultado.resultado.resoluciones_creadas?.length || 0) + 
                                     (resultado.resultado.resoluciones_actualizadas?.length || 0);
              this.snackBar.open(
                `✅ ${totalProcesadas} resoluciones procesadas exitosamente`,
                'Ver Resoluciones',
                {
                  duration: 10000, // 10 segundos para que el usuario pueda hacer clic
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['snackbar-success']
                }
              ).onAction().subscribe(() => {
                this.router.navigate(['/dashboard/resoluciones']);
              });
            } else {
              throw new Error('Respuesta de procesamiento inválida');
            }
            this.mostrarResultados = true;
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.cargando = false;
          }
        });
      }

    } catch (error: any) {
      this.handleError(error);
      this.cargando = false;
    }
  }

  async cargarReporteEstados(): Promise<void> {
    try {
      this.resolucionService.obtenerReporteEstadosResolucionesPadres().subscribe({
        next: (reporte) => {
          // console.log removed for production
          this.reporteEstados = reporte;
        },
        error: (error) => {
          console.error('Error al cargar reporte de estados::', error);
          // No mostrar error al usuario, es información adicional
        }
      });
    } catch (error) {
      console.error('Error al cargar reporte de estados::', error);
    }
  }

  private handleError(error: any): void {
    console.error('[CARGA-MASIVA-PADRES] Error al procesar archivo::', error);
    
    let mensajeError = 'Error desconocido';
    
    if (error.error && error.error.detail) {
      mensajeError = error.error.detail;
    } else if (error.message) {
      mensajeError = error.message;
    } else if (typeof error === 'string') {
      mensajeError = error;
    } else if (error.status) {
      switch (error.status) {
        case 500:
          mensajeError = 'Error interno del servidor. Verifique que el backend esté funcionando correctamente.';
          break;
        case 400:
          mensajeError = 'Datos inválidos en el archivo. Verifique el formato.';
          break;
        case 404:
          mensajeError = 'Servicio no encontrado. Verifique la configuración del backend.';
          break;
        default:
          mensajeError = `Error HTTP ${error.status}: ${error.statusText || 'Error desconocido'}`;
      }
    }
    
    this.mostrarMensaje(`Error al procesar archivo: ${mensajeError}`, 'error');
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
    
    // Limpiar input file
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => {
      if (input) {
        input.value = '';
      }
    });
    
    this.mostrarMensaje('Formulario reiniciado', 'info');
  }

  // Getters para la vista
  get tieneErrores(): boolean {
    return (this.resultadoValidacion?.errores?.length || 0) > 0 ||
           (this.resultadoProcesamiento?.errores?.length || 0) > 0;
  }

  get tieneAdvertencias(): boolean {
    return (this.resultadoValidacion?.advertencias?.length || 0) > 0 ||
           (this.resultadoProcesamiento?.advertencias?.length || 0) > 0;
  }

  get tieneResolucionesCreadas(): boolean {
    return (this.resultadoProcesamiento?.resoluciones_creadas?.length || 0) > 0;
  }

  get tieneResolucionesActualizadas(): boolean {
    return (this.resultadoProcesamiento?.resoluciones_actualizadas?.length || 0) > 0;
  }

  get errores(): string[] {
    return this.resultadoValidacion?.errores || this.resultadoProcesamiento?.errores || [];
  }

  get advertencias(): string[] {
    return this.resultadoValidacion?.advertencias || this.resultadoProcesamiento?.advertencias || [];
  }

  // Métodos de utilidad
  obtenerClaseEstado(valido: boolean): string {
    return valido ? 'success' : 'danger';
  }

  obtenerIconoEstado(valido: boolean): string {
    return valido ? '✅' : '❌';
  }

  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVA': return 'primary';
      case 'VENCIDA': return 'warn';
      case 'RENOVADA': return 'accent';
      case 'ANULADA': return 'warn';
      default: return 'primary';
    }
  }

  obtenerColorTipo(tipo: string): string {
    switch (tipo) {
      case 'NUEVA': return 'primary';
      case 'RENOVACION': return 'accent';
      case 'MODIFICACION': return 'warn';
      default: return 'primary';
    }
  }

  // Método para mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    this.mostrarMensajeFlag = true;
    
    // También mostrar en snackbar
    this.snackBar.open(texto, 'Cerrar', {
      duration: tipo === 'error' ? 5000 : 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
    
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

  toggleReporte(): void {
    this.mostrarReporte = !this.mostrarReporte;
    if (this.mostrarReporte && !this.reporteEstados) {
      this.cargarReporteEstados();
    }
  }

  // Métodos para obtener arrays de objetos del reporte
  get estadosArray(): Array<{estado: string, cantidad: number}> {
    if (!this.reporteEstados?.por_estado) return [];
    return Object.entries(this.reporteEstados.por_estado).map(([estado, cantidad]) => ({
      estado,
      cantidad
    }));
  }

  get tiposArray(): Array<{tipo: string, cantidad: number}> {
    if (!this.reporteEstados?.por_tipo) return [];
    return Object.entries(this.reporteEstados.por_tipo).map(([tipo, cantidad]) => ({
      tipo,
      cantidad
    }));
  }

  // Getters para estadísticas calculadas del procesamiento
  get totalCreadas(): number {
    return this.resultadoProcesamiento?.resoluciones_creadas?.length || 0;
  }

  get totalActualizadas(): number {
    return this.resultadoProcesamiento?.resoluciones_actualizadas?.length || 0;
  }

  get totalProcesadas(): number {
    return this.totalCreadas + this.totalActualizadas;
  }

  get totalErrores(): number {
    return this.resultadoProcesamiento?.errores?.length || 0;
  }
}

