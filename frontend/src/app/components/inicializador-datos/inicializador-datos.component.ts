import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InicializadorService, EtapaInicializador, PreviewResponse } from '../../services/inicializador.service';

export interface LogEntry {
  timestamp: string;
  etapaId: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  mensaje: string;
}

@Component({
  selector: 'app-inicializador-datos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './inicializador-datos.component.html',
  styleUrls: ['./inicializador-datos.component.scss']
})
export class InicializadorDatosComponent implements OnInit {
  private inicializadorService = inject(InicializadorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Estados Reactivos
  isLoading = signal<boolean>(false);
  isPreviewLoading = signal<boolean>(false);
  isExecuting = signal<boolean>(false);
  etapaActualIndex = signal<number>(0);
  modoIngreso = signal<'url' | 'archivo'>('url');

  etapas = signal<EtapaInicializador[]>([]);
  sheetsUrls = signal<Record<string, string>>({
    empresas: 'https://docs.google.com/spreadsheets/d/1M_GKLrrIN_lXupWzoWRCeuoQhtN2UYidTZFac0ooM7Y/edit?gid=0#gid=0',
    resoluciones: 'https://docs.google.com/spreadsheets/d/1mL0mxt8BbJX9qBU-ba__H6xx8T95RGNaqZhIIVtnpI0/edit?gid=0#gid=0',
    rutas: 'https://docs.google.com/spreadsheets/d/1K22A0urIqnyWV-u4Yb2_PSPJpoFNxhhMj4D5QCRfpg0/edit?gid=0#gid=0',
    vehiculos: 'https://docs.google.com/spreadsheets/d/1VAY3H0-J0xUYpbKhWczGeBPTNk2ME0SrOfGa_U2vwjI/edit?usp=drive_web&ouid=116680375118904809154',
    matriz: 'https://docs.google.com/spreadsheets/d/1HNGDNmU0La1v6mfbJwoJtK7-0zPvOjpxq9OhgcBe--I/edit?gid=0#gid=0'
  });

  selectedFile = signal<File | null>(null);
  previewData = signal<PreviewResponse | null>(null);
  logs = signal<LogEntry[]>([]);

  // Computed signals
  etapaActual = computed(() => {
    const list = this.etapas();
    const idx = this.etapaActualIndex();
    return list[idx] || null;
  });

  progresoGlobal = computed(() => {
    const list = this.etapas();
    if (!list.length) return 0;
    const completadas = list.filter(e => e.total_registros > 0).length;
    return Math.round((completadas / list.length) * 100);
  });

  ngOnInit(): void {
    this.cargarEstado();
  }

  cargarEstado(): void {
    this.isLoading.set(true);
    this.inicializadorService.obtenerEstado().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.etapas) {
          this.etapas.set(res.etapas);
          if (res.default_urls) {
            this.sheetsUrls.set({ ...this.sheetsUrls(), ...res.default_urls });
          }
          this.addLog('info', 'general', 'Estado del sistema cargado exitosamente.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Error al conectar con el Inicializador del servidor.', 'Cerrar', { duration: 4000 });
        this.addLog('error', 'general', `Fallo al consultar estado: ${err.message || err.detail}`);
      }
    });
  }

  seleccionarEtapa(index: number): void {
    this.etapaActualIndex.set(index);
    this.previewData.set(null);
    this.selectedFile.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  previsualizar(): void {
    const etapa = this.etapaActual();
    if (!etapa) return;

    this.isPreviewLoading.set(true);
    this.previewData.set(null);

    if (this.modoIngreso() === 'url') {
      const url = this.sheetsUrls()[etapa.id];
      if (!url) {
        this.snackBar.open('Ingrese una URL válida de Google Sheets.', 'Cerrar', { duration: 3000 });
        this.isPreviewLoading.set(false);
        return;
      }

      this.inicializadorService.previsualizarGoogleSheet(etapa.id, url).subscribe({
        next: (res) => {
          this.isPreviewLoading.set(false);
          this.previewData.set(res);
          this.addLog('info', etapa.id, `Vista previa generada: ${res.total_filas} registros, ${res.total_columnas} columnas detectadas.`);
          this.snackBar.open(`Vista previa: ${res.total_filas} filas detectadas.`, 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          this.isPreviewLoading.set(false);
          const msg = err.error?.detail || err.message || 'Error al previsualizar hoja';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.addLog('error', etapa.id, `Error en vista previa: ${msg}`);
        }
      });
    } else {
      const file = this.selectedFile();
      if (!file) {
        this.snackBar.open('Seleccione un archivo Excel o CSV.', 'Cerrar', { duration: 3000 });
        this.isPreviewLoading.set(false);
        return;
      }

      this.inicializadorService.previsualizarArchivo(etapa.id, file).subscribe({
        next: (res) => {
          this.isPreviewLoading.set(false);
          this.previewData.set(res);
          this.addLog('info', etapa.id, `Vista previa de archivo: ${res.total_filas} filas, ${res.total_columnas} columnas.`);
          this.snackBar.open(`Vista previa de archivo: ${res.total_filas} filas.`, 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          this.isPreviewLoading.set(false);
          const msg = err.error?.detail || err.message || 'Error al procesar archivo';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.addLog('error', etapa.id, `Error en vista previa de archivo: ${msg}`);
        }
      });
    }
  }

  ejecutarEtapa(): void {
    const etapa = this.etapaActual();
    if (!etapa) return;

    this.isExecuting.set(true);
    this.addLog('info', etapa.id, `Iniciando ingesta de datos para ${etapa.nombre}...`);

    if (this.modoIngreso() === 'url') {
      const url = this.sheetsUrls()[etapa.id];
      this.inicializadorService.ejecutarGoogleSheet(etapa.id, url).subscribe({
        next: (res) => {
          this.isExecuting.set(false);
          this.addLog('success', etapa.id, `¡Etapa completada con éxito! ${res.mensaje || ''}`);
          this.snackBar.open(`Ingesta de ${etapa.nombre} completada.`, 'Cerrar', { duration: 4000 });
          this.cargarEstado();
          // Avanzar a la siguiente etapa si existe
          if (this.etapaActualIndex() < this.etapas().length - 1) {
            this.etapaActualIndex.update(idx => idx + 1);
            this.previewData.set(null);
          }
        },
        error: (err) => {
          this.isExecuting.set(false);
          const msg = err.error?.detail || err.message || 'Error en ejecución de ingesta';
          this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 6000 });
          this.addLog('error', etapa.id, `Fallo en la ingesta: ${msg}`);
        }
      });
    } else {
      const file = this.selectedFile();
      if (!file) {
        this.isExecuting.set(false);
        this.snackBar.open('Seleccione un archivo.', 'Cerrar', { duration: 3000 });
        return;
      }

      this.inicializadorService.ejecutarArchivo(etapa.id, file).subscribe({
        next: (res) => {
          this.isExecuting.set(false);
          this.addLog('success', etapa.id, `¡Archivo procesado con éxito! ${res.mensaje || ''}`);
          this.snackBar.open(`Ingesta completada para ${etapa.nombre}.`, 'Cerrar', { duration: 4000 });
          this.cargarEstado();
          if (this.etapaActualIndex() < this.etapas().length - 1) {
            this.etapaActualIndex.update(idx => idx + 1);
            this.previewData.set(null);
          }
        },
        error: (err) => {
          this.isExecuting.set(false);
          const msg = err.error?.detail || err.message || 'Error procesando archivo';
          this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 6000 });
          this.addLog('error', etapa.id, `Fallo en ejecución: ${msg}`);
        }
      });
    }
  }

  irACentroTramites(): void {
    this.router.navigate(['/centro-tramites']);
  }

  private addLog(tipo: 'info' | 'success' | 'warning' | 'error', etapaId: string, mensaje: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      etapaId,
      tipo,
      mensaje
    };
    this.logs.update(list => [entry, ...list]);
  }
}
