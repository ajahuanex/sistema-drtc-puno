import { Injectable, signal, computed, effect } from '@angular/core';

export interface IconFallback {
  name: string;
  unicode: string;
  fallback: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class IconService {
  // Signal para el estado de carga de Material Icons
  private readonly _materialIconsLoaded = signal(false);
  readonly materialIconsLoaded = this._materialIconsLoaded.asReadonly();

  // Mapeo de iconos comunes con fallbacks
  private readonly iconFallbacks: Map<string, IconFallback> = new Map([
    ['home', { name: 'home', unicode: 'e88a', fallback: '🏠', description: 'Inicio' }],
    ['add', { name: 'add', unicode: 'e145', fallback: '➕', description: 'Agregar' }],
    ['edit', { name: 'edit', unicode: 'e3c9', fallback: '✏️', description: 'Editar' }],
    ['delete', { name: 'delete', unicode: 'e872', fallback: '🗑️', description: 'Eliminar' }],
    ['search', { name: 'search', unicode: 'e8b6', fallback: '🔍', description: 'Buscar' }],
    ['close', { name: 'close', unicode: 'e5cd', fallback: '❌', description: 'Cerrar' }],
    ['check', { name: 'check', unicode: 'e5ca', fallback: '✅', description: 'Verificar' }],
    ['warning', { name: 'warning', unicode: 'e002', fallback: '⚠️', description: 'Advertencia' }],
    ['error', { name: 'error', unicode: 'e000', fallback: '❌', description: 'Error' }],
    ['info', { name: 'info', unicode: 'e88e', fallback: 'ℹ️', description: 'Información' }],
    ['help', { name: 'help', unicode: 'e887', fallback: '❓', description: 'Ayuda' }],
    ['settings', { name: 'settings', unicode: 'e8b8', fallback: '⚙️', description: 'Configuración' }],
    ['person', { name: 'person', unicode: 'e7fd', fallback: '👤', description: 'Usuario' }],
    ['business', { name: 'business', unicode: 'e0af', fallback: '🏢', description: 'Empresa' }],
    ['directions_car', { name: 'directions_car', unicode: 'e531', fallback: '🚗', description: 'Vehículo' }],
    ['route', { name: 'route', unicode: 'e9ae', fallback: '🛣️', description: 'Ruta' }],
    ['description', { name: 'description', unicode: 'e873', fallback: '📄', description: 'Documento' }],
    ['folder', { name: 'folder', unicode: 'e2c7', fallback: '📁', description: 'Carpeta' }],
    ['file_download', { name: 'file_download', unicode: 'e2c4', fallback: '⬇️', description: 'Descargar' }],
    ['file_upload', { name: 'file_upload', unicode: 'e2c6', fallback: '⬆️', description: 'Subir' }],
    ['print', { name: 'print', unicode: 'e8ad', fallback: '🖨️', description: 'Imprimir' }],
    ['email', { name: 'email', unicode: 'e0be', fallback: '📧', description: 'Email' }],
    ['phone', { name: 'phone', unicode: 'e0cd', fallback: '📞', description: 'Teléfono' }],
    ['location_on', { name: 'location_on', unicode: 'e55f', fallback: '📍', description: 'Ubicación' }],
    ['schedule', { name: 'schedule', unicode: 'e8b5', fallback: '🕐', description: 'Horario' }],
    ['calendar_today', { name: 'calendar_today', unicode: 'e333', fallback: '📅', description: 'Calendario' }],
    ['notifications', { name: 'notifications', unicode: 'e7f4', fallback: '🔔', description: 'Notificaciones' }],
    ['account_circle', { name: 'account_circle', unicode: 'e7fb', fallback: '👤', description: 'Cuenta' }],
    ['logout', { name: 'logout', unicode: 'e9ba', fallback: '🚪', description: 'Salir' }],
    ['login', { name: 'login', unicode: 'e77e', fallback: '🔑', description: 'Entrar' }],
    ['refresh', { name: 'refresh', unicode: 'e5d5', fallback: '🔄', description: 'Actualizar' }],
    ['save', { name: 'save', unicode: 'e161', fallback: '💾', description: 'Guardar' }],
    ['cancel', { name: 'cancel', unicode: 'e5c9', fallback: '🚫', description: 'Cancelar' }],
    ['arrow_back', { name: 'arrow_back', unicode: 'e5c4', fallback: '⬅️', description: 'Atrás' }],
    ['arrow_forward', { name: 'arrow_forward', unicode: 'e5c8', fallback: '➡️', description: 'Adelante' }],
    ['expand_more', { name: 'expand_more', unicode: 'e5cf', fallback: '⬇️', description: 'Expandir' }],
    ['expand_less', { name: 'expand_less', unicode: 'e5ce', fallback: '⬆️', description: 'Contraer' }],
    ['menu', { name: 'menu', unicode: 'e5d2', fallback: '☰', description: 'Menú' }],
    ['more_vert', { name: 'more_vert', unicode: 'e5d4', fallback: '⋮', description: 'Más opciones' }],
    ['visibility', { name: 'visibility', unicode: 'e8f4', fallback: '👁️', description: 'Ver' }],
    ['visibility_off', { name: 'visibility_off', unicode: 'e8f5', fallback: '🙈', description: 'Ocultar' }],
    ['lock', { name: 'lock', unicode: 'e897', fallback: '🔒', description: 'Bloqueado' }],
    ['lock_open', { name: 'lock_open', unicode: 'e898', fallback: '🔓', description: 'Desbloqueado' }],
    ['star', { name: 'star', unicode: 'e838', fallback: '⭐', description: 'Favorito' }],
    ['favorite', { name: 'favorite', unicode: 'e87d', fallback: '❤️', description: 'Favorito' }],
    ['thumb_up', { name: 'thumb_up', unicode: 'e8dc', fallback: '👍', description: 'Me gusta' }],
    ['thumb_down', { name: 'thumb_down', unicode: 'e8db', fallback: '👎', description: 'No me gusta' }],
    ['share', { name: 'share', unicode: 'e80d', fallback: '📤', description: 'Compartir' }],
    ['download', { name: 'download', unicode: 'e2c4', fallback: '⬇️', description: 'Descargar' }],
    ['upload', { name: 'upload', unicode: 'e2c6', fallback: '⬆️', description: 'Subir' }],
    ['cloud_download', { name: 'cloud_download', unicode: 'e2bd', fallback: '☁️⬇️', description: 'Descargar de la nube' }],
    ['cloud_upload', { name: 'cloud_upload', unicode: 'e2c3', fallback: '☁️⬆️', description: 'Subir a la nube' }],
    ['sync', { name: 'sync', unicode: 'e627', fallback: '🔄', description: 'Sincronizar' }],
    ['wifi', { name: 'wifi', unicode: 'e63e', fallback: '📶', description: 'WiFi' }],
    ['signal_cellular_alt', { name: 'signal_cellular_alt', unicode: 'e202', fallback: '📱', description: 'Señal celular' }],
    ['battery_full', { name: 'battery_full', unicode: 'e1b3', fallback: '🔋', description: 'Batería llena' }],
    ['brightness_high', { name: 'brightness_high', unicode: 'e1ac', fallback: '☀️', description: 'Brillo alto' }],
    ['brightness_low', { name: 'brightness_low', unicode: 'e1ad', fallback: '🌙', description: 'Brillo bajo' }],
    ['volume_up', { name: 'volume_up', unicode: 'e050', fallback: '🔊', description: 'Volumen alto' }],
    ['volume_off', { name: 'volume_off', unicode: 'e04f', fallback: '🔇', description: 'Sin volumen' }],
    ['play_arrow', { name: 'play_arrow', unicode: 'e037', fallback: '▶️', description: 'Reproducir' }],
    ['pause', { name: 'pause', unicode: 'e034', fallback: '⏸️', description: 'Pausar' }],
    ['stop', { name: 'stop', unicode: 'e047', fallback: '⏹️', description: 'Detener' }],
    ['skip_next', { name: 'skip_next', unicode: 'e044', fallback: '⏭️', description: 'Siguiente' }],
    ['skip_previous', { name: 'skip_previous', unicode: 'e045', fallback: '⏮️', description: 'Anterior' }],
    ['fast_forward', { name: 'fast_forward', unicode: 'e01f', fallback: '⏩', description: 'Avance rápido' }],
    ['fast_rewind', { name: 'fast_rewind', unicode: 'e020', fallback: '⏪', description: 'Retroceso rápido' }],
    ['fullscreen', { name: 'fullscreen', unicode: 'e5d0', fallback: '⛶', description: 'Pantalla completa' }],
    ['fullscreen_exit', { name: 'fullscreen_exit', unicode: 'e5d1', fallback: '⛶', description: 'Salir pantalla completa' }],
    ['zoom_in', { name: 'zoom_in', unicode: 'e8ff', fallback: '🔍➕', description: 'Acercar' }],
    ['zoom_out', { name: 'zoom_out', unicode: 'e900', fallback: '🔍➖', description: 'Alejar' }],
    ['filter_list', { name: 'filter_list', unicode: 'e152', fallback: '🔍', description: 'Filtrar' }],
    ['sort', { name: 'sort', unicode: 'e164', fallback: '↕️', description: 'Ordenar' }],
    ['view_list', { name: 'view_list', unicode: 'e8ef', fallback: '📋', description: 'Vista de lista' }],
    ['view_module', { name: 'view_module', unicode: 'e8f0', fallback: '🔲', description: 'Vista de módulos' }],
    ['view_grid', { name: 'view_grid', unicode: 'e8f1', fallback: '🔲', description: 'Vista de cuadrícula' }],
    ['dashboard', { name: 'dashboard', unicode: 'e871', fallback: '📊', description: 'Dashboard' }],
    ['analytics', { name: 'analytics', unicode: 'e9f1', fallback: '📈', description: 'Analíticas' }],
    ['trending_up', { name: 'trending_up', unicode: 'e8e5', fallback: '📈', description: 'Tendencia al alza' }],
    ['trending_down', { name: 'trending_down', unicode: 'e8e4', fallback: '📉', description: 'Tendencia a la baja' }],
    ['pie_chart', { name: 'pie_chart', unicode: 'e6c4', fallback: '🥧', description: 'Gráfico circular' }],
    ['bar_chart', { name: 'bar_chart', unicode: 'e26b', fallback: '📊', description: 'Gráfico de barras' }],
    ['line_chart', { name: 'line_chart', unicode: 'e922', fallback: '📈', description: 'Gráfico de líneas' }],
    ['table_chart', { name: 'table_chart', unicode: 'e9d6', fallback: '📊', description: 'Gráfico de tabla' }]
  ]);

  constructor() {
    // Verificar si Material Icons están cargados
    this.checkMaterialIcons();
    
    // Effect para detectar cambios en el estado de carga
    effect(() => {
      if (this._materialIconsLoaded()) {
        console.log('✅ Material Icons cargados correctamente');
      } else {
        console.warn('⚠️ Material Icons no disponibles, usando fallbacks');
      }
    });
  }

  /**
   * Verificar si Material Icons están cargados
   */
  private checkMaterialIcons(): void {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performIconCheck();
      });
    } else {
      this.performIconCheck();
    }
  }

  /**
   * Realizar verificación de iconos
   */
  private performIconCheck(): void {
    // Crear un icono de prueba
    const testIcon = document.createElement('span');
    testIcon.className = 'material-icons';
    testIcon.textContent = 'home';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    testIcon.style.visibility = 'hidden';
    
    document.body.appendChild(testIcon);
    
    // Verificar el ancho del icono
    const iconWidth = testIcon.offsetWidth;
    document.body.removeChild(testIcon);
    
    // Si el ancho es muy pequeño, los iconos no se cargaron
    this._materialIconsLoaded.set(iconWidth > 10);
    
    // Si no se cargaron, agregar clase CSS para fallbacks
    if (!this._materialIconsLoaded()) {
      document.body.classList.add('material-icons-fallback');
    }
  }

  /**
   * Obtener el icono apropiado (Material Icons o fallback)
   */
  getIcon(iconName: string): string {
    if (this._materialIconsLoaded()) {
      // Usar Material Icons si están disponibles
      return iconName;
    } else {
      // Usar fallback si Material Icons no están disponibles
      const fallback = this.iconFallbacks.get(iconName);
      return fallback ? fallback.fallback : '•';
    }
  }

  /**
   * Obtener el texto del icono para usar en el DOM
   */
  getIconText(iconName: string): string {
    if (this._materialIconsLoaded()) {
      // Para Material Icons, usar el nombre del icono
      return iconName;
    } else {
      // Para fallbacks, usar el emoji directamente
      const fallback = this.iconFallbacks.get(iconName);
      return fallback ? fallback.fallback : '•';
    }
  }

  /**
   * Obtener información completa del icono
   */
  getIconInfo(iconName: string): IconFallback | null {
    return this.iconFallbacks.get(iconName) || null;
  }

  /**
   * Verificar si un icono específico tiene fallback
   */
  hasFallback(iconName: string): boolean {
    return this.iconFallbacks.has(iconName);
  }

  /**
   * Obtener todos los fallbacks disponibles
   */
  getAllFallbacks(): IconFallback[] {
    return Array.from(this.iconFallbacks.values());
  }

  /**
   * Agregar un nuevo fallback personalizado
   */
  addFallback(iconName: string, fallback: IconFallback): void {
    this.iconFallbacks.set(iconName, fallback);
  }

  /**
   * Remover un fallback
   */
  removeFallback(iconName: string): boolean {
    return this.iconFallbacks.delete(iconName);
  }

  /**
   * Forzar recarga de Material Icons
   */
  forceReload(): void {
    this._materialIconsLoaded.set(false);
    setTimeout(() => {
      this.checkMaterialIcons();
    }, 100);
  }

  /**
   * Obtener el estado actual de carga de iconos
   */
  getIconStatus(): { loaded: boolean; fallbackMode: boolean; totalFallbacks: number } {
    return {
      loaded: this._materialIconsLoaded(),
      fallbackMode: !this._materialIconsLoaded(),
      totalFallbacks: this.iconFallbacks.size
    };
  }
} 