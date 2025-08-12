import { Component, inject, signal, computed, effect, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EagerInitService } from './services/eager-init.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    @if (isInitialized()) {
      @if (isHydrated()) {
        <!-- Aplicación completamente hidratada -->
        <div class="app-container">
          <router-outlet></router-outlet>
        </div>
      } @else {
        <!-- Estado de hidratación -->
        <div class="hydration-container">
          <div class="hydration-content">
            <div class="hydration-spinner"></div>
            <h2>HIDRATANDO APLICACIÓN</h2>
            <p>Preparando componentes y optimizando rendimiento...</p>
            <div class="hydration-progress">
              <div class="progress-bar" [style.width.%]="hydrationProgress()"></div>
            </div>
          </div>
        </div>
      }
    } @else {
      <!-- Estado de inicialización -->
      <div class="init-container">
        <div class="init-content">
          <div class="init-spinner"></div>
          <h2>INICIALIZANDO APLICACIÓN</h2>
          <p>Cargando configuración y datos críticos...</p>
          <div class="init-steps">
            @for (step of initSteps(); track step.id) {
              <div class="init-step" [class.completed]="step.completed">
                <span class="step-icon">{{ step.completed ? '✓' : '○' }}</span>
                <span class="step-text">{{ step.text }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Indicador de rendimiento (solo en desarrollo) -->
    @if (showPerformanceIndicator()) {
      <div class="performance-indicator">
        <div class="perf-header">
          <span>🚀 RENDIMIENTO</span>
          <button class="perf-close" (click)="hidePerformanceIndicator()">×</button>
        </div>
        <div class="perf-content">
          <div class="perf-stat">
            <span class="perf-label">Cache Hit Rate:</span>
            <span class="perf-value">{{ (cacheHitRate() * 100).toFixed(1) }}%</span>
          </div>
          <div class="perf-stat">
            <span class="perf-label">Cache Size:</span>
            <span class="perf-value">{{ cacheStats().size }}</span>
          </div>
          <div class="perf-stat">
            <span class="perf-label">Tiempo Inicialización:</span>
            <span class="perf-value">{{ initTime() }}ms</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .hydration-container,
    .init-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .hydration-content,
    .init-content {
      text-align: center;
      max-width: 500px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .hydration-spinner,
    .init-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    p {
      margin: 0 0 24px 0;
      font-size: 16px;
      opacity: 0.9;
      line-height: 1.5;
    }

    .hydration-progress {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22c55e);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .init-steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
    }

    .init-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .init-step.completed {
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.5);
    }

    .step-icon {
      font-size: 18px;
      font-weight: bold;
      color: #4ade80;
    }

    .step-text {
      font-size: 14px;
      opacity: 0.9;
    }

    /* Indicador de rendimiento */
    .performance-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 10000;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
    }

    .perf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 600;
    }

    .perf-close {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .perf-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .perf-content {
      padding: 16px;
    }

    .perf-stat {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .perf-stat:last-child {
      margin-bottom: 0;
    }

    .perf-label {
      opacity: 0.8;
    }

    .perf-value {
      font-weight: 600;
      color: #4ade80;
    }

    @media (max-width: 768px) {
      .hydration-content,
      .init-content {
        margin: 20px;
        padding: 30px 20px;
      }

      .performance-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        left: 10px;
        width: auto;
      }
    }
  `]
})
export class AppComponent implements OnInit, AfterViewInit {
  private eagerInitService = inject(EagerInitService);

  // Signals para el estado de la aplicación
  readonly isInitialized = this.eagerInitService.isInitialized;
  readonly isHydrated = this.eagerInitService.isHydrated;
  readonly cacheStats = this.eagerInitService.cacheStats;

  // Signals locales
  private readonly _hydrationProgress = signal(0);
  private readonly _initTime = signal(0);
  private readonly _showPerformanceIndicator = signal(true);

  // Computed properties
  readonly hydrationProgress = this._hydrationProgress.asReadonly();
  readonly initTime = this._initTime.asReadonly();
  readonly showPerformanceIndicator = this._showPerformanceIndicator.asReadonly();
  readonly cacheHitRate = computed(() => {
    const stats = this.cacheStats();
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  });

  // Pasos de inicialización
  readonly initSteps = computed(() => [
    { id: 1, text: 'CARGANDO CONFIGURACIÓN CRÍTICA', completed: !!this.eagerInitService.criticalData() },
    { id: 2, text: 'PRE-CARGANDO DATOS ESENCIALES', completed: this.isInitialized() },
    { id: 3, text: 'INICIALIZANDO SISTEMA DE CACHE', completed: this.isInitialized() },
    { id: 4, text: 'PREPARANDO COMPONENTES UI', completed: this.isHydrated() }
  ]);

  private startTime = Date.now();

  constructor() {
    // Effect para simular progreso de hidratación
    effect(() => {
      if (this.isInitialized()) {
        this.simulateHydrationProgress();
      }
    });

    // Effect para calcular tiempo de inicialización
    effect(() => {
      if (this.isInitialized()) {
        this._initTime.set(Date.now() - this.startTime);
      }
    });
  }

  ngOnInit(): void {
    // Inicialización del componente
    console.log('🎯 AppComponent inicializado');
  }

  ngAfterViewInit(): void {
    // Marcar hidratación como completa después de que la vista se renderice
    setTimeout(() => {
      this.eagerInitService.markHydrationComplete();
    }, 1000);
  }

  /**
   * Simular progreso de hidratación
   */
  private simulateHydrationProgress(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Incremento aleatorio entre 5-20%
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      this._hydrationProgress.set(Math.min(progress, 100));
    }, 200);
  }

  /**
   * Ocultar indicador de rendimiento
   */
  hidePerformanceIndicator(): void {
    this._showPerformanceIndicator.set(false);
  }
} 