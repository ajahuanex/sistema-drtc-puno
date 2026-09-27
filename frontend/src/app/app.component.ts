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
        <!-- Estado de hidratación Ultra-Moderno SIRRETT -->
        <div class="hydration-container">
          <div class="loading-ambient-glow"></div>
          <div class="hydration-content">
            <div class="loading-gov-badge">GOBIERNO REGIONAL PUNO • DRTC</div>
            
            <div class="loading-orbit">
              <div class="loading-orbit-ring"></div>
              <div class="loading-orbit-ring-secondary"></div>
              <div class="loading-emblem-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="15" rx="3"></rect>
                  <path d="M3 9h18"></path>
                  <circle cx="7.5" cy="14.5" r="1.5" fill="#60a5fa"></circle>
                  <circle cx="16.5" cy="14.5" r="1.5" fill="#60a5fa"></circle>
                  <path d="M5 18v2"></path>
                  <path d="M19 18v2"></path>
                </svg>
              </div>
            </div>

            <h1 class="loading-title">SIRRETT</h1>
            <p class="loading-subtitle">Sistema Regional de Registros de Transporte Terrestre</p>
            
            <div class="loading-progress-container">
              <div class="progress-meta">
                <span class="status-indicator">
                  <span class="pulse-dot"></span>
                  <span>Optimizando componentes e interfaz...</span>
                </span>
                <span class="loading-percentage">{{ hydrationProgress().toFixed(0) }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="hydrationProgress()"></div>
              </div>
            </div>

            <div class="loading-footer-tags">
              <span>D.S. 017-2009-MTC</span>
              <span class="sep">•</span>
              <span>Expediente Digital 360°</span>
              <span class="sep">•</span>
              <span>v2.4 Oficial</span>
            </div>
          </div>
        </div>
      }
    } @else {
      <!-- Estado de inicialización Ultra-Moderno SIRRETT -->
      <div class="init-container">
        <div class="loading-ambient-glow"></div>
        <div class="init-content">
          <div class="loading-gov-badge">GOBIERNO REGIONAL PUNO • DRTC</div>
          
          <div class="loading-orbit">
            <div class="loading-orbit-ring"></div>
            <div class="loading-orbit-ring-secondary"></div>
            <div class="loading-emblem-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="15" rx="3"></rect>
                <path d="M3 9h18"></path>
                <circle cx="7.5" cy="14.5" r="1.5" fill="#60a5fa"></circle>
                <circle cx="16.5" cy="14.5" r="1.5" fill="#60a5fa"></circle>
                <path d="M5 18v2"></path>
                <path d="M19 18v2"></path>
              </svg>
            </div>
          </div>

          <h1 class="loading-title">SIRRETT</h1>
          <p class="loading-subtitle">Inicializando Base de Datos y Servicios</p>
          
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
      background-color: var(--bg-app, #f8fafc);
    }

    .hydration-container,
    .init-container {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 28%, #172554 0%, #0a1122 45%, #050811 100%);
      color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 99999;
      overflow: hidden;
    }

    .loading-ambient-glow {
      position: absolute;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
      pointer-events: none;
      filter: blur(60px);
      animation: pulseGlow 4s ease-in-out infinite alternate;
    }

    @keyframes pulseGlow {
      0% { transform: scale(0.9) translate(-20px, -10px); opacity: 0.6; }
      100% { transform: scale(1.15) translate(20px, 15px); opacity: 0.95; }
    }

    .hydration-content,
    .init-content {
      position: relative;
      background: rgba(13, 27, 56, 0.78);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(59, 130, 246, 0.28);
      border-radius: 24px;
      padding: 42px 46px;
      max-width: 480px;
      width: 88%;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 50px rgba(37, 99, 235, 0.2);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
    }

    .loading-orbit {
      position: relative;
      width: 84px;
      height: 84px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-orbit-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #38bdf8;
      border-right-color: #2563eb;
      animation: orbitRotate 1.3s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.45);
    }

    .loading-orbit-ring-secondary {
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      border: 2px dashed rgba(96, 165, 250, 0.35);
      animation: orbitRotateRev 3.5s linear infinite;
    }

    .loading-emblem-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a 0%, #0b172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(147, 197, 253, 0.4);
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.5);
      z-index: 2;
    }

    @keyframes orbitRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes orbitRotateRev {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }

    .loading-gov-badge {
      display: inline-flex;
      align-items: center;
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.35);
      color: #93c5fd;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .loading-title {
      margin: 0;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: linear-gradient(135deg, #ffffff 0%, #93c5fd 60%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 20px rgba(56, 189, 248, 0.3);
      line-height: 1.15;
    }

    .loading-subtitle {
      margin: 6px 0 24px 0;
      font-size: 13px;
      color: #94a3b8;
      font-weight: 400;
      letter-spacing: 0.02em;
      line-height: 1.4;
    }

    .loading-progress-container {
      width: 100%;
      margin-bottom: 20px;
    }

    .progress-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 12.5px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #cbd5e1;
      font-weight: 500;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulseDot 1.4s ease-in-out infinite alternate;
      flex-shrink: 0;
    }

    .loading-percentage {
      font-family: 'Space Grotesk', monospace, sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #38bdf8;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
      min-width: 48px;
      text-align: right;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #10b981 100%);
      border-radius: 9999px;
      box-shadow: 0 0 14px rgba(6, 182, 212, 0.7);
      transition: width 0.15s ease-out;
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
      animation: shimmerSweep 1.6s infinite;
    }

    @keyframes shimmerSweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .loading-footer-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }

    .loading-footer-tags .sep {
      color: #334155;
    }

    .init-steps {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;
      width: 100%;
    }

    .init-step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 16px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 10px;
      transition: all 0.3s ease;
      text-align: left;
    }

    .init-step.completed {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.45);
    }

    .step-icon {
      font-size: 15px;
      font-weight: bold;
      color: #38bdf8;
    }

    .init-step.completed .step-icon {
      color: #10b981;
    }

    .step-text {
      font-size: 12.5px;
      font-weight: 500;
      color: #cbd5e1;
    }

    .init-step.completed .step-text {
      color: #f1f5f9;
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
  private readonly _showPerformanceIndicator = signal(false);

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

  private startTime: number = Date.now();
  private hydrationSimulated = false;

  constructor() {
    console.log('🎯 [APP] 1. Constructor iniciado');
    
    // LIMPIAR CACHÉ CORRUPTO AL INICIAR
    console.log('🎯 [APP] 2. Limpiando caché corrupto...');
    this.clearCorruptedCache();
    console.log('🎯 [APP] 3. Caché limpiado');
    
    // Effect para simular progreso de hidratación (solo una vez)
    console.log('🎯 [APP] 4. Configurando effect de hidratación...');
    effect(() => {
      console.log('🎯 [APP-EFFECT] isInitialized:', this.isInitialized(), 'hydrationSimulated:', this.hydrationSimulated);
      if (this.isInitialized() && !this.hydrationSimulated) {
        console.log('🎯 [APP-EFFECT] Iniciando simulación de hidratación...');
        this.hydrationSimulated = true;
        this.simulateHydrationProgress();
      }
    });
    console.log('🎯 [APP] 5. Effect de hidratación configurado');

    // Effect para calcular tiempo de inicialización
    console.log('🎯 [APP] 6. Configurando effect de tiempo...');
    effect(() => {
      if (this.isInitialized()) {
        const start = this.startTime || Date.now();
        const time = Date.now() - start;
        console.log('🎯 [APP-EFFECT] Tiempo de inicialización:', time, 'ms');
        this._initTime.set(time);
      }
    });
    console.log('🎯 [APP] 7. Effect de tiempo configurado');
    console.log('🎯 [APP] 8. Constructor completado');
  }

  /**
   * Limpiar caché corrupto de GeoJSON
   */
  private clearCorruptedCache(): void {
    console.log('🧹 [CACHE-CLEAN] Iniciando limpieza de caché corrupto...');
    
    try {
      // 1. Limpiar localStorage de datos GeoJSON grandes
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('geojson') || 
          key.includes('centros-poblados') ||
          key.includes('localidades') ||
          key.includes('common_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ [CACHE-CLEAN] Removed: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`✅ [CACHE-CLEAN] Cleared ${keysToRemove.length} corrupted cache entries`);
      } else {
        console.log('✅ [CACHE-CLEAN] No corrupted cache found');
      }
      
      // 2. Limpiar sessionStorage también
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('geojson') || 
          key.includes('centros-poblados') ||
          key.includes('localidades')
        )) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ [CACHE-CLEAN] Removed from session: ${key}`);
      });
      
      if (sessionKeysToRemove.length > 0) {
        console.log(`✅ [CACHE-CLEAN] Cleared ${sessionKeysToRemove.length} session cache entries`);
      }
      
      console.log('✅ [CACHE-CLEAN] Limpieza completada');
      
    } catch (error) {
      console.error('❌ [CACHE-CLEAN] Error clearing corrupted cache:', error);
    }
  }

  ngOnInit(): void {
    console.log('🎯 [APP] 9. ngOnInit iniciado');
    // Inicialización del componente
    console.log('🎯 [APP] 10. ngOnInit completado');
  }

  private hydrationCompleted = false;

  ngAfterViewInit(): void {
    console.log('🎯 [APP] 11. ngAfterViewInit iniciado');
    // Marcar hidratación como completa después de que la vista se renderice (solo una vez)
    if (!this.hydrationCompleted) {
      console.log('🎯 [APP] 12. Marcando hidratación como completa...');
      this.hydrationCompleted = true;
      setTimeout(() => {
        console.log('🎯 [APP] 13. Llamando markHydrationComplete...');
        this.eagerInitService.markHydrationComplete();
        console.log('🎯 [APP] 14. markHydrationComplete completado');
      }, 1000);
    }
    console.log('🎯 [APP] 15. ngAfterViewInit completado');
  }

  /**
   * Simular progreso de hidratación
   */
  private simulateHydrationProgress(): void {
    console.log('🎯 [APP] Iniciando simulación de progreso...');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Incremento aleatorio entre 5-20%
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        console.log('🎯 [APP] Simulación de progreso completada');
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