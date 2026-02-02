import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  colorDark?: string;
  colorLight?: string;
  correctLevel?: 'L' | 'M' | 'Q' | 'H';
  format?: 'png' | 'jpeg' | 'svg';
  quality?: number;
}

export interface QRCodeData {
  numeroExpediente: string;
  url?: string;
  fechaGeneracion?: Date;
  metadata?: any;
}

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="qr-container" [ngClass]="getContainerClasses()">
      
      <!-- Header (solo si showHeader es true) -->
      <div class="qr-header" *ngIf="showHeader">
        <h3 class="qr-title">
          <mat-icon>qr_code</mat-icon>
          {{ title || 'Código QR' }}
        </h3>
        <p class="qr-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>

      <!-- QR Code Display -->
      <div class="qr-display" [ngClass]="getDisplayClasses()">
        
        <!-- Loading State -->
        <div class="qr-loading" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Generando código QR...</p>
        </div>

        <!-- Error State -->
        <div class="qr-error" *ngIf="error && !loading">
          <mat-icon class="error-icon">error</mat-icon>
          <h4>Error al generar QR</h4>
          <p>{{ error }}</p>
          <button mat-button color="primary" (click)="regenerateQR()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
        </div>

        <!-- QR Code -->
        <div class="qr-code-wrapper" *ngIf="!loading && !error">
          <canvas 
            #qrCanvas
            class="qr-canvas"
            [width]="options.size"
            [height]="options.size">
          </canvas>
          
          <!-- Overlay con información -->
          <div class="qr-overlay" *ngIf="showOverlay">
            <div class="overlay-content">
              <div class="expediente-info">
                <strong>{{ data.numeroExpediente }}</strong>
              </div>
              <div class="fecha-info" *ngIf="data.fechaGeneracion">
                {{ data.fechaGeneracion | date:'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Información del documento -->
        <div class="qr-info" *ngIf="showInfo && !loading && !error">
          <div class="info-item">
            <mat-icon class="info-icon">confirmation_number</mat-icon>
            <span class="info-label">Expediente:</span>
            <span class="info-value">{{ data.numeroExpediente }}</span>
          </div>
          
          <div class="info-item" *ngIf="data.url">
            <mat-icon class="info-icon">link</mat-icon>
            <span class="info-label">URL:</span>
            <span class="info-value url-value" [matTooltip]="data.url">
              {{ data.url | slice:0:30 }}{{ data.url.length > 30 ? '...' : '' }}
            </span>
          </div>
          
          <div class="info-item" *ngIf="data.fechaGeneracion">
            <mat-icon class="info-icon">schedule</mat-icon>
            <span class="info-label">Generado:</span>
            <span class="info-value">{{ data.fechaGeneracion | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="qr-actions" *ngIf="showActions && !loading && !error">
        <button 
          mat-button 
          color="primary"
          (click)="downloadQR()"
          [disabled]="downloading">
          <mat-icon>download</mat-icon>
          {{ downloading ? 'Descargando...' : 'Descargar' }}
        </button>
        
        <button 
          mat-button
          (click)="printQR()"
          [disabled]="printing">
          <mat-icon>print</mat-icon>
          {{ printing ? 'Imprimiendo...' : 'Imprimir' }}
        </button>
        
        <button 
          mat-button
          (click)="copyToClipboard()"
          [disabled]="copying">
          <mat-icon>content_copy</mat-icon>
          {{ copying ? 'Copiando...' : 'Copiar' }}
        </button>
        
        <button 
          mat-button
          (click)="shareQR()"
          *ngIf="canShare"
          [disabled]="sharing">
          <mat-icon>share</mat-icon>
          {{ sharing ? 'Compartiendo...' : 'Compartir' }}
        </button>
        
        <button 
          mat-icon-button
          matTooltip="Regenerar QR"
          (click)="regenerateQR()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Footer con información técnica -->
      <div class="qr-footer" *ngIf="showTechnicalInfo && !loading && !error">
        <div class="technical-info">
          <span class="tech-item">Tamaño: {{ options.size }}x{{ options.size }}</span>
          <span class="tech-item">Nivel: {{ options.correctLevel }}</span>
          <span class="tech-item">Formato: {{ options.format?.toUpperCase() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: white;
    }

    .qr-container.compact {
      padding: 8px;
    }

    .qr-container.card-style {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
    }

    .qr-header {
      text-align: center;
      margin-bottom: 16px;
      width: 100%;
    }

    .qr-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
      color: #2c3e50;
    }

    .qr-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .qr-subtitle {
      margin: 0;
      font-size: 14px;
      color: #6c757d;
    }

    .qr-display {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 16px;
    }

    .qr-display.bordered {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .qr-display.shadowed {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      padding: 16px;
    }

    .qr-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
    }

    .qr-loading p {
      margin-top: 16px;
      color: #6c757d;
      font-size: 14px;
    }

    .qr-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #d32f2f;
      margin-bottom: 16px;
    }

    .qr-error h4 {
      margin: 0 0 8px 0;
      color: #d32f2f;
      font-size: 16px;
    }

    .qr-error p {
      margin: 0 0 16px 0;
      color: #6c757d;
      font-size: 14px;
    }

    .qr-code-wrapper {
      position: relative;
      display: inline-block;
    }

    .qr-canvas {
      display: block;
      border-radius: 4px;
    }

    .qr-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: white;
      padding: 8px;
      border-radius: 0 0 4px 4px;
    }

    .overlay-content {
      text-align: center;
    }

    .expediente-info {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .fecha-info {
      font-size: 10px;
      opacity: 0.9;
    }

    .qr-info {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 300px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .info-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .info-label {
      font-weight: 500;
      color: #6c757d;
      min-width: 60px;
    }

    .info-value {
      color: #2c3e50;
      font-weight: 500;
      flex: 1;
    }

    .url-value {
      font-family: monospace;
      font-size: 11px;
    }

    .qr-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    }

    .qr-actions button {
      font-size: 12px;
    }

    .qr-actions mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .qr-footer {
      margin-top: 12px;
      width: 100%;
    }

    .technical-info {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tech-item {
      font-size: 10px;
      color: #6c757d;
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .qr-container {
        padding: 12px;
      }

      .qr-actions {
        flex-direction: column;
      }

      .qr-actions button {
        width: 100%;
      }

      .technical-info {
        flex-direction: column;
        align-items: center;
      }
    }

    /* Print Styles */
    @media print {
      .qr-container {
        box-shadow: none;
        border: 1px solid #000;
        page-break-inside: avoid;
      }

      .qr-actions,
      .qr-footer {
        display: none;
      }

      .qr-canvas {
        border: 1px solid #000;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .qr-container {
        border: 2px solid #000;
      }

      .qr-canvas {
        border: 1px solid #000;
      }

      .info-item {
        border: 1px solid #000;
      }
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .qr-container {
        background: #2c3e50;
        color: #ecf0f1;
      }

      .info-item {
        background: #34495e;
      }

      .tech-item {
        background: #34495e;
        color: #bdc3c7;
      }
    }
  `]
})
export class QRCodeGeneratorComponent implements OnInit, OnChanges {
  @Input() data!: QRCodeData;
  @Input() options: QRCodeOptions = {};
  @Input() showHeader = true;
  @Input() showInfo = true;
  @Input() showActions = true;
  @Input() showOverlay = false;
  @Input() showTechnicalInfo = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() compact = false;
  @Input() bordered = false;
  @Input() shadowed = false;
  @Input() autoGenerate = true;

  @Output() qrGenerated = new EventEmitter<string>();
  @Output() qrError = new EventEmitter<string>();
  @Output() qrDownloaded = new EventEmitter<void>();
  @Output() qrPrinted = new EventEmitter<void>();
  @Output() qrCopied = new EventEmitter<void>();
  @Output() qrShared = new EventEmitter<void>();

  // Estado del componente
  loading = false;
  error: string | null = null;
  downloading = false;
  printing = false;
  copying = false;
  sharing = false;

  // Canvas y contexto
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private qrDataUrl?: string;

  // Opciones por defecto
  private defaultOptions: Required<QRCodeOptions> = {
    size: 200,
    margin: 4,
    colorDark: '#000000',
    colorLight: '#FFFFFF',
    correctLevel: 'M',
    format: 'png',
    quality: 0.9
  };

  // Soporte para Web Share API
  canShare = false;

  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.checkWebShareSupport();
    
    if (this.autoGenerate && this.data) {
      this.generateQR();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['options']) {
      if (this.autoGenerate && this.data) {
        this.generateQR();
      }
    }
  }

  /**
   * Obtener opciones completas combinando defaults con input
   */
  private get completeOptions(): Required<QRCodeOptions> {
    return { ...this.defaultOptions, ...this.options };
  }

  /**
   * Verificar soporte para Web Share API
   */
  private checkWebShareSupport(): void {
    this.canShare = 'share' in navigator && 'canShare' in navigator;
  }

  /**
   * Obtener clases CSS del contenedor
   */
  getContainerClasses(): string {
    const classes = [];
    
    if (this.compact) classes.push('compact');
    if (this.bordered || this.shadowed) classes.push('card-style');
    
    return classes.join(' ');
  }

  /**
   * Obtener clases CSS del display
   */
  getDisplayClasses(): string {
    const classes = [];
    
    if (this.bordered) classes.push('bordered');
    if (this.shadowed) classes.push('shadowed');
    
    return classes.join(' ');
  }

  /**
   * Generar código QR
   */
  async generateQR(): Promise<void> {
    if (!this.data?.numeroExpediente) {
      this.error = 'Número de expediente requerido';
      this.qrError.emit(this.error);
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Construir datos del QR
      const qrContent = this.buildQRContent();
      
      // Generar QR usando una librería (simulado)
      await this.renderQRCode(qrContent);
      
      this.loading = false;
      this.qrGenerated.emit(this.qrDataUrl);
      
    } catch (error) {
      console.error('Error generando QR::', error);
      this.error = 'Error al generar el código QR';
      this.loading = false;
      this.qrError.emit(this.error);
    }
  }

  /**
   * Construir contenido del QR
   */
  private buildQRContent(): string {
    const baseUrl = this.data.url || `${window.location.origin}/consulta`;
    const params = new URLSearchParams({
      exp: this.data.numeroExpediente,
      t: Date.now().toString()
    });

    if (this.data.metadata) {
      params.set('meta', btoa(JSON.stringify(this.data.metadata)));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Renderizar código QR en canvas (simulado)
   */
  private async renderQRCode(content: string): Promise<void> {
    // Simular generación de QR
    await new Promise(resolve => setTimeout(resolve, 1000));

    // En una implementación real, aquí usarías una librería como qrcode.js
    // Por ahora, creamos un placeholder visual
    this.createPlaceholderQR(content);
  }

  /**
   * Crear QR placeholder para demostración
   */
  private createPlaceholderQR(content: string): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = this.completeOptions.size;
    
    canvas.width = size;
    canvas.height = size;
    
    // Fondo blanco
    ctx.fillStyle = this.completeOptions.colorLight;
    ctx.fillRect(0, 0, size, size);
    
    // Patrón de QR simulado
    ctx.fillStyle = this.completeOptions.colorDark;
    const cellSize = size / 25;
    
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Esquinas de posicionamiento
    this.drawPositionMarker(ctx, 0, 0, cellSize * 7);
    this.drawPositionMarker(ctx, size - cellSize * 7, 0, cellSize * 7);
    this.drawPositionMarker(ctx, 0, size - cellSize * 7, cellSize * 7);
    
    this.qrDataUrl = canvas.toDataURL(`image/${this.completeOptions.format}`, this.completeOptions.quality);
    
    // Actualizar canvas en el template
    setTimeout(() => {
      const canvasElement = document.querySelector('.qr-canvas') as HTMLCanvasElement;
      if (canvasElement) {
        const canvasCtx = canvasElement.getContext('2d')!;
        canvasCtx.drawImage(canvas, 0, 0);
      }
    });
  }

  /**
   * Dibujar marcador de posición del QR
   */
  private drawPositionMarker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Marco exterior
    ctx.fillRect(x, y, size, size);
    
    // Marco interior (blanco)
    ctx.fillStyle = this.completeOptions.colorLight;
    ctx.fillRect(x + size * 0.14, y + size * 0.14, size * 0.72, size * 0.72);
    
    // Centro (negro)
    ctx.fillStyle = this.completeOptions.colorDark;
    ctx.fillRect(x + size * 0.28, y + size * 0.28, size * 0.44, size * 0.44);
  }

  /**
   * Regenerar código QR
   */
  regenerateQR(): void {
    this.generateQR();
  }

  /**
   * Descargar código QR
   */
  async downloadQR(): Promise<void> {
    if (!this.qrDataUrl) return;

    this.downloading = true;

    try {
      const link = document.createElement('a');
      link.download = `qr_${this.data.numeroExpediente}.${this.completeOptions.format}`;
      link.href = this.qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.qrDownloaded.emit();
      this.snackBar.open('Código QR descargado', 'Cerrar', { duration: 2000 });

    } catch (error) {
      console.error('Error descargando QR::', error);
      this.snackBar.open('Error al descargar QR', 'Cerrar', { duration: 3000 });
    } finally {
      this.downloading = false;
    }
  }

  /**
   * Imprimir código QR
   */
  async printQR(): Promise<void> {
    this.printing = true;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Código QR - ${this.data.numeroExpediente}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                }
                .qr-print { 
                  margin: 20px auto; 
                  display: block; 
                }
                .info { 
                  margin: 10px 0; 
                  font-size: 14px; 
                }
              </style>
            </head>
            <body>
              <h2>Código QR - Documento</h2>
              <div class="info"><strong>Expediente:</strong> ${this.data.numeroExpediente}</div>
              <div class="info"><strong>Generado:</strong> ${new Date().toLocaleString()}</div>
              <img src="${this.qrDataUrl}" class="qr-print" alt="Código QR">
              <div class="info">Escanee este código para consultar el estado del documento</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }

      this.qrPrinted.emit();
      this.snackBar.open('Código QR enviado a imprimir', 'Cerrar', { duration: 2000 });

    } catch (error) {
      console.error('Error imprimiendo QR::', error);
      this.snackBar.open('Error al imprimir QR', 'Cerrar', { duration: 3000 });
    } finally {
      this.printing = false;
    }
  }

  /**
   * Copiar QR al portapapeles
   */
  async copyToClipboard(): Promise<void> {
    this.copying = true;

    try {
      if (this.qrDataUrl) {
        // Convertir data URL a blob
        const response = await fetch(this.qrDataUrl);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);

        this.qrCopied.emit();
        this.snackBar.open('Código QR copiado al portapapeles', 'Cerrar', { duration: 2000 });
      }

    } catch (error) {
      console.error('Error copiando QR::', error);
      
      // Fallback: copiar URL
      try {
        const qrContent = this.buildQRContent();
        await navigator.clipboard.writeText(qrContent);
        this.snackBar.open('URL del documento copiada', 'Cerrar', { duration: 2000 });
      } catch {
        this.snackBar.open('Error al copiar QR', 'Cerrar', { duration: 3000 });
      }
    } finally {
      this.copying = false;
    }
  }

  /**
   * Compartir código QR
   */
  async shareQR(): Promise<void> {
    if (!this.canShare) return;

    this.sharing = true;

    try {
      const qrContent = this.buildQRContent();
      
      if (navigator.canShare && navigator.canShare({ url: qrContent })) {
        await navigator.share({
          title: `Documento ${this.data.numeroExpediente}`,
          text: `Consulta el estado del documento ${this.data.numeroExpediente}`,
          url: qrContent
        });

        this.qrShared.emit();
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error compartiendo QR::', error);
        this.snackBar.open('Error al compartir QR', 'Cerrar', { duration: 3000 });
      }
    } finally {
      this.sharing = false;
    }
  }
}